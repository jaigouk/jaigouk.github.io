---
title: "Picking a Local LLM for Hermes Agent with gpumod"
description: "How I benchmarked Qwen3.6, Gemma 4, and multiple quantizations on an RTX 4090 to find the best local model for Hermes Agent — and how gpumod made the whole process manageable."
date: 2026-04-24
tags:
  - AI
  - self-hosting
  - tools
author: Jaigouk Kim
draft: false
---

Running an AI agent locally means picking the right model for your hardware. I run [Hermes Agent](https://github.com/NousResearch/hermes-agent) on an RTX 4090 (24 GB VRAM) alongside an embedding model for RAG. That shared VRAM budget turns model selection into a constraint satisfaction problem: quality, speed, and memory all compete.

I built [gpumod](https://github.com/jaigouk/gpumod) to manage this. It tracks VRAM allocations, switches between service configurations, and simulates resource requirements before deployment. Here's how I used it to pick the right model.

## The Candidates

I started with three architectures:

| Model | Architecture | Quant | VRAM |
|-------|-------------|-------|------|
| Qwen3.6-27B | Dense (27B active) | Q4_K_M | ~18 GB |
| Qwen3.6-35B-A3B | MoE (3B active) | UD-Q4_K_S | ~22 GB |
| Gemma 4 E4B | Dense (~4B) | BF16 | ~16 GB |

The MoE architecture is interesting here. Qwen3.6-35B-A3B has 35 billion parameters total but only activates 3 billion per token. That means the knowledge capacity of a much larger model with the inference speed of a small one.

## Benchmarking

Each model ran through 15 iterations of a 5-level coding benchmark: basic queue implementation, retry logic, priority scheduling, concurrency bug fixing, and multi-file refactoring. Real pytest tests validated every response.

```
gpumod start qwen36-35b-a3b-q4
python scripts/run_qwen36_benchmark.py --model qwen36-35b-a3b
```

Results:

| Model | Quant | Mean Score | Std Dev | TPS |
|-------|-------|-----------|---------|-----|
| Qwen3.6-35B-A3B | Q4_K_S | **90.0** | **0.0** | **173.7** |
| Gemma 4 E4B | BF16 | 88.3 | 6.5 | 82.9 |
| Qwen3.6-27B | Q4_K_M | 80.3 | 6.9 | 46.9 |

The 35B-A3B MoE scored 90/100 on every single iteration — zero variance. It was also 2x faster than Gemma 4 and 3.7x faster than the 27B dense model. MoE wins on every metric.

## The VRAM Problem

The Q4_K_S quant uses ~22 GB. My embedding model (Qwen3-Embedding-0.6B) needs ~2.5 GB. Total: 24.5 GB on a 24 GB card. That's 64 MB of headroom — not enough once you account for CUDA context overhead, KV cache growth, and runtime allocations.

gpumod's simulate mode caught this before I tried it live:

```
gpumod simulate hermes-agent \
  --remove gemma4-e4b-bf16 \
  --add qwen36-35b-a3b-q4

# Result: fits=true, headroom=64 MB  ← technically fits, practically unusable
```

## IQ4_XS: The Smaller Quant

I ran the same benchmark on the IQ4_XS quantization, which saves about 1 GB of VRAM:

| Quant | Mean | Std Dev | TPS | VRAM |
|-------|------|---------|-----|------|
| Q4_K_S | 90.0 | 0.0 | 173.7 | ~22 GB |
| IQ4_XS | 87.3 | 10.3 | 174.5 | ~21 GB |

IQ4_XS had one outlier iteration (50/100 where the basic queue and concurrency bug-fix levels both failed), but 14 of 15 iterations scored 90. TPS was identical. With the embedding model, total VRAM lands at ~23.5 GB — workable headroom.

The means are within one standard deviation of each other compared to Gemma 4 (87.3 vs 88.3), so quality is comparable, but at 2x the speed.

## Setting Up Hermes Agent

With the model chosen, configuration was straightforward.

Hermes Agent's system prompt with ~120 MCP tools plus ~36 built-in tools consumes roughly 26K tokens for tool definitions alone. I initially ran at 65K context, but multi-tool tasks (web searches + doc reads) overflowed within a single turn. The fix was twofold: 128K context with Q8_0 KV cache quantization, and per-platform tool filtering for Telegram.

The hybrid DeltaNet architecture is key here — only 10 of 40 layers maintain a KV cache, so 128K context with Q8_0 uses the same VRAM as 65K with FP16. Just 58 MB more in practice:

```yaml
# systemd unit
ExecStart=llama-server \
    --model Qwen3.6-35B-A3B-UD-IQ4_XS.gguf \
    --port 7099 \
    --ctx-size 131072 \
    --n-gpu-layers -1 \
    --cache-type-k q8_0 \
    --cache-type-v q8_0 \
    --jinja
```

Hermes config points to the local endpoint:

```yaml
# ~/.hermes/config.yaml
model:
  default: Qwen3.6-35B-A3B-UD-IQ4_XS.gguf
  provider: custom
  base_url: http://localhost:7099/v1
  context_length: 131072
```

For Telegram, I also configured `platform_toolsets` to load only essential MCP servers (gpumod, outline, tavily), dropping from 157 to 87 tools. This brought first-turn token usage from 49.6% down to 20% of context:

gpumod manages the mode so both services start together:

```yaml
# gpumod modes/hermes-agent.yaml
id: hermes-agent
name: Hermes Agent Mode
services:
  - qwen36-35b-a3b-iq4xs
  - vllm-embedding-code
```

One command to switch: `gpumod switch hermes-agent`.

## What I Learned

**MoE architecture is the sweet spot for local inference.** 35B total parameters give you the knowledge base; 3B active parameters give you the speed. The Q4_K_S quant was perfect — zero variance — but didn't fit alongside other services. IQ4_XS is the practical choice when VRAM is shared.

**Benchmark before you commit.** Gemma 4 looked like the safe choice at 16 GB, but the MoE model beats it on quality and speed while only needing 5 GB more. Without benchmarking, I would have picked the wrong model.

**Tool count matters for context.** 157 tools in a system prompt consumed 49.6% of 65K context before the user said anything. The fix was two-pronged: double the context to 128K with Q8_0 KV cache (VRAM-neutral on the hybrid architecture), and filter tools per platform so Telegram only loads what it needs. Plan your context budget around your tool surface area, not conversation length.

The full benchmark results and methodology are on the [benchmark results page](https://jaigouk.com/gpumod/benchmarks/20260423_qwen36_gemma4_comparison/), with raw data and scripts in the [GitHub repository](https://github.com/jaigouk/gpumod/tree/main/docs/benchmarks/20260423_qwen36_gemma4_comparison).

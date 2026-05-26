---
title: "gpumod Mode Switches, Driver Hangs, and Landing on Qwen3.6 MTP for Hermes"
description: "How a series of silent freezes during gpumod mode switches led me through CUDA pinned-memory debugging, four layers of defense, and ultimately to Qwen3.6-35B-A3B MTP with preserve_thinking as the new Hermes-agent default."
date: 2026-05-27
tags:
  - AI
  - self-hosting
  - tools
author: Jaigouk Kim
draft: false
---

A month after [picking Qwen3.6-35B-A3B IQ4_XS for Hermes Agent](/posts/picking-a-local-llm-for-hermes-agent/), the model itself was fine. The *swapping* between modes was not. This post is about the freezes I hit, the layered defenses I ended up shipping in [gpumod](https://github.com/jaigouk/gpumod), and how all of it cleared the runway for moving Hermes to a Multi-Token Prediction (MTP) variant with `preserve_thinking`.

## The symptom: silent hard freezes

On a 30 GB / 24 GB Minisforum B550 (RTX 4090, ZFS root), `gpumod switch_mode` between heavy presets started locking the box. No kernel panic. No OOM log. No PSI spike. The display would freeze mid-frame, SSH stopped accepting bytes, and the only recovery was a power-cycle.

Over six weeks I logged five distinct trigger classes for the same underlying failure:

| Date       | Trigger                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| 2026-04-25 | ZFS ARC at 8 GB default + active llama-server + code-server + 35k ctx    |
| 2026-05-16 | ComfyUI Phase-2 + `uv pip install torch+cuda` + ZFS sanoid pruning      |
| 2026-05-19 | `vllm-embedding` crashlooped 1,154× overnight, fragmenting pages         |
| 2026-05-23 | Self-hosted gitea-runner running Trivy + Go module extraction            |
| 2026-05-25 | Controlled spike — 12 GiB MemAvailable + 17 GB MTP GGUF load             |

Every one of them traces back to the same kernel hot-spot.

## Root cause: cudaHostAlloc waiting on contiguous high-order pages

llama.cpp calls `ggml_cuda_host_malloc`, which wraps `cudaHostAlloc` to get page-locked memory for CPU↔GPU transfers. Pinned pages must be **physically contiguous, non-swappable**, and allocated from genuinely free RAM (not reclaimable cache).

When `MemAvailable` is high but contiguous high-order pages are fragmented — exactly the state you get after hours of crashloops, tar extraction, or ZFS scrubs — the allocation blocks **indefinitely**. The NVIDIA driver waits for pages that never become available. The kernel can't make progress. Every process that touches the GPU stack joins the freeze, including the display server.

There is no OOM signal to react to, because no one ever calls OOM. `systemd-oomd`'s PSI threshold is never reached. This is the fingerprint: an unexplained freeze without a kernel log line.

## Four layers of defense

After enough power-cycles I stopped trying to find "the" fix and started layering. Each layer reduces the probability of the next one having to do work.

### 1. Don't let it trigger (preflight gates)

gpumod already had a `RAMCheck` that refused `gpumod service start` when `MemAvailable < model × 1.1 + 1024 MB`. The problem was every freeze had a call path that bypassed it — `systemctl --user start` direct, `Restart=on-failure` loops, gitea-runner workflows, hermes cron firing a VRAM skill.

I closed that gap with a host-level preflight script in my private ops repo:

```bash
gpu-host-preflight.sh --for qwen36-35b-a3b-mtp-iq4xs-preserve
gpu-host-preflight.sh --for comfyui --json
# { "ok": false,
#   "reason": "MemAvailable 14823 MiB < required 20100 MiB",
#   "high_order_pages": {"order_4": 23, "order_5": 4, "order_6": 0} }
```

`order_6 = 0` is the canary for the freeze class — it's exactly the page sizes `cudaHostAlloc` needs. The script reads `/proc/buddyinfo`, `/proc/meminfo`, and `nvidia-smi`, exits non-zero with a structured reason, and runs in ~24 ms. Wired into `gpu-host-services.sh start`, hermes cron job prompts (with a `[SILENT]` short-circuit on failure to avoid noisy alerts), and gitea-runner workflows.

### 2. Reduce fragmentation pressure (kernel tuning)

Two sysctls:

```
vm.min_free_kbytes = 1048576   # keep 1 GiB free → more high-order pages
zfs_arc_max        = 2 GiB     # was 8 GiB default on a 30 GiB box
```

The ZFS ARC default was eating ~8 GB of RAM before any GPU service even started. Capping it bought back the headroom — and getting the cap to survive reboots cost me two incidents, because `update-initramfs -u` only rebuilds the *newest* installed kernel, not the running one. The fix was a systemd oneshot that writes `/sys/module/zfs/parameters/zfs_arc_max` early at boot and is immune to missed initramfs rebuilds across kernel upgrades.

### 3. Keep the operator alive (cgroup protection)

Even when the kernel is *recoverable* (15 GiB MemAvailable, swap reclaim works), it cheerfully evicts code-server's anonymous pages alongside everything else, freezing my SSH/IDE for ~55 seconds. A drop-in:

```ini
# /etc/systemd/system/code-server@.service.d/10-oom-protect.conf
[Service]
MemoryMin=1G
MemoryLow=2G
OOMScoreAdjust=-900
ManagedOOMMemoryPressure=avoid
```

With the drop-in, the same 15 GiB pressure test left code-server at **9 ms average / 24 ms peak** HTTP probe latency. Without it, frozen for the full window.

This layer does *not* save you from the 12 GiB driver-hang case. Nothing in userspace can — the kernel itself is stuck in uninterruptible I/O wait inside the NVIDIA allocator.

### 4. The escape hatch: `GGML_CUDA_NO_PINNED`

While reading llama.cpp source to verify an assumption I noticed this in `ggml-cuda.cu`:

```cpp
static void * ggml_cuda_host_malloc(size_t size) {
    if (getenv("GGML_CUDA_NO_PINNED") != nullptr) {
        return nullptr;
    }
    cudaError_t err = cudaMallocHost((void **) &ptr, size);
    ...
}
```

Setting `GGML_CUDA_NO_PINNED=1` returns `nullptr` immediately and falls back to ordinary `malloc`. No contiguous-page requirement, no driver hang. It is the only mitigation that **eliminates** the failure class rather than reducing its probability.

I benchmarked the trade-off (15 iterations, 128K context, q8_0 KV cache):

| Metric           | Pinned (baseline) | `NO_PINNED=1` | Delta    |
| ---------------- | ----------------: | ------------: | -------: |
| Mean score       |              88.3 |          86.7 |     -1.6 |
| 95% CI           |     [84.8, 91.9]  | [81.8, 91.5]  |  overlap |
| Mean TPS         |             216.5 |         215.9 |   -0.28% |
| Draft acceptance |             78.7% |         79.1% |   +0.4pp |

CIs overlap; TPS regression is 0.28%. For inference-only workloads (`-ngl -1`, model fully resident in VRAM) the only steady-state CPU↔GPU traffic is per-token I/O — pinning barely helps. I made it the unconditional default for all llama-server units via the gpumod systemd template. The whole `cudaHostAlloc` failure class is gone.

## The MTP detour

Around the same time, Unsloth released MTP (Multi-Token Prediction) variants of Qwen3.6 with a draft head baked into the GGUF. Speculative decoding without a separate draft model. Vendor claim: 1.4–2.2× faster, no accuracy loss. llama.cpp `b9297` added the runtime support.

I ran 15-iteration coding benchmarks against the non-MTP baseline on both candidates.

### First pass: 32K context, f16 KV cache

| Model                                 | Mean | σ    | TPS   |
| ------------------------------------- | ---- | ---- | ----- |
| 35B-A3B-MTP IQ4_XS, `enable_thinking` | 88.3 |  6.5 | 222.3 |
| 35B-A3B-MTP IQ4_XS, `preserve_thinking` | **83.3** | **11.4** | 230.8 |
| 35B-A3B IQ4_XS (non-MTP baseline)     | 87.3 | 10.3 | 174.5 |

`preserve_thinking` dropped 5 points and doubled the variance. That looked like a real regression and I almost wrote the flag off. The chat-template proof said it shouldn't matter on a single-shot — `preserve_thinking` only affects how prior assistant `<think>` blocks are kept in *subsequent* turns. So why was the single-shot score collapsing?

### Second pass: 128K context, q8_0 KV cache

The Unsloth model card flags 32K as below their "minimum 128K for thinking capabilities" recommendation. The non-MTP baseline already ran at 131072 ctx thanks to q8_0 cache halving the KV memory. I tested whether q8_0 was compatible with the MTP draft head — it was.

Re-running both variants at 128K + q8_0:

| Model                                  | Mean    | σ       | TPS   | Draft acc |
| -------------------------------------- | ------: | ------: | ----: | --------: |
| 35B-A3B-MTP, `enable_thinking`         | **89.0**| **7.1** | 216.8 |     78.9% |
| 35B-A3B-MTP, `preserve_thinking`       | **88.3**| **6.5** | 216.5 |     78.7% |
| 35B-A3B IQ4_XS (non-MTP baseline)      |    87.3 |    10.3 | 174.5 |         — |

Three observations:

1. **`enable` and `preserve` are now statistically indistinguishable** on single-shot — means 89.0 vs 88.3, σ 7.1 vs 6.5, TPS 216.8 vs 216.5, all inside run-to-run noise. The 32K preserve regression was a thinking-budget artifact (the model was running out of context for its own reasoning), not a flag difference.
2. **MTP gives +24% TPS** over the non-MTP twin (216.5 vs 174.5). The MoE's 3B-active routing was already fast — the draft head still wins ~24% on top.
3. **Variance dropped 37%** (σ 10.3 → 6.5). More predictable for agent workloads, where one bad iteration becomes a wrong tool call.

For dense Qwen3.6-27B-MTP the speedup is closer to vendor claim — **1.82×** vs its non-MTP twin (85.4 vs 46.9 TPS). The MoE gains less because there is less wall-clock left to win.

The L4 (concurrency bug fix) pass rate hit **100%** on the MoE-MTP variant, and L5 (multi-file refactor) cracked once at 1/15 — the first non-zero L5 in this suite. With 128K of context the model finally has room to hold a full multi-file task in its thinking budget.

### Why `preserve_thinking` for Hermes-agent

If the two flags are equivalent on single-shot, the choice comes from multi-turn behavior. Hermes-agent is multi-turn (chat + MCP tool calls):

- `enable_thinking: true` drops prior `<think>` blocks from history every turn — the model re-derives its reasoning chain from scratch.
- `preserve_thinking: true` keeps them — reasoning consistency carries across tool-calling turns.

128K context with q8_0 KV cache is what makes this viable. At 32K, preserved-thinking saturates after 2–3 turns and you get the artifact I saw in the first pass. At 128K, you have ~4× the thinking budget; multi-turn agent loops survive comfortably.

## The new mode

`modes/hermes-agent.yaml` in gpumod swapped from `qwen36-35b-a3b-iq4xs` to `qwen36-35b-a3b-mtp-iq4xs-preserve`. The unit flags that matter:

```
-fa on
--ctx-size 131072
--cache-type-k q8_0
--cache-type-v q8_0
--spec-type draft-mtp
--spec-draft-n-max 2
--chat-template-kwargs '{"preserve_thinking":true}'
--parallel 1
```

`--parallel 1` is required — MTP doesn't support `-np>1` yet. VRAM lands at ~23.0 GiB on a 24 GB card (≈94% — q8_0 KV cache is doing real work here). TPS is up from 174.5 → 216.5. One `gpumod switch_mode hermes-agent` brings up the new llama-server unit + the vLLM embedding sidecar together, with the preflight refusing the start if MemAvailable is below the floor.

## What I'd take away

A few things that didn't fit anywhere else:

- **`compact_memory` is a footgun on NVIDIA hosts.** Writing `1` to `/proc/sys/vm/compact_memory` on Linux 6.8.0-111 + NVIDIA proprietary driver triggers a kernel BUG at `mm/migrate.c:674` — the upstream page-migration code's `BUG_ON` does not tolerate the states UVM's pinned-page tracking leaves folios in. `drop_caches` alone is safe; compaction is not.
- **A crashlooping service is a freeze trigger over any idle window of hours.** The 1,154-restart `vllm-embedding` incident happened with no active user load. Each restart fragmented pages a little more. The next pinned allocation hung the box. `Restart=on-failure` without a backoff cap is a latent freeze in waiting.
- **`update-initramfs -u` only rebuilds the newest installed kernel.** Use `-k all` (or `-k $(uname -r)`) if you actually want the config you just dropped in `modprobe.d` to apply on the kernel you are running. Two freezes traced to this.
- **Re-run a benchmark when you change a knob upstream of it.** The 32K preserve regression looked like a bad flag. It was a bad context budget. The vendor's "minimum 128K for thinking capabilities" line was load-bearing and I had skipped it.

## Bottom line

Before/after for the Hermes-agent preset, single number per axis:

| Axis             | Before (non-MTP IQ4_XS) | After (MTP IQ4_XS preserve) | Delta             |
| ---------------- | ----------------------: | --------------------------: | ----------------- |
| Mean score (/100)|                    87.3 |                        88.3 | +1.0 (within CI)  |
| Std dev          |                    10.3 |                         6.5 | **−37%**          |
| Mean TPS         |                   174.5 |                       216.5 | **+24%**          |
| Context size     |                  32,768 |                     131,072 | **+4×**           |
| L4 pass rate     |                     93% |                        100% | +7 pp             |
| L5 pass rate     |                      0% |                          7% | first non-zero    |
| VRAM at peak     |              ~22.1 GiB  |                  ~23.0 GiB  | +0.9 GiB          |
| Freeze class     |   `cudaHostAlloc` hang  |    eliminated (NO_PINNED)   | gone              |

Throughput across all five benchmarked variants (15 iterations each, q8_0 KV cache @ 128K context for the MTP rows):

<figure>
<svg viewBox="0 0 720 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tokens per second by model" style="max-width:100%;height:auto;font-family:ui-sans-serif,system-ui,sans-serif">
  <title>Tokens per second by model</title>
  <style>
    .lbl { font-size: 12px; fill: currentColor; }
    .val { font-size: 12px; fill: currentColor; font-variant-numeric: tabular-nums; }
    .axis { stroke: currentColor; stroke-opacity: 0.25; stroke-width: 1; }
    .tick { font-size: 10px; fill: currentColor; fill-opacity: 0.55; }
    .bar { fill: #0ea5e9; }
    .bar-baseline { fill: #94a3b8; }
  </style>
  <g transform="translate(290, 18)">
    <line class="axis" x1="0" y1="0" x2="0" y2="180"/>
    <line class="axis" x1="82" y1="0" x2="82" y2="180"/>
    <line class="axis" x1="164" y1="0" x2="164" y2="180"/>
    <line class="axis" x1="245" y1="0" x2="245" y2="180"/>
    <line class="axis" x1="327" y1="0" x2="327" y2="180"/>
    <text class="tick" x="0"   y="195" text-anchor="middle">0</text>
    <text class="tick" x="82"  y="195" text-anchor="middle">50</text>
    <text class="tick" x="164" y="195" text-anchor="middle">100</text>
    <text class="tick" x="245" y="195" text-anchor="middle">150</text>
    <text class="tick" x="327" y="195" text-anchor="middle">200</text>
    <text class="tick" x="164" y="215" text-anchor="middle">tokens / second</text>
  </g>
  <g transform="translate(0, 18)">
    <text class="lbl" x="280" y="18"  text-anchor="end">Qwen3.6-27B (non-MTP)</text>
    <rect class="bar-baseline" x="290" y="6"   width="77"  height="18" rx="2"/>
    <text class="val" x="372" y="20">46.9</text>
    <text class="lbl" x="280" y="50"  text-anchor="end">Qwen3.6-27B-MTP</text>
    <rect class="bar" x="290" y="38"  width="140" height="18" rx="2"/>
    <text class="val" x="436" y="52">85.4</text>
    <text class="lbl" x="280" y="82"  text-anchor="end">Qwen3.6-35B-A3B (non-MTP)</text>
    <rect class="bar-baseline" x="290" y="70"  width="285" height="18" rx="2"/>
    <text class="val" x="580" y="84">174.5</text>
    <text class="lbl" x="280" y="114" text-anchor="end">Qwen3.6-35B-A3B-MTP preserve</text>
    <rect class="bar" x="290" y="102" width="354" height="18" rx="2"/>
    <text class="val" x="649" y="116">216.5</text>
    <text class="lbl" x="280" y="146" text-anchor="end">Qwen3.6-35B-A3B-MTP enable</text>
    <rect class="bar" x="290" y="134" width="355" height="18" rx="2"/>
    <text class="val" x="650" y="148">216.8</text>
  </g>
</svg>
<figcaption style="font-size:0.85em;opacity:0.7;text-align:center;margin-top:0.25em">Blue bars are MTP variants. Gray bars are non-MTP baselines.</figcaption>
</figure>

The MTP rows cluster tighter and higher on quality, too. Score (higher is better, left) and variance σ (lower is better, right):

<figure>
<svg viewBox="0 0 720 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Score and variance by model" style="max-width:100%;height:auto;font-family:ui-sans-serif,system-ui,sans-serif">
  <title>Score and variance by model</title>
  <style>
    .lbl { font-size: 12px; fill: currentColor; }
    .val { font-size: 12px; fill: currentColor; font-variant-numeric: tabular-nums; }
    .hdr { font-size: 11px; fill: currentColor; fill-opacity: 0.55; }
    .axis { stroke: currentColor; stroke-opacity: 0.2; stroke-width: 1; }
    .score { fill: #0ea5e9; }
    .score-base { fill: #94a3b8; }
    .var { fill: #f97316; }
    .var-base { fill: #cbd5e1; }
  </style>
  <text class="hdr" x="265" y="14">Mean score (out of 100, higher is better)</text>
  <text class="hdr" x="540" y="14">σ (lower is better)</text>
  <g transform="translate(0, 22)">
    <line class="axis" x1="265" y1="0" x2="265" y2="180"/>
    <line class="axis" x1="510" y1="0" x2="510" y2="180"/>
    <text class="lbl" x="255" y="18"  text-anchor="end">27B non-MTP</text>
    <rect class="score-base" x="265" y="6"   width="161" height="18" rx="2"/>
    <text class="val" x="432" y="20">80.3</text>
    <rect class="var-base"   x="510" y="6"   width="83"  height="18" rx="2"/>
    <text class="val" x="599" y="20">6.9</text>
    <text class="lbl" x="255" y="50"  text-anchor="end">27B MTP</text>
    <rect class="score"      x="265" y="38"  width="175" height="18" rx="2"/>
    <text class="val" x="446" y="52">87.3</text>
    <rect class="var"        x="510" y="38"  width="88"  height="18" rx="2"/>
    <text class="val" x="604" y="52">7.3</text>
    <text class="lbl" x="255" y="82"  text-anchor="end">35B-A3B non-MTP</text>
    <rect class="score-base" x="265" y="70"  width="175" height="18" rx="2"/>
    <text class="val" x="446" y="84">87.3</text>
    <rect class="var-base"   x="510" y="70"  width="124" height="18" rx="2"/>
    <text class="val" x="640" y="84">10.3</text>
    <text class="lbl" x="255" y="114" text-anchor="end">35B-A3B-MTP preserve</text>
    <rect class="score"      x="265" y="102" width="177" height="18" rx="2"/>
    <text class="val" x="448" y="116">88.3</text>
    <rect class="var"        x="510" y="102" width="78"  height="18" rx="2"/>
    <text class="val" x="594" y="116">6.5</text>
    <text class="lbl" x="255" y="146" text-anchor="end">35B-A3B-MTP enable</text>
    <rect class="score"      x="265" y="134" width="178" height="18" rx="2"/>
    <text class="val" x="449" y="148">89.0</text>
    <rect class="var"        x="510" y="134" width="85"  height="18" rx="2"/>
    <text class="val" x="601" y="148">7.1</text>
  </g>
</svg>
<figcaption style="font-size:0.85em;opacity:0.7;text-align:center;margin-top:0.25em">Blue/orange = MTP variants; gray = non-MTP baselines. Longer score bar = better; shorter σ bar = better.</figcaption>
</figure>

The two MTP rows for 35B-A3B sit at the top of the score column **and** the bottom of the variance column — that combination is the whole reason for the swap.

The benchmark methodology, raw JSON, and per-iteration artifacts live in the [gpumod repo](https://github.com/jaigouk/gpumod/tree/main/docs/benchmarks/20260524_qwen36_mtp_vs_a3b). The driver-hang research note that drove the `GGML_CUDA_NO_PINNED` decision is in [`docs/research/`](https://github.com/jaigouk/gpumod/tree/main/docs/research). Next on the list is verifying VRAM headroom under co-tenant load with `vllm-embedding-code` — the benchmark isolated the model under test, and production runs both side by side.

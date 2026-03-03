---
title: gpumod
description: GPU Service Manager for LLM workloads on Linux/NVIDIA systems.
date: 2026-02-07
categories:
  - AI
  - DevOps
repositoryUrl: https://github.com/jaigouk/gpumod
status: active
draft: false
---

GPU Service Manager that manages inference services (vLLM, llama.cpp, FastAPI, Docker) on NVIDIA GPUs. It tracks memory allocation, enables switching between named service configurations, simulates resource requirements before deployment, and provides an MCP interface for AI assistant integration.

- Service lifecycle management with multiple driver support
- Mode-based switching that bundles services within VRAM constraints
- Pre-deployment simulation with capacity suggestions
- Model metadata tracking from HuggingFace and GGUF sources
- MCP server for IDE integration with Claude, Cursor, and similar tools
- Interactive terminal dashboard and CLI

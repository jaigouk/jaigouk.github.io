---
title: altoiddd
description: Guided project bootstrapper enforcing DDD + TDD + SOLID before AI coding tools write code.
date: 2026-03-19
categories:
  - AI
  - DevOps
repositoryUrl: https://github.com/jaigouk/altoiddd
status: active
draft: false
---

A CLI tool (`alto`) that generates domain-driven design scaffolding and build plans for AI-assisted development.

AI coding tools ship prototypes fast, but without structure they become unmaintainable within weeks. altoiddd is the planning step that happens before coding starts.

It interviews you about your domain, draws bounded-context boundaries, generates an ordered build plan with tests already defined, and sets up guardrails. Then you hand the output to Cursor, Claude Code, or any AI coding tool and it builds within that architecture, not from scratch on a blank canvas.

- Interactive domain discovery via guided Q&A
- Bounded context mapping and aggregate design
- Ordered task generation with TDD test stubs
- Automated architecture checks (SOLID, dependency rules)
- Works with any AI coding tool as a pre-flight step
- Written in Go, ships as a single binary (`alto`)

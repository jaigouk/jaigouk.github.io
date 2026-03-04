---
title: "Launching Claude Team with tmux"
description: "A bash function to manage Claude Code teammate sessions with tmux across multiple projects."
date: 2026-03-04
tags:
  - tools
  - AI
author: Jaigouk Kim
draft: false
---

Claude Code supports a teammate mode where agents run in separate tmux sessions. I found this more stable than in-process teams, especially when juggling multiple projects. Each session gets its own name derived from the project folder, so switching between them is straightforward.

Here's the `claude-team` function I use. Drop it in your `.zshrc` or `.bashrc`.

```bash
function claude-team() {
  local cmd="${1:-}"

  # sanitize a string into a valid tmux session name
  _ct_sanitize() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9_-]/-/g' | sed 's/^-//;s/-$//' | cut -c1-50
  }

  case "$cmd" in
    now)
      # use current folder name as session name
      local raw_name="${PWD##*/}"
      local session="ct-$(_ct_sanitize "$raw_name")"
      if tmux has-session -t "$session" 2>/dev/null; then
        tmux attach-session -t "$session"
      else
        tmux new-session -s "$session" claude --dangerously-skip-permissions --teammate-mode tmux
      fi
      ;;
    new)
      # claude-team new <name>
      local name="${2:?usage: claude-team new <name>}"
      local session="ct-$(_ct_sanitize "$name")"
      if tmux has-session -t "$session" 2>/dev/null; then
        echo "Session '$session' already exists. Use: claude-team attach $name"
        return 1
      fi
      tmux new-session -s "$session" claude --dangerously-skip-permissions --teammate-mode tmux
      ;;
    attach|a)
      local name="${2:?usage: claude-team attach <name>}"
      local session="ct-$(_ct_sanitize "$name")"
      if tmux has-session -t "$session" 2>/dev/null; then
        tmux attach-session -t "$session"
      else
        echo "No session '$session'. Use: claude-team ls"
        return 1
      fi
      ;;
    ls|list)
      tmux ls 2>/dev/null | grep '^ct-' || echo "No claude-team sessions."
      ;;
    kill)
      local name="${2:?usage: claude-team kill <name>}"
      local session="ct-$(_ct_sanitize "$name")"
      if tmux has-session -t "$session" 2>/dev/null; then
        tmux kill-session -t "$session"
        echo "Killed session '$session'."
      else
        echo "No session '$session'."
        return 1
      fi
      ;;
    kill-all)
      local sessions=($(tmux ls 2>/dev/null | grep '^ct-' | cut -d: -f1))
      if [[ ${#sessions[@]} -eq 0 ]]; then
        echo "No claude-team sessions to kill."
        return 0
      fi
      for s in "${sessions[@]}"; do
        tmux kill-session -t "$s"
        echo "Killed '$s'."
      done
      ;;
    *)
      cat <<'EOF'
claude-team - Claude teammate mode via tmux
usage: claude-team <command> [args]
commands:
  now              start/attach session named after current folder
  new <name>       start a new named session
  attach <name>    attach to an existing session (alias: a)
  ls               list all claude-team sessions (alias: list)
  kill <name>      kill a named session
  kill-all         kill all claude-team sessions
EOF
      ;;
  esac
}
```

## Usage

```bash
# Start a session named after the current directory
cd ~/projects/my-app
claude-team now

# Start a named session
claude-team new backend-refactor

# List active sessions
claude-team ls

# Reattach to an existing session
claude-team attach backend-refactor

# Clean up
claude-team kill backend-refactor
claude-team kill-all
```

All sessions are prefixed with `ct-` so they stay separate from your regular tmux sessions. Session names are sanitized to lowercase alphanumerics, making them easy to type and tab-complete.

## Why tmux over in-process?

Running teammates as separate tmux sessions keeps each agent isolated. If one crashes or hangs, it doesn't take down the others. You can also detach and reattach freely, which is useful for long-running tasks.

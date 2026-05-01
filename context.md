## SDK vs Enforcement Layer

Your SDK is a **capture layer**, not the full enforcement system.

System flow:

```
Developer code
↓
SDK wrapper
↓
Backend / control plane
↓
Model APIs / tools / infra
```

---

## What belongs in the SDK

The SDK is responsible for **observability and context capture**.

It should handle:

- trace creation
- function call logging
- model call logging
- token / cost estimation
- task / session metadata
- latency measurement
- error capture
- developer-friendly annotations

Example usage:

```python
with agent_trace("research-user-profile"):
    result = client.chat.completions.create(...)

@agent_tool(name="search_docs")
def search_docs(query):
    ...
```

The goal of the SDK is to make it easy to answer:

- what happened?
- where did it happen?
- what did it cost?

## What should NOT live only in the SDK

Anything related to trust, enforcement, or money should not rely solely on the SDK.

The SDK can be bypassed, misconfigured, or partially implemented.

The following must live in a backend / proxy / gateway:

- budget enforcement
- rate limiting
- tool allow / deny policies
- API key control
- kill switches
- approval workflows
- model selection / downgrading

## Separation of responsibilities

**SDK (context + attribution)**

The SDK answers:

- this model call belongs to agent A
- inside task B
- called from function C
- for customer D

**Proxy / Gateway (enforcement)**

The gateway enforces:

- agent A has $2.41 remaining
- this model is allowed
- this call is within token limits
- → approve / deny / downgrade

## Why a gateway is required

Without a gateway:

- developers can call providers directly
- budgets cannot be enforced reliably
- policies become advisory, not guaranteed

With a gateway:

- all traffic is centralized
- usage is metered accurately
- policies are enforced before execution

## MVP path

Given an existing SDK, the next step is adding a gateway mode.

Core components:

- OpenAI-compatible endpoint
- Anthropic-compatible endpoint
- tool-call proxy layer
- per-agent API keys
- budget + policy checks before forwarding requests

Flow:

```
SDK → Gateway → Provider
```

This enables:

- observability (SDK)
- enforcement (gateway)
- centralized control (backend)

## Summary

- SDK = capture, attribution, developer experience
- Gateway = enforcement, control, reliability
- Backend = policies, budgets, analytics


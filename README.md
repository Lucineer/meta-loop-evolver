# Meta Loop Evolver 🧬

You can fork this fleet to run a system that rewrites its own orchestration logic. It tests new rule variants in parallel before adopting them, aiming to replace underperforming logic without manual intervention.

**Live URL:** [https://meta-loop-evolver.casey-digennaro.workers.dev](https://meta-loop-evolver.casey-digennaro.workers.dev)

---

## Why This Exists
Most automated systems rely on static, hardcoded rules. This fleet demonstrates an alternative: a core set of rules that can propose, test, and promote changes to itself, including the rules that govern changes.

---

## Quick Start
1.  Fork this repository.
2.  Deploy it to Cloudflare Workers.
3.  Bind one KV namespace named `META_KV`.
4.  Optionally, set a `DEEPSEEK_API_KEY` environment variable for rule generation.

If you are familiar with Workers, you can have it running in a few minutes.

---

## Features
*   **Self-Modifying Rules:** Operational rules can propose changes to other rules, including the meta-logic for evaluating changes.
*   **Silent A/B Testing:** New rule variants are tested against the active version with a fraction of traffic before any full deployment.
*   **Measured Promotion:** A variant replaces the active rule only if it shows a statistically significant performance improvement over hundreds of test runs.
*   **Public Audit Log:** Every test, score, and version change is recorded and publicly accessible via the live endpoint.
*   **Zero Dependencies:** Written for Cloudflare Workers with no external npm packages or build steps.
*   **Fork-First Design:** The repository is configured to be immediately usable upon forking.
*   **MIT Licensed:** Use it for any purpose.

---

## How It Operates
1.  An active rule set governs the system's behavior.
2.  The meta-rule periodically solicits new variant rules, either from a built-in generator or an LLM API.
3.  New variants are tested silently against the active rule. Performance is tracked.
4.  If a variant outperforms the active rule over a sustained test period, it is promoted to become the new active rule.

---

## A Specific Limitation
Rule generation is most effective with an external LLM API key. Without it, the system relies on a simpler built-in generator, which produces less creative variants and will explore the rule space more slowly.

---

## License
MIT License. Copyright © Superinstance and Lucineer (DiGennaro et al.).

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>
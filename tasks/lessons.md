# TonQuant — Lessons Learned

> Convert user corrections and debugging insights into prevention rules.
> Group by theme so patterns can be promoted to project knowledge.

---

## Identity And Persistence

- When a market dimension is added to runtime selection, propagate it through every persistence boundary: request normalization, canonical ids, cache keys, filenames, and readback compatibility shims.
- Treat `displaySymbol` as presentation only. Any cache or artifact key that decides uniqueness must include the full market identity, including provider when provider selection exists.

## Filesystem Boundaries

- Never join caller-controlled ids directly into artifact paths. Validate `runId`, `trackId`, and candidate ids against the filesystem-safe identifier contract first, then create directories or files.

## Provider Contracts

- Do not infer third-party symbol compatibility from local pair syntax. If provider coverage depends on an explicit external ticker contract, either encode the mapping and test it or reject the combination at market resolution.
- Do not let zero-config market defaults point at providers that require external services or credentials. Opt-in providers must stay explicit until the environment contract is guaranteed.
- Do not transport structured backend error codes by scraping human log text. Use a dedicated machine-readable marker or payload channel, and treat remote/provider response text as untrusted input.
- Refuse to send credential-bearing provider requests over non-HTTPS transport unless the target is an explicit local loopback endpoint.

## Verification Boundaries

- Repo-wide verification should use the root package scripts when they encode intentional test scoping; in this repo, `bun run test` is authoritative because it excludes `_ref/**` mirrors that are not part of the maintained test surface.
- When running repo-wide tests in a sandboxed environment, point `HOME` at a writable temp directory if the suite intentionally exercises config, artifact, or event-log paths under `~/.tonquant`; otherwise verification failures can be sandbox artifacts instead of code regressions.
- Fix lint-driven accessibility issues with semantic elements first. Adding ARIA roles to interactive `div` containers is a weaker fallback than using an actual button or restructuring the DOM.

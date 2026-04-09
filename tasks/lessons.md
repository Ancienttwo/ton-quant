# TonQuant — Lessons Learned

> Convert user corrections and debugging insights into prevention rules.
> Group by theme so patterns can be promoted to project knowledge.

---

## Identity And Persistence

- When a market dimension is added to runtime selection, propagate it through every persistence boundary: request normalization, canonical ids, cache keys, filenames, and readback compatibility shims.
- Treat `displaySymbol` as presentation only. Any cache or artifact key that decides uniqueness must include the full market identity, including provider when provider selection exists.

## Filesystem Boundaries

- Never join caller-controlled ids directly into artifact paths. Validate `runId`, `trackId`, and candidate ids against the filesystem-safe identifier contract first, then create directories or files.

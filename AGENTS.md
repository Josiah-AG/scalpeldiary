# ScalpelDiary project instructions

## Session log

The project owner requested a persistent log of everything we update.

- Read `SESSION_LOG.md` before starting work in this project.
- Append a dated entry for every meaningful change, including code, configuration, data, documentation, and deployments. Keep earlier entries intact.
- Record the request, what changed and why, affected file paths, validation results, and remaining work or limitations.
- Record failed attempts or reversals when they affect the final state or the next session.
- Never put credentials, tokens, private keys, patient data, or database connection strings in the log.
- Before the final response, ensure the log describes the actual completed work and distinguishes checks performed from checks not performed.

## Project context

- Read `docs/APP_MAP.md` for the architecture and baseline observations; use source code as the authority when documentation differs.
- `docs/FILE_INVENTORY.md` records the initial file-by-file inventory and review scope.
- Frontend: `client/`. Backend: `server/`. Shared definitions exist in both `shared/` and `server/src/shared/`; check both when changing them.
- Database scripts include historical, incompatible schema variants. Inspect the target schema and script before running a migration, seed, or cleanup.

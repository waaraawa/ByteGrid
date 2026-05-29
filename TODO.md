# TODO

## P0 - Repository Health

- [x] Fix root `npm test`.
  - Current state: core tests pass, but root workspace test fails because `@bytegrid/obsidian-plugin` has no `test` script.
  - Options:
    - Add a minimal `test` script to `packages/obsidian-plugin/package.json`.
    - Or change the root test script to run only workspaces that actually have tests.

- [x] Split plugin build from Obsidian vault deployment.
  - Current state: `npm run build` creates `packages/obsidian-plugin/main.js`, then tries to copy files to `OBSIDIAN_PLUGIN_DIR` from `.env`.
  - Problem: normal builds are tied to a personal local vault path and can fail in sandbox/CI.
  - Suggested shape:
    - `build`: bundle only.
    - `deploy:obsidian`: copy `main.js`, `manifest.json`, and `styles.css` to the configured vault.

- [x] Fix `npm run lint`.
  - Current state: ESLint checks test files, but root `tsconfig.json` excludes `**/*.test.ts`, causing parser project errors.
  - Also fix unsafe type errors in `packages/obsidian-plugin/src/main.ts`.
  - Options:
    - Add `tsconfig.eslint.json` including `src` and `tests`.
    - Or configure ESLint overrides for test files and Obsidian DOM helper types.

- [x] Run Prettier and commit formatting intentionally.
  - Current state: `npm run format:check` reports formatting issues in core source, tests, README, roadmap, AGENTS, and screenshot guide.
  - Do this as a separate formatting-only change to keep diffs readable.

## P1 - Correctness

- [ ] Make numeric parsing strict.
  - Current state: `parseInt` accepts partial values such as `12abc`.
  - Affected areas:
    - `packages/core/src/parser.ts`
    - `packages/core/src/validator.ts`
  - Use explicit regex validation for size, layout, offsets, and bit ranges before converting to numbers.

- [ ] Validate config enum values at parse or validation time.
  - Check invalid `layoutUnit`, `colorScheme`, `legendPosition`, `endianness`, and field `color`.
  - Current parser mostly casts strings without rejecting unsupported values.

- [ ] Add bitfield overlap validation.
  - Current validator checks bitfield range bounds but does not appear to reject overlapping bitfield definitions inside the same field.

- [ ] Review array type size consistency.
  - Current validator accepts array types like `uint32_t[4]`, but field size still comes only from `offset`.
  - Decide whether to warn/reject mismatches between declared type size and offset-derived size.

## P2 - Feature Roadmap

- [ ] Implement `showHexDump`.
  - Already exposed in render options, but not rendered yet.

- [ ] Add `bitOrder: msb | lsb`.
  - Current bitfield rendering assumes MSB-first display.

- [ ] Add field tooltips/highlight behavior.
  - Roadmap lists interactive tooltips and highlighting, but current SVG is static.

- [ ] Add value display formatting.
  - Support hex, decimal, binary, and maybe ASCII display where appropriate.

- [ ] Add endianness indicators.
  - `endianness` is accepted in config but not visibly represented in the SVG.

## P3 - Missing Planned Modules

- [ ] Add `binaryParser.ts`.
  - Read binary data, extract field values, handle endianness, and generate hex dump data.

- [ ] Add `templates.ts`.
  - Provide predefined structures such as WAV, ELF, TCP, and PNG headers.

- [ ] Add `comparison.ts`.
  - Support side-by-side, overlay, and diff views.

- [ ] Add `exporter.ts`.
  - Export SVG, PNG, C code, and Markdown.

- [ ] Add `cache.ts`.
  - Hash-based render cache with TTL and future persistence path.

## Documentation

- [ ] Reconcile README, roadmap, and AGENTS instructions with actual repository state.
  - Current docs mention modules and docs files that do not exist yet.

- [ ] Add a user-facing `docs/` structure when the feature set stabilizes.
  - Suggested first files:
    - `docs/getting-started.md`
    - `docs/syntax-reference.md`
    - `docs/type-reference.md`
    - `docs/troubleshooting.md`

## Current Baseline

- Core tests: passing, 141 tests.
- Core coverage command:
  - `npm run test --workspace=@bytegrid/core -- --coverage --runInBand`
- Passing repo-level commands:
  - `npm test`
  - `npm run build`
  - `npm run lint`
  - `npm run format:check`

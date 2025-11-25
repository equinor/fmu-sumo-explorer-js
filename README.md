# fmu-sumo-explorer

Exports a lightweight client and Explorer helpers for interacting with FMU data stored in Sumo.

Usage

Install locally or from npm (when published):

```
npm install fmu-sumo-explorer
```

Import:

```
import { Explorer, SumoClient, ExplorerObjects } from 'fmu-sumo-explorer';

// ExplorerObjects contains named exports for Case, Cases, Ensemble, etc.
```

Run demo (requires browser interactive auth):

```
npm run demo
```

Publishing

1. Update `package.json` `version` and `author`.
2. Login to npm: `npm login`.
3. Publish: `npm publish --access public`.

Notes

- The package uses ESM (`type: module`) and re-exports `src/*` files via the `exports` field.
- Keep `src/index.js` as the main entrypoint for both default and named imports.

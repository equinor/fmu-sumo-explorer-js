# fmu-sumo-explorer

Exports a lightweight client and Explorer helpers for interacting with FMU data stored in Sumo.

## Install:

Install locally or from npm (when published):

```
npm install fmu-sumo-explorer
```

## Import:

```
import { GetExplorer, ExplorerObjects } from 'fmu-sumo-explorer';

// ExplorerObjects contains named exports for Case, Cases, Ensemble, etc.

```

## Usage:
```
const exp = await GetExplorer("dev");

const cse = await exp.get_case_by_uuid(
  "359e7c72-a4ca-43ee-9203-f09cd0f149a9",
);
const ens = cse.filter({ ensemble: "pred-0" });
const rels = ens.tables().filter({ tagname: "summary", realization: true });
const agg = await rels.aggregate({
  operation: "collection",
  columns: ["FOPT"],
});
console.log(JSON.stringify(agg, null, 2));

```

More examples in `src/demo.js`.

## Demo:

Run demo (requires browser interactive auth):

```
npm run demo
```

## Publishing:

1. Update `package.json` `version` and `author`.
2. Login to npm: `npm login`.
3. Publish: `npm publish --access public`.

# Notes

- The package uses ESM (`type: module`) and re-exports `src/*` files via the `exports` field.
- Keep `src/index.js` as the main entrypoint for both default and named imports.

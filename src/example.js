import { TestSetup } from "./test.js";

const exp = TestSetup();

const cases = await exp.cases();

const namesfromcases = await cases.names();

const caselist = await Array.fromAsync(cases);

const namesfromlist = caselist.map((c) => c.name());

// console.log(namesfromcases);

// console.log(namesfromlist);

const namesfromcasesset = new Set(namesfromcases);

const namesfromlistset = new Set(namesfromlist);

const difference = namesfromcasesset
  .difference(namesfromlistset)
  .union(namesfromlistset.difference(namesfromcasesset));

console.log(difference);

const mycase = caselist[0];

const ensembles = await mycase.ensembles();

console.log(await ensembles.names());

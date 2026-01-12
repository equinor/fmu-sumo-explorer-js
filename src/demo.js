import {
  GetConfig,
  GetCredential,
  SumoClient,
  Explorer,
  ExplorerObjects,
  GetExplorer,
} from "./index.js";
import { AxiosError } from "axios";

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import os from "node:os";

function JS(v) {
  return JSON.stringify(v, null, 2);
}

async function test1(exp) {
  const cases_with_grids = (await exp.cpgrids().cases()).filter({
    status: "keep",
  });
  const cases_with_gridprops = (await exp.cpgrid_properties().cases()).filter({
    status: "keep",
  });
  const cgs = new Set(await cases_with_grids.uuids());
  const cgps = new Set(await cases_with_gridprops.uuids());
  assert(cgs.difference(cgps).size == 0 && cgps.difference(cgs).size == 0);
  const cse = await cases_with_grids.get(0);
  const grids = cse.cpgrids();
  const grid = await grids.get(0);
  assert(grid instanceof ExplorerObjects.CPGrid);
  const gridprops = await grid.grid_properties();
  console.log(JS(gridprops.query()));
  const gridp0 = await gridprops.get(0);
  assert(gridp0 instanceof ExplorerObjects.CPGridProperty);
  const grid2 = await gridp0.grid();
  assert(grid.id == grid2.id);
}

async function test2(exp) {
  const refs = exp.filter({
    cls: "realization",
    complex: { term: { "fmu.realization.is_reference": true } },
  });
  if ((await refs.length()) > 0) {
    const ens = await (await refs.ensembles()).get(0);
    const ensrefs = await ens.reference_realizations();
    console.log(ensrefs);
    assert((await ensrefs.length()) > 0);
    assert((await ensrefs.length()) == (await ensrefs.realizationids()).length);
  }
}

async function test3(exp) {
  const cases_with_grids = (await exp.cpgrids().cases()).filter({
    status: "keep",
  });
  const cases_with_gridprops = (await exp.cpgrid_properties().cases()).filter({
    status: "keep",
  });
  const cgs = new Set(await cases_with_grids.uuids());
  const cgps = new Set(await cases_with_gridprops.uuids());
  assert(cgs.difference(cgps).size == 0 && cgps.difference(cgs).size == 0);
  const cse = await cases_with_grids.get(0);
  const grids = cse.cpgrids();
  const grid = await grids.get(0);
  assert(grid instanceof ExplorerObjects.CPGrid);
  const gridp0 = await (await grid.grid_properties()).get(0);
  assert(gridp0 instanceof ExplorerObjects.CPGridProperty);
  const grid2 = await gridp0.grid();
  assert(grid.id == grid2.id);
}

async function test4(exp) {
  const cse = await exp.get_case_by_uuid("359e7c72-a4ca-43ee-9203-f09cd0f149a9");
  const ens = cse.filter({ ensemble: "pred-0" });
  const rels = ens.tables().filter({ tagname: "summary", realization: true });
  const agg = await rels.aggregate({
    operation: "collection",
    columns: ["FOPT"],
  });
  console.log(JS(agg));
}

async function test5(exp) {
  const caseuuids = await exp
    .filter({
      cls: "case",
      asset: "Troll",
      status: ["keep", "official"],
    })
    .uuids();
  console.log(caseuuids);
  console.log(JS(exp.filter({ uuid: caseuuids }).query()));
  console.log(await exp.filter({ uuid: caseuuids }).length());
  console.log(await exp.filter({ uuid: caseuuids }).get_field_values("fmu.ensemble.uuid.keyword"));
  const ensembles = await exp.filter({ uuid: caseuuids }).ensembles();
  console.log(JS(ensembles.query()));
  console.log(await ensembles.length());
  for await (let e of ensembles) {
    console.log(e.name());
  }
}

async function test6(exp) {
  const refs = exp.filter({
    cls: "realization",
    complex: { term: { "fmu.realization.is_reference": true } },
  });
  if ((await refs.length()) > 0) {
    const ens = await (await refs.ensembles()).get(0);
    const ensrefs = await ens.reference_realizations();
    assert((await ensrefs.length()) > 0);
    assert((await ensrefs.length()) == (await ensrefs.realizationids()).length);
  }
}

async function test7(exp) {
  const cases = await exp.filter({ asset: "Troll" }).cases();
  const c = await cases.get(0);
  console.log(c.id);

  const ensembles = await c.ensembles();

  console.log(await ensembles.length());

  for await (let e of ensembles) {
    console.log(e.name());
  }

  const ee = await Array.fromAsync(ensembles);
  console.log(ee.map((e) => e.name()));
  console.log(ee.map((e) => e.uuid()));

  const e = await ensembles.get(0);

  const realizations = await e.realizations();
  // for await (let r of realizations) {
  //   console.log(r.name());
  // }

  const rr = await Array.fromAsync(realizations);
  console.log(rr.map((r) => r.name()));

  console.log(JS(rr[0].metadata));
}

async function test8(exp) {
  const config = GetConfig("dev");
  const credential = await GetCredential(config);
  const auth = await credential.getToken(config.scopes);
  console.log(JS(auth));
  console.log(JS(credential));
  const token1 = await credential.getToken(config.scopes);
  await new Promise((resolve) => setTimeout(resolve, 5 * 1000));
  const token2 = await credential.getToken(config.scopes);
  assert(token1.token == token2.token);
}

async function test9(exp) {
  const cases = (await exp.cases()).filter({ field: "DROGON" });
  for await (const c of cases) {
    assert(c instanceof ExplorerObjects.Case);
    assert(c.field().toLowerCase() == "drogon");
    console.log(c.name());
  }
}

async function test10(exp) {
  const first = await exp
    .sort({ "_sumo.timestamp": { order: "asc" } })
    .limit(1)
    .single();
  const last = await exp
    .sort({ "_sumo.timestamp": { order: "desc" } })
    .limit(1)
    .single();
  console.log(`First: ${first.id}`);
  console.log(`Last:  ${last.id}`);
  console.log(`First: ${first.metadata._sumo.timestamp}`);
  console.log(`Last:  ${last.metadata._sumo.timestamp}`);
}

async function test11(exp) {
  const req = [{ delete: { _index: "sumo", _id: "bar" } }];
  const reqstr = req.map((r) => JSON.stringify(r)).join("\n") + "\n";
  const { data } = await exp.sumo.put(
    "/admin/bulk",
    reqstr,
    {},
    {
      headers: {
        "Content-Type": "application/x-ndjson",
      },
    },
  );
  console.log(JS(data));
}

async function main() {
  const exp = await GetExplorer("dev");

  // await test1(exp);

  // await test2(exp);

  // await test3(exp);

  // await test4(exp);

  // await test5(exp);

  // await test6(exp);

  // await test7(exp);

  // await test8(exp);

  // await test9(exp);

  // await test10(exp);

  await test11(exp);
}

try {
  await main();
} catch (ex) {
  if (ex instanceof AxiosError) {
    console.log(ex.code);
    console.log(ex.request.body);
    console.log(ex.response.data);
    console.log(ex.request);
  } else {
    throw ex;
  }
}

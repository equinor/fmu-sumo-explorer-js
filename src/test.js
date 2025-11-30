import { GetConfig, GetCredential, SumoClient, Explorer } from "./index.js";
import { AxiosError } from "axios";

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import os from "node:os";

function JS(v) {
  return JSON.stringify(v, null, 2);
}

async function main() {
  const config = GetConfig("dev");

  const credential = await GetCredential(config);

  const sumo = new SumoClient(config.url, credential, config.scopes);

  const exp = new Explorer(sumo);

  console.log(JS(exp.filter({}).query()));

  const cases = exp.filter({
    cls: "case",
    realization: false,
    asset: "Johan Sverdrup",
  });
  console.log(JS(cases.query()));
  console.log(`length: ${await cases.length()}`);

  const cases2 = await exp
    .surfaces()
    .filter({ asset: "Johan Sverdrup" })
    .cases();

  console.log(JS(cases2.query()));
  console.log(`length: ${await cases2.length()}`);

  assert((await cases.length()) == (await cases2.length()));

  console.log(`cases.uuids(): ${JS(await cases.uuids())}`);
  console.log(
    JS(await cases.get_field_values_and_counts("fmu.case.uuid.keyword")),
  );

  for await (let c of cases.filter({}).select(false)) {
    console.log(JS(c.metadata));
    break;
  }

  console.log(`cases.uuids(): ${JS(await cases.filter({}).uuids())}`);

  const myCase = new Explorer(sumo).filter({
    uuid: (await cases.filter({}).uuids())[0],
  });

  console.log(JS(await myCase.query()));

  console.log(JS(await myCase.get_field_values_and_counts("class.keyword")));

  console.log(JS(cases));

  console.log(
    await (await exp.cases()).filter({ asset: "Johan Sverdrup" }).names(),
  );

  console.log("---");
  console.log(
    JS(await (await exp.cases()).filter({ asset: "Johan Sverdrup" }).query()),
  );
  console.log("+++");

  console.log(
    await (await exp.cases()).filter({ asset: "Johan Sverdrup" }).length(),
  );
}

try {
  await main();
} catch (ex) {
  if (ex instanceof AxiosError) {
    console.log(ex.code);
    console.log(ex.request.body);
    console.log(ex.response.data);
  }
}

// main();

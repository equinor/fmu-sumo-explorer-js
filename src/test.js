import { GetConfig, GetCredential, SumoClient, Explorer } from "./index.js";
import { AxiosError } from "axios";

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import os from "node:os";

function JS(v) {
  return JSON.stringify(v, null, 2);
}

async function main() {
  const config = GetConfig("preview");

  const credential = await GetCredential(config);

  const sumo = new SumoClient(config.url, credential, config.scopes);

  const exp = new Explorer(sumo);

  console.log(JS(await exp.filter({}).query()));

  const cases = exp.filter({
    cls: "case",
    realization: false,
    asset: "Johan Sverdrup",
  });
  console.log(JSON.stringify(await cases.query(), null, 2));
  console.log(`length: ${await cases.length()}`);

  for await (let c of cases.select(false)) {
    console.log(JSON.stringify(c._source, null, 2));
    break;
  }

  console.log(`cases.uuids(): ${JS(await cases.uuids())}`);

  return;
  const myCase = new Explorer(sumo).filter({
    uuid: (await cases.filter({}).uuids())[0],
  });

  console.log(JSON.stringify(await myCase.query(), null, 2));

  console.log(
    JSON.stringify(
      await myCase.get_field_values_and_counts("class.keyword"),
      null,
      2,
    ),
  );

  console.log(JSON.stringify(cases, null, 2));

  console.log(
    await (await exp.cases()).filter({ asset: "Johan Sverdrup" }).names(),
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

main();

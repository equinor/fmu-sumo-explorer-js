import { InteractiveBrowserCredential } from "@azure/identity";
import { cachePersistencePlugin } from "@azure/identity-cache-persistence";
import { useIdentityPlugin } from "@azure/identity";
useIdentityPlugin(cachePersistencePlugin);

import SumoClient from "./sumo-client.js";
import Explorer from "./explorer/explorer.js";

function JS(v) {
  return JSON.stringify(v, null, 2);
}

async function main() {
  const credential = new InteractiveBrowserCredential({
    clientId: "1826bd7c-582f-4838-880d-5b4da5c3eea2",
    tenantId: "3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
    tokenCachePersistenceOptions: {
      enabled: true,
    },
  });
  const sumo = new SumoClient("https://main-sumo-dev.radix.equinor.com/api/v1", credential, "api://88d2b022-3539-4dda-9e66-853801334a86/.default");
  const resp = await sumo.get("/userdata");
  console.log(resp.data);

  const exp = new Explorer(sumo);

  const cases = exp.filter({
    cls: "case",
    realization: false,
    asset: "Johan Sverdrup",
  });
  console.log(JSON.stringify(await cases.query(), null, 2));
  console.log(`length: ${await cases.length()}`);

  console.log(1, await cases.uuids());
  console.log(2, await cases.uuids());

  for await (let c of cases.select(false)) {
    console.log(JSON.stringify(c._source, null, 2));
    break;
  }

  console.log("HERE");
  console.log(`cases.uuids(): ${JS(await cases.uuids())}`);
  const myCase = new Explorer(sumo).filter({
    uuid: (await cases.filter({}).uuids())[0],
  });
  console.log("THERE");
  console.log(JSON.stringify(await myCase.query(), null, 2));
  console.log("EVERYWHERE");

  console.log(JSON.stringify(await myCase.get_field_values_and_counts("class.keyword"), null, 2));

  console.log(JSON.stringify(cases, null, 2));

  console.log(await (await exp.cases()).filter({ asset: "Johan Sverdrup" }).names());
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith("demo.js")) {
  main().catch((ex) => console.error(ex));
}

export { main };

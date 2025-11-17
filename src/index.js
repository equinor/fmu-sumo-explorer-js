import {
  DefaultAzureCredential,
  InteractiveBrowserCredential,
  useIdentityPlugin,
} from "@azure/identity";

import { cachePersistencePlugin } from "@azure/identity-cache-persistence";
useIdentityPlugin(cachePersistencePlugin);

import SumoClient from "./sumo-client.js";
import SearchContext from "./search-context.js";

async function main() {
  const credential = new InteractiveBrowserCredential({
    clientId: "1826bd7c-582f-4838-880d-5b4da5c3eea2",
    tenantId: "3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
    tokenCachePersistenceOptions: {
      enabled: true,
    },
  });
  const sumo = new SumoClient(
    "https://main-sumo-dev.radix.equinor.com/api/v1",
    credential,
    "api://88d2b022-3539-4dda-9e66-853801334a86/.default",
  );
  const resp = await sumo.get("/userdata");
  console.log(resp.data);

  const searchcontext = new SearchContext(sumo);

  const cases = searchcontext.filter({
    cls: "case",
    realization: false,
    //    asset: "Johan Sverdrup",
  });
  console.log(JSON.stringify(cases._query(), null, 2));
  console.log(`length: ${await cases.length()}`);
  console.log(await cases.uuids());

  for await (let c of cases) {
    console.log(`${c._id}: ${c._source.fmu.case.name}`);
  }
}

await main();

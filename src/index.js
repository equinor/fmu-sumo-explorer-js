import { cachePersistencePlugin, useIdentityPlugin } from "@azure/identity-cache-persistence";
useIdentityPlugin(cachePersistencePlugin);

import SumoClient from "./sumo-client.js";
import Explorer from "./explorer/explorer.js";
import * as ExplorerObjects from "./explorer/objects.js";

export { SumoClient, Explorer, ExplorerObjects };

export default { SumoClient, Explorer, ExplorerObjects };

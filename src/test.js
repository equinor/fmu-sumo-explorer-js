import {
  DefaultAzureCredential,
  InteractiveBrowserCredential,
  useIdentityPlugin,
} from "@azure/identity";

import { cachePersistencePlugin } from "@azure/identity-cache-persistence";
useIdentityPlugin(cachePersistencePlugin);

import SumoClient from "./sumo-client.js";
import Explorer from "./explorer/explorer.js";

import { AxiosError } from "axios";

function JS(v) {
  return JSON.stringify(v, null, 2);
}

function getCredential() {
  return new InteractiveBrowserCredential({
    clientId: "1826bd7c-582f-4838-880d-5b4da5c3eea2",
    tenantId: "3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
    tokenCachePersistenceOptions: {
      enabled: true,
    },
  });
}

function getSumoClient(credential) {
  return new SumoClient(
    "https://main-sumo-dev.radix.equinor.com/api/v1",
    credential,
    "api://88d2b022-3539-4dda-9e66-853801334a86/.default",
  );
}

function getExplorer(sumo) {
  return new Explorer(sumo);
}

function TestSetup() {
  const credential = getCredential();
  const sumo = getSumoClient(credential);
  const exp = getExplorer(sumo);
  return exp;
}

export { TestSetup };

import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

import {
  WorkloadIdentityCredential,
  EnvironmentCredential,
  InteractiveBrowserCredential,
  useIdentityPlugin,
  serializeAuthenticationRecord,
  deserializeAuthenticationRecord,
} from "@azure/identity";

import { cachePersistencePlugin } from "@azure/identity-cache-persistence";
useIdentityPlugin(cachePersistencePlugin);

import { GetConfig } from "./config.js";

async function GetCredential({ tenantId, clientId, scopes } = {}) {
  if (process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID) {
    if (process.env.AZURE_FEDERATED_TOKEN_FILE) {
      return new WorkloadIdentityCredential();
    } else {
      return new EnvironmentCredential();
    }
  } else {
    assert(tenantId);
    assert(clientId);
    assert(scopes);
    const dir = path.resolve(os.homedir(), ".sumo");
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const filename = `${clientId}-auth.json`;
    const authenticationRecordPath = path.resolve(dir, filename);
    let authenticationRecord;
    try {
      const fileContent = fs.readFileSync(authenticationRecordPath, { encoding: "utf-8" });
      authenticationRecord = deserializeAuthenticationRecord(fileContent);
    } catch (ex) {
      // nada!
    }
    const cred = new InteractiveBrowserCredential({
      clientId,
      tenantId,
      tokenCachePersistenceOptions: {
        enabled: true,
      },
      authenticationRecord,
    });

    if (!authenticationRecord) {
      authenticationRecord = await cred.authenticate(scopes);
      const fileContent = serializeAuthenticationRecord(authenticationRecord);
      fs.writeFileSync(authenticationRecordPath, fileContent, { mode: 0o600, encoding: "utf-8" });
    }
    return cred;
  }
}

export default GetCredential;

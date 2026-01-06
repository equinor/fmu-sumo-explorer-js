import GetConfig from "./config.js";
import GetCredential from "./auth.js";
import SumoClient from "./sumo-client.js";
import Explorer from "./explorer/explorer.js";

/**
 * Get Explorer instance.
 * @param {string} env - Which sumo environment to connect to.
 * @returns {Explorer}
 */
async function GetExplorer(env) {
  const config = GetConfig(env);
  const credential = await GetCredential(config);
  const sumo = new SumoClient(config.url, credential, config.scopes);
  const exp = new Explorer(sumo);
  return exp;
}

export default GetExplorer;

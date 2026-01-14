import GetConfig from "./config.js";
import GetCredential from "./auth.js";
import SumoClient from "./sumo-client.js";
import SearchContextBase from "./explorer/objects/search-context-base.js";

/**
 * Get SearchContextBase instance.
 * @param {string} env - Which sumo environment to connect to.
 * @param {string} index - Which index to use.
 * @returns {SearchContextBase}
 */
async function GetSearchContextBase(env, index) {
  const config = GetConfig(env);
  const credential = await GetCredential(config);
  const sumo = new SumoClient(config.url, credential, config.scopes);
  const exp = new SearchContextBase(sumo, { index });
  return exp;
}

export default GetSearchContextBase;

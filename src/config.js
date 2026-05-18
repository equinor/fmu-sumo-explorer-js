import axios from "axios";
import axiosRetry from "axios-retry";

const WELL_KNOWN = process?.env?.SUMOCONNECTIONINFO || "https://api.sumo.equinor.com/well-known";

const { EnvNames, GetConfig } = (() => {
  let config = null;
  let _axios = axios.create();
  axiosRetry(_axios, {
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) =>
      axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429,
  });
  const _getConfig = async () => {
    if (!config) {
      config = (await _axios.get(WELL_KNOWN)).data;
    }
    return config;
  };
  const EnvNames = async () => {
    const config = await _getConfig();
    return Object.keys(config.envs);
  };
  const GetConfig = async (env) => {
    const config = await _getConfig();
    if (!(env in config.envs)) {
      throw `Unknown environment: ${env}`;
    }
    const tenant_id = config.tenant_id;
    const authority = config.authority;
    const { resource_id, client_id, base_url } = config.envs[env];
    const scope = `api://${resource_id}/.default`;

    return { url: base_url, tenantId: tenant_id, clientId: client_id, scopes: scope };
  };
  return { EnvNames, GetConfig };
})();

export { EnvNames, GetConfig };
export default { EnvNames, GetConfig };

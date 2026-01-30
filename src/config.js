const config = {
  localhost: {
    url: "http://localhost:8084/api/v1",
    tenantId: "3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
    clientId: "1826bd7c-582f-4838-880d-5b4da5c3eea2",
    scopes: "api://88d2b022-3539-4dda-9e66-853801334a86/.default",
  },
  dev: {
    url: "https://main-sumo-core-dev.c3.radix.equinor.com/api/v1",
    tenantId: "3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
    clientId: "1826bd7c-582f-4838-880d-5b4da5c3eea2",
    scopes: "api://88d2b022-3539-4dda-9e66-853801334a86/.default",
  },
  preview: {
    url: "https://main-sumo-core-preview.c3.radix.equinor.com/api/v1",
    tenantId: "3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
    clientId: "1826bd7c-582f-4838-880d-5b4da5c3eea2",
    scopes: "api://88d2b022-3539-4dda-9e66-853801334a86/.default",
  },
  test: {
    url: "https://main-sumo-core-test.c3.radix.equinor.com/api/v1",
    tenantId: "3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
    clientId: "d57a8f87-4e28-4391-84d6-34356d5876a2",
    scopes: "api://9e5443dd-3431-4690-9617-31eed61cb55a/.default",
  },
  prod: {
    url: "https://main-sumo-core-prod.c3.radix.equinor.com/api/v1",
    tenantId: "3aa4a235-b6e2-48d5-9195-7fcf05b459b0",
    clientId: "d57a8f87-4e28-4391-84d6-34356d5876a2",
    scopes: "api://9e5443dd-3431-4690-9617-31eed61cb55a/.default",
  },
};

function EnvNames() {
  return Object.keys(config);
}

function GetConfig(env) {
  if (!(env in config)) {
    throw `Unknown environment: ${env}`;
  }
  return config[env];
}

export { EnvNames, GetConfig };

export default { EnvNames, GetConfig };

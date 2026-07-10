# Changelog

## [1.3.1](https://github.com/equinor/fmu-sumo-explorer-js/compare/1.3.0...1.3.1) (2026-07-10)


### Bug Fixes

* add repository info to package.json (needed for npm publish ... --provenance). ([d373197](https://github.com/equinor/fmu-sumo-explorer-js/commit/d373197af54fad3995d47541dff8fe9c208b8be3))
* Add scope to package name. ([0965191](https://github.com/equinor/fmu-sumo-explorer-js/commit/0965191495c92c463d0f1f735bd18fb0a91d9580))

## [1.3.0](https://github.com/equinor/fmu-sumo-explorer-js/compare/1.2.0...1.3.0) (2026-07-10)


### Features

* allow sumo-client to be used without credentials. next: add support for basic auth ([38dd65a](https://github.com/equinor/fmu-sumo-explorer-js/commit/38dd65ab01ed8681d5ae4831df4dcd0d420bfe37))
* create member methods do_search and do_count, so that we can later implement subclasses that (e.g,) queries elasticsearch directly instead of through sumo... allowing us to use fmu-sumo-explorer internally in sumo-core. ([7f96806](https://github.com/equinor/fmu-sumo-explorer-js/commit/7f9680651a8528c2a4ed9107e8728ed0ce3291f6))
* support 'basic' authentication for SumoClient. ([b42bb89](https://github.com/equinor/fmu-sumo-explorer-js/commit/b42bb8961499def44f9f2830fde5ee5653c4f89b))


### Bug Fixes

* added private member #auth. ([6d256de](https://github.com/equinor/fmu-sumo-explorer-js/commit/6d256deeb984156a4f424c9d0e34a4b25b3dd28f))
* export a few more classes. ([8fb380d](https://github.com/equinor/fmu-sumo-explorer-js/commit/8fb380ddbb23746e9c2a8c156e6c07abdf0dc6b8))
* remove spurious parameter left after refactoring. ([a33c343](https://github.com/equinor/fmu-sumo-explorer-js/commit/a33c343dc332757d052e6cb8d750e749eb978746))
* use this.constructor to create new searchcontext. ([0c8f779](https://github.com/equinor/fmu-sumo-explorer-js/commit/0c8f779008a5f53055d707e53e3a52f8e868572f))

## [1.2.0](https://github.com/equinor/fmu-sumo-explorer-js/compare/1.1.0...1.2.0) (2026-06-10)


### Features

* add patch method to sumoclient ([#47](https://github.com/equinor/fmu-sumo-explorer-js/issues/47)) ([6a89673](https://github.com/equinor/fmu-sumo-explorer-js/commit/6a89673dc123b802dd35af9f2f4666c6f14ffa33))

## [1.1.0](https://github.com/equinor/fmu-sumo-explorer-js/compare/v1.0.0...1.1.0) (2026-05-18)


### Features

* add metrics. ([#42](https://github.com/equinor/fmu-sumo-explorer-js/issues/42)) ([b7a0132](https://github.com/equinor/fmu-sumo-explorer-js/commit/b7a0132fca5cfa9c8f24fd115f6c81f2997f71b1))
* get config from well-known endpoint. Note: this makes EnvNames and GetConfig async functions. ([27bd254](https://github.com/equinor/fmu-sumo-explorer-js/commit/27bd2543b4ac7a7e39305a326e71d61ddb1ec347))
* implement partitioned terms aggregation ([#44](https://github.com/equinor/fmu-sumo-explorer-js/issues/44)) ([3464a4f](https://github.com/equinor/fmu-sumo-explorer-js/commit/3464a4f8a4ba5911c08a0955785174d54a980fd8))

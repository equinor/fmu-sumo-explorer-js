import { it, describe } from "mocha";

import {
  GetConfig,
  GetCredential,
  SumoClient,
  Explorer,
  ExplorerObjects,
} from "../src/index.js";
import { AxiosError } from "axios";

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import os from "node:os";

function JS(v) {
  return JSON.stringify(v, null, 2);
}

let config;

let credential;

let sumo;

let exp;

let test_case;

let test_case_seismic;

const test_case_uuid = "2c2f47cf-c7ab-4112-87f9-b4797ec51cb6";

const test_case_seismic_uuid = "c616019d-d344-4094-b2ee-dd4d6d336217";

describe("Config", function () {
  it("Should get a config object.", function () {
    config = GetConfig("dev");
    assert(
      ["url", "tenantId", "clientId", "scopes"].every((key) => key in config),
    );
  });
});

describe("Credential", async function () {
  it("Should get a credential object.", async function () {
    credential = await GetCredential(config);
    assert("getToken" in credential);
  });
});

describe("SumoClient", function () {
  it("Should get an instance of SumoClient.", function () {
    sumo = new SumoClient(config.url, credential, config.scopes);
    assert(sumo instanceof SumoClient);
  });
});

describe("Explorer", function () {
  it("Should get an instance of Explorer.", function () {
    exp = new Explorer(sumo);
    assert(exp instanceof Explorer);
  });
});

describe("get_cases", function () {
  it("Should get a list of Case objects.", async function () {
    const cases = await exp.cases();
    assert(cases instanceof ExplorerObjects.Cases);
    const uuids = await cases.uuids();
    assert((await cases.get_object(uuids[0])) instanceof ExplorerObjects.Case);
    assert((await cases.get(0)) instanceof ExplorerObjects.Case);
  });
});

describe("get_cases_fields", function () {
  it("Should get a list of cases for a specific field.", async function () {
    const cases = (await exp.cases()).filter({ field: "DROGON" });
    for await (const c of cases) {
      assert(c instanceof ExplorerObjects.Case);
      assert(c.field().toLowerCase() == "drogon");
    }
  });
});

describe("get_cases_status", function () {
  it("Should get a list of cases with a specific status.", async function () {
    const cases = (await exp.cases()).filter({ status: "keep" });
    for await (const c of cases) {
      assert(c instanceof ExplorerObjects.Case);
      assert(c.status() == "keep");
    }
  });
});

describe("get_cases_user", function () {
  it("Should get a list of cases for a specific user.", async function () {
    const cases = (await exp.cases()).filter({ user: "peesv" });
    for await (const c of cases) {
      assert(c instanceof ExplorerObjects.Case);
      assert(c.user() == "peesv");
    }
  });
});

describe("get_cases_users_combinations", function () {
  it("Should get a list of cases, each satisfying the set of filters.", async function () {
    const fields = ["DROGON", "JOHAN SVERDRUP"];
    const users = ["peesv", "dbs"];
    const statuses = "keep";
    const cases = (await exp.cases()).filter({
      field: fields,
      user: users,
      status: statuses,
    });
    for await (const c of cases) {
      assert(fields.indexOf(c.field()) >= 0);
      assert(users.indexOf(c.user()) >= 0);
      assert(c.status() == statuses); // sic.
    }
  });
});

describe("get_test_case", function () {
  it("Get test case object.", async function () {
    test_case = await exp.get_case_by_uuid(test_case_uuid);
    assert(test_case instanceof ExplorerObjects.Case);
    assert(test_case.id == test_case_uuid);
  });
});

describe("case_surfaces_type", function () {
  it("All objects should be of class Surface.", async function () {
    const classes = await test_case.surfaces().classes();
    assert(classes.length == 1);
    assert(classes[0] == "surface");
  });
});

describe("case_surfaces_size", function () {
  it("Verify that test_case has the expected number of surfaces.", async function () {
    assert((await test_case.surfaces().length()) == 271);
  });
});

describe("case_surfaces.filter", function () {
  it("Verifies counts of various surfaces in test case.", async function () {
    const case_surfaces = test_case.surfaces();
    assert((await case_surfaces.filter({ stage: "ensemble" }).length()) == 59);
    assert((await case_surfaces.filter({ aggregation: true }).length()) == 59);

    assert(
      (await case_surfaces.filter({ stage: "realization" }).length()) == 212,
    );
    assert((await case_surfaces.filter({ realization: true }).length()) == 212);

    let surf_reals = case_surfaces.filter({
      realization: true,
      ensemble: "iter-0",
    });
    assert((await surf_reals.length()) == 212);

    const ensnames = await surf_reals.get_field_values(
      "fmu.ensemble.name.keyword",
    );
    assert(ensnames.length == 1 && ensnames[0] == "iter-0");

    assert((await surf_reals.filter({ name: "__not_valid__" }).length()) == 0);

    surf_reals = surf_reals.filter({ name: "Valysar Fm." });
    assert((await surf_reals.length()) == 56);
    const ens_names_valysar = await surf_reals.get_field_values(
      "fmu.ensemble.name.keyword",
    );
    assert(ens_names_valysar.length == 1 && ens_names_valysar[0] == "iter-0");
    const data_names_valysar =
      await surf_reals.get_field_values("data.name.keyword");
    assert(
      data_names_valysar.length == 1 && data_names_valysar[0] == "Valysar Fm.",
    );

    assert(
      (await surf_reals.filter({ content: "__not_valid__" }).length()) == 0,
    );
    surf_reals = surf_reals.filter({ content: "depth" });
    assert((await surf_reals.length()) == 56);

    assert(
      (await surf_reals.filter({ tagname: "__not_valid__" }).length()) == 0,
    );
    surf_reals = surf_reals.filter({ tagname: "FACIES_Fraction_Channel" });
    assert((await surf_reals.length()) == 4);

    assert(
      (await surf_reals.filter({ dataformat: "__not_valid__" }).length()) == 0,
    );
    surf_reals = surf_reals.filter({ dataformat: "irap_binary" });
    assert((await surf_reals.length()) == 4);

    const one_real = await surf_reals
      .filter({
        realization: 0,
      })
      .single();
    assert(one_real.ensemble() == "iter-0");
    assert(one_real.name() == "Valysar Fm.");
    assert(one_real.tagname() == "FACIES_Fraction_Channel");
    assert(one_real.realization() == 0);
  });
});

describe("test_case_surfacs_pagination", function () {
  it("Verifies that pagination retrieves all results.", async function () {
    const s = new Set();
    const surfs = test_case.surfaces();
    for await (const surf of surfs) {
      s.add(surf.id);
    }
    assert(
      s.size == (await surfs.length()),
      `${s.size} != ${await surfs.length()}`,
    );
  });
});

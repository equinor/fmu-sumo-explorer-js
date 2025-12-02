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

describe("test_case_surfaces_pagination", function () {
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

describe("test_grids_and_properties", function () {
  it("Tests relation between grids and grid properties.", async function () {
    const cases_with_grids = (await exp.cpgrids().cases()).filter({
      status: "keep",
    });
    const cases_with_gridprops = (await exp.cpgrid_properties().cases()).filter(
      {
        status: "keep",
      },
    );
    const cgs = new Set(await cases_with_grids.uuids());
    const cgps = new Set(await cases_with_gridprops.uuids());
    assert(cgs.difference(cgps).size == 0 && cgps.difference(cgs).size == 0);
    const cse = await cases_with_grids.get(0);
    const grids = cse.cpgrids();
    const grid = await grids.get(0);
    assert(grid instanceof ExplorerObjects.CPGrid);
    const gridp0 = await (await grid.grid_properties()).get(0);
    assert(gridp0 instanceof ExplorerObjects.CPGridProperty);
    const grid2 = await gridp0.grid();
    assert(grid.id == grid2.id);
  });
});

describe("test_search_context_select", function () {
  it("Verifies that the select() method works.", async function () {
    const surfs = test_case.surfaces().filter({ realization: true });
    let md;

    md = (await surfs.get(0)).metadata;
    assert("_sumo" in md);

    surfs.select("fmu");
    md = (await surfs.get(0)).metadata;
    assert(!("_sumo" in md));
    assert("fmu" in md);

    surfs.select(["fmu"]);
    md = (await surfs.get(0)).metadata;
    assert(!("_sumo" in md));
    assert("fmu" in md);

    surfs.select({ excludes: ["fmu"] });
    md = (await surfs.get(0)).metadata;
    assert("_sumo" in md);
    assert(!("fmu" in md));

    surfs.select({ includes: ["_sumo"], excludes: ["_sumo.timestamp"] });
    md = (await surfs.get(0)).metadata;
    assert("_sumo" in md);
    assert(!("fmu" in md));
    assert(!("timestamp" in md._sumo));
  });
});

describe("test_reference_realizations", function () {
  it("Verifies that reference_realizations() work.", async function () {
    const exp = new Explorer(sumo);
    const refs = exp.filter({
      cls: "realization",
      complex: { term: { "fmu.realization.is_reference": true } },
    });
    if ((await refs.length()) > 0) {
      const ens = await (await refs.ensembles()).get(0);
      const ensrefs = await ens.reference_realizations();
      assert((await ensrefs.length()) > 0);
      assert(
        (await ensrefs.length()) == (await ensrefs.realizationids()).length,
      );
    }
  });
});

describe("test_reference_realization_fallback", function () {
  it("Verifies that the reference_realizations() fallback works.", async function () {
    const all_case_uuids = new Set(
      await exp.get_field_values("fmu.case.uuid.keyword"),
    );
    const ref_case_uuids = new Set(
      await exp
        .filter({
          cls: "realization",
          complex: { term: { "fmu.realization.is_reference": true } },
        })
        .get_field_values("fmu.case.uuid.keyword"),
    );
    const no_ref_case_uuids = Array.from(
      all_case_uuids.difference(ref_case_uuids),
    );
    if (no_ref_case_uuids.length > 0) {
      const ens = await exp
        .filter({ uuid: no_ref_case_uuids, realization: [0, 1] })
        .ensembles();
      if ((await ens.length()) > 0) {
        const refs = await (await ens.get(0)).reference_realizations();
        assert((await refs.length()) == 1 || (await refs.length()) == 2);
        const refids = await refs.realizationids();
        assert(new Set(refids).difference(new Set([0, 1])).size == 0);
      }
    }
  });
});

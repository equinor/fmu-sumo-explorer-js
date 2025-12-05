import { LRUCache } from "lru-cache";

import assert from "node:assert";

function _gen_filter_none() {
  return [null, null];
}

function _gen_filter_id() {
  return (value) => {
    if (value === null) {
      return [null, null];
    } else {
      return [
        {
          ids: {
            values: Array.isArray(value) ? value : [value],
          },
        },
        null,
      ];
    }
  };
}

function _gen_filter_gen(attr) {
  return (value) => {
    if (value === null) {
      return [null, null];
    } else if (value === true) {
      return [{ exists: { field: attr } }, null];
    } else if (value === false) {
      return [null, { exists: { field: attr } }];
    } else if (Array.isArray(value)) {
      return [{ terms: { [attr]: value } }, null];
    } else {
      return [{ term: { [attr]: value } }, null];
    }
  };
}

function _gen_filter_stage(attr) {
  const inner = _gen_filter_gen(attr);
  return (value) => {
    if (value == "iteration" || value == "ensemble") {
      return inner(["iteration", "ensemble"]);
    } else if (
      Array.isArray(value) &&
      ("iteration" in value || "ensemble" in value)
    ) {
      return inner(
        Array.from(new Set(value).union(new Set(["iteration", "ensemble"]))),
      );
    } else {
      return inner(value);
    }
  };
}

function _gen_filter_name() {
  return (value) => {
    if (value === null) {
      return [null, null];
    } else {
      return [
        {
          bool: {
            minimum_should_match: 1,
            should: [
              { term: { "data.name.keyword": value } },
              {
                bool: {
                  must: [
                    { term: { "class.keyword": "case" } },
                    { term: { "fmu.case.name.keyword": value } },
                  ],
                },
              },
            ],
          },
        },
        null,
      ];
    }
  };
}

function _gen_filter_time() {}

function _gen_filter_bool(attr) {
  return (value) => {
    if (value === null) {
      return [null, null];
    } else {
      return [{ term: { attr: value } }, null];
    }
  };
}

function _gen_filter_complex() {
  return (value) => {
    if (value === null) {
      return [null, null];
    } else {
      return [value, null];
    }
  };
}

const _filterspec = {
  id: [_gen_filter_id, null],
  cls: [_gen_filter_gen, "class.keyword"],
  time: [_gen_filter_time, null],
  name: [_gen_filter_name, null],
  uuid: [_gen_filter_gen, "fmu.case.uuid.keyword"],
  relative_path: [_gen_filter_gen, "file.relative_path.keyword"],
  tagname: [_gen_filter_gen, "data.tagname.keyword"],
  dataformat: [_gen_filter_gen, "data.format.keyword"],
  ensemble: [_gen_filter_gen, "fmu.ensemble.name.keyword"],
  realization: [_gen_filter_gen, "fmu.realization.id"],
  aggregation: [_gen_filter_gen, "fmu.aggregation.operation.keyword"],
  stage: [_gen_filter_stage, "fmu.context.stage.keyword"],
  column: [_gen_filter_gen, "data.spec.columns.keyword"],
  vertical_domain: [_gen_filter_gen, "data.vertical_domain.keyword"],
  content: [_gen_filter_gen, "data.content.keyword"],
  status: [_gen_filter_gen, "_sumo.status.keyword"],
  user: [_gen_filter_gen, "fmu.case.user.id.keyword"],
  asset: [_gen_filter_gen, "access.asset.name.keyword"],
  field: [_gen_filter_gen, "masterdata.smda.field.identifier.keyword"],
  stratigraphic: [_gen_filter_bool, "data.stratigraphic"],
  is_observation: [_gen_filter_bool, "data.is_observation"],
  is_prediction: [_gen_filter_bool, "data.is_prediction"],
  standard_result: [_gen_filter_gen, "data.standard_result.name.keyword"],
  entity: [_gen_filter_gen, "fmu.entity.uuid.keyword"],
  complex: [_gen_filter_complex, null],
  has: [_gen_filter_none, null],
};

function _gen_filters(spec) {
  let res = {};
  Object.entries(spec).forEach(([name, desc]) => {
    const [gen, param] = desc;
    if (param === null) {
      res[name] = gen();
    } else {
      res[name] = gen(param);
    }
  });
  return res;
}

const _filters = _gen_filters(_filterspec);

function get_filter(key) {
  const fn = _filters[key];
  if (fn === undefined) {
    throw `No filter defined for "${key}"`;
  }
  // ELSE
  return fn;
}

function _build_bucket_query(query, field, size) {
  return {
    size: 0,
    query: query,
    aggs: {
      [field]: {
        composite: {
          size: size,
          sources: [{ [field]: { terms: { field: field } } }],
        },
      },
    },
  };
}

function _build_bucket_query_simple(query, field, size) {
  return {
    size: 0,
    query: query,
    aggs: { [field]: { terms: { field: field, size: size } } },
  };
}

function _set_after_key(query, field, after_key) {
  if (after_key !== null) {
    query.aggs[field].composite.after = after_key;
  }
  return query;
}

function _set_search_after(query, after) {
  if (after !== null) {
    query.search_after = after;
  }
  return query;
}

class Pit {
  sumo;
  #keepalive;
  #id;

  constructor(sumo, keepalive, id) {
    this.sumo = sumo;
    this.#keepalive = keepalive;
    this.#id = id;
  }

  static async create(sumo, keepalive = "5m") {
    const resp = await sumo.post("/pit", null, {
      "keep-alive": keepalive,
    });
    const { id } = resp.data;
    return new Pit(sumo, keepalive, id);
  }

  async destroy() {
    if (this.#id !== null) {
      await this.sumo.delete("/pit", { id: this.#id });
      this.#id = null;
    }
  }

  stamp_query(query) {
    query.pit = { id: this.#id, keep_alive: this.#keepalive };
    return query;
  }

  update_from_result(result) {
    this.#id = result.pit_id;
  }
}

function JS(v) {
  return JSON.stringify(v, null, 2);
}

class SearchContext {
  sumo;
  must;
  must_not;
  #hidden;
  #visible;
  #select;
  #hits;
  #cache;
  #length;
  #field_values;
  #field_values_and_counts;

  constructor(
    sumo,
    { must = [], must_not = [], hidden = false, visible = true } = {},
  ) {
    this.sumo = sumo;
    this.must = must.slice();
    this.must_not = must_not.slice();
    this.#hidden = hidden;
    this.#visible = visible;
    this.#hits = null;
    this.#cache = new LRUCache({ max: 200 });
    this.#length = null;
    this.#field_values = {};
    this.#field_values_and_counts = {};
  }

  query() {
    let must = this.must.slice();
    let must_not = this.must_not.slice();
    if (this.#visible && !this.#hidden) {
      must_not.push({ term: { "_sumo.hidden": true } });
    } else if (!this.#visible && this.#hidden) {
      must.push({ term: { "_sumo.hidden": true } });
    }
    return {
      bool: {
        ...(must.length > 0 && { must }),
        ...(must_not.length > 0 && { must_not }),
      },
    };
  }

  async to_sumo(obj) {
    const {
      Case,
      Ensemble,
      Realization,
      Cases,
      Ensembles,
      Realizations,
      CPGrid,
      CPGridProperty,
      Cube,
      Dictionary,
      Polygons,
      Surface,
      Table,
    } = await import("../objects.js");
    const cls = obj._source.class;
    const constructor = {
      case: Case,
      cube: Cube,
      dictionary: Dictionary,
      polygons: Polygons,
      surface: Surface,
      table: Table,
      cpgrid: CPGrid,
      cpgrid_property: CPGridProperty,
      ensemble: Ensemble,
      iteration: Ensemble,
      realization: Realization,
    }[cls];
    assert(constructor !== undefined);
    return new constructor(this.sumo, obj);
  }

  async length() {
    if (this.#hits !== null) {
      return this.#hits.length;
    }
    if (this.#length === null) {
      this.#length = (
        await this.sumo.post("/count", { query: await this.query() })
      ).data.count;
    }
    return this.#length;
  }

  async __search_all(query, { size = 1000, select = false } = {}) {
    let qdoc = {
      query,
      size,
      _source: select,
      sort: { _doc: { order: "asc" } },
    };
    const tot_count = (await this.sumo.post("/count", { query })).data.count;
    if (tot_count <= size) {
      const res = await this.sumo.post("/search", qdoc);
      const hits = res.data.hits.hits;
      return select === false ? hits.map((h) => h._id) : hits;
    } else {
      let all_hits = [];
      let after = null;
      const pit = await Pit.create(this.sumo, "1m");
      while (true) {
        qdoc = pit.stamp_query(_set_search_after(qdoc, after));
        const res = await this.sumo.post("/search", qdoc);
        pit.update_from_result(res.data);
        const hits = res.data.hits.hits;
        if (hits.length === 0) {
          break;
        }
        after = hits.at(-1).sort;
        all_hits = all_hits.concat(
          select === false ? hits.map((h) => h._id) : hits,
        );
      }
      await pit.destroy();
      return all_hits;
    }
  }

  async _search_all(select = false) {
    return await this.__search_all(await this.query(), {
      size: 1000,
      select: false,
    });
  }

  /**
   * Get a list of buckets
   *
   * @param {str} field - a field in the metadata
   *
   * returns - a list of unique values and counts {key, doc_count}
   */
  async _get_buckets(field) {
    const buckets_per_batch = 1000;
    // fast path: try without Pit
    let query = _build_bucket_query_simple(
      await this.query(),
      field,
      buckets_per_batch,
    );
    const res = (await this.sumo.post("/search", query)).data;
    const other_docs_count = res.aggregations[field].sum_other_doc_count;
    if (other_docs_count == 0) {
      let buckets = res.aggregations[field].buckets;
      return buckets.map(({ key, doc_count }) => ({ key, doc_count }));
    }
    // ELSE
    query = _build_bucket_query(await this.query(), field, buckets_per_batch);
    let all_buckets = [];
    let after_key = null;
    const pit = Pit.create(this.sumo, "1m");
    while (true) {
      query = pit.stamp_query(_set_after_key(query, field, after_key));
      res = (await this.sumo.post("/search", query)).data;
      pit.update_from_result(res);
      let buckets = res.aggregations[field].buckets;
      after_key = res.aggregations[field].after_key;
      buckets = buckets.map(({ key, doc_count }) => ({
        key: key[field],
        doc_count,
      }));
      all_buckets = all_buckets.concat(buckets);
      if (buckets.length < buckets_per_batch) {
        break;
      }
    }

    await pit.destroy();
    return all_buckets;
  }

  async get_field_values(field) {
    if (!(field in this.#field_values)) {
      const buckets = await this._get_buckets(field);
      this.#field_values[field] = buckets.map(({ key }) => key);
    }
    return this.#field_values[field];
  }

  async get_field_values_and_counts(field) {
    if (!(field in this.#field_values_and_counts)) {
      this.#field_values_and_counts[field] = await this._get_buckets(field);
    }
    return this.#field_values_and_counts[field];
  }

  async match_field_values(field, patterns) {
    const qdoc = {
      query: await this.query(),
      size: 0,
      aggs: {
        values: {
          terms: {
            field,
            include: patterns.join("|"),
            size: 1000,
          },
        },
      },
    };
    const res = (await this.sumo.post("/search", qdoc)).data;
    return res.aggregations.values.buckets.map(({ key }) => key);
  }

  async getuuids() {
    return await this._search_all();
  }

  async uuids() {
    if (this.#hits === null) {
      this.#hits = await this.getuuids();
    }
    return this.#hits;
  }

  async _maybe_prefetch(index) {
    assert(this.#hits !== null);
    assert(index <= this.#hits.length);
    const uuid = this.#hits[index];
    if (this.#cache.has(uuid)) {
      return;
    }
    // ELSE
    const uuids = this.#hits
      .slice(index, Math.min(index + 100, this.#hits.length))
      .filter((u) => !this.#cache.has(u));
    const hits = await this.__search_all(
      { ids: { values: uuids } },
      { select: this.#select },
    );
    hits.forEach((hit) => this.#cache.set(hit._id, hit));
    return;
  }

  [Symbol.asyncIterator]() {
    const sc = this;
    const batchsize = 100;
    let hits = [];
    let uuids = null;
    return {
      next: async () => {
        if (hits.length == 0) {
          if (uuids == null) {
            uuids = (await this.uuids()).slice();
          }
          const batch = uuids.splice(0, batchsize);
          if (batch.length > 0) {
            const qdoc = {
              query: {
                ids: { values: batch },
              },
              size: batchsize,
              _source: this.#select,
            };
            const resp = await this.sumo.post("/search", qdoc);
            const map = new Map(resp.data.hits.hits.map((h) => [h["_id"], h]));
            hits = batch.map((id) => map.get(id));
          }
        }
        if (hits.length == 0) {
          return { done: true };
        } else {
          return { done: false, value: await this.to_sumo(hits.shift()) };
        }
      },
    };
  }

  async get(index) {
    const uuids = await this.uuids();
    assert(index < uuids.length);
    return await this.get_object(uuids[index]);
  }

  async single() {
    const uuids = await this.uuids();
    assert(uuids.length == 1);
    return await this.get_object(uuids[0]);
  }

  _ensemble_or_realization_query(uuid) {
    return {
      query: {
        bool: {
          minimum_should_match: 1,
          should: [
            { term: { "fmu.ensemble.uuid.keyword": uuid } },
            { term: { "fmu.iteration.uuid.keyword": uuid } },
            { term: { "fmu.realization.uuid.keyword": uuid } },
          ],
        },
      },
      size: 1,
      _source: {
        includes: [
          "$schema",
          "class",
          "source",
          "version",
          "access",
          "masterdata",
          "fmu.case",
          "fmu.iteration",
          "fmu.ensemble",
          "fmu.realization",
        ],
      },
    };
  }

  _patch_ensemble_or_realization(uuid, hits) {
    if (hits.length === 1) {
      const obj = hits[0]._source;
      if (obj.fmu.ensemble.uuid == uuid) {
        obj.class = "ensemble";
        delete obj.fmu.realization;
      } else if (obj.fmu.realization.uuid == "realization") {
        obj.class = "realization";
      }
    }
  }

  async _get_ensemble_or_realization(uuid) {
    const query = this._ensemble_or_realization_query(uuid);
    const res = await this.sumo.post("/search", query);
    const hits = res.data.hits.hits;
    this._patch_ensemble_or_realization(uuid, hits);
    return hits;
  }

  async get_object(uuid) {
    let obj = this.#cache.get(uuid);
    if (!obj) {
      const query = {
        query: { ids: { values: [uuid] } },
        size: 1,
        _source: this.#select,
      };
      let res = await this.sumo.post("/search", query);
      let hits = res.data.hits.hits;
      if (hits.length == 0) {
        hits = await this._get_ensemble_or_realization(uuid);
        if (hits.length == 0) {
          throw `Document not found: ${uuid}.`;
        }
      }
      obj = hits[0];
      this.#cache.set(uuid, obj);
    }
    return await this.to_sumo(obj);
  }

  /**
   * Specify what should be returned from elasticsearch.
   * Has the side effect of clearing the lru cache.
   * @param sel - sel is either a single string value, a list of string value,
   * or a dictionary with keys "includes" and/or "excludes" and the values are
   * lists of strings. The string values are nested property names.
   *
   * This method returns itself, so it is chainable, but the select
   * settings will not propagate into a new SearchContext
   * (specifically, it will not be passed into the result of .filter()).
   *
   * @returns {SearchContext} itself.
   */
  select(sel) {
    const required = new Set(["class"]);
    const extreq = (lst) => {
      if (typeof lst == "string") {
        lst = [lst];
      }
      return Array.from(required.union(new Set(lst)));
    };

    let slct = null;
    if (typeof sel == "string") {
      slct = extreq(sel);
    } else if (Array.isArray(sel)) {
      slct = extreq(sel);
    } else if (typeof sel == "object") {
      let { excludes, includes } = sel;
      includes = includes ? extreq(includes) : null;
      slct = { ...(includes && { includes }), ...(excludes && { excludes }) };
    }
    if (slct !== null) {
      this.#select = slct;
      this.#cache.clear();
    }
    return this;
  }

  filter(args) {
    const must = this.must.slice();
    const must_not = this.must_not.slice();
    Object.entries(args).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const fn = get_filter(key);
        const [m, mn] = fn(value);
        if (m) {
          must.push(m);
        }
        if (mn) {
          must_not.push(mn);
        }
      }
    });
    return new SearchContext(this.sumo, {
      must,
      must_not,
      hidden: this.#hidden,
      visible: this.#visible,
    });
  }

  hidden() {
    return new SearchContext(this.sumo, {
      must: this.must,
      must_not: this.must_not,
      hidden: true,
      visible: false,
    });
  }

  visible() {
    return new SearchContext(this.sumo, {
      must: this.must,
      must_not: this.must_not,
      hidden: true,
      visible: false,
    });
  }

  all() {
    return new SearchContext(this.sumo, {
      must: this.must,
      must_not: this.must_not,
      hidden: true,
      visible: true,
    });
  }

  async cases() {
    const { Cases } = await import("./cases.js");
    const uuids = await this.get_field_values("fmu.case.uuid.keyword");
    const [must, must_not] = get_filter("id")(uuids);
    return new Cases(this.sumo, {
      ...(must && { must: [must] }),
      ...(must_not && { must_not: [must_not] }),
    });
  }

  async ensembles() {
    const { Ensembles } = await import("./ensembles.js");
    const uuids = await this.get_field_values("fmu.ensemble.uuid.keyword");
    const [must, must_not] = get_filter("id")(uuids);
    return new Ensembles(this.sumo, {
      ...(must && { must: [must] }),
      ...(must_not && { must_not: [must_not] }),
    });
  }

  async realizations() {
    const { Realizations } = await import("./realizations.js");
    const uuids = await this.get_field_values("fmu.realization.uuid.keyword");
    const [must, must_not] = get_filter("id")(uuids);
    return new Realizations(this.sumo, {
      ...(must && { must: [must] }),
      ...(must_not && { must_not: [must_not] }),
    });
  }

  surfaces() {
    return this.filter({ cls: "surface" });
  }

  tables() {
    return this.filter({ cls: "table" });
  }

  dictionaries() {
    return this.filter({ cls: "dictionary" });
  }

  polygons() {
    return this.filter({ cls: "polygons" });
  }

  cubes() {
    return this.filter({ cls: "cube" });
  }

  cpgrids() {
    return this.filter({ cls: "cpgrid" });
  }

  cpgrid_properties() {
    return this.filter({ cls: "cpgrid_property" });
  }

  parameters() {
    return this.filter({
      complex: {
        bool: {
          must: [
            { term: { "data.name.keyword": "parameters" } },
            { term: { "data.content.keyword": "parameters" } },
          ],
          should: [
            {
              bool: {
                must: [
                  { term: { "class.keyword": "dictionary" } },
                  {
                    exists: {
                      field: "fmu.realization.id",
                    },
                  },
                ],
              },
            },
            {
              bool: {
                must: [
                  { term: { "class.keyword": "table" } },
                  {
                    exists: {
                      field: "fmu.aggregation.operation",
                    },
                  },
                ],
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    });
  }

  async get_object_by_class_and_uuid(cls, uuid) {
    const obj = await this.get_object(uuid);
    assert(obj.metadata["class"] == cls);
    return obj;
  }

  async get_case_by_uuid(uuid) {
    return await this.get_object_by_class_and_uuid("case", uuid);
  }

  __prepare_verify_aggregation_query() {
    let aggs = {};
    for (const field of [
      "class",
      "fmu.case.uuid",
      "fmu.ensemble.name",
      "fmu.entity.uuid",
    ]) {
      aggs[field] = { terms: { field: field + ".keyword", size: 1 } };
    }
    return {
      query: this.query(),
      size: 0,
      track_total_hits: true,
      aggs,
    };
  }

  __verify_aggregation_operation(sres) {
    const tot_hits = sres.hits.total.value;
    if (tot_hits == 0) {
      throw "No matching realizations found.";
    }
    let conflicts = [];
    for (let [k, v] of Object.entries(sres.aggregations)) {
      if (
        v.sum_other_doc_count ||
        (v.buckets &&
          v.buckets.length > 0 &&
          v.buckets[0].doc_count != tot_hits)
      ) {
        conflicts.push(k);
      }
    }
    if (conflicts.length > 0) {
      throw `Conflicting values for ${conflicts}`;
    }
    const entityuuid = sres.aggregations["fmu.entity.uuid"]["buckets"][0].key;
    const caseuuid = sres.aggregations["fmu.case.uuid"]["buckets"][0].key;
    const ensemblename =
      sres.aggregations["fmu.ensemble.name"]["buckets"][0].key;
    const classname = sres.aggregations["class"]["buckets"][0].key;
    return { caseuuid, ensemblename, entityuuid, classname, tot_hits };
  }

  async _verify_aggregation_operation(columns) {
    const sc = this.filter({ column: columns });
    const query = sc.__prepare_verify_aggregation_query();
    const sres = await sc.sumo.post("/search", query);
    const { caseuuid, ensemblename, entityuuid, classname, tot_hits } =
      this.__verify_aggregation_operation(sres.data);
    if (
      classname != "surface" &&
      Array.isArray(columns) &&
      columns.length == 1
    ) {
      const sc = new SearchContext(this.sumo).filter({
        cls: classname,
        realization: true,
        entity: entityuuid,
        ensemble: ensemblename,
        column: columns,
      });
      if ((await sc.length()) != tot_hits) {
        throw "Filtering on realization is not allowed for table and parameter aggregation.";
      }
    }
    return { caseuuid, ensemblename, entityuuid, classname, tot_hits };
  }

  __prepare_aggregation_spec({
    caseuuid,
    ensemblename,
    entityuuid,
    classname,
    operation,
    columns,
  }) {
    const spec = {
      case_uuid: caseuuid,
      class: classname,
      entity_uuid: entityuuid,
      ensemble_name: ensemblename,
      operations: [operation],
    };
    if (columns) {
      spec.columns = columns;
    }
    return spec;
  }

  async _aggregate({ operation, columns, no_wait = false }) {
    const { caseuuid, ensemblename, entityuuid, classname } =
      await this._verify_aggregation_operation(columns);
    const spec = this.__prepare_aggregation_spec({
      caseuuid,
      ensemblename,
      entityuuid,
      classname,
      operation,
      columns,
    });
    spec.object_ids = await this.uuids();
    const res = await this.sumo.post("/aggregations", spec);
    if (no_wait) {
      return res;
    }
    const pollres = await this.sumo.poll(res);
    return this.to_sumo(pollres.data);
  }

  async aggregate({ operation, columns, no_wait = false }) {
    assert(
      !columns || columns.length == 1,
      "Exactly one column required for collection aggregation.",
    );
    let sc = this.filter({ realization: true, column: columns });
    if ((await this.hidden().length()) > 0) {
      sc = sc.hidden();
    }
    return sc._aggregate({ columns, operation, no_wait });
  }

  async batch_aggregate({ operation, columns, no_wait = false }) {
    assert(operation == "collection");
    assert(Array.isArray(columns) && columns.length > 0);
    assert(
      columns.length < 1000,
      "Maximum 1000 columns allowed for a single call to batch_aggregate.",
    );
    let sc = this.filter({ realization: true, column: columns });
    if ((await sc.hidden().length()) > 0) {
      sc = sc.hidden();
    }
    const res = sc._aggregate({ operation, columns, no_wait });
    if (no_wait) {
      return res;
    }
    return this.sumo.poll(res);
  }

  reference_realizations() {
    return this.filter({
      cls: "realization",
      complex: { term: { "fmu.realization.is_reference": true } },
    });
  }

  /**
   * List of unique realization ids.
   */
  async realizationids() {
    return await this.get_field_values("fmu.realization.id");
  }

  /**
   * List of unique stratigraphic column names.
   */
  async stratcolumnidentifiers() {
    return await this.get_field_values(
      "masterdata.smda.stratigraphic_column.identifier.keyword",
    );
  }

  /**
   * List of unique field names.
   */
  async fieldidentifiers() {
    return await this.get_field_values(
      "masterdata.smda.field.identifier.keyword",
    );
  }

  /**
   * List of unique asset names.
   */
  async assets() {
    return await this.get_field_values("access.asset.name.keyword");
  }

  /**
   * List of unique user names.
   */
  async users() {
    return await this.get_field_values("fmu.case.user.id.keyword");
  }

  /**
   * List of unique case statuses.
   */
  async statuses() {
    return await this.get_field_values("_sumo.status.keyword");
  }

  /**
   * List of unique column names.
   */
  async columns() {
    return await this.get_field_values("data.spec.columns.keyword");
  }

  /**
   * List of unique contents.
   */
  async contents() {
    return await this.get_field_values("data.content.keyword");
  }

  /**
   * List of unique object vertical domains.
   */
  async vertical_domains() {
    return await this.get_field_values("data.vertical_domain.keyword");
  }

  /**
   * List of unique stages.
   */
  async stages() {
    return await this.get_field_values("fmu.context.stage.keyword");
  }

  /**
   * List of unique object aggregation operations.
   */
  async aggregations() {
    return await this.get_field_values("fmu.aggregation.operation.keyword");
  }

  /**
   * List of unique data.format values.
   */
  async dataformats() {
    return await this.get_field_values("data.format.keyword");
  }

  /**
   * List of unique object tagnames.
   */
  async tagnames() {
    return await this.get_field_values("data.tagname.keyword");
  }

  /**
   * List of unique object names.
   */
  async names() {
    return await this.get_field_values("data.name.keyword");
  }

  /**
   * List of class names.
   */
  async classes() {
    return await this.get_field_values("class.keyword");
  }

  /**
   * List of standard result names.
   */
  async standard_results() {
    return await this.get_field_values("data.standard_result.name.keyword");
  }

  /**
   * List of entity uuids.
   */
  async entities() {
    return this.get_field_values("fmu.entity.uuid.keyword");
  }
}

export default SearchContext;

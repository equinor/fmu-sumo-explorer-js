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
    } else if (Array.isArray(value) && ("iteration" in value || "ensemble" in value)) {
      return inner(Array.from(new Set(value).union(new Set(["iteration", "ensemble"]))));
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

function _gen_filter_time() {
  return (value) => {
    if (value === null) {
      return [null, null];
    } else {
      return [value._get_query(), null];
    }
  };
}

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

function _build_composite_query(query, fields, size) {
  return {
    size: 0,
    query,
    aggs: {
      composite: {
        composite: {
          size,
          sources: Object.entries(fields).map(([k, v]) => ({
            [k]: { terms: { field: v } },
          })),
        },
      },
    },
  };
}

function _extract_composite_results(res) {
  const aggs = res.aggregations.composite;
  const after_key = aggs.after_key;
  const buckets = aggs.buckets.map(({ key }) => key);
  return [buckets, after_key];
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
  #sort;
  #limit;
  hits;
  #cache;
  #length;
  #field_values;
  #field_values_and_counts;

  /**
   * constructor
   * @param {SumoClient} sumo
   * @param {Object[]} must - List of terms that must match.
   * @param {Object[]} must_not - List of terms that must _not_ match
   * @param {boolean} [hidden=false] - Specifies whether this context should match `hidden` objects.
   * @param {boolean} [visible=true] - Specifies whether this context should match objects that are not `hidden`.
   */
  constructor(sumo, { must = [], must_not = [], hidden = false, visible = true } = {}) {
    this.sumo = sumo;
    this.must = must.slice();
    this.must_not = must_not.slice();
    this.#hidden = hidden;
    this.#visible = visible;
    this.#select = {
      excludes: ["fmu.realization.parameters"],
    };
    this.#sort = { _doc: { order: "asc" } };
    this.#limit = null;
    this.hits = null;
    this.#cache = new LRUCache({ max: 200 });
    this.#length = null;
    this.#field_values = {};
    this.#field_values_and_counts = {};
  }

  /**
   * Generate Elasticsearch query for context.
   * @returns {Object} Nested map containing a valid Elasticsearch query.
   */
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

  /**
   * Convert single search hit to instance of specific class.
   * @async
   * @param {Object} obj - Nested map describing object.
   * @returns {Object} Instance of one of the classes that fmu-sumo-explorer provides.
   */
  async to_sumo(obj) {
    const {
      Case,
      Ensemble,
      Realization,
      Cases,
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
      realization: Realization,
    }[cls];
    assert(constructor !== undefined);
    return new constructor(this.sumo, obj);
  }

  /**
   * Get number of objects matched by context.
   * @async
   * @returns {number}
   */
  async length() {
    if (this.hits !== null) {
      return this.hits.length;
    }
    if (this.#length === null) {
      this.#length = (await this.sumo.post("/count", { query: await this.query() })).data.count;
      if (this.#limit !== null) {
        this.#length = Math.min(this.#length, this.#limit);
      }
    }
    return this.#length;
  }

  async __search_all(query, { size = 1000, select = false } = {}) {
    let qdoc = {
      query,
      size,
      _source: select,
      sort: this.#sort,
    };
    let tot_count = (await this.sumo.post("/count", { query })).data.count;
    if (this.#limit !== null) {
      tot_count = Math.min(tot_count, this.#limit);
    }
    if (tot_count <= size) {
      qdoc.size = tot_count;
      const res = await this.sumo.post("/search", qdoc);
      const hits = res.data.hits.hits;
      return select === false ? hits.map((h) => h._id) : hits;
    } else {
      let all_hits = [];
      let after = null;
      const pit = await Pit.create(this.sumo, "1m");
      while (all_hits.length < tot_count) {
        qdoc = pit.stamp_query(_set_search_after(qdoc, after));
        if (this.#limit !== null) {
          qdoc.size = Math.min(size, tot_count - this.#limit);
        }
        const res = await this.sumo.post("/search", qdoc);
        pit.update_from_result(res.data);
        const hits = res.data.hits.hits;
        if (hits.length === 0) {
          break;
        }
        after = hits.at(-1).sort;
        all_hits = all_hits.concat(select === false ? hits.map((h) => h._id) : hits);
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
   * @private
   * @async
   * @param {str} field - a field in the metadata
   * @returns {Object[]} a list of unique values and counts {key, doc_count}
   */
  async _get_buckets(field) {
    const buckets_per_batch = 1000;
    // fast path: try without Pit
    let query = _build_bucket_query_simple(await this.query(), field, buckets_per_batch);
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
    const pit = await Pit.create(this.sumo, "1m");
    while (true) {
      query = pit.stamp_query(_set_after_key(query, field, after_key));
      const res = (await this.sumo.post("/search", query)).data;
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

  /**
   * Get unique values for property.
   * @async
   * @param {string} field - Property.
   * @returns {string[]}
   */
  async get_field_values(field) {
    if (!(field in this.#field_values)) {
      const buckets = await this._get_buckets(field);
      this.#field_values[field] = buckets.map(({ key }) => key);
    }
    return this.#field_values[field];
  }

  /**
   * Get unique values for property, along with their counts.
   * @async
   * @param {string} field - Property.
   * @returns {Object[]} a list of unique values and counts {key, doc_count}
   */
  async get_field_values_and_counts(field) {
    if (!(field in this.#field_values_and_counts)) {
      this.#field_values_and_counts[field] = await this._get_buckets(field);
    }
    return this.#field_values_and_counts[field];
  }

  /**
   * Get property values that match a list of patterns.
   * @async
   * @param {string} field - Property.
   * @param {string[]} patterns - List of regular expressions to match against.
   * @returns {string[]} List of matched values.
   */
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

  /**
   * Get composite aggregation.
   * @async
   * @param {Object.<string, string>} fields - Mapping from aggregation name to the property the values are fetched from.
   * @returns {Object[]} List of combinations of values.
   */
  async get_composite_agg(fields) {
    const buckets_per_batch = 1000;
    let query = _build_composite_query(this.query(), fields, buckets_per_batch);
    let all_buckets = [];
    let after_key = null;
    const pit = await Pit.create(this.sumo, "1m");
    while (true) {
      query = pit.stamp_query(_set_after_key(query, "composite", after_key));
      const res = (await this.sumo.post("/search", query)).data;
      pit.update_from_result(res);
      let [buckets, a_k] = _extract_composite_results(res);
      after_key = a_k;
      if (buckets.length == 0) {
        break;
      }
      all_buckets = all_buckets.concat(buckets);
      if (buckets.length < buckets_per_batch) {
        break;
      }
    }
    await pit.destroy();
    return all_buckets;
  }

  /**
   * Get uuids of hits matched by context.
   * @async
   * @returns {string[]}
   */
  async getuuids() {
    return await this._search_all();
  }

  /**
   * Get uuids of hits matched by context, but use cached value if there is one.
   * @async
   * @returns {string[]}
   */
  async uuids() {
    if (this.hits === null) {
      this.hits = await this.getuuids();
    }
    return this.hits;
  }

  /**
   * Prefetch documents if document indicated by index is not cached.
   * @private
   * @async
   * @param {number} index - index of document to fetch.
   */
  async _maybe_prefetch(index) {
    assert(this.hits !== null);
    assert(index <= this.hits.length);
    const uuid = this.hits[index];
    if (this.#cache.has(uuid)) {
      return;
    }
    // ELSE
    const uuids = this.hits
      .slice(index, Math.min(index + 100, this.hits.length))
      .filter((u) => !this.#cache.has(u));
    const hits = await this.__search_all({ ids: { values: uuids } }, { select: this.#select });
    const cache = this.#cache;
    hits.forEach((hit) => cache.set(hit._id, hit));
    return;
  }

  [Symbol.asyncIterator]() {
    const sc = this;
    let index = 0;
    return {
      next: async () => {
        await sc.uuids(); // ensure that we have a list of uuids
        if (index < sc.hits.length) {
          await sc._maybe_prefetch(index);
          const obj = await sc.get(index);
          index++;
          return { done: false, value: obj };
        } else {
          return { done: true };
        }
      },
    };
  }

  /**
   * Get document at specific index.
   * @async
   * @param {number} index - index of document to fetch.
   * @returns {}
   */
  async get(index) {
    const uuids = await this.uuids();
    assert(index < uuids.length);
    return await this.get_object(uuids[index]);
  }

  /**
   * Throw exception unless exactly 1 document is matched by context;
   * otherwise, return that document.
   * @async
   * @returns {Object}
   */
  async single() {
    const uuids = await this.uuids();
    assert(uuids.length == 1);
    return await this.get_object(uuids[0]);
  }

  /**
   * Get document with specific uuid.
   * @async
   * @param {string} uuid
   * @returns {Object}
   * @throws {string}
   */
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
        throw `Document not found: ${uuid}.`;
      }
      obj = hits[0];
      this.#cache.set(uuid, obj);
    }
    return await this.to_sumo(obj);
  }

  /**
   * Specify what should be returned from elasticsearch.
   * Has the side effect of clearing the lru cache.
   * @param {(string|string[]|Object[])} sel - sel is either a single string
   * value, a list of string value,
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

  /**
   * Set sort order.
   * @param {Object|Object[]} sortspec - A single sort specification, or a
   * list of sort specifications, each of which is a an object with a field
   * as key and a dictionary with key "order" and "asc" or "desc" as value.
   * The default is {"_doc": {"order": "asc"}}
   *
   * This method returns itself, so it is chainable, but the sort
   * settings will not propagate into a new SearchContext
   * (specifically, it will not be passed into the result of .filter()).
   *
   * @returns {SearchContext} itself.
   */
  sort(sortspec) {
    this.#sort = sortspec;
    this.hits = null;
    return this;
  }

  /**
   * Set max number of items to search. If set to null, there is no limit.
   * @param {number} [n=null]
   *
   * This method returns itself, so it is chainable, but the sort
   * settings will not propagate into a new SearchContext
   * (specifically, it will not be passed into the result of .filter()).
   *
   * @returns {}
   */
  limit(n = null) {
    this.#limit = n;
    this.#length = null;
    this.hits = null;
    return this;
  }

  /**
   * Narrow search context by adding search terms.
   * @param {Object.<string, (string|string[]|number|number[]|boolean)>} args - filter specifications.
   * @returns {SearchContext} new SearchContext.
   */
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

  /**
   * Select only hidden objects.
   * @returns {SearchContext} new SearchContext that only matches hidden objects.
   */
  hidden() {
    return new SearchContext(this.sumo, {
      must: this.must,
      must_not: this.must_not,
      hidden: true,
      visible: false,
    });
  }

  /**
   * Select only visible objects.
   * @returns {SearchContext} new SearchContext that only matches non-hidden objects.
   */
  visible() {
    return new SearchContext(this.sumo, {
      must: this.must,
      must_not: this.must_not,
      hidden: true,
      visible: false,
    });
  }

  /**
   * Select all objects.
   * @returns {SearchContext} new SearchContext that matches both hidden and non-hidden objects.
   */
  all() {
    return new SearchContext(this.sumo, {
      must: this.must,
      must_not: this.must_not,
      hidden: true,
      visible: true,
    });
  }

  /**
   * Select all case objects referenced in current context.
   * @async
   * @returns {Cases}
   */
  async cases() {
    const { Cases } = await import("./cases.js");
    const uuids = await this.get_field_values("fmu.case.uuid.keyword");
    return new Cases(this.sumo, uuids);
  }

  /**
   * Select all ensemble objects referenced in current context.
   * @async
   * @returns {Ensembles}
   */
  async ensembles() {
    const { Ensembles } = await import("./ensembles.js");
    const uuids = await this.get_field_values("fmu.ensemble.uuid.keyword");
    return new Ensembles(this.sumo, uuids);
  }

  /**
   * Select all realizations referenced in current context.
   * @async
   * @returns {Realizations}
   */
  async realizations() {
    const { Realizations } = await import("./realizations.js");
    const uuids = await this.get_field_values("fmu.realization.uuid.keyword");
    return new Realizations(this.sumo, uuids);
  }

  /**
   * Select surfaces in current context.
   * @returns {SearchContext} new SearchContext.
   */
  surfaces() {
    return this.filter({ cls: "surface" });
  }

  /**
   * Select tables in current context.
   * @returns {SearchContext} new SearchContext.
   */
  tables() {
    return this.filter({ cls: "table" });
  }

  /**
   * Select dictionaries in current context.
   * @returns {SearchContext} new SearchContext.
   */
  dictionaries() {
    return this.filter({ cls: "dictionary" });
  }

  /**
   * Select polygons in current context.
   * @returns {SearchContext} new SearchContext.
   */
  polygons() {
    return this.filter({ cls: "polygons" });
  }

  /**
   * Select cubes in current context.
   * @returns {SearchContext} new SearchContext.
   */
  cubes() {
    return this.filter({ cls: "cube" });
  }

  /**
   * Select grids in current context.
   * @returns {SearchContext} new SearchContext.
   */
  cpgrids() {
    return this.filter({ cls: "cpgrid" });
  }

  /**
   * Select grid properties in current context.
   * @returns {SearchContext} new SearchContext.
   */
  cpgrid_properties() {
    return this.filter({ cls: "cpgrid_property" });
  }

  /**
   * Select parameters in current context.
   * @returns {SearchContext} new SearchContext.
   */
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

  /**
   * Get an object by its uuid, and verify that it has the expecteed class.
   * @async
   * @param {string} cls - expected class of the object.
   * @param {string} uuid
   * @returns {Object}
   */
  async get_object_by_class_and_uuid(cls, uuid) {
    const obj = await this.get_object(uuid);
    assert(obj.metadata["class"] == cls);
    return obj;
  }

  /**
   * Get case object by its uuid.
   * @async
   * @param {} uuid
   * @returns {Case}
   */
  async get_case_by_uuid(uuid) {
    return await this.get_object_by_class_and_uuid("case", uuid);
  }

  __prepare_verify_aggregation_query() {
    let aggs = {};
    for (const field of ["class", "fmu.case.uuid", "fmu.ensemble.name", "fmu.entity.uuid"]) {
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
        (v.buckets && v.buckets.length > 0 && v.buckets[0].doc_count != tot_hits)
      ) {
        conflicts.push(k);
      }
    }
    if (conflicts.length > 0) {
      throw `Conflicting values for ${conflicts}`;
    }
    const entityuuid = sres.aggregations["fmu.entity.uuid"]["buckets"][0].key;
    const caseuuid = sres.aggregations["fmu.case.uuid"]["buckets"][0].key;
    const ensemblename = sres.aggregations["fmu.ensemble.name"]["buckets"][0].key;
    const classname = sres.aggregations["class"]["buckets"][0].key;
    return { caseuuid, ensemblename, entityuuid, classname, tot_hits };
  }

  async _verify_aggregation_operation(columns) {
    const sc = this.filter({ column: columns });
    const query = sc.__prepare_verify_aggregation_query();
    const sres = await sc.sumo.post("/search", query);
    const { caseuuid, ensemblename, entityuuid, classname, tot_hits } =
      this.__verify_aggregation_operation(sres.data);
    const sc2 = new SearchContext(this.sumo).filter({
      cls: classname,
      realization: true,
      entity: entityuuid,
      ensemble: ensemblename,
      column: columns,
    });
    const sc2_len = await sc2.length();
    let need_object_uuids = sc2_len != tot_hits;
    if (classname != "surface" && Array.isArray(columns) && columns.length == 1) {
      if (sc2_len != tot_hits) {
        throw `Filtering on realization is not allowed for table and parameter aggregation. Case: ${caseuuid}; ensemble: ${ensemblename}; entity: ${entityuuid}; columns: ${columns}; ${sc2_len} != ${tot_hits}`;
      }
    }
    return {
      caseuuid,
      ensemblename,
      entityuuid,
      classname,
      tot_hits,
      need_object_uuids,
    };
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
    const { caseuuid, ensemblename, entityuuid, classname, need_object_uuids } =
      await this._verify_aggregation_operation(columns);
    const spec = this.__prepare_aggregation_spec({
      caseuuid,
      ensemblename,
      entityuuid,
      classname,
      operation,
      columns,
    });
    if (need_object_uuids) {
      spec.object_ids = await this.uuids();
    }
    const res = await this.sumo.post("/aggregations", spec);
    if (no_wait) {
      return res;
    }
    const pollres = await this.sumo.poll(res);
    return this.to_sumo(pollres.data);
  }

  /**
   * Create a new aggregated object.
   * @async
   * @param {string} operation - the kind of aggregation to perform.
   * @param {?string[]} columns - the columns to aggregate (for table
   * aggregation). Note: for this operation, only a single column is
   * allowed.
   * @param {boolean} [no_wait=false] - If true, do not poll for result, but return a response object that can be used for polling later.
   * @returns {(Surface|Table|Object)}
   */
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

  /**
   * Aggregate multiple columns.
   * @async
   * @param {string} operation - the kind of aggregatiion to perform. Note:
   * only "collection" is allowed.
   * @param {string[]} columns - the columns to aggregate.
   * @param {boolean} [no_wait=false] - If true, do not poll for result, but return a response object that can be used for polling later.
   * @returns {Object}
   */
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

  /**
   * Select reference realizations in context.
   * @returns {SearchContext} new SearchContext.
   */
  reference_realizations() {
    return this.filter({
      cls: "realization",
      complex: { term: { "fmu.realization.is_reference": true } },
    });
  }

  /**
   * Get list of unique realization ids in context.
   * @async
   * @returns {number[]} list of realization ids.
   */
  async realizationids() {
    return await this.get_field_values("fmu.realization.id");
  }

  /**
   * Get list of unique stratigraphic column names in context.
   * @async
   * @returns {string[]} list of stratigraphic column identifiers.
   */
  async stratcolumnidentifiers() {
    return await this.get_field_values("masterdata.smda.stratigraphic_column.identifier.keyword");
  }

  /**
   * Get list of unique field names in context.
   * @async
   * @returns {string[]} list of field names.
   */
  async fieldidentifiers() {
    return await this.get_field_values("masterdata.smda.field.identifier.keyword");
  }

  /**
   * Get list of unique asset names in context.
   * @async
   * @returns {string[]} list of asset names.
   */
  async assets() {
    return await this.get_field_values("access.asset.name.keyword");
  }

  /**
   * Get list of unique user names in context.
   * @async
   * @returns {string[]} list of user names.
   */
  async users() {
    return await this.get_field_values("fmu.case.user.id.keyword");
  }

  /**
   * Get list of unique case statuses in context.
   * @async
   * @returns {string[]} list of statuses.
   */
  async statuses() {
    return await this.get_field_values("_sumo.status.keyword");
  }

  /**
   * Get list of unique column names in context.
   * @async
   * @returns {string[]} list of column names.
   */
  async columns() {
    return await this.get_field_values("data.spec.columns.keyword");
  }

  /**
   * Get list of unique contents in context.
   * @async
   * @returns {string[]} list of content types.
   */
  async contents() {
    return await this.get_field_values("data.content.keyword");
  }

  /**
   * Get list of unique object vertical domains in context.
   * @async
   * @returns {string[]} list of vertical domain names.
   */
  async vertical_domains() {
    return await this.get_field_values("data.vertical_domain.keyword");
  }

  /**
   * Get list of unique stages in context.
   * @async
   * @returns {string[]} list of stages.
   */
  async stages() {
    return await this.get_field_values("fmu.context.stage.keyword");
  }

  /**
   * Get list of unique object aggregation operations in context.
   * @async
   * @returns {string[]} list of aggregation operations.
   */
  async aggregations() {
    return await this.get_field_values("fmu.aggregation.operation.keyword");
  }

  /**
   * Get list of unique data.format values.
   * @async
   * @returns {string[]} list of formats.
   */
  async dataformats() {
    return await this.get_field_values("data.format.keyword");
  }

  /**
   * Get list of unique object tagnames in context.
   * @async
   * @returns {string[]} list of tagnames.
   */
  async tagnames() {
    return await this.get_field_values("data.tagname.keyword");
  }

  /**
   * Get list of unique object names in context.
   * @async
   * @returns {string[]} list of names.
   */
  async names() {
    return await this.get_field_values("data.name.keyword");
  }

  /**
   * Get list of class names in context.
   * @async
   * @returns {string[]} list of class names.
   */
  async classes() {
    return await this.get_field_values("class.keyword");
  }

  /**
   * Get list of standard result names in context.
   * @async
   * @returns {string[]} list of standard result names.
   */
  async standard_results() {
    return await this.get_field_values("data.standard_result.name.keyword");
  }

  /**
   * Get list of entity uuids in context.
   * @async
   * @returns {string[]} list of entity uuids.
   */
  async entities() {
    return this.get_field_values("fmu.entity.uuid.keyword");
  }
}

export default SearchContext;

import { LRUCache } from "lru-cache";

import assert from "node:assert";

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
  #index;
  #keepalive;
  #id;

  constructor(sumo, index, keepalive, id) {
    this.sumo = sumo;
    this.#index = index;
    this.#keepalive = keepalive;
    this.#id = id;
  }

  static async create(sumo, index, keepalive = "5m") {
    const resp = await sumo.post("/pit", null, {
      "keep-alive": keepalive,
      index,
    });
    const { id } = resp.data;
    return new Pit(sumo, index, keepalive, id);
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

class SearchContextBase {
  sumo;
  must;
  must_not;
  index;
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
   */
  constructor(sumo, { must = [], must_not = [], index } = {}) {
    assert(index);
    this.sumo = sumo;
    this.must = must.slice();
    this.must_not = must_not.slice();
    this.index = index;
    this.#select = {};
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
    return {
      bool: {
        ...(must.length > 0 && { must }),
        ...(must_not.length > 0 && { must_not }),
      },
    };
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
      this.#length = (
        await this.sumo.post("/count", { query: this.query() }, { index: this.index })
      ).data.count;
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
    let tot_count = (await this.sumo.post("/count", { query }, { index: this.index })).data.count;
    if (this.#limit !== null) {
      tot_count = Math.min(tot_count, this.#limit);
    }
    if (tot_count <= size) {
      qdoc.size = tot_count;
      const res = await this.sumo.post("/search", qdoc, { index: this.index });
      const hits = res.data.hits.hits;
      return select === false ? hits.map((h) => h._id) : hits;
    } else {
      let all_hits = [];
      let after = null;
      const pit = await Pit.create(this.sumo, this.index, "1m");
      while (all_hits.length < tot_count) {
        qdoc = pit.stamp_query(_set_search_after(qdoc, after));
        const res = await this.sumo.post("/search", qdoc, { index: this.index });
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
    return await this.__search_all(this.query(), {
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
    let query = _build_bucket_query_simple(this.query(), field, buckets_per_batch);
    const res = (await this.sumo.post("/search", query, { index: this.index })).data;
    const other_docs_count = res.aggregations[field].sum_other_doc_count;
    if (other_docs_count == 0) {
      let buckets = res.aggregations[field].buckets;
      return buckets.map(({ key, doc_count }) => ({ key, doc_count }));
    }
    // ELSE
    query = _build_bucket_query(this.query(), field, buckets_per_batch);
    let all_buckets = [];
    let after_key = null;
    const pit = await Pit.create(this.sumo, this.index, "1m");
    while (true) {
      query = pit.stamp_query(_set_after_key(query, field, after_key));
      const res = (await this.sumo.post("/search", query, { index: this.index })).data;
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
      query: this.query(),
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
    const res = (await this.sumo.post("/search", qdoc, { index: this.index })).data;
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
    const pit = await Pit.create(this.sumo, this.index, "1m");
    while (true) {
      query = pit.stamp_query(_set_after_key(query, "composite", after_key));
      const res = (await this.sumo.post("/search", query, { index: this.index })).data;
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
      let res = await this.sumo.post("/search", query, { index: this.index });
      let hits = res.data.hits.hits;
      if (hits.length == 0) {
        throw `Document not found: ${uuid}.`;
      }
      obj = hits[0];
      this.#cache.set(uuid, obj);
    }
    // hack: ensure that .id and .metadata works the same as for
    // the values returned from get_object in class SearchContext.
    obj.id = obj._id;
    obj.metadata = obj._source;
    return obj;
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
   * settings will not propagate into a new SearchContextBase
   * (specifically, it will not be passed into the result of .filter()).
   *
   * @returns {SearchContextBase} itself.
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
   * settings will not propagate into a new SearchContextBase
   * (specifically, it will not be passed into the result of .filter()).
   *
   * @returns {SearchContextBase} itself.
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
   * settings will not propagate into a new SearchContextBase
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

  filter(args) {
    const must = this.must.slice();
    const must_not = this.must_not.slice();
    Object.entries(args).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        assert(key == "complex");
        must.push(value);
      }
    });
    return new SearchContextBase(this.sumo, {
      must,
      must_not,
      index: this.index,
    });
  }
}

export default SearchContextBase;

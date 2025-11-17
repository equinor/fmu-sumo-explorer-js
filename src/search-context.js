import SumoClient from "./sumo-client.js";

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
      return inner(Array.from(new Set(value).union(["iteration", "ensemble"])));
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
      return value, null;
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
  iteration: [_gen_filter_gen, "fmu.iteration.name.keyword"], // FIXME: to be removed
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

const filters = _gen_filters(_filterspec);

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
  #sumo;
  #keepalive;
  #id;

  constructor(sumo, keepalive, id) {
    this.#sumo = sumo;
    this.#keepalive = keepalive;
    this.#id = id;
  }

  static async create(sumo, keepalive = "5m") {
    const resp = await pit.#sumo.post("/pit", null, {
      "keep-alive": pit.#keepalive,
    });
    const { id } = resp.data;
    return new Pit(sumo, keepalive, id);
  }

  async destroy() {
    if (this.#id !== null) {
      await this.#sumo.delete("/pit", { id: this.#id });
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

class SearchContext {
  #sumo;
  #must;
  #must_not;
  #hidden;
  #visible;
  #select;
  #hits;
  #cache;
  #length;

  constructor(
    sumo,
    { must = [], must_not = [], hidden = false, visible = true } = {},
  ) {
    this.#sumo = sumo;
    this.#must = must;
    this.#must_not = must_not;
    this.#hidden = hidden;
    this.#visible = visible;
    this.#hits = null;
    this.#cache = new LRUCache({ max: 200 });
    this.#length = null;
  }

  _query() {
    return {
      bool: {
        must: this.#must,
        must_not: this.#must_not,
      },
    };
  }

  filter(args) {
    let must = [...this.#must];
    let must_not = [...this.#must_not];
    Object.entries(args).forEach(([key, value]) => {
      console.log(`filter: ${key}`);
      const fn = filters[key];
      const [m, mn] = fn(value);
      console.log(`must: ${m}; must_not: ${mn}`);
      if (m !== null) {
        must.push(m);
      }
      if (mn !== null) {
        must_not.push(mn);
      }
    });
    return new SearchContext(this.#sumo, {
      must: must,
      must_not: must_not,
      hidden: this.#hidden,
      visible: this.#visible,
    });
  }

  async length() {
    if (this.#hits !== null) {
      return this.#hits.length;
    }
    if (this.#length === null) {
      this.#length = (
        await this.#sumo.post("/count", { query: this._query() })
      ).data.count;
    }
    return this.#length;
  }

  async __search_all(query, { size = 1000, select = false } = {}) {
    const qdoc = {
      query,
      size,
      _source: select,
      sort: { _doc: { order: "asc" } },
    };
    const tot_count = (await this.#sumo.post("/count", { query })).data.count;
    if (tot_count <= size) {
      const res = await this.#sumo.post("/search", qdoc);
      const hits = res.data.hits.hits;
      return select === false ? hits.map((h) => h._id) : hits;
    } else {
      let all_hits = [];
      let after = null;
      const pit = Pit.create(this.#sumo, "1m");
      while (true) {
        qdoc = pit.stamp_query(_set_search_after(qdoc, after));
        const res = await this.#sumo.post("/search", qdoc);
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
    return await this.__search_all(this._query(), {
      size: 1000,
      select: false,
    });
  }

  async uuids() {
    if (this.#hits === null) {
      this.#hits = await this._search_all();
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
    hits.forEach((hit) => this.#cache.put(hit._id, hit));
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
            uuids = await this.uuids();
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
            const resp = await this.#sumo.post("/search", qdoc);
            const map = new Map(resp.data.hits.hits.map((h) => [h["_id"], h]));
            hits = batch.map((id) => map.get(id));
          }
        }
        if (hits.length == 0) {
          return { done: true };
        } else {
          return { done: false, value: hits.shift() };
        }
      },
    };
  }
}

export default SearchContext;

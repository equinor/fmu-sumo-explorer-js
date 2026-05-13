/** Helper class for getting metrics from a  SearchContext */
class Metrics {
  #searchContext;

  /**
   * constructor
   * @param {SearchContextBase} search_context
   */
  constructor(search_context) {
    this.#searchContext = search_context;
  }

  async #aggregate(op, args) {
    const aggs = {
      agg: { [op]: args },
    };
    const qdoc = { query: this.#searchContext.query(), aggs: aggs, size: 0 };
    const { data } = await this.#searchContext.sumo.post("/search", qdoc);
    return data.aggregations.agg;
  }

  /**
   * Find the minimum value for the specified property across the
   * current set of objects.
   * @async
   * @param {string} field the name of a property in the metadata.
   * @returns the minimum value
   */
  async min(field) {
    return (await this.#aggregate("min", { field }))["value"];
  }

  /**
   * Find the maximum value for the specified property across the
   * current set of objects.
   * @async
   * @param {string} field the name of a property in the metadata.
   * @returns the maximum value
   */
  async max(field) {
    return (await this.#aggregate("max", { field }))["value"];
  }

  /**
   * Find the average value for the specified property across the
   * current set of objects.
   * @async
   * @param {string} field the name of a property in the metadata.
   * @returns the average value
   */
  async avg(field) {
    return (await this.#aggregate("avg", { field }))["value"];
  }

  /**
   * Find the sum value for the specified property across the
   * current set of objects.
   * @async
   * @param {string} field the name of a property in the metadata.
   * @returns the sum value
   */
  async sum(field) {
    return (await this.#aggregate("sum", { field }))["value"];
  }

  /**
   * Find the count of value for the specified property across the
   * current set of objects.
   * @async
   * @param {string} field the name of a property in the metadata.
   * @returns the total number of values
   */
  async value_count(field) {
    return (await this.#aggregate("value_count", { field }))["value"];
  }

  /**
   * Find the count of distinct values for the specified property across the
   * current set of objects.
   * @async
   * @param {string} field the name of a property in the metadata.
   * @returns the number of distinct values
   * @note The value returned is approximate.
   */
  async cardinality(field) {
    return (await this.#aggregate("cardinality", { field }))["value"];
  }

  /**
   * Compute a basic set of statistics of the values for the specified
   * property across the current set of objects.
   * @async
   * @param {string} field the name of a property in the metadata.
   * @returns a dictionary of statistical metrics.
   */
  async stats(field) {
    return await this.#aggregate("stats", { field });
  }

  /**
   * Compute an extended set of statistics of the values for the specified
   * property across the current set of objects.
   * @async
   * @param {string} field the name of a property in the metadata.
   * @returns a dictionary of statistical metrics.
   */
  async extended_stats(field) {
    return await this.#aggregate("extended_stats", { field });
  }

  /**
   * Find the values at specific percentiles for the specified
   * property across the current set of objects.
   * @async
   * @param {string} field the name of a property in the metadata.
   * @param {number[]} percents list of percent values. If omitted, uses
   * a default set of values.
   * @returns a dictionary of statistical metrics.
   */
  async percentiles(field, percents = undefined) {
    return (await this.#aggregate("percentiles", { field, ...(percents && { percents }) }))[
      "values"
    ];
  }

  #fnv1a_script(field) {
    return {
      init_script: `
                state.h = state.count = state.total = 0L;
            `,
      map_script: `
                state.total++;
                if (doc['${field}'].size() == 0) return;
                def s = doc.get('${field}').value;
                long h = -3750763034362895579L;
                for (int i = 0; i < s.length(); i++) {
                    h ^= (long) s.charAt(i);
                    h *= 1099511628211L;
                }
                state.h ^= h;
                state.count++;
            `,
      combine_script: `
                return state;
            `,
      reduce_script: `
                long h = 0, c = 0, t = 0;
                for (st in states) {
                    h ^= st.h; c += st.count; t += st.total
                }
                return ['checksum': Long.toHexString(h), 'docs_in_checksum': c, 'docs_total': t];
            `,
    };
  }

  /**
   * Compute the 64-bit FNV-1a checksum for field over the current set of objects.
   * @async
   * @param {string} field the name of a property in the metadata.
   * returns {Object} a dict with the keys "docs_all", "docs_seen" and "xor_fnv64_hex".
   */
  async fnv1a(field) {
    return await this.#aggregate("scripted_metric", this.#fnv1a_script(field));
  }
}

export default Metrics;

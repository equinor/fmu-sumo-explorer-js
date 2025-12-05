import SearchContext from "./search-context.js";

export class Ensembles extends SearchContext {
  #prototype;
  #map;

  async getuuids() {
    return this.get_field_values("fmu.ensemble.uuid.keyword");
  }

  async length() {
    return (await this.uuids()).length;
  }

  async get_object(uuid) {
    if (!this.#prototype) {
      const obj = await super.get_object(uuid);
      if (
        (await this.get_field_values("fmu.ensemble.uuid.keyword")).length == 1
      ) {
        return obj;
      }
      this.#prototype = obj.metadata;
      this.#prototype.class = "ensemble";
      const buckets = await this.get_composite_agg({
        uuid: "fmu.ensemble.uuid.keyword",
        name: "fmu.ensemble.name.keyword",
      });
      this.#map = {};
      for (let b of buckets) {
        const { uuid, name } = b;
        this.#map[uuid] = b;
      }
    }
    const b = this.#map[uuid];
    const metadata = {
      ...this.#prototype,
      ...{
        fmu: {
          ensemble: b,
        },
      },
    };
    return this.to_sumo({ _id: uuid, _source: metadata });
  }

  [Symbol.asyncIterator]() {
    const sc = this;
    let index = 0;
    let uuids = null;
    return {
      next: async () => {
        if (uuids == null) {
          uuids = await this.uuids();
        }
        if (index < uuids.length) {
          const uuid = uuids[index];
          const obj = await sc.get_object(uuid);
          index++;
          return { done: false, value: obj };
        } else {
          return { done: true };
        }
      },
    };
  }

  filter(args) {
    const sc = super.filter(args);
    const { sumo, must, must_not } = sc;
    return new Ensembles(sumo, { must, must_not });
  }

  async names() {
    return await this.get_field_values("fmu.ensemble.name.keyword");
  }
}

export default Ensembles;

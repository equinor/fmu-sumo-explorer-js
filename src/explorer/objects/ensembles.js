import SearchContext from "./search-context.js";

export class Ensembles extends SearchContext {
  constructor(sumo, uuids) {
    super(sumo, { must: [{ ids: { values: uuids } }] });
    this.hits = uuids;
  }

  async names() {
    return await this.get_field_values("fmu.ensemble.name.keyword");
  }
}

export default Ensembles;

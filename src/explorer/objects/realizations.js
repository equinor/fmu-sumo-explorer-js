import SearchContext from "./search-context.js";

export class Realizations extends SearchContext {
  constructor(sumo, uuids) {
    super(sumo, { must: [{ ids: { values: uuids } }] });
    this.hits = uuids;
  }

  async relizationids() {
    return await this.get_field_values("fmu.realization.id");
  }
}
export default Realizations;

import SearchContext from "./search-context.js";

export class Realizations extends SearchContext {
  constructor(sc, uuids) {
    super(sc.sumo, { filters: [SearchContext.gen_filter_pair(uuids, "id")] });
  }

  filter(args) {
    const sc = super.filter(args);
    const uuids = sc.get_field_values("fmu.realization.uuid.keyword");
    return new Realizations(sc, uuids);
  }

  async relizationids() {
    return await this.get_field_values("fmu.realization.id");
  }
}
export default Realizations;

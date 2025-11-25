import SearchContext from "./search-context.js";

export class Cases extends SearchContext {
  constructor(sc, uuids) {
    super(sc.sumo, { filters: [SearchContext.gen_filter_pair(uuids, "id")] });
  }

  filter(args) {
    const sc = super.filter(args);
    const uuids = sc.get_field_values("fmu.case.uuid.keyword");
    return new Cases(sc, uuids);
  }

  async names() {
    return await this.get_field_values("fmu.case.name.keyword");
  }
}

export default Cases;

import SearchContext from "./search-context.js";

export class Cases extends SearchContext {
  constructor(sumo, uuids) {
    super(sumo, { must: [{ ids: { values: uuids } }] });
    this.hits = uuids;
  }

  async names() {
    return await this.get_field_values("fmu.case.name.keyword");
  }
}

export default Cases;

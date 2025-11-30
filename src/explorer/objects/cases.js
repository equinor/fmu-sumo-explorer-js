import SearchContext from "./search-context.js";

export class Cases extends SearchContext {
  filter(args) {
    const sc = super.filter(args);
    const { sumo, must, must_not } = sc;
    return new Cases(sumo, { must, must_not });
  }

  async names() {
    return await this.get_field_values("fmu.case.name.keyword");
  }
}

export default Cases;

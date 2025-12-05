import SearchContext from "./search-context.js";

export class Cases extends SearchContext {
  async getuuids() {
    return this.get_field_values("fmu.case.uuid.keyword");
  }

  async length() {
    return (await this.uuids()).length;
  }

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

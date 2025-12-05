import SearchContext from "./search-context.js";

export class Ensembles extends SearchContext {
  async getuuids() {
    return this.get_field_values("fmu.ensemble.uuid.keyword");
  }

  async length() {
    return (await this.uuids()).length;
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

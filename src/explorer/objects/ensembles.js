import SearchContext from "./search-context.js";

export class Ensembles extends SearchContext {
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

import SearchContext from "./search-context.js";

export class Realizations extends SearchContext {
  filter(args) {
    const sc = super.filter(args);
    const { sumo, must, must_not } = sc;
    return new Realizations(sumo, { must, must_not });
  }

  async relizationids() {
    return await this.get_field_values("fmu.realization.id");
  }
}
export default Realizations;

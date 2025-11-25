import SearchContext from "./search-context.js";

export class Ensembles extends SearchContext {
  constructor(sc, uuids) {
    console.log(JSON.stringify(uuids, null, 2));
    super(sc.sumo, { filters: [SearchContext.gen_filter_pair(uuids, "id")] });
    console.log(JSON.stringify(this.query(), null, 2));
  }

  filter(args) {
    const sc = super.filter(args);
    const uuids = sc.get_field_values("fmu.ensemble.uuid.keyword");
    return new Ensembles(sc, uuids);
  }

  async names() {
    return await this.get_field_values("fmu.ensemble.name.keyword");
  }
}

export default Ensembles;

import SearchContext from "./search-context.js";

class Case extends SearchContext {
  sumo;
  id;
  metadata;
  constructor(sumo, { _id, _source }) {
    super(sumo, { must: [{ term: { "fmu.case.uuid.keyword": _id } }] });
    this.sumo = sumo;
    this.id = _id;
    this.metadata = _source;
  }

  field() {
    return this.metadata.masterdata.smda.field[0].identifier;
  }

  asset() {
    return this.metadata.access.asset.name;
  }

  user() {
    return this.metadata.fmu.case.user.id;
  }

  status() {
    return this.metadata._sumo.status;
  }

  name() {
    return this.metadata.fmu.case.name;
  }
}

export default Case;

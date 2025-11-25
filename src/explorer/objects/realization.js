import SearchContext from "./search-context.js";

class Realization extends SearchContext {
  sumo;
  id;
  metadata;
  constructor(sumo, { _id, _source }) {
    super(sumo, { must: [{ term: { "fmu.realization.uuid.keyword": _id } }] });
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

  name() {
    return this.metadata.fmu.realization.name;
  }

  realizationname() {
    return this.metadata.fmu.realization.name;
  }

  casename() {
    return this.metadata.fmu.case.name;
  }

  ensemblename() {
    return this.metadata.fmu.ensemble.name;
  }

  uuid() {
    return this.metadata.fmu.realization.uuid;
  }

  realizationuuid() {
    return this.metadata.fmu.realization.uuid;
  }

  caseuuid() {
    return this.metadata.fmu.case.uuid;
  }

  ensembleuuid() {
    return this.metadata.fmu.ensemble.uuid;
  }
}

export default Realization;

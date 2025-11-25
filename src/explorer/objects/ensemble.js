import SearchContext from "./search-context.js";

class Ensemble extends SearchContext {
  sumo;
  id;
  metadata;
  constructor(sumo, { _id, _source }) {
    super(sumo, { must: [{ term: { "fmu.ensemble.uuid.keyword": _id } }] });
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
    return this.metadata.fmu.ensemble.name;
  }

  ensemblename() {
    return this.metadata.fmu.ensemble.name;
  }

  casename() {
    return this.metadata.fmu.case.name;
  }

  uuid() {
    return this.metadata.fmu.ensemble.uuid;
  }

  ensembleuuid() {
    return this.metadata.fmu.ensemble.uuid;
  }

  caseuuid() {
    return this.metadata.fmu.case.uuid;
  }

  async reference_realizations() {
    const sc = await super.reference_realizations();
    if ((await sc.length()) > 0) {
      return sc;
    } // ELSE
    return await self.filter({ realization: [0, 1] }).realizations();
  }
}

export default Ensemble;

class DataObject {
  sumo;
  constructor(sumo, { _id, _source }) {
    this.sumo = sumo;
    this.id = _id;
    this.metadata = _source;
  }

  timestamp() {
    const t0 = this.metadata.data?.time?.t0?.value;
    const t1 = this.metadata.data?.time?.t1?.value;
    return t0 !== undefined && !t1 == undefined ? t0 : undefined;
  }

  interval() {
    const t0 = this.metadata.data?.time?.t0?.value;
    const t1 = this.metadata.data?.time?.t1?.value;
    return t0 !== undefined && !t1 != undefined ? t0 : undefined;
  }

  asset() {
    return this.metadata.access.asset.name;
  }

  spec() {
    return this.metadata.data.spec;
  }

  bbox() {
    return this.metadata.data.bbox;
  }

  dataformat() {
    return this.metadata.data.format;
  }

  format() {
    return this.metadata.data.format;
  }

  stage() {
    return this.metadata.fmu.context?.stage;
  }

  context() {
    return this.metadata.fmu.context?.stage;
  }

  aggregation() {
    return this.metadata.fmu.aggregation?.operation;
  }

  operationname() {
    return this.metadata.fmu.aggregation?.operation;
  }

  realization() {
    return this.metadata.fmu.realization?.id;
  }

  ensemble() {
    return this.metadata.fmu.ensemble?.name;
  }

  stratigraphic() {
    return this.metadata.data.stratigraphic;
  }

  columns() {
    return this.metadata.data.spec?.columns;
  }

  tagname() {
    return this.metadata.data.tagname;
  }

  content() {
    return this.metadata.data.content;
  }

  caseuuid() {
    return this.metadata.fmu.case.uud;
  }

  casename() {
    return this.metadata.fmu.case.name;
  }

  classname() {
    return this.metadata.class;
  }

  dataname() {
    return this.metadata.data.name;
  }

  name() {
    return this.metadata.data.name;
  }

  entity() {
    return this.metadata.fmu.entity?.uuid;
  }
}

export default DataObject;

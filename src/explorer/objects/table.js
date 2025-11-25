import DataObject from "./data-object.js";

class Table extends DataObject {
  constructor(sumo, { _id, _source }) {
    super(sumo, { _id, _source });
  }
}

export default Table;

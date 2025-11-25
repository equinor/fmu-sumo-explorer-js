import DataObject from "./data-object.js";

class Dictionary extends DataObject {
  constructor(sumo, { _id, _source }) {
    super(sumo, { _id, _source });
  }
}

export default Dictionary;

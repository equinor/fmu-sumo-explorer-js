import assert from "node:assert";

import DataObject from "./data-object.js";
import SearchContext from "./search-context.js";

class CPGridProperty extends DataObject {
  constructor(sumo, { _id, _source }) {
    super(sumo, { _id, _source });
  }

  _grid_setup() {
    const sc = new SearchContext(this.sumo).cpgrids().filter({
      uuid: this.caseuuid(),
      ensemble: this.ensemble(),
      realization: this.realization(),
      aggregation: this.aggregation(),
    });
    const should = [
      {
        term: { "data.name.keyword": this.tagname() },
      },
    ];
    const dgrp = this.metadata.data?.geometry?.relative_path;
    if (dgrp !== undefined) {
      should.push({
        term: { "file.relative_path.keyword": dgrp },
      });
    }
    return sc.filter({
      complex: {
        bool: {
          minimum_should_match: 1,
          should: should,
        },
      },
    });
  }

  async grid() {
    const sc = this._grid_setup();
    return await sc.single();
  }
}

export default CPGridProperty;

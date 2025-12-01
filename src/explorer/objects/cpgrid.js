import DataObject from "./data-object.js";
import SearchContext from "./search-context.js";

class CPGrid extends DataObject {
  constructor(sumo, { _id, _source }) {
    super(sumo, { _id, _source });
  }

  async grid_properties() {
    const sc = new SearchContext(this.sumo).filter({
      uuid: this.caseuuid(),
      ensemble: this.ensemble(),
      realization: this.realization(),
    });
    return sc.filter({
      complex: {
        bool: {
          minimum_should_match: 1,
          should: [
            {
              term: {
                "data.geometry.relative_path.keyword": this.relative_path(),
              },
            },
            {
              term: { "data.tagname.keyword": this.name() },
            },
          ],
        },
      },
    });
  }
}

export default CPGrid;

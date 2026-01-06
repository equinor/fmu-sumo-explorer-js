import SearchContext from "./objects/search-context.js";

class Explorer extends SearchContext {
  /**
   * constructor
   * @param {SumoClient} sumo
   */
  constructor(sumo) {
    super(sumo);
  }
}

export default Explorer;

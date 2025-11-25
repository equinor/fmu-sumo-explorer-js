import SearchContext from "./search-context.js";

import Case from "./case.js";
import Ensemble from "./ensemble.js";
import Realization from "./realization.js";

import Cases from "./cases.js";
import Ensembles from "./ensembles.js";
import Realizations from "./realizations.js";

import CPGrid from "./cpgrid.js";
import CPGridProperty from "./cpgrid-property.js";
import Cube from "./cube.js";
import Dictionary from "./dictionary.js";
import Polygons from "./polygons.js";
import Surface from "./surface.js";
import Table from "./table.js";

class Explorer extends SearchContext {
  constructor(sumo) {
    super(sumo);
  }
}

export {
  Case,
  Ensemble,
  Realization,
  Cases,
  Ensembles,
  Realizations,
  CPGrid,
  CPGridProperty,
  Cube,
  Dictionary,
  Polygons,
  Surface,
  Table,
};

## Classes

<dl>
<dt><a href="#SearchContext">SearchContext</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#GetExplorer">GetExplorer(env)</a> ⇒ <code>Explorer</code></dt>
<dd><p>Get Explorer instance.</p>
</dd>
</dl>

<a name="SearchContext"></a>

## SearchContext
**Kind**: global class  

* [SearchContext](#SearchContext)
    * [new SearchContext(sumo, must, must_not, [hidden], [visible])](#new_SearchContext_new)
    * [.query()](#SearchContext+query) ⇒ <code>Object</code>
    * [.to_sumo(obj)](#SearchContext+to_sumo) ⇒ <code>Object</code>
    * [.length()](#SearchContext+length) ⇒ <code>number</code>
    * [._get_buckets(field)](#SearchContext+_get_buckets) ⇒ <code>Array.&lt;Object&gt;</code>
    * [.get_field_values(field)](#SearchContext+get_field_values) ⇒ <code>Array.&lt;string&gt;</code>
    * [.get_field_values_and_counts(field)](#SearchContext+get_field_values_and_counts) ⇒ <code>Array.&lt;Object&gt;</code>
    * [.match_field_values(field, patterns)](#SearchContext+match_field_values) ⇒ <code>Array.&lt;string&gt;</code>
    * [.get_composite_agg(fields)](#SearchContext+get_composite_agg) ⇒ <code>Array.&lt;Object&gt;</code>
    * [.getuuids()](#SearchContext+getuuids) ⇒ <code>Array.&lt;string&gt;</code>
    * [.uuids()](#SearchContext+uuids) ⇒ <code>Array.&lt;string&gt;</code>
    * [._maybe_prefetch(index)](#SearchContext+_maybe_prefetch)
    * [.get(index)](#SearchContext+get) ⇒
    * [.single()](#SearchContext+single) ⇒ <code>Object</code>
    * [.get_object(uuid)](#SearchContext+get_object) ⇒ <code>Object</code>
    * [.select(sel)](#SearchContext+select) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.filter(args)](#SearchContext+filter) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.hidden()](#SearchContext+hidden) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.visible()](#SearchContext+visible) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.all()](#SearchContext+all) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.cases()](#SearchContext+cases) ⇒ <code>Cases</code>
    * [.ensembles()](#SearchContext+ensembles) ⇒ <code>Ensembles</code>
    * [.realizations()](#SearchContext+realizations) ⇒ <code>Realizations</code>
    * [.surfaces()](#SearchContext+surfaces) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.tables()](#SearchContext+tables) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.dictionaries()](#SearchContext+dictionaries) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.polygons()](#SearchContext+polygons) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.cubes()](#SearchContext+cubes) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.cpgrids()](#SearchContext+cpgrids) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.cpgrid_properties()](#SearchContext+cpgrid_properties) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.parameters()](#SearchContext+parameters) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.get_object_by_class_and_uuid(cls, uuid)](#SearchContext+get_object_by_class_and_uuid) ⇒ <code>Object</code>
    * [.get_case_by_uuid(uuid)](#SearchContext+get_case_by_uuid) ⇒ <code>Case</code>
    * [.aggregate(operation, columns, [no_wait])](#SearchContext+aggregate) ⇒ <code>Surface</code> \| <code>Table</code> \| <code>Object</code>
    * [.batch_aggregate(operation, columns, [no_wait])](#SearchContext+batch_aggregate) ⇒ <code>Object</code>
    * [.reference_realizations()](#SearchContext+reference_realizations) ⇒ [<code>SearchContext</code>](#SearchContext)
    * [.realizationids()](#SearchContext+realizationids) ⇒ <code>Array.&lt;number&gt;</code>
    * [.stratcolumnidentifiers()](#SearchContext+stratcolumnidentifiers) ⇒ <code>Array.&lt;string&gt;</code>
    * [.fieldidentifiers()](#SearchContext+fieldidentifiers) ⇒ <code>Array.&lt;string&gt;</code>
    * [.assets()](#SearchContext+assets) ⇒ <code>Array.&lt;string&gt;</code>
    * [.users()](#SearchContext+users) ⇒ <code>Array.&lt;string&gt;</code>
    * [.statuses()](#SearchContext+statuses) ⇒ <code>Array.&lt;string&gt;</code>
    * [.columns()](#SearchContext+columns) ⇒ <code>Array.&lt;string&gt;</code>
    * [.contents()](#SearchContext+contents) ⇒ <code>Array.&lt;string&gt;</code>
    * [.vertical_domains()](#SearchContext+vertical_domains) ⇒ <code>Array.&lt;string&gt;</code>
    * [.stages()](#SearchContext+stages) ⇒ <code>Array.&lt;string&gt;</code>
    * [.aggregations()](#SearchContext+aggregations) ⇒ <code>Array.&lt;string&gt;</code>
    * [.dataformats()](#SearchContext+dataformats) ⇒ <code>Array.&lt;string&gt;</code>
    * [.tagnames()](#SearchContext+tagnames) ⇒ <code>Array.&lt;string&gt;</code>
    * [.names()](#SearchContext+names) ⇒ <code>Array.&lt;string&gt;</code>
    * [.classes()](#SearchContext+classes) ⇒ <code>Array.&lt;string&gt;</code>
    * [.standard_results()](#SearchContext+standard_results) ⇒ <code>Array.&lt;string&gt;</code>
    * [.entities()](#SearchContext+entities) ⇒ <code>Array.&lt;string&gt;</code>

<a name="new_SearchContext_new"></a>

### new SearchContext(sumo, must, must_not, [hidden], [visible])
constructor


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| sumo | <code>SumoClient</code> |  |  |
| must | <code>Array.&lt;Object&gt;</code> |  | List of terms that must match. |
| must_not | <code>Array.&lt;Object&gt;</code> |  | List of terms that must _not_ match |
| [hidden] | <code>boolean</code> | <code>false</code> | Specifies whether this context should match `hidden` objects. |
| [visible] | <code>boolean</code> | <code>true</code> | Specifies whether this context should match objects that are not `hidden`. |

<a name="SearchContext+query"></a>

### searchContext.query() ⇒ <code>Object</code>
Generate Elasticsearch query for context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Object</code> - - Nested map containing a valid Elasticsearch query.  
<a name="SearchContext+to_sumo"></a>

### searchContext.to\_sumo(obj) ⇒ <code>Object</code>
Convert single search hit to instance of specific class.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Object</code> - - Instance of one of the classes that fmu-sumo-explorer provides.  

| Param | Type | Description |
| --- | --- | --- |
| obj | <code>Object</code> | Nested map describing object. |

<a name="SearchContext+length"></a>

### searchContext.length() ⇒ <code>number</code>
Get number of objects matched by context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
<a name="SearchContext+_get_buckets"></a>

### searchContext.\_get\_buckets(field) ⇒ <code>Array.&lt;Object&gt;</code>
Get a list of buckets

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;Object&gt;</code> - - a list of unique values and counts {key, doc_count}  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>str</code> | a field in the metadata |

<a name="SearchContext+get_field_values"></a>

### searchContext.get\_field\_values(field) ⇒ <code>Array.&lt;string&gt;</code>
Get unique values for property.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>string</code> | Property. |

<a name="SearchContext+get_field_values_and_counts"></a>

### searchContext.get\_field\_values\_and\_counts(field) ⇒ <code>Array.&lt;Object&gt;</code>
Get unique values for property, along with their counts.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;Object&gt;</code> - - a list of unique values and counts {key, doc_count}  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>string</code> | Property. |

<a name="SearchContext+match_field_values"></a>

### searchContext.match\_field\_values(field, patterns) ⇒ <code>Array.&lt;string&gt;</code>
Get property values that match a list of patterns.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - List of matched values.  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>string</code> | Property. |
| patterns | <code>Array.&lt;string&gt;</code> | List of regular expressions to match against. |

<a name="SearchContext+get_composite_agg"></a>

### searchContext.get\_composite\_agg(fields) ⇒ <code>Array.&lt;Object&gt;</code>
Get composite aggregation.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;Object&gt;</code> - - List of combinations of values.  

| Param | Type | Description |
| --- | --- | --- |
| fields | <code>Object.&lt;string, string&gt;</code> | Mapping from aggregation name to the property the values are fetched from. |

<a name="SearchContext+getuuids"></a>

### searchContext.getuuids() ⇒ <code>Array.&lt;string&gt;</code>
Get uuids of hits matched by context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
<a name="SearchContext+uuids"></a>

### searchContext.uuids() ⇒ <code>Array.&lt;string&gt;</code>
Get uuids of hits matched by context, but use cached value if there is one.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
<a name="SearchContext+_maybe_prefetch"></a>

### searchContext.\_maybe\_prefetch(index)
Prefetch documents if document indicated by index is not cached.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | index of document to fetch. |

<a name="SearchContext+get"></a>

### searchContext.get(index) ⇒
Get document at specific index.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  

| Param | Type | Description |
| --- | --- | --- |
| index | <code>number</code> | index of document to fetch. |

<a name="SearchContext+single"></a>

### searchContext.single() ⇒ <code>Object</code>
Throw exception unless exactly 1 document is matched by context; otherwise, return that document.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
<a name="SearchContext+get_object"></a>

### searchContext.get\_object(uuid) ⇒ <code>Object</code>
Get document with specific uuid.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Throws**:

- <code>string</code> 


| Param | Type |
| --- | --- |
| uuid | <code>string</code> | 

<a name="SearchContext+select"></a>

### searchContext.select(sel) ⇒ [<code>SearchContext</code>](#SearchContext)
Specify what should be returned from elasticsearch.
Has the side effect of clearing the lru cache.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - itself.  

| Param | Type | Description |
| --- | --- | --- |
| sel | <code>string</code> \| <code>Array.&lt;string&gt;</code> \| <code>Array.&lt;Object&gt;</code> | sel is either a single string value, a list of string value, or a dictionary with keys "includes" and/or "excludes" and the values are lists of strings. The string values are nested property names. This method returns itself, so it is chainable, but the select settings will not propagate into a new SearchContext (specifically, it will not be passed into the result of .filter()). |

<a name="SearchContext+filter"></a>

### searchContext.filter(args) ⇒ [<code>SearchContext</code>](#SearchContext)
Narrow search context by adding search terms.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext.  

| Param | Type | Description |
| --- | --- | --- |
| args | <code>Object.&lt;string, (string\|Array.&lt;string&gt;\|number\|Array.&lt;number&gt;\|boolean)&gt;</code> | filter specifications. |

<a name="SearchContext+hidden"></a>

### searchContext.hidden() ⇒ [<code>SearchContext</code>](#SearchContext)
Select only hidden objects.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext that only matches hidden objects.  
<a name="SearchContext+visible"></a>

### searchContext.visible() ⇒ [<code>SearchContext</code>](#SearchContext)
Select only visible objects.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext that only matches non-hidden objects.  
<a name="SearchContext+all"></a>

### searchContext.all() ⇒ [<code>SearchContext</code>](#SearchContext)
Select all objects.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext that matches both hidden and non-hidden objects.  
<a name="SearchContext+cases"></a>

### searchContext.cases() ⇒ <code>Cases</code>
Select all case objects referenced in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
<a name="SearchContext+ensembles"></a>

### searchContext.ensembles() ⇒ <code>Ensembles</code>
Select all ensemble objects referenced in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
<a name="SearchContext+realizations"></a>

### searchContext.realizations() ⇒ <code>Realizations</code>
Select all realizations referenced in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
<a name="SearchContext+surfaces"></a>

### searchContext.surfaces() ⇒ [<code>SearchContext</code>](#SearchContext)
Select surfaces in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext.  
<a name="SearchContext+tables"></a>

### searchContext.tables() ⇒ [<code>SearchContext</code>](#SearchContext)
Select tables in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext.  
<a name="SearchContext+dictionaries"></a>

### searchContext.dictionaries() ⇒ [<code>SearchContext</code>](#SearchContext)
Select dictionaries in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext.  
<a name="SearchContext+polygons"></a>

### searchContext.polygons() ⇒ [<code>SearchContext</code>](#SearchContext)
Select polygons in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext.  
<a name="SearchContext+cubes"></a>

### searchContext.cubes() ⇒ [<code>SearchContext</code>](#SearchContext)
Select cubes in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext.  
<a name="SearchContext+cpgrids"></a>

### searchContext.cpgrids() ⇒ [<code>SearchContext</code>](#SearchContext)
Select grids in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext.  
<a name="SearchContext+cpgrid_properties"></a>

### searchContext.cpgrid\_properties() ⇒ [<code>SearchContext</code>](#SearchContext)
Select grid properties in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext.  
<a name="SearchContext+parameters"></a>

### searchContext.parameters() ⇒ [<code>SearchContext</code>](#SearchContext)
Select parameters in current context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext.  
<a name="SearchContext+get_object_by_class_and_uuid"></a>

### searchContext.get\_object\_by\_class\_and\_uuid(cls, uuid) ⇒ <code>Object</code>
Get an object by its uuid, and verify that it has the expecteed class.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  

| Param | Type | Description |
| --- | --- | --- |
| cls | <code>string</code> | expected class of the object. |
| uuid | <code>string</code> |  |

<a name="SearchContext+get_case_by_uuid"></a>

### searchContext.get\_case\_by\_uuid(uuid) ⇒ <code>Case</code>
Get case object by its uuid.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  

| Param |
| --- |
| uuid | 

<a name="SearchContext+aggregate"></a>

### searchContext.aggregate(operation, columns, [no_wait]) ⇒ <code>Surface</code> \| <code>Table</code> \| <code>Object</code>
Create a new aggregated object.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| operation | <code>string</code> |  | the kind of aggregation to perform. |
| columns | <code>Array.&lt;string&gt;</code> |  | the columns to aggregate (for table aggregation). Note: for this operation, only a single column is allowed. |
| [no_wait] | <code>boolean</code> | <code>false</code> | If true, do not poll for result, but return a response object that can be used for polling later. |

<a name="SearchContext+batch_aggregate"></a>

### searchContext.batch\_aggregate(operation, columns, [no_wait]) ⇒ <code>Object</code>
Aggregate multiple columns.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| operation | <code>string</code> |  | the kind of aggregatiion to perform. Note: only "collection" is allowed. |
| columns | <code>Array.&lt;string&gt;</code> |  | the columns to aggregate. |
| [no_wait] | <code>boolean</code> | <code>false</code> | If true, do not poll for result, but return a response object that can be used for polling later. |

<a name="SearchContext+reference_realizations"></a>

### searchContext.reference\_realizations() ⇒ [<code>SearchContext</code>](#SearchContext)
Select reference realizations in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: [<code>SearchContext</code>](#SearchContext) - - new SearchContext.  
<a name="SearchContext+realizationids"></a>

### searchContext.realizationids() ⇒ <code>Array.&lt;number&gt;</code>
Get list of unique realization ids in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;number&gt;</code> - - list of realization ids.  
<a name="SearchContext+stratcolumnidentifiers"></a>

### searchContext.stratcolumnidentifiers() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique stratigraphic column names in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of stratigraphic column identifiers.  
<a name="SearchContext+fieldidentifiers"></a>

### searchContext.fieldidentifiers() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique field names in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of field names.  
<a name="SearchContext+assets"></a>

### searchContext.assets() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique asset names in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of asset names.  
<a name="SearchContext+users"></a>

### searchContext.users() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique user names in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of user names.  
<a name="SearchContext+statuses"></a>

### searchContext.statuses() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique case statuses in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of statuses.  
<a name="SearchContext+columns"></a>

### searchContext.columns() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique column names in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of column names.  
<a name="SearchContext+contents"></a>

### searchContext.contents() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique contents in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of content types.  
<a name="SearchContext+vertical_domains"></a>

### searchContext.vertical\_domains() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique object vertical domains in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of vertical domain names.  
<a name="SearchContext+stages"></a>

### searchContext.stages() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique stages in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of stages.  
<a name="SearchContext+aggregations"></a>

### searchContext.aggregations() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique object aggregation operations in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of aggregation operations.  
<a name="SearchContext+dataformats"></a>

### searchContext.dataformats() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique data.format values.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of formats.  
<a name="SearchContext+tagnames"></a>

### searchContext.tagnames() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique object tagnames in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of tagnames.  
<a name="SearchContext+names"></a>

### searchContext.names() ⇒ <code>Array.&lt;string&gt;</code>
Get list of unique object names in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of names.  
<a name="SearchContext+classes"></a>

### searchContext.classes() ⇒ <code>Array.&lt;string&gt;</code>
Get list of class names in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of class names.  
<a name="SearchContext+standard_results"></a>

### searchContext.standard\_results() ⇒ <code>Array.&lt;string&gt;</code>
Get list of standard result names in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of standard result names.  
<a name="SearchContext+entities"></a>

### searchContext.entities() ⇒ <code>Array.&lt;string&gt;</code>
Get list of entity uuids in context.

**Kind**: instance method of [<code>SearchContext</code>](#SearchContext)  
**Returns**: <code>Array.&lt;string&gt;</code> - - list of ntity uuids.  
<a name="GetExplorer"></a>

## GetExplorer(env) ⇒ <code>Explorer</code>
Get Explorer instance.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| env | <code>string</code> | Which sumo environment to connect to. |


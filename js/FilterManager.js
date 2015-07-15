/*global jQuery, $, _, AjaxSolr, EUMSSI*/
function FilterManager(){

	/**
	 * @type {Object[]} filters - the temporal queries for the filter query
	 * @param {String} filterName - Name of the filter, usually the field that affects
	 * @param {String} query - the filter query for Solr
	 * @param {String} [widgetId] - the widget that attach the filter
	 * @param {String} [filterText] - Auxiliar text to display the filter
	 * @private
	 */
	this._filters = [];
}

_.extend(FilterManager.prototype, {

	/* FILTERS API */

	/**
	 * Get all the filters Array
	 * @returns {Object[]}
	 */
	getAllFilters: function(){
		return this._filters;
	},

	/**
	 * Return An array with the filters that match with the parameters
	 * @param {String} filterName - name to recognize the filter, usually the field for the filter
	 * @param {String} [widgetId] - If of the widget that apply the filter
	 * @param {String} query - the query
	 * @returns {Array.<Object>|*}
	 */
	getkFilter: function(filterName, widgetId, query){
		var f = {};
		if(filterName){ f.filterName = filterName; }
		if(query){ f.query = query; }
		if(widgetId){ f.widgetId = widgetId; }

		return _.filter(this._filters,function(filter){
			if(_.isMatch(filter,f)){
				return true;
			}
		});
	},

	/**
	 * Add a filter to be used on the filter query.
	 * @param {String} filterName - name to recognize the filter, usually the field for the filter
	 * @param {String} query - the query
	 * @param {String} [widgetId] - If of the widget that apply the filter
	 * @param {String} [filterText] - Auxiliar text to display the filter
	 * @returns {{filterName: *, query: *, widgetId: *}}
	 */
	addFilter: function(filterName, query, widgetId, filterText){
		console.log("Manager > addFilter: "+filterName+" | "+query+" | "+widgetId+" | "+filterText);
		var filter = {
			filterName: filterName,
			query: query,
			widgetId: widgetId,
			filterText: filterText
		};

		this._filters.push(filter);
		EUMSSI.EventManager.trigger("filterChange", filter);
		return filter;
	},

	/**
	 * Removes a filter with a especific parameters {filterName}
	 * @param {String} filterName - the filter to be removed
	 * @param {String} widgetId - the widgetId that added the filter to be removed
	 * @param {String} query - the query for the widgets to be eliminated
	 */
	removeFilter: function(filterName, widgetId, query){
		console.log("Manager >  removeFilterByName: "+filterName+" | "+widgetId+" | "+query);

		var f = {};
		if(filterName){ f.filterName = filterName; }
		if(query){ f.query = query; }
		if(widgetId){ f.widgetId = widgetId; }

		this._filters = _.reject(this._filters,function(filter){
			if(_.isMatch(filter,f)){
				return true;
			}
		});
		EUMSSI.EventManager.trigger("filterChange");
	},

	/**
	 * Check if a Filter exist
	 * @param {String} filterName - the filter to be removed
	 * @param {String} widgetId - the widgetId that added the filter to be removed
	 * @param {String} query - the query for the widgets to be eliminated
	 * @returns {Boolean}
	 */
	checkFilter: function(filterName, widgetId, query){
		var f = {};
		if(filterName){ f.filterName = filterName; }
		if(query){ f.query = query; }
		if(widgetId){ f.widgetId = widgetId; }

		return _.isObject(_.find(this._filters,function(filter){
			if(_.isMatch(filter,f)){
				return true;
			}
		}));
	},

	cleanFilter: function(){
		delete this._filters;
		this._filters = [];
	},

	removeFilterByName: function(filterName, widgetId){
		if(filterName){
			this.removeFilter(filterName, widgetId, null);
		}
	},

	removeFilterByWidget: function(widgetId){
		if( widgetId ) {
			this.removeFilter(null, widgetId, null);
		}
	},

	removeFilterByQuery: function(query){
		if( query ) {
			this.removeFilter(null, null, query);
		}
	},

	removeFilterObject: function(filter){
		if( _.isObject(filter) ) {
			this.removeFilter(filter.filterName, filter.widgetId, filter.query);
		}
	},

	checkFilterByName: function(filterName){
		return this.checkFilter(filterName,null,null);
	},

	checkFilterByWidgetId: function(widgetId){
		return this.checkFilter(null,widgetId,null);
	},

	/**
	 * Generate a filter query String with the current filters
	 * @private
	 */
	getFilterQueryString: function(){
		var fq = "", q = [];
		_.each(this._filters,function(filterObj){
			q.push(filterObj.query);
		},this);

		if(q.length > 0){
			fq = "+(" + q.join(") +(") + ")";
		}

		return fq;
	}

	/* end FILTERS API end */


});


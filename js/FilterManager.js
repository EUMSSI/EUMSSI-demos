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
	getFilters: function(filterName, widgetId, query){
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
		EUMSSI.EventManager.trigger("filterChange:"+filterName, filter);
		return filter;
	},

	/**
	 * Removes a filter with a especific parameters {filterName}
	 * @param {String} filterName - the filter to be removed
	 * @param {String} widgetId - the widgetId that added the filter to be removed
	 * @param {String} query - the query for the widgets to be eliminated
	 * @param {Boolean} [silent] - true, if don't want to trigger the change event
	 */
	removeFilter: function(filterName, widgetId, query, silent){
		console.log("Manager >  removeFilterByName: "+filterName+" | "+widgetId+" | "+query);

		var f = {},
			removedFilter;
		if(filterName){ f.filterName = filterName; }
		if(query){ f.query = query; }
		if(widgetId){ f.widgetId = widgetId; }

		this._filters = _.reject(this._filters,function(filter){
			if(_.isMatch(filter,f)){
				removedFilter = filter;
				return true;
			}
		});
		if(removedFilter && !silent){
			EUMSSI.EventManager.trigger("filterChange:"+removedFilter.filterName);
	}
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

	removeFilterByName: function(filterName, widgetId, silent){
		if(filterName){
			this.removeFilter(filterName, widgetId, null, silent);
		}
	},

	removeFilterByWidget: function(widgetId, silent){
		if( widgetId ) {
			this.removeFilter(null, widgetId, null, silent);
		}
	},

	removeFilterByQuery: function(query, silent){
		if( query ) {
			this.removeFilter(null, null, query, silent);
		}
	},

	removeFilterObject: function(filter, silent){
		if( _.isObject(filter) ) {
			this.removeFilter(filter.filterName, filter.widgetId, filter.query, silent);
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
			//Detect special cases
			switch(filterObj.filterName){
				case "GENERAL_SEARCH" :
					q.push(this._parseGeneralFilter(filterObj.query.replace("GENERAL_SEARCH"+":","")));
					break;
				default:
					q.push(filterObj.query);
			}
		},this);

		if(q.length > 0){
			fq = "+(" + q.join(") +(") + ")";
		}

		return fq;
	},

	/* end FILTERS API end */

	/**
	 * Creates a Query with the general search fields with the given value.
	 * @param {string} value - the value of the search
	 * @returns {string} "field1:value OR field2:value OR field3:value ..."
	 * @private
	 */
	_parseGeneralFilter : function(value){
		var searchQueries = [];
		var searchFields = [
			"meta.source.text",
			"meta.source.description",
			"meta.source.category",
			"meta.source.headline",
			"meta.source.author",
			"meta.extracted.audio_transcript",
			"meta.extracted.video_ocr.best",
			"meta.source.keywords"
		];

		if(value){
			_.each(searchFields,function(val){
				searchQueries.push(val + ":" + _.escape(value));
			});
		}

		return searchQueries.join(" OR ");
	}

});


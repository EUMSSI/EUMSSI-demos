/*global jQuery, $, _, AjaxSolr, EUMSSI*/
function FilterManager(){
	// the temporal queries for the filter query
	this._filters = {};
}

_.extend(FilterManager.prototype, {

	/* FILTERS API */

	/**
	 * Add a filter to be used on the filter query.
	 * @param {String} filterName - name to recognize the filter, usually the field for the filter
	 * @param {String} query - the query
	 * @param {String} widgetId - If of the widget that apply the filter
	 * @returns {{filterName: *, query: *, widgetId: *}}
	 */
	addFilter: function(filterName, query, widgetId){
		console.log("Manager > addFilter: "+filterName+" | "+query+" | "+widgetId);
		var f = {
			filterName: filterName,
			query: query,
			widgetId: widgetId
		};
		if( !this._filters[filterName] ) {
			this._filters[filterName] = [];
		}
		this._filters[filterName].push(f);
		EUMSSI.EventManager.trigger("filterChange", filterName);
		return f;
	},

	/**
	 * Removes a filter with a especific {filterName}
	 * @param {String} filterName - the filter to be removed
	 * @param {String} widgetId - the widgetId that added the filter to be removed
	 */
	removeFilterByName: function(filterName, widgetId){
		console.log("Manager >  removeFilterByName: "+filterName+" | "+widgetId);
		if( filterName && !widgetId ){
			//Remove all the filters of the filterName
			this._deleteFilter(filterName);
		} else if( filterName && widgetId ) {
			//Search only on the filters about that filterName
			this._removeFilterCheckWidget(filterName, widgetId);
		}
	},

	removeFilterByWidget: function(widgetId){
		console.log("Manager > removeFilterByWidget: "+widgetId);
		if( widgetId ) {
			//Search on all fields
			_.each(this._filters, function(obj,key){
				this._removeFilterCheckWidget(key, widgetId);
			},this);
		}
	},

	cleanFilter: function(){
		delete this._filters;
		this._filters = {};
	},

	/**
	 * Generate a filter query String with the current filters
	 * @private
	 */
	getFilterQueryString: function(){
		var fq = "", q = [];
		_.each(this._filters, function(subArray){
			_.each(subArray,function(filterObj){
				q.push(filterObj.query);
			},this);
		},this);

		if(q.length > 0){
			fq = "+(" + q.join(") +(") + ")";
		}

		return fq;
	},

	/* end FILTERS API end */

	_removeFilterCheckWidget: function(filterName, widgetId){
		_.each(this._filters[filterName], function(obj,index){
			if(obj.widgetId == widgetId){
				this._filters[filterName].splice(index,1);
				EUMSSI.EventManager.trigger("filterChange",filterName);
			}
		},this);
		if(this._filters[filterName].length == 0){
			this._deleteFilter(filterName);
		}
	},

	_deleteFilter: function(filterName) {
		delete this._filters[filterName];
		EUMSSI.EventManager.trigger("filterChange",filterName);
	}

});


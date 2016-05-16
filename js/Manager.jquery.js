/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL */
(function(callback){
	if (typeof define === 'function' && define.amd) {
		define(['core/AbstractManager'], callback);
	} else {
		callback();
	}
}(function(){

	/**
	 * @see http://wiki.apache.org/solr/SolJSON#JSON_specific_parameters
	 * @class Manager
	 * @augments AjaxSolr.AbstractManager
	 */
	AjaxSolr.Manager = AjaxSolr.AbstractManager.extend(/** @lends AjaxSolr.Manager.prototype */
		{
			//Transversal Flag
			// Pagination Request Flag, true if the request is maded from paginator
			flag_PaginationRequest: false, //// When click to filter by some Facet maintains the rest only update the number of times
			//flag_TagFacetRequest : false,
			//// When click to filter by some Country on MapChartWidget
			//flag_MapChartRequest : false,

			// The fields that solr has indexed, must be fetched on start.
			_solrFields : [],

			/**
			 * Custom REQUEST execution for jQuery
			 * @param servlet
			 * @param string
			 * @param handler
			 * @param errorHandler
			 */
			executeRequest: function(servlet, string, handler, errorHandler){
				var self = this, options = {dataType: 'json'};
				this._regenFilter();
				string = string || this.store.string();

				handler = handler || function(data){
					self.handleResponse(data);
				};

				errorHandler = errorHandler || function(jqXHR, textStatus, errorThrown){
					self.handleError(textStatus + ', ' + errorThrown);
				};

				if (this.proxyUrl) {
					options.url = this.proxyUrl;
					options.data = {query: string};
					options.type = 'POST';
				} else {
					//ORIGINAL
					// options.url = this.solrUrl + servlet + '?' + string + '&wt=json&json.wrf=?';
					//MINE - problems with json.wrf param
					options.url = this.solrUrl + servlet + '?' + string + '&wt=json';
					options.headers = {Origin: undefined};
				}

				this._showLoader();
				jQuery.ajax(options).done(handler).fail(errorHandler).always(this._hideLoader.bind(this));
			},

			/**
			 * Custom AddWidget function that initializes the widget if the manager has been already init.
			 * Adds a widget to the manager.
			 * @overrides
			 * @param {AjaxSolr.AbstractWidget} widget
			 */
			addWidget: function (widget) {
				widget.manager = this;
				this.widgets[widget.id] = widget;
				if (this.initialized) {
					this.widgets[widget.id].init();
				}
			},

			/**
			 * Refresh the Filter query
			 * @private
			 */
			_regenFilter: function(){
				var q = EUMSSI.FilterManager.getQueryString();
				var fq = EUMSSI.FilterManager.getFilterQueryString();

				this.store.addByValue("q",q);
				this._lastq = q;

				this.store.removeByValue("fq",this._lastfq);
				if(fq.length > 0){
					this.store.addByValue("fq",fq);
					this._lastfq = fq;
				} else {
					this._lastfq = "";
				}
			},

			_showLoader: function(){
				$(".result-panel-content").addClass("ui-loading-modal");
			},

			_hideLoader: function(){
				$(".result-panel-content").removeClass("ui-loading-modal");
			},

			/* Filter Interface  */
			addFilter: function(filterName, query, widgetId, filterText){
				EUMSSI.FilterManager.addFilter(filterName, query, widgetId, filterText);
			},

			removeFilterByName: function(filterName, widgetId){
				EUMSSI.FilterManager.removeFilterByName(filterName, widgetId);
			},

			removeFilterByWidget: function(widgetId){
				EUMSSI.FilterManager.removeFilterByWidget(widgetId);
			},

			getLastFilterQuery: function(){
				return this._lastfq || "";
			},

			getLastQuery: function(){
				return this._lastq || "*:*";
			},

			//<editor-fold desc="CUSTOM SOLR SERVICES">

			/**
			 * Fetch the current indexed fields on Solr
			 * and save it in Manager._solrFields
			 */
			retrieveSolrFieldsNames: function(){
				$.ajax({
					url: this.solrUrl + this.servlet + '?' + "q=*%3A*&rows=0&wt=csv&indent=true",
					success: function(response){
						this._solrFields = response.split(",").sort();
					}.bind(this)
				});
			},

			/**
			 * Obtain the Segments of the given Item
			 * @param parentId
			 */
			getSegmentsByParentId: function(parentId){
				var url = this.segmentsCoreUrl + this.servlet + '?';
				var params = {
					q : this.getLastQuery(),
					fq : "parent_id:"+AjaxSolr.Parameter.escapeValue(parentId),
					sort : "beginOffset asc",
					wt : "json",
					indent : "true",
					rows : "15",
					'hl'  : true,
					'hl.fl': '*'
				};
				return $.ajax({
					url: url + $.param(params),
					success: function(response){
						this._solrFields = response.split(",").sort();
					}.bind(this)
				});
			},

			/**
			 * Retrieve Tweets with the current Query
			 * @param {number} [start=0] - The current page start index for the current search.
			 * @param {string} [order=desc] - Sort for the Solr.
			 * @param {number} [gapsize=10] - The paginagion gap size.
			 * @returns {*}
			 */
			getTweets: function(start, order, gapsize){
				var url = this.solrUrl + this.servlet + '?';
				var sort = "meta.extracted.text_polarity.numeric " + (order || "desc");
				var discretePolarity = order === "asc" ? "NEGATIVE" : "POSITIVE";
				var filters = EUMSSI.FilterManager.getFilterQueryString(["meta.source.datePublished","meta.source.inLanguage"]);

				var params = {
					q : this.getLastQuery(),
					//For the moment only retrieve the NEGATIVE OR POSITIVE excluding NEUTRAL
					fq : filters + "+source:Twitter +meta.extracted.text_polarity.discrete:\"" + discretePolarity +"\"",
					sort : sort,
					wt : "json",
					indent : "true",
					rows: (gapsize || 10),		// pageSize
					start: (start || 0)			// paginationGap start
				};
				return $.ajax({ url: url + $.param(params) });
			},

			/**
			 * Obtain the Tweets Counts grouped by Polarity
			 * @returns {Deferred}
			 */
			getTweetsPolarityTotal: function(){
				var url = this.solrUrl + this.servlet + '?';
				var filters = EUMSSI.FilterManager.getFilterQueryString(["meta.source.datePublished","meta.source.inLanguage"]);

				var params = {
					q : this.getLastQuery(),
					fq : filters + "+source:Twitter",
					facet : true,
					'facet.field' : "meta.extracted.text_polarity.discrete",
					'json.nl' : "map",
					wt : "json",
					indent : "true",
					rows: 0,	// pageSize
					start: 0	// paginationGap start
				};
				return $.ajax({ url: url + $.param(params) });
			},

			/**
			 * This service returns a suggested Entities, Keywords, etc... related with the given text sentence.
			 * @param text
			 * @returns {Deferred}
			 */
			getTextFilterAnalyze : function(text){
				var url = this.uimaServiceUrl + 'analyze' +'?';
				var params = {
					text: text || ""
				};
				return $.ajax({ url: url + $.param(params) });
			}


			//</editor-fold>

		});


}));

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

			_showLoader: function(){
				$(".result-panel-content").addClass("ui-loading-modal");
			},

			_hideLoader: function(){
				$(".result-panel-content").removeClass("ui-loading-modal");
			}

		});

}));

/*global jQuery, $, _, AjaxSolr, EUMSSI*/
(function ($) {

	/**
	 * Widget that represents a World Map with the occurences
	 * @type {A|*|void}
	 * @augments AjaxSolr.AbstractWidget
	 */
	AjaxSolr.FilterViewerWidget = AjaxSolr.AbstractWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function(){
			this.$title= $('<h2 class="ui-filters-label">').text(this.label);
			this.$container = $('<div class="ui-filters-container">');
			$(this.target).append(this.$title);
			$(this.target).append(this.$container);
			this.$title.hide();

			//EVENTS
			EUMSSI.EventManager.on("filterChange", this._onFilterChange.bind(this));
			$(this.target).on("click", ".removeFilter", this._onRemoveFilter.bind(this));
		},

		beforeRequest: function(){
			return true;
		},

		afterRequest: function(){
			return true;
		},

		listoToRemoveFilter: function(callback) {
			this._onRemoveFilterCallback = callback;
		},

		_renderFilters: function(){
			var filters = EUMSSI.FilterManager.getAllFilters();
			this.$container.empty();
			if(filters.length > 0){
				this.$title.show();
				_.each(filters,function(filterObject){
					this.$container.append(this._renderFilterForm(filterObject));
				}.bind(this));
			} else {
				this.$title.hide();
			}

		},

		_renderFilterForm: function(filterObj){
			var $el = $('<div class="ui-filter">')
				.attr("data-filter",JSON.stringify(filterObj));
			$el.append($('<span class="removeFilter ui-icon ui-icon-circle-close">'));
			$el.append($('<span class="filterText">')
				.attr("title",filterObj.query)
				.text(filterObj.filterText || filterObj.query));
			return $el;
		},

		_onFilterChange: function(){
			this._renderFilters();
			//Show/Hide Title
			if(this.$container.html().length == 0){
				this.$title.hide();
			} else {
				this.$title.show();
			}
		},

		_onRemoveFilter: function(event){
			var filterObj = $(event.currentTarget).parent(".ui-filter").data("filter");
			EUMSSI.FilterManager.removeFilterObject(filterObj);
			EUMSSI.Manager.doRequest(0);
			if (typeof this._onRemoveFilterCallback === "function") {
				this._onRemoveFilterCallback(filterObj);
			}
		}

	});

})(jQuery);
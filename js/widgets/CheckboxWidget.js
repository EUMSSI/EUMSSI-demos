/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL */
(function ($) {

	AjaxSolr.CheckboxWidget = AjaxSolr.AbstractTextWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function () {
			this.$target = $(this.target);
			this.$target.addClass("checkboxWidget");
			this._render();
			//Events
			this.$target.find("input").click(this._onClickCheckbox.bind(this));
			EUMSSI.EventManager.on("filterChange:"+this.key, this._manageFilterChange.bind(this));
		},

		_render: function(){
			var $div = $("<div>").addClass("ui-checkbox-container");
			if(this.title){
				$div.prop("title", this.title);
			}
			$div.html("<label><input type='checkbox'>"+this.label+"</label>");
			this.$target.append($div);
		},

		/**
		 * When Check/Uncheck set/clear the filter query and perform a request
		 * @param {jQuery:event} e
		 * @private
		 */
		_onClickCheckbox: function(e){
			if(e.target.checked){
				this.setFilter();
			} else {
				this.clearFilter();
			}
			this.doRequest();
		},

		_manageFilterChange:function(){
			if(!EUMSSI.FilterManager.checkFilterByName(this.key)){
				this.$target.find("input[type=checkbox]").prop("checked","");
			}
		},

		/**
		 * Sets the main Solr query to the given string.
		 * @param {String} value the value for the filter.
		 */
		setFilter: function () {
			var fq = this.key + ":*";
			//Remove previous Value
			this.clearFilter(true);
			//Set the current Filter
			EUMSSI.FilterManager.addFilter(this.key, fq, this.id, this.label);
		},

		/**
		 * Remove the filter for this widget
		 * @param {Boolean} [silent] true, if don't want to trigger the change event
		 */
		clearFilter: function (silent) {
			EUMSSI.FilterManager.removeFilterByName(this.key, this.id, silent);
		}

	});

})(jQuery);

/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL */
(function ($) {

	AjaxSolr.DateFilterWidget = AjaxSolr.AbstractTextWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function () {
			this.$target = $(this.target);
			this._render();
			//Events
			this.$target.find("input").change(this._onChange.bind(this));
			EUMSSI.EventManager.on("filterChange:"+this.key, this._manageFilterChange.bind(this));
		},

		_render: function(){
			var $from = $("<div>").addClass("dateFilter-from");
			$from.html("<label>From </label><input type='text'><class='dateFilter-from'></input>");
			var $to = $("<div>").addClass("dateFilter-to");
			$to.html("<label>To </label><input type='text'><class='dateFilter-to'></input>");
			$from.find("input").datepicker();
			$to.find("input").datepicker();
			this.$target.append($from);
			this.$target.append($to);
		},

		/**
		 * When Check/Uncheck set/clear the filter query and perform a request
		 * @private
		 */
		_onChange: function(){
			var fromDate = this.$target.find(".dateFilter-from input").datepicker("getDate");
			var toDate = this.$target.find(".dateFilter-to input").datepicker("getDate");
			if(fromDate || toDate){
				this.setFilter(fromDate, toDate);
			} else {
				this.clearFilter();
			}
			this.doRequest();
		},

		_manageFilterChange:function(){
			if(!EUMSSI.FilterManager.checkFilterByName(this.key)){
				this.$target.find("input").val("");
			}
		},

		/**
		 * //"meta.source.datePublished:[1995-12-31T23:59:59Z TO 2010-12-31T23:59:59Z]"
		 * Sets a filter query with the dates.
		 * @param {Date} [fromDate]
		 * @param {Date} [toDate]
		 */
		setFilter: function (fromDate, toDate) {
			var from, to, fq, filterText, fromText, toText;
			//Remove previous Value
			this.clearFilter(true);
			if(fromDate || toDate){
				from = fromDate ? fromDate.toISOString() : "*";
				to = toDate ? toDate.toISOString() : "*";
				fromText = fromDate ? $.datepicker.formatDate($.datepicker.regional[''].dateFormat, fromDate) : "*";
				toText = toDate ? $.datepicker.formatDate($.datepicker.regional[''].dateFormat, toDate) : "*";
				fq = this.key + ":["+ from +" TO " + to + "]";
				filterText = "From "+fromText+" to "+toText;
				//Set the current Filter
				EUMSSI.FilterManager.addFilter(this.key, fq, this.id, filterText);
			}
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

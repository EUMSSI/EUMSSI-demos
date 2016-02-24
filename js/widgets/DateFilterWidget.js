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
			//WidgetEvents
			EUMSSI.EventManager.on("DateFilter:addFilter", this._addFilterFromEvent.bind(this));
		},

		_render: function(){
			var $from = $("<div>").addClass("dateFilter-from");
			$from.html("<label>From </label><input type='text'><class='dateFilter-from'></input>");
			var $to = $("<div>").addClass("dateFilter-to");
			$to.html("<label>To </label><input type='text'><class='dateFilter-to'></input>");
			this._fromDatepicker = $from.find("input").datepicker();
			this._toDatepicker = $to.find("input").datepicker();
			var $range = $("<div>").addClass("dateFilter-range");
			$range.html("<select class='dateFilter-to'>" +
				"<option value='0' selected>Custom Range</option>" +
				"<option value='1'>Last Week</option>" +
				"<option value='2'>Last Month</option>" +
				"<option value='3'>Last Year</option>" +
			"</select>");

			$range.find("select").selectmenu({
				width : 150,
				select: function(event, data) {
					var toDate = new Date();
					var fromDate = new Date();
					switch (data.item.value) {
						case "0" :
							toDate = null;
							fromDate = null;
							break;
						case "1" :
							fromDate.setDate(toDate.getDate() - 7);
							break;
						case "2" :
							fromDate.setMonth(toDate.getMonth() - 1);
							break;
						case "3" :
							fromDate.setFullYear(toDate.getFullYear() - 1);
							break;
						default : break;
					}
					this._fromDatepicker.datepicker( "setDate", fromDate );
					this._toDatepicker.datepicker( "setDate", toDate );
					this._onChange();
				}.bind(this)
			});

			this.$target.append($from);
			this.$target.append($to);
			this.$target.append($range);
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
			var from, to, fq, filterText, fromText, toText, filterData;
			//Remove previous Value
			this.clearFilter(true);
			if(fromDate || toDate){
				from = fromDate ? fromDate.toISOString() : "*";
				to = toDate ? toDate.toISOString() : "*";
				fromText = fromDate ? $.datepicker.formatDate($.datepicker.regional[''].dateFormat, fromDate) : "*";
				toText = toDate ? $.datepicker.formatDate($.datepicker.regional[''].dateFormat, toDate) : "*";
				fq = this.key + ":["+ from +" TO " + to + "]";
				filterText = "From "+fromText+" to "+toText;
				filterData = {
					from : from,
					to : to
				};
				//Set the current Filter
				EUMSSI.FilterManager.addFilter(this.key, fq, this.id, filterText, filterData);
			}
		},

		/**
		 * Remove the filter for this widget
		 * @param {Boolean} [silent] true, if don't want to trigger the change event
		 */
		clearFilter: function (silent) {
			EUMSSI.FilterManager.removeFilterByName(this.key, this.id, silent);
		},

		/**
		 * Set the current dates to the filter and perform a request
		 * @param {jQuery.Event} event
		 * @param {Object} params - params to the event
		 * @param {Date} params.dateFrom - Date to be set as "From" Date.
		 * @param {Date} params.dateTo - Date to set as "To" date.
		 * @private
		 */
		_addFilterFromEvent: function(event, params){
			this.$target.find(".dateFilter-from input").datepicker("setDate", params.dateFrom);
			this.$target.find(".dateFilter-to input").datepicker("setDate", params.dateTo || params.dateFrom);
			this._onChange();
		}
	});

})(jQuery);

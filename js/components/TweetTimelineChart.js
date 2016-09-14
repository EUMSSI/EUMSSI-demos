/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL, d3, twttr, JSON */
(function ($) {
	window.EUMSSI = window.EUMSSI || {};
	EUMSSI.components = EUMSSI.components || {};

	EUMSSI.components.TwitterPolarityWidget = function($placeholder){
		this.$el = $placeholder;

		var template = _.template($("#tweet-time-chart-tpl").html());
		this.$el.html(template());

		//Buttons for date ranges change:
		this.$el.find(".tweet-time-chart-buttons button").click(this._onTimeChartTimeModeClick.bind(this));

		this._tweetTimeChartType = "MONTH"; // "DAY" || "WEEK" || "MONTH"

		return this;
	};

	EUMSSI.components.TwitterPolarityWidget.prototype = {

		/**
		 * Obtain the data and generate the Chart
		 * @param {boolean} [dontCalc] - If true get the tweets with the last dates ranges
		 */
		loadTimeChart: function(dontCalc){
			this.$el.addClass("ui-loading-modal");
			if(dontCalc){
				this._retrieveTweets(this._lastStartDate.from, this._lastStartDate.to);
			} else {
				var startDate = "";
				var currentDateFilter = EUMSSI.FilterManager.getFilters("meta.source.datePublished")[0];
				if(!currentDateFilter || currentDateFilter.filterData.from === "*"){
					this._calcDateLimits().then(function(response){
						if(response){
							var respObj = JSON.parse(response);
							if(respObj.response && respObj.response.docs && respObj.response.docs[0] instanceof Object && respObj.response.docs[0].hasOwnProperty("meta.source.datePublished")){
								startDate = respObj.response.docs[0]["meta.source.datePublished"];
							}
						}
						this._retrieveTweets(startDate);
					}.bind(this));
				} else {
					this._retrieveTweets(currentDateFilter.filterData.from, currentDateFilter.filterData.to);
				}
			}
		},

		_retrieveTweets: function(startDate, endDate){
			$.when(
				this._getTweetsDateRanges("POSITIVE", this._tweetTimeChartType, startDate, endDate),
				this._getTweetsDateRanges("NEGATIVE", this._tweetTimeChartType, startDate, endDate)
			).then(this._renderTimeTweetsChart.bind(this));
		},

		/**
		 * Get the tweets number by data ranges
		 * @param {string} [polarity] - the polarity value adds a meta.extracted.text_polarity.discrete filter,
		 *     "POSITIVE" || "NEGATIVE"
		 * @param {string} [timeMode] - the time gap to represent the graph "DAY" || "WEEK" || "MONTH"
		 * @param {string} [startDate] - the start date in UTC string format
		 * @param {string} [endDate] - the end date in UTC string format
		 * @returns {Deferred}
		 */
		_getTweetsDateRanges: function(polarity, timeMode, startDate, endDate){
			var url = EUMSSI.Manager.solrUrl + EUMSSI.Manager.servlet + '?';
			//var filters = EUMSSI.FilterManager.getFilterQueryString(["meta.source.datePublished","meta.source.inLanguage"]);
			var filters = EUMSSI.FilterManager.getFilterQueryString(["meta.source.inLanguage"]);
			this._lastStartDate = {from: startDate, to:endDate};
			var facetParams = {
				"facet.date": "meta.source.datePublished",
				"facet.date.start": startDate || "NOW/DAY-1DAY",
				"facet.date.end": endDate || "NOW/DAY"
			};
			if(endDate === "*"){
				facetParams["facet.date.end"] = "NOW/DAY";
			}

			switch (timeMode) {
				case "DAY" :
					facetParams = _.extend(facetParams, {
						"facet.date.gap": "+1DAY"
					});
					break;
				case "WEEK" :
					facetParams = _.extend(facetParams, {
						"facet.date.gap": "+7DAYS"
					});
					break;
				case "MONTH" :
					facetParams = _.extend(facetParams, {
						"facet.date.gap": "+1MONTHS"
					});
					break;
				default : break;
			}

			if( polarity == "POSITIVE" || polarity == "NEGATIVE" ){
				filters +="+meta.extracted.text_polarity.discrete:\"" + polarity +"\"";
			}

			var params = {
				q : EUMSSI.Manager.getLastQuery(),
				fq : filters + "+source:Twitter",
				facet : true,
				'json.nl' : "map",
				wt : "json",
				indent : "true",
				rows: 0,	// pageSize
				start: 0	// paginationGap start
			};

			params = _.extend(params,facetParams);
			return $.ajax({ url: url + $.param(params) });
		},

		/**
		 * Get the time range to look for tweets
		 * @returns {Deferred}
		 */
		_calcDateLimits: function(){
			var url = EUMSSI.Manager.solrUrl + EUMSSI.Manager.servlet + '?';
			var filters = EUMSSI.FilterManager.getFilterQueryString(["meta.source.inLanguage"]);

			var params = {
				q : EUMSSI.Manager.getLastQuery(),
				fq : filters + "+source:Twitter +meta.source.datePublished:[* TO NOW]",
				fl : "meta.source.datePublished",
				sort : "meta.source.datePublished asc",
				'json.nl' : "map",
				wt : "json",
				indent : "true",
				rows: 1,	// pageSize
				start: 0	// paginationGap start
			};

			return $.ajax({ url: url + $.param(params) });
		},

		_renderTimeTweetsChart: function(responsePositive, responseNegative){
			if(responsePositive || responseNegative){
				var resposneObjPositive = JSON.parse(responsePositive[0]);
				var dateCountsPositive = resposneObjPositive.facet_counts.facet_dates["meta.source.datePublished"];
				var resposneObjNegative = JSON.parse(responseNegative[0]);
				var dateCountsNegative = resposneObjNegative.facet_counts.facet_dates["meta.source.datePublished"];

				this._last_dataTable = this._generateDataTable(dateCountsPositive, dateCountsNegative);
			}

			var options = {
				title: 'Tweets Timeline',
				//curveType: 'function',
				legend: { position: 'bottom' },
				colors: ['#33A7D4' ,'#E63333', '#999999'],
				width: this.$el.width(),
				height: this.$el.height(),
				explorer:{
					axis: 'horizontal',
					actions: ['dragToZoom', 'rightClickToReset'],
					keepInBounds: true
				}
			};

			var chart = new google.visualization.LineChart(this.$el.find(".time-chart").get(0));
			chart.draw(this._last_dataTable, options);
			this.$el.removeClass("ui-loading-modal");
			//Chart Events
			google.visualization.events.addListener(chart, 'select', this._onTimeTweetSelect.bind(this, chart, this._last_dataTable));
		},

		_generateDataTable : function(dateCountsPositive, dateCountsNegative){
			var dataArray = [];
			dataArray.push(["Date", "Positive", "Negative"]);
			_.each(dateCountsPositive, function(count, date){
				//The Solr response add this attributes on the facet array
				if( date !== "gap" && date !== "start" && date !== "end" ){
					dataArray.push([new Date(date), count, dateCountsNegative[date]]);
				}
			});
			var dataTable = google.visualization.arrayToDataTable(dataArray);

			var pattern = "";
			switch (this._tweetTimeChartType) {
				case "DAY" : pattern = "MMM dd, yyyy";
					break;
				case "WEEK" : pattern = "'week' ww yyyy (MMM dd)";
					break;
				case "MONTH" : pattern = "MMM yyyy";
					break;
				default : break;
			}
			var date_formatter = new google.visualization.DateFormat({ pattern: pattern });
			date_formatter.format(dataTable, 0);
			return dataTable;
		},

		_onTimeChartTimeModeClick: function(event){
			var $target = $(event.target);
			this._tweetTimeChartType = $target.attr("value");

			$target.parent().find("button").removeClass("state-active");
			$target.addClass("state-active");

			//Refresh the chart
			this.loadTimeChart(true);
		},

		_onTimeTweetSelect: function(chart, data){
			var selection = chart.getSelection();
			if(selection && selection[0] && selection[0].row){
				var dateFrom = data.getValue(selection[0].row,0);
				var dateTo = new Date(dateFrom);
				switch(this._tweetTimeChartType){
					case "DAY" : dateTo.setDate(dateTo.getDate() + 1); // Add 1 day
						break;
					case "WEEK" : dateTo.setDate(dateTo.getDate() + 7); // Add 7 days
						break;
					case "MONTH" : dateTo.setMonth(dateTo.getMonth() + 1); // Add 1 Month
						break;
					default : break;
				}
				this._setDateFilter(dateFrom,dateTo);
			}
		},

		_setDateFilter: function(dateFrom, dateTo){
			EUMSSI.EventManager.trigger("DateFilter:addFilter", {
				dateFrom: dateFrom,
				dateTo: dateTo
			});
		},

		reloadChart: function(){
			this._renderTimeTweetsChart();
		}

	};

})(jQuery);

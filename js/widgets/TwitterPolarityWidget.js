/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL, d3, twttr */
(function ($) {

	AjaxSolr.TwitterPolarityWidget = AjaxSolr.AbstractFacetWidget.extend({

		init: function() {
			this.$target = $(this.target);
			this.$tabs = $(this.target).parents(".tabs-container");
		},


		_initLayout: function(){
			//Initial View
			var template = _.template($("#twitter-polarity-columns-tpl").text());
			this.$target.append(template());

			//Events - scroll
			this.$target.find(".polarityCol.agree").scroll(this._manageScroll.bind(this));
			this.$target.find(".polarityCol.against").scroll(this._manageScroll.bind(this));

			this._layoutLoaded = true;
		},

		afterRequest: function () {
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");
			if(this._isTwitterEnabled()){
				EUMSSI.$tabs.tabs( "enable", tabPosition );
				if(this.$tabs.tabs( "option", "active") === tabPosition) {
					this._loadData();
				} else {
					this.$tabs.off("tabsactivate.twitterpolaritywidget");
					this.$tabs.on("tabsactivate.twitterpolaritywidget", this._tabChange.bind(this) );
				}
			} else {
				if(this.$tabs.tabs( "option", "active") === tabPosition) {
					this.$tabs.tabs( "option", "active", 0);
				}
				EUMSSI.$tabs.tabs( "disable", tabPosition );
			}
		},

		/**
		 * Checks if the Twitter source is currently enabled
		 * @returns {boolean}
		 * @private
		 */
		_isTwitterEnabled: function(){
			var sourceWidget = EUMSSI.Manager.widgets['source'];
			if(sourceWidget){
				return sourceWidget.isKeyActive('Twitter');
			}
			return false;
		},

		/**
		 * Check if the current open tab is this widget tab and then load the widget
		 * @private
		 */
		_tabChange: function(){
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this.$tabs.off("tabsactivate.twitterpolaritywidget");
				this._loadData();
			}
		},

		_loadData: function(){
			if(!this._layoutLoaded){
				this._initLayout();
			}

			//Reset
			this._lastAGREEpage = 0;
			this._lastAGAINSTpage = 0;
			this.$target.find(".tweet-container").empty();

			//Pie Chart
			this.$target.find(".tweet-pie-chart svg").empty();
			this.$target.find(".tweet-pie-chart").addClass("ui-loading-modal");
			this.manager.getTweetsPolarityTotal()
				.then(this._renderPieChartsD3.bind(this))
				.always(function(){
					this.$target.find(".tweet-pie-chart").removeClass("ui-loading-modal");
				}.bind(this));

			//Time Chart
			this.$target.find(".tweet-time-chart").addClass("ui-loading-modal");
			$.when(
				this.manager.getTweetsDateRanges("POSITIVE"),
				this.manager.getTweetsDateRanges("NEGATIVE")
				//this.manager.getTweetsDateRanges()
			).then(this._renderTimeTweetsChart.bind(this));

			//Get the tweets
			this._getMoreAgreeTweets();
			this._getMoreAgainstTweets();
		},

		_getMoreAgreeTweets: function(){
			this.$target.find(".polarityCol.agree").find(".tweet-container-loading").addClass("loading");
			this.manager.getTweets(this._lastAGREEpage,"desc").then(this._onLoadData.bind(this, "desc"));
		},

		_getMoreAgainstTweets: function(){
			this.$target.find(".polarityCol.against").find(".tweet-container-loading").addClass("loading");
			this.manager.getTweets(this._lastAGAINSTpage,"asc").then(this._onLoadData.bind(this, "asc"));
		},

		/**
		 * @param {string} order - the order of the loaded data "asc" or "desc"
		 * @param {object} response
		 * @param {number} response.size
		 * @param {string} response.text
		 * @private
		 */
		_onLoadData: function(order,response){
			//Parse data to object
			response = JSON.parse(response);

			//Remove loaders
			if (order == "desc") {
				this.$target.find(".polarityCol.agree").find(".tweet-container-loading").removeClass("loading");
			} else {
				this.$target.find(".polarityCol.against").find(".tweet-container-loading").removeClass("loading");
			}

			if(response && response.response) {
				this._renderColumns(response, order);
				if (order == "desc") {
					if(response.response.numFound == 0){
						//No positive Tweets
						this.$target.find(".polarityCol.agree").find(".tweet-container").append($("<h3>").text("No positive tweets found"));
					} else if (response.response.numFound > (response.response.start + 10)) {
						this._fetchingAgree = false;
					} else {
						//No more elements
						this.$target.find(".polarityCol.agree").find(".tweet-container").append($("<h3>").text("End of positive tweets"));
					}
				} else {
					if(response.response.numFound == 0){
						//No negative Tweets
						this.$target.find(".polarityCol.against").find(".tweet-container").append($("<h3>").text("No negative tweets found"));
					} else if (response.response.numFound > (response.response.start + 10)) {
						this._fetchingAgainst = false;
					} else {
						//No more elements
						this.$target.find(".polarityCol.against").find(".tweet-container").append($("<h3>").text("End of negative tweets"));
					}
				}
			}
		},

		_renderColumns: function(response, order){
			var docs = response.response.docs;
			for( var i in docs){
				var item = docs[i];
				var tweetId = item['meta.source.tweetId'];
				var $el = $("<div class='tweet'>");
				if(order == "desc"){
					this.$target.find(".polarityCol.agree .tweet-container").append($el);
				} else {
					this.$target.find(".polarityCol.against .tweet-container").append($el);
				}

				twttr.widgets.createTweet(tweetId, $el[0],{
					dnt: true
					//conversation: "none",
					//cards: "hidden"
				});
			}
		},

		_manageScroll : function(event){
			var pos = $(event.target).scrollTop();
			var h = $(event.target).height();
			var height = $(event.target).find(".tweet-container").height();
			if(pos > height - h ){
				if($(event.target).hasClass("agree") && !this._fetchingAgree){
					this._fetchingAgree = true;
					this._lastAGREEpage +=10;
					this._getMoreAgreeTweets();
				} else if( $(event.target).hasClass("against") && !this._fetchingAgainst){
					this._fetchingAgainst = true;
					this._lastAGAINSTpage +=10;
					this._getMoreAgainstTweets();
				}
			}
		},

		/**
		 * render a pieChart with nvd3 library
		 * @param response
		 * @private
		 */
		_renderPieChartsD3 : function(response){
			var resposneObj = JSON.parse(response);
			var polarityCounts = resposneObj.facet_counts.facet_fields["meta.extracted.text_polarity.discrete"];

			var data = [
				{	'label': 'Positive',	'value': polarityCounts["POSITIVE"]	},
				{	'label': 'Negative',	'value': polarityCounts["NEGATIVE"]	},
				{	'label': 'Neutral',		'value': polarityCounts["NEUTRAL"],	'disabled' : true	}
			];

			nv.addGraph(function() {
				var graph = d3.select(".tweet-pie-chart svg");
				var chart = nv.models.pieChart()
					.x(function(d) { return d.label })
					.y(function(d) { return d.value })
					.labelType("percent")
					.color(['#33A7D4' ,'#E63333', '#999999'])
					.legendPosition("right")
					.margin({top: 0, right: 0, bottom: 0, left: 0})
					.donut(true)
					.donutRatio(0.35)
					.showLabels(true);

				var legendTopMargin = Math.floor( graph.node().getBoundingClientRect().height/5 );
				chart.legend.margin({top: legendTopMargin, right: 50, bottom: 0, left: 25});
				chart.legend.width(120);
				chart.legend.rightAlign(false);

				graph.datum(data)
					.transition().duration(500)
					.call(chart);

				nv.utils.windowResize(chart.update);
				return chart;
			});
		},


		/**
		 * PIE Chart with Google visual PieChart
		 * @param response
		 * @private
		 */
		_renderPieCharts : function(response){
			var resposneObj = JSON.parse(response);
			var polarityCounts = resposneObj.facet_counts.facet_fields["meta.extracted.text_polarity.discrete"];

			var options = {
				legend:'none',
				width: '100%',
				height: '100%',
				pieSliceText: 'percentage',
				colors: ['#33A7D4' ,'#E63333', '#999999'],
				chartArea: {
					height: "90%",
					width: "90%"
				}
			};

			var data = google.visualization.arrayToDataTable([
				['Label', 'Value'],
				['Positive', polarityCounts["POSITIVE"]],
				['Negative', polarityCounts["NEGATIVE"]]
			]);
			var chart = new google.visualization.PieChart(this.$target.find(".dual-pie-chart").get(0));
			chart.draw(data, options);

			var data2 = google.visualization.arrayToDataTable([
				['Label', 'Value'],
				['Positive', polarityCounts["POSITIVE"]],
				['Negative', polarityCounts["NEGATIVE"]],
				['Neutral', polarityCounts["NEUTRAL"]]
			]);
			var chart2 = new google.visualization.PieChart(this.$target.find(".complete-pie-chart").get(0));
			chart2.draw(data2, options);
		},

		_renderTimeTweetsChart: function(responsePositive, responseNegative){

			var resposneObjPositive = JSON.parse(responsePositive[0]);
			var dateCountsPositive = resposneObjPositive.facet_counts.facet_dates["meta.source.datePublished"];

			var resposneObjNegative = JSON.parse(responseNegative[0]);
			var dateCountsNegative = resposneObjNegative.facet_counts.facet_dates["meta.source.datePublished"];

			var dataArray = [];
			dataArray.push(["Date", "Positive", "Negative"]);
			_.each(dateCountsPositive, function(count, date){
				//The Solr response add this attributes on the facet array
				if( date !== "gap" && date !== "start" && date !== "end" ){
					dataArray.push([new Date(date), count, dateCountsNegative[date]]);
				}
			});
			var data = google.visualization.arrayToDataTable(dataArray);

			var options = {
				title: 'Tweets Counts',
				//curveType: 'function',
				legend: { position: 'bottom' },
				colors: ['#33A7D4' ,'#E63333', '#999999'],
				explorer:{
					axis: 'horizontal',
					actions: ['dragToZoom', 'rightClickToReset'],
					keepInBounds: true
				}
			};

			var chart = new google.visualization.LineChart(this.$target.find(".tweet-time-chart").get(0));
			chart.draw(data, options);
			this.$target.find(".tweet-time-chart").removeClass("ui-loading-modal");

			google.visualization.events.addListener(chart, 'select', this._onTimeTweetSelect.bind(this, chart, data));
		},

		_onTimeTweetSelect: function(chart, data){
			var selection = chart.getSelection();
			if(selection && selection[0] && selection[0].row){
				var dateFrom = data.getValue(selection[0].row,0);
				var dateTo = new Date(dateFrom);
				dateTo.setDate(dateTo.getDate() + 1); // Add 1 day
				this._setDateFilter(dateFrom,dateTo);
			}
		},

		_setDateFilter: function(dateFrom, dateTo){
			EUMSSI.EventManager.trigger("DateFilter:addFilter", {
				dateFrom: dateFrom,
				dateTo: dateTo
			});
		}

	});

})(jQuery);



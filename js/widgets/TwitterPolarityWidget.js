/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL, d3, twttr, CKEDITOR, nv */
(function ($) {

	AjaxSolr.TwitterPolarityWidget = AjaxSolr.AbstractFacetWidget.extend({

		init: function() {
			this.$target = $(this.target);
			this.$tabs = $(this.target).parents(".tabs-container");

			if(this.renderOnClosedOnly === true){
				EUMSSI.EventManager.on("leftside", this._tabChange.bind(this));
			} else {
				EUMSSI.EventManager.on("leftside", this._reloadGraphics.bind(this));
			}
		},

		_initLayout: function(){
			//Initial View
			var template = _.template($("#twitter-polarity-columns-tpl").text());
			this.$target.append(template());

			this.tweetTimeline = new EUMSSI.components.TwitterPolarityWidget(this.$target.find(".tweet-time-chart-placeholder"));

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
					this.$tabs.off("tabsactivate."+this.id);
					this.$tabs.on("tabsactivate."+this.id, this._tabChange.bind(this) );
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
			return true;
		},

		/**
		 * Check if the current open tab is this widget tab and then load the widget
		 * @private
		 */
		_tabChange: function(){
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");
			if(!this.renderOnClosedOnly || (this.renderOnClosedOnly && !UTIL.isEditorOpen())){
				if(this.$tabs.tabs( "option", "active") === tabPosition) {
					this.$tabs.off("tabsactivate."+this.id);
					this._loadData();
				}
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
			this.tweetTimeline.loadTimeChart();

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
			var i, item, tweetId, $el;
			var docs = response.response.docs;
			for( i in docs ){
				item = docs[i];
				tweetId = item['meta.source.tweetId'];
				$el = $("<div class='tweet'>");
				if(order == "desc"){
					this.$target.find(".polarityCol.agree .tweet-container").append($el);
				} else {
					this.$target.find(".polarityCol.against .tweet-container").append($el);
				}

				twttr.widgets.createTweet(tweetId, $el[0],{
					dnt: true
					//conversation: "none",
					//cards: "hidden"
				}).then(this._renderSendToEditorBtn.bind(this, $el, tweetId));
			}
		},
		
		_renderSendToEditorBtn : function($element, tweetId){
			setTimeout(function($element, tweetId){
				// if($element.find("iframe").length === 0) {
				// 	this._renderSendToEditorBtn($element, tweetId);
				// }else{
					var iframeContentSize = $element.find("iframe").contents().find("body").html().length;
					if (!EUMSSI.demoMode && CKEDITOR && iframeContentSize >= 1) {
						var $sendToEditor = $('<div class="tweet-to-editor" title="Write tweet on text editor">')
							.html('<span class="ui-icon ui-icon-comment">&nbsp;</span>&nbsp;to Editor');
						$element.append($sendToEditor);
						$sendToEditor.on("click", this._sendToEditor.bind(this, tweetId));
					}
				// }
			}.bind(this, $element, tweetId),300);
		},

		_sendToEditor: function(tweetId){
			$.ajax({
				contentType: "*/*",
				dataType: "jsonp",
				url    : 'https://api.twitter.com/1.1/statuses/oembed.json?' + $.param({
					id : tweetId,
					omit_script: true,
					hide_media : false
				}),
				success: function(response){
					var oEditor = CKEDITOR.instances["richeditor-placeholder"];
					oEditor.insertHtml( response.html + "<p>&nbsp;</p>" );
				}.bind(this)
			});
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
				{	'label': 'Neutral',		'value': polarityCounts["NEUTRAL"] } //disabled: true
			];
			var self = this;
			nv.addGraph(function() {
				var graph = d3.select(self.$target.find(".tweet-pie-chart svg")[0]);
				var chart = nv.models.pieChart()
					.x(function(d) { return d.label; })
					.y(function(d) { return d.value; })
					.labelType("percent")
					.color(['#33A7D4' ,'#E63333', '#999999'])
					.legendPosition("right")
					.margin({top: 0, right: 0, bottom: 0, left: 0})
					.donut(true)
					.donutRatio(0.35)
					.noData("There is no Data to display")
					.showLabels(true);

				var legendTopMargin = Math.floor( graph.node().getBoundingClientRect().height/5 );
				chart.legend.margin({top: legendTopMargin, right: 50, bottom: 0, left: 25});
				chart.legend.width(120);
				chart.legend.rightAlign(false);

				graph.datum(data)
					.transition().duration(500)
					.call(chart);

				nv.utils.windowResize(chart.update);
				self._pieChart = chart;
				return chart;
			});
		},

		/**
		 * Renders the charts with the same data in order to fit better to the current placeholder size.
		 * @private
		 */
		_reloadGraphics: function(){
			if(this._pieChart){
				this._pieChart.update();
			}
			if(this.tweetTimeline){
				this.tweetTimeline.reloadChart();
			}
		}

	});

})(jQuery);



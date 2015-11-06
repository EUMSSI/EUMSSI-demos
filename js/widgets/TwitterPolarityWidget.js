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

			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this._loadData();
			} else {
				this.$tabs.off("tabsactivate.twitterpolaritywidget");
				this.$tabs.on("tabsactivate.twitterpolaritywidget", this._tabChange.bind(this) );
			}
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
		}

	});

})(jQuery);



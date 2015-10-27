(function ($) {

	AjaxSolr.GenericWordCloudWidget = AjaxSolr.AbstractFacetWidget.extend({

		init: function() {
			this.$target = $(this.target);
			this.$tabs = $(this.target).parents(".tabs-container");
			this.wordNumber = 100;
			this.maxCount = 1;
			this.field = EUMSSI.CONF.CLOUD_FIELD_NAME;
		},

		afterRequest: function () {
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");

			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this._getWordCloud();
			} else {
				this.$tabs.off("tabsactivate.genericwordcloudwidget");
				this.$tabs.on("tabsactivate.genericwordcloudwidget", this._tabChange.bind(this) );
			}
		},

		/**
		 * Check if the current open tab is this widget tab and then load the widget
		 * @private
		 */
		_tabChange: function(){
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this.$tabs.off("tabsactivate.genericwordcloudwidget");
				this._getWordCloud();
			}
		},

		_getWordCloud: function(){
			//Loading
			$(this.target).addClass("ui-loading-modal");
			$(this.target).empty();

			var facet, count, i, l, size, tabPosition,
				maxCount = 0,
				objectedItems = [];
			for ( facet in this.manager.response.facet_counts.facet_fields[this.field]) {
				count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);
				if (count > maxCount) {
					maxCount = count;
				}
				objectedItems.push({ text: facet, size: count });
			}
			objectedItems.sort(function (a, b) {
				return a.facet < b.facet ? -1 : 1;
			});

			this.maxCount = maxCount;

			this._renderWords(objectedItems);
			$(this.target).removeClass("ui-loading-modal");
		},


		_renderWords: function(tf){
			console.log("data received: ", tf);
			var self = this;
			var size = 500;
			var scale = 50;

			//update
			for (var i in tf) {
				var s = tf[i].size;
				tf[i].size = 10 + scale * (s / this.maxCount);
			}
			console.log("data is: ", tf);
			var fill = d3.scale.category20();

			d3.layout.cloud().size([size * 2, size * 2])
				.words(tf)
				.padding(5)
				.rotate(function() { return ~~(-1) * (Math.random() * 2); })
				.font("Impact")
				.fontSize(function(d) { return d.size; })
				.on("end", draw)
				.start();
			function draw(words) {
				d3.select("#my-genericwordcloud").append("svg")
					.attr("width", size*2)
					.attr("height", size*2)
					.append("g")
					.attr("transform", "translate(450,350)")
					.selectAll("text")
					.data(words)
					.enter().append("text")
					.style("font-size", function(d) { return d.size + "px"; })
					.style("font-family", "Impact")
					.style("fill", function(d, i) { return fill(i); })
					.attr("text-anchor", "middle")
					.attr("transform", function(d) {
						return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
					})
					.text(function(d) { return d.text; })
					.on("mouseover", function(d) {
						d3.select(this).style("font-size", function(d) { return (d.size + 20)  + "px"; })})
					.on("mouseleave", function(d) {
						d3.select(this).style("font-size", function(d) { return (d.size)  + "px"; })})
					.on("click", function (d){
						self._onWordClick(d);
					}.bind(self));
			}
		},

		_onWordClick: function(d){
			//Remove previous Value
			//this.clearFilter(true);
			this.setFilter(d.text);

			EUMSSI.Manager.doRequest(0);
		},

		/**
		 * Sets the main Solr query to the given string.
		 * @param {String} attributeName The name of the filter key.
		 * @param {String} value the value for the filter.
		 */
		setFilter: function (value) {
			//Set the current Filter
			this.storedValue = this.field + ":" + value;
			EUMSSI.FilterManager.addFilter(this.field, this.storedValue, this.id, this.field+": "+value);
		},

		/**
		 * Sets the main Solr query to the empty string.
		 * @param {Boolean} [silent] true, if don't want to trigger the change event
		 */
		clearFilter: function (silent) {
			EUMSSI.FilterManager.removeFilterByWidget(this.id, silent);
		}

	});

})(jQuery);

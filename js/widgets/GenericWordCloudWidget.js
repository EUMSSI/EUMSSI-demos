(function ($) {

	AjaxSolr.GenericWordCloudWidget = AjaxSolr.AbstractFacetWidget.extend({

		init: function() {
			this.$target = $(this.target);
			this.$tabs = $(this.target).parents(".tabs-container");
			this.maxWords = this.maxWords || 100;
			this.maxCount = 1;
			this.field = EUMSSI.CONF.CLOUD_FIELD_NAME;

			//WordCloud content
			this.$placeholder = $('<div class="genericwordcloud"></div>');
			this.$target.append(this.$placeholder);

			//Key Selector
			EUMSSI.EventManager.on("wordselectchange", this._onWordCloudSelectChangeWord.bind(this));
			EUMSSI.EventManager.on("showRelations", this.onShowRelations.bind(this));

			//Refresh the graphic when expand collapse the editor
			EUMSSI.EventManager.on("leftside", this._getWordCloud.bind(this));

			this.$tabs.on("tabsactivate.genericwordcloudwidget", this._tabChange.bind(this) );
		},

		_onWordCloudSelectChangeWord: function(event, value){
			if(this.field != value) {
				this._onSelectKey(value);
			}
		},

		onShowRelations: function(event, value){
			this._onSelectKey(value);
		},

		afterRequest: function () {
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");

			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this._getWordCloud();
			}
		},

		/**
		 * Check if the current open tab is this widget tab and then load the widget
		 * @private
		 */
		_tabChange: function(){
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this._getWordCloud();
			}
		},

		_getWordCloud: function(){
			//Loading
			this.$target.addClass("ui-loading-modal");
			this.$placeholder.empty();

			var facet, count,
				maxCount = 0,
				objectedItems = [];
			if(this.manager.response.facet_counts){
				for ( facet in this.manager.response.facet_counts.facet_fields[EUMSSI.CONF.CLOUD_FIELD_NAME]) {
					count = parseInt(this.manager.response.facet_counts.facet_fields[EUMSSI.CONF.CLOUD_FIELD_NAME][facet]);
					if (count > maxCount) {
						maxCount = count;
					}
					objectedItems.push({ text: facet, size: count });
				}
				objectedItems.sort(function (a, b) {
					return a.size < b.size ? 1 : -1;
				});

				this.maxCount = maxCount;

				this._renderWords(objectedItems);
			} else {
				//empty - NO FACETING ITEMS
			}

			this.$target.removeClass("ui-loading-modal");
		},

		_renderWords: function(tf){
			console.log("data received: ", tf);
			tf = tf.slice(0,this.maxWords);
			var self = this,
			//size = 500,
			scale = 50,
			width = this.$target.closest(".ui-widget-content").width() - 20,
			height = this.$target.closest(".ui-widget-content").height() - 20;

			//update
			for (var i in tf) {
				var s = tf[i].size;
				tf[i].size = 10 + scale * (s / this.maxCount);
			}
			console.log("data is: ", tf);
			var fill = d3.scale.category20();

			d3.layout.cloud().size([width, height])
				.words(tf)
				.padding(5)
				.rotate(function() { return ~~(-1) * (Math.random() * 2); })
				.font("Impact")
				.fontSize(function(d) { return d.size; })
				.on("end", draw)
				.start();
			function draw(words) {
//				d3.select("#my-genericwordcloud").append("svg")
				d3.select(self.$placeholder[0]).append("svg")
					.attr("width", width)
					.attr("height", height)
					.append("g")
                    .attr("transform", "translate("+width/2+","+height/2+")")
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
			this.setFilter(d.text);
			EUMSSI.Manager.doRequest(0);
		},

		/**
		 * Change the value to the Global and local parameter.
		 * Update the Facet fields to retrieve the new one.
		 * Clear the filter and do a new request.
		 * @param {string} keyValue - the selected option value
		 * @private
		 */
		_onSelectKey: function(keyValue){
			this.field = EUMSSI.CONF.CLOUD_FIELD_NAME = keyValue;
			EUMSSI.CONF.updateFacetingFields();
			this.clearFilter();
			EUMSSI.Manager.doRequest(0);
		},

		/**
		 * Sets the main Solr query to the given string.
		 * @param {String} attributeName The name of the filter key.
		 * @param {String} value the value for the filter.
		 */
		setFilter: function (value) {
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

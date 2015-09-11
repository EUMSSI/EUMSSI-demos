/*global jQuery, $, _, AjaxSolr, EUMSSI, google */
(function ($) {

	/**
	 * Widget that represents a World Map with the occurences
	 * @type {A|*|void}
	 * @augments AjaxSolr.AbstractWidget
	 */
	AjaxSolr.MapChartWidget = AjaxSolr.AbstractWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		_chartOptions : {
			//backgroundColor: {fill:'#FFFFFF',stroke:'#FFFFFF' ,strokeWidth:0 },
			colorAxis:  { colors: ['#FFD5C5','#FF4900', '#712000']},
			//legend: 'none',
			displayMode: 'regions', // "regions", "markers"
			enableRegionInteractivity: 'true',
			resolution: 'countries',
			region: 'world',
			//sizeAxis: {minValue: 1, maxValue:1,minSize:10,  maxSize: 10},
			//magnifyingGlass: {enable: true, zoomFactor: 7.5},
			//tooltip: {textStyle: {color: '#444444'}, trigger:'focus'},
			keepAspectRatio: true
			//width:800,
			//height:600
		},


		init: function(){
			this.$target = $(this.target);
			this.$tabs = this.$target.parents(".tabs-container");

			$.getScript( "http://www.google.com/jsapi" )
				.done(function( script, textStatus ) {
					google.load("visualization", "1", {
						packages:["geochart"],
						callback: this._initChart.bind(this)
					});

				}.bind(this))
				.fail(function( jqxhr, settings, exception ) {
					this.$target.text( "Error when try to load Google API." );
				}.bind(this)
			);

			//Cange MapType Radio Buttons
			this.$target.find("#mapChart-displayMode-btn").buttonset();
			this.$target.find("#mapChart-displayMode-btn input[type=radio]").change(function(event) {
				this._chartOptions.displayMode = event.target.value;
				this._refreshChartData();
			}.bind(this));

			//Export Button
			this.$target.find(".mapChart-export-btn").button({
				icons: {
					primary: "ui-icon-extlink"
				}
			});
		},

		beforeRequest: function(){
			return true;
		},

		afterRequest: function(){
			if(!this.manager.flag_PaginationRequest){
				if(this.chart){
					this._renderIfTabActivated();
				} else {
					this._loadAfterInit = true;
				}
			}
		},

		_renderIfTabActivated: function(){
			var tabPosition = this.$target.parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this._refreshChartData();
			} else {
				this.$tabs.off("tabsactivate.mapchartwidget");
				this.$tabs.on("tabsactivate.mapchartwidget", this._tabChange.bind(this));
			}
		},

		/**
		 * Reload the map with the new response
		 * @private
		 */
		_refreshChartData: function(){
			var facet, countryCode, data, facetCount, dataArray = [];

			this.$target.find(".mapChart-export-btn")
				.removeAttr("href")
				.addClass("ui-state-disabled");
			this.$target.find(".mapChart-loading").show();

			if( this._chartOptions.displayMode == "regions" ){
				facetCount = this.manager.response.facet_counts.facet_fields[EUMSSI.CONF.MAP_LOCATION_FIELD_NAME];
				dataArray.push(['Country', 'Text', 'Count']);
				for( facet in facetCount ){
					countryCode = this._getCountryCode(facet);
					if( countryCode ){
						dataArray.push([ countryCode, EUMSSI.UTIL.countryCode_SWAP[countryCode], facetCount[facet]]);
					}
				}
			} else if( this._chartOptions.displayMode == "markers" ){
				facetCount = this.manager.response.facet_counts.facet_fields[EUMSSI.CONF.MAP_CITIES_FIELD_NAME];
				dataArray.push(['City', 'Count']);
				for( facet in facetCount ){
					dataArray.push([ facet, facetCount[facet]]);
				}
			}

			if(dataArray.length > 1){
				data = google.visualization.arrayToDataTable(dataArray);
			} else {
				//If no data the chart don't support 3 columns
				//In order to refresh and show blank map need to pass 2 columns with no data
				data = google.visualization.arrayToDataTable([['Country','Count']]);
			}

			this.chart.draw(data, this._chartOptions);
		},

		/**
		 * Initializes the Map
		 * @private
		 */
		_initChart : function(){
			this.chart = new google.visualization.GeoChart(this.$target.find(".mapChart-chart")[0]);

			//Chart Events
			google.visualization.events.addListener(this.chart, 'regionClick', this._onRegionClick.bind(this));
			//google.visualization.events.addListener(this.chart, 'select', this._onRegionClick.bind(this));
			google.visualization.events.addListener(this.chart, 'ready', this._refreshExportBtn.bind(this));

			var data = google.visualization.arrayToDataTable([ ['Country', 'Count'] ]);
			this.chart.draw(data, this._chartOptions);

			//If a request is maded before map loading
			if(this._loadAfterInit){
				this._renderIfTabActivated();
			}
		},

		/**
		 * Check if the current open tab is this widget tab and then load it
		 * @private
		 */
		_tabChange: function(){
			var tabPosition = this.$target.parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this.$tabs.off("tabsactivate.mapchartwidget");
				this._refreshChartData();
			}
		},

		/**
		 * Adds a button to Export a image of the map
		 * @private
		 */
		_refreshExportBtn: function(){
			this.$target.find(".mapChart-export-btn")
				.attr("href", this.chart.getImageURI())
				.removeClass("ui-state-disabled");
			this.$target.find(".mapChart-loading").hide();
		},

		/**
		 * When click on a Country shows a menu to perform some actions.
		 * @param {google.GeoChart.event} event
		 * @private
		 */
		_onRegionClick: function(event){
			var regionCode = event.region,
				regionName = EUMSSI.UTIL.countryCode_SWAP[regionCode],
				$menu = $('<ul>');

			$menu.append('<div class="ui-widget-header">'+regionName+'</div>');
			if( EUMSSI.FilterManager.checkFilterByWidgetId(this.id) ){
				$menu.append('<li class="filter"><span class="ui-icon ui-icon-plusthick"></span>Add country to filter</li>');
				$menu.append('<li class="filter-clear"><span class="ui-icon ui-icon-minusthick"></span>Clear filter</li>');
			} else {
				$menu.append('<li class="filter"><span class="ui-icon ui-icon-search"></span>Filter by country</li>');
			}
			$menu.append('<li class="open-wikipedia"><span class="ui-icon ui-icon-newwin"></span>Open Wikipedia page</li>');

			$menu.on("click",".filter",this._addContryFilter.bind(this,regionCode));
			$menu.on("click",".filter-clear",this._cleanCountryFilter.bind(this,true));
			$menu.on("click",".open-wikipedia",function(){
				window.open("http://wikipedia.org/wiki/"+regionName,"_blank");
			});

			EUMSSI.UTIL.showContextMenu($menu);
		},

		/**
		 * Remove the last filter query and adds a new one with the
		 * country code of the selected country.
		 * @param {String} regionCode - [ISO 3166-1 alpha-2] country Code
		 * @private
		 */
		_addContryFilter: function(regionCode){
			//Create new FQ
			EUMSSI.FilterManager.addFilter(
				EUMSSI.CONF.MAP_LOCATION_FIELD_NAME,
				EUMSSI.CONF.MAP_LOCATION_FIELD_NAME + ':("' + EUMSSI.UTIL.countryCode_SWAP[regionCode]+ '")',
				this.id,
				"Location: "+EUMSSI.UTIL.countryCode_SWAP[regionCode]
			);
			this.doRequest();
		},

		/**
		 * Remove the current filter
		 * @param {Boolean} fetch - true if want to perform a request
		 * @private
		 */
		_cleanCountryFilter: function(fetch){
			//Clean FQ
			EUMSSI.FilterManager.removeFilterByWidget(this.id);

			if(fetch){
				this.doRequest();
			}
		},

		/**
		 * Returns the country Code (ISO-3166) for the current country name.
		 * @param {String} facetName - The name of the facet with the country location
		 * @returns {String} the code on ISO-3166 format
		 * @private
		 */
		_getCountryCode: function(facetName){
			return EUMSSI.UTIL.countryCode[facetName];
		}

	});

})(jQuery);
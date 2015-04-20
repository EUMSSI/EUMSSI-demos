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
			displayMode: 'regions',
			enableRegionInteractivity: 'true',
			resolution: 'countries',
			region:'world',
			//sizeAxis: {minValue: 1, maxValue:1,minSize:10,  maxSize: 10},
			//magnifyingGlass: {enable: true, zoomFactor: 7.5},
			//tooltip: {textStyle: {color: '#444444'}, trigger:'focus'},
			keepAspectRatio: true,
			width:800,
			height:600
		},


		init: function(){

			$.getScript( "http://www.google.com/jsapi" )
				.done(function( script, textStatus ) {
					google.load("visualization", "1", {
						packages:["geochart"],
						callback: this._initChart.bind(this)
					});

				}.bind(this))
				.fail(function( jqxhr, settings, exception ) {
					$(this.target).text( "Error when try to load Google API." );
				}.bind(this));
		},

		beforeRequest: function(){
			if(!this.flag_MapChartRequest && !this.manager.flag_PaginationRequest) {
				//Clean FQ - if the call don't activate the flag of Map
				this.manager.store.removeByValue('fq', this._lastfq);
			}
			this.flag_MapChartRequest = false;
		},

		afterRequest: function(){
			if(!this.manager.flag_PaginationRequest){
				if(this.chart){
					this._refreshChartData();
				} else {
					this._loadAfterInit = true;
				}
			}
		},

		/**
		 * Reload the map with the new response
		 * @private
		 */
		_refreshChartData: function(){
			var facet, countryCode, data,
				countryDataArray = [],
				facetCount = this.manager.response.facet_counts.facet_fields[CONF.MAP_LOCATION_FIELD_NAME];

			countryDataArray.push(['Country', 'Text', 'Count']);
			for( facet in facetCount ){
				countryCode = this._getCountryCode(facet);
				if( countryCode ){
					countryDataArray.push([ countryCode, UTIL.countryCode_SWAP[countryCode], facetCount[facet]]);
				}
			}

			if(countryDataArray.length > 1){
				data = google.visualization.arrayToDataTable(countryDataArray);
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
			this.chart = new google.visualization.GeoChart($(this.target)[0]);

			//Chart Events
			google.visualization.events.addListener(this.chart, 'regionClick', this._onRegionClick.bind(this));
			//google.visualization.events.addListener(this.chart, 'select', this._onRegionClick.bind(this));
			google.visualization.events.addListener(this.chart, 'ready', this._renderExportBtn.bind(this));

			var data = google.visualization.arrayToDataTable([ ['Country', 'Count'] ]);
			this.chart.draw(data, this._chartOptions);

			//If a request is maded before map loading
			if(this._loadAfterInit){
				this._refreshChartData();
			}
		},

		/**
		 * Adds a button to Export a image of the map
		 * @private
		 */
		_renderExportBtn: function(){
			var imgUri = this.chart.getImageURI(),
				$exportBtn = $("<a class='export_link'>EXPORT</a>");

			//imgUri = imgUri.replace(/^data:image\/png/, 'data:application/octet-stream');
			$exportBtn.attr("href", imgUri);
			$exportBtn.attr("download", "chart.png");

			$(this.target).parent().find("a.export_link").remove();
			$(this.target).parent().append($exportBtn);
		},

		/**
		 * When click on a Country shows a menu to perform some actions.
		 * @param {google.GeoChart.event} event
		 * @private
		 */
		_onRegionClick: function(event){
			var $menu = $('<ul class="click-menu">');
			$menu.append('<li class="filter-add"><span class="ui-icon ui-icon-plusthick"></span>Filter by Country</li>');
			if(this._lastfq){
				$menu.append('<li class="filter-clear"><span class="ui-icon ui-icon-minusthick"></span>Clear Filter</li>');
			}

			$("body").append($menu);
			$menu.menu({
				position: { my: "left top", at: "left+"+window.mouse_x + " top+" + window.mouse_y, of:"window"}
			});
			$menu.css("position","absolute");
			$menu.css("left",window.mouse_x - 10);
			$menu.css("top",window.mouse_y - 10);

			$menu.on("click",".filter-add",this._addContryFilter.bind(this,event));
			$menu.on("click",".filter-clear",this._cleanCountryFilter.bind(this,true));

			function removeMenu(){
				$menu.remove();
			}
			$menu.on("click mouseleave",removeMenu);

		},

		/**
		 * Remove the last filter query and adds a new one with the
		 * country code of the selected country.
		 * @param {google.GeoChart.event} event
		 * @private
		 */
		_addContryFilter: function(event){
			this._cleanCountryFilter(false);
			//Create new FQ
			var region = event.region;
			this._lastfq = CONF.MAP_LOCATION_FIELD_NAME + ':("' + UTIL.countryCode_SWAP[region]+ '")';
			this.manager.store.addByValue('fq', this._lastfq );
			this.flag_MapChartRequest = true;
			this.doRequest();
		},

		/**
		 * Remove the current filter
		 * @param {Boolean} fetch - true if want to perform a request
		 * @private
		 */
		_cleanCountryFilter: function(fetch){
			//Clean FQ
			this.manager.store.removeByValue('fq', this._lastfq);
			this._lastfq = undefined;
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
			return UTIL.countryCode[facetName];
		}

	});

})(jQuery);
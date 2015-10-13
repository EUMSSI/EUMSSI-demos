/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL, FilterManager, EventManager */

window.EUMSSI = {
	Manager : {},
	FilterManager : new FilterManager(),
	EventManager : new EventManager(),
	CONF : CONF || {},
	UTIL : UTIL || {},
	pageLayout : undefined,
	contentLayout : undefined
};

(function ($) {

	$(function () {

		EUMSSI.Manager = new AjaxSolr.Manager({
			solrUrl : 'http://eumssi.cloudapp.net/Solr_EUMSSI/content_items/'
		});

		EUMSSI.Manager.addWidget(new AjaxSolr.FilterViewerWidget({
			id: 'filterViewer',
			target: '.filterViewer-placeholder',
			label: "Custom Filters"
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.TimelineWidget({
			id: 'my-timeline',
			target: '#my-timeline'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.WordCloudWidget({
			id: 'my-wordcloud',
			target: '#my-wordcloud'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.ResultWidget({
			id: 'result',
			target: '.resultWidget-placeholder'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.SelectLocaleWidget({
			id: 'locale',
			target: '.localeWidget-placeholder',
			attributeName: 'meta.source.inLanguage'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.SelectVideoQualityWidget({
			id: 'videoQuality',
			target: '.videoQualityWidget-placeholder'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.DynamicSearchWidget({
			id: 'mainFilter',
			target: '.mainSearch-placeholder',
			preload: [
				{key:"GENERAL_SEARCH",label:"Content Search", showInResultCheck: false}
			]
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.DynamicSearchWidget({
			id: 'filterManager',
			target: '.generatedFilters-placeholder',
			targetButton: ".btn-do-add-filter",
			preload: [
				// Place here the infor to create TextWidgets Automatically
				//{key:"meta.source.text",label:"Content Search", showInResultCheck: false},
				{key:"meta.extracted.audio_transcript",label:"Audio Transcript", showInResultCheck: true},
				{key:"meta.extracted.video_ocr.best",label:"OCR", showInResultCheck: true},
				{key:"meta.extracted.text.dbpedia.PERSON",label:"Person", showInResultCheck: true},
				{key:"meta.extracted.text.dbpedia.LOCATION",label:"Location", showInResultCheck: true}
				//...
			]
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.TagFacetWidget({
			id: "source",
			label: "Source",
			target: '.source-placeholder',
			field: "source"
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.MapChartWidget({
			id: "MapChartWidget",
			target: '.mapChart'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.TagcloudWidget({
			id: 'TagCloudWidget',
			target: '.tagCloud-placeholder',
			field: EUMSSI.CONF.PERSON_FIELD_NAME
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.PagerWidget({
			id: 'pager',
			target: '.pager',
			prevLabel: '&lt;',
			nextLabel: '&gt;',
			innerWindow: 1,
			renderHeader: function (perPage, offset, total) {
				$('.pager-header').html($('<span></span>').text('displaying ' + Math.min(total, offset + 1) + ' to ' + Math.min(total, offset + perPage) + ' of ' + total));
			},
			cleanHeader: function() {
				$('.pager-header').empty();
			}
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.VideoPlayerWidget({
			id: "videoPlayer"
			//target: '.mapChart-placeholder'
		}));


		EUMSSI.Manager.init();
		EUMSSI.Manager.retrieveSolrFieldsNames();

		//Set Main Query to search on All
		EUMSSI.Manager.store.addByValue('q', '*:*');
		//Example: Search Only items with headline
		//Manager.store.addByValue('q', 'meta.source.headline:[* TO *]');
		EUMSSI.Manager.store.addByValue('ident', 'true');

		//Faceting Parametres
		var params = {
			'facet': true,
			'facet.field': [
				'source',
				EUMSSI.CONF.MAP_LOCATION_FIELD_NAME,
				EUMSSI.CONF.MAP_CITIES_FIELD_NAME,
				EUMSSI.CONF.PERSON_FIELD_NAME
			],

			//'facet.limit': 20,	// Tagclud Size
			'facet.mincount': 1,	// Min count to appear

			'f.source.facet.limit': 20,
			//'f.meta.extracted.text.dbpedia.PERSON.facet.limit' : 50,
			//'f.meta.extracted.text.ner.LOCATION.facet.prefix': 'LOCATION',

			//'facet.date': 'date',
			//'facet.date.start': '1987-02-26T00:00:00.000Z/DAY',
			//'facet.date.end': '1987-10-20T00:00:00.000Z/DAY+1DAY',
			//'facet.date.gap': '+1DAY',
			'json.nl': 'map'
			//'timeAllowed': 100		// Tiempo límite para la consulta (ms)
		};
		params['f.' + EUMSSI.CONF.MAP_LOCATION_FIELD_NAME + '.facet.limit'] = 250;
		params['f.' + EUMSSI.CONF.MAP_CITIES_FIELD_NAME + '.facet.limit'] = 25;
		params['f.' + EUMSSI.CONF.PERSON_FIELD_NAME + '.facet.limit'] = 50;

		for (var name in params) {
			EUMSSI.Manager.store.addByValue(name, params[name]);
		}

		//Perform an initial Search
		//EUMSSI.Manager.doRequest();


		/** ADDITIONAL FUNCTIONS **/
		function showMainLayout(){
			//Move the input to search
			var $mainSearchInput = $(".ui-section-initpage .mainSearch-placeholder").detach();
			$(".ui-section-mainlayout .filterViewer-placeholder").after($mainSearchInput);
			//Change the panels and initialize the layout
			$(".ui-section-initpage").hide();
			$(".ui-section-mainlayout").show();
			initLayout();
		}

		$(".ui-section-initpage input").focus().bind('keydown', function(e) {
			if (e.which == $.ui.keyCode.ENTER) {
				showMainLayout();
			}
		});

		$("button.btn-do-search-initpage").click(function(){
			showMainLayout();
			//Make the initial request
			EUMSSI.Manager.doRequest(0);
		});

		//Search Button
		$("button.btn-do-search").click(function(){
			EUMSSI.Manager.doRequest(0);
		});


		/******************** JQUERY.TABS ********************/
		$(".tabs-container").tabs({
			active: 0
		});

		function initLayout(){
			/******************** <JQUERY.LAYOUT> ********************/
			/*
			 NORTH	HEADER (TITLE + LOGO)
			 WEST	SIMPLE SEARCH
			 CENTER	CONTENT LAYOUT
			 EAST	-void-
			 SOUTH	FOOTER (HIDDEN)
			 */
			EUMSSI.pageLayout = $("div.ui-section-mainlayout").layout({
				defaults:{
					//applyDefaultStyles: true
				},
				north: {
					size: 85,
					resizable: false,
					closable: false,
					slidable: false,
					resizerClass: "ui-layout-resizer-none" // displayNone

				},
				south: {
					size: 45,
					initHidden: true
				},
				west: {
					size: 230,
					resizable: false,
					resizerClass: "ui-layout-resizer-none" // displayNone
				}
			});

			EUMSSI.pageLayout.allowOverflow("center");

			/*
			 NORTH	-void-
			 WEST	ADVANCED FILTER
			 CENTER	RESULT CONTENT
			 EAST	AUXILIAR WIDGETS
			 FOOTER	-void-
			 */
			EUMSSI.contentLayout = $("body .content-panel").layout({
				west: {
					size: 230,
					initClosed: true,
					resizable: false,
					closable: true,
					slidable: true,
					togglerClass: "ui-layout-toggler-none",
					sliderTip: "Advanced Filter"
				},
				east: {
					size: 420,
					initClosed: true,
					resizable: false,
					closable: true,
					slidable: true,
					togglerClass: "ui-layout-toggler-none",
					sliderTip: "Auxiliar Widgets"

					// pseudoClose Option Syntax
					//onclose: $.layout.callbacks.pseudoClose

					// assign the 'slideOffscreen' effect to any pane(s) you wish
					//fxName:   "slideOffscreen",
					//fxSpeed:  500 // optional
				}
			});

			EUMSSI.contentLayout.addPinBtn(".button-pin-west", "west");
			EUMSSI.contentLayout.addPinBtn(".button-pin-east", "east");
			/***************** </JQUERY.LAYOUT> *******************/
		}

		// Record mouse position in order to display contextual menus
		$(document).mousemove(function(e) {
			window.mouse_x = e.pageX;
			window.mouse_y = e.pageY;
		});

	});

})(jQuery);

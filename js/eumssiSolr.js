var Manager;

(function ($) {

	$(function () {

		Manager = new AjaxSolr.Manager({
			solrUrl : 'http://eumssi.cloudapp.net/Solr_EUMSSI/content_items/'
		});

		Manager.addWidget(new AjaxSolr.ResultWidget({
			id: 'result',
			target: '.resultWidget-placeholder'
		}));

		Manager.addWidget(new AjaxSolr.PagerWidget({
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

		Manager.addWidget(new AjaxSolr.SelectLocaleWidget({
			id: 'locale',
			target: '.localeWidget-placeholder',
			attributeName: 'meta.source.inLanguage'
		}));

		Manager.addWidget(new AjaxSolr.SelectVideoQualityWidget({
			id: 'videoQuality',
			target: '.videoQualityWidget-placeholder'
		}));

		Manager.addWidget(new AjaxSolr.FilterManagerWidget({
			id: 'mainFilter',
			target: '.mainSearch-placeholder',
			preload: [
				{key:"meta.source.text",label:"Content Search", showInResultCheck: false}
			]
		}));

		Manager.addWidget(new AjaxSolr.FilterManagerWidget({
			id: 'filterManager',
			target: '.generatedFilters-placeholder',
			targetButton: ".btn-do-add-filter",
			preload: [
				// Place here the infor to create TextWidgets Automatically
				//{key:"meta.source.text",label:"Content Search", showInResultCheck: false},
				{key:"meta.extracted.audio_transcript",label:"Audio Transcript", showInResultCheck: true},
				{key:"meta.extracted.video_ocr.best",label:"OCR", showInResultCheck: true},
				{key:"meta.extracted.text.dbpedia",label:"DBPedia", showInResultCheck: true},
				{key:"meta.extracted.text.ner",label:"NER", showInResultCheck: true}
				//...
			]
		}));

		Manager.addWidget(new AjaxSolr.TagFacetWidget({
			id: "source",
			label: "Source",
			target: '.source-placeholder',
			field: "source"
		}));

		Manager.addWidget(new AjaxSolr.MapChartWidget({
			id: "MapChartWidget",
			target: '.mapChart-placeholder'
		}));

		Manager.init();
		//Set Main Query to search on All
		Manager.store.addByValue('q', '*:*');
		//Example: Search Only items with headline
		//Manager.store.addByValue('q', 'meta.source.headline:[* TO *]');
		Manager.store.addByValue('ident', 'true');

		//Faceting Parametres
		var params = {
			'facet': true,
			'facet.field': [ 'source', 'meta.extracted.text.ner' ],

			//'facet.limit': 20,	// Tagclud Size
			'facet.mincount': 1,	// Min count to appear

			'f.source.facet.limit': 10,

			'f.meta.extracted.text.ner.facet.limit': 250,
			'f.meta.extracted.text.ner.facet.prefix': 'LOCATION',

			//'facet.date': 'date',
			//'facet.date.start': '1987-02-26T00:00:00.000Z/DAY',
			//'facet.date.end': '1987-10-20T00:00:00.000Z/DAY+1DAY',
			//'facet.date.gap': '+1DAY',
			'json.nl': 'map'
			//'timeAllowed': 100		// Tiempo límite para la consulta (ms)
		};
		for (var name in params) {
			Manager.store.addByValue(name, params[name]);
		}

		//Perform an initial Search
		Manager.doRequest();

		/** ADDITIONAL FUNCTIONS **/

		//Search Button
		$("button.btn-do-search").click(function(){
			Manager.doRequest(0);
		});

		/******************** JQUERY.TABS ********************/
		$(".tabs-container").tabs();

		/******************** <JQUERY.LAYOUT> ********************/
		/*
			NORTH	HEADER (TITLE + LOGO)
			WEST	SIMPLE SEARCH
			CENTER	CONTENT LAYOUT
			EAST	-void-
			SOUTH	FOOTER (HIDDEN)
		 */
		window.pageLayout = $("body").layout({
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

		pageLayout.allowOverflow("center");

		/*
			NORTH	-void-
			WEST	ADVANCED FILTER
			CENTER	RESULT CONTENT
			EAST	AUXILIAR WIDGETS
			FOOTER	-void-
		 */
		window.contentLayout = $("body .content-panel").layout({
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

		contentLayout.addPinBtn(".button-pin-west", "west");
		contentLayout.addPinBtn(".button-pin-east", "east");
		/***************** </JQUERY.LAYOUT> *******************/


	});

})(jQuery);

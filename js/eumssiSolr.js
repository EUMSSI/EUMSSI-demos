/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL, FilterManager, EventManager */

window.EUMSSI = {
	Manager : {},
	SegmentManager : {},
	FilterManager : new FilterManager(),
	EventManager : new EventManager(),
	CONF : CONF || {},
	UTIL : UTIL || {},
	pageLayout : undefined,
	contentLayout : undefined,
	$tabs : undefined
};

(function ($) {

	$(function () {

		//<editor-fold desc="MAIN CORE MANAGER">

		EUMSSI.Manager = new AjaxSolr.Manager({
			solrUrl : 'http://demo.eumssi.eu/Solr_EUMSSI/content_items/',
			segmentsCoreUrl : 'http://demo.eumssi.eu/Solr_EUMSSI/segments/'
		});

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
			//'facet.mincount': 1,	// Min count to appear
			'json.nl': 'map'
		};
		for (var name in params) {
			EUMSSI.Manager.store.addByValue(name, params[name]);
		}
		EUMSSI.CONF.updateFacetingFields();


		EUMSSI.Manager.addWidget(new AjaxSolr.FilterViewerWidget({
			id: 'filterViewer',
			target: '.filterViewer-placeholder',
			label: "Custom Filters"
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.TimelineWidget({
			id: 'my-timeline',
			target: '#my-timeline'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.GenericWordCloudWidget({
			id: 'my-genericwordcloud',
			target: '#my-genericwordcloud'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.TwitterPolarityWidget({
			id: 'twitterPolarity',
			target: '.polarity-placeholder'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.GenericGraphWidget({
			id: 'my-genericgraph',
			target: '#my-genericgraph'
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

		EUMSSI.Manager.addWidget(new AjaxSolr.CheckboxWidget({
			id: 'videoDocuments',
			key: 'meta.source.mediaurl',
			label: 'Video documents',
			title: 'Check if only want results with video',
			target: '.videoDocuments-placeholder'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.CheckboxWidget({
			id: 'videoWithPersonIdent',
			key: 'meta.extracted.video_persons.amalia',
			label: 'Videos with person identification',
			title: 'Check if only want results of videos with Persons Identifications',
			target: '.videoWithPersonIdent-placeholder'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.CheckboxWidget({
			id: 'videoWithAudioTranscript',
			key: 'meta.extracted.audio_transcript',
			label: 'Videos with audio transcript',
			title: 'Check if only want results of videos with Audio Transcript',
			target: '.videoWithAudioTrans-placeholder'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.DateFilterWidget({
			id: 'dateFilterWidget',
			key: 'meta.source.datePublished',
			target: '.dateFilterWidget-placeholder'
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
				{key:"meta.extracted.audio_transcript",label:"Audio Transcript", showInResultCheck: false},
				{key:"meta.extracted.video_ocr.best",label:"Caption in video", showInResultCheck: true},
				//{key:"meta.extracted.video_persons.amalia",label:"Person Identification", showInResultCheck: false},
				{key:"meta.extracted.text_nerl.dbpedia.PERSON",label:"Person", showInResultCheck: true},
				{key:"meta.extracted.text_nerl.dbpedia.LOCATION",label:"Location", showInResultCheck: true},
				{key:"meta.extracted.video_persons.thumbnails",label:"Persons in video", showInResultCheck: true}
				//...
			]
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.TagFacetWidget({
			id: "source",
			label: "Source",
			target: '.source-placeholder',
			field: "source",
			persistentFilter: true
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
		}));

		//Perform an initial Search
		//EUMSSI.Manager.doRequest();
		//</editor-fold>


/*
		//DATEPICKER Default LOCALE
		var language = window.navigator.userLanguage || window.navigator.language;
		if(language) {
			$.datepicker.setDefaults( $.datepicker.regional[language] );
		}
*/
		$.datepicker.setDefaults( $.datepicker.regional[''] );

		//<editor-fold desc="JQUERY.TABS">

		EUMSSI.$tabs = $(".tabs-container").tabs({
			active: 0
		});

		//</editor-fold>


		//<editor-fold desc="JQUERY.LAYOUT">

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
				}
				//east: {
				//	size: 420,
				//	initClosed: true,
				//	resizable: false,
				//	closable: true,
				//	slidable: true,
				//	togglerClass: "ui-layout-toggler-none",
				//	sliderTip: "Auxiliar Widgets"
				//}
			});

			EUMSSI.contentLayout.addPinBtn(".button-pin-west", "west");
			//EUMSSI.contentLayout.addPinBtn(".button-pin-east", "east");
			/***************** </JQUERY.LAYOUT> *******************/
		}

		//</editor-fold>


		//<editor-fold desc="MISC">

		function showMainLayout(){
			//Move the input to search
			var $mainSearchInput = $(".ui-section-initpage .mainSearch-placeholder").detach();
			$(".ui-section-mainlayout .filterViewer-placeholder").after($mainSearchInput);
			//Append help icon - may improve this
			$mainSearchInput.find(".filter-container h2").after($("#search-info-icon-tpl").text());
			$mainSearchInput.find(".search-info").click(UTIL.showSearchHelp);
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

		// Record mouse position in order to display contextual menus
		$(document).mousemove(function(e) {
			window.mouse_x = e.pageX;
			window.mouse_y = e.pageY;
		});

		//</editor-fold>

		//<editor-fold desc="FEEDBACK">

		function sendFeedback(event){
			var $form = $(this).find("form");
			var formData = {
				user : $form.find(".user").val(),
				//email : $form.find(".email").val(),
				type : $form.find(".type").val(),
				comment : $form.find(".comment").val(),
				state : JSON.stringify(UTIL.serializeCurrentState())
			};

			$.ajax({
				url: 'http://demo.eumssi.eu/EumssiApi/webapp/feedback/report?' + $.param(formData),
				success: function(response){
					$(this).dialog("destroy").remove();
				}.bind(this)
			});

		}

		//Open feedback dialog
		$("button.btn-do-feedback").click(function(){
			var $dialogContent = $($("#feedback-dialog-tpl").html());
			var dialog = $dialogContent.dialog({
				title: "Post Feedback",
				modal: true,
				width: 'auto',
				buttons: {
					"Submit": sendFeedback,
					Cancel: function() {
						dialog.dialog( "close" );
					}
				}
			});
		});




		//</editor-fold>

	});

})(jQuery);

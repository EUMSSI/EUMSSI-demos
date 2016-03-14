/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL, FilterManager, EventManager */

window.EUMSSI = {
	Manager       : {},
	SegmentManager: {},
	FilterManager : new FilterManager(),
	EventManager  : new EventManager(),
	CONF          : CONF || {},
	UTIL          : UTIL || {},
	pageLayout    : undefined,
	contentLayout : undefined,
	$tabs         : undefined
};

(function($){

	$(function(){

		//<editor-fold desc="MAIN CORE MANAGER">

		EUMSSI.Manager = new AjaxSolr.Manager({
			solrUrl        : 'http://demo.eumssi.eu/Solr_EUMSSI/content_items/',
			segmentsCoreUrl: 'http://demo.eumssi.eu/Solr_EUMSSI/segments/'
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
			'facet'  : true,
			//'facet.mincount': 1,	// Min count to appear
			'json.nl': 'map'
		};
		for (var name in params) {
			EUMSSI.Manager.store.addByValue(name, params[name]);
		}
		EUMSSI.CONF.updateFacetingFields();

		//</editor-fold>

		//<editor-fold desc="WIDGETS DEFINITION">

		EUMSSI.Manager.addWidget(new AjaxSolr.RichEditorWidget({
			id: 'my-richEditor',
			target: '#richeditor-placeholder'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.ResultWidget({
			id: 'result',
			target: '.resultWidget-placeholder'
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

		EUMSSI.Manager.addWidget(new AjaxSolr.MapChartWidget({
			id: "MapChartWidget",
			target: '.mapChart'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.TagcloudWidget({
			id: 'TagCloudWidget',
			target: '.tagCloud-placeholder',
			field: EUMSSI.CONF.PERSON_FIELD_NAME
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.TwitterPolarityWidget({
			id: 'twitterPolarity',
			target: '.polarity-placeholder'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.GenericGraphWidget({
			id: 'my-genericgraph',
			target: '#my-genericgraph'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.GenericWordCloudWidget({
			id: 'my-genericwordcloud',
			target: '#my-genericwordcloud'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.TimelineWidget({
			id: 'my-timeline',
			target: '#my-timeline'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.DateFilterWidget({
			id: 'dateFilterWidget',
			key: 'meta.source.datePublished',
			target: '.dateFilterWidget-placeholder'
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.TagFacetWidget({
			id: "source",
			label: "Source",
			target: '.source-placeholder',
			field: "source",
			persistentFilter: true
		}));

		EUMSSI.Manager.addWidget(new AjaxSolr.FilterViewerWidget({
			id: 'filterViewer',
			target: '.filterViewer-placeholder',
			label: "Applied Filters:"
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

		EUMSSI.Manager.addWidget(new AjaxSolr.FilterRelatedContentWidget({
			id: 'filterRelatedContent',
			target: '.filterRelatedContent-placeholder'
		}));


		//</editor-fold>


		//<editor-fold desc="GLOBAL CONFIGS">

		// Datepicker default Locale
		/*var language = window.navigator.userLanguage || window.navigator.language;
		 if(language) {
		 $.datepicker.setDefaults( $.datepicker.regional[language] );
		 }*/
		$.datepicker.setDefaults($.datepicker.regional['']);

		EUMSSI.$tabs = $(".tabs-container").tabs({
			active: 0
		});

		// Record mouse position in order to display contextual menus
		$(document).mousemove(function(e){
			window.mouse_x = e.pageX;
			window.mouse_y = e.pageY;
		});

		//</editor-fold>


		//<editor-fold desc="FEEDBACK">

		function sendFeedback(event){
			var $form = $(this).find("form");
			var formData = {
				user   : $form.find(".user").val(),
				//email : $form.find(".email").val(),
				type   : $form.find(".type").val(),
				comment: $form.find(".comment").val(),
				state  : JSON.stringify(UTIL.serializeCurrentState())
			};

			$.ajax({
				url    : 'http://demo.eumssi.eu/EumssiApi/webapp/feedback/report?' + $.param(formData),
				success: function(response){
					$(this).dialog("destroy").remove();
				}.bind(this)
			});

		}

		//Open feedback dialog
		$("button.btn-do-feedback").click(function(){
			var $dialogContent = $($("#feedback-dialog-tpl").html());
			var dialog = $dialogContent.dialog({
				title  : "Post Feedback",
				modal  : true,
				width  : 'auto',
				buttons: {
					"Submit": sendFeedback,
					Cancel  : function(){
						dialog.dialog("close");
					}
				}
			});
		});

		//</editor-fold>


		// TOGGLER left slide
		$(".left-slide-toggler").on("click", function(event){
			var $target = $(event.target).closest(".content");
			if($target.hasClass("slide-open")){
				$target.removeClass("slide-open");
				$target.addClass("slide-closed");
				EUMSSI.EventManager.trigger("leftside:collapse");
			} else {
				$target.removeClass("slide-closed");
				$target.addClass("slide-open");
				EUMSSI.EventManager.trigger("leftside:expand");
			}
		});

		// TOGGLER filter
		$(".filter-toggler").on("click", function(event){
			var $parent = $(event.target).parent();
			if($parent.hasClass("filter-open")){
				$parent.removeClass("filter-open");
				$parent.addClass("filter-closed");
			} else {
				$parent.removeClass("filter-closed");
				$parent.addClass("filter-open");
			}
		});

		EUMSSI.EventManager.on("OpenFilter",function(){
			var $toggler = $(".filter-toggler");
			if($toggler.parent().hasClass("filter-closed")){
				$toggler.click();
			}
		});

		EUMSSI.EventManager.on("CloseFilter",function(){
			var $toggler = $(".filter-toggler");
			if($toggler.parent().hasClass("filter-open")){
				$toggler.click();
			}
		});

	});

})(jQuery);

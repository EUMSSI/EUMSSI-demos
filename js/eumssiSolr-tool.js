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



		//</editor-fold>


		//<editor-fold desc="GLOBAL CONFIGS">

		// Datepicker default Locale
		/*var language = window.navigator.userLanguage || window.navigator.language;
		 if(language) {
		 $.datepicker.setDefaults( $.datepicker.regional[language] );
		 }*/
		$.datepicker.setDefaults($.datepicker.regional['']);

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

		//TODO Widget change Management
		$(".widget-menu .menu-item").on('click', function(event){
			var $target = $(event.target);

			if(!$target.hasClass("active-widget")){
				//clean actives
				$(".widget-menu .menu-item").removeClass("active-widget");
				$target.addClass("active-widget");

				var selectedWidget = $target.attr("data-widget");
				var $widgets = $(".content-body .widget-placeholder");
				$widgets.removeClass("active-widget");
				$widgets.filter("[data-widget='"+selectedWidget+"']").addClass("active-widget");

				EUMSSI.EventManager.trigger("activatewidget:"+selectedWidget);

			}
		});


	});

})(jQuery);

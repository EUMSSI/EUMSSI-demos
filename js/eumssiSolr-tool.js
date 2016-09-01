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
			segmentsCoreUrl: 'http://demo.eumssi.eu/Solr_EUMSSI/segments/',
			uimaServiceUrl : 'http://demo.eumssi.eu/EumssiUimaService/'
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
			'json.nl': 'map',
			'hl'  : true,
			'hl.fl': '*'
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
			],
			buttonEnabled: true
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
			target: '.mapChart-placeholder'
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
			target: '#genericwordcloudtab .genericwordcloud-placeholder'
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

		EUMSSI.Manager.addWidget(new AjaxSolr.DashboardWidget({
			id: 'dashboard',
			target: '.dashboard-placeholder'
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
		function openFeedbackDialog(){
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
		}

		//</editor-fold>

		//<editor-fold desc="TOGGLERS">
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
			var $parent = $(event.currentTarget).parent();
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
		//</editor-fold>

		//<editor-fold desc="MENU">

		var $headerMenu = $("#header-menu");
		$headerMenu.find(".header-menu-button").on("click", function(event){
			var menu = $(this).parent().find("ul").show();
			$( document ).one( "click", function() {
				menu.hide();
			});
			return false;
		});
		$headerMenu.find(".menu-showGuide").on("click",startIntro);
		$headerMenu.find(".menu-searchHelp").on("click",UTIL.showSearchHelp);
		$headerMenu.find(".menu-sendFeedback").on("click",openFeedbackDialog);
		$headerMenu.find(".menu-about").on("click",function(){
			window.open("http://www.eumssi.eu/","_blank");
		});

		//</editor-fold>

		//<editor-fold desc="HELP">

		$(document).on("change", "#disableGuide", function(event){
			if($("#disableGuide").is(":checked")){
				localStorage.setItem('eumssi.disable.startguide', true);
			} else {
				localStorage.removeItem('eumssi.disable.startguide');
			}
		});

		/**
		 * Interactive help guide
		 */
		function startIntro() {
			var $disabledCheckbox = $('<input id="disableGuide" type="checkbox" class="disable-guide"><label for="disableGuide">Don\'t show guide on stratup.</label></input>');
			if(localStorage.getItem('eumssi.disable.startguide')){
				$disabledCheckbox.attr("checked","checked");
			}

			var intro = introJs();
			intro.setOptions({
//				nextLabel: "Siguiente",
//				prevLabel: "Anterior",
//				skipLabel: "Saltar",
//				doneLabel: "Terminar",
				showStepNumbers: false,
				showProgress: true,
				steps: [
					{
						intro: UTIL.formatIntroJsIntro("Welcome to EUMSSI Web Page","Now we will take a quick visit to the website.",$("<div>").html($disabledCheckbox).html())
					},
					{
						element: document.querySelector('#generated-GENERAL_SEARCH'),
						intro: UTIL.formatIntroJsIntro("Search","Type the text or query you want to search with EUMSSI","ex. type \"fracking\" and press Enter.")
					},
					{
						element: document.querySelector('.dateFilterWidget-placeholder'),
						intro: UTIL.formatIntroJsIntro("Date Range","In addition to the search field we can enter a range of dates in order to narrow the search.", "Or you can simply choose a predefined range like last month.")
					},
					{
						element: document.querySelector('.filter-toggler'),
						intro: UTIL.formatIntroJsIntro("Filter Toggle","There is an advanced filter with options such as language, document type, source, etc...","Click here to show/hide the advanced filter.")
					},
					{
						element: document.querySelector('.left-slide-toggler'),
						intro: UTIL.formatIntroJsIntro("Editor Toggle","We can hide the editor in order to maximize the widgets visual area.","Click here to show/hide the text editor.")
					},
					{
						element: document.querySelector('.left-slide'),
						intro: UTIL.formatIntroJsIntro("Text Editor","Write here your Article, News, Blog entry, etc...", "Also you can try to add content directly from widgets using drag & drop."),
						position: "right"
					},
					{
						element: document.querySelector('.cke_button__btneumssisearch'),
						intro: UTIL.formatIntroJsIntro("Get Related Content","This action processes the selected text in the editor and generates related filter options of it.", "Select a section of your article and press the button, the advanced filter will appear with suggested filters."),
						position: "right"
					},
					{
						element: document.querySelector('.tabs-container'),
						intro: UTIL.formatIntroJsIntro("Widgets","Display the related information in many ways with the widgets.","Use the widget selector on the right to choose what widget you want to see."),
						position: "left"
					},
					{
						element: document.querySelector('.tabs-container .ui-tabs-nav'),
						intro: UTIL.formatIntroJsIntro("Widget Selector","Here are the current available widgets","Use the widget selector on the right to choose what information you want to see."),
						position: "left"
					},
					{
						intro: UTIL.formatIntroJsIntro("Visit End","Now we already saw the most important parts of the EUMSSI web site, now you can start writing your article or search for something on your interest.")
					}
				]
			});
			intro.start();
			//Open the editor if collapsed
			if($(".content").hasClass("slide-closed")){
				$(".left-slide-toggler").click();
			}
		}
		if(!localStorage.getItem('eumssi.disable.startguide')){
			setTimeout(startIntro, 1500);
		}

		//</editor-fold>

		//<editor-fold desc="toogleWordGraph">
		var selectedValue = "meta.source.keywords";
		$("#showRelations").click(function(event) {
			var target = $(event.currentTarget);
			if(!target.is(":checked")) {
				$(".wordCloud").show();
				$(".wordGraph").hide();
				if(selectedValue){
					EUMSSI.EventManager.trigger("wordselectchange", selectedValue);
					// EUMSSI.EventManager.trigger("hideRelations", selectedValue);
				}
			}else{
				$(".wordCloud").hide();
				$(".wordGraph").show();
				if(selectedValue) {
					EUMSSI.EventManager.trigger("graphselectchange", selectedValue);
					// EUMSSI.EventManager.trigger("showRelations", selectedValue);
				}
			}
		});

		$(".genericwordcloud-key-selector").selectmenu({
			width: 200,
			select: function( event, data ) {
				selectedValue = data.item.value;
				if(!$("#showRelations").is(":checked")) {
					EUMSSI.EventManager.trigger("wordselectchange", selectedValue);
				}else{
					EUMSSI.EventManager.trigger("graphselectchange", selectedValue);
				}
			}.bind(this)
		});

		var orderBy = "score";
		var orderType = "desc";
		$(".orderBy").selectmenu({
			width: 150,
			select: function( event, data ) {
				if(orderBy != data.item.value) {
					orderBy = data.item.value;
					EUMSSI.Manager.store.addByValue('sort', orderBy + " " + orderType);
					EUMSSI.Manager.widgets["result"].doRequest();
				}
			}.bind(this)
		});

		$(".orderType").selectmenu({
			width: 150,
			select: function( event, data ) {
				if(orderType != data.item.value) {
					orderType = data.item.value;
					EUMSSI.Manager.store.addByValue('sort', orderBy + " " + orderType);
					EUMSSI.Manager.widgets["result"].doRequest();
				}
			}.bind(this)
		});
		//</editor-fold>

		function loadEmbed(){
			if($(".cke_button__embed").length === 0){
				setTimeout(function() { loadEmbed(); }, 500);
			}else {
				$(".cke_button__embed").hide();
				$(".cke_button__embed").click();
				$(".cke_dialog.cke_browser_webkit.cke_ltr.cke_single_page").css("display", "none");
				setTimeout(function() {
					$(".cke_dialog.cke_browser_webkit.cke_ltr.cke_single_page").css("display", "none");
					$(".cke_dialog_ui_hbox_last a span").click();
					$(".cke_dialog_background_cover").remove();
				}, 100);
			}
		}

		setTimeout(function() {
			loadEmbed();
		}, 2000);

		$(".graph-to-editor").click(function(ev){
			var svg;
			if($(".wordCloud").is(":visible")){
				svg = $(".wordCloud .genericwordcloud");
			}else{
				svg = $(".wordGraph");
			}
			canvg(document.getElementById('canvas'),  svg.html());
			_mapToEditor();
		});

		function _mapToEditor(){
			var oEditor = CKEDITOR.instances["richeditor-placeholder"];
			var blobUrl = URL.createObjectURL(dataURItoBlob($("canvas")[0].toDataURL()));
			oEditor.insertHtml("<img src='" + blobUrl + "'>" );
		}

		function dataURItoBlob(dataURI) {
			var byteString = atob(dataURI.split(',')[1]);

			// write the bytes of the string to an ArrayBuffer
			var ab = new ArrayBuffer(byteString.length);
			var ia = new Uint8Array(ab);
			for (var i = 0; i < byteString.length; i++) {
				ia[i] = byteString.charCodeAt(i);
			}

			// write the ArrayBuffer to a blob, and you're done
			var bb = new Blob([ab]);
			return bb;
		}
	});
})(jQuery);

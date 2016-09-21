/*global jQuery,  AjaxSolr, EUMSSI,  UTIL, CKEDITOR, FilterManager */
(function ($) {

	AjaxSolr.RichEditorWidget = AjaxSolr.AbstractTextWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function () {
			this.$target = $(this.target);
			if (CKEDITOR.env.ie && CKEDITOR.env.version < 9){
				CKEDITOR.tools.enableHtml5Elements(document);
			}

			CKEDITOR.on( 'instanceReady', function( ev ) {
				this._resizeEditor(ev.editor);
			}.bind(this));

			_.delay(function(){
				this._initCKEditor(this.$target.prop("id"));
			}.bind(this), 500);
		},

		/**
		 * Initializes the CKEditor
		 * @param {string} editorId
		 * @private
		 */
		_initCKEditor : function(editorId){
			// The trick to keep the editor in the sample quite small
			// unless user specified own height.
			CKEDITOR.config.width = 'auto';

			CKEDITOR.config.extraPlugins = 'embed,autoembed';

			//Toolbar configuration
			CKEDITOR.config.removeButtons = 'Form,Checkbox,Radio,TextField,Textarea,Select,Button,ImageButton,HiddenField,CreateDiv,Language,Scayt,SelectAll,Anchor,Flash,Smiley,Iframe,Maximize,About';

			var wysiwygareaAvailable = this._isWysiwygareaAvailable(),
				isBBCodeBuiltIn = !!CKEDITOR.plugins.get('bbcode');

			var editorElement = CKEDITOR.document.getById(editorId);

			// :(((
			if (isBBCodeBuiltIn) {
				editorElement.setHtml(
					'Hello world!\n\n' +
					'I\'m an instance of [url=http://ckeditor.com]CKEditor[/url].'
				);
			}

			// Depending on the wysiwygare plugin availability initialize classic or inline editor.
			if (wysiwygareaAvailable) {
				CKEDITOR.replace(editorId);
			} else {
				editorElement.setAttribute('contenteditable', 'true');
				CKEDITOR.inline(editorId);

				// TODO we can consider displaying some info box that
				// without wysiwygarea the classic editor may not work.
			}

			this._addCustomButton();
			this._addDeleteHighLightButton();

			this._setDroppable();

			$(window).resize(this._resizeEditor);
		},

		_isWysiwygareaAvailable : function(){
			// If in development mode, then the wysiwygarea must be available.
			// Split REV into two strings so builder does not replace it :D.
			if (CKEDITOR.revision == ( '%RE' + 'V%' )) {
				return true;
			}

			return !!CKEDITOR.plugins.get('wysiwygarea');
		},

		_setDroppable : function(){
			this.$target.parent().droppable({
				activeClass: "ui-droppable-active",
				hoverClass: "ui-droppable-hover",
				scope: "editorDrop",
				tolerance: "pointer",
				drop: function( event, ui ) {
					var oEditor = CKEDITOR.instances["richeditor-placeholder"];
					oEditor.insertHtml( ui.draggable.html() );
				}
			});
		},

		clearSimilarityFilter: function() {
			EUMSSI.FilterManager.removeFilterByName(FilterManager.NAMES.SIMILARITY, this.id, true);
		},

		clearGeneralFilter: function() {
			this._getInputGeneralSearch().val("");
			EUMSSI.FilterManager.removeFilterByName(FilterManager.NAMES.GENERAL_SEARCH, null, true);
		},

		_addCustomButton : function(){
			var editor = CKEDITOR.instances["richeditor-placeholder"];
			editor.addCommand("myEumssiSearch", { // create named command
				exec: function(edt) {
					var selectedText = edt.getSelection().getSelectedText();
					if (selectedText === "") {
						var body = edt.document.getBody();
						selectedText =  body.getText();
					}
					this._unHightlight();
					this.clearGeneralFilter();
					this._getSuggestedQuery(selectedText);
				}.bind(this)
			});

			editor.ui.addButton('btnEumssiSearch', { // add new button and bind our command
				label: "Get Related Content",
				title: "Uses the selected text on EUMSSI engine to obtain filter suggestions",
				command: 'myEumssiSearch',
				icon: '../../images/favicon-2.png'
			});

		},

		_addDeleteHighLightButton: function() {
			var editor = CKEDITOR.instances["richeditor-placeholder"];
			editor.addCommand("deleteHighLigh", {
				exec: function() {
					this._unHightlight();
					$(".kea-tags-container").empty().hide();
				}.bind(this)
			});

			editor.ui.addButton('btnEumssiDeleteHighlight', { // add new button and bind our command
				label: "Delete highlight text",
				title: "Delete highlight text",
				command: 'deleteHighLigh',
				icon: '../../images/favicon-2.png'
			});
		},

		_highlightEntities: function(entities) {
			entities.forEach(this._highlightEntity.bind(this));
		},

		_highlightEntity: function(entity) {
			var keyword = entity.text;
			var body = this._getContextHightlight();
			var opts = this._getDefaultsOptionsHightlight();
			opts.each = this._onEachHighlight.bind(this, entity);
			$(body).mark(keyword, opts);
		},

		_onEachHighlight: function(entity, dom) {
			$(dom).on('click', this._onClickMarkHighlight.bind(this, entity));
		},

		_unHightlight: function() {
			var body = this._getContextHightlight();
			var opts = this._getDefaultsOptionsHightlight();
			$(body).unmark(opts);
		},

		_setMenuEvents: function(entity) {
			this.$contentMenu.on("click", ".filter", UTIL.addPersonFilter.bind(this, entity.value));
			this.$contentMenu.on("click", ".filter-clear", UTIL.cleanPersonFilter.bind(this));
			this.$contentMenu.on("click", ".filter-country", UTIL.addContryFilter.bind(this, entity.value));
			this.$contentMenu.on("click", ".filter-country-clear", UTIL.cleanCountryFilter.bind(this, true));
			this.$contentMenu.on("click", ".filter-city", UTIL.addCityFilter.bind(this, entity.value));
			this.$contentMenu.on("click", ".filter-city-clear", UTIL.cleanCityFilter.bind(this, true));
			this.$contentMenu.on("click", ".filter-location", UTIL.addLocationFilter.bind(this, entity.value));
			this.$contentMenu.on("click", ".filter-location-clear", UTIL.cleanLocationFilter.bind(this, true));
			this.$contentMenu.on("click", ".filter-organization", UTIL.addOrganizationFilter.bind(this, entity.value));
			this.$contentMenu.on("click", ".filter-organization-clear", UTIL.cleanOrganizacionFilter.bind(this, true));
			this.$contentMenu.on("click", ".filter-other", UTIL.addOtherFilter.bind(this, entity.value));
			this.$contentMenu.on("click", ".filter-other-clear", UTIL.cleanOtherFilter.bind(this, true));
		},

		_onClickMarkHighlight: function(entity, event) {
			if (this.$contentMenu) {
				this.$contentMenu.remove();
			}
			this.$contentMenu = UTIL.getMarkerMenu(entity, this.id);
			this._setMenuEvents(entity);
			var offset = $("#richeditor-placeholder").next("div").find("iframe").offset();
			var $body = $(event.currentTarget).closest("body");
			offset.top -= $body.scrollTop();
			offset.left -=  $body.scrollLeft();
			EUMSSI.UTIL.showMarkMenu(this.$contentMenu, $(event.currentTarget), offset);
			// TODO REMOVE
			console.log($(event.currentTarget).html(), entity);
		},

		_getContextHightlight: function() {
			var ckeditor = CKEDITOR.instances["richeditor-placeholder"];
			var document = ckeditor.document.$;
			return document.querySelector("body");
		},

		_getDefaultsOptionsHightlight: function() {
			return {
				exclude: ["img", "iframe"],
				className: "highlight",
				accuracy: "exactly"
			};
		},

		/**
		 * Use the Service to retrieve the related fields to build a custom filter options
		 * @param selectedText
		 * @private
		 */
		_getSuggestedQuery : function(selectedText){
			if(!this._query_in_progress){
				this._query_in_progress = true;
				var $loading = $('<i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw margin-bottom"></i>');
				$("#cke_richeditor-placeholder").find(".cke_button__btneumssisearch").parent().append($loading);

				EUMSSI.Manager.getTextFilterAnalyze(selectedText)
			      .done(this._onGetSuggestedQuery.bind(this)).always(function() {
				      $loading.remove();
				      this._query_in_progress = false;
			      }.bind(this));
			}
		},

		_addSimilarityFilter: function(response) {
			var filterText = FilterManager.NAMES.SIMILARITY;
			var query = filterText + ":" + response.data.solr.similarity;
			EUMSSI.FilterManager.addFilter(filterText, query, this.id, filterText);
		},

		_onGetSuggestedQuery: function(response) {
			EUMSSI.EventManager.trigger("onGetRelatedFilters", response);
			var dbpediaData = response && response.data && response.data.dbpedia;
			var keaData = response && response.data && response.data.kea;
			this.clearSimilarityFilter();
			this._unHightlight();
			this._addSimilarityFilter(response);
			this.doRequest();

			if (dbpediaData) {
				var dbPediaItems = UTIL.extractDbpediaItems(dbpediaData);
				this._highlightEntities(dbPediaItems.entities);
			}
			if (keaData) {
				var keaItems = UTIL.extractKeaItems(keaData);
				this._genereateKeaTags(keaItems);
			}
		},

		_genereateKeaTags: function(keaItems) {
			var $suggested = $(".kea-tags-container");
			if (keaItems.length > 5) {
				keaItems.length = 5; // cut array, only five keaitems
			}
			var $tags = keaItems.map(this._generateTags);
			if ($tags.length > 0) {
				var $p = $("<p>", {
					"text": "Suggested queries: ",
					"class": "suggested-queries-help"
				});
				var $ul = $("<ul>", {"class": "tags"});
				$ul.append($tags);
				$suggested.html($p);
				$suggested.append($ul).show();
				$suggested.off().on("click", ".tag", this.onClickTag.bind(this));
			} else {
				$suggested.hide();
			}
		},


		onClickTag: function(event) {
			event.preventDefault();
			var $tag = $(event.currentTarget);
			var label = $tag.data("value");
			var filterText = FilterManager.NAMES.GENERAL_SEARCH;
			var query = filterText + ":" + label;
			var fText = FilterManager.NAMES.GENERAL_SEARCH_LABEL + ":" + label;
			EUMSSI.FilterManager.removeFilterByName(filterText, null, true);
			EUMSSI.FilterManager.removeFilterByName(FilterManager.NAMES.LANGUAGE, null, true);
			EUMSSI.FilterManager.removeFilterByName(FilterManager.NAMES.SIMILARITY, null, true);
			EUMSSI.FilterManager.addFilter(filterText, query, this.id, fText);
			this._getInputGeneralSearch().val(label);
			this.doRequest();
		},

		_getInputGeneralSearch: function() {
			return $("#generated-GENERAL_SEARCH").find("input");
		},

		_generateTags: function(kea) {
			var $li = $("<li>;")
			var $tag = $("<a>", {
				"data-value": kea.value,
				"class": "tag"
			});
			$tag.text(kea.text);
			$li.append($tag);
			return $li;
		},

		_resizeEditor : function(editor){
			if(editor.element === undefined){
				editor = CKEDITOR.instances["richeditor-placeholder"];
			}
			var $editor = $(editor.element.$);
			var toolbarsHeight = $editor.find(".cke_top").height() + $editor.find(".cke_toolbox").height();
			editor.resize(null, $editor.parent().height() - toolbarsHeight);
		}

	});
})(jQuery);

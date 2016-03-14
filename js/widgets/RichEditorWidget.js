/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL, CKEDITOR, swal */
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

//			CKEDITOR.config.extraPlugins = 'pluginEumssiSearch';

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
				drop: function( event, ui ) {
					var oEditor = CKEDITOR.instances["richeditor-placeholder"];
					oEditor.insertHtml( ui.draggable.html() );
				}
			});
		},

		_addCustomButton : function(){
			var editor = CKEDITOR.instances["richeditor-placeholder"];

			editor.addCommand("myEumssiSearch", { // create named command
				exec: function(edt) {
					var selectedText = edt.getSelection().getSelectedText();
					if(selectedText){
						this._getSuggestedQuery(selectedText);
					} else {
						swal({   title: "No Text Was Selected",   text: "You must select a text in order to use this functionality.",   type: "warning",   confirmButtonText: "Close" });
					}
				}.bind(this)
			});

			editor.ui.addButton('btnEumssiSearch', { // add new button and bind our command
				label: "Get Related Content",
				title: "Uses the selected text on EUMSSI engine to obtain filter suggestions",
				command: 'myEumssiSearch',
//				toolbar: 'document,0',
				icon: '../../images/favicon-2.png'
			});
		},

		_getSuggestedQuery : function(selectedText){
			EUMSSI.EventManager.trigger("getRelatedFilters",selectedText);
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

/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL, CKEDITOR */
(function ($) {

	AjaxSolr.RichEditorWidget = AjaxSolr.AbstractTextWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function () {
			this.$target = $(this.target);
			if (CKEDITOR.env.ie && CKEDITOR.env.version < 9){
				CKEDITOR.tools.enableHtml5Elements(document);
			}

			CKEDITOR.on( 'instanceReady', function( ev ) {
				var $editor = $(ev.editor.element.$);
				var toolbarsHeight = $editor.find(".cke_top").height() + $editor.find(".cke_toolbox").height();

				ev.editor.resize(null, $editor.parent().height() - toolbarsHeight);
			});

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

			this._setDroppable();
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
		}


	});
})(jQuery);

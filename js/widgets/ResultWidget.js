/*global jQuery, $, _, AjaxSolr, EUMSSI*/
(function ($) {

	AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
		start: 0,

		// Attributes that will be rendered in addition to the default info.
		dynamicAttributes: [],

		addDynamicAttribute : function(attrName,attrLabel,render) {
			var dynamicAttr = {
				key : attrName,
				label : attrLabel,
				render : render ? true : false
			};
			this.dynamicAttributes[attrName] = dynamicAttr;
		},
		enableDynamicAttributeRender: function(attrName){
			this.dynamicAttributes[attrName].render = true;
		},
		disableDynamicAttributeRender: function(attrName){
			this.dynamicAttributes[attrName].render = false;
		},
		removeDynamicAttribute : function(attrName) {
			return delete this.dynamicAttributes[attrName];
		},
		getDynamicAttributeLabel : function(attrName) {
			if(this.dynamicAttributes[attrName]){
				return this.dynamicAttributes[attrName].label;
			}
			return false;
		},
		getEnabledDynamicAttributesKeyArray : function(){
			var it, keyArray = [];
			for(it in this.dynamicAttributes){
				if(this.dynamicAttributes[it].render){
					keyArray.push(it);
				}
			}
			return keyArray;
		},

		beforeRequest: function () {
			return true;
			//$(this.target).html($('<img>').attr('src', 'images/bar-ajax-loader.gif'));
		},


		afterRequest: function () {
			$(this.target).empty();
			for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
				var doc = this.manager.response.response.docs[i];
				$(this.target).append(this.defaultTemplate(doc));
			}
		},

		/**
		 * Error Management
		 * @param message
		 */
		afterRequestError: function(message) {
			$(this.target).html($("<div>").addClass("ui-error-text").text(message));
		},

		/**
		 * Generate a HTML for the given document DATA
		 * @param {Object} doc - data of the document
		 * @fires videoPlayer:loadVideo
		 * @returns {*|jQuerySelector} the jQuery selector with the generated html code.
		 */
		defaultTemplate: function (doc) {
			var text = doc['meta.source.text'] || "...",
				date = doc['meta.source.datePublished'],
				videoLink = doc['meta.source.httpHigh'],
				audio_transcript = doc['meta.extracted.audio_transcript'];

			text = this._sliceTextMore(text,300);

			// Render HTML Code
			var $output = $("<div>");

			//Title
			$output.append(this._renderTitle(doc));

			//Date
			if (date){
				$output.append($("<p>").addClass("date").html(new Date(date).toLocaleDateString()));
			}

			//Content
			$output.append($("<p>").html(text));

			//Dynamic Fields
			$output.append(this._renderKeyArray(this.getEnabledDynamicAttributesKeyArray(),doc,200));

			//Link Video
			if(videoLink) {
				var $a = $('<a>').text("Play Video");
				$output.append($("<p>").html($a));
				$a.addClass("links");
				$a.click(function(){
					EUMSSI.EventManager.trigger("videoPlayer:loadVideo", [videoLink, doc]);
				});
			}

			return $output;
		},

		_renderTitle: function(doc){
			var $header =  $("<span class='links'>"),
				$title = $("<h2>");
			$header.text(doc['meta.source.headline']);

			//Twitter - special behaviour
			if(!doc['meta.source.headline'] && doc['source'] && doc['source'].startsWith("Twitter") ) {
				var text = doc['meta.source.text'] || "";
				$header.text(text.substring(0, 50));
				if(text.length > 50){
					$header.append("...");
				}
				//Show tweet bird if tweetId
				if(doc['meta.source.tweetId']){
					var $twitterLogo = $("<img class='twitter-logo' src='images/Twitter_logo_blue_32.png'>")
						.prop("data-tweetid",doc['meta.source.tweetId'])
						.prop("title","Open Tweet");
					$twitterLogo.click(function(event){
						UTIL.openTweet( $(event.target).prop("data-tweetid") );
					});
					$title.append($twitterLogo)
				}
			}

			$header.attr("id","links_"+doc._id);
			$header.click(function(){
				this._showInfo(doc);
			}.bind(this));
			$title.append( $header );

			return $title;
		},

		_showInfo: function(doc){

			var keysArray = Object.keys(doc);
			keysArray.sort();

			var $content = this._renderKeyArray(keysArray,doc);
			$content.dialog({
				title: "Result Information",
				width: 800,
				maxHeight: $(window).height() - 120,
				modal: true,
				close: function() {
					$(this).dialog('destroy').remove();
				}
			});
			$content.dialog("option", "position", {my:"center", at:"center", of:window});

		},

		_renderKeyArray : function(keysArray, doc, moreSize) {
			var $content = $("<div>");
			moreSize = moreSize || 1000;
			for(var i = 0 ; i < keysArray.length ; i++){
				var keyLabel, key = keysArray[i];
				//Check if the doc data has the Key
				if(doc[key]) {
					var text = doc[key].toString();
					var $value = $('<span>').addClass("info-value");
					var $key = $('<span>').addClass("info-label");

					switch(key){
						case "meta.extracted.text.dbpedia.PERSON" :
							value = this._personCustomRender(text, $content);
							$value.addClass("person-data");
						break;
						default :
							//FIX - comma problem
							text = text.replace(/,([^\s])/g, ", $1");

							var value = this._sliceTextMore(text, moreSize);

							//ADD here HTML tags to the value
							//dbpedia links transformation
							if(key == "meta.extracted.text.dbpedia"){
								value = this._generateHTMLLinks(value);
							}
						break;
					}

					keyLabel = this._getSimpleKey(key);
					$key.html(keyLabel);
					$value.html(value);

					$content.append($('<p>').append($key).append($value));
				}
			}
			return $content;
		},

		/**
		 * Obtain the Label from a key, if exist a dynamicAttribute with that label import it
		 * if not uses a simple version of the last param of the key
		 * @param {String} key - the key of the attribute
		 * @returns {String} the label
		 * @private
		 */
		_getSimpleKey: function(key){
			if(key){
				var label = this.getDynamicAttributeLabel(key);
				//If key is defined on dynamicAttributes use its label
				if(!label) {
					//1.Slice and get the last component
					var auxArray = key.split(".");
					key = auxArray[auxArray.length-1];
					//2.Transform CamelCase to words
					label = key.unCamelCase();
				}
			}
			return label;
		},

		/**
		 * transform the html links on the text into <a></a> HTML links
		 * @param {String} text - the text to be processed
		 * @returns {String} the same text with the links transformed
		 * @private
		 */
		_generateHTMLLinks: function(text){
			//var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
			var urlRegex = /(https?:\/\/[^\s,]+)/g; // Start with http:// | https:// , ends when whitespace|, found.
			return text.replace(urlRegex, '<a href="$1" target="_blank">$1</a>');
		},

		/**
		 * If the text is greater than size, slice it and put the rest on a hidden span,
		 * adds a more link to add an avent on it.
		 *
		 * The slice is performed for the next whitespace after size position,
		 * if no exist whitespace after size position on text, it won't be sliced
		 *
		 * Additionally encode the HTML on the TEXT
		 *
		 * @param {String} text
		 * @param {Number} size
		 * @returns {HTML} the text sliced with by the size and the rest hidden in a span
		 * @private
		 */
		_sliceTextMore: function(text, size){
			var $dummy = $("<div>");
			if (text && size && text.length > size) {
				//Slice for next space
				size = this._getNextWhitePosition(text,size);
				if(size > 0){
					text = '<span class="ui-slicetext-showpart ui-after-points" >' +
					$dummy.text(text.substring(0, size)).html() +
					'</span> <span class="ui-slicetext-hidepart" style="display:none;">' +
					$dummy.text(text.substring(size)).html() +
					'</span> <span class="more ui-icon ui-icon-plusthick"></a>';
				}
			}
			return text;
		},

		_getNextWhitePosition: function(text, size){
			var auxText = text.substring(size);
			var nextWhitePosition = auxText.indexOf(' ');
			if(nextWhitePosition > 0){
				nextWhitePosition += size;
			} else {
				nextWhitePosition = size;
			}
			return nextWhitePosition;
		},

		_personCustomRender : function(text, $content){
			var personArray = [];
			var tempValue = "";
			if(text){
				text = text.replace(/ /g,'');
				personArray = _.uniq(text.split(","));
				if(personArray.length > 0){
					return UTIL.getWikipediaImages(personArray)
						.done(this._renderWikipediaImages.bind(this, $content));
				}

				tempValue = "Loading Images..."
			}
			return tempValue;
		},

		_renderWikipediaImages : function($content, response){
			var $value = $("<div>").addClass("result-person");
			if(response && response.query && response.query.pages) {
				_.each(response.query.pages, function (obj) {
					var facetId = obj.title.replace(/ /g, "_");
					var $a = $('<a>').attr("data-id",facetId);
					var $img = $("<img>").attr("title", obj.title);
					if (obj.thumbnail && obj.thumbnail.source) {
						$img.attr("src", obj.thumbnail.source);
					} else {
						$img.attr("src", "images/dummy.png");
					}
					$a.append($img);
					$a.click(UTIL.openPeopleActionsMenu.bind(this, facetId));
					$value.append($a);
				}, this);
			}
			$content.find(".info-value.person-data").html($value);
		},

		init: function () {
			$(document).on('click', 'span.more', function () {
				var $this = $(this),
					$hiddenText = $this.parent().find('.ui-slicetext-hidepart'),
					$visibleText = $this.parent().find('.ui-slicetext-showpart');

				if ($hiddenText.is(':visible')) {
					$hiddenText.hide();
					$visibleText.addClass("ui-after-points");
					$this.removeClass('ui-icon-minusthick');
					$this.addClass('ui-icon-plusthick');
				} else {
					$hiddenText.show();
					$visibleText.removeClass("ui-after-points");
					$this.removeClass('ui-icon-plusthick');
					$this.addClass('ui-icon-minusthick');
				}

				//Realocate dialog
				var $dialog = $this.parents(".ui-dialog-content");
				if($dialog.length > 0){
					$dialog.dialog("option", "position", {my:"center", at:"center", of:window});
				}

				return false;
			});
		}

	});

})(jQuery);
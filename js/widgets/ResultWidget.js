
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
				$(this.target).append(this.templateTEST(doc));
			}
		},

		/**
		 * Error Management
		 * @param message
		 */
		afterRequestError: function(message) {
			$(this.target).html($("<div>").addClass("ui-error-text").text(message));
		},

		templateTEST: function (doc) {
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
			$output.append(this._renderKeyArray(this.getEnabledDynamicAttributesKeyArray(),doc,200).html());

			//Link Video
			if(videoLink) {
				/** YOUTUBE **/
				var isYoutube = !!doc['meta.source.youtubeVideoID'];
				var $a = $('<a>').text("Play Video");
				$output.append($("<p>").html($a));
				$a.addClass("links");
				$a.click(this._openVideoPlayer.bind(this,videoLink,isYoutube));

				/** OLD **/
				//var $a = $('<a>').attr("target","_blank").attr("href",videoLink).text("Video Link");
				//$output.append($("<p>").html($a));
			}

			return $output;
		},

		_renderTitle: function(doc){
			var header = doc['meta.source.headline'];

			//Twitter - special behaviour
			if(!header && doc['source'] && doc['source'].startsWith("Twitter") ) {
				var text = doc['meta.source.text'] || "";
				header = "Twitter: "+text.substring(0, 50);
				if(text.length > 50){
					header += "...";
				}
			}

			var $title = $("<p>").attr("id","links_"+doc._id).addClass("links").append( $("<h2>").html(header) );
			$title.click(function(){
				this._showInfo(doc);
			}.bind(this));

			//Twitter - Tooltip
			if( doc['source'] && doc['source'].startsWith("Twitter") && doc['meta.source.tweetId']) {
				$title.prop("title","");
				$title.tooltip({
					show: { delay: 1000 },
					content: function(callback){
						var $tooltipContent = $("<div>");
						twttr.widgets.createTweet(doc['meta.source.tweetId'].toString(), $tooltipContent[0],{
							width: "400px",
							conversation: true,
							dnt: true
						});
						return $tooltipContent;
					},
					open : function(event, ui) {
						if (typeof(event.originalEvent) === 'undefined') {
								return false;
						}
						var $id = $(ui.tooltip).attr('id');
						// close any lingering tooltips
						$('div.ui-tooltip').not('#' + $id).remove();
					},
					close: function(event, ui) {
						ui.tooltip.hover(
							function() { $(this).stop(true).fadeTo(400, 1); },
							function() {
								$(this).fadeOut('400', function() {
									$(this).remove();
								});
							}
						);
					}
				});
			}

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
					//FIX - comma problem
					text = text.replace(/,([^\s])/g, ", $1");

					var value = this._sliceTextMore(text, moreSize);
					keyLabel = this._getSimpleKey(key);

					//ADD here HTML tags to the value
					//dbpedia links transformation
					if(key == "meta.extracted.text.dbpedia"){
						value = this._generateHTMLLinks(value);
					}

					var $key = $('<span>').addClass("info-label").html(keyLabel);
					var $value = $('<span>').addClass("info-value").html(value);

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

		/**
		 * Loads a Video Player on the right panel
		 * @param {String} videoLink - Link to the video or URL of youtube video
		 * @param {Bollean} isYoutube - true if the video is a youtube link
		 * @private
		 */
		_openVideoPlayer: function(videoLink, isYoutube){
			var container, embedHtml;
			if(contentLayout.east.state.isClosed){
				contentLayout.open("east");
			}

			container = contentLayout.east.pane.find(".panel-content");
			if(isYoutube){
				embedHtml = '<embed width="420" height="315"src="'+videoLink+'&autoplay=1">';
			} else {
				embedHtml = '<video width="420" height="315"src="'+videoLink+'" controls></video>';
				//UTIL.checkUrlExists(videoLink, function(exist){
				//	if(!exist){
				//		container.append("<br><span class='ui-state-error-text'>VIDEO LINK BROKEN</span>");
				//	}
				//});
			}
			container.html(embedHtml);

			var $a = $('<a>').attr("target","_blank").attr("href",videoLink).text("Video Link");
			container.append("<br>");
			container.append($("<p style='margin: 5px;'>").html($a));
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
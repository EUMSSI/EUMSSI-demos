/* global jQuery, JSON, AjaxSolr, EUMSSI, _, CKEDITOR, twttr, swal*/
(function ($) {

	AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
		start: 0,

		// Attributes that will be rendered in addition to the default info.
		dynamicAttributes: [],
		excludedFields: [],

		addDynamicAttribute : function(attrName,attrLabel,render) {
			this.dynamicAttributes[attrName] = {
				key: attrName,
				label: attrLabel,
				render: typeof render === "boolean" ? render : false
			};
		},

		addDynamicAttributes : function(arrayAttr) {
			arrayAttr.forEach(function(attr) {
				this.addDynamicAttribute(attr.key, attr.label, attr.render);
			}.bind(this));
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
				if(this.dynamicAttributes[it].render && this.dynamicAttributes[it] !== "meta.extracted.audio_transcript"){
					keyArray.push(it);
				}
			}
			return keyArray;
		},

		beforeRequest: function () {
			return true;
		},

		afterRequest: function () {
			this.$target.parents(".ui-tabs-panel").scrollTop(0);
			this.$target.empty();
			for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
				var doc = this.manager.response.response.docs[i];
				this.$target.append(this.defaultTemplate(doc));
			}
			this._initDragables();
		},

		/**
		 * Error Management
		 * @param message
		 */
		afterRequestError: function(message) {
			this.$target.html($("<div>").addClass("ui-error-text").text(message));
		},

		_generateShowDetailSection: function(doc) {
			var $container = this._generateCollapseContainer("Show detail");
			$container.find(".info-label").click(this._expandShowDetail.bind(this, doc));
			return $container;

		},

		_generateAudioTranscriptSection: function(doc) {
			var $container = this._generateCollapseContainer("Audio transcript ");
			$container.find(".info-label").click(this._expandAudioTranscriptJson.bind(this, doc));
			return $container;

		},

		_generateNormalAudioTranscriptSection: function(doc) {
			var $container = this._generateCollapseContainer("Audio transcript ");
			$container.find(".info-label").click(this._expandAudioTranscript.bind(this, doc));
			return $container;

		},

		_generateCollapseContainer: function(labelText) {
			var $container = this._createElement("div", {
				"class": "info-block collapsed"
			});
			var $infoLabel = this._createInfoLabel();
			var $spanValue = this._createInfoValue();
			var $triangle = this._createElement("span", {
				"class": "ui-icon ui-icon-triangle-1-e"
			});
			$infoLabel.text(labelText);
			$infoLabel.append($triangle);
			$spanValue.hide();
			$container.append($infoLabel);
			$container.append($spanValue);
			return $container;
		},

		_getVideoPlayContainer: function(className) {
			return $("<div>", {
				"class": className,
				"title": "Play Video"
			});
		},

		_createDomVideoLink: function(params) {
			var isVideoLink = params.videoLink && !params.youtubeID;
			var icon = isVideoLink ? "icon-play" : "icon-play-youtube";
			var $play = this._getVideoPlayContainer(icon);
			params.$output.find("h2").prepend($play);
			var openVideo = function() {
				EUMSSI.EventManager.trigger("videoPlayer:loadVideo", [
					isVideoLink ? params.videoLink : params.youtubeID,
					params.doc
				]);
			};
			$play.click(function() {
				if (isVideoLink) {
					$.ajax({
						type: 'HEAD',
						url: params.videoLink,
						success: function() {
							openVideo();
						},
						error: function() {
							swal("This video is no longer available in the Deutsche Welle repository");
						}
					});
				} else {
					openVideo();
				}
			});
			this._renderSendToEditorBtn(params.$output, params.doc['meta.source.mediaurl'], !isVideoLink);
		},

		_generateTitle: function(doc, text) {
			if (this.hasHighlighting(doc, 'meta.source.text')) {
				var reg = /(<[^>]*em>)/ig;
				if (this.manager.response.highlighting[doc._id]['meta.source.text'].toString()
				                                                                   .replace(reg, "") != doc['meta.source.text']) {
					text = this._bindOriginalText(doc['meta.source.text'], text);
				} else {
					text = doc['meta.source.text'];
				}
			} else {
				text = this._sliceTextMore(text, 300);
			}
			return text;
		},

		_getCurrentEmphasisObject: function(id) {
			var emphasisObject;
			var emphasisResponseObject = this.manager.response.highlighting;
			var i;
			var key;
			var keys = Object.keys(emphasisResponseObject);
			for (i = 0; i < keys.length; i++) {
				key = keys[i];
				if (key === id) {
					emphasisObject = emphasisResponseObject[key];
				}
			}
			return emphasisObject;
		},

		_setHighligthing: function(text, id) {
			var currentEmphasis = this._getCurrentEmphasisObject(id);
			if (currentEmphasis) {
				text = this.emphasize(text, this._getEmphasis(currentEmphasis));
			}
			return text;
		},

		_getEmphasis: function(currentEmphasis) {
			var emphasisTerms;
			var i;
			var key;
			var keys = Object.keys(currentEmphasis);
			var terms = [];
			var filterInArray = function(term) {
				return terms.indexOf(term) < 0;
			};

			for (i = 0; i < keys.length; i++) {
				key = keys[i];
				emphasisTerms = this.getEmphasis(currentEmphasis[key][0]);
				terms = terms.concat(emphasisTerms.filter(filterInArray));
			}

			return terms;
		},


		/*
		 * "<em>Lorem Ipsum</em>" -> ["Lorem Ipsum"]
		 * */
		getEmphasis: function(str) {
			return str.match(/[^>]+(?=<\s*\/\s*em\s*>)/igm);
		},

		emphasize: function(str, ems) {
			var i;
			var ret = str;
			for (i = 0; i < ems.length; i++) {
				ret = ret.replace(new RegExp("\\b" + ems[i] + "\\b", "g"), "<em>" + ems[i] + "</em>");
			}

			return ret;
		},
		

		/**
		 * Generate a HTML for the given document DATA
		 * @param {Object} doc - data of the document
		 * @fires videoPlayer:loadVideo
		 * @returns {*|jQuerySelector} the jQuery selector with the generated html code.
		 */
		defaultTemplate: function (doc) {
			var text = this.getValueByKey(doc, 'meta.source.text') || "...";
			var date = doc['meta.source.datePublished'];
			var youtubeID = doc['meta.source.youtubeVideoID'];
			var videoLink = doc['meta.source.mediaurl'] || doc['meta.source.httpHigh'] || doc['meta.source.httpMedium'];
			var urlLink = doc['meta.source.url'];
			var audioTranscriptJson = doc['meta.extracted.audio_transcript-json'];
			var audioTranscript = doc['meta.extracted.audio_transcript'];
			var hasTwitter = doc['meta.source.tweetId'];

			text = this._generateTitle(doc, text);
			// Render HTML Code
			var $output = $('<div class="result-element">');

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

			if (youtubeID || videoLink) {
				this._createDomVideoLink({
					videoLink: videoLink,
					youtubeID: youtubeID,
					$output: $output,
					doc: doc
				});
			}

			//Segments
			if(videoLink || youtubeID){
				var $segment = $('<div class="info-block collapsed">')
					.append('<span class="info-label">Segments<span class="ui-icon ui-icon-triangle-1-e"></span></span>')
					.append('<span class="info-value" style="display: none;"><img src="images/ajax-loader.gif"></span>');
				$output.append($segment);
				$segment.find(".info-label").click(this._expandSegments.bind(this,doc["_id"],$segment));
			}

			//Link webpage
			if(urlLink){
				var $link = $('<div class="icon-link" title="Open link">');
				$output.find("h2").append($link);
				$link.click(UTIL.openNewPage.bind(this, urlLink));
			}

			//Background Images
			if(hasTwitter){
				$output.addClass("element-tweet");
			}
			if(youtubeID){

				$output.addClass("result-element-youtube");
			}
			if(videoLink && !youtubeID){
				$output.addClass("result-element-video");
			}

			var $showDetailContainer = this._generateShowDetailSection(doc);
			$output.append($showDetailContainer);
			if (audioTranscriptJson) {
				var $showAudioTranscriptJson = this._generateAudioTranscriptSection(doc);
				$output.append($showAudioTranscriptJson);
			}

			if (!audioTranscriptJson && audioTranscript) {
				var $showAudioTranscriptSection = this._generateNormalAudioTranscriptSection(doc);
				$output.append($showAudioTranscriptSection);
			}

			if (hasTwitter && !youtubeID && !videoLink) {
				var $but = this._createSendToEditorButton(hasTwitter);
				$output.append($but);
			}
			
			return $output;
		},

		_createSendToEditorButton: function(tweetId) {
			var $div = $("<div>", {
				"class": "tweet-to-editor",
				"title": "Write tweet on text editor"
			});
			var $span = $("<span>", {
				"class": "ui-icon ui-icon-comment"
			});
			$div.append(" to Editor");
			$div.prepend($span);
			$div.on("click", this._onSendToEditorButtonClick.bind(this, tweetId));
			return $div;
		},

		_onSendToEditorButtonClick: function(tweetId) {
			var oEditor = CKEDITOR.instances["richeditor-placeholder"];
			twttr.widgets.createTweet(tweetId, oEditor.document.getBody().$);
		},

		_getNotAllowedKeys: function() {
			return [
				"_id",
				"_ts",
				"_version_",
				"contentSearch",
				"meta.extracted.audio_transcript",
				"meta.extracted.audio_transcript-json",
				"meta.extracted.audio_transcript-dbpedia",
				"meta.extracted.video_persons.amalia",
				"meta.extracted.video_persons.thumbnails",
				"meta.source.datePublished",
				"meta.source.headline",
				"meta.source.duration",
				"meta.source.mediaurl",
				"meta.source.teaser",
				"meta.source.text",
				"meta.source.type",
				"ns",
				"source",
			    "meta.extracted.text_polarity.discrete",
			    "meta.extracted.text_nerl.dbpedia.Country",
			    "meta.extracted.text_nerl.ner.PERSON",
				"meta.extracted.text_nerl.dbpedia.LOCATION",
				"meta.extracted.video_persons.thumbnails",
			    "meta.extracted.video_ocr.best"
			];
		},
		deleteKeys: function(keysArray) {
			var keys = this._getNotAllowedKeys();
			keys.forEach(function(key) {
				var index = keysArray.indexOf(key);
				if (index >= 0) {
					keysArray.splice(index, 1);
				}
			});
			return keysArray;
		},

		_expandShowDetail: function(doc, event) {
			var $target = $(event.currentTarget);
			var $nextContainer = $target.next(".info-value");
			if (!$target.data("load")) {
				var keysArray = Object.keys(doc);
				keysArray.sort();
				keysArray = this.deleteKeys(keysArray);
				var $content = this._renderShowDetail(keysArray, doc);
				$nextContainer.append($content);
				$target.data("load", true);
			}
			this._toggleCollapseContainer($target);
		},

		_toggleCollapseContainer: function($target) {
			var $ico = $target.find(".ui-icon");
			var $nextContainer = $target.next(".info-value");
			var closeClassName = "ui-icon ui-icon-triangle-1-e";
			var openClassName = "ui-icon ui-icon-triangle-1-s";
			if ($ico.hasClass(closeClassName)) {
				$ico.removeClass(closeClassName).addClass(openClassName);
				$nextContainer.show();
			} else {
				$nextContainer.hide();
				$ico.removeClass(openClassName).addClass(closeClassName);
			}
		},

		_generateTranscriptItem: function(actualTranscript, _id) {
			var beginTime = new Date(actualTranscript.beginTime).toLocaleTimeString(undefined, {timeZone: "UTC"});
			var $li = this._createElement("li");
			var $play = this._createElement("span", {
				"class": "icon-play-segment"
			}).attr("title", "Play");
			$li.append($play);
			$li.append(actualTranscript.speakerId + " ");
			$li.append(beginTime + ": ");
			var text = this._setHighligthing(actualTranscript.transcript, _id);
			$li.append(text);
			return $li;
		},

		_generateTranscriptItems: function(doc) {
			var items = JSON.parse(doc['meta.extracted.audio_transcript-json']);
			var $items = [];
			for (var i = 0; i < items.length; i += 1) {
				var actualTranscript = items[i];
				var $li = this._generateTranscriptItem(actualTranscript, doc._id);
				$li.find(".icon-play-segment").click(this._onClickPlayAudioTranscript.bind(this, doc, actualTranscript));
				$items.push($li);
			}
			return $items;
		},

		_expandAudioTranscriptJson: function(doc, event) {
			var $target = $(event.currentTarget);
			var $nextContainer = $target.next(".info-value");
			if (!$target.data("load")) {
				var $ul = this._createElement("ul");
				var $items = this._generateTranscriptItems(doc);
				$ul.append($items);
				$nextContainer.append($ul);
				$target.data("load", true);
			}
			this._toggleCollapseContainer($target);
		},

		_expandAudioTranscript: function(doc, event) {
			var $target = $(event.currentTarget);
			var $nextContainer = $target.next(".info-value");
			if (!$target.data("load")) {
				var text = doc['meta.extracted.audio_transcript'];
				text = this._setHighligthing(text, doc._id);
				$nextContainer.append(text);
				$target.data("load", true);
			}
			this._toggleCollapseContainer($target);
		},

		_createElement: function(tag, options) {
			options = options || {};
			return $('<' + tag + '>', options);
		},

		_expandSegments: function(parentId, $el, event){
			if($el.hasClass("collapsed")){
				//EXPAND
				if(!$el.hasClass("info-loaded")){
					//Retrieve the segments Data
					//XXX TEMPORAL FIX
					parentId = parentId.replace(/-/g, '');
					//XXX TEMPORAL FIX
					EUMSSI.Manager.getSegmentsByParentId(parentId).done(function(response){
						$el.find(".info-value").html(this._renderSegments(JSON.parse(response)));
						$el.addClass("info-loaded");
					}.bind(this));
				}
				$el.removeClass("collapsed");
				$el.addClass("expanded");
				$el.find(".info-value").show();
				$el.find(".info-label .ui-icon")
					.removeClass("ui-icon-triangle-1-e")
					.addClass("ui-icon-triangle-1-s");
			} else {
				//COLLAPSE
				$el.removeClass("expanded");
				$el.addClass("collapsed");
				$el.find(".info-value").hide();
				$el.find(".info-label .ui-icon")
					.removeClass("ui-icon-triangle-1-s")
					.addClass("ui-icon-triangle-1-e");
			}
		},

		/**
		 * Creates the content html for segments
		 * @param {object} segmentsResponse - the JSON object with the server response.
		 * @returns {*|HTMLElement} html output with the segments data
		 * @private
		 */
		_renderSegments: function(segmentsResponse){
			var html = $("<ul>");
			if(segmentsResponse.response.docs.length > 0){
				for (var i = 0, l = segmentsResponse.response.docs.length; i < l; i++) {
					var segmentDoc = segmentsResponse.response.docs[i];
					var highlighting = segmentsResponse.highlighting[segmentDoc._id];
					var $li = $("<li>");
					var $playSegment = $('<span class="icon-play-segment">').attr("title","Play Segment");
					var textField = "meta.extracted.audio_transcript";
					$li.append($playSegment);
					if(segmentDoc.segmentType === "OcrSegment"){
						$li.append($('<span class="icon-play-ocr">'));
						textField = "meta.extracted.video_ocr.best";
					}

					$li.append(new Date(segmentDoc.beginOffset).toLocaleTimeString(undefined,{timeZone:"UTC"})
						+ " - " + new Date(segmentDoc.endOffset).toLocaleTimeString(undefined,{timeZone:"UTC"}));
					$li.append(" <i>..."+ this._bindOriginalText(segmentDoc[textField], highlighting[textField])+"...<i>");
					html.append($li);

					$playSegment.click(this._onClickPlaySegment.bind(this,segmentDoc));
				}
			} else {
				html = " No segments were found."
			}

			return html;
		},

		_getVideoLink: function(doc) {
			return doc['meta.source.httpHigh'] || doc['meta.source.mediaurl'] || doc['meta.source.httpMedium'];
		},

		_onClickPlayAudioTranscript: function(doc, transcript){
			var videoLink = this._getVideoLink(doc);
			var init = parseFloat(transcript.beginTime, 10);
			EUMSSI.EventManager.trigger("videoPlayer:loadVideo", [
				videoLink,
				doc,
				init
			]);
		},

		/**
		 * Open player with the segment time as init time
		 * @param segmentDoc
		 * @private
		 */
		_onClickPlaySegment: function(segmentDoc){
			//Get videoLink from parent result on general Search
			var parentDoc, videoLink = "";
			var parentId = "{0}-{1}-{2}-{3}-{4}".replace("{0}",segmentDoc.parent_id.substr(0,8))
				.replace("{1}",segmentDoc.parent_id.substr(8,4))
				.replace("{2}",segmentDoc.parent_id.substr(12,4))
				.replace("{3}",segmentDoc.parent_id.substr(16,4))
				.replace("{4}",segmentDoc.parent_id.substr(20));
			parentDoc = _.findWhere(this.manager.response.response.docs, {"_id": parentId});

			if(parentDoc){
				videoLink = parentDoc['meta.source.httpHigh'] || parentDoc['meta.source.mediaurl'] || parentDoc['meta.source.httpMedium'];
			}

			EUMSSI.EventManager.trigger("videoPlayer:loadVideo", [videoLink, parentDoc, parseFloat(segmentDoc.beginOffset), parseFloat(segmentDoc.endOffset) ]);
		},

		_renderTitle: function(doc){
			var $header =  $("<span class=''>"),
				$title = $("<h2>"),
				text = "";
			$header.html(this.getValueByKey(doc, 'meta.source.headline'));

			//Twitter - special behaviour
			if(!doc['meta.source.headline'] && doc['source'] && doc['source'].startsWith("Twitter") ) {
				text = this.getValueByKey(doc, 'meta.source.text') || "";
				$header.html(text.substring(0, 50));
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
					$title.append($twitterLogo);
				}
			}

			//Wikipedia Event - special behaviour
			if(!doc['meta.source.headline'] && doc['source'] && doc['source'].startsWith("Wikipedia") ) {
				text = this.getValueByKey(doc, 'meta.source.text') || "";
				$header.html(text.substring(0, 50));
				if(text.length > 50){
					$header.append("...");
				}
			}

			$header.attr("id","links_"+doc._id);
			$header.click(function(){
//				this._showInfo(doc);
			}.bind(this));
			$title.append( $header );

			return $title;
		},

		/**
		 * Return highlighting if exists or the doc value in other case.
		 * @param doc
		 * @param key
		 * @returns {*}
		 */
		getValueByKey : function(doc, key){
			var value;
			if(this.hasHighlighting(doc, key)){
				value = this.manager.response.highlighting[doc._id][key].toString();
			}else{
				value = doc[key] ? doc[key].toString() : "";
			}
			return value;
		},

		hasHighlighting : function(doc, key){
			if(this.manager.response.highlighting){
				return this.manager.response.highlighting[doc._id] && this.manager.response.highlighting[doc._id][key];
			}else{
				return false;
			}
		},

		//popup with the whole information
		_showInfo: function(doc){

			var keysArray = Object.keys(doc);
			keysArray.sort();

			var $content = this._renderKeyArray(keysArray,doc);
			$content.dialog({
				title: "Result Information",
				width: 800,
				dialogClass: "resultInformation",
				maxHeight: $(window).height() - 120,
				modal: true,
				close: function() {
					$(this).dialog('destroy').remove();
				}
			});
			$content.dialog("option", "position", {my:"center", at:"center", of:window});
		},

		_isSourceKey: function(doc, text, key) {
			var $key = this._createInfoLabel();
			var $value = this._createInfoValue();
			var url = doc["meta.source.websiteUrl"];
			var insert = text;
			if (url) {
				insert = $("<a>", {
					href: url,
					target: "_blank"
				}).text(text);
			}
			$key.html(this._getSimpleKey(key));
			$value.html(insert);
			var $p = $("<p>");
			$p.append([
				$key,
				$value
			]);
			return $p;
		},

		_renderKeyArray : function(keysArray, doc, moreSize) {
			var audioTranscript = this._getDynamicAttrs()[0];
			keysArray.push(audioTranscript.key);
			var $content = $("<div>");
			moreSize = moreSize || 1000;
			for(var i = 0 ; i < keysArray.length ; i++){
				var key = keysArray[i];
				//Check if the doc data has the Key
				if(doc[key]) {
					var text = doc[key].toString();
					var $value = $('<span>').addClass("info-value");
					var $key = $('<span>').addClass("info-label");

					switch(key){
						case "source" :
							var $html = this._isSourceKey(doc, text, key);
							$content.append($html);
						break;
						case "meta.extracted.audio_transcript-json":
							$content.append("");
							break;
						case "meta.extracted.audio_transcript":
							$content.append("");
							break;
						case "meta.extracted.text_nerl.dbpedia.PERSON" :
							value = this._personCustomRender(text, $content);
							$value.addClass("person-data");

							$key.html(this._getSimpleKey(key));
							$value.html(value);

							$content.append($('<p>').append($key).append($value));

						break;
						case "meta.extracted.text_nerl.dbpedia.LOCATION" :
							value = this._locationCustomRender(text, $content);

							$key.html(this._getSimpleKey(key));
							$value.html(value);

							$content.append($('<p>').append($key).append($value));

							break;
						case "meta.extracted.video_persons.thumbnails" :
							// Persons Thumbnails
							value = this._personThumbnailsCustomRender(doc[key]);

							$key.html(this._getSimpleKey(key));
							$value.html(value);

							$content.append($('<p>').append($key).append($value));

							break;
						default :
							//FIX - comma problem
							text = text.replace(/,([^\s])/g, ", $1");

							var value = this._sliceTextMore(text, moreSize);

							//ADD here HTML tags to the value
							//dbpedia links transformation
							if(key == "meta.extracted.text_nerl.dbpedia"){
								value = this._generateHTMLLinks(value);
							}
							var currentEmphasisObject = this._getCurrentEmphasisObject(doc._id);
							$key.html(this._getSimpleKey(key));
							if (currentEmphasisObject[key]) {
								text = this.emphasize(text, this.getEmphasis(currentEmphasisObject[key][0]));
							}
							$value.html(text);
							$content.append($('<p>').append($key).append($value));
							break;
					}
				}
			}

			return $content;
		},


		_parseContent: function(doc, key, $content) {
			var docValue = doc[key];
			var text = docValue.toString();
			var $value = this._createInfoValue();
			var $key = this._createInfoLabel();
			var value;
			switch (key) {
				case "meta.extracted.text_nerl.dbpedia.PERSON":
					value = this._personCustomRender(text, $content);
					$value.addClass("person-data");
					$value.html(value);
					break;
				case "meta.extracted.text_nerl.dbpedia.LOCATION" :
					value = this._locationCustomRender(text, $content);
					$value.html(value);
					break;
				case "meta.extracted.video_persons.thumbnails" :
					value = this._personThumbnailsCustomRender(docValue);
					$value.html(value);
					break;
				default :
					var highlighting = this.manager.response.highlighting
						? this.manager.response.highlighting[doc._id]
						: "";
					$value = this._createValueSimpleKey(key, highlighting, doc);
					break;
			}

			$key.html(this._getSimpleKey(key));
			var $p = $('<p>');
			$p.append($key).append($value);
			$content.append($p);
			return $content;
		},


		_renderShowDetail : function(keysArray, doc) {
			var $content = this._createElement("div");
			for(var i = 0 ; i < keysArray.length ; i++){
				var key = keysArray[i];
				if(doc[key]) {
					var $html = this._parseContent(doc, key, $content);
					$content.append($html);
				}
			}
			return $content;
		},

		_createValueSimpleKey: function (highlightingKey, highlighting, doc) {
			var $value = this._createInfoValue();
			//check if it has highlighting
			var highText = highlighting[highlightingKey] ? highlighting[highlightingKey].toString() : "";
			var reg = /(<[^>]*em>)/ig;
			if (highText && highText.replace(reg, "") != doc[highlightingKey].toString()) {
				$value.html(this._bindOriginalText(doc[highlightingKey].toString(), highlighting[highlightingKey].toString()));
			} else {
				$value.html(doc[highlightingKey].toString());
			}
			return $value;
		},

		_createInfoLabel: function() {
			return this._createElement("span", {
				"class": "info-label"
			});
		},

		_createInfoValue: function() {
			return this._createElement("span", {
				"class": "info-value"
			});
		},

		_renderKey: function ($key, highlightingKey, highlighting, doc, $value, $content) {
			$key.html(this._getSimpleKey(highlightingKey));

			//check if it has highlighting
			var highText = highlighting[highlightingKey] ? highlighting[highlightingKey].toString() : "";
			var reg = /(<[^>]*em>)/ig;
			if (highText && highText.replace(reg, "") != doc[highlightingKey].toString()) {
				$value.html(this._bindOriginalText(doc[highlightingKey].toString(), highlighting[highlightingKey].toString()));
			} else {
				$value.html(doc[highlightingKey].toString());
			}

			$content.append($('<p>').append($key).append($value));
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

		/**
		 * If the text has highlighting the original text is linked to show it
		 * if the user click the plus button.
		 *
		 * @param {String} text
		 * @returns {HTML} the original text
		 * @private
		 */
		_bindOriginalText: function(originalText, highlighting){
			var reg = /(<[^>]*em>)/ig;
			var text = originalText;
			if(highlighting) {
				var highlighting = highlighting.toString();
				var text = '<span class="ui-slicetext-showpart ui-after-points" >' +
					this._replaceOriginalForHighlighting(highlighting.replace(reg, "").replace(/</g, "&lt;").replace(/>/g, "&gt;")) +
					'</span> <span class="ui-slicetext-hidepart" style="display:none;">' +
					this._replaceOriginalForHighlighting(originalText.replace(/</g, "&lt;").replace(/>/g, "&gt;")) +
					'</span> <span class="showOriginal ui-icon ui-icon-plusthick">';
			}
			return text;
		},

		_replaceOriginalForHighlighting : function(originalText) {
			var filters = EUMSSI.FilterManager.getFilters("GENERAL_SEARCH");
			if (filters && filters.length === 0) {
				return originalText;
			}

			if (filters.length > 0 && filters[0].query.split(":")[1] != "*") {
				var re = new RegExp(filters[0].query.split(":")[1], "ig");
				return originalText.replace(re, function (match) {
					return "<em>" + match + "</em>";
				});
			}
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

		_locationCustomRender: function(text, $content){
			var tempArray = [];
			var locationCount = _.countBy(text.split(","),function(loc){return loc;});
			_.each(locationCount, function(val,key){
				if(val > 1){
					tempArray.push(key + "(x" + val + ")");
				} else {
					tempArray.push(key);
				}
			});
			return tempArray.join(", ")+".";
		},

		_personThumbnailsCustomRender : function(links){
			var $value = $("<div class='result-video-person-thumbnails'>");
			var $container = $("<div class='thumbnails-container'>");
			if(links instanceof Array){
				_.each(links, function(link){
					$container.append($("<img class='person-thumbnail'>").prop("src",link));
				});
			}
			$value.append($container);
			return $value;
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
			this.$target = $(this.target);
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
			$(document).on('click', 'span.showOriginal', function () {
				var $this = $(this),
					$hiddenText = $this.parent().find('.ui-slicetext-hidepart'),
					$visibleText = $this.parent().find('.ui-slicetext-showpart');

				if ($hiddenText.is(':visible')) {
					$hiddenText.hide();
					$visibleText.show();
					$visibleText.addClass("ui-after-points");
					$this.removeClass('ui-icon-minusthick');
					$this.addClass('ui-icon-plusthick');
				} else {
					$hiddenText.show();
					$visibleText.hide();
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
			this.addDynamicAttributes(this._getDynamicAttrs());
			this.excludedFields = ["meta.source.headline", "meta.source.text", "meta.source.teaser", "contentSearch"];
		},

		_getDynamicAttrs: function() {
			return [
				{
					key: "meta.extracted.audio_transcript",
					label: "Audio Transcript",
					showInResultCheck: true
				},
				{
					key: "meta.extracted.video_ocr.best",
					label: "Caption in video",
					showInResultCheck: true
				},
				{
					key: "meta.extracted.text_nerl.dbpedia.PERSON",
					label: "Person",
					showInResultCheck: true
				},
				{
					key: "meta.extracted.text_nerl.dbpedia.LOCATION",
					label: "Location",
					showInResultCheck: true
				},
				{
					key: "meta.extracted.video_persons.thumbnails",
					label: "Persons in video",
					showInResultCheck: true
				},
				{
					key: "meta.extracted.text_nerl.ner.PERSON",
					label: "Person",
					showInResultCheck: false
				},
				{
					key: "meta.extracted.text_nerl.ner.LOCATION",
					label: "Location",
					showInResultCheck: false
				},
				{
					key: "meta.extracted.text_nerl.ner.LOCATION",
					label: "Location",
					showInResultCheck: false
				}
			];
		},

		_initDragables: function(){
			if(!EUMSSI.demoMode){
				this.$target.find(".result-element").draggable({
					scope: "editorDrop",
					delay: 150,
					iframeFix: true,
					helper: "clone",
					zIndex : 100,
					cursorAt: { left: -10, top: -15 },
					appendTo: "body",
					containment: "body"
				});
			}
		},

		_renderSendToEditorBtn : function($element, videoId, isYoutube){
			setTimeout(function($element, videoId){
				if(!EUMSSI.demoMode && CKEDITOR){
					var $sendToEditor = $('<div class="result-to-editor-container">')
						.append($('<div class="result-to-editor" title="Embed video on text editor">')
						.html('<span class="ui-icon ui-icon-comment">&nbsp;</span>&nbsp;to Editor'))
						 ;
					$element.append($sendToEditor);
					$sendToEditor.on("click", this._sendToEditor.bind(this, videoId,isYoutube));
				}
			}.bind(this, $element, videoId),300);
		},

		_sendToEditor: function(videoId, isYoutube){
			var self = this;
			if(isYoutube){
				this._embedVideo(videoId);
			}else {
				$.ajax({
					type: 'HEAD',
					url: videoId,
					success: function() {
						self._embedVideo(videoId);
					},
					error: function() {
						alert("The video does not exist");
					}
				});
			}
		},

		_embedVideo: function(videoId){
			// TODO utilizar el mismo método que con twitter.
			$(".cke_button__embed").click();
			$(".cke_dialog.cke_browser_webkit.cke_ltr.cke_single_page").css("display", "none");
			setTimeout(function(){
				$(".cke_dialog.cke_browser_webkit.cke_ltr.cke_single_page").css("display", "none");
				$("input.cke_dialog_ui_input_text").val(videoId);
				$(".cke_dialog_ui_hbox_first a span").click();
				$(".cke_dialog_background_cover").remove();
			}, 100);
		}
	});

})(jQuery);

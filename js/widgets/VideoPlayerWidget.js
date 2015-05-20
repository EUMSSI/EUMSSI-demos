/*global jQuery, $, _, AjaxSolr, EUMSSI*/
(function ($) {

	/**
	 * VIDEO PLAYER WIDGET
	 * Widget that manages the video visualization
	 * @type {A|*|void}
	 * @augments AjaxSolr.AbstractWidget
	 */
	AjaxSolr.VideoPlayerWidget = AjaxSolr.AbstractWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		_options : {

		},

		init: function(){
			/**
			 * @event videoPlayer:loadVideo
			 * @property {String} videoLink - Link to the video
			 * @property {Object} doc - The document data related to the video
			 */
			EUMSSI.EventManager.on("videoPlayer:loadVideo", this._openVideoPlayer.bind(this));
		},

		beforeRequest: function(){
			return true;
		},

		afterRequest: function(){
			return true;
		},

		/**
		 * Loads a Video Player on the right panel
		 * @param {String} videoLink - Link to the video or URL of youtube video
		 * @param {Object} doc - the document data
		 * @private
		 * @listens videoPlayer:loadVideo
		 */
		_openVideoPlayer: function(event, videoLink, doc){
			var container, embedHtml;
			var isYoutube = !!doc['meta.source.youtubeVideoID'];
			if(EUMSSI.contentLayout.east.state.isClosed){
				EUMSSI.contentLayout.open("east");
			}

			container = EUMSSI.contentLayout.east.pane.find(".panel-content");
			if(isYoutube){
				embedHtml = '<embed width="420" height="315"src="'+videoLink+'&autoplay=1">';
			} else {
				embedHtml = '<video width="420" height="315"src="'+videoLink+'" controls></video>';
				//EUMSSI.UTIL.checkUrlExists(videoLink, function(exist){
				//	if(!exist){
				//		container.append("<br><span class='ui-state-error-text'>VIDEO LINK BROKEN</span>");
				//	}
				//});
			}
			container.html(embedHtml);

			var $a = $('<a>').attr("target","_blank").attr("href",videoLink).text("Video Link");
			container.append("<br>");
			container.append($("<p style='margin: 5px;'>").html($a));
		}

	});

})(jQuery);
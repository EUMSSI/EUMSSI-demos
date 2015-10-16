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
			var amaliaData = !!doc['meta.extracted.video_persons.amalia'];
			if(EUMSSI.contentLayout.east.state.isClosed){
				EUMSSI.contentLayout.open("east");
			}

			container = EUMSSI.contentLayout.east.pane.find(".panel-content");

			if(isYoutube){
				// YOUTUBE
				embedHtml = '<embed width="420" height="315"src="'+videoLink+'&autoplay=1">';
				container.html(embedHtml);
			} else {
				// OTHER - AMALIA
				//embedHtml = '<video width="420" height="315"src="'+videoLink+'" controls></video>';
				//New container
				var $amaliacontainer = $('<div class="amalia-placeholder">');
				var $amaliaTextSync = $('<div id="myplayer-tsync-tsync">');
				container.html($('<div style="width:420px; height:315px;">').append($amaliacontainer));
				container.append($('<div style="width:420px; height:315px;">').append($amaliaTextSync));

				var amaliaConfig = {
					autoplay: true,
					src: videoLink
				};
				if(amaliaData){
					_.extend(amaliaConfig, {
						plugins: {
							dataServices: [
								"http://www.json-generator.com/api/json/get/ccUAvUYXjC"
								//{"localisation":[{"tcout":"00:04:32.6000","tclevel":0,"type":"text","tcin":"00:00:00.0000","sublocalisations":{"localisation":[{"tcout":"00:00:32.2000","tclevel":1,"data":{"text":["Gerald_Czajka"]},"thumb":"http://eumssi.cloudapp.net/images/16489336-2585-15cd-27a0-9c68d49943ad/face_thumbnails/Gerald_Czajka.jpg","tcin":"00:00:30.6799"},{"tcout":"00:00:33.8800","tclevel":1,"data":{"text":["Gerald_Czajka"]},"thumb":"http://eumssi.cloudapp.net/images/16489336-2585-15cd-27a0-9c68d49943ad/face_thumbnails/Gerald_Czajka.jpg","tcin":"00:00:32.6000"},{"tcout":"00:00:48.9600","tclevel":1,"data":{"text":["Gerald_Czajka"]},"thumb":"http://eumssi.cloudapp.net/images/16489336-2585-15cd-27a0-9c68d49943ad/face_thumbnails/Gerald_Czajka.jpg","tcin":"00:00:39.5200"},{"tcout":"00:03:10.5999","tclevel":1,"data":{"text":["Gerald_Czajka"]},"thumb":"http://eumssi.cloudapp.net/images/16489336-2585-15cd-27a0-9c68d49943ad/face_thumbnails/Gerald_Czajka.jpg","tcin":"00:03:06.6800"},{"tcout":"00:03:29.0399","tclevel":1,"data":{"text":["Gerald_Czajka"]},"thumb":"http://eumssi.cloudapp.net/images/16489336-2585-15cd-27a0-9c68d49943ad/face_thumbnails/Gerald_Czajka.jpg","tcin":"00:03:16.4799"},{"tcout":"00:04:32.6000","tclevel":1,"data":{"text":["Gerald_Czajka"]},"thumb":"http://eumssi.cloudapp.net/images/16489336-2585-15cd-27a0-9c68d49943ad/face_thumbnails/Gerald_Czajka.jpg","tcin":"00:04:12.5999"}]}}],"type":"segment","id":"speaker_labellabel_shot"}
							],
							list: [{
								'className': 'fr.ina.amalia.player.plugins.TextSyncPlugin',
								'container': '#myplayer-tsync-tsync',
								'parameters': {
									metadataId: 'speaker_labellabel_shot',
									title: 'My title',
									description: 'A description I may have to put here',
									level: 1,
									displayLevel: 1,
									scrollAuto: true
								}
							}]
						}
					});
				}
				$amaliacontainer.mediaPlayer(amaliaConfig);
			}

			var $a = $('<a>').attr("target","_blank").attr("href",videoLink).text("Video Link");
			container.append("<br>");
			container.append($("<p style='margin: 5px;'>").html($a));
		}

	});

})(jQuery);
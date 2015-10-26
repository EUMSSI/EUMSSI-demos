/*global jQuery, $, _, AjaxSolr, EUMSSI, fr*/
(function ($) {

	/**
	 * VIDEO PLAYER WIDGET
	 * Widget that manages the video visualization
	 * @type {A|*|void}
	 * @augments AjaxSolr.AbstractWidget
	 */
	AjaxSolr.VideoPlayerWidget = AjaxSolr.AbstractWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function(){
			this._initAmaliaJSONLoader();
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

		_initDialogConfiguration: function(){
			this.dialog = $($("#player-dialog-tpl").html()).dialog({
				autoOpen: false,
				resizable: false,
				dialogClass: "video-dialog",
				close: function( event, ui ){
					//Remove de content player when close
					this.$player.empty();
				}.bind(this)
			});
			this.$player = this.dialog.find(".player-placeholder");
			// Dialog Buttons Actions
			this.dialog.find(".player-minimize").on("click", this._minimizePlayer.bind(this));
			this.dialog.find(".player-maximize").on("click", this._maximizePlayer.bind(this));
		},

		/**
		 * Loads a Video Player
		 * @param {String} videoLink - Link to the video or URL of youtube video
		 * @param {Object} doc - the document data
		 * @private
		 * @listens videoPlayer:loadVideo
		 */
		_openVideoPlayer: function(event, videoLink, doc, tcin, tcout){
			if(!this.dialog){
				this._initDialogConfiguration();
			}
			var isYoutube = !!doc['meta.source.youtubeVideoID'];
			this.$player.empty();

			if(isYoutube){
				this._loadYoutubePlayer(this.$player, videoLink, tcin);
			} else {
				this._loadAmaliaPlayer(this.$player, videoLink, doc, tcin);
			}

			//Set dialog Title
			this.dialog.dialog("option", "title", doc["meta.source.headline"]);
			this.dialog.dialog("open");

			//Class for dialog width
			if(this.dialog.find(".amalia-plugin-tsync-placeholder:visible").length > 0){
				this.dialog.parents(".ui-dialog").addClass("plugin-on");
			} else {
				this.dialog.parents(".ui-dialog").removeClass("plugin-on");
			}

			// Update Video Link
			this.dialog.find("a.video-link").attr("href",videoLink);
		},

		_loadYoutubePlayer: function($container, videoLink, tcin){
			var embedHtml;
			videoLink = "http://www.youtube.com/v/{ID}?autoplay=1".replace("{ID}",videoLink);
			if(tcin){
				videoLink += "&start="+parseFloat(tcin)/1000;
			}
			embedHtml = '<div class="youtube-placeholder"><embed width="520" height="320" src="'+videoLink+'"></div>';

			$container.html(embedHtml);
		},

		_loadAmaliaPlayer: function($container, videoLink, doc, tcin){
			$container.html($("#amalia-placeholder-tpl").html());
			var $amaliacontainer = $container.find(".amalia-player");
			var amaliaConfig = {
				autoplay: true,
				src: videoLink
			};

			if(!!doc['meta.extracted.video_persons.amalia']){
				_.extend(amaliaConfig, {
					plugins: {
						dataServices: [{
							//Custom Loader
							protocol : "fr.ina.amalia.player.JSONLoader",
							parameters: JSON.parse(doc['meta.extracted.video_persons.amalia'].replace(/'/g,"\""))
						}],
						list: [{
							'className': 'fr.ina.amalia.player.plugins.TextSyncPlugin',
							'container': '#myplayer-tsync-tsync',
							'parameters': {
								metadataId: 'video_persons', // 'speaker_labellabel_shot'
								//title: 'My title',
								//description: 'A description I may have to put here',
								level: 1,
								displayLevel: 1,
								scrollAuto: true
							}
						}]
					}
				});
				$container.find(".amalia-plugin-tsync-placeholder").show();
			}

			$amaliacontainer.mediaPlayer(amaliaConfig);
			var amaliaPlayer = $amaliacontainer.data("fr.ina.amalia.player").player;

			// When want to Start the video with custom init time
			if(tcin){
				amaliaPlayer.seek(parseFloat(tcin)/1000);
			}
		},

		_minimizePlayer: function(){
			this.dialog.parents(".ui-dialog").addClass("minimized-player");
			this.dialog.dialog( "option", "position", { my: "right bottom", at: "right bottom", of: window } );
		},

		_maximizePlayer: function(){
			this.dialog.parents(".ui-dialog").removeClass("minimized-player");
			this.dialog.dialog( "option", "position", { my: "center", at: "center", of: window } );
		},

		/**
		 * Custom Loader for Amalia Player
		 * Accepts direct JSON object
		 *
		 *  dataServices: [{
		 *		//Custom Loader
		 *		protocol : "fr.ina.amalia.player.JSONLoader",
		 *		parameters: JSON.parse(doc['meta.extracted.video_persons.amalia'].replace(/'/g,"\""))
		 *	}],
		 * @private
		 */
		_initAmaliaJSONLoader: function(){
			if(fr && fr.ina.amalia.player.BaseLoader){
				fr.ina.amalia.player.BaseLoader.extend("fr.ina.amalia.player.JSONLoader", {}, {
					requestType: "GET",
					dataType: "json",
					sendData: {},
					timeout: 12e4,
					init: function(a, b, c, d){
						this._super(a, b, c, d);
						this.waitLoadEvent = true;
					},
					initialize: function(){
						this._super();
						this.load(this.settings);
					},
					load: function(a){
						_.delay( function(){
							this.onSuccess(a.parameters, "success");
						}.bind(this),500);
					},
					onSuccess: function(a, b){
						this._super(a, b);
						this.data = null;
						if(this.parser){
							this.data = this.parser.processParserData(a);
							this.player.addAllMetadata(this.data);
						}
						if("function" == typeof this.completeHandler) {
							this.completeHandler(this.handlerData, b);
						}
					}
				});
			}
		}

	});

})(jQuery);

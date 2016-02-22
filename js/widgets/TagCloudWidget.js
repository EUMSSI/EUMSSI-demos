/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL */
(function ($) {

	AjaxSolr.TagcloudWidget = AjaxSolr.AbstractFacetWidget.extend({

		start: 0,	//Reset the pagination with doRequest on this Widget

		init: function() {
			this.$target = $(this.target);
			this.$tabs = this.$target.parents(".tabs-container");
		},

		beforeRequest: function(){
			return true;
		},

		afterRequest: function () {
			if(!this.manager.flag_PaginationRequest){
				if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
					$(this.target).html('No items found in current selection.');
					return;
				}
				this._renderTagCloud();
			}
		},

		_renderTagCloud: function(){
			var facet, count, i, l, size, tabPosition,
				maxCount = 0,
				objectedItems = [];
			for ( facet in this.manager.response.facet_counts.facet_fields[this.field]) {
				count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);
				if (count > maxCount) {
					maxCount = count;
				}
				objectedItems.push({ facet: facet, count: count });
			}
			objectedItems.sort(function (a, b) {
				return a.facet < b.facet ? -1 : 1;
			});

			$(this.target).empty();
			for ( i = 0, l = objectedItems.length; i < l; i++) {
				size = parseInt(objectedItems[i].count / maxCount * 10, 10);
				$(this.target).append(this._renderItem(objectedItems[i],size));
			}


			if(EUMSSI.demoMode){
				tabPosition = this.$target.parents(".ui-tabs-panel").data("tabpos");
				if(this.$tabs.tabs( "option", "active") === tabPosition) {
					this._getThumbnails(objectedItems);
				} else {
					this.$tabs.off("tabsactivate.tagcloudwidget");
					this.$tabs.on("tabsactivate.tagcloudwidget", this._tabChange.bind(this, objectedItems));
				}
			} else {
				this._renderIfWidgetActivated(objectedItems);
			}

		},

		_renderIfWidgetActivated : function(objectedItems){
			if(this.$target.closest(".widget-placeholder").hasClass("active-widget")){
				this._getThumbnails(objectedItems);
			} else {
				EUMSSI.EventManager.off("activatewidget:people");
				EUMSSI.EventManager.on("activatewidget:people", function(){
					EUMSSI.EventManager.off("activatewidget:people");
					this._getThumbnails(objectedItems);
				}.bind(this));
			}
		},

		/**
		 * Check if the current open tab is this widget tab and then load the thumbnails
		 * @param objectedItems
		 * @private
		 */
		_tabChange: function(objectedItems){
			var tabPosition = this.$target.parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this.$tabs.off("tabsactivate.tagcloudwidget");
				this._getThumbnails(objectedItems);
			}
		},

		/**
		 * Load the faceting names Images from wikipedia
		 * @param objectedItems
		 * @private
		 */
		_getThumbnails: function(objectedItems){
			if (objectedItems.length > 0) {
				this.manager._showLoader();
				UTIL.getWikipediaImages(_.pluck(objectedItems, "facet"))
					.done(this._getWikipediaImages_success.bind(this));
			} else {
				this._renderEmpty();
			}
		},

		/**
		 * Create the html code for an item

		 * @param {Number} size - importance of the item in the tagcloud
		 * @returns {JQuery}
		 * @private
		 */
		_renderItem: function(item,size) {
			//var url = "http://wikipedia.org/wiki/" + item.facet;
			return $('<a class="tagcloud_item"></a>')
				//.html(item.facet.replace(/_/g,"&nbsp;")) // Text
				.addClass('tagcloud_size_' + size)
				.attr('data-id',item.facet)
				.click(UTIL.openPeopleActionsMenu.bind(this,item.facet));
		},

		/**
		 * Success callback to retrieve the wikipedia Images.
		 * Render the images.
		 * @param response
		 * @private
		 */
		_getWikipediaImages_success: function(response){
			var tiled = false;
			if(response && response.query && response.query.pages) {
				_.each(response.query.pages, function(obj){
					var facetId = obj.title.replace(/ /g, "_");
					var $img = $("<img>").attr("title",obj.title);

					if (obj.thumbnail && obj.thumbnail.source) {
						$img.attr("src", obj.thumbnail.source);
					} else {
						$img.attr("src", "images/dummy.png");
					}
					//Replace the <a> text content with the <img>
					this.$target.find('a[data-id="' + facetId + '"]').html($img);
				}, this);

				this._onAllImagesReady(this.$target.find("img"), function(){
					if(!tiled){
						tiled = true;
						if(this.$target.data("FreetileData")){
							this._refreshFreeTile();
						} else {
							this._initFreeTile();
						}
						this.manager._hideLoader();
					}
				}.bind(this));
			}
		},

		/**
		 * Check if all <img> tags has been loaded, and fires the handler
		 * @param {JQuery} selector - Selection of al the <img> tags to be checked
		 * @param {Function} handler - callback
		 * @private
		 */
		_onAllImagesReady: function (selector, handler) {
			var list = typeof selector === 'string' ? $(selector) : selector;

			list.each(function(index, element) {
				$(element).one('load', function() {
					if (checkListComplete(list)) {
						handler.call(this);
					}
				});
			});

			function checkListComplete() {
				return _.every(list, function(element){
					return (element.complete) ? true : false;
				});
			}
		},

		/**
		 * Init the freetile Widget to display more "pretty" the images
		 * @private
		 */
		_initFreeTile: function(){
			//Init freetile
			this.$target.freetile({
				containerAnimate: true
			});
			//Bind Event
			if(EUMSSI.demoMode){
				var tabPosition = this.$target.parents(".ui-tabs-panel").data("tabpos");
				//Bind refresh when change to the tab
				this.$tabs.on( "tabsactivate", function(){
					if( this.$tabs.tabs( "option", "active") === tabPosition && this.$target.data("FreetileData") ) {
						this._refreshFreeTile();
					}
				}.bind(this));
			} else {
				EUMSSI.EventManager.on("leftside", this._refreshFreeTile.bind(this));
			}
		},

		/**
		 * Reorganize the images
		 * @private
		 */
		_refreshFreeTile: function(){
			this.$target.freetile("layout");
		},

		_renderEmpty: function(){
			var emptyMSG = $("<h3>").text("No People found on the current search...");
			this.$target.html(emptyMSG);
			this.manager._hideLoader();
		}

	});

})(jQuery);

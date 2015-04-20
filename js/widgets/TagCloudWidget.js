(function ($) {

	AjaxSolr.TagcloudWidget = AjaxSolr.AbstractFacetWidget.extend({

		init: function() {
			this.$target = $(this.target);
			this.$tabs = this.$target.parents(".tabs-container");
		},

		afterRequest: function () {
			if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
				$(this.target).html('no items found in current selection');
				return;
			}

			var maxCount = 0;
			var objectedItems = [];
			for (var facet in this.manager.response.facet_counts.facet_fields[this.field]) {
				var count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);
				if (count > maxCount) {
					maxCount = count;
				}
				objectedItems.push({ facet: facet, count: count });
			}
			objectedItems.sort(function (a, b) {
				return a.facet < b.facet ? -1 : 1;
			});

			$(this.target).empty();
			for (var i = 0, l = objectedItems.length; i < l; i++) {
				var size = parseInt(objectedItems[i].count / maxCount * 10);
				$(this.target).append(this._renderItem(objectedItems[i],size));
			}

			// Get the Thumbnails
			if(this.$tabs.tabs( "option", "active") === 2) {
				this._getWikipediaImages(objectedItems);
			} else {
				this.$tabs.off( "tabsactivate", tabChange );
				this.$tabs.on( "tabsactivate", tabChange );
			}

			var self = this;
			function tabChange( event , ui ) {
				if($(this).tabs( "option", "active") === 2){
					$(this).off("tabsactivate", tabChange );
					self._getWikipediaImages(objectedItems);
				}
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
				.click(this._openActionsMenu.bind(this,item.facet));
		},

		/**
		 * Get images from the wikipedia
		 * example: "http://en.wikipedia.org/w/api.php?action=query&titles=Barack_Obama|Muhammad|John_Kerry&prop=pageimages&format=json&pithumbsize=150&pilimit=50"
		 * apache.conf proxy: ProxyPass /wikiBridge http://en.wikipedia.org/
		 * @param {Object} facetes - object that contains the data
		 * @private
		 */
		_getWikipediaImages: function(facetes){
			var urlRoot = "http://eumssi.cloudapp.net/wikiBridge/w/api.php?",
				urlParams = [];

			urlParams.push("action=query");
			urlParams.push("prop=pageimages");
			urlParams.push("titles="+_.pluck(facetes,"facet").join("|"));
			urlParams.push("format=json");
			urlParams.push("pithumbsize=280");
			urlParams.push("pilimit=50");

			this.manager._showLoader();
			$.ajax({
				url: urlRoot + urlParams.join("&"),
				success: this._getWikipediaImages_success.bind(this)
			});
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
			this.$target.freetile({
				containerAnimate: true
			});

			//Bind refresh when change to the tab
			this.$tabs.on( "tabsactivate", organizeLayout.bind(this) );
			function organizeLayout(){
				if( this.$tabs.tabs( "option", "active") === 2 && this.$target.data("FreetileData") ) {
					this._refreshFreeTile();
				}
			}
		},

		/**
		 * Reorganize the images
		 * @private
		 */
		_refreshFreeTile: function(){
			this.$target.freetile("layout");
		},

		/**
		 * When click on a photo display a menu to perform some actions.
		 * @param {String} facetName - name of the item
		 * @private
		 */
		_openActionsMenu: function(facetName){
			var $menu = $('<ul class="click-menu">');
			$menu.append('<div class="ui-widget-header">'+facetName.replace(/_/g,"&nbsp;")+'</div>');
			$menu.append('<li class="open-wikipedia"><span class="ui-icon ui-icon-newwin"></span>Open Wikipedia page</li>');
			$menu.append('<li class="open-dbpedia"><span class="ui-icon ui-icon-newwin"></span>Open DBpedia page</li>');

			$("body").append($menu);
			$menu.menu({
				position: { my: "left top", at: "left+"+window.mouse_x + " top+" + window.mouse_y, of:"window"}
			});

			$menu.css("left",window.mouse_x - 10);
			$menu.css("top",window.mouse_y - 10);

			$menu.on("click",".open-wikipedia",this._openNewPage.bind(this,"http://wikipedia.org/wiki/"+facetName));
			$menu.on("click",".open-dbpedia",this._openNewPage.bind(this,"http://dbpedia.org/resource/"+facetName));

			function removeMenu(){
				$menu.remove();
			}
			$menu.on("click mouseleave",removeMenu);

		},

		/**
		 * Open link on a new page
		 * @param {Strin} url - the link
		 * @private
		 */
		_openNewPage: function(url){
			window.open(url,"_blank");
		}

	});

})(jQuery);

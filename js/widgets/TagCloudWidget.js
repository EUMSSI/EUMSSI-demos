(function ($) {

	AjaxSolr.TagcloudWidget = AjaxSolr.AbstractFacetWidget.extend({

		init: function() {
			this.$target = $(this.target);
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
				$(this.target).append(this.renderItem(objectedItems[i],size));
			}

			var self = this;
			// Get the Thumbnails
			if(this.$target.parents(".tabs-container").tabs( "option", "active") === 2) {
				this.getWikipediaImages(objectedItems);
			} else {
				this.$target.parents(".tabs-container").off( "tabsactivate" );
				this.$target.parents(".tabs-container").on( "tabsactivate", tabChange );
			}

			function tabChange( event, ui ) {
				if($(this).tabs( "option", "active") === 2){
					$(this).off("tabsactivate", tabChange );
					self.getWikipediaImages(objectedItems);
				}
			}

		},

		renderItem: function(item,size) {
			var url = "http://wikipedia.org/wiki/" + item.facet;
			return $('<a href="'+url+'" target="_blank" class="tagcloud_item"></a>')
				//.html(item.facet.replace(/_/g,"&nbsp;")) // Text
				.addClass('tagcloud_size_' + size)
				.attr('data-id',item.facet);
		},

		/**
		 * Get images from the wikipedia
		 * example: "http://en.wikipedia.org/w/api.php?action=query&titles=Barack_Obama|Muhammad|John_Kerry&prop=pageimages&format=json&pithumbsize=150&pilimit=50"
		 * apache.conf proxy: ProxyPass /wikiBridge http://en.wikipedia.org/
		 *
		 */
		getWikipediaImages: function(facetes){
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
				success: this.getWikipediaImages_success.bind(this)
			});
		},

		getWikipediaImages_success: function(response){
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

				this.onAllImagesReady(this.$target.find("img"), function(){
					if(!tiled){
						tiled = true;
						this.$target.freetile({
							containerAnimate: true
						});
						this.manager._hideLoader();
					}
				}.bind(this));
			}
		},


		onAllImagesReady: function (selector, handler) {
			var list = typeof selector === 'string' ? $(selector) : selector;

			list.each(function(index, element) {
				$(element).one('load', fireHandler);
			});

			function fireHandler() {
				if (checkListComplete(list)) {
					handler.call(this);
				}
			}

			function checkListComplete() {
				return _.every(list, function(element){
					return (element.complete) ? true : false;
				});
			}
		}

	});

})(jQuery);

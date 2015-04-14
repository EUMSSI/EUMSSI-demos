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

			//Try get the Thumbnails
			this.getWikipediaImages(objectedItems);
		},

		renderItem: function(item,size) {
			var url = "http://wikipedia.org/wiki/" + item.facet;
			return $('<a href="'+url+'" target="_blank" class="tagcloud_item"></a>')
				.html(item.facet.replace(/_/g,"&nbsp;"))
				.addClass('tagcloud_size_' + size)
				.attr('data-id',item.facet);
				//.click(this.clickHandler.bind(this,item.facet));
		},

/*
		clickHandler: function(facet){
			//var url = "http://dbpedia.org/resource/" + facet;
			var url = "http://wikipedia.org/wiki/" + facet;
			window.open(url,'_blank');
		},
*/

		/**
		 * Get images from the wikipedia
		 * example: "http://en.wikipedia.org/w/api.php?action=query&titles=Barack_Obama|Muhammad|John_Kerry&prop=pageimages&format=json&pithumbsize=150&pilimit=50"
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

			$.ajax({
				url: urlRoot + urlParams.join("&"),
				success: this.getWikipediaImages_success.bind(this)
			});
		},

		getWikipediaImages_success: function(response){
			if(response && response.query && response.query.pages) {
				_.each(response.query.pages, function(obj){
					if (obj.thumbnail && obj.thumbnail.source) {
						var facetId = obj.title.replace(/ /g, "_");
						var $img = $("<img>").attr("src", obj.thumbnail.source);
						this.$target.find("a[data-id='" + facetId + "']")//.attr('width',obj.thumbnail.width)
							//.attr('height',obj.thumbnail.height)
							//.attr('style',"left: 0px; top: 0px; width: 250px; height: 125px; overflow: hidden;")
							.html($img);
					}
				}, this);


				this.onImagesReady(this.$target.find("img"), handler);

				function handler() {
					console.log("Images Loaded.")
					$(this).parents(".tagCloud-placeholder").freetile({
						//animate: true,
						//elementDelay: 1,
						containerAnimate: true
					});
				}

			}
		},


		onImagesReady: function (selector, handler) {
			var list = typeof selector === 'string' ? $(selector) : selector;

			list.each(function(index, element) {
				$(element).bind('load', fireHandler);
			});

			function fireHandler() {
				$(this).unbind('load', fireHandler );
				if (checkListComplete(list)) {
					// Call the handler
					handler.call(this);
				}
			}

			function checkListComplete() {
				list.each(function(index, element){
					if (!element.complete){
						return false;
					}
				});
				return true;
			}
		}

	});

})(jQuery);

/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL */
(function ($) {

	AjaxSolr.SelectVideoQualityWidget = AjaxSolr.AbstractTextWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function () {
			var $select,self = this;
			this.storedValue = "";

			$select = $("<select>").addClass("videoQualitySelector");
			$select.append($('<option value="" selected="selected">All</option>'));
			$select.append($('<option value="any">Any Quality</option>'));					// Has a video in any quality
			//$select.append($('<option value="low">Low Quality</option>'));		// Has a video only in Medium quality
			$select.append($('<option value="hd" >HD Quality</option>'));					// Has a video in High quality
			$select.append($('<option value="youtube">YouTube</option>'));			// Has a video in Youtube
			//Set Initial Filter
			this.setFilter("");

			$(this.target).append($select);

			// Event - Click Button Search
			$select.change(function(event){
				var value = $(event.target).val();
				if(value){
					self.setFilter(value);
				} else {
					self.clearFilter();
				}
				self.doRequest();
			});
		},

		/**
		 * Sets the main Solr query to the given string.
		 * @param {String} value the value for the filter.
		 */
		setFilter: function (value) {
			var filterQuery = "",
				filterText = "Video Quality: ";

			switch(value){
				case "any" :
					filterQuery = "meta.source.httpHigh:* OR meta.source.httpMedium:*";
					filterText += "Any";
					break;
				//case "low" :
				//	filterQuery = "meta.source.httpMedium:* NOT meta.source.httpHigh:*";
				//	break;
				case "hd" :
					filterQuery = "meta.source.httpHigh:*";
					filterText += "HD";
					break;
				case "youtube" :
					filterQuery = "meta.source.httpHigh:* AND meta.source.youtubeVideoID:*";
					filterText += "Youtube Only";
					break;
				default : break;
			}

			//Remove previous Value
			this.clearFilter();

			if(filterQuery != ""){
				//Set the current Filter
				this.storedValue = filterQuery;
				EUMSSI.FilterManager.addFilter("videoQuality", filterQuery, this.id, filterText);
			}

		},

		/**
		 * Sets the main Solr query to the empty string.
		 */
		clearFilter: function () {
			EUMSSI.FilterManager.removeFilterByWidget(this.id);
		}

	});

})(jQuery);

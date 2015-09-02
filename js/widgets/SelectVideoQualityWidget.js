/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL */
(function ($) {

	AjaxSolr.SelectVideoQualityWidget = AjaxSolr.AbstractTextWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function () {
			var $select,self = this;
			this.storedValue = "";

			$select = $("<select>").addClass("videoQualitySelector");
			$select.append($('<option value="" selected="selected">Video no required</option>'));
			$select.append($('<option value="allvideo">Any quality</option>'));			// Has a video in any quality
			//$select.append($('<option value="low">Low Quality</option>'));		// Has a video only in Medium quality
			$select.append($('<option value="hd">HD quality</option>'));				// Has a video in High quality
			$select.append($('<option value="youtube">YouTube</option>'));			// Has a video in Youtube
			//$select.append($('<option value="twitter">Twitter</option>'));			// Has a tweet
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

			// BIND event filterChange
			EUMSSI.EventManager.on("filterChange:sourceType", this._manageFilterChange.bind(this));
		},

		/**
		 * Sets the main Solr query to the given string.
		 * @param {String} value the value for the filter.
		 */
		setFilter: function (value) {
			var filterQuery = "",
				filterText = "Video Quality: ";

			switch(value){
				case "allvideo" :
					filterQuery = "meta.source.httpHigh:* OR meta.source.httpMedium:*";
					filterText += "Any quality";
					break;
				//case "low" :
				//	filterQuery = "meta.source.httpMedium:* NOT meta.source.httpHigh:*";
				//	break;
				case "hd" :
					filterQuery = "meta.source.httpHigh:*";
					filterText += "HD quality";
					break;
				case "youtube" :
					filterQuery = "meta.source.httpHigh:* AND meta.source.youtubeVideoID:*";
					filterText += "Youtube only";
					break;
				//case "twitter" :
				//	filterQuery = "meta.source.tweetId:*";
				//	filterText += "Twitter Only";
				//	break;
				default : break;
			}

			//Remove previous Value
			this.clearFilter(true);

			if(filterQuery != ""){
				//Set the current Filter
				this.storedValue = filterQuery;
				EUMSSI.FilterManager.addFilter("sourceType", filterQuery, this.id, filterText);
			}

		},

		/**
		 * Sets the main Solr query to the empty string.
		 * @param {Boolean} [silent] true, if don't want to trigger the change event
		 */
		clearFilter: function (silent) {
			EUMSSI.FilterManager.removeFilterByWidget(this.id,silent);
		},

		_manageFilterChange: function(){
			if(!EUMSSI.FilterManager.checkFilterByName("sourceType")){
				$(this.target).find("select").val("");
			}
		}

	});

})(jQuery);

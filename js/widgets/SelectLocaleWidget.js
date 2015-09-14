/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL */
(function ($) {

	AjaxSolr.SelectLocaleWidget = AjaxSolr.AbstractTextWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function () {
			var $select,self = this;
			this.storedValue = "";

			$select = $("<select>").addClass("localeSelector");
			$select.append($('<option value="" selected="selected">All</option>'));
			$select.append($('<option value="en">English</option>'));
			$select.append($('<option value="de">German</option>'));
			$select.append($('<option value="fr">French</option>'));
			$select.append($('<option value="es">Spanish</option>'));
			//$select.append($('<option value="others">Others</option>'));

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
			EUMSSI.EventManager.on("filterChange:"+this.attributeName, this._manageFilterChange.bind(this));
		},

		/**
		 * Sets the main Solr query to the given string.
		 * @param {String} value the value for the filter.
		 */
		setFilter: function (value) {
			var prefix = "",
				filterText = "Locale: ";

			//Manage others response
			//if(value == "others"){
			//	value = "(en,de,es,fr)";
			//	prefix = "-"; // Filter for remove
			//	filterText += "Not (en,de,es,fr)";
			//} else {
			//	filterText += value;
			//}

			switch(value){
				case "en":	filterText += "English";
					break;
				case "de":	filterText += "German";
					break;
				case "fr":	filterText += "French";
					break;
				case "es":	filterText += "Spanish";
					break;
				default : filterText += value;
			}

			//Remove previous Value
			this.clearFilter(true);
			//Set the current Filter
			this.storedValue = prefix + this.attributeName + ":" + AjaxSolr.Parameter.escapeValue(value);
			EUMSSI.FilterManager.addFilter(this.attributeName, this.storedValue, this.id, filterText);
		},

		/**
		 * Sets the main Solr query to the empty string.
		 * @param {Boolean} [silent] true, if don't want to trigger the change event
		 */
		clearFilter: function (silent) {
			EUMSSI.FilterManager.removeFilterByWidget(this.id,silent);

		},

		_manageFilterChange: function(){
			if(!EUMSSI.FilterManager.checkFilterByName(this.attributeName)){
				$(this.target).find("select").val("");
			}
		}

	});

})(jQuery);

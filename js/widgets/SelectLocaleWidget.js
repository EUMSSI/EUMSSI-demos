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
			$select.append($('<option value="others">Others</option>'));

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
			var prefix = "";

			//Manage others response
			if(value == "others"){
				value = "(en,de,es,fr)";
				prefix = "-"; // Filter for remove
			}

			//Remove previous Value
			this.clearFilter();
			//Set the current Filter
			this.storedValue = prefix + this.attributeName + ":" + AjaxSolr.Parameter.escapeValue(value);

			//this.manager.store.addByValue('fq',this.storedValue);
			this.manager.addFilter(this.attributeName, this.storedValue, this.id);

		},

		/**
		 * Sets the main Solr query to the empty string.
		 */
		clearFilter: function () {

			//this.manager.store.removeByValue('fq',this.storedValue);
			this.manager.removeFilterByWidget(this.id);

		}

	});

})(jQuery);

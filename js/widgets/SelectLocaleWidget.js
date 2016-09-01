/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL */
(function ($) {

	AjaxSolr.SelectLocaleWidget = AjaxSolr.AbstractTextWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function () {
			this.storedValue = "";
			var $english = this._createCheckbox("English", "en");
			var $german = this._createCheckbox("German", "de");
			var $french = this._createCheckbox("French", "fr");
			var $spanish = this._createCheckbox("Spanish", "es");
			$(this.target).append([$english, $german, $french, $spanish]);
			$(".localeSelector").change(function(){
				var $inputs = $(".localeSelector");
				var selecteds = [];
				$.each($inputs, function(index, value) {
					var $input = $(value);
					if ($input.is(":checked")) {
						selecteds.push($input.val());
					}
				});
				this.setFilters(selecteds);
				this.doRequest();
			}.bind(this));
			EUMSSI.EventManager.on("filterChange:"+this.attributeName, this._manageFilterChange.bind(this));
		},

		_createCheckbox: function(txt, value) {
			var uuid = this.createGuid();
			var $label = $("<label>", {"for": uuid, "class": "label-locale-selector"}).text(txt);
			var $input = $("<input>", {
				"type": "checkbox",
				"class": "localeSelector",
				"value": value,
				"id": uuid
			});
			return $("<p>").append([$input, $label]);
		},

		createGuid: function() {
			return 'Label-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
		},

		setFilters: function(values) {
			var prefix = "";
			EUMSSI.FilterManager.removeFilterByName(this.attributeName, this.id, false);
			values.forEach(function(value) {
				var filterText = "Locale: ";
				filterText += this._getFilterText(value);
				this.storedValue = prefix + this.attributeName + ":" + AjaxSolr.Parameter.escapeValue(value);
				EUMSSI.FilterManager.addFilter(this.attributeName, this.storedValue, this.id, filterText);
			}.bind(this));
		},

		_getFilterText: function(value) {
			switch (value) {
				case "en":
					return "English";
				case "de":
					return "German";
				case "fr":
					return "French";
				case "es":
					return "Spanish";
				default :
					return value;
			}
		}, 
		
		/**
		 * Sets the main Solr query to the given string.
		 * @param {String} value the value for the filter.
		 */
		setFilter: function (value) {
			var prefix = "",
				filterText = "Locale: ";
			filterText += this._getFilterText(value);
			this.clearFilter(true);
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

/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL */
(function ($) {

	/**
	 * Widget that create a text Input that adds filter to the query.
	 *
	 * @param {String} id
	 * @param {String} target - the html id or class to be placed ej:"#myInput"
	 * @param {String} attributeName - the attribute in the solr to search
	 * @param {String} label - Label for the input
	 * @param {Boolean} buttonEnabled - true if want to show a search btn next to the input
	 * @param {Boolean} showInResultCheck - true if want to show a checkbox to show this attribute on the results
	 * @augments AjaxSolr.AbstractTextWidget
	 */
	AjaxSolr.TextWidget = AjaxSolr.AbstractTextWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function () {
			var $label, $button, $checkbox, checkboxID, self = this;
			this.$target = $(this.target);

			// Render label for the input (if exist)
			if(this.label){
				$label = $("<h2>").text(this.label);
				this.$target.append($label);
			}

			// Render <input> field
			this.$input = $("<input type='text'>").addClass("text-widget-input");
			this.$target.append(this.$input);

			// Event - Blur : Change the value for the current filter
			this.$input.blur( function(e) {
				var value = $(this).val();
				if (value) {
					self.setFilter(self.attributeName, value);
				} else {
					self.clearFilter();
				}
			});

			// Event - KeyDown : Forces Blur (refresh filter) and perform a Request
			this.$input.bind('keydown', function(e) {
				if (e.which == $.ui.keyCode.ENTER) {
					self.$input.blur();
					self.doRequest();
				}
			});

			// Render <button>
			if(this.buttonEnabled){
				$button = $("<button>").text("Search");
				// Event - Click Button Search
				$button.click(function(e){
					self.doRequest();
				});
				this.$target.append($button);
			}

			// Render Checkbox show in result
			if(this.showInResultCheck){
				checkboxID = "guid-"+$.guid++;
				$checkbox = $("<div class='ui-checkbox-container'>")
					.append($("<input type='checkbox' class='ui-checkbox-input' title='Show in results'> ").prop("id",checkboxID).prop("checked",true))
					.append($("<label class='ui-checkbox-label'>").text("Show in results").prop("for",checkboxID));
				$checkbox.find("input").change(function(e){
					if(e.target.checked){
						this.manager.widgets["result"].enableDynamicAttributeRender(this.attributeName);
					} else {
						this.manager.widgets["result"].disableDynamicAttributeRender(this.attributeName);
					}
				}.bind(this));

				this.$target.find(".text-widget-input").after($("<br>"),$checkbox);
			}
		},

		/**Sets the main Solr query to the given string.
		 * @param {String} attributeName The name of the filter key.
		 * @param {String} value the value for the filter.
		 */
		setFilter: function (attributeName, value) {
			//Remove previous Value
			this.clearFilter();
			//Set the current Filter
			this.storedValue = attributeName + ":" + AjaxSolr.Parameter.escapeValue(value);

			//this.manager.store.addByValue('fq', this.storedValue);
			this.manager.addFilter(this.attributeName, this.storedValue, this.id);

		},

		/**
		 * Sets the main Solr query to the empty string.
		 */
		clearFilter: function () {

			//this.manager.store.removeByValue('fq',this.storedValue);
			this.manager.removeFilterByName(this.attributeName);

		}

	});

})(jQuery);

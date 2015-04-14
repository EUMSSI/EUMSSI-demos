(function($){

	AjaxSolr.TagFacetWidget = AjaxSolr.AbstractFacetWidget.extend({

		start:0,	//Reset the pagination with doRequest on this Widget

		init: function(){
			//Add the attribute of the TagSelector to the renderer
			this.manager.widgets["result"].addDynamicAttribute(this.field, this.label, true);

			this.$target = $(this.target);

			// Render label for the input (if exist)
			if(this.label){
				var $label = $("<h2>").text(this.label);
				this.$target.before($label);
			}
		},

		beforeRequest: function() {
			if(!this.flag_TagFacetRequest) {
				//Clean FQ - if the call don't activate the holdFacetNames
				this.manager.store.removeByValue('fq', this._lastfq);
			}
		},

		afterRequest: function(){
			if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
				this.$target.html('no items found in current selection');
				return;
			}

			var objectedItems = [];
			for (var facet in this.manager.response.facet_counts.facet_fields[this.field]) {
				var count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);
				objectedItems.push({facet: facet, count: count});
			}
			objectedItems.sort(function(a, b){
				return a.count < b.count ? 1 : -1;
			});

			// Render or Update
			if(this.flag_TagFacetRequest) {
				this._updateRender(objectedItems);
			} else {
				this._render(objectedItems);
			}

			//Reset the holdFacetNames
			this.flag_TagFacetRequest = false;
		},

		/**
		 * Updates the number of the Already rendered Facets
		 * @param {Array<Object>} items - [{facet:"",count:""},...]
		 * @private
		 */
		_updateRender : function(items){
			//Clean the items count
			this.$target.find(".ui-checkbox-container .tagfacet-item-count").html("");
			for (var i = 0; i < items.length ; i++) {
				this.$target.find(".ui-checkbox-container."+items[i].facet+" .tagfacet-item-count").text("("+ items[i].count +")");
			}
		},

		/**
		 * Clean & Render the Facets List
		 * @param {Array<Object>} items - [{facet:"",count:""},...]
		 * @private
		 */
		_render: function(items) {
			this.$target.empty();

			for (var i = 0; i < items.length  ; i++) {
				var facet = items[i].facet;
				var count = items[i].count;
				var checkboxID = "guid-"+$.guid++;

				var $checkboxContainer = $("<div class='ui-checkbox-container'>")
				$checkboxContainer.addClass(facet);
				$checkboxContainer.append($("<input type='checkbox'>").prop("data-value",facet).prop("id",checkboxID));
				$checkboxContainer.append($('<label class="tagfacet-item"></label>').html( facet +"<span class='tagfacet-item-count'> ("+count+")</span>").prop("for",checkboxID));
				$checkboxContainer.append($("<br>"));

				//Bind Event
				$checkboxContainer.find("input").click(this._onClickCheckbox.bind(this));

				this.$target.append($checkboxContainer);

			}
		},

		/**
		 * When Select/Unselect a facet get the current filter query and perform a request
		 * @param {jQuery:event} e
		 * @private
		 */
		_onClickCheckbox: function(e){
			//Clean FQ
			this.manager.store.removeByValue('fq', this._lastfq);

			var checkedKeys = [];
			this.$target.find("input[type='checkbox']").each(function(i, it){
				if( it.checked ){
					checkedKeys.push($(it).prop("data-value"));
				}
			});

			if(checkedKeys.length > 0){
				//Add FQ
				this._lastfq = this.field + ":(" + checkedKeys.join(" OR ") + ")";
				this.manager.store.addByValue('fq', this._lastfq);
				this.flag_TagFacetRequest = true;
			}
			this.doRequest();

		}
	});

})(jQuery);

/*global jQuery, $, _, AjaxSolr, EUMSSI, CONF, UTIL */
(function($){

	/**
	 * Widget that creates a list of checkboxes with the {field} facet.
	 * id: "source" - The identificator of the Widget, used to manage the filters.
	 * label: "Source" - Text for the title.
	 * target: {string }'.source-placeholder' - The query for jQuery to find the placeholder
	 * field: {string} "source" - The Solr field
	 * persistentFilter {Boolean} [false] - If true, the selected facet facets for the filter won't be clear on new request.
	 */
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

			//Manage the facet.mincount on persistent mode
			if(this.persistentFilter){
				var paramName = 'f.' + CONF.SOURCE_FIELD_NAME + '.facet.mincount';
				EUMSSI.Manager.store.remove(paramName);
				EUMSSI.Manager.store.addByValue('f.' + CONF.SOURCE_FIELD_NAME + '.facet.mincount', 0);
			}

			//Recalculate height when filter change (Only visual behaivor)
			EUMSSI.EventManager.on("filterChange",this._recalculateHeight.bind(this));
			EUMSSI.EventManager.on("filterChange:"+this.field, this._manageFilterChange.bind(this));
		},

		beforeRequest: function() {
			if(!this.persistentFilter && !this.flag_TagFacetRequest && !this.manager.flag_PaginationRequest) {
				//Clean FQ - if the call don't activate the holdFacetNames
				EUMSSI.FilterManager.removeFilterByWidget(this.id);
			}
		},

		afterRequest: function(){
			//Pagination reguest don't refresh the Faceting
			if(this.manager.flag_PaginationRequest){
				return;
			}

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
			if( (this.persistentFilter && this._rendered) || this.flag_TagFacetRequest) {
				this._updateRender(objectedItems);
			} else {
				this._render(objectedItems);
				this._rendered = true;
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

			var checkedKeys = this._getCheckedKeys();
			for (var i = 0; i < items.length ; i++) {
				if( !this.persistentFilter || checkedKeys.length === 0 || items[i].count > 0 || checkedKeys.indexOf(items[i].facet) >= 0 ){
					this.$target.find(".ui-checkbox-container[data-facet='"+items[i].facet+"'] .tagfacet-item-count").text("("+ items[i].count +")");
				} else {
					this.$target.find(".ui-checkbox-container[data-facet='"+items[i].facet+"'] .tagfacet-item-count").text("");
				}
			}
		},

		/**
		 * Clean & Render the Facets List
		 * @param {Array<Object>} items - [{facet:"",count:""},...]
		 * @private
		 */
		_render: function(items) {
			this.$target.empty();

			//Sort items by name
			items = _.sortBy(items,function(obj){ return obj.facet; });

			for (var i = 0; i < items.length  ; i++) {
				var facet = items[i].facet;
				var count = items[i].count;
				var checkboxID = "guid-"+$.guid++;

				var $checkboxContainer = $("<div class='ui-checkbox-container source-checkbox-container'>");
				$checkboxContainer.attr("data-facet",facet);
				$checkboxContainer.append($("<input type='checkbox'>").prop("data-value",facet).prop("id",checkboxID));
				$checkboxContainer.append($('<label class="tagfacet-item"></label>').html( facet +"<span class='tagfacet-item-count'> ("+count+")</span>").prop("for",checkboxID));
				$checkboxContainer.append($("<br>"));

				//Bind Event
				$checkboxContainer.find("input").click(this._onClickCheckbox.bind(this));

				this.$target.append($checkboxContainer);
			}

			//Force recalculate height
			this._recalculateHeight();
		},

		/**
		 * Calculate and set to this widget the remaining space of his parent on height
		 * @private
		 */
		_recalculateHeight: function(){
			var siblings = this.$target.siblings();
			var height = 10;
			siblings.each(function(){
				height += $(this).outerHeight(true);
			});
			this.$target.css("height", "calc(100% - "+height+"px)");
		},

		_manageFilterChange:function(){
			if(!EUMSSI.FilterManager.checkFilterByWidgetId(this.id)){
				this._unselectAll();
			}
		},

		/**
		 * Unselect visually all the checkboxes
		 * @private
		 */
		_unselectAll: function(){
			this.$target.find("input[type=checkbox]").prop("checked","");
		},

		/**
		 * Obtain the checked items
		 * @returns {Array} the keys of the checked items
		 * @private
		 */
		_getCheckedKeys : function(){
			var checkedKeys = [];
			this.$target.find("input[type='checkbox']").each(function(i, it){
				if( it.checked ){
					checkedKeys.push($(it).prop("data-value"));
				}
			});
			return checkedKeys;
		},

		/**
		 * When Select/Unselect a facet get the current filter query and perform a request
		 * @param {jQuery:event} e
		 * @private
		 */
		_onClickCheckbox: function(e){
			var checkedKeys = this._getCheckedKeys();
			if(checkedKeys.length > 0){
				//Add FQ
				this._lastfq = this.field + ':("' + checkedKeys.join('" OR "') + '")';
				EUMSSI.FilterManager.removeFilterByWidget(this.id, true);
				EUMSSI.FilterManager.addFilter(this.field, this._lastfq, this.id);

				this.flag_TagFacetRequest = true;
			} else {
				EUMSSI.FilterManager.removeFilterByWidget(this.id);
			}
			this.doRequest();
		},

		/**
		 * Check if the given key is currently active, that means if it's checked or if all are unchecked.
		 * @param {string} keyName - key
		 */
		isKeyActive: function(keyName){
			var checkedKeys = this._getCheckedKeys();
			return !(checkedKeys.length > 0 && _.indexOf(checkedKeys,keyName) === -1);
		}

	});

})(jQuery);

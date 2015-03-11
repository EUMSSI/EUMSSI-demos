(function ($) {

	/**
	 * This widget manages the creation of Search Fields
	 *
	 * @param {String} id - 'filterManager',
	 * @param {String} target - '#generated-filters',
	 * @param {String} targetButton - "#btn-do-add-filter",
	 * @param {Array<Object>} preload - [{key,label,showInResultCheck}]
	 */
	AjaxSolr.FilterManagerWidget = AjaxSolr.AbstractWidget.extend({
		start: 0,
		addedIDs: [],

		init: function () {

			//Set button action that opens the Filter Manager Pop-up
			$(this.targetButton).click(this._addFilterDialog.bind(this));

			//pre-load Initial Items
			var i;
			for( i = 0 ; this.preload && i < this.preload.length ; i++) {
				this._addNewFilter(this.preload[i].key, this.preload[i].label, true, this.preload[i].showInResultCheck);
			}
		},

		_addFilterDialog : function(){
			var fieldKey, fieldLabel, $dialog, self=this;

			//Dialog with the input Data
			$dialog = $('<div class="dialog-new-filter">' +
			'<p><label>Search Key*</label><input type="text" class="searchKey"></p>' +
			'<p><label>Label*</label><input type="text" class="searchLabel"></p></div>');

			$dialog.dialog({
				title: "Add new Search filter",
				width: 450,
				resizable: false,
				modal: true,
				buttons: {
					"Add": function(){
						fieldKey = $dialog.find("input.searchKey").val();
						fieldLabel = $dialog.find("input.searchLabel").val();
						// Improve Validation
						if(fieldKey && fieldLabel){
							self._addNewFilter(fieldKey, fieldLabel, false, true);
							$(this).dialog("close");
						}
					},
					"Cancel": function(){
						$(this).dialog("close");
					}
				},
				open : function(e){
					// Click "Add" when press ENTER
					$(this).bind('keydown', function(e) {
						if (e.which == $.ui.keyCode.ENTER) {
							e.preventDefault(); // Fix problem that re-opens the dialog
							$(this).parent().find(".ui-dialog-buttonset button:eq(0)").trigger("click");
						}
					});
				},
				close: function(){
					$(this).dialog('destroy').remove();
				}
			});
			$dialog.dialog("option", "position", {my:"center", at:"center", of:window});
		},

		_addNewFilter : function(key, label, preloaded, showInResultCheck){
			var $removeButton, x,
				genKey = "generated-"+key.replace(/\s/g,"").replace(/\./g,"-"), //Change "." into "-" avoid problems with target selector
				$container = $("<div>").prop("id",genKey).addClass("filter-container");

			//Avoid duplicates
			for(x in this.addedIDs){
				if(this.addedIDs[x] === genKey) {
					alert("Key Already Used");
					return true;
				}
			}
			this.addedIDs.push(genKey);

			$(this.target).append($container);


			if(showInResultCheck){
				// Add dynamicAttribute to the render
				this.manager.widgets["result"].addDynamicAttribute(key,label,showInResultCheck);
			}

			this.manager.addWidget(new AjaxSolr.TextWidget({
				id: genKey,
				target: "#"+genKey,
				attributeName: key,
				label: label,
				showInResultCheck: showInResultCheck
			}));
			// Manager is already initialized we need to init widget manually
			this.manager.widgets[genKey].init();

			// If the Filter is added manually, add a btn to remove it.
			if(!preloaded){
				$removeButton = $("<button class='btn-remove-filter'>").html($("<span class='ui-icon ui-icon-closethick'>"));
				$removeButton.prop("title","Remove the filter");
				$removeButton.click(this._removeFilterWidget.bind(this, genKey, key));
				$container.append($removeButton);
			}
		},

		_removeFilterWidget : function(genKey, key) {
			$("div#"+genKey).remove();
			if(this.manager.widgets[genKey]){
				this.manager.widgets[genKey].clearFilter();
				delete this.manager.widgets[genKey];
			}
			this.manager.widgets["result"].removeDynamicAttribute(key);
			this.addedIDs.pop(genKey);
		}

	});

})(jQuery);

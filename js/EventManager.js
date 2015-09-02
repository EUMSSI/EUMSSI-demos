/*global jQuery, $, _, AjaxSolr, EUMSSI*/
function EventManager(){
	this._bindingModel = $({});
	return this;
}

_.extend(EventManager.prototype, {

	/*
	 Allow jquery.fn.trigger function auto-trigger parent events.
	 The event names that have got the separator ":" will generate new events...
	 "filter:change:param" >> will trigger 3 events >> "filter" + "filter:change" + "filter:change:param"
	 */
	trigger: function(type, data){
		var i, typeArray, eventType;
		if(type){
			typeArray = type.split(":");
			for(i = 0 ; i < typeArray.length ; i++){
				eventType = typeArray.slice(0,i+1).join(":");
				this._bindingModel.trigger(eventType, data);
			}
		}
	},

	on: function(type, data, handler){
		this._bindingModel.on(type, data, handler);
	}

});
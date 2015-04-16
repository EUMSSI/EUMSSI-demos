
(function ($) {

	AjaxSolr.TimelineWidget = AjaxSolr.AbstractWidget.extend({
		start: 0,

		// Attributes that will be rendered in addition to the default info.
		dynamicAttributes: [],

		addDynamicAttribute : function(attrName,attrLabel,render) {
			var dynamicAttr = {
				key : attrName,
				label : attrLabel,
				render : render ? true : false
			};
			this.dynamicAttributes[attrName] = dynamicAttr;
		},
		enableDynamicAttributeRender: function(attrName){
			this.dynamicAttributes[attrName].render = true;
		},
		disableDynamicAttributeRender: function(attrName){
			this.dynamicAttributes[attrName].render = false;
		},
		removeDynamicAttribute : function(attrName) {
			return delete this.dynamicAttributes[attrName];
		},
		getDynamicAttributeLabel : function(attrName) {
			if(this.dynamicAttributes[attrName]){
				return this.dynamicAttributes[attrName].label;
			}
			return false;
		},
		getEnabledDynamicAttributesKeyArray : function(){
			var it, keyArray = [];
			for(it in this.dynamicAttributes){
				if(this.dynamicAttributes[it].render){
					keyArray.push(it);
				}
			}
			return keyArray;
		},

		/** adding libs for timeline
		*/
		beforeRequest: function () {
			//donothing			
		},
		

		afterRequest: function () {
			$(this.target).empty();
			tlobj = {};
			//tlobj["headline"] = "Timeline";
			tlobj["type"] = "default";
			 
        	//tlobj["text"] = "Timeline summaries";
       	
       		dateObj = [];
       		
       		timelinesize = 100;

			for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
				var doc = this.manager.response.response.docs[i];
				var output= {};
				
				output["headline"] = doc['meta.source.headline_html'];
				//output["headline"] = this._renderTitle(doc);
				output["text"] = doc['meta.source.description'];
				dateIn = new Date(doc['meta.source.datePublished']);
   				var yyyy = dateIn.getFullYear();
   				var mm = dateIn.getMonth()+1; // getMonth() is zero-based
   				var dd  = dateIn.getDate();
   				var datetljs = yyyy.toString() + "," + mm.toString() + "," + dd.toString();
   				output["endDate"] = datetljs;
				output["startDate"] = datetljs;
				if (!!output["headline"] && output["headline"].length>0) {
					dateObj.push(output);
					if (dateObj.length == timelinesize) { break; }
				}
			}

			tlobj["date"] = dateObj;

			timelineobject = {};
			timelineobject["timeline"] = tlobj;

 			timeline = JSON.stringify(timelineobject);

 			//now change the <head>
 			$script = "<script>";
 			$script = $script + " $(document).ready(function() {";
 			$script = $script + " createStoryJS({";

            $script = $script + " type:       'timeline',";
            $script = $script + " width:      '760',";
            $script = $script +  "      height:     '500',";
            $script = $script + " start_zoom_adjust: -2,";
            $script = $script + "       source:     " + timeline + ",";
            $script = $script + "       embed_id:   'my-timeline'";
            $script = $script + "    });";
        	$script = $script + "			});";
 			$script = $script + "</script>" ;


 			

 			$('script').each(function() {
    			if ($(this).html().substring(0, 51).indexOf('$(document).ready(function()') >0)  {
    				var mark = true;
        			$(this).remove();
    			}
			});

 			$('head').append($script);

 			//add div tags 	<div id="my-timeline"></div> 
 			//$(this.target).append("<div id=\"my-timeline\"></div>");


		},

		/**
		 * Error Management
		 * @param message
		 */
		afterRequestError: function(message) {
			$(this.target).html($("<div>").addClass("ui-error-text").text(message));
		}

	});

})(jQuery);

(function ($) {

	AjaxSolr.TimelineWidget = AjaxSolr.AbstractWidget.extend({
		start: 0,

		init: function(){
			this.$tabs = $(this.target).parents(".tabs-container");
		},

		/** adding libs for timeline
		*/
		beforeRequest: function () {
			//donothing			
		},

		afterRequest: function () {
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");

			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this._renderTimeline();
			} else {
				this.$tabs.off("tabsactivate.timelinewidget");
				this.$tabs.on("tabsactivate.timelinewidget", this._tabChange.bind(this) );
			}
		},

		/**
		 * Check if the current open tab is this widget tab and then load the timeline
		 * @private
		 */
		_tabChange: function(){
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this.$tabs.off("tabsactivate.timelinewidget");
				this._renderTimeline();
			}
		},

		_renderTimeline: function(){
			$(this.target).empty();
			var tlobj = {};
			//tlobj["headline"] = "Timeline";
			tlobj["type"] = "default";

			//tlobj["text"] = "Timeline summaries";

			var dateObj = [];
			var timelinesize = 100;

			for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
				var doc = this.manager.response.response.docs[i];
				var output= {};

				output["headline"] = doc['meta.source.headline_html'];
				//output["headline"] = this._renderTitle(doc);
				output["text"] = doc['meta.source.text'];
				var dateIn = new Date(doc['meta.source.datePublished']);
				var yyyy = dateIn.getFullYear();
				var mm = dateIn.getMonth()+1; // getMonth() is zero-based
				var dd  = dateIn.getDate();
				var datetljs = yyyy.toString() + "," + mm.toString() + "," + dd.toString();
				output["endDate"] = datetljs;
				output["startDate"] = datetljs;
				if (!!output["headline"] && output["headline"].length>0) {

					if (dateObj.length == timelinesize) { break; }
					if (!!output["text"]) {output["text"] = output["text"].substring(0,200);}
					dateObj.push(output);
				}
			}

			if (dateObj.length==0) {return;}
			tlobj["date"] = dateObj;

			var timelineobject = {};
			timelineobject["timeline"] = tlobj;

			createStoryJS({
				type: 'timeline',
				width: '760',
				height: '500',
				start_zoom_adjust: -2,
				source:  timelineobject,
				embed_id: 'my-timeline'
			});
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
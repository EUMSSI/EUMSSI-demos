(function ($) {

	AjaxSolr.TimelineWidget = AjaxSolr.AbstractWidget.extend({
		start: 0,

		init: function(){
			this.$tabs = $(this.target).parents(".tabs-container");
			this.apiURL = "http://demo.eumssi.eu/EumssiEventExplorer/webresources/API/";
			this.rowsNumber = 100;
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
			$(this.target).addClass("ui-loading-modal");
			this.getImportantEvents();
		},

		/**
		 * Error Management
		 * @param message
		 */
		afterRequestError: function(message) {
			$(this.target).html($("<div>").addClass("ui-error-text").text(message));
		},

		getImportantEvents: function(entity){
			$(this.target).addClass("ui-loading-modal");
			var cont = EUMSSI.Manager.getLastQuery();
			var lastquery = cont.split(":");
			var queryurl = this.apiURL + "getImportantEvents/json/"+this.rowsNumber+"/" + ( "meta.source.text:" + lastquery[1] || "*%3A*");
			if (!entity) {
				$.ajax({
					url: queryurl,
					success: this._renderTimelineAPI.bind(this)
				});
			}
			
			else {
				$.ajax({
					url: this.apiURL + "getImportantEvents/json/"+this.rowsNumber+"/" + ( "meta.extracted.text_nerl.ner.all:*" + entity + "*" ),
					success: this._renderTimelineAPI.bind(this)
				});
			}
			
		},

		_renderTimelineAPI: function(response){
			$(this.target).empty();
			$(".event-placeholder").empty();
			$(this.target).removeClass("ui-loading-modal");
			var tlobj = {};
			tlobj["type"] = "default";

			var eventObj = [];

			for (var i = 0, l = response.length; i < l; i++) {
				var doc = response[i];
				var slideobj= {};


				year = doc['date'].substring(0,4);
				month = doc['date'].substring(5,7);
				day = doc['date'].substring(8,10);
				var dateobj = {year: Number(year), month: Number(month), day: Number(day)};
				var textobj = {headline:doc['headline'], text:doc['description']};

				slideobj["text"] = textobj;
				slideobj["end_date"] = dateobj;
				slideobj["start_date"] =  dateobj;

				if (!!slideobj['text']["headline"] && slideobj['text']["headline"].length>0) {
					if (eventObj.length == this.rowsNumber) { break; }
					if (!!slideobj['text']["text"]) {slideobj["text"]['text'] = output["text"]['text'].substring(0,200);}
					eventObj.push(output);
				}

				this._renderEvent(doc);
			}

			if (eventObj.length==0) {return;}
			tlobj["events"] = eventObj;

			window.timeline = new TL.Timeline('my-timeline', tlobj);
		},

		_renderEvent: function(event){
			var $event = $("<div>");
			var $value = $('<span>').addClass("info-value");
			var entities = event['entity'];
			for (i = 0; i<entities.length; i++) {
				//$value += entities[i].name + " ; ";
				var $entitylink = $('<a>')
				.text(entities[i].name + " ; ")
				.click(this._onEnityClick.bind(this, entities[i].name ));
				$value.append($entitylink);
			}
			
			
			$event.append($('<h2>').text(event.headline));
			$event.append($('<p class="date">').html(event.date));
			$event.append($('<p>').html(event.description));

			var $key = $('<span>').addClass("info-label").text("Major Entities");
			$event.append($('<p>').append($key).append($value));
			$(".event-placeholder").append($event);
		},

		
		_onEnityClick: function(name){
			this.setFilter(name);
			this.getImportantEvents(name);
		},
		
		setFilter: function (value) {
			//Set the current Filter
			storedValue = value;
			EUMSSI.FilterManager.addFilter("meta.extracted.text_nerl.ner.all:", "meta.extracted.text_nerl.ner.all:" + storedValue, this.id, "Entity: "+value);
		}

	});

})(jQuery);

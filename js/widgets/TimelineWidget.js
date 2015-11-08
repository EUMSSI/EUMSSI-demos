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
			if (!entity) {
				$.ajax({
					url: this.apiURL + "getImportantEvents/json/"+this.rowsNumber+"/" + ( EUMSSI.Manager.getLastQuery() || "*%3A*"),
					success: this._renderTimelineAPI.bind(this)
				});
			}
			
			else {
				$.ajax({
					url: this.apiURL + "getImportantEvents/json/"+this.rowsNumber+"/" + ( "meta.extracted.text.ner.all:*" + entity + "*" ),
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

			var dateObj = [];

			for (var i = 0, l = response.length; i < l; i++) {
				var doc = response[i];
				var output= {};

				output["headline"] = doc['headline'];
				output["text"] = doc['description'];
				output["endDate"] = doc['date'].replace(/-/g,",");
				output["startDate"] =  doc['date'].replace(/-/g,",");

				if (!!output["headline"] && output["headline"].length>0) {
					if (dateObj.length == this.rowsNumber) { break; }
					if (!!output["text"]) {output["text"] = output["text"].substring(0,200);}
					dateObj.push(output);
				}

				this._renderEvent(doc);
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
			EUMSSI.FilterManager.addFilter("Entity:", storedValue, this.id, "Entity: "+value);
		}

	});

})(jQuery);

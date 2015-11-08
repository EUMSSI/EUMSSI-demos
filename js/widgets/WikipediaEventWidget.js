
(function ($) {

	AjaxSolr.WikipediaEventWidget = AjaxSolr.AbstractWidget.extend({
		start: 0,

		init: function(){
			this.$tabs = $(this.target).parents(".tabs-container");
			this.apiURL = "http://demo.eumssi.eu:8385/EumssiEventExplorer/webresources/API/";
			this.rowsNumber = 100;

			//Bind events click
			//Avoid timeline go to 404 page when click on a tag on it.
			$("#my-wikievent").click(".slider-item a",this._onDescriptionLinkClick.bind(this));
		},

		/** adding libs for timeline
		*/
		beforeRequest: function () {
			//donothing
		},

		afterRequest: function () {
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");

			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this.getWikipediaEvents();
			} else {
				this.$tabs.off("tabsactivate.wikieventwidget");
				this.$tabs.on("tabsactivate.wikieventwidget", this._tabChange.bind(this) );
			}
		},

		/**
		 * Check if the current open tab is this widget tab and then load the timeline
		 * @private
		 */
		_tabChange: function(){
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this.$tabs.off("tabsactivate.wikieventwidget");
				this.getWikipediaEvents();
			}
		},

		/**
		 * Error Management
		 * @param message
		 */
		afterRequestError: function(message) {
			$(this.target).html($("<div>").addClass("ui-error-text").text(message));
		},

		getWikipediaEvents: function(url){
			if(!url){
				var q = "*";
				var generalQuery = EUMSSI.FilterManager.getFilters("GENERAL_SEARCH")[0];
				if(generalQuery){
					q = generalQuery.query.replace("GENERAL_SEARCH:","");
				}
				url = "getWikipediaEvents/json/2000-01-01/2015-12-31/" + q;
			}

			$(this.target).addClass("ui-loading-modal");
			$.ajax({
				url: this.apiURL + url,
				success: this._renderTimeline.bind(this)
			});
		},

		_renderTimeline: function(response){
			$(this.target).empty();
			$(".wikievent-placeholder").empty();
			$(this.target).removeClass("ui-loading-modal");
			var tlobj = {};
			tlobj["type"] = "default";

			var dateObj = [];

			for (var i = 0, l = response.length; i < l; i++) {
				var doc = response[i];
				var output= {};

				output["headline"] = doc["description"];
				output["text"] = doc['description'];
				output["endDate"] = doc['date'].replace(/-/g,",");
				output["startDate"] =  doc['date'].replace(/-/g,",");

				if (!!output["headline"] && output["headline"].length>0) {
					if (dateObj.length == this.rowsNumber) { break; }
					if (!!output["text"]) {output["text"] = output["text"].substring(0,200);}
					if (!!output["headline"]) {output["headline"] = output["headline"].substring(0,50);}
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
				embed_id: 'my-wikievent'
			});

			//_.delay(function(){
			//
			//}.bind(this),1000);
		},

		_renderEvent: function(event){
			var $event = $("<div>");
			$event.append($('<h2>').text(event.headline));
			$event.append($('<p class="date">').html(event.date));

			if(event["belongsToStory"]){
				var $belongsto = $('<a>')
					.text(event["belongsToStory"].name)
					.click(this._onBelongToStoryClick.bind(this, event["belongsToStory"].wikipediaUrl ));
				$event.append($belongsto);
			}

			$event.append($('<p class="description">').html(event.description));
			$event.click("p.description a", this._onDescriptionLinkClick.bind(this));

			if(event["location"]){
				var $key = $('<span>').addClass("info-label").text("Location");
				var $value = $('<span>').addClass("info-value");
				var $location = $('<a>')
					.text(event["location"].name)
					.click(this._onLocationClick.bind(this, event["location"].id ));
				$value.append($location);
				$event.append($('<p>').append($key).append($value));
			}

			if(event["category"]){
				var $key = $('<span>').addClass("info-label").text("Category");
				var $value = $('<span>').addClass("info-value");
				var $category = $('<a>')
					.text(event["category"].name)
					.click(this._onCategoryClick.bind(this, event["category"].id ));
				$value.append($category);
				$event.append($('<p>').append($key).append($value));
			}

			$(".wikievent-placeholder").append($event);
		},

		_onBelongToStoryClick: function(url){
			var urlItems = url.split("/");
			var eventLink = urlItems[urlItems.length - 1];
			this.getWikipediaEvents("getWikipediaEventsByStory/json/"+eventLink);
		},

		_onLocationClick: function(locationId){
			this._onStoryListLinkClick(locationId);
		},

		_onCategoryClick: function(categoryId){
			this._onStoryListLinkClick(categoryId);
		},

		_onDescriptionLinkClick: function(event){
			if(event.target.tagName == "A"){
				event.preventDefault();
				var linkRef = $(event.target).attr("href");
				this._onStoryListLinkClick(linkRef);
			}
		},

		/**
		 * TODO
		 * @param response
		 * @private
		 */
		_renderStoryList: function(response){
			$(this.target).empty();
			$(".wikievent-placeholder").empty();

			var $table = $('<table class="storyList"><thead></thead><tbody></tbody></table>');
			$table.find("thead").html("<tr><th>News Story</th><th>Form</th><th>To</th><th>Numbers events in period</th></tr>");

			for(var i in response){
				var item = response[i];
				var $tr = ("<tr>");
				var $link = $('<a>')
					.text(item.name)
					.click(this._onStoryListLinkClick.bind(this, item.id ));

				$tr.append($("<td>").html($link));
				$tr.append($("<td>").text(item.from));
				$tr.append($("<td>").text(item.to));
				$tr.append($("<td>").text(item.number));
				$table.find("tbody").append($tr);
			}
		},

		_onStoryListLinkClick: function(entityId){
			this.getWikipediaEvents("getWikipediaEventsByEntity/json/"+entityId);
		}


	});

})(jQuery);
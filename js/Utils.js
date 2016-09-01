/*global jQuery, $, AjaxSolr, EUMSSI, CONF, UTIL */
window.CONF = {};
window.UTIL = {};

CONF.MAP_LOCATION_FIELD_NAME = "meta.extracted.text_nerl.dbpedia.Country";
CONF.MAP_CITIES_FIELD_NAME = "meta.extracted.text_nerl.dbpedia.City";
CONF.PERSON_FIELD_NAME = "meta.extracted.text_nerl.dbpedia.PERSON";
CONF.LOCATION_FIELD_NAME = "meta.extracted.text_nerl.dbpedia.LOCATION";
CONF.SUGGESTED_QUERIES_FIELD_NAME = "meta.extracted.text_nerl.dbpedia.other";
CONF.CLOUD_FIELD_NAME = "meta.source.keywords";
CONF.SOURCE_FIELD_NAME = "source";

/**
 * Update the facet.field items with the current value of the Fields Names
 */
CONF.updateFacetingFields = function(){
	// Clean previous facet configuration
	EUMSSI.Manager.store.remove('facet.field');

	var params = {
		'facet.field': [
			CONF.SOURCE_FIELD_NAME,
			CONF.MAP_LOCATION_FIELD_NAME,
			CONF.MAP_CITIES_FIELD_NAME,
			CONF.PERSON_FIELD_NAME,
			CONF.CLOUD_FIELD_NAME
		]
	};
	//Facet Limit
	params['f.' + CONF.SOURCE_FIELD_NAME + '.facet.limit'] = 20;
	params['f.' + CONF.MAP_LOCATION_FIELD_NAME + '.facet.limit'] = 250;
	params['f.' + CONF.MAP_CITIES_FIELD_NAME + '.facet.limit'] = 25;
	params['f.' + CONF.PERSON_FIELD_NAME + '.facet.limit'] = 50;
	params['f.' + CONF.CLOUD_FIELD_NAME + '.facet.limit'] = 100;
	//Facet Min occurrences
	params['f.' + CONF.SOURCE_FIELD_NAME + '.facet.mincount'] = 1;
	params['f.' + CONF.MAP_LOCATION_FIELD_NAME + '.facet.mincount'] = 1;
	params['f.' + CONF.MAP_CITIES_FIELD_NAME + '.facet.mincount'] = 1;
	params['f.' + CONF.PERSON_FIELD_NAME + '.facet.mincount'] = 1;
	params['f.' + CONF.CLOUD_FIELD_NAME + '.facet.mincount'] = 1;

	for (var name in params) {
		EUMSSI.Manager.store.addByValue(name, params[name]);
	}
};

/**
 * !!! CORS PROBLEM
 * Check if an url exist, used to check if video links are online or not
 * @param {String} url - link
 * @param {Function} callback - this function will be called with (true:exist/false:broken link) as param when the
 *     request is DONE
 */
UTIL.checkUrlExists = function(url, callback){
	var http = new XMLHttpRequest();
	http.open('HEAD', url);
	http.onreadystatechange = function() {
		if (this.readyState == this.DONE) {
			callback(this.status != 404);
		}
	};
	http.send();
};

/**
 * Create a jQuery menu with the passed structure in the $menu jquery selector.
 * The menu is placed on the mouse and disappear when click or take of the mouse from it.
 * @param {JQuery} $menu - jquery element that contains the list with the menu items $(<ul>)
 * @returns {JQuery}
 */
UTIL.showContextMenu = function($menu){
	var timeoutFunction;
	if($menu){
		$menu.addClass("click-menu");
		$("body").append($menu);
		$menu.menu({
			position: { my: "left top", at: "left+"+window.mouse_x + " top+" + window.mouse_y, of:"window" }
		});
		$menu.css("left",window.mouse_x - 10);
		$menu.css("top",window.mouse_y - 10);

		function removeMenu(){
			$menu.remove();
		}
		$menu.on("click",removeMenu);
		$menu.on("mouseleave",function(){
			timeoutFunction= setTimeout(removeMenu, 500);
		});
		$menu.on("mouseenter",function(){
			clearTimeout(timeoutFunction);
		});
	}
	return $menu;
};

UTIL.showMarkMenu = function($menu, $target, offset) {
	"use strict";
	var timeoutFunction;
	offset = offset || {left: 0,  top: 0};

	function removeMenu() {
		$menu.remove();
	}

	if ($menu) {
		$menu.addClass("click-menu")
		     .appendTo("body")
		     .menu();

		$menu.position({
			my: "left top",
			at: "left+" + offset.left +  " bottom+" +  offset.top,
			of: $target
		});
		$menu.on("click", removeMenu);
		$menu.on("mouseleave", function() {
			timeoutFunction = setTimeout(removeMenu, 500);
		});
		$menu.on("mouseenter", function() {
			clearTimeout(timeoutFunction);
		});
	}
	return $menu;
};

/**
 * Get images from the wikipedia
 * example:
 * "http://en.wikipedia.org/w/api.php?action=query&titles=Barack_Obama|Muhammad|John_Kerry&prop=pageimages&format=json&pithumbsize=150&pilimit=50"
 * apache.conf proxy: ProxyPass /wikiBridge http://en.wikipedia.org/
 * @param {Array<String>} facetes - Array with the Facet Names to look for on th wikipedia
 * @private
 */
UTIL.getWikipediaImages = function(facetes){
	if(facetes.length > 0){
		var urlRoot = "http://en.wikipedia.org/w/api.php?",
			urlParams = [];

		urlParams.push("action=query");
		urlParams.push("prop=pageimages");
		urlParams.push("titles="+facetes.join("|"));
		urlParams.push("format=json");
		urlParams.push("pithumbsize=280");
		urlParams.push("pilimit=50");

		//this.manager._showLoader();
		return $.ajax({
			crossDomain: true,
			cache: true,
			dataType: 'jsonp',
			url: urlRoot + urlParams.join("&")
		});
	}
};

/**
 * When click on a photo display a menu to perform some actions.
 * @param {String} facetName - name of the item
 * @private
 */
UTIL.openPeopleActionsMenu = function(facetName, ev){
	var $menu = $('<ul>');
	$menu.append('<div class="ui-widget-header">'+facetName.replace(/_/g,"&nbsp;")+'</div>');
	if(EUMSSI.FilterManager.checkFilterByName(EUMSSI.CONF.PERSON_FIELD_NAME)){
		$menu.append('<li class="filter"><span class="ui-icon ui-icon-plusthick"></span>Add person to filter</li>');
		$menu.append('<li class="filter-clear"><span class="ui-icon ui-icon-minusthick"></span>Clear filter</li>');
	} else {
		$menu.append('<li class="filter"><span class="ui-icon ui-icon-search"></span>Filter by person</li>');
	}
	$menu.append('<li class="open-wikipedia"><span class="ui-icon ui-icon-newwin"></span>Open Wikipedia page</li>');
	$menu.append('<li class="open-dbpedia"><span class="ui-icon ui-icon-newwin"></span>Open DBpedia page</li>');
	$menu.append('<li class="people-to-editor"><span class="ui-icon ui-icon-copy"></span>To editor</li>');

	function addPersonFilter(facetName){
		var fq = EUMSSI.CONF.PERSON_FIELD_NAME + ':("' + facetName + '")';
		EUMSSI.FilterManager.addFilter(EUMSSI.CONF.PERSON_FIELD_NAME, fq, this.id,"People: "+facetName.replace(/_/g, " "));
		this.doRequest();
	}
	function cleanPersonFilter(){
		EUMSSI.FilterManager.removeFilterByName(EUMSSI.CONF.PERSON_FIELD_NAME);
		this.doRequest();
	}

	function peopleToEditor(img){
		var oEditor = CKEDITOR.instances["richeditor-placeholder"];
		oEditor.insertHtml(img.html());
	}

	$menu.on("click", ".open-wikipedia", UTIL.openNewPage.bind(this, "http://wikipedia.org/wiki/"+facetName));
	$menu.on("click", ".open-dbpedia", UTIL.openNewPage.bind(this, "http://dbpedia.org/resource/"+facetName));
	$menu.on("click", ".filter", addPersonFilter.bind(this,facetName));
	$menu.on("click", ".filter-clear", cleanPersonFilter.bind(this));
	$menu.on("click", ".people-to-editor", peopleToEditor.bind(this, $(ev.currentTarget)));

	EUMSSI.UTIL.showContextMenu($menu);
};

/**
 * Open link on a new page
 * @param {String} url - the link
 */
UTIL.openNewPage = function(url){
	"use strict";
	var $externalFrame = $(".externalFrame-container");
	$externalFrame.empty();
	$externalFrame.append($("<iframe src="+url+">"));
	$(".tabs-container").tabs( "option", "active", 7);
};

UTIL.createMenuPerson = function($menu, entity) {
	"use strict";
	if (EUMSSI.FilterManager.checkFilterByName(EUMSSI.CONF.PERSON_FIELD_NAME)) {
		$menu.append(UTIL.createAddPersonLi());
		$menu.append(UTIL.createClearFilterLi());
	} else {
		$menu.append(UTIL.createClearFilterByPersonLi());
	}
	$menu.append(UTIL.createWikipediaLi());
	$menu.append(UTIL.createDBPediaLi());
	$menu.on("click", ".open-wikipedia", UTIL.openNewPage.bind(this, "http://wikipedia.org/wiki/" + entity.value));
	$menu.on("click", ".open-dbpedia", UTIL.openNewPage.bind(this, "http://dbpedia.org/resource/" + entity.value));
};

UTIL.createLocationMenu = function($menu, value, widgetId) {
	"use strict";
	if (EUMSSI.FilterManager.checkFilterByWidgetId(widgetId+ "_LOCATION")) {
		$menu.append(UTIL.createAddLocationFilter());
		$menu.append(UTIL.createClearFilterLocationLi());
	} else {
		$menu.append(UTIL.createFilterByLocation());
	}
	$menu.append(UTIL.createWikipediaLi());
	$menu.on("click", ".open-wikipedia", UTIL.openNewPage.bind(this, "http://wikipedia.org/wiki/" + value));
};

UTIL.createCountryMenu = function($menu, value, widgetId) {
	"use strict";
	if (EUMSSI.FilterManager.checkFilterByWidgetId(widgetId + "_Country")) {
		$menu.append(UTIL.createAddCountryFilter());
		$menu.append(UTIL.createClearFilterCountryLi());
	} else {
		$menu.append(UTIL.createFilterByCountry());
	}
	$menu.append(UTIL.createWikipediaLi());
	$menu.on("click", ".open-wikipedia", UTIL.openNewPage.bind(this, "http://wikipedia.org/wiki/" + value));
};

UTIL.createCityMenu = function($menu, city, widgetId) {
	"use strict";

	if (EUMSSI.FilterManager.checkFilterByWidgetId(widgetId+ "_City")) {
		$menu.append('<li class="filter-city"><span class="ui-icon ui-icon-plusthick"></span>Add City to filter</li>');
		$menu.append('<li class="filter-city-clear"><span class="ui-icon ui-icon-minusthick"></span>Clear Cities filters</li>');
	} else {
		$menu.append('<li class="filter-city"><span class="ui-icon ui-icon-search"></span>Filter by City</li>');
	}
	$menu.append('<li class="open-wikipedia"><span class="ui-icon ui-icon-newwin"></span>Open Wikipedia page</li>');
	$menu.on("click", ".open-wikipedia", function() {
		EUMSSI.UTIL.openNewPage("http://wikipedia.org/wiki/" + city);
	});
	return $menu;
};

UTIL.getMarkerMenu = function(entity, widgetId){
	"use strict";
	var txt = entity.text.replace(/_/g, "&nbsp;");
	var $menu = $('<ul>');
	$menu.append(UTIL.createHeaderMenuItem(txt));
	switch (entity.type.toLowerCase()) {
		case "country":
			UTIL.createCountryMenu($menu, entity.value, widgetId);
			break;
		case "city":
			UTIL.createCityMenu($menu, entity.value, widgetId);
			break;
		case "location":
			UTIL.createLocationMenu($menu, entity.value, widgetId);
			break;
		case "person":
			UTIL.createMenuPerson($menu, entity);
			break;
	}
	return $menu;
};

UTIL.addCityFilter = function(city){
	"use strict";
	var filterName = EUMSSI.CONF.MAP_CITIES_FIELD_NAME;
	var query = filterName + ':("' + city + '")';
	var widgetId = this.id + "_City";
	var filterText = "City: " + city;
	EUMSSI.FilterManager.addFilter(filterName, query, widgetId, filterText);
	this.doRequest();
};

/**
 * Remove the current filter
 * @param {Boolean} fetch - true if want to perform a request
 */
UTIL.cleanCityFilter = function(fetch){
	"use strict";
	EUMSSI.FilterManager.removeFilterByWidget(this.id + "_City");
	if(fetch){
		this.doRequest();
	}
};

UTIL.addLocationFilter = function(location){
	"use strict";
	var filterName = EUMSSI.CONF.LOCATION_FIELD_NAME;
	var query = filterName + ':("' + location + '")';
	var widgetId = this.id + "_LOCATION";
	var filterText = "LOCATION: " + location;
	EUMSSI.FilterManager.addFilter(filterName, query, widgetId, filterText);
	this.doRequest();
};

/**
 * Remove the current filter
 * @param {Boolean} fetch - true if want to perform a request
 */
UTIL.cleanLocationFilter = function(fetch){
	"use strict";
	EUMSSI.FilterManager.removeFilterByWidget(this.id + "_LOCATION");
	if(fetch){
		this.doRequest();
	}
};

UTIL.addContryFilter = function(regionName) {
	"use strict";
	var filterName = EUMSSI.CONF.MAP_LOCATION_FIELD_NAME;
	var query = filterName + ':("' + regionName.replace(" ", "_") + '")';
	var widgetId = this.id + "_Country";
	var filterText = "Location: " + regionName;
	EUMSSI.FilterManager.addFilter(filterName, query, widgetId, filterText);
	this.doRequest();
};

/**
 * Remove the current filter
 * @param {Boolean} fetch - true if want to perform a request
 */
UTIL.cleanCountryFilter = function(fetch) {
	"use strict";
	EUMSSI.FilterManager.removeFilterByWidget(this.id + "_Country");
	if (fetch) {
		this.doRequest();
	}
};

UTIL.addPersonFilter = function(entityText) {
	"use strict";
	var fq = UTIL.getQueryPersonFieldName(entityText);
	var txt = entityText.replace(/_/g, " ");
	EUMSSI.FilterManager.addFilter(EUMSSI.CONF.PERSON_FIELD_NAME, fq, this.id, "People: " + txt);
	this.doRequest();
};

UTIL.cleanPersonFilter = function() {
	"use strict";
	EUMSSI.FilterManager.removeFilterByName(EUMSSI.CONF.PERSON_FIELD_NAME);
	this.doRequest();
};

UTIL.getQueryPersonFieldName = function(entityText) {
	"use strict";
	return EUMSSI.CONF.PERSON_FIELD_NAME + ':("' + entityText + '")';
};

UTIL.createWikipediaLi = function() {
	"use strict";
	var $wikipedia = UTIL.createLi("open-wikipedia");
	$wikipedia.append(UTIL.createOpenIco());
	$wikipedia.text("Open Wikipedia page");
	return $wikipedia;
};

UTIL.createDBPediaLi = function() {
	"use strict";
	var $dbpedia = UTIL.createLi("open-dbpedia");
	$dbpedia.append(UTIL.createOpenIco());
	$dbpedia.text("Open DBpedia page");
	return $dbpedia;
};

UTIL.createAddPersonLi = function() {
	"use strict";
	var $addPersonLi = UTIL.createLi("filter");
	$addPersonLi.append(UTIL.createAddIco());
	$addPersonLi.text("Add person to filter");
	return $addPersonLi;
};

UTIL.createClearFilterLi = function() {
	"use strict";
	var $clearFilterLi = UTIL.createLi("filter-clear");
	$clearFilterLi.append(UTIL.createMinusIco());
	$clearFilterLi.text("Clear filter");
	return $clearFilterLi;
};


UTIL.createClearFilterByPersonLi = function() {
	"use strict";
	var $clearFilterLi = UTIL.createLi("filter");
	$clearFilterLi.append(UTIL.createSearchIco());
	$clearFilterLi.text("Filter by person");
	return $clearFilterLi;
};

UTIL.createAddCountryFilter = function() {
	"use strict";
	var $addContryFilter = UTIL.createLi("filter-country");
	$addContryFilter.append(UTIL.createAddIco());
	$addContryFilter.text("Add country to filter");
	return $addContryFilter;
};

UTIL.createFilterByCountry = function() {
	"use strict";
	var $clearFilterLi = UTIL.createLi("filter-country");
	$clearFilterLi.append(UTIL.createSearchIco());
	$clearFilterLi.text("Filter by country");
	return $clearFilterLi;
};


UTIL.createClearFilterCountryLi = function() {
	"use strict";
	var $clearFilterLi = UTIL.createLi("filter-country-clear");
	$clearFilterLi.append(UTIL.createMinusIco());
	$clearFilterLi.text("Clear Countries filters");
	return $clearFilterLi;
};

UTIL.createAddLocationFilter = function() {
	"use strict";
	var $addLocationFilter = UTIL.createLi("filter-location");
	$addLocationFilter.append(UTIL.createAddIco());
	$addLocationFilter.text("Add location to filter");
	return $addLocationFilter;
};


UTIL.createClearFilterLocationLi = function() {
	"use strict";
	var $clearFilterLi = UTIL.createLi("filter-location-clear");
	$clearFilterLi.append(UTIL.createMinusIco());
	$clearFilterLi.text("Clear location filters");
	return $clearFilterLi;
};


UTIL.createFilterByLocation = function() {
	"use strict";
	var $clearFilterLi = UTIL.createLi("filter-location");
	$clearFilterLi.append(UTIL.createSearchIco());
	$clearFilterLi.text("Filter by location");
	return $clearFilterLi;
};

UTIL.createLi = function(className) {
	"use strict";
	return $("<li>", {
		"class": className
	});
};

UTIL.createHeaderMenuItem = function(txt) {
	"use strict";
	return $("<div>", {
		"class": "ui-widget-header"
	}).text(txt);
};

UTIL.createOpenIco = function() {
	"use strict";
	return $("<span>", {
		"class": "ui-icon ui-icon-newwin"
	});
};

UTIL.createAddIco = function() {
	"use strict";
	return $("<span>", {
		"class": "ui-icon ui-icon-plusthick"
	});
};

UTIL.createMinusIco = function() {
	"use strict";
	return $("<span>", {
		"class": "ui-icon ui-icon-minusthick"
	});
};

UTIL.createSearchIco = function() {
	"use strict";
	return $("<span>", {
		"class": "ui-icon ui-icon-search"
	});
};



UTIL.parseAnalizeText = function(response) {
	"use strict";
	if (response.data.dbpedia) {
		this._extractDbpediaItems(response.data.dbpedia);
	}
	if (response.data.kea) {
		this._extractKeaItems(response.data.kea);
	}
//	EUMSSI.EventManager.trigger("OpenFilter");
};

UTIL.DBpedia = {};
UTIL.DBpedia.isCity = function(type) {
	"use strict";
	return type.toLowerCase() === "city";
};

UTIL.DBpedia.isCountry = function(type) {
	"use strict";
	return type.toLowerCase() === "country";
};

UTIL.DBpedia.isLocation = function(type) {
	"use strict";
	return type.toLowerCase() === "location";
};

UTIL.DBpedia.generateEntity = function(element, type) {
	"use strict";
	return {
		text: element.text,
		value: element.uri,
		field: "meta.extracted.text_nerl.dbpedia." + type,
		type: type
	};
};

UTIL.DBpedia.isRepeatedEntity = function(entities, uri) {
	"use strict";
	return entities.some(function(entity) {
		return entity.value === uri;
	});
};

UTIL.extractDbpediaItems = function(dbpediaData) {
	"use strict";
	var type;
	var suggestedQueries = [];
	var locations = [];
	var cities = [];
	var countries = [];
	var persons = [];
	_.each(dbpediaData, function(element, key) {
		type = key;
		_.each(element, function(element) {
			switch (type.toLowerCase()) {
				case "country":
					if (!UTIL.DBpedia.isRepeatedEntity(countries, element.uri)) {
						countries.push(UTIL.DBpedia.generateEntity(element, type));
					}
					break;
				case "city":
					if (!UTIL.DBpedia.isRepeatedEntity(cities, element.uri)) {
						cities.push(UTIL.DBpedia.generateEntity(element, type));
					}
					break;
				case "location":
					if (!UTIL.DBpedia.isRepeatedEntity(locations, element.uri)) {
						locations.push(UTIL.DBpedia.generateEntity(element, type));
					}
					break;
				case "person":
					if (!UTIL.DBpedia.isRepeatedEntity(persons, element.uri)) {
						persons.push(UTIL.DBpedia.generateEntity(element, type));
					}
					break;
				case "other":
					if (!UTIL.DBpedia.isRepeatedEntity(suggestedQueries, element.uri)) {
						suggestedQueries.push(UTIL.DBpedia.generateEntity(element, type));
					}
					break;
			}
		});
	});
	locations = UTIL.DBpedia.clearRepeatedLocations(cities, countries, locations);
	return {
		entities: [].concat(locations, countries, cities, persons),
		queries: suggestedQueries
	};

};

UTIL.DBpedia.isInCollection = function(entity, collection) {
	"use strict";
	return collection.some(function(item) {
		return entity.value === item.value;
	});
};

UTIL.DBpedia.clearRepeatedLocations = function(cities, countries, locations) {
	"use strict";
	return locations.filter(function(location) {
		return !UTIL.DBpedia.isInCollection(location, cities) && !UTIL.DBpedia.isInCollection(location, countries);
	});
};

UTIL.extractKeaItems = function(keaData) {
	"use strict";
	var keyphrases = [];
	_.each(keaData, function(element) {
		var keyphrase = keyphrases.filter(function(entity) {
			return entity.value === element.keyphrase;
		})[0];
		if (!keyphrase) {
			keyphrases.push({
				text : element.text,
				value: element.keyphrase,
				field: "meta.source.keywords"
			});
		}
	});
	return keyphrases;
};


/**
 * Splits with espaces the current camelCase string.
 * Capitalize the first letter.
 * ex:  "myVarIsAwesome".unCamelCase() -> "My Var Is Awesome"
 * 		"myVxrIsWTF".unCamelCase() ->	"My Vxg Is WTF"
 * @returns {string}
 */
String.prototype.unCamelCase = function(){
	return this
		// insert a space between lower & upper
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		// space before last upper in a sequence followed by lower
		.replace(/\b([A-Z]+)([A-Z])([a-z])/, '$1 $2$3')
		// uppercase the first character
		.replace(/^./, function(str){ return str.toUpperCase(); });
};

/**
 * Check if the string starts with a string
 * ex:
 *	 "Twitter-DW".startsWith("Twitt") -> true
 *	 "Tweet-DW".startsWith("Twitt") -> false
 * @param {String} s - String to look for on the start
 * @returns {boolean} true if the current String starts with the param 's' string
 */
String.prototype.startsWith = function(s){
	if( s && this.length >= s.length ){
		var a = this.slice(0, s.length);
		return (a === s) ? true : false;
	}
	return false;
};


//LOAD TWITTER widgets API
window.twttr = (function(d, s, id) {
	var js, fjs = d.getElementsByTagName(s)[0],
		t = window.twttr || {};
	if (d.getElementById(id)) return;
	js = d.createElement(s);
	js.id = id;
	js.src = "https://platform.twitter.com/widgets.js";
	fjs.parentNode.insertBefore(js, fjs);

	t._e = [];
	t.ready = function(f) {
		t._e.push(f);
	};

	return t;
}(document, "script", "twitter-wjs"));

UTIL.openTweet = function(tweetId){
	var $tooltipContent = $("<div>");
	twttr.widgets.createTweet(tweetId, $tooltipContent[0],{
		dnt: true
	}).then(function (el) {
		$tooltipContent.dialog("option", "position",{my: "center", at: "center", of: window});
		if(el !== undefined){
			var $card = $(el.contentDocument).find(".Tweet-card [data-scribe='component:card']");
			if($card.length > 0){
				var interval = setInterval(function(){
					if($card.hasClass("is-ready")){
						$tooltipContent.dialog("option", "position",{my: "center", at: "center", of: window});
						clearInterval(interval);
					}
				},500)
			}
		} else {
			var $error = $("<h3 class='ui-state-error-text'>")
				.text("The tweet can't be loaded.");
			$tooltipContent.append($error);
		}
	});
	$tooltipContent.dialog({
		width: 500,
		maxHeight: $(window).height()-50,
		modal:true,
		dialogClass: "tweet-dialog",
		resizable: false
	});
};

UTIL.serializeCurrentState = function(){
	return {
		filters : EUMSSI.FilterManager._filters,
		lastq : EUMSSI.Manager.getLastQuery(),
		lastfq : EUMSSI.Manager.getLastFilterQuery(),
		currentTab : $(".tabs-container").tabs("option", "active"),
		widgets : []
	};
};

UTIL.showSearchHelp = function(){
	var $dialogContent = $($("#search-info-content-tpl").text());
	$dialogContent.dialog({
		title: "Search help",
		closeOnEscape: true,
		width: 800,
		close: function () { $(this).remove() },
		open: function() {
			$(this).dialog( "option" ,"maxWidth" , $(window).width() - 100);
			$(this).dialog( "option" ,"maxHeight", $(window).height() - 100);
		}
	});
};

UTIL.formatIntroJsIntro = function(title, content, info){
	var out = "";
	if(title){
		out += "<h3>" + title + "</h3>";
	}
	if(content){
		out += "<br><p>" + content + "</p>"
	}
	if(info){
		out += "<br><i>" + info + "</i>"
	}
	return out;
};

UTIL.isEditorOpen = function(){
	return $("body").find("> .content").hasClass("slide-open");
};


// Country Code ISO-3166-2
UTIL.countryCode = [];
UTIL.countryCode["Andorra"] = "AD";
UTIL.countryCode["United Arab Emirates"] = "AE";
UTIL.countryCode["Afghanistan"] = "AF";
UTIL.countryCode["Antigua and Barbuda"] = "AG";
UTIL.countryCode["Anguilla"] = "AI";
UTIL.countryCode["Albania"] = "AL";
UTIL.countryCode["Armenia"] = "AM";
UTIL.countryCode["Angola"] = "AO";
UTIL.countryCode["Antarctica"] = "AQ";
UTIL.countryCode["Argentina"] = "AR";
UTIL.countryCode["American Samoa"] = "AS";
UTIL.countryCode["Austria"] = "AT";
UTIL.countryCode["Australia"] = "AU";
UTIL.countryCode["Aruba"] = "AW";
UTIL.countryCode["Aland Islands"] = "AX";
UTIL.countryCode["Azerbaijan"] = "AZ";
UTIL.countryCode["Bosnia and Herzegovina"] = "BA";
UTIL.countryCode["Barbados"] = "BB";
UTIL.countryCode["Bangladesh"] = "BD";
UTIL.countryCode["Belgium"] = "BE";
UTIL.countryCode["Burkina Faso"] = "BF";
UTIL.countryCode["Bulgaria"] = "BG";
UTIL.countryCode["Bahrain"] = "BH";
UTIL.countryCode["Burundi"] = "BI";
UTIL.countryCode["Benin"] = "BJ";
UTIL.countryCode["Saint Barthélemy"] = "BL";
UTIL.countryCode["Bermuda"] = "BM";
UTIL.countryCode["Brunei"] = "BN";//	UTIL.countryCode["Brunei Darussalam"] = "BN";
UTIL.countryCode["Bolivia"] = "BO";//	UTIL.countryCode["Bolivia, Plurinational State of"] = "BO";
UTIL.countryCode["Bonaire, Sint Eustatius and Saba"] = "BQ";
UTIL.countryCode["Brazil"] = "BR";
UTIL.countryCode["The Bahamas"] = "BS";//	UTIL.countryCode["Bahamas"] = "BS";
UTIL.countryCode["Bhutan"] = "BT";
UTIL.countryCode["Bouvet Island"] = "BV";
UTIL.countryCode["Botswana"] = "BW";
UTIL.countryCode["Belarus"] = "BY";
UTIL.countryCode["Belize"] = "BZ";
UTIL.countryCode["Canada"] = "CA";
UTIL.countryCode["Cocos (Keeling) Islands"] = "CC";
UTIL.countryCode["Democratic Republic of the Congo"] = "CD";//	UTIL.countryCode["Congo, the Democratic Republic of the"] = "CD";
UTIL.countryCode["Central African Republic"] = "CF";
UTIL.countryCode["Republic of the Congo"] = "CG";//	UTIL.countryCode["Congo"] = "CG";
UTIL.countryCode["Switzerland"] = "CH";
UTIL.countryCode["Cote d'Ivoire"] = "CI";//	UTIL.countryCode["Côte d'Ivoire"] = "CI";
UTIL.countryCode["Cook Islands"] = "CK";
UTIL.countryCode["Chile"] = "CL";
UTIL.countryCode["Cameroon"] = "CM";
UTIL.countryCode["China"] = "CN";
UTIL.countryCode["Colombia"] = "CO";
UTIL.countryCode["Costa Rica"] = "CR";
UTIL.countryCode["Cuba"] = "CU";
UTIL.countryCode["Cabo Verde"] = "CV";
UTIL.countryCode["Curaçao"] = "CW";
UTIL.countryCode["Christmas Island"] = "CX";
UTIL.countryCode["Cyprus"] = "CY";
UTIL.countryCode["Czech Republic"] = "CZ";
UTIL.countryCode["Germany"] = "DE";
UTIL.countryCode["Djibouti"] = "DJ";
UTIL.countryCode["Denmark"] = "DK";
UTIL.countryCode["Dominica"] = "DM";
UTIL.countryCode["Dominican Republic"] = "DO";
UTIL.countryCode["Algeria"] = "DZ";
UTIL.countryCode["Ecuador"] = "EC";
UTIL.countryCode["Estonia"] = "EE";
UTIL.countryCode["Egypt"] = "EG";
UTIL.countryCode["Western Sahara"] = "EH";
UTIL.countryCode["Eritrea"] = "ER";
UTIL.countryCode["Spain"] = "ES";
UTIL.countryCode["Ethiopia"] = "ET";
UTIL.countryCode["Finland"] = "FI";
UTIL.countryCode["Fiji"] = "FJ";
UTIL.countryCode["Falkland Islands"] = "FK";//	UTIL.countryCode["Falkland Islands (Malvinas)"] = "FK";
UTIL.countryCode["Federated States of Micronesia"] = "FM";//	UTIL.countryCode["Micronesia, Federated States of"] = "FM";
UTIL.countryCode["Faroe Islands"] = "FO";
UTIL.countryCode["France"] = "FR";
UTIL.countryCode["Gabon"] = "GA";
UTIL.countryCode["United Kingdom"] = "GB";
UTIL.countryCode["Grenada"] = "GD";
UTIL.countryCode["Georgia"] = "GE";//	UTIL.countryCode["Georgia (country)"] = "GE";
UTIL.countryCode["French Guiana"] = "GF";
UTIL.countryCode["Guernsey"] = "GG";
UTIL.countryCode["Ghana"] = "GH";
UTIL.countryCode["Gibraltar"] = "GI";
UTIL.countryCode["Greenland"] = "GL";
UTIL.countryCode["Gambia"] = "GM";//	UTIL.countryCode["The Gambia"] = "GM";
UTIL.countryCode["Guinea"] = "GN";
UTIL.countryCode["Guadeloupe"] = "GP";
UTIL.countryCode["Equatorial Guinea"] = "GQ";
UTIL.countryCode["Greece"] = "GR";
UTIL.countryCode["South Georgia and the South Sandwich Islands"] = "GS";
UTIL.countryCode["Guatemala"] = "GT";
UTIL.countryCode["Guam"] = "GU";
UTIL.countryCode["Guinea-Bissau"] = "GW";
UTIL.countryCode["Guyana"] = "GY";
UTIL.countryCode["Hong Kong"] = "HK";
UTIL.countryCode["Heard Island and McDonald Islands"] = "HM";
UTIL.countryCode["Honduras"] = "HN";
UTIL.countryCode["Croatia"] = "HR";
UTIL.countryCode["Haiti"] = "HT";
UTIL.countryCode["Hungary"] = "HU";
UTIL.countryCode["Indonesia"] = "ID";
UTIL.countryCode["Ireland"] = "IE";//	UTIL.countryCode["Republic of Ireland"] = "IE";
UTIL.countryCode["Israel"] = "IL";
UTIL.countryCode["Isle of Man"] = "IM";
UTIL.countryCode["India"] = "IN";
UTIL.countryCode["British Indian Ocean Territory"] = "IO";
UTIL.countryCode["Iraq"] = "IQ";
UTIL.countryCode["Iran"] = "IR";//	UTIL.countryCode["Iran, Islamic Republic of"] = "IR";
UTIL.countryCode["Iceland"] = "IS";
UTIL.countryCode["Italy"] = "IT";
UTIL.countryCode["Jersey"] = "JE";
UTIL.countryCode["Jamaica"] = "JM";
UTIL.countryCode["Jordan"] = "JO";
UTIL.countryCode["Japan"] = "JP";
UTIL.countryCode["Kenya"] = "KE";
UTIL.countryCode["Kyrgyzstan"] = "KG";
UTIL.countryCode["Cambodia"] = "KH";
UTIL.countryCode["Kiribati"] = "KI";
UTIL.countryCode["Comoros"] = "KM";
UTIL.countryCode["Saint Kitts and Nevis"] = "KN";
UTIL.countryCode["North Korea"] = "KP";//	UTIL.countryCode["Korea, Democratic People's Republic of"] = "KP";
UTIL.countryCode["South Korea"] = "KR";//	UTIL.countryCode["Korea, Republic of"] = "KR";
UTIL.countryCode["Kuwait"] = "KW";
UTIL.countryCode["Cayman Islands"] = "KY";
UTIL.countryCode["Kazakhstan"] = "KZ";
UTIL.countryCode["Laos"] = "LA";//	UTIL.countryCode["Lao People's Democratic Republic"] = "LA";
UTIL.countryCode["Lebanon"] = "LB";
UTIL.countryCode["Saint Lucia"] = "LC";
UTIL.countryCode["Liechtenstein"] = "LI";
UTIL.countryCode["Sri Lanka"] = "LK";
UTIL.countryCode["Liberia"] = "LR";
UTIL.countryCode["Lesotho"] = "LS";
UTIL.countryCode["Lithuania"] = "LT";
UTIL.countryCode["Luxembourg"] = "LU";
UTIL.countryCode["Latvia"] = "LV";
UTIL.countryCode["Libya"] = "LY";
UTIL.countryCode["Morocco"] = "MA";
UTIL.countryCode["Monaco"] = "MC";
UTIL.countryCode["Moldova, Republic of"] = "MD";//	UTIL.countryCode["Moldova, Republic of"] = "MD";
UTIL.countryCode["Montenegro"] = "ME";
UTIL.countryCode["Collectivity of Saint Martin"] = "MF";//	UTIL.countryCode["Saint Martin (French part)"] = "MF";
UTIL.countryCode["Madagascar"] = "MG";
UTIL.countryCode["Marshall Islands"] = "MH";
UTIL.countryCode["Macedonia, the former Yugoslav Republic of"] = "MK";//	UTIL.countryCode["Republic of Macedonia"] = "MK";
UTIL.countryCode["Mali"] = "ML";
UTIL.countryCode["Myanmar"] = "MM";
UTIL.countryCode["Mongolia"] = "MN";
UTIL.countryCode["Macau"] = "MO";//	UTIL.countryCode["Macao"] = "MO";
UTIL.countryCode["Northern Mariana Islands"] = "MP";
UTIL.countryCode["Martinique"] = "MQ";
UTIL.countryCode["Mauritania"] = "MR";
UTIL.countryCode["Montserrat"] = "MS";
UTIL.countryCode["Malta"] = "MT";
UTIL.countryCode["Mauritius"] = "MU";
UTIL.countryCode["Maldives"] = "MV";
UTIL.countryCode["Malawi"] = "MW";
UTIL.countryCode["Mexico"] = "MX";
UTIL.countryCode["Malaysia"] = "MY";
UTIL.countryCode["Mozambique"] = "MZ";
UTIL.countryCode["Namibia"] = "NA";
UTIL.countryCode["New Caledonia"] = "NC";
UTIL.countryCode["Niger"] = "NE";
UTIL.countryCode["Norfolk Island"] = "NF";
UTIL.countryCode["Nigeria"] = "NG";
UTIL.countryCode["Nicaragua"] = "NI";
UTIL.countryCode["Netherlands"] = "NL";
UTIL.countryCode["Norway"] = "NO";
UTIL.countryCode["Nepal"] = "NP";
UTIL.countryCode["Nauru"] = "NR";
UTIL.countryCode["Niue"] = "NU";
UTIL.countryCode["New Zealand"] = "NZ";
UTIL.countryCode["Oman"] = "OM";
UTIL.countryCode["Panama"] = "PA";
UTIL.countryCode["Peru"] = "PE";
UTIL.countryCode["French Polynesia"] = "PF";
UTIL.countryCode["Papua New Guinea"] = "PG";
UTIL.countryCode["Philippines"] = "PH";
UTIL.countryCode["Pakistan"] = "PK";
UTIL.countryCode["Poland"] = "PL";
UTIL.countryCode["Saint Pierre and Miquelon"] = "PM";
UTIL.countryCode["Pitcairn Islands"] = "PN";//	UTIL.countryCode["Pitcairn"] = "PN";
UTIL.countryCode["Puerto Rico"] = "PR";
UTIL.countryCode["Palestine, State of"] = "PS";//	UTIL.countryCode["State of Palestine"] = "PS";
UTIL.countryCode["Portugal"] = "PT";
UTIL.countryCode["Palau"] = "PW";
UTIL.countryCode["Paraguay"] = "PY";
UTIL.countryCode["Qatar"] = "QA";
UTIL.countryCode["Reunion"] = "RE";//	UTIL.countryCode["Réunion"] = "RE";
UTIL.countryCode["Romania"] = "RO";
UTIL.countryCode["Serbia"] = "RS";
UTIL.countryCode["Russia"] = "RU";//	UTIL.countryCode["Russian Federation"] = "RU";
UTIL.countryCode["Rwanda"] = "RW";
UTIL.countryCode["Saudi Arabia"] = "SA";
UTIL.countryCode["Solomon Islands"] = "SB";
UTIL.countryCode["Seychelles"] = "SC";
UTIL.countryCode["Sudan"] = "SD";
UTIL.countryCode["Sweden"] = "SE";
UTIL.countryCode["Singapore"] = "SG";
UTIL.countryCode["Saint Helena, Ascension and Tristan da Cunha"] = "SH";
UTIL.countryCode["Slovenia"] = "SI";
UTIL.countryCode["Svalbard and Jan Mayen"] = "SJ";
UTIL.countryCode["Slovakia"] = "SK";
UTIL.countryCode["Sierra Leone"] = "SL";
UTIL.countryCode["San Marino"] = "SM";
UTIL.countryCode["Senegal"] = "SN";
UTIL.countryCode["Somalia"] = "SO";
UTIL.countryCode["Suriname"] = "SR";
UTIL.countryCode["South Sudan"] = "SS";
UTIL.countryCode["São Tomé and Príncipe"] = "ST";//	UTIL.countryCode["Sao Tome and Principe"] = "ST";
UTIL.countryCode["El Salvador"] = "SV";
UTIL.countryCode["Sint Maarten (Dutch part)"] = "SX";
UTIL.countryCode["Syria"] = "SY";//	UTIL.countryCode["Syrian Arab Republic"] = "SY";
UTIL.countryCode["Swaziland"] = "SZ";
UTIL.countryCode["Turks and Caicos Islands"] = "TC";
UTIL.countryCode["Chad"] = "TD";
UTIL.countryCode["French Southern and Antarctic Lands"] = "TF";//	UTIL.countryCode["French Southern Territories"] = "TF";
UTIL.countryCode["Togo"] = "TG";
UTIL.countryCode["Thailand"] = "TH";
UTIL.countryCode["Tajikistan"] = "TJ";
UTIL.countryCode["Tokelau"] = "TK";
UTIL.countryCode["East Timor"] = "TL";//	UTIL.countryCode["Timor-Leste"] = "TL";
UTIL.countryCode["Turkmenistan"] = "TM";
UTIL.countryCode["Tunisia"] = "TN";
UTIL.countryCode["Tonga"] = "TO";
UTIL.countryCode["Turkey"] = "TR";
UTIL.countryCode["Trinidad and Tobago"] = "TT";
UTIL.countryCode["Tuvalu"] = "TV";
UTIL.countryCode["Taiwan"] = "TW";//	UTIL.countryCode["Taiwan, Province of China"] = "TW";
UTIL.countryCode["Tanzania"] = "TZ";//	UTIL.countryCode["Tanzania, United Republic of"] = "TZ";
UTIL.countryCode["Ukraine"] = "UA";
UTIL.countryCode["Uganda"] = "UG";
UTIL.countryCode["United States Minor Outlying Islands"] = "UM";
UTIL.countryCode["United States"] = "US";
UTIL.countryCode["Uruguay"] = "UY";
UTIL.countryCode["Uzbekistan"] = "UZ";
UTIL.countryCode["Vatican City"] = "VA";//	UTIL.countryCode["Holy See (Vatican City State)"] = "VA";
UTIL.countryCode["Saint Vincent and the Grenadines"] = "VC";
UTIL.countryCode["Venezuela"] = "VE";//	UTIL.countryCode["Venezuela, Bolivarian Republic of"]  = "VE";
UTIL.countryCode["British Virgin Islands"] = "VG";//	UTIL.countryCode["Virgin Islands, British"] = "VG";
UTIL.countryCode["United States Virgin Islands"] = "VI";//	UTIL.countryCode["Virgin Islands, U.S."] = "VI";
UTIL.countryCode["Vietnam"] = "VN";
UTIL.countryCode["Vanuatu"] = "VU";
UTIL.countryCode["Wallis and Futuna"] = "WF";
UTIL.countryCode["Samoa"] = "WS";
UTIL.countryCode["Yemen"] = "YE";
UTIL.countryCode["Mayotte"] = "YT";
UTIL.countryCode["South Africa"] = "ZA";
UTIL.countryCode["Zambia"] = "ZM";
UTIL.countryCode["Zimbabwe"] = "ZW";

//SWAP key<>value -> value<>key, TODO not support 2 keys with the same value
UTIL.countryCode_SWAP = [];
for(var name in UTIL.countryCode){
	UTIL.countryCode_SWAP[UTIL.countryCode[name]] = name;
}

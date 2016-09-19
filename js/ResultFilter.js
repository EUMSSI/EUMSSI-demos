/* global $, EUMSSI */
var ResultFilter = (function(global, $) {
	"use strict";
	var FIELDS = {
		source: 'source'
	};

	var videoDocuments = {
		filterName: "meta.source.mediaurl",
		query: "meta.source.mediaurl:*",
		filterText: "Video documents"
	};

	function ResultFilter() {

	}

	ResultFilter.prototype = {

		init: function() {
			this._setDomElements();
			this._setEvents();
		},

		analizeRemoveFilter: function(filterObject) {
			// Subscribe to events of deleted from filters
			if (filterObject && filterObject.filterName === "source") {

			}
		},

		_getTwitterTabPosition: function() {
			return EUMSSI.$tabs.tabs("widget").find("#twitterpolarity").data("tabpos");
		},

		_isSocialFilter: function(filterObject) {
			return filterObject.filterText && filterObject.filterText === this._getSocialFilterText();
		},

		_isNewsFilter: function(filterObject) {
			return filterObject.filterText && filterObject.filterText === this._getNewsFilterText();
		},

		_setDomElements: function() {
			var $social = $(".social-media-filters");
			this.$dom = {
				$filtersContainer: $social,
				$socialButton: $social.find(".social"),
				$mediaButton: $social.find(".media"),
				$newsButton: $social.find(".news")
			};
		},

		_setEvents: function() {
			this._getSocialButton().on("click", this._onSocialButtonClick.bind(this));
			this._getMediaButton().on("click", this._onMediaButtonClick.bind(this));
			this._getNewsButton().on("click", this._onNewsButtonClick.bind(this));
		},

		_getSocialButton: function() {
			return this.$dom.$socialButton;
		},

		_getMediaButton: function() {
			return this.$dom.$mediaButton;
		},
		_getNewsButton: function() {
			return this.$dom.$newsButton;
		},

		_onSocialButtonClick: function() {
			this._toggleSocial(true);
			this._generateSocialQuery(this._getSocialFilterText());
		},

		_onNewsButtonClick: function() {
			this._toggleNews(true);
			this._generateNewsQuery(this._getNewsFilterText());
		},

		_generateSocialQuery: function(filterName) {
			var query = this._createSocialFilterQuery();
			this._addFilter(query, filterName);
			this._launchSourceQuery();
		},

		_generateNewsQuery: function(filterName) {
			var query = this._createNewsFilterQuery();
			this._addFilter(query, filterName);
			this._launchSourceQuery();
		},

		_toggleSocial: function(state) {
			this.social = typeof state === "boolean" ? state : false;
		},

//		_createFilterQuery: function() {
//			var values = [];
//			if (this._isSocialActive()) {
//				values = values.concat(this._getSourceFilterNames().social);
//			}
//			if (this._isNewsActive()) {
//				values = values.concat(this._getSourceFilterNames().news);
//			}
//
//			return FIELDS.source + ':("' + values.join('" OR "') + '")';
//		},


		_generateOR: function(values) {
			return FIELDS.source + ':("' + values.join('" OR "') + '")';
		},

		_createSocialFilterQuery: function() {
			var values = [];
			values = values.concat(this._getSourceFilterNames().social);
			return this._generateOR(values);
		},

		_createNewsFilterQuery: function() {
			var values = [];
			values = values.concat(this._getSourceFilterNames().news);
			return this._generateOR(values);
		},

		_addFilter: function(query, filterText) {
			EUMSSI.FilterManager.addFilter(FIELDS.source, query, undefined, filterText);
		},

		_launchSourceQuery: function() {
			EUMSSI.Manager.widgets.result.doRequest();
		},

		_removeSourceQuery: function() {
			EUMSSI.FilterManager.removeFilterByName(FIELDS.source, undefined, true);
		},

		_getSocialFilterText: function() {
			return "Social";
		},

		_getNewsFilterText: function() {
			return "News";
		},

		_getSourceFiltersActive: function() {

		},

		_onMediaButtonClick: function() {
			var filterName = videoDocuments.filterName;
			var query = videoDocuments.query;
			var filterText = videoDocuments.filterText;
			EUMSSI.FilterManager.addFilter(filterName, query, undefined, filterText);
			this._launchSourceQuery();
		},

		_toggleMedia: function() {
			// todo
		},

		_toggleNews: function(state) {
			this.news = typeof state === "boolean" ? state : false;
		},

		_isSocialActive: function() {
			return this.social;
		},

		_isNewsActive: function() {
			return this.news;
		},

		_getSourceFilterNames: function() {
			return {
				social: [
					"youtube-v",
					"Youtube",
					"Twitter"
				],
				news: [
					"DW (Youtube)",
					"DW article",
					"DW audio",
					"DW video",
					"Guardian (Youtube)",
					"News",
					"Wikipedia Events"
				]
			};
		}
	};

	return ResultFilter;
}(window, $));
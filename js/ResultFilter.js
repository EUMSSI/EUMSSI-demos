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
			if (filterObject && filterObject.filterName === "source") {
				this._toggleNews(false);
				this._toggleSocial(false);
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
			this._toggleNews(false);
			this._toggleMedia(false);
			this._removeSourceQuery();
			this._generateQuery();
		},

		_onNewsButtonClick: function() {
			this._toggleNews(true);
			this._toggleSocial(false);
			this._toggleMedia(false);
			this._removeSourceQuery();
			this._generateQuery();
		},

		_generateQuery: function() {
			var query = this._createFilterQuery();
			this._addFilter(query);
			this._launchSourceQuery();
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

		_createFilterQuery: function() {
			var values = [];
			if (this._isSocialActive()) {
				values = values.concat(this._getSourceFilterNames().social);
			}
			if (this._isNewsActive()) {
				values = values.concat(this._getSourceFilterNames().news);
			}

			return FIELDS.source + ':("' + values.join('" OR "') + '")';
		},

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

		_addFilter: function(query) {
			EUMSSI.FilterManager.addFilter(FIELDS.source, query, undefined);
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
			this._toggleNews(false);
			this._toggleSocial(false);
			this._toggleMedia(true);
			this._removeSourceQuery();
			var filterName = videoDocuments.filterName;
			var query = videoDocuments.query;
			var filterText = videoDocuments.filterText;
			EUMSSI.FilterManager.addFilter(filterName, query, undefined, filterText);
			this._launchSourceQuery();
		},

		_toggleMedia: function(state) {
			this.media = typeof state === "boolean" ? state : false;
			if (!this._isMediaActive()) {
				EUMSSI.FilterManager.removeFilterByName(videoDocuments.filterName, undefined, true);
			}
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

		_isMediaActive: function() {
			return this.media;
		},

		_getSourceFilterNames: function() {
			return {
				social: [
					"Twitter"
				],
				news: [
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
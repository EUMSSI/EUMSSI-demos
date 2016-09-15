/*global jQuery, $, _, AjaxSolr, EUMSSI, google */
(function ($) {

	/**
	 * Widget that represents a Dashboard with various widgets
	 * @type {A|*|void}
	 * @augments AjaxSolr.AbstractWidget
	 */
	AjaxSolr.DashboardWidget = AjaxSolr.AbstractWidget.extend({

		start: 0,

		_chartOptions: {},

		init: function() {
			this.$target = $(this.target);
			this.$tabs = this.$target.parents(".tabs-container");
			this.$col1 = this.$target.find(".left-widgets");
			this.$col2 = this.$target.find(".right-widgets");
			this._loadWidgets();
		},

		/**
		 * Initializes the Dashboard Widgets
		 * @private
		 */
		_loadWidgets : function(){
			this.$map = $("<div>").addClass("dashboard-map");
			this.$people = $("<div>").addClass("dashboard-people");
			this.$wordcloud = $("<div>").addClass("dashboard-wordcloud");
			this.$result = $("<div>").addClass("dashboard-result resultWidget-placeholder result-panel-content");
			this.$twitter = $("<div>").addClass("dashboard-twitter polarity-placeholder");

			this.$col1.find(".row-1").append(this.$map);
			this.$col1.find(".row-2 .col-2").eq(0).append(this.$people);
			this.$col1.find(".row-2 .col-2").eq(1).append(this.$wordcloud);
			this.$col2.append(this.$twitter);

			EUMSSI.Manager.addWidget(new AjaxSolr.MapChartWidget({
				id: "dashboard-MapChartWidget",
				target: this.$map[0]
			}));

			EUMSSI.Manager.addWidget(new AjaxSolr.TagcloudWidget({
				id: 'dashboard-TagCloudWidget',
				target: this.$people[0],
				field: EUMSSI.CONF.PERSON_FIELD_NAME,
				maxItems : 20
			}));

			EUMSSI.Manager.addWidget(new AjaxSolr.GenericWordCloudWidget({
				id: 'dashboard-genericwordcloud',
				target: this.$wordcloud[0],
				maxWords: 50
			}));

			EUMSSI.Manager.addWidget(new AjaxSolr.TwitterPolarityWidget({
				id: 'dashboard-twitter',
				target: this.$twitter[0],
				renderOnClosedOnly: true
			}));
		}
	});

})(jQuery);


/*global jQuery, $, _, AjaxSolr, EUMSSI, google */
(function ($) {

	/**
	 * Widget that represents a Dashboard with various widgets
	 * @type {A|*|void}
	 * @augments AjaxSolr.AbstractWidget
	 */
	AjaxSolr.DashboardWidget = AjaxSolr.AbstractWidget.extend({

		start: 0,	//Reset the pagination with doRequest on this Widget

		_chartOptions: {},

		init: function() {
			this.$target = $(this.target);
			this.$tabs = this.$target.parents(".tabs-container");

			this.$col1 = this.$target.find(".left-widgets");
			this.$col2 = this.$target.find(".right-widgets");

			this._loadWidgets();

			EUMSSI.EventManager.on("leftside", this._render.bind(this));
		},

		/**
		 * Initializes the Dashboard Widgets
		 * @private
		 */
		_loadWidgets : function(){
			this.$map = $("<div>").addClass("dashboard-map");
			this.$people = $("<div>").addClass("dashboard-people");
			this.$wordcloud = $("<div>").addClass("dashboard-wordcloud");

			this.$col2.find(".right-row-1").append(this.$map);
			this.$col2.find(".right-row-2 .col-2").eq(0).append(this.$people);
			this.$col2.find(".right-row-2 .col-2").eq(1).append(this.$wordcloud);

			EUMSSI.Manager.addWidget(new AjaxSolr.MapChartWidget({
				id: "dashboard-MapChartWidget",
				target: this.$map[0]
			}));

			EUMSSI.Manager.addWidget(new AjaxSolr.TagcloudWidget({
				id: 'dashboard-TagCloudWidget',
				target: this.$people[0],
				field: EUMSSI.CONF.PERSON_FIELD_NAME,
				maxItems : 25
			}));

			EUMSSI.Manager.addWidget(new AjaxSolr.GenericWordCloudWidget({
				id: 'dashboard-genericwordcloud',
				target: this.$wordcloud[0],
				maxWords: 50
			}));
		},

		beforeRequest: function() {
			return true;
		},

		afterRequest: function() {
			if(!this.manager.flag_PaginationRequest) {
				if(this.chart) {
					this._render();
				} else {
					this._loadAfterInit = true;
				}
			}
		},

		_render: function() {
			this._renderIfTabActivated();
		},

		_renderIfTabActivated: function(){
			var tabPosition = this.$target.parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this._refresh();
			} else {
				this.$tabs.off("tabsactivate.dashboardwidget");
				this.$tabs.on("tabsactivate.dashboardwidget", this._tabChange.bind(this));
			}
		},

		/**
		 * Check if the current open tab is this widget tab and then load it
		 * @private
		 */
		_tabChange: function(){
			var tabPosition = this.$target.parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this.$tabs.off("tabsactivate.dashboardwidget");
				this._refresh();
			}
		},

		/**
		 * Reload the Dashboard
		 * @private
		 */
		_refresh: function(){

		}

	});

})(jQuery);


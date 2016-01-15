(function ($) {
	AjaxSolr.GenericGraphWidget = AjaxSolr.AbstractFacetWidget.extend({
		init: function() {
			this.$target = $(this.target);
			this.$tabs = $(this.target).parents(".tabs-container");
			this.apiURL = "http://demo.eumssi.eu/EumssiEventExplorer/webresources/API/";
			this.wordNumber = 100;
			this.graphSize = 200;
			this.storyTelling = 10;
			this.field = EUMSSI.CONF.CLOUD_FIELD_NAME;
			this.tf = [];
			this.pivots = "";
			this.maxCount =0;
			this.$target.parent().find(".genericgraph-key-selector").selectmenu({
				width: 200,
				select: function( event, data ) {
					console.log("Selected: " + data.item.value);
					if(this.field != data.item.value){
						this._onSelectKey(data.item.value);
					}
					$("#selectedD3Node1").hide();
				}.bind(this)
			});
			
		},

		afterRequest: function () {
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");

			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this._getGraph();
			} else {
				this.$tabs.off("tabsactivate.genericgraphwidget");
				this.$tabs.on("tabsactivate.genericgraphwidget", this._tabChange.bind(this) );
			}
		},

		/**
		 * Check if the current open tab is this widget tab and then load the widget
		 * @private
		 */
		_tabChange: function(){
			var tabPosition = $(this.target).parents(".ui-tabs-panel").data("tabpos");
			if(this.$tabs.tabs( "option", "active") === tabPosition) {
				this.$tabs.off("tabsactivate.genericgraphwidget");
				this._getGraph();
			}
		},

		_getGraph: function(filter){
			var language = $(".localeSelector").val();
			$("#selectedD3Node1").hide();

			if (!language)
				language = "all";
			console.log("Filter123: " + language);
			var filterValue = filter;
			if (!filter) {
				filterValue="*";
			}			
			
			var q = EUMSSI.Manager.getLastQuery() || "*";
			//var cont = EUMSSI.Manager.getLastQuery();
			//var lastquery = cont.split(":");
			//q = lastquery[1]| "*"
			//Loading
			$(this.target).addClass("ui-loading-modal");
			$(this.target).empty();


			var facet, count, i, l, size, tabPosition;
			this.maxCount = 0;
			this.tf = [];
			for ( facet in this.manager.response.facet_counts.facet_fields[this.field]) {
				count = parseInt(this.manager.response.facet_counts.facet_fields[this.field][facet]);
				if (count > this.maxCount) {
					this.maxCount = count;
				}
				this.tf.push({ text: facet, size: count });
			}
			this.tf.sort(function (a, b) {
				return a.facet < b.facet ? -1 : 1;
			});

			var q = EUMSSI.Manager.getLastQuery() || "*:*";
			this.pivots = this.field + "," + this.field;
			var p_url = "select?q=" + q + "&rows=0&wt=json&facet=true&facet.pivot=" + this.pivots;
			var filters = EUMSSI.FilterManager.getFilterQueryString(["meta.source.datePublished","meta.source.inLanguage", "source", this.field]);
			p_url +="&fq=" + encodeURIComponent(filters);

			console.log(p_url);
			console.log(this.pivots);
			$.ajax({
				url: this.manager.solrUrl + p_url,
				success: this._onGetWordGraph.bind(this)
			});


		},



//		_getGraph: function(filter){
//			var filterValue = filter;
//			if (!filter) {
//				filterValue="*";
//			}
//			
//			var q = EUMSSI.Manager.getLastQuery() || "*";
//			
//			//Loading
//			$(this.target).addClass("ui-loading-modal");
//			$(this.target).empty();
//			$.when(
//				$.ajax( this.apiURL + "getSemanticCloud/json/"+this.wordNumber+"/" + q + "/all/" + this.field  + "/" + filterValue),
//				$.ajax( this.apiURL + "getSemanticGraph/json/"+this.graphSize+"/" + q + "/all/" + this.field  + "/" + filterValue)
//			).done(this._onGetWordGraph.bind(this));
//		},
//		
		
		_getStoryTelling: function(a1, a2){
			
			//Loading
			$(this.target).addClass("ui-loading-modal");
			$(this.target).empty();
			
			$.ajax({
				url: this.apiURL + "storyTelling/json/"+this.storyTelling+"/" + a1 + "/" + a2 + "/all",
				success: this._onStoryTellingGraph.bind(this)
			});
		},

		/**
		 *
		 * @param {object} response
		 * @param {number} response.size
		 * @param {string} response.text
		 * @private
		 */
		_onGetWordGraph: function(responsestr){
			keys = {};
			target_keys = {};

			for (var ik in this.tf) {
				keys[this.tf[ik]['text']] = 1;
			}

			links = [];
			response = JSON.parse(responsestr);
			var temp = response['facet_counts'];
			var facet_pivots = response['facet_counts']['facet_pivot'][this.pivots];

			var max_freq = 0;
			// indexing
			for (var i in facet_pivots) {
				obi = facet_pivots[i];

				source_item = obi['value'];
				if (keys[source_item] == undefined) {
					anode = {'text': source_item, 'size': obi['count']};
					this.tf.push(anode);
					keys[source_item] = 1;
					if (obi['count'] > this.maxCount) {
						this.maxCount = obi['count'];
					}
				}

				for (var j in obi['pivot']) {
					obj = obi['pivot'][j];
					target_item = obj['value'];
					if (source_item == target_item) {
						continue;
					}
					link = {'source': source_item, 'target': target_item, 'weight': obj['count']};
					links.push(link);

					if (j ==1 && max_freq < obj['count']) max_freq = obj['count'];
					if (j>10) {
						break;
					}
				}
			}

			console.log(max_freq);
			console.log("Linksize: ", links.length);
			// filtering
			var MAX_REND = 10;
			final_links = [];
			final_nodes = [];

			for (var il in links) {
				link = links[il];
				if (link.weight >= 0.04 * max_freq && link.weight >1) {
					link.weight = Math.round(MAX_REND *  link.weight / max_freq); 		//normalization
					final_links.push(link);
					target_keys[link.target] = link.weight;
					target_keys[link.source] = link.weight;
				}
			}
			for (itf in this.tf) {
				kw = this.tf[itf].text;
				if (target_keys[kw] == undefined) {
					continue;
				}
				final_nodes.push(this.tf[itf]);
			}
			for (var tk in target_keys) {
				if (keys[tk] == undefined) {
					this.tf.push({'text': tk, 'size': target_keys[tk]});
					final_nodes.push({'text': tk, 'size': target_keys[tk]});
					keys[tk] = 1;
					if (target_keys[tk] > this.maxCount) {
						this.maxCount = target_keys[tk];
					}
				}
			}
			console.log("Final links size", final_links.length);
			//this._renderGraph(this.tf, final_links, MAX_REND);
			this._renderGraph(final_nodes, final_links, MAX_REND);
			$(this.target).removeClass("ui-loading-modal");
		},

		
		_onStoryTellingGraph: function(links){
			//console.log(links);
			var tf = {};
			this._renderGraph(tf,links);
			$(this.target).removeClass("ui-loading-modal");
		},

		
		_renderGraph: function(tf, links, max_freq){
			var pinned_nodes = [];
			
			var self = this;
			var nodes = {};
			var max_size = 50;

			var scale = max_size / this.maxCount;
			for (var i in tf) {
				tf[i].size = 10 + tf[i].size * scale;
				nodes[tf[i].text] = {name: tf[i].text, size: tf[i].size, color: "purple", group:1};
			}


			//Set up color scale
			var color = d3.scale.category10();

			// Compute the distinct nodes from the links.
			links.forEach(function(link) {
				//link.source = nodes[link.source];
				//link.target = nodes[link.target];
				link.value = link.weight;
				link.weight = link.value;
				link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, size: 10, color: "purple"});
				link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, size: 10, color: "purple"});
			});
			// SVG constants
			var width = 1060,
				height = 800;
			// Setup the force layout
			var force = d3.layout.force()
				.nodes(d3.values(nodes))
				.links(links)
				.size([width, height])
				.linkDistance(300)
				.charge(-80)
				.on("tick", tick)
				.start();
			// Append SVG to the html, with defined constants
			var svg = d3.select("#my-genericgraph").append("svg")
				.attr("width", "100%")
				.attr("height", height);
			// Code for pinnable nodes
			var node_drag = d3.behavior.drag()
				.on("dragstart", dragstart)
				.on("drag", dragmove)
				.on("dragend", dragend);
			function dragstart(d, i) {
				force.stop(); // stops the force auto positioning before you start dragging
			}
			function dragmove(d, i) {
				d.px += d3.event.dx;
				d.py += d3.event.dy;
				d.x += d3.event.dx;
				d.y += d3.event.dy;
			}
			function dragend(d, i) {
				
				d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
				d3.select(this).select("text").style("fill", "#FF8800"); // change color to orange
				pinned_nodes.push(d.name);

				/** storytelling action


				 //if (pinned_nodes.length ==2) {
				//	self._getStoryTelling(pinned_nodes[0], pinned_nodes[1]);
				//	$("#selectedD3Node1").text("Telling story: " + pinned_nodes[0] + " <-> " + pinned_nodes[1]);
				//	pinned_nodes = [];
				//}
				//else
				//	$("#selectedD3Node1").text("Selected: " + d.name);

				 */

				force.resume();
				console.log("Selected: " + d.name);
				$("#selectedD3Node1").text("Selected: " + d.name);
				$("#selectedD3Node1").show();
			}
			function releasenode(d) {
				d.fixed = false; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
				d3.select(this).select("text").style("fill", function (d,i) { return color(i); }); // set back to original color
				linktext = d3.select(this).select("text").text();
				console.log(linktext + " is pinned");
				//force.resume();
			}

			// Create lines for the links, without location
			// Note that link attributes are defined in css
			var link = svg.selectAll(".link")
				.data(force.links())
				.enter().append("line")
				.attr("class", "link")
				.style('stroke', function(l) {
					if (l.weight >0.5 * max_freq) {
						return '#9f9f9f';
					}
					else {
						return '#dbdbdb';
					}
			    })
				.style('stroke-width', function(l) {
					return l.weight;
				});

			// Add circles to nodes and call the drag function
			var node = svg.selectAll(".node")
				.data(force.nodes())
				.enter().append("g")
				.attr("class", "node")
				.on("mouseover", mouseover)
				.on("mouseout", mouseout)
				.on("click", mouseclick)
				.on('dblclick', releasenode) //added
				.call(node_drag); //added
			//.call(force.drag)
			// Circles are needed for dragging, find out how to get rid of them
			node.append("circle")
				.attr("r", 6)
				.style("fill", "#D4D94A");
			// Now we also append text
			var TextColorScale = d3.scale.linear()
				.domain([0, d3.max(tf, function(d) { return d.size; })])
				.range([255,0]);
			node.append("text")
				.attr("x", 0)
				.attr("dy", ".35em")
				.style("font-size", function(d) { return d.size + "px"; })
				.style("font-family", "Impact")
				.style("fill", function (d,i) { return color(i); })
				.text(function(d) { return d.name; });

			// This function magically does the force-directed layout
			function tick() {
				link
					.attr("x1", function(d) { return d.source.x; })
					.attr("y1", function(d) { return d.source.y; })
					.attr("x2", function(d) { return d.target.x; })
					.attr("y2", function(d) { return d.target.y; })
				;
				node
					.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" ;
						node.each(collide(0.5)); //Added
					});
			}
			// Text becomes larger on mouseover (not really needed)
			function mouseover() {
				d3.select(this).select("circle").transition()
					.duration(750)
					.attr("r", 16);
				d3.select(this).select("text").style("font-size", function(d) { return (d.size + 20)  + "px"; });
			}
			function mouseout() {
				d3.select(this).select("circle").transition()
					.duration(750)
					.attr("r", 8);
				d3.select(this).select("text").style("font-size", function(d) { return (d.size)  + "px"; });
			}

			// Follow link when clicked on text
			function mouseclick() {
				linktext = d3.select(this).select("text").text();
				// For now, we open just the Google search results - should be replaced by new word cloud on this entity
				//window.open("https://www.google.com/?gws_rd=ssl#q="+linktext);
				self.setFilter(linktext);
				self._getGraph(linktext);
				
			}

			// Search functionality (copied/paste from http://www.coppelia.io/2014/07/an-a-to-z-of-extra-features-for-the-d3-force-layout/

			var optArray = [];
			//for (var i = 0; i < graph.nodes.length - 1; i++) {
			//	optArray.push(graph.nodes[i].name);
			//}
			optArray = optArray.sort();
			$(function () {
				$("#search").autocomplete({
					source: optArray
				});
			});
			function searchNode() {
				//find the node
				var selectedVal = document.getElementById('search').value;
				var node = svg.selectAll(".node");
				if (selectedVal == "none") {
					node.style("stroke", "white").style("stroke-width", "1");
				} else {
					var selected = node.filter(function (d, i) {
						return d.name != selectedVal;
					});
					selected.style("opacity", "0");
					var link = svg.selectAll(".link");
					link.style("opacity", "0");
					d3.selectAll(".node, .link").transition()
						.duration(5000)
						.style("opacity", 1);
				}
			}
			// Collission Detection

			var padding = 1, // separation between circles
				radius=8;
			function collide(alpha) {
				var quadtree = d3.geom.quadtree(graph.nodes);
				return function(d) {
					var rb = 2*radius + padding,
						nx1 = d.x - rb,
						nx2 = d.x + rb,
						ny1 = d.y - rb,
						ny2 = d.y + rb;
					quadtree.visit(function(quad, x1, y1, x2, y2) {
						if (quad.point && (quad.point !== d)) {
							var x = d.x - quad.point.x,
								y = d.y - quad.point.y,
								l = Math.sqrt(x * x + y * y);
							if (l < rb) {
								l = (l - rb) / l * alpha;
								d.x -= x *= l;
								d.y -= y *= l;
								quad.point.x += x;
								quad.point.y += y;
							}
						}
						return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
					});
				};
			}


		},
		
		
		_onSelectKey: function(keyValue){
			this.field = EUMSSI.CONF.CLOUD_FIELD_NAME = keyValue;
			//this.field = keyValue;
			EUMSSI.CONF.updateFacetingFields();
			this.clearFilter();
			EUMSSI.Manager.doRequest(0);
		},

		/**
		 * Sets the main Solr query to the given string.
		 * @param {String} attributeName The name of the filter key.
		 * @param {String} value the value for the filter.
		 */
		setFilter: function (value) {
			//Set the current Filter
			this.storedValue = this.field + ":" + value;
			EUMSSI.FilterManager.addFilter(this.field, this.storedValue, this.id, this.field+": "+value);
			$("#selectedD3Node1").hide();
		}, 

		/**
		 * Sets the main Solr query to the empty string.
		 * @param {Boolean} [silent] true, if don't want to trigger the change event
		 */
		clearFilter: function (silent) {
			EUMSSI.FilterManager.removeFilterByWidget(this.id, silent);
		}

		//_onWordClick: function(d){
		//	var fq = "GENERAL_SEARCH:" + d.text;
		//	EUMSSI.FilterManager.removeFilterByName("GENERAL_SEARCH");
		//	EUMSSI.FilterManager.addFilter("GENERAL_SEARCH", fq, this.id);
		//	EUMSSI.Manager.doRequest(0);
		//}

	});

})(jQuery);

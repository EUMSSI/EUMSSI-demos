(function ($) {

	AjaxSolr.WordGraphWidget = AjaxSolr.AbstractFacetWidget.extend({

		init: function() {
			this.$target = $(this.target);
			this.apiURL = "http://eumssi.cloudapp.net/EumssiEventExplorer/webresources/API/";
			this.wordNumber = 50;
		},

		afterRequest: function () {
			this.getGraph();
		},

		getGraph: function(filterWord){
			var q = "";
			if(filterWord){
				q = ""+filterWord;
			} else {
				q = EUMSSI.Manager.getLastQuery() || "*%3A*";
			}
			//Loading
			$(this.target).addClass("ui-loading-modal");
			$(this.target).empty();
			$.when(
				$.ajax( this.apiURL + "getWordCloud/json/"+this.wordNumber+"/" + q ),
				$.ajax( this.apiURL + "getGraph/json/"+this.wordNumber+"/" + q )
			).done(this._onGetWordGraph.bind(this));
		},

		/**
		 *
		 * @param {object} response
		 * @param {number} response.size
		 * @param {string} response.text
		 * @private
		 */
		_onGetWordGraph: function(tf, links){
			this._renderGraph(tf[0], links[0]);
			$(this.target).removeClass("ui-loading-modal");
		},

		_renderGraph: function(tf, links){
			var nodes = {};
			var size = 500;

			var scale = 1;

			var max_size = size/tf.length;
			for (var i in tf) { // get the scale
				scale = 8 * max_size / tf[i].size;
				break;
			}
			//update

			for (var i in tf) {
				tf[i].size = 12 + tf[i].size * scale;
				nodes[tf[i].text] = {name: tf[i].text, size: tf[i].size, color: "purple"};
			}


			//Set up color scale
			var color = d3.scale.category10();

			// Compute the distinct nodes from the links.
			links.forEach(function(link) {
				link.source = nodes[link.source];
				link.target = nodes[link.target];
				//link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
				//link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
			});
			// SVG constants
			var width = 1060,
				height = 800;
			// Setup the force layout
			var force = d3.layout.force()
				.nodes(d3.values(nodes))
				.links(links)
				.size([width, height])
				.linkDistance(200)
				.charge(-300)
				.on("tick", tick)
				.start();
			// Append SVG to the html, with defined constants
			var svg = d3.select("#my-wordgraph").append("svg")
				.attr("width", width)
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
				force.resume();
			}
			function releasenode(d) {
				d.fixed = false; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
				d3.select(this).select("text").style("fill", function (d,i) { return color(i); }); // set back to original color
				//force.resume();
			}

			// Create lines for the links, without location
			// Note that link attributes are defined in css
			var link = svg.selectAll(".link")
				.data(force.links())
				.enter().append("line")
				.attr("class", "link");
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
				window.open("https://www.google.com/?gws_rd=ssl#q="+linktext);
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


		}

		//_onWordClick: function(d){
		//	var fq = "GENERAL_SEARCH:" + d.text;
		//	EUMSSI.FilterManager.removeFilterByName("GENERAL_SEARCH");
		//	EUMSSI.FilterManager.addFilter("GENERAL_SEARCH", fq, this.id);
		//	EUMSSI.Manager.doRequest(0);
		//}

	});

})(jQuery);

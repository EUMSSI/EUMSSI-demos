		//var dataobject = '<s:property escape = "false"  value="tfjson"/>';
		//var tf = JSON.parse(dataobject);
		//tf is an arraylist of object with .text "word" and .size freq
		var size = 500;
		
		var scale = 1;
		
		
		var max_size = size/tf.length;
		for (var i in tf) {
		        scale = 7.0 * max_size / tf[i].size;
		        console.log("scale is ", scale);
		        break;
		}

		//update 
		for (var i in tf) {
		       tf[i].size = 10 + tf[i].size * scale;
		}
		console.log("data is: ", tf);
		var fill = d3.scale.category20();
		
		  d3.layout.cloud().size([size * 2, size * 2])
		      .words(tf)
		      .padding(5)
		      .rotate(function() { return ~~(-1) * (Math.random() * 2); })
		      .font("Impact")
		      .fontSize(function(d) { return d.size; })
		      .on("end", draw)
		      .start();
		  function draw(words) {
		    d3.select("#my-wordcloud").append("svg")
		        .attr("width", size*2)
		        .attr("height", size*2)
		      .append("g")
		        .attr("transform", "translate(450,350)")
		      .selectAll("text")
		        .data(words)
		      .enter().append("text")
		        .style("font-size", function(d) { return d.size + "px"; })
		        .style("font-family", "Impact")
		        .style("fill", function(d, i) { return fill(i); })
		        .attr("text-anchor", "middle")
		        .attr("transform", function(d) {
		          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
		        })
		        .text(function(d) { return d.text; })
		        .on("mouseover", function(d) {
					  d3.select(this).style("font-size", function(d) { return (d.size + 20)  + "px"; })})
				 .on("mouseleave", function(d) {
				  	 d3.select(this).style("font-size", function(d) { return (d.size)  + "px"; })})
		        .on("click", function (d){
		        	alert(d.text);
      			});
		  }
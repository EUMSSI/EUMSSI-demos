(function ($) {

	AjaxSolr.WordCloudWidget = AjaxSolr.AbstractFacetWidget.extend({

		init: function() {
			this.$target = $(this.target);
		},

		afterRequest: function () {
			//get term frequency into tf= [{"text", "size"}] value
			tf = [];
			var words = {};

       		var wcmaxwords = 100; 
       		var maxitem = 100;
       		

       		var wccounter = 0;
			for (var i = 0; i < this.manager.response.response.docs.length; i++) {
				var doc = this.manager.response.response.docs[i];
				var desc = doc['meta.source.text'];
				if (!!desc && desc.length>0) {
					
					var nonstopdesc = desc.removeStopWords();
					wccounter = wccounter + 1;
					if (wccounter == maxitem) { break; }
				
					var res = nonstopdesc.split(" ");
					for (var j = 0; j < res.length; j++) {
						if (!!words[res[j]]) {
							words[res[j]] = words[res[j]] +1;
						}
						else {
							
							words[res[j]] = 1;
						}
					}
				}
			}


			

			var keys = []; 
			for(var key in words) keys.push(key);
    		keys.sort(function(a,b){return words[b]-words[a]});


    		for (var j=0; j <keys.length; j++) {
    			var w = keys[j];
    			var obj = {};
    			obj["text"] = w;
    			obj["size"] = words[w];
    			tf.push(obj);	
    			if (tf.length>wcmaxwords) {break;}
			}

			$(this.target).empty();
			$(this.target).append("<script src=\"js/d3wordcloud.js\"></script>");

		},

	});

})(jQuery);

/*global jQuery, $, _, AjaxSolr, EUMSSI*/
function FilterManager(){

	/**
	 * @type {Object[]} filters - the temporal queries for the filter query
	 * @param {String} filterName - Name of the filter, usually the field that affects
	 * @param {String} query - the filter query for Solr
	 * @param {String} [widgetId] - the widget that attach the filter
	 * @param {String} [filterText] - Auxiliar text to display the filter
	 * @private
	 */
	this._filters = [];
}

_.extend(FilterManager.prototype, {

	/* FILTERS API */

	/**
	 * Get all the filters Array
	 * @returns {Object[]}
	 */
	getAllFilters: function(){
		return this._filters;
	},

	/**
	 * Return An array with the filters that match with the parameters
	 * @param {String} filterName - name to recognize the filter, usually the field for the filter
	 * @param {String} [widgetId] - If of the widget that apply the filter
	 * @param {String} query - the query
	 * @returns {Array.<Object>|*}
	 */
	getFilters: function(filterName, widgetId, query){
		var f = {};
		if(filterName){ f.filterName = filterName; }
		if(query){ f.query = query; }
		if(widgetId){ f.widgetId = widgetId; }

		return _.filter(this._filters,function(filter){
			if(_.isMatch(filter,f)){
				return true;
			}
		});
	},

	/**
	 * Add a filter to be used on the filter query.
	 * @param {String} filterName - name to recognize the filter, usually the field for the filter
	 * @param {String} query - the query
	 * @param {String} [widgetId] - If of the widget that apply the filter
	 * @param {String} [filterText] - Auxiliar text to display the filter
	 * @returns {{filterName: *, query: *, widgetId: *}}
	 */
	addFilter: function(filterName, query, widgetId, filterText){
		console.log("Manager > addFilter: "+filterName+" | "+query+" | "+widgetId+" | "+filterText);
		var filter = {
			filterName: filterName,
			query: query,
			widgetId: widgetId,
			filterText: filterText
		};

		this._filters.push(filter);
		EUMSSI.EventManager.trigger("filterChange:"+filterName, filter);
		return filter;
	},

	/**
	 * Removes a filter with a especific parameters {filterName}
	 * @param {String} filterName - the filter to be removed
	 * @param {String} widgetId - the widgetId that added the filter to be removed
	 * @param {String} query - the query for the widgets to be eliminated
	 * @param {Boolean} [silent] - true, if don't want to trigger the change event
	 */
	removeFilter: function(filterName, widgetId, query, silent){
		console.log("Manager >  removeFilterByName: "+filterName+" | "+widgetId+" | "+query);

		var f = {},
			removedFilter;
		if(filterName){ f.filterName = filterName; }
		if(query){ f.query = query; }
		if(widgetId){ f.widgetId = widgetId; }

		this._filters = _.reject(this._filters,function(filter){
			if(_.isMatch(filter,f)){
				removedFilter = filter;
				return true;
			}
		});
		if(removedFilter && !silent){
			EUMSSI.EventManager.trigger("filterChange:"+removedFilter.filterName);
	}
	},

	/**
	 * Check if a Filter exist
	 * @param {String} filterName - the filter to be removed
	 * @param {String} widgetId - the widgetId that added the filter to be removed
	 * @param {String} query - the query for the widgets to be eliminated
	 * @returns {Boolean}
	 */
	checkFilter: function(filterName, widgetId, query){
		var f = {};
		if(filterName){ f.filterName = filterName; }
		if(query){ f.query = query; }
		if(widgetId){ f.widgetId = widgetId; }

		return _.isObject(_.find(this._filters,function(filter){
			if(_.isMatch(filter,f)){
				return true;
			}
		}));
	},

	cleanFilter: function(){
		delete this._filters;
		this._filters = [];
	},

	removeFilterByName: function(filterName, widgetId, silent){
		if(filterName){
			this.removeFilter(filterName, widgetId, null, silent);
		}
	},

	removeFilterByWidget: function(widgetId, silent){
		if( widgetId ) {
			this.removeFilter(null, widgetId, null, silent);
		}
	},

	removeFilterByQuery: function(query, silent){
		if( query ) {
			this.removeFilter(null, null, query, silent);
		}
	},

	removeFilterObject: function(filter, silent){
		if( _.isObject(filter) ) {
			this.removeFilter(filter.filterName, filter.widgetId, filter.query, silent);
		}
	},

	checkFilterByName: function(filterName){
		return this.checkFilter(filterName,null,null);
	},

	checkFilterByWidgetId: function(widgetId){
		return this.checkFilter(null,widgetId,null);
	},

	/**
	 * Generate a filter query String with the current filters
	 * @private
	 */
	getFilterQueryString: function(){
		var fq = "", q = [];
		_.each(this._filters,function(filterObj){
			//Detect special cases
			switch(filterObj.filterName){
				case "GENERAL_SEARCH" :
					q.push(this._parseGeneralFilter(filterObj.query.replace("GENERAL_SEARCH"+":","")));
					break;
				default:
					q.push(filterObj.query);
			}
		},this);

		if(q.length > 0){
			fq = "+(" + q.join(") +(") + ")";
		}

		return fq;
	},

	/* end FILTERS API end */

	/**
	 * Creates a Query with the general search fields with the given value.
	 * @param {string} value - the value of the search
	 * @returns {string} "field1:value OR field2:value OR field3:value ..."
	 * @private
	 */
	_parseGeneralFilter : function(value){
		var searchQueries = [];
		var searchFields = [
			"meta.source.text",
			"meta.source.description",
			"meta.source.category",
			"meta.source.headline",
			"meta.source.author",
			"meta.extracted.audio_transcript",
			"meta.extracted.video_ocr.best",
			"meta.source.keywords"
		];

		if(value){
			var fqval = this._buildQuerySimpleSearchAssets(value);
			console.log("### BUSQUEDA ###\n "+fqval);
			_.each(searchFields,function(val){
				searchQueries.push(val + ":" + fqval);
			});
		}

		return searchQueries.join(" OR ");
	},



	_buildQuerySimpleSearchAssets: function(valorBusqueda) {
		var fqval = "";

		fqval = this._escapeSpecialChars(valorBusqueda);
		fqval = this._buildTextSearchValue(fqval);

		return fqval;
	},

	_escapeSpecialChars: function(valorBusqueda){
		if (valorBusqueda != "*" ){
			valorBusqueda = valorBusqueda.replace("\\", "\\\\");//Modificamos las '\' primero, porque para el resto de caracteres de escape se añaden '\'
			valorBusqueda = valorBusqueda.replace("+", "\\+");
			valorBusqueda = valorBusqueda.replace("-", "\\-");
			valorBusqueda = valorBusqueda.replace("&", "\\&");
			valorBusqueda = valorBusqueda.replace("|", "\\|");
			valorBusqueda = valorBusqueda.replace("!", "\\!");
			valorBusqueda = valorBusqueda.replace("{", "\\{");
			valorBusqueda = valorBusqueda.replace("}", "\\}");
			valorBusqueda = valorBusqueda.replace("[", "\\[");
			valorBusqueda = valorBusqueda.replace("]", "\\]");
			valorBusqueda = valorBusqueda.replace("^", "\\^");
			valorBusqueda = valorBusqueda.replace(":", "\\:");
			//valorBusqueda = valorBusqueda.Replace("\"", "\\\"");  //No escapamos para permitir búsquedas de frases
			//valorBusqueda = valorBusqueda.Replace("~", @"\~");    //No escapamos, para permitir búsquedas de cercanía al user
			//valorBusqueda = valorBusqueda.Replace("*", @"\*");    //No escapamos, para permitir búsquedas con wildcards al user
			//valorBusqueda = valorBusqueda.Replace("?", @"\?");    //No escapamos, para permitir búsquedas con wildcards al user
			//valorBusqueda = valorBusqueda.Replace("(", @"\(");	//No escapamos, para permitir búsquedas con agrupaciones Ej: a AND (b OR c)
			//valorBusqueda = valorBusqueda.Replace(")", @"\)");	//No escapamos, para permitir búsquedas con agrupaciones Ej: a AND (b OR c)

			valorBusqueda = this._checkUseNearOperator(valorBusqueda);
			valorBusqueda = this._checkUseWildcards(valorBusqueda);
			valorBusqueda = this._checkWrongUseLogicalOperators(valorBusqueda);
		}
		return valorBusqueda;

	},

	/**
	 * Extracheck
	 * Cuando se utiliza el operador de cercanía, los términos de búsqueda deben ir entre ", pq si no solr interpreta el operador ~
	 * como si fuera un FuzzyQuery, y si el valor de cercanía es mayor que 1 (que seguramente lo sea, porque de lo contrario no tiene
	 * mucho sentido), el query a Solr da ERROR de parseo y dice: Minimum similarity for a FuzzyQuery has to be between 0.0f and 1.0f !
	 * Si el user utiliza el operador ~, comprobar que los términos los ha colocado entre ", si no, añadirlas!!
	 * @param valorBusqueda
	 * @returns {*}
	 * @private
	 */
	_checkUseNearOperator: function(valorBusqueda){
		var index = valorBusqueda.indexOf('~');
		if (index >= 0) {
			if (valorBusqueda[index - 1] != '\"'){
				valorBusqueda = valorBusqueda.slice(0,index) + "\"" + valorBusqueda.slice(index + 1);
			}
			if (valorBusqueda[0] != '\"'){
				valorBusqueda = "\"" + valorBusqueda;
			}
		}
		return valorBusqueda;
	},

	/**
	 * @param valorBusqueda
	 * @returns {string}
	 * @private
	 */
	_checkUseWildcards: function(valorBusqueda){
		var newValorBusqueda = "";
		// Extracheck
		// COPIADO DE MAM
		// Hay un bug en esta versión de solr, que cuando se usan los wildcards * o ?, la búsqueda es caseSensitive.
		// Lo convertimos todo a lowercase para evitar este problema, hasta que actualicemos versión de solr.
		// Ojo con convertir a lowercase operadores lógicos!!!!
		if (valorBusqueda.indexOf('*') >= 0 || valorBusqueda.indexOf('?') >= 0) {
			var arrayTokens = valorBusqueda.split(' ');
			for(var token in arrayTokens) {
				if (token === "AND" || token === "OR" || token === "NOT"){
					newValorBusqueda += token;
				} else {
					newValorBusqueda += token.toLowerCase();
				}
				newValorBusqueda += " ";
			}
		} else {
			newValorBusqueda = valorBusqueda;
		}
		return newValorBusqueda;
	},

	/**
	 * Extracheck
	 * @param valorBusqueda
	 * @returns {*}
	 * @private
	 */
	_checkWrongUseLogicalOperators: function(valorBusqueda) {
		var strVal = valorBusqueda.trim();
		if (strVal === "NOT") valorBusqueda = valorBusqueda.toLowerCase();
		if (strVal === "AND") valorBusqueda = valorBusqueda.toLowerCase();
		if (strVal === "OR") valorBusqueda = valorBusqueda.toLowerCase();
		return valorBusqueda;
	},

	_buildTextSearchValue: function(valorBusqueda) {
		var formattedValue = "";

		if (this._esBusquedaExacta(valorBusqueda) || this._containsAnyPhraseQuery(valorBusqueda))
			formattedValue = valorBusqueda;
		else if (this._containsNearOperator(valorBusqueda) || this._containsWilcards(valorBusqueda))
			formattedValue = valorBusqueda;
		else if (this._containsLogicalOperators(valorBusqueda))
			formattedValue = this._includePhraseBoostingInSearchValue(valorBusqueda);
		else formattedValue = this._makeMandatoryAllTokensInSearchValue(valorBusqueda);

		return formattedValue;
	},

	_esBusquedaExacta: function(valorBusqueda){
		var ret = false;
		var aux = valorBusqueda.trim();
		var arrayTokens = valorBusqueda.split('"');

		if (( aux[0] == '"') &&
			( aux[aux.length - 1] == '"') &&
			(arrayTokens.length == 1))
			ret = true;

		return ret;
	},

	_containsAnyPhraseQuery: function(valorBusqueda){
		var ret = false;
		if (valorBusqueda.indexOf('"') >= 0)
			ret = true;
		return ret;
	},

	_containsNearOperator: function(valorBusqueda){
		var ret = false;
		if (valorBusqueda.indexOf('~') >= 0)
			ret = true;
		return ret;
	},

	_containsWilcards: function(valorBusqueda){
		var ret = false;
		if (valorBusqueda.indexOf('*') >= 0 || valorBusqueda.indexOf('?') >= 0)
			ret = true;
		return ret;
	},

	_containsLogicalOperators: function(valorBusqueda){
		var ret = false;
		if (valorBusqueda.indexOf('AND') >= 0 || valorBusqueda.indexOf('OR') >= 0)
			ret = true;
		return ret;
	},

	_includePhraseBoostingInSearchValue: function(valorBusqueda){
		var strResult = valorBusqueda;
		var temp = "";

		if (valorBusqueda.indexOf(" AND ") >= 0 && valorBusqueda.indexOf(" OR ") < 0 && valorBusqueda.indexOf(" NOT ") < 0)	//Sólo ANDs
		{
			temp = valorBusqueda.replace(" AND ", " ");
			if (temp)
				strResult = '("{0}"~1000000)'.replace("{0}",temp);
		}
		else if (valorBusqueda.indexOf(" OR ") >= 0 && valorBusqueda.indexOf(" AND ") < 0 && valorBusqueda.indexOf(" NOT ") < 0) //Sólo ORs
		{
			temp = valorBusqueda.replace(" OR ", " ");
			if (temp)
				strResult = '{0} OR "{1}"~1000000^10'.replace("{0}",valorBusqueda).replace("{1}",temp);
		}
		return strResult;
	},

	/**
	 * Buscamos cada uno de los strings que componen el valoBusqueda, separados por espacios en blanco.
	 * A cada uno de estoos tokens, le añadimos el operador "AND" delante, para convertirlo en obligatorio.
	 * Así lo que hará solr al buscar es un AND de todos los tokens que componen el valor a buscar.
	 * @param valorBusqueda
	 * @returns {string}
	 * @private
	 */
	_makeMandatoryAllTokensInSearchValue: function(valorBusqueda){
		var strResult = "";
		var arrayTokens = valorBusqueda.trim().split(" ");

		for (var i = 0; i < arrayTokens.length ; i++)
		{
			var token = arrayTokens[i];
			var trimToken = token.trim(); //Trimamos blancos a principio y final de token

			if (trimToken)
			{
				if (i == 0) strResult +=  trimToken;
				else strResult += " AND {0}".replace("{0}",trimToken);
			}
		}

		//Este sería el caso en el que el usuario está introduciendo espacios en blanco al principo de la cadena de búsqueda
		if (!strResult) strResult = "*";
		else strResult = this._includePhraseBoostingInSearchValue(strResult);	//Boosting de las frases, para q tokens más cercanos tengan más score

		return strResult;
	}

});


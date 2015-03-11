/**
 * Created by jbarcelo on 09/03/2015.
 */

//GLOBAL OBJECTS
var CONF = {};
var UTIL = {};


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

/**
 * !!! CORS PROBLEM
 * Check if an url exist, used to check if video links are online or not
 * @param {String} url - link
 * @param {Function} callback - this function will be called with (true:exist/false:broken link) as param when the request is DONE
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
}

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
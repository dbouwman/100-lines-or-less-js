var map,dialog,selSym,hc,qt,tempQuery,charts=[{source:"pt",chartType:"column",renderTo:"rainfall",
	labels:{title:"Average monthly rainfall"},plotOptions:{series:{pointWidth:25}},fields:
	[{flds:["rainJan","rainFeb","rainMar","rainApr","rainMay","rainJun","rainJul","rainAug",
	"rainSep","rainOct","rainNov","rainDec"]}],yAxis:{title:{text:"millimetres"}},xAxis:
	[{categories:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}],
	ttip:{sfx:" mm/month"}},{plotOptions:{},source:"pt",chartType:"line",renderTo:
	"tempRange",labels:{title:"Average temperature range"},fields:[{flds:
	["minJan","minFeb","minMar","minApr","minMay","minJun","minJul","minAug","minSep","minOct",
	"minNov","minDec"]},{flds:["maxJan","maxFeb","maxMar","maxApr","maxMay","maxJun","maxJul",
	"maxAug","maxSep","maxOct","maxNov","maxDec"]}],yAxis:{title:{text:"°C"}},
	xAxis:[{categories:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}],
	ttip:{sfx:" °C"}},{source:"query",chartType:"spline",renderTo:"maxTemp",ttip:
	{sfx:" °C"},labels:{title:"Average maximum temperature"},plotOptions:{spline:
	{marker:{enabled:false,states:{hover:{enabled:true,symbol:'circle',radius:5}}}}},yAxis:{title:{text: "°C"}}}];
var base = "http://www.bom.gov.au/jsp/ncc/cdio/weatherData/av?p_nccObsCode=136&p_display_type=dailyDataFile&p_startYear=&p_c=&p_stn_num=";
require(["dojo/ready","esri/map","esri/tasks/query","esri/dijit/Geocoder","esri/layers/FeatureLayer",
	"dijit/layout/BorderContainer","dijit/layout/ContentPane","dijit/TooltipDialog","dijit/Popup"],function() {
	map = new esri.Map("map",{center: [133.9,-25.8],zoom: 5,basemap: "gray",maxZoom: 10});
	selSym = new esri.symbol.SimpleMarkerSymbol().setStyle(
		esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE).setColor(new dojo.Color([255,255,0,1]));
	var ws = new esri.layers.FeatureLayer(
		"http://services.azuron.com/arcgis/rest/services/weather/WeatherStations/MapServer/0",{
	    mode: esri.layers.FeatureLayer.MODE_ONDEMAND,outFields: ["*"],opacity: 0.75});
	dojo.connect(map,"onLoad",function(){map.addLayer(ws);});
	dojo.connect(ws,"onClick",function(evt){buildCharts(evt.graphic);});
	dojo.connect(ws,"onMouseOver",function(evt){map.setMapCursor("pointer");
		dialog.setContent(evt.graphic.attributes["Site_name"]);
		dijit.popup.open({popup:dialog,x:evt.pageX,y:evt.pageY});});
	dojo.connect(ws,"onMouseOut",function(evt){map.setMapCursor("default");dijit.popup.close();});
	dojo.connect(ws,"onLoad", function() {setTimeout(function(){
	    var query = new esri.tasks.Query(); //prime the charts with a random station
	    query.objectIds = [Math.floor(Math.random()*1417)]; //there are 1418 stations
	    query.outFields = ["*"];
	    ws.queryFeatures(query, function(featureSet) {
	    	buildCharts(featureSet.features[0]);
	    	$("#loading").hide();
	    });}, 2000);
	    dialog = new dijit.TooltipDialog({id: "tooltipDialog"});
	    dialog.startup();
	});
	var geocoder = new esri.dijit.Geocoder({map:map,autoComplete:true,
		arcgisGeocoder:{placeholder:"Find a place",sourceCountry:"AUS"}},"search");
    geocoder.startup();
    qt = new esri.tasks.QueryTask("http://services.azuron.com/arcgis/rest/services/weather/WeatherStations/MapServer/1");
    tempQuery = new esri.tasks.Query();
    tempQuery.outFields = ["*"];
});
function buildCharts(graphic) { //build charts from this station's values
	var name = graphic.attributes["Site_name"];
	if(name.length>25){name=name.substring(name,23) + "...";}
	$("#name").html(name);
	$("#source a").attr("href",base + graphic.attributes["Site"]);
	map.graphics.clear();
	var highlight = new esri.Graphic(graphic.geometry,selSym);
	map.graphics.add(highlight);
	$(charts).each(function(idx,hc){
		hc.series = new Array();
		if (hc.source == "pt") {
			var attr = graphic.attributes;
			for (var y = 0; y < hc.fields.length; y++) {
				var flds = hc.fields[y].flds;
			    var field = flds[0];
			    var data = new Array();
			    data[0] = attr[field];
			    for (var x = 1; x < flds.length; x++) {data[x] = attr[flds[x]];}
			    hc.series[y] = new Object();
			    hc.series[y].data = data;
			}
			drawChart(hc);
		} else {
			tempQuery.where = "Site = " + graphic.attributes["Site"];
			qt.execute(tempQuery,function(results) {
				var data = [],cats = [];
				for (var j = 0; j < results.features.length; j++) {
					data.push(results.features[j].attributes.maxAvg);
					cats.push(results.features[j].attributes.year.toString());					
				}
				hc.xAxis = {"categories": cats,labels: {step: Math.round(cats.length/5)}};
				hc.series[0] = new Object();
				hc.series[0].data = data;
				hc.hasError = false;
				drawChart(hc);
			}, function(error){hc.hasError = true;drawChart(hc);});
		}
	});
}
function drawChart(hc) {
	var chart = new Highcharts.Chart({
	    chart: {renderTo: hc.renderTo,defaultSeriesType: hc.chartType,
	    	marginBottom: 50},legend: {enabled: false},title: {text: hc.labels.title},
	    xAxis:hc.xAxis,credits: {enabled: false},yAxis: hc.yAxis,colors:['#4572A7','#AA4643'],
	    tooltip: {formatter: function () {return this.point.category+": "+this.point.y+hc.ttip.sfx;}},
	    plotOptions: hc.plotOptions,series: hc.series});
	hc.hasError ? chart.showLoading('Temperature trend data not available') : chart.hideLoading();
}
function toggleWelcomeDialog() {$("#wd").is(':visible') ? $("#wd").hide() : $("#wd").show();}
$(document).on("click","#information",function() {toggleWelcomeDialog()});
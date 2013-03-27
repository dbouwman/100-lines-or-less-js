var dojoConfig = { parseOnLoad: true };
dojo.require("esri.layers.FeatureLayer");
dojo.require("esri.dijit.Gauge");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.map");
var gauge, gauge2, hGraphics, prod2, mapLayers = [], map, idHive;
var MapService = "http://geoservices.provo.org/ArcGIS/rest/services/Honey/HoneyStates/MapServer";

function createGauge(prod2) {
	var gaugeParams = {// create JSON and pass it to the Gauge
		"caption": "Honey Yield by State (2011)",
		"color": "#efca57", "dataField": "Yield",
		"dataFormat": "value", "dataLabelField": "STATE_NAME",
		"layer": prod2, "maxDataValue": 100,
		"unitLabel": " lbs per hive"};
	var gaugeParams2 = {
		"caption": "Total Commercial Colonies (2011)",
		"color": "#efca57", "dataField": "Colonies",
		"dataFormat": "value", "dataLabelField": "STATE_NAME",
		"layer": prod2, "maxDataValue": 500,
		"unitLabel": " thousand colonies"};
	gauge = new esri.dijit.Gauge(gaugeParams, "gaugeDiv");
	gauge.startup();
	gauge2 = new esri.dijit.Gauge(gaugeParams2, "gaugeDiv2");
	gauge2.startup();
	hGraphics = new esri.layers.GraphicsLayer({ "id": "highlights" });
	map.addLayer(hGraphics);
	var highlight = new esri.symbol.SimpleMarkerSymbol()
	.setColor(gaugeParams.color).setSize(12);
	dojo.connect(prod2, "onMouseOver", function(e) {
		hGraphics.clear();
		hGraphics.add(new esri.Graphic(e.graphic.geometry, highlight));
	});
}

function init() {
	map = new esri.Map("map", {
		basemap: "streets",
		center: [-111.712, 40.318],
		zoom: 12});
	dojo.connect(map, "onLoad", initOperationalLayer);
}

function initOperationalLayer(map) {
	var production = new esri.layers.ImageParameters();
		production.layerIds = [0];
		production.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
	var prod = new esri.layers.ArcGISDynamicMapServiceLayer(MapService,{
		"imageParameters":production, "visible":false,
		"mode": esri.layers.FeatureLayer.MODE_ONDEMAND,
		"outFields": ["*"]});
		mapLayers.push(prod);	
	var prod2 = new esri.layers.FeatureLayer("http://geoservices.provo.org/ArcGIS/rest/services/Honey/HoneyStates/MapServer/0",{
		"visible":false,"outFields": ["*"],
		"mode": esri.layers.FeatureLayer.MODE_ONDEMAND});
		dojo.connect(prod2, "onLoad", createGauge);
		mapLayers.push(prod2);
	var beekeeper = new esri.layers.ImageParameters();
		beekeeper.layerIds = [3];
		beekeeper.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
	var keeper = new esri.layers.ArcGISDynamicMapServiceLayer(MapService,{
		"imageParameters":beekeeper, visible:false});
		mapLayers.push(keeper);
	var killer = new esri.layers.ImageParameters();
		killer.layerIds = [2];
		killer.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
	var kill = new esri.layers.ArcGISDynamicMapServiceLayer(MapService,{
		"imageParameters":killer, visible:false});
		mapLayers.push(kill);
	var hives = new esri.layers.ImageParameters();
		hives.layerIds = [4,5,6];
		hives.layerOption = esri.layers.ImageParameters.LAYER_OPTION_SHOW;
	var buffer = new esri.layers.ArcGISDynamicMapServiceLayer(MapService,{
		"imageParameters":hives, "visible":true, "opacity": 0.75});
		mapLayers.push(buffer);		
	var content = "<b>Number of hives</b>: ${Number_of}";
	var infoTemplate = new esri.InfoTemplate("${What_is_yo}", content);				
	var idHive = new esri.layers.FeatureLayer("http://geoservices.provo.org/ArcGIS/rest/services/Honey/HoneyStates/MapServer/4",{
		"mode": esri.layers.FeatureLayer.MODE_ONDEMAND, "outFields": ["*"],
		"visible":true, "infoTemplate": infoTemplate});
		map.infoWindow.resize(150,60);
		mapLayers.push(idHive);	
	map.addLayers([prod,prod2,keeper,kill,buffer,idHive]);		
}

function layerVisibility(layer) {(layer.visible) ? (layer.hide(),map.infoWindow.hide()) : layer.show(); hGraphics.clear();}
function menuslide(id){document.getElementById(id).className = 'z2';}
function menuback(id){document.getElementById(id).className = 'z0';}
dojo.addOnLoad(init);

$(function () {//Arrow
    $("#clickme").toggle(function () {
        $(this).parent().animate({right:'0px'}, {queue: false, duration: 500});
		$("#chevron").removeClass("arrow_flip");
    }, function () {
        $(this).parent().animate({right:'-280px'}, {queue: false, duration: 500});
		$("#chevron").addClass("arrow_flip");
    });
});
dojo.require("esri.map");
dojo.require("esri.tasks.query");
dojo.require("esri.layers.FeatureLayer");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.dijit.Legend");
dojo.require("dijit.TooltipDialog");
var map, featureLayer, dynamicLayer, operationLayer, jobLayer;
var iso3, from_to, legend, dyk, gp;
var mapserviceurl= "http://geo4.dlsi.uji.es/mastergeotech/rest/services/Code_Challenge/From_to/MapServer/jobs";
var baseurl = "http://geo4.dlsi.uji.es/mastergeotech/rest/services/Code_Challenge";
function randomDYK(){
	dojo.xhrGet({url: "info/didyouknow.json", handleAs: "json", handle: function(data,args){
    	dojo.byId('didyouknowText').innerHTML = data[Math.floor(Math.random()*14)];
        }});
	}      
function init() {
	randomDYK();      	
    map = new esri.Map("mapDiv", {
    	basemap: "gray",
        center: [0.0, 15.0],
        zoom: 3
    	}); 
    dynamicLayer = new esri.layers.ArcGISDynamicMapServiceLayer(baseurl+"/AdministrativeUnits2012/MapServer");
    map.addLayer(dynamicLayer);
    var selectionSymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color([255,246,0,0.6]));
    featureLayer = new esri.layers.FeatureLayer(baseurl+"/AdministrativeUnits2012/MapServer/0", {
    	mode: esri.layers.FeatureLayer.MODE_SELECTION,
    });
    featureLayer.setSelectionSymbol(selectionSymbol);
    map.addLayer(featureLayer);
    dojo.connect(map, "onClick", findFeature);
    }
function findFeature(evt) {
	var queryTask = new esri.tasks.QueryTask(baseurl+"/AdministrativeUnits2012/MapServer/0");
    var selectionQuery = new esri.tasks.Query();
    selectionQuery.geometry = evt.mapPoint;
    selectionQuery.outFields = ["*"];
    featureLayer.selectFeatures(selectionQuery,esri.layers.FeatureLayer.SELECTION_NEW);
    queryTask.execute(selectionQuery, function(fset) { 
    	iso3 = "'" + fset.features[0].attributes["ISO3_1"] + "'";
        });
    }
function findMigrations(){     	
	if(document.getElementById('radioOne').checked) {
    	gp = new esri.tasks.Geoprocessor(baseurl+"/To_From/GPServer/Model_To_From");
	} else if(document.getElementById('radioTwo').checked) {  			
  		gp = new esri.tasks.Geoprocessor(baseurl+"/From_to/GPServer/Model_From_To");
	}
  	randomDYK();
    var params = {"ISO3":iso3};
    cleanup();
    gp.submitJob(params,gpJobComplete);
}      
function gpJobComplete(jobinfo){
	var mapurl = mapserviceurl+ "/" + jobinfo.jobId;
    operationLayer = new esri.layers.ArcGISDynamicMapServiceLayer(mapurl,{
    	"id":"OperationsLayer"
    });
    dialog = new dijit.TooltipDialog();
    dialog.startup();
    jobLayer = new esri.layers.FeatureLayer(mapurl+"/0", {
    	mode: esri.layers.FeatureLayer.MODE_SNAPSHOT,
        "id":"JobLayer",
        outFields: ["*"]
    });
	map.addLayers([operationLayer]);
	map.addLayer(jobLayer);
    dojo.connect(map, 'onLayersAddResult', function(results) {
    	esri.show(dojo.byId('legendBox'));
    	if(!legend){      
        	legend = new esri.dijit.Legend({
        		map:map,
        	},"legendDiv"); 
        	legend.startup();
    	} 
    });
    dojo.connect(jobLayer, "onMouseOver", function(evt) {
    	dialog.setContent(esri.substitute(evt.graphic.attributes,"<center><b>${ADM0_NAME_1}</b><br/>${TOTAL} people</center>"));
        dijit.popup.open({popup: dialog, x:evt.pageX, y:evt.pageY});
    });
     dojo.connect(map, "onMouseOut", function(){
    	map.graphics.clear();
        dijit.popup.close(dialog);
    });
}                
function cleanup(){
	esri.hide(dojo.byId('legendBox'));
    var layers = map.getLayersVisibleAtScale(map.getScale());
  	dojo.forEach(layers,function(layer){
    if(layer.id == "OperationsLayer" || layer.id=="JobLayer"){
    	map.removeLayer(layer);
    	}});
    }           
dojo.ready(init);
// Created by: Bryan McIntosh for ESRI 100 Lines or Less code challenge
require(["esri/map", "esri/tasks/query", "esri/layers/graphics"]);
require(["esri/toolbars/draw", "esri/tasks/geometry"]);
require(["dojo/parser","dijit/layout/BorderContainer","dijit/layout/ContentPane"]);
var map, selectionToolbar, sumPop2007, sumPop2000, sumSqMiles;
var GraphicListArray = new Array();

function init() {    // Initial load
  map = new esri.Map("divMap", {basemap:"topo", center:[-100.195,39.567], zoom:4});
  dojo.connect(map, "onLoad", initSelectToolbar);
  var dynamicUrl = "http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer";
  var dynamicLayer = new esri.layers.ArcGISDynamicMapServiceLayer(dynamicUrl, {"opacity":0.4});
  dynamicLayer.setVisibleLayers([2]);
  map.addLayer(dynamicLayer);
  queryTask = new esri.tasks.QueryTask("http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Demographics/ESRI_Census_USA/MapServer/3");
  StateQuery = new esri.tasks.Query();
  StateQuery.returnGeometry = true;
  StateQuery.outSpatialReference = {wkid:102100};
  StateQuery.outFields = ["ObjectID,POP2007,POP2000,SQMI"];
  sumPop2007 = sumPop2000 = sumSqMiles = 0;
  SummaryText();
  dijit.byId("dlgWelcome").show();
}
function initSelectToolbar(map) {    // Initialize the esri draw tool
  selectionToolbar = new esri.toolbars.Draw(map);
  esri.bundle.toolbars.draw.freehand = "Click and drag to define a selection box";
  dojo.connect(selectionToolbar, "onDrawEnd", function(geometry) {
    selectionToolbar.deactivate();
    dijit.byId("rdSelectPolys").set("checked", false);
    StateQuery.geometry = geometry;
    queryTask.execute(StateQuery,TileResults);
  });
}
function selectPolys() {    // Activate the draw tool
  dijit.byId("rdSelectPolys").set("checked", true);
  selectionToolbar.activate(esri.toolbars.Draw.EXTENT);
}
function clearSelection() {   // Clear graphics/selection, deactivate toolbar
  selectionToolbar.deactivate();
  dijit.byId("rdSelectPolys").set("checked", false);
  map.graphics.clear();
  GraphicListArray = [];
  sumPop2007 = sumPop2000 = sumSqMiles = 0;
  SummaryText();
}
function TileResults(featureSet) { // Determine overlap selection and results
  var SymbolSelected = new esri.symbol.SimpleFillSymbol
  (esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, 
    new dojo.Color([100,100,100]), 3), new dojo.Color([255,0,0,0.20]));
  var resultFeatures = featureSet.features;
  // Communicate to user if the service maximum selection limit is reached
  if (resultFeatures.length >= 1000) {dijit.byId("dlgMaxSelection").show();}
  for (var i=0, il=resultFeatures.length; i<il; i++) {
    var TileGraphic = resultFeatures[i];
    var graphicAttributes = resultFeatures[i].attributes;
    var validateFeatures=0;
    for (var j=0, jl=GraphicListArray.length; j<jl; j++){ // Already in Array?
      if (GraphicListArray[j]==graphicAttributes.ObjectID){validateFeatures=1;}
    }
    if (validateFeatures==0){  // Setup the graphic symbol, update array
      TileGraphic.setSymbol(SymbolSelected);
      map.graphics.add(TileGraphic);
      GraphicListArray.push(graphicAttributes.ObjectID);
      sumPop2007 += graphicAttributes.POP2007;
      sumPop2000 += graphicAttributes.POP2000;
      sumSqMiles += graphicAttributes.SQMI;
    }
  }
  SummaryText();
}
function SummaryText() {   // Updates the text for selected features and stats
  var dGrowthRate = ((((sumPop2007-sumPop2000)/sumPop2000)*100)/7)
  var dPopDensity = dojo.number.format(sumPop2007/sumSqMiles, {places: 3});
  if (GraphicListArray.length == 0) {dGrowthRate = dPopDensity = 0;} // for IE9
  dojo.byId("lblPop2007").innerHTML = dojo.number.format(sumPop2007);
  dojo.byId("lblCounties").innerHTML = GraphicListArray.length;
  dojo.byId("lblPop2000").innerHTML = dojo.number.format(sumPop2000);
  dojo.byId("lblPopChange").innerHTML = dojo.number.format(sumPop2007-sumPop2000);
  dojo.byId("lblGrowthRate").innerHTML = dojo.number.format(dGrowthRate);
  dojo.byId("lblSqMiles").innerHTML = dojo.number.format(sumSqMiles);
  dojo.byId("lblPopDensity").innerHTML = dPopDensity
}
function CollapseExpand() {    // Show/hide extra Demographic details section
  var divObject = document.getElementById("thePreciousDetails");
  var currentCssClass = divObject.className;
  if (divObject.className == "divVisible") {divObject.className ="divHidden";}
  else {divObject.className = "divVisible";}
}
dojo.addOnLoad(init);
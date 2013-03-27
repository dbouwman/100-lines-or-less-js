require(["dijit/layout/BorderContainer", "dijit/layout/ContentPane", 
  "esri/map", "esri/utils"]);
dojo.addOnLoad(init);
var map, gl, highlightSymbol, hoverGraphic, hoverSymbol, sp, activeGraphic;
var symbology = {};
function init() {
  highlightSymbol = new esri.symbol.SimpleMarkerSymbol('circle', 17,
    new esri.symbol.SimpleLineSymbol('solid', new dojo.Color(
    [255, 0, 0, .5]), 12), new dojo.Color([255, 0, 180, 1]));
  map = new esri.Map("map", {basemap:'hybrid', center:[-122.45,37.75], zoom:5});
  gl = new esri.layers.GraphicsLayer();
  map.addLayer(gl);
  dojo.connect(gl, "onClick", function (evt) { 
    showEQInfo(evt.graphic); 
    sp = map.toScreen(evt.graphic.geometry), sp.x -= 8, sp.y -=8;
    $(".pulse_holder").css({ 'top': sp.y + 'px', 'left': sp.x + 'px'});
    activeGraphic = evt.graphic;
  });
  dojo.connect(gl, "onMouseOver", function (evt) {
    hoverGraphic = evt.graphic;
    hoverSymbol = evt.graphic.symbol;
    hoverGraphic.setSymbol(highlightSymbol);  
  });
  dojo.connect(gl, "onMouseOut", function (evt) {
    hoverGraphic.setSymbol(hoverSymbol);
  });
  dojo.connect(map, "onPan", function(extent, delta) {
    if (sp) { var deltaX = delta.x + sp.x, deltaY = delta.y + sp.y;
      $(".pulse_holder").css({ 'top': deltaY + 'px', 'left': deltaX + 'px'});
  }});
  dojo.connect(map, "onPanEnd", function(extent, endPoint) {
    if (sp) { sp.y += endPoint.y; sp.x += endPoint.x; }
  });
  dojo.connect(map, "onExtentChange", function(extent, delta, levelChange, lod){
    if (sp && levelChange) { var screen = map.toScreen(activeGraphic.geometry);
      sp.x = screen.x - 8, sp.y = screen.y - 8;
      $(".pulse_holder").css({ 'top': sp.y + 'px', 'left': sp.x + 'px'});
   }});
  dojo.connect(map, "onLoad", function () {
    createSymbols();
    var request = esri.request({
      url:"http://earthquake.usgs.gov/earthquakes/feed/geojsonp/2.5/month",
      handleAs: 'json', callbackParamName: 'eqfeed_callback'});
  }); 
}
function eqfeed_callback(response, io) {
  addPointsToMap(response.features);					
  $('#loadingScreen').fadeOut(500).remove();
  $('#mainWindow').animate({opacity: 1}, 500);
  makeLegend();
}	
function showEQInfo(graphic) {
  var attrs = graphic.attributes;
  var place = attrs.place, eqID = attrs.eqID, date = attrs.date,
    mag = attrs.mag, depth = attrs.depth, url = attrs.url;
  $('.eqLocation').html(place);
  $('.eqMag').html("M " + mag);
  $('.eqDate').html(date);
  $('.eqDepth').html("Depth: " + depth + ' km');
  $('.eqUSGS a').attr('href', url);
  $('#eqInfoMobile').css('display', 'block');
}
function createSymbols() {
  var symbolArray = [['2',7,[245, 118, 12, 1]], ['3',9,[250, 230, 170, 1]],
    ['4',11,[0,255,0,1]],['5',13,[50,255,255,1]], ['6',15,[232, 26, 201, 1]],
    ['7',17,[234, 150, 0, 1]], ['8',19,[255, 0, 0, 1]]];
  var outlineSymbol = new esri.symbol.SimpleLineSymbol('solid', 
    new dojo.Color([0, 0, 0, 1]), 2);
  for (var i=0; i<symbolArray.length; i++) { 
    var symbol = new esri.symbol.SimpleMarkerSymbol('circle', symbolArray[i][1],
      outlineSymbol, symbolArray[i][2]);
    symbology[ symbolArray[i][0] ] = symbol;
  }
}
function makeLegend() {
  for (var magnitude in symbology) { 
    var symbol = symbology[magnitude], symbolDiv = 'mag' + magnitude;
    var surface = dojox.gfx.createSurface(dojo.byId(symbolDiv), 30, 30);
    var descriptors = esri.symbol.getShapeDescriptors(symbol);
    var shape = surface.createShape(descriptors.defaultShape)
      .setFill(descriptors.fill).setStroke(descriptors.stroke);
    shape.applyTransform({dx: 16, dy: 16 });
  }
}
function addPointsToMap(eq) {
  for (var i=0; i<eq.length; i++) {
    var coords = eq[i].geometry.coordinates,x=coords[0],y=coords[1],z=coords[2];
    var prop=eq[i].properties, id=eq[i].id, mag=prop.mag, place=prop.place,
      url = prop.url;
    var date = new Date(parseFloat(prop.time));
    var geom = new esri.geometry.Point(x, y);
    var point = esri.geometry.geographicToWebMercator(geom);
    var sym = symbology[Math.floor(mag)];
    var attr = { 'eqID': id, 'mag': mag, 'depth': z, 'place': place,
      'date': date.toString(), 'url': url };
    gl.add(new esri.Graphic(point, sym, attr));
  }
}
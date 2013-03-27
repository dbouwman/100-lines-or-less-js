require(["dijit/layout/BorderContainer", "dijit/layout/ContentPane", 
  "esri/map", "esri/utils", "esri/dijit/Geocoder", "esri/dijit/Popup",
  "esri/dijit/PopupMobile"]);
dojo.addOnLoad(init);
var map, popup, gl, geoMarker, popupGraphic, geoLocation,
  mobile = navigator.userAgent.match(/(iPhone|iPod|iPad|Android)/i),
  eM = '.esriMobileNavigationItem.right', eC = '.esriMobileInfoView div div';
function init() {
  geoMarker = new esri.symbol.PictureMarkerSymbol('images/geomark.png',30,30);
  popup = new esri.dijit.PopupMobile(null, dojo.create("div"));
  popupTemplate = new esri.dijit.PopupTemplate({title:"{title} - {miles} mi."});
  map = new esri.Map("map", {basemap:'hybrid', center:[-122.45,37.75], 
    zoom:5, infoWindow: popup});
  gl = new esri.layers.GraphicsLayer();
  map.addLayer(gl);
  geocoder = new esri.dijit.Geocoder({ 
    autoNavigate: false,
    maxLocations: 1,
    map: map,
    arcgisGeocoder: {placeholder: "Find a place"}
  }, 'search');
  geocoder.startup();
  dojo.connect(geocoder, "onFindResults", function(response) {
    geoLocation = response.results[0].feature.geometry;
    requestWikiData(geoLocation);
  });
  dojo.connect(gl, "onClick", function (evt) {
    popup.select(gl.graphics.indexOf(evt.graphic));
  });
  dojo.connect(popup,"onSelectionChange",function(){
    var graphic = popup.getSelectedFeature();
    if (graphic) {
      map.infoWindow.show(graphic.geometry);
      map.centerAt(graphic.geometry);
    }
  });
  dojo.connect(map, "onLoad", function () {
    $(document).ready(function() {
      $(document).on('click', '.titleButton.arrow,'+eM+'1,'+eM+'2', function() {
         popupGraphic = popup.getSelectedFeature();
         (mobile) ? esri.request({ // use ajax for mobile, iframes for desktop
           url: "http://en.wikipedia.org/w/api.php?action=parse&section=0"+
             "&prop=text&format=json&pageid=" + popupGraphic.attributes.id + 
             "&callback=loadWikiPage",
           handleAs: 'json', callbackParamName: 'loadWikiPage'}) : 
           $(eC).html("<iframe src='" + popupGraphic.attributes.url +
               "' height='100%' width='100%' seamless></iframe>");
      });
    });
  }); 
}
function loadWikiPage(data) {
  var html = "<div id='pLink'><a href='" + popupGraphic.attributes.url +
    "' target=_blank>View Full Wikipedia Page</a></div>";
  $(eC).html("<div width='99%'>"+data.parse.text['*']+"</div>");
}
function locate(map) {
  if(navigator.geolocation){ 
    navigator.geolocation.getCurrentPosition(zoomToLocation, locationError);
  } else { alert("The browser does not support geolocation.") }
}
function locationError(error) { alert("Current location not available") };
function zoomToLocation(location) {
  var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(
    location.coords.longitude, location.coords.latitude));
  geoLocation = pt;
  requestWikiData(pt);
}
function requestWikiData(location) {
  var pt = esri.geometry.webMercatorToGeographic(location);
  var request = esri.request({
    url:"http://en.wikipedia.org/w/api.php?format=json&gslimit=50&action=" +
      "query&list=geosearch&gsradius=10000&" +
      "gscoord=" + pt.y + "|" + pt.x + "&callback=processWikiData",
    handleAs: 'json', callbackParamName: 'processWikiData'});
}
function processWikiData(response, io) {
  addPointsToMap(response.query.geosearch);                 
  var graphicsExtent = esri.graphicsExtent(gl.graphics);
  map.graphics.clear();
  map.graphics.add(new esri.Graphic(geoLocation, geoMarker));
  map.setExtent(graphicsExtent);
}
function addPointsToMap(wikiData) {
  gl.clear();
  map.infoWindow.clearFeatures();
  for (var i=0; i<wikiData.length; i++) {
    var wiki = wikiData[i], title=wiki.title, lat=wiki.lat, lon=wiki.lon,
      id=wiki.pageid, dist=wiki.dist;
    var miles = (dist / 1609.34).toFixed(1);
    var geom = new esri.geometry.Point(lon, lat);
    var point = esri.geometry.geographicToWebMercator(geom);
    var sym = new esri.symbol.PictureMarkerSymbol('images/wikicon.png',25,25);
    var attr = {'title': title, 'miles': miles,
      'url': "http://en.wikipedia.org/?curid=" + id, 'id': id };
    gl.add(new esri.Graphic(point, sym, attr, popupTemplate));
  }
   map.infoWindow.setFeatures(gl.graphics);
   map.infoWindow.hide();
}
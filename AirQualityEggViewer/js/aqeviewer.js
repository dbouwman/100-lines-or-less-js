dojo.require("esri.map");

var map;    

dojo.ready(init);

function init() {    
  // Create map
  var options = { 
    basemap: "gray",
    center: [-100, 50],
    zoom: 3
  };
  map = new esri.Map("mapDiv",options);

  dojo.connect(map, "onClick", onClick)

  cosm.setKey("tT0xUa9Yy24qPaZXDgJi-lDmf3iSAKxvMEhJWDBleHpMWT0g");

  loadAQEs();
}

function onClick(evt) {
	if(evt.graphic != null) {
		map.infoWindow.setTitle(evt.graphic.attributes["title"]);
		map.infoWindow.setContent(getTextContent());
		map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
		$('#co').cosm('live', {feed: evt.graphic.attributes["id"], datastream:evt.graphic.attributes["co"]});
		$('#hum').cosm('live', {feed: evt.graphic.attributes["id"], datastream:evt.graphic.attributes["hum"]});
		$('#no2').cosm('live', {feed: evt.graphic.attributes["id"], datastream:evt.graphic.attributes["no2"]});
		$('#temp').cosm('live', {feed: evt.graphic.attributes["id"], datastream:evt.graphic.attributes["temp"]});	
	}
}

function loadAQEs() {
	cosm.request({type: "get", url: "http://api.cosm.com/v2/feeds?user=airqualityegg&status=live&per_page=150", done: addAQE});
}

function addAQE(results)
{
	data = results.results;
	var eggicon = new esri.symbol.PictureMarkerSymbol('images/eggicon.png', 25, 25);	
	for(var i = 0; i < data.length; i++)
	{
		map.graphics.add(new esri.Graphic(new esri.geometry.Point(data[i].location.lon, data[i].location.lat), eggicon, {"id":data[i].id,"title":data[i].title,"co":data[i].datastreams[0].id,"hum":data[i].datastreams[2].id,"no2":data[i].datastreams[3].id,"temp":data[i].datastreams[5].id}));
	}
	$('#loading').hide();
	$('#welcomeDiv').append('<p><button type="button" onClick="hidewelcomeDiv()">Go & Explore</button></p>');
}

function hidewelcomeDiv() {
	$('#welcomeDiv').hide();
}

function getTextContent() 
{	
	return  "<div id='attrInfo'><h4>CO: <h4 id='co'></h4> ppb</h4></p><h4>Humidity: <h4 id='hum'></h4> %</h4></p><h4>NO<sub>2</sub>: <h4 id='no2'></h4> ppb</h4></p><h4>Temperature: <h4 id='temp'></h4> °C</h4></div>";
}
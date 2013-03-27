dojo.require("esri.map");
dojo.require("esri.graphic");
dojo.require("esri.layers.graphics");
dojo.require("esri.tasks.query");

var progressbar;

$(window).load(function () {
var options = {basemap: "gray",center:[-75, 41],zoom:6};
map = new esri.Map("mapDiv", options);
dojo.connect(map, "onLoad", queryShape);

progressbar = $("#progressbar");
progressbar.progressbar({ value: false });
});

function queryShape(){
    var url = "http://atlasmaps.esri.com/arcgis/rest/services";
    url += "/NGO/Water_Resources_First_Reporting_Year/MapServer/0";
var queryTask = new esri.tasks.QueryTask(url);
query = new esri.tasks.Query();
query.returnGeometry = true;
query.text = "United States";
queryTask.execute(query, initWind);
}

function initWind(featureSet) {

    console.log(featureSet);
    var usa = featureSet.features[0].geometry;
    var c = 0;
    var height = windData.y1 - windData.y0;
    var width = windData.x1 - windData.x0;



    for (var i = 0; i < windData.gridWidth; i++) {
        for (var j = 0; j < windData.gridHeight; j++) {
            var v0 = windData.field[c++];
            var v1 = windData.field[c++];
            if (v0 != 0 || v1 != 0) {
                var lat = windData.y0 + (j / windData.gridHeight) * height;
                var long = windData.x0 + (i / windData.gridWidth) * width;

                var mapPoint = new esri.geometry.Point(long, lat);
                if (map.extent.contains(mapPoint))
                    if (usa.contains(mapPoint)) {

                        var x = long + (v0 / width);
                        var y = lat + (v1 / height);
                        var mapPoint2 = new esri.geometry.Point(x, y);
                        var a = mapPoint.x - mapPoint2.x;
                        var b = mapPoint.y - mapPoint2.y;
                        var length = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
                        var angle = Math.atan2(a, b) * 180 / Math.PI;
                        //console.log(angle);

                        var polyline = new esri.geometry.Polyline(
                            new esri.SpatialReference({ wkid: 4326 }));
                        polyline.addPath([mapPoint, mapPoint2]);
                        var colorValue = Math.round(Math.abs(angle)) + 75;
                        var color = new dojo.Color([colorValue, 0, 0, 1.0]);
                        if (angle > 90 || angle < -90) {
                            color = new dojo.Color([0, colorValue, 0, 1.0]);
                        }
                        var sls = new esri.symbol.SimpleLineSymbol(
                            esri.symbol.SimpleLineSymbol.STYLE_SOLID,
                            color, .5);
                        map.graphics.add(new esri.Graphic(polyline, sls));
                    }
            }
        }
    }
    progressbar.hide();
}
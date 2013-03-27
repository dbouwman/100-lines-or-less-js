/**created by mathias boeck // Esri / 100-lines-or-less-js
 * Data from: http://www.biergärtenmünchen.de
 */
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("esri.layers.osm");
dojo.require("esri.dijit.Geocoder");
var map, homeBtn, ext, k1La, k2La, k3La, search, title, link, H_link, category,
    pointArr, icon, infoTemp, titleLength, descript, graphic, osmLayer;
var GeoRssArr = [];
function init(){
    map = new esri.Map("map", {maxZoom : "19", sliderStyle : "small"});
    dojo.connect(map, "onLoad", function(theMap) {
        retrieveGeoRSS();
        homeBtn = dojo.create("div",{"class" : "home"},dojo.byId("map_root"));
        homeBtn.onclick = function(){ map.setExtent(ext); }
    });
    osmLayer = new esri.layers.OpenStreetMapLayer();
    map.addLayer(osmLayer);
    search = new esri.dijit.Geocoder({map : map }, "search");
    search.startup();
    dojo.connect(search, "onFindResults", function() {
           var mapPoint = search.results[0].extent.getCenter();
           var pic = new esri.symbol.PictureMarkerSymbol(
               "../beerGeoRSS/images/pinIcon.png",38,40);
           map.graphics.add(new esri.Graphic(mapPoint, pic ));
           dojo.connect(map, "onPan", function(){ map.graphics.clear(); });
    });
}
function retrieveGeoRSS(){
    $(document).ready(function(){
        $.ajax({
            url : '../beerGeoRSS/data/bier_georss.xml',
            dataType : 'xml',
            success : function(rss) { parseGeoRSS(rss);},
            error : function(jqXHR, textStatus, errorThrown) {
                alert("parseXML " + textStatus + "\n" + errorThrown);
            }
        });
    });
}
function parseGeoRSS(rss){
    $(rss).find("item").each(function(i){
        title = $(this).find("[nodeName='title']").text();
        link = $(this).find("[nodeName='link']").text();
        H_link = '<a href="' + link + '" target="_blank" >' + title + '</a>';
        category = $(this).find("[nodeName='category']").text();
        descript = $(this).find("[nodeName='description']").text();;
        pointArr = $(this).find("[nodeName='georss:point']").text().split(" ");
        var symURL = "../beerGeoRSS/images/bier.png"
        icon = new esri.symbol.PictureMarkerSymbol({
            "url" : symURL, "height" : 25, "width" : 21, "type" : "esriPMS"
        });
        GeoRssArr[i] = createGraphics(pointArr, category, descript, title, 
                                                            icon, H_link);
    });
    addLayers(GeoRssArr);
}
function createGraphics(pointArr, category, descript, title, icon, H_link){
    var point = new esri.geometry.Point({"x" : pointArr[1],"y" : pointArr[0],
        "spatialReference" : {"wkid" : 102100 }
    });
    infoTemp = new esri.InfoTemplate(title, descript + "<br/>" + H_link);
    var MercPoint = esri.geometry.geographicToWebMercator(point);
    graphic = new esri.Graphic(MercPoint, icon, category, infoTemp);
    map.infoWindow.resize(200, 80);
    return graphic;
}
function addLayers(GeoRssArr) {
    var xArr = new Array();
    var yArr = new Array();
    for (var i = 0; i < GeoRssArr.length; i++) {
        xArr[i] = GeoRssArr[i].geometry.x;
        yArr[i] = GeoRssArr[i].geometry.y;
        xArr = xArr.sort();
        yArr = yArr.sort();
    }
    ext = new esri.geometry.Extent(xArr[0], yArr[0], 
        xArr[xArr.length - 1], yArr[yArr.length - 1], map.spatialReference);
    ext = ext.expand(2);
    map.setExtent(ext);
    k1La = new esri.layers.GraphicsLayer();
    k2La = new esri.layers.GraphicsLayer();
    k3La = new esri.layers.GraphicsLayer();
    map.addLayers([k1La, k2La, k3La]);
    for (g in GeoRssArr) {
        var gra, graCategory;
        gra = GeoRssArr[g];
        graCategory = parseFloat(gra.attributes);
        if (graCategory < 6.50) {k1La.add(gra)} 
        else if (graCategory >= 6.50 && graCategory < 7.00) {k2La.add(gra)} 
        else if (graCategory >= 7.00 && graCategory < 8.00) {k3La.add(gra)} 
    }
}
function checkLayer(Layer, box) {
    var boxID = document.getElementById(box);
    if (boxID.checked == false) {Layer.setVisibility(false);} 
    else {Layer.setVisibility(true);}
}
dojo.ready(init);


dojo.addOnLoad(function () {
    $('#introModal').modal();//show the intro
    initMap();//start the map
    $('#togglePlaying').on('click', function (evt) { togglePlaying(); });
});
var map, watchId, connection, usr = {}, smashes = 0;
var mongoUrl = 'https://api.mongolab.com/api/1/databases/zombieattacks/collections/entities?apiKey=5aBWmfmdlk0X65WTi_6Z2TeSw4Dg1uZH';
var EntityFactory = function (guid, icon, geom) { return { id: guid, "icon": icon, "active": true, "geom":geom }; };
function initMap() {
    map = new esri.Map("map", { center: [-116.5336, 33.82617], zoom: 8, basemap: "topo" });
    dojo.connect(map, "onLoad", initConnection);
};
function initConnection() {
    if(!connection) connection = $.connection("http://geozombies.azurewebsites.net/io"); //connect up websockets
    connection.start().done(function () {
        loadEntities();
        watchId = setInterval(function () { navigator.geolocation.getCurrentPosition(updateUserLocation); }, 2000);
    }).fail(function () { alert("Error connecting to realtime service"); });
    connection.received(recieveEntityUpdate);
}
function stopConnection() {
    clearInterval(watchId);//stop the set interval
    map.graphics.remove(getGraphicById(usr.id));//remove user from map
}
function togglePlaying() {
    $('#togglePlaying').text() == 'Stop' ? $('#togglePlaying').text('Play') : $('#togglePlaying').text('Stop');
    usr.active ? function () { usr.active = !usr.active; stopConnection(); }(): initConnection();
}
function loadEntities() {
    usr = EntityFactory(connection.id, 'human');//create the user
    $.getJSON(mongoUrl, function (data) {//get things from mongo
        _.each(data, function (item) {   //loop the array
            item.geom = new esri.geometry.Point(item.geom.x, item.geom.y, new esri.SpatialReference({ wkid: 102100 }));
            upsertEntityGraphic(item);});
    });
}
function getGraphicById(id){
    var graphic; 
    _.some(map.graphics.graphics, function (item) {if(item.attributes['entity'].id == id){graphic = item;return true;}});
     return graphic;
}
function upsertEntityGraphic(entity, broadcast) {
    entity.id == connection.id ? markerName = 'human-me' : markerName = entity.icon; //if it's the user, show the blue icon
    var sym = new esri.symbol.PictureMarkerSymbol('http://geozombies.azurewebsites.net/content/img/' + markerName + '.png', 16, 16);
    var graphic = getGraphicById(entity.id);
    if (graphic) {
        graphic.geometry = entity.geom; //update the location
        graphic.setSymbol(sym);//set the symbol
    } else {
        map.graphics.add(new esri.Graphic(new esri.geometry.Point(entity.geom.x, entity.geom.y,
            new esri.SpatialReference({ wkid: 102100 })), sym, { 'entity': entity }));}
    if (broadcast) broadcastEntityUpdate(entity);
}
function checkForAttacks() {
    _.each(getGraphicsWithinDistance(usr.geom, 10, 'zombie'), function (item) {//get graphics w/in 20m of user
        if (item.attributes['entity'].icon == 'zombie') {
            item.attributes['entity'].icon = 'deadzombie'; //kill the entity
            upsertEntityGraphic(item.attributes['entity'], true);//update users map
            $('#status').text('Smashed: ' + (++smashes));
        }});
}
function getGraphicsWithinDistance(origin, distance, icon) {
    var itemsToReturn = [];
    _.each(map.graphics.graphics, function (item) {//loop the graphics
        var d = esri.geometry.getLength(origin, item.geometry);//compare user's location
        if (d < distance && item.attributes['entity'].icon == icon)
            itemsToReturn.push(item);
    });
    return itemsToReturn;
}
function broadcastEntityUpdate(entity) {
    connection.send(JSON.stringify(entity));
    if (entity.icon != 'human')  //store all non-human entities in mongo
        $.ajax({ url: mongoUrl + '&u=true&q={"id":"' + entity.id +'"}', data: JSON.stringify(entity), type: "PUT", contentType: "application/json" })
}
function recieveEntityUpdate(jsonEntity) {
    var item = JSON.parse(jsonEntity);//parse back into js object
    item.geom = new esri.geometry.Point(item.geom.x, item.geom.y, new esri.SpatialReference({ wkid: 102100 }));
    upsertEntityGraphic(item,false);
}
function updateUserLocation(position) {//$('#status').text('gps ' + (++gpsCount)); console.log('GPS ' + gpsCount);
    var pt = esri.geometry.geographicToWebMercator(new esri.geometry.Point(position.coords.longitude, position.coords.latitude));
    if (getGraphicsWithinDistance(pt, 200, 'zombie').length < 10) spawnZombies(5, pt);//create 5 new zombies near the user
    usr.geom = pt;
    checkForAttacks();
    connection.send(JSON.stringify(usr));//send user to other players
    upsertEntityGraphic(usr, true);//update the user graphic
    map.centerAndZoom(pt, 18);
}
function spawnZombies(count, location) {
    for (i = 0; i <= count; i++) {
        var z = EntityFactory(+new Date(), 'zombie', randomNearPoint(location.x, location.y, 50));
        upsertEntityGraphic(z, true);}
}
function randomNearPoint(x, y, dist) {
    var newPoa = [x, y].map(function (p) { (Math.random() * (2 * dist) + (p - dist)).toFixed(2) * 1 });
    return new esri.geometry.Point(newPoa[0], newPoa[1], new esri.SpatialReference({ wkid: 102100 }));
}
function showMessage(msg) {$('#notice').text(msg).fadeIn(100).fadeOut(500);}
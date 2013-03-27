dojo.require('esri.map');
dojo.require('esri.graphic');
dojo.require('esri.geometry');
var map, planeG, gameTickInterval, destP, destG, time, plane, kbrd=false;
var items=['trousers','sour pickles','ice skates','trombones','voodoo dolls'];
function init() {
require(['dojo/text!./places.json', 'dojo/text!./plane.json'],function (a,b) {
    capitals = JSON.parse(a);
    planeG = JSON.parse(b);
    map=new esri.Map('mapDiv',{basemap:'streets',center:[-100,50],zoom:3});
  });
}
function pickOne(array) {return array[Math.floor(Math.random()*array.length)]}
function start() {
  time = 0;
  $('#start').attr('disabled', true);
  $('#instructions').show();
  $('#summary').hide();
  $('#what').html(pickOne(items));
  var dest = pickOne(capitals);
  $('#where').html(dest.capital + ', ' + dest.country);
  destP = new esri.geometry.Point(dest.y, dest.x);
  destG = new esri.Graphic(destP, new esri.symbol.SimpleMarkerSymbol())
  map.graphics.add(destG);
  if (!plane) {
    plane = new esri.Graphic(planeG);
    map.graphics.add(plane);
    plane.cent = { x:-1663297.5653581168, y: 6448545.565071885};
    plane.rot = 1.57079633; // 12 o'clock due to how plane drawn
    rotate(plane, 90);
  }
  Mousetrap.bind('a', function() {rotate(plane, 10, true);});
  Mousetrap.bind('d', function() {rotate(plane, -10, true);});
  gameTickInterval = window.setInterval(tick, 33);
}
function tick() {
  move(plane, 100000);
  $('#userMessage').html(Math.floor((++time) / 30.303));
  if (time % 50 === 0) {
    var cent = new esri.geometry.Point([plane.cent.x, plane.cent.y],
                               new esri.SpatialReference({ wkid:102100 }));
    var zoom = map.getZoom();
    if (!$('#mapDiv_graphics_layer').find('path').length) {
      if (zoom > 0)  {zoom--;
      zoomStable=false;}
    } else  if (zoom < 3 && zoomStable) {zoom++} else {zoomStable=true;}
    map.centerAndZoom(cent, zoom);
  }
  if (time > 50 && !kbrd) {
    $('#help').show();
    kbrd = true; }
}
function move(feature, distance) {
  var g = feature.geometry;
  var change = {
    x: Math.cos(feature.rot) * distance,
    y: Math.sin(feature.rot) * distance
  }
  teleport(feature, change.x, change.y);
  if (feature.cent.x < -20037508.3417) { teleport(plane, 20037508.3417*2, 0); }
  if (feature.cent.y >  19999999) { teleport(plane, 0, -19999999*2); }
  if (feature.cent.x > 20037508.3417) { teleport(plane, -20037508.3417*2, 0); }
  if (feature.cent.y < -19999999) { teleport(plane, 0, 19999999*2); }
}
function teleport(feature, x, y) {
  var g = feature.geometry;
  for (var r in g.paths[0]) {
    g.paths[0][r][0] = g.paths[0][r][0] + x;
    g.paths[0][r][1] = g.paths[0][r][1] + y;
  }
  feature.cent = { x: feature.cent.x + x, y: feature.cent.y + y };
  feature.setGeometry(g);
  var planeExtent = new esri.geometry.Polyline(g.toJson()).getExtent();
  if (planeExtent.intersects(destP)) { stop(); }
}
function stop() {
  window.clearInterval(gameTickInterval);
  $('#start').attr('disabled', false);
  $('#summary').show();
  $('#result').html(Math.floor(time / 30.303));
  map.graphics.remove(destG);
  Mousetrap.reset();
}
var rotate = function (feature, angle, fromUser) {
  if (fromUser) {kbrd = true; 
    $('#help').hide();}
  var newGeom = feature.geometry;
  var a = angle * Math.PI / 180;
  feature.rot += a;
  var c = feature.cent;
  for (var rIndex in newGeom.paths[0]) {
    var p = newGeom.paths[0][rIndex];
    var xR = c.x + Math.cos(a) * (p[0] - c.x) - Math.sin(a) * (p[1] - c.y);
    var yR = c.y + Math.sin(a) * (p[0] - c.x) + Math.cos(a) * (p[1] - c.y);
    p[0] = xR;
    p[1] = yR;
  }
  feature.setGeometry(newGeom);
}
dojo.ready(init);
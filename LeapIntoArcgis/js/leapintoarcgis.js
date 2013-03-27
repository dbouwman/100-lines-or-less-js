dojo.require("esri.map");
var map, canvas, btnC, cdot, msg, prevG=0, isCalib=false, msgTO, _sr, numC = 2,
 calibMS = 1500, calib={left:-60, top:300, right:60, bottom:100}, lastX, lastY;
dojo.ready(function (){
  map = new esri.Map("mapDiv", {center: [-84, 32], zoom: 5, basemap: "gray"});
  dojo.connect(map, "onLoad", function(){_sr = map.spatialReference;});
  canvas = document.getElementById("canvasLayer");
  canvas.setAttribute("width", window.innerWidth);
  canvas.setAttribute("height", window.innerHeight);
  btnC = document.getElementById("btnCalibrate");
  btnC.onclick = calibrateScreen;
  cdot = document.getElementById("cdot");
  msg = document.getElementById("leapOutput");
});
function calibrateScreen() {
  alert("Point at the dots:\n 1. Top left\n 2. Bottom right");
  isCalib = true;
  calib = {left:9999, top:-9999, right:-9999, bottom:9999};
  calibrateDot(1);
  setTimeout (function(){
      isCalib = false;
      cdot.setAttribute("class","");
  }, calibMS*numC);
}
function calibrateDot(count) {
  cdot.setAttribute("class","cdot_pos" + count);
  setTimeout (function(){
    calib.left = Math.min(calib.left, lastX);
    calib.right = Math.max(calib.right, lastX);
    calib.bottom = Math.min(calib.bottom, lastY);
    calib.top = Math.max(calib.top, lastY);
  }, calibMS-250);
  if(numC > count) setTimeout (function(){calibrateDot(count+1);}, calibMS);
}
function toScreen(px, py) {
  return {x:map.width*(px-calib.left)/(calib.right-calib.left),
    y:map.height-map.height*(py-calib.bottom)/(calib.top-calib.bottom)};
}
if(typeof Leap !== "undefined") Leap.loop({enableGestures: true}, function(f) {
  dojo.query(".noLeap").style("display", "none");
  if (f.pointables.length > 0) {
    lastX = f.pointables[0].tipPosition[0];
    lastY = f.pointables[0].tipPosition[1];
    if(!isCalib) {
      canvas.setAttribute("style", "display:block");
      canvas.getContext("2d").clearRect(0, 0, map.width, map.height);
      var ctx = canvas.getContext('2d'), ps = f.pointables;
      for (var i = 0; i < ps.length; i++) {
        var p = ps[i].tipPosition, cp = toScreen(p[0], p[1]);
        ctx.globalAlpha = .9;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 5, 0, 2*Math.PI, false);
        ctx.fillStyle = '#222';
        ctx.fill();
        ctx.font="16px Century Gothic";
        var mp = esri.geometry.webMercatorToGeographic(map.toMap(cp));
        ctx.fillText(mp.y.toFixed(5)+", "+mp.x.toFixed(5),cp.x+15,cp.y);
      }
    }
  } else if(canvas !== undefined)
    canvas.setAttribute("style", "display:none");
  if (f.gestures !== undefined && f.gestures.length > 0) {
    for(var i = 0; i < f.gestures.length; i++) {
      var gesture = f.gestures[i], type = gesture.type;
      if(new Date().getTime() - prevG > 750 && !isCalib){
        if(type == "circle") handleCircle(gesture);
        else if(type == "swipe") handleSwipe(f.fingers.length, gesture);
        else if(type == "screenTap" || type == "keyTap" ) handleTap(gesture);
        prevG = new Date().getTime();
      }
    }
  }
});
function handleCircle(g) {
  if(g.radius < 5) return; //ignore tiny circles.
  var tl = map.toMap(toScreen(g.center[0]-g.radius, g.center[1]+g.radius));
  var br = map.toMap(toScreen(g.center[0]+g.radius, g.center[1]-g.radius));
  map.setExtent(new esri.geometry.Extent(tl.x, br.y, br.x, tl.y, _sr));
  outputGestureMessage("...zooming to extent...");
}
function handleSwipe(numf, gesture) {
  var d = gesture.direction, zoomLevel = numf - 2, p = .5 * numf * map.height;
  if(numf <= 2 && numf > 0) {
    outputGestureMessage("...panning ("+numf+" finger)...");
    map.centerAt(map.toMap({x: (map.width / 2) - p * d[0], 
                            y: (map.height / 2) + p * (d[1])}));
  } else if(numf > 2) {
    map.setLevel(map.getLevel() - zoomLevel);
    outputGestureMessage("...zooming out (" + zoomLevel + " levels)...");
  }
}
function handleTap(gesture) {
  map.centerAt(map.toMap(toScreen(gesture.position[0], gesture.position[1])));
  outputGestureMessage("...centering map...");
}
function outputGestureMessage(message) {
  msg.innerHTML = message;
  if(msgTO !== undefined) clearTimeout(msgTO);
  msgTO = setTimeout(function(){msg.innerHTML = "&nbsp;"}, 3000);
}
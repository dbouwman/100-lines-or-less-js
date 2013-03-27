dojo.require("esri.map");dojo.require("dojo/_base/xhr");
dojo.require("esri.dijit.Popup");dojo.require("esri.dijit.OverviewMap");
var routesGeo=[],musicsGeo=[],mode=0,cSound,cMusic,travel,cRoute;
///////////// Initialisation: Map, Soundcloud, Json loading /////////////
dojo.ready(function () {
	map = new esri.Map("mapDiv",{ wrapAround180:false,
		basemap: "topo", center: [5.8, 50.3], zoom: 6, maxZoom: 9, minZoom: 4});
	dojo.connect(map, 'onLoad', function (map) {
		new esri.dijit.OverviewMap({
            map: map, visible: true, attachTo: "bottom-right"
        }).startup();
		dojo.xhrGet( {
			url: "data/musics.json", handleAs: "json",
			load: function(data){
				mData = data.music;
				dojo.forEach(data.routes, function(route){
					routesGeo.push(esri.geometry.Polyline(route));
				});
				for(var i=0; i<mData.length; i++){
					var dt = new esri.dijit.PopupTemplate({
						title: "{title}", 
						description:"<input type='button'onclick='javascript:playPause(\""+i+"\")\
						;'value='Play'/><br/>{description}",mediaInfos: [{"type":"image", "value":
							{"sourceURL": "{iconUrl}", "linkURL": "{url}"}
						}]
					});
					var sym = new esri.symbol.PictureMarkerSymbol(mData[i].iconUrl, 30, 30);
					var pt = new esri.geometry.Point(mData[i].lon, mData[i].lat);
					musicsGeo.push(map.graphics.add(new esri.Graphic(pt, sym, mData[i], dt)));
				}
				
				dojo.addClass("loader", "invis");
				dojo.connect(map, 'onExtentChange', function(){
					if(mode != 1) startLocalMusic();
				});
			}
		});
	});
	SC.initialize({client_id: 'e5e4c15e3d100206a1cf9b0794faea7a'});
});
//////// Music mode handling and action (play/pause) functionnalities /////////
function startLocalMusic(){
	var data, tmp, d = 10000000, mg = map.geographicExtent;
	mapC = new esri.geometry.Point((mg.xmax + mg.xmin)/2, (mg.ymax + mg.ymin)/2);

	for(var i=0; i<mData.length; i++){
		if(map.geographicExtent.contains(musicsGeo[i].geometry)){
			if(cMusic == mData[i]) return;
			if((tmp = quickDistance(mapC, musicsGeo[i].geometry)) < d || !data){
				d = tmp;
				data = mData[i];
			}
		}
	}
	if(data) changeMusic(data);
}
function quickDistance(pt1, pt2){
	return Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2);
}
function playPause(id){
	if(id){
		setMode(1);
		changeMusic(mData[id]);
	} else cSound.paused ? cSound.play() : cSound.pause();
}
function changeMusic(music){
	if((cMusic = music) && cSound && cSound.volume > 0) fadeout();
	else{
		cSound ? cSound.destruct():1;
		dojo.byId("musicName").innerHTML = cMusic.title.substr(0,20);
		SC.stream(music.id, function(sound){
			(cSound = sound).play('mySound', {});
		});
	}
}
function fadeout(){
	if(cSound.volume <= 0) changeMusic(cMusic);
	else{
		cSound.setVolume(cSound.volume -4);
		setTimeout(function(){fadeout()}, 35);
	}
}
function showHelp(v){
	if(!mData) return;
	v ? dojo.removeClass("pCent", "invis") : dojo.addClass("pCent", "invis");
}
function setMode(m){
	(mode=m)!=2 ? dojo.addClass("tra", "invis") : dojo.removeClass("tra", "invis");
	clearInterval(travel);
}
//////// Registered Travel functions ////////
function startTravel(count){
	showHelp(tPaused = false);
	map.centerAndZoom((cRoute = routesGeo[count]).getPoint(0, tPace = 0), 7);
	travel = setInterval(updateTravel, 43000);
}
function updateTravel(back){
	if(!tPaused){ cMusic = 0;
		map.centerAt(cRoute.getPoint(0, back ? (tPace>0? --tPace:0) : ++tPace));}
}
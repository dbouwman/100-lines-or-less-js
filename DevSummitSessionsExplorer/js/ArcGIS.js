dojo.require("esri.map"); 
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");

var mymap, sessions, mysymbol, mysymbol2;
var urlimage = "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";
var urlpscc = "http://gisn.tel-aviv.gov.il/ArcGIS/rest/services/pscc/MapServer";
function init() {
    mysymbol = new esri.symbol.SimpleFillSymbol(
            esri.symbol.SimpleFillSymbol.STYLE_SOLID, null, new dojo.Color([0, 0, 255, 0.5]));
    mysymbol2 = new esri.symbol.SimpleFillSymbol(
        esri.symbol.SimpleFillSymbol.STYLE_SOLID, null, new dojo.Color([0, 0, 255, 0.1]));
    var initialExtent = new esri.geometry.Extent({ "xmin": -12973115, "ymin": 4005200,
        "xmax": -12972827, "ymax": 4005595, "spatialReference": { "wkid": 102100 }
    });
    mymap = new esri.Map("map", { extent: initialExtent });
    mymap.addLayer(new esri.layers.ArcGISTiledMapServiceLayer(urlimage));
    mymap.addLayer(new esri.layers.ArcGISDynamicMapServiceLayer(urlpscc));
    $.jsonp({ url: "http://www.galsystems.com/devsummit2013/sessions.json",
        callback: "callbackSessions", cache: true,
        success: function (data) {
            sessions = data; refreshSessionsList("");
            $("#searchbox").placeholder().bind("keyup mouseup", function (e) {
                setTimeout(function () { refreshSessionsList($(e.target).val()) }, 10);
            });
        }
    });
    dojo.connect(mymap, "onLoad", function () {
        var queryTask = new esri.tasks.QueryTask(urlpscc + "/0");
        dojo.connect(queryTask, "onComplete", function (results) {
            for (var i = 0; i < results.features.length; i++) {
                results.features[i].setSymbol(mysymbol2);
                mymap.graphics.add(results.features[i]);
            }
            dojo.connect(mymap.graphics, "onClick", function (e) {
                HLRoom(e.graphic.attributes["RoomName"]);
                refreshSessionsList(e.graphic.attributes["RoomName"]);
                mymap.centerAt(e.mapPoint);
                $("#searchbox").val(e.graphic.attributes["RoomName"]);
            })
        });
        var query = new esri.tasks.Query();
        query.outFields = ["OBJECTID", "RoomName", "Shape"];
        query.where = "1=1"; queryTask.execute(query);
    });
}
function refreshSessionsList(query) {
    var ul = $("#sessions");
    ul.empty();
    $.each(sessions, function (i, o) {
        var Disp = o.Date + " - " + o.Name + " (" + o.Room + ")";
        if ((Disp.toLowerCase().indexOf(query.toLowerCase())) >= 0) {
            var li = $("<li/>")
                .text(Disp)
                .mouseenter(function (e) { $(this).addClass("over"); HLRoom(o.Room); })
                .mouseleave(function (e) { $(this).removeClass("over"); })
                .appendTo(ul)
                .toggle(function (e) {
                    var self = $(this); HLRoom(o.Room, true);
                    if (o.DetailsHtml) { $("<div class='details-div'>" + o.DetailsHtml + "</div>").appendTo(self); }
                    else {
                        $(this).append("<div class='details-div'><div class='loader'></div></div>");
                        $.jsonp({
                            url: "http://www.checkspot.co.il/proxy.php?callback=_jqjsp&url=" + encodeURIComponent(o.Link),
                            success: function (data) {
                                o.DetailsHtml = $(data.html).find("div.bodyContentBox").html();
                                self.find(".loader").removeClass("loader").html(o.DetailsHtml);
                            }
                        });
                    }
                },
                function (e) {
                    $(this).find(".details-div").remove();
               })
        }
    });
}
function HLRoom(Room, panTo) {
    for (var i = 0; i < mymap.graphics.graphics.length; i++) {
        if (Room.indexOf(mymap.graphics.graphics[i].attributes["RoomName"]) >= 0) {
            mymap.graphics.graphics[i].setSymbol(mysymbol);
            if (panTo) 
                mymap.centerAt(mymap.graphics.graphics[i].geometry.getExtent().getCenter());
        }
        else
            mymap.graphics.graphics[i].setSymbol(mysymbol2);
    }
}
dojo.addOnLoad(init);

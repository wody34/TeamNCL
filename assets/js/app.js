'use strict';

//requireJS 모듈 선언 - [myApp 앵귤러 모듈]
define([
    'angular', //앵귤러 모듈을 사용하기 위해 임포트
    'lodash'
  ],

  //디펜던시 로드뒤 콜백함수
  function (angular) {
    //모듈 선언
    var $app = angular.module('TeamNCL', []);

    $app.controller('EVClient', ['$scope', '$http', function($scope, $http){
      console.log("EVClient Activated");

      var map;
      var stopInterval = false;
      var startX, startY, endX, endY;

      $http.get("/ChargingStation?limit=1000").then(function(response) {
        var data = response.data;
        console.log(data);
        console.log(data.length);
        var processedData = [];
        for (var i = 0; i < data.length; i++) {
          processedData.push (data[i].statNm + "\n");
        }

        var sourceSelect = document.getElementById ("source_select");
        while (sourceSelect.options.length > 0) {
          sourceSelect.options.remove (0);
        }
        for (var index in data) {
          sourceSelect.options [sourceSelect.options.length] = new Option (data [index].statNm, index);
        }

        var destinationSelect = document.getElementById ("destination_select");
        while (destinationSelect.options.length > 0) {
          destinationSelect.options.remove (0);
        }
        for (var index in data) {
          destinationSelect.options [destinationSelect.options.length] = new Option (data [index].statNm, index);
        }

        var sourceSelectFunction = function (selectDefault) {
          if (selectDefault == "selectDefault") {
            startX = data [0].lng;
            startY = data [0].lat;
          }
          else {
            map.unloadDestroy();
            stopInterval = true;

            startX = data [this.selectedIndex].lng;
            startY = data [this.selectedIndex].lat;

            $scope.initTmap();
          }
        };

        var destinationSelectFunction = function (selectDefault) {
          if (selectDefault == "selectDefault") {
            endX = data [0].lng;
            endY = data [0].lat;
          }
          else {
            map.unloadDestroy();
            stopInterval = true;

            endX = data [this.selectedIndex].lng;
            endY = data [this.selectedIndex].lat;
          }

          $scope.initTmap();
        };

        sourceSelectFunction ("selectDefault");
        destinationSelectFunction ("selectDefault");
        sourceSelect.onchange = sourceSelectFunction;
        destinationSelect.onchange = sourceSelectFunction;
      });

      //초기화 함수
      $scope.initTmap = function() {
        var centerLL = new Tmap.LonLat(14145677.4, 4511257.6);
        map = new Tmap.Map({
          div:'map_div',
          //width:'100%',
          height:'800px',
          transitionEffect:"resize",
          animation:true
        });

        var route1X = 126.976011;
        var route1Y = 37.573611;
        var route2X = 127.002350;
        var route2Y = 37.559352;

        var param = {
          version: 1,
          startX: startX,
          startY: startY,
          endX: endX,
          endY: endY,
          passList: route1X+","+route1Y+",0,0,0_"+route2X+","+route2Y+",0,G,0",
          appKey: '35bfd940-2738-36fa-9502-f25ddde1ed96',
          reqCoordType: 'WGS84GEO',
          resCoordType: 'EPSG3857'
        };

        var urlStr = "https://apis.skplanetx.com/tmap/routes?" + $.param(param, true);

        //sample event FOR detection 이벤트 타입 및 좌표 대입
        var event = {
          flag: 1,
          type: "fire",
          positionLng:14135337.340412281,
          positionLat:4518885.191777256
        };


        $scope.searchRoute(urlStr+"&format=xml");
        $scope.marker(urlStr+"&format=json");
        //detection 이벤트 타입 및 좌표 대입
        $scope.detectionEvent(event);
      };

      //경로 정보 로드
      $scope.searchRoute = function(url) {
        var routeFormat = new Tmap.Format.KML({extractStyles:true, extractAttributes:true});

        var prtcl = new Tmap.Protocol.HTTP({
          url: url,
          format:routeFormat
        });

        var routeLayer = new Tmap.Layer.Vector("route", {protocol:prtcl, strategies:[new Tmap.Strategy.Fixed()]});
        routeLayer.events.register("featuresadded", routeLayer, $scope.onDrawnFeatures);
        map.addLayer(routeLayer);
      };

      //경로 그리기 후 해당영역으로 줌
      $scope.onDrawnFeatures = function(e) {
        map.zoomToExtent(this.getDataExtent());
      };

      // detection event 발생 시, 이벤트 type, 이벤트 좌표를 받아 해당 위치에 10초 뒤에 표기
      $scope.detectionEvent = function(event) {
        var flag = event.flag;
        var eventType = event.type.toString();
        var size = new Tmap.Size(50,50);
        var offset = new Tmap.Pixel(-(size.w/2), -(size.h/2));
        var eventImage = new Tmap.Icon(eventType+'.png', size, offset);
        var eventPositionLng = event.positionLng;
        var eventPositionLat = event.positionLat;
        var eventMarker = new Tmap.Marker(new Tmap.LonLat(eventPositionLng, eventPositionLat), eventImage);
        var markerLayer = new Tmap.Layer.Markers( "MarkerLayer" );
        map.addLayer(markerLayer);
        setTimeout(function(){
          markerLayer.addMarker(eventMarker);
        },10000);
      }

      $scope.marker = function(url) {
        var markerLayer = new Tmap.Layer.Markers( "MarkerLayer" );
        map.addLayer(markerLayer);
        $.get(url, function(data) {
          var routes = [];

          for(var i in data.features) {
            var coordinates = data.features[i].geometry.coordinates;

            if(data.features[i].geometry.type === "Point")
              routes.push([coordinates]);
            else
              routes.push(coordinates);
          }
          routes = _.flatten(routes);

          var i = 0;

          var stop = false;
          var removeMarkerInterval = null;

          var addMarkerInterval = setInterval (function() {
            if (stopInterval == true) {
              stopInterval = false;
              clearInterval (addMarkerInterval);
              clearInterval (removeMarkerInterval);
              stop = true;
            }

            if (stop == false) {
              var size = new Tmap.Size(50,50);
              var offset = new Tmap.Pixel(-(size.w/2), -(size.h/2));
              var icon = new Tmap.Icon('vehicle.png', size, offset);
              var markers = new Tmap.Marker(new Tmap.LonLat(routes[i][0], routes[i][1]), icon);

              markerLayer.addMarker(markers);

              removeMarkerInterval = setInterval(function() {
                markerLayer.removeMarker(markers);
              }, 1100);

              if (i == routes.length-8) {
                clearInterval (addMarkerInterval);
                clearInterval (removeMarkerInterval);
              }

              i++;
            }
          }, 1000);
        });
      }
    }]);

    return $app;
  }
);

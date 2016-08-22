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

    $app.controller('EVClient', ['$scope', '$http', function($scope, $http) {
      console.log("EVClient Activated");

      // io.socket.on('connect', function(){
      io.socket.get('/obstacle/subscribe', function(resData, a) {
        console.log('obstable', resData);
      });
      // });


      var map;
      var stopInterval = false;
      $scope.route = {
        passlist: []
      };

      $scope.options = {
        charging_stations: []
      };

      $http.get("/ChargingStation?limit=1000").then(function(response) {
        var data = response.data;
        console.log(data);
        console.log(data.length);
        $scope.options.charging_stations = data;
        $scope.route.src_gps = $scope.options.charging_stations[0];
        $scope.route.dest_gps = $scope.options.charging_stations[1];
      });

      $scope.$watch('route', function(newValue, oldValue) {
        console.log('value changed', newValue, oldValue);
        if(!_.isUndefined(newValue.src_gps) && !_.isUndefined(newValue.dest_gps)) {
          if(!_.isUndefined(map)) {
            map.unloadDestroy();
            stopInterval = true;
          }
          $scope.initTmap();
        }
      }, true);

      $scope.addPassList = function() {
        console.log("add");
        $scope.route.passlist.push($scope.options.charging_stations[$scope.route.passlist.length+2]);
      };

      //초기화 함수
      $scope.initTmap = function() {
        map = new Tmap.Map({
          div:'map_div',
          //width:'100%',
          height:'800px',
          transitionEffect:"resize",
          animation:true
        });

        var str = "";
        if($scope.route.passlist.length > 0) {
          for (var i = 0; i < $scope.route.passlist.length - 1; ++i) {
            var pass = $scope.route.passlist[i];
            str += pass.lng + "," + pass.lat + ",0,0,0_"
          }
          str += $scope.route.passlist[i].lng + "," + $scope.route.passlist[i].lat + ",0,G,0";
        }
        var param = {
          version: 1,
          startX: $scope.route.src_gps.lng,
          startY: $scope.route.src_gps.lat,
          endX: $scope.route.dest_gps.lng,
          endY: $scope.route.dest_gps.lat,
          passList: str,
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
        $scope.driving(urlStr+"&format=json", $scope.route.src_gps, $scope.route.dest_gps, $scope.route.passlist);
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
      };

      $scope.driving = function(url, src, dest, passlist) {
        var markerLayer = new Tmap.Layer.Markers("MarkerLayer");
        map.addLayer(markerLayer);
        vehicleFactory(src, dest, passlist, function (vehicle) {
          $scope.vehicle = vehicle;
          $http.get(url).then(function (response) {
            var data = response.data;
            var routes = [];

            for (var i in data.features) {
              var coordinates = data.features[i].geometry.coordinates;

              if (data.features[i].geometry.type === "Point")
                routes.push([coordinates]);
              else
                routes.push(coordinates);
            }
            vehicle.routes = _.flatten(routes);
            vehicle.startDrive(function (lng, lat) {
              var size = new Tmap.Size(50, 50);
              var offset = new Tmap.Pixel(-(size.w / 2), -(size.h / 2));
              var icon = new Tmap.Icon('vehicle.png', size, offset);
              vehicle.marker = new Tmap.Marker(new Tmap.LonLat(lng, lat), icon);
              markerLayer.addMarker(vehicle.marker);
            }, function () {
              if(vehicle.marker)
              markerLayer.removeMarker(vehicle.marker);
            });
          });
        });

        function vehicleFactory(src, dest, passlist, cb) {
          var new_vehicle = new Vehicle(src, dest, passlist);
          $http.post('/Vehicle', JSON.stringify(new_vehicle)).then(function (response) {
            new_vehicle.id = response.data.id;
            new_vehicle.index = 0;
            console.log('new vehicle created', new_vehicle);
            cb(new_vehicle);
          });
        }

        function Vehicle(src, dest, passlist) {
          this.src = src;
          this.dest = dest;
          this.passlist = passlist;
        }

        Vehicle.prototype.startDrive = function (add, removePrev) {
          var self = this;
          this.addMarkerInterval = setInterval(function () {
            removePrev();
            add(self.routes[self.index][0], self.routes[self.index][1]);
            self.writeStatus();
            if (self.index == self.routes.length - 8) {
              self.stopDrive();
            }
            ++self.index;
          }, 1000);

        };
        Vehicle.prototype.stopDrive = function (add, remove) {
          clearInterval(this.addMarkerInterval);
        };

        Vehicle.prototype.writeStatus = function() {
          $http.post('/DriveLog', {belongs:this.id, lng: this.routes[this.index][0], lat: this.routes[this.index][1]}).then(function(response) {
            console.log(response.data);
          });
        };
      };
    }]);

    return $app;
  }
);


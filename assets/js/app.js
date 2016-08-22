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
      io.socket.get('/DriveLog/subscribe', function(resData, a) {
        console.log('obstable', resData);
      });

      $scope.route = {
        passlist: []
      };

      $scope.options = {
        charging_stations: []
      };

      $scope.vehicles = [];

      $http.get("/EvPos?limit=1000").then(function(response) {
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
          if(!_.isUndefined($scope.map)) {
            $scope.vehicle.stopDrive();
            $scope.vehicle.terminate();
            delete $scope.vehicle;
            while($scope.vehicles.length > 0) {
              var v1 = $scope.vehicles.pop();
              v1.terminate();
            }
            $scope.map.unloadDestroy();
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
        $scope.map = new Tmap.Map({
          div:'map_div',
          //width:'100%',
          height:'800px',
          transitionEffect:"resize",
          animation:true
        });
        $scope.markerLayer = new Tmap.Layer.Markers("MarkerLayer");
        $scope.map.addLayer($scope.markerLayer);

        var str = "";
        if($scope.route.passlist.length > 0) {
          for (var i = 0; i < $scope.route.passlist.length - 1; ++i) {
            var pass = $scope.route.passlist[i];
            str += pass.lng + "," + pass.lat + ",0,0,0_"
          }
          str += $scope.route.passlist[i].lng + "," + $scope.route.passlist[i].lat + ",0,G,0";

          for (var i = 0; i < $scope.route.passlist.length; ++i) {
            var param = {
              version: 1,
              lat: $scope.route.passlist[i].lat,
              lon: $scope.route.passlist[i].lng,
              appKey: '35bfd940-2738-36fa-9502-f25ddde1ed96',
              fromCoord: 'WGS84GEO',
              toCoord: 'EPSG3857',
              format: 'json'
            };

            $http.get('https://apis.skplanetx.com/tmap/geo/coordconvert?' + $.param(param, true)).then(function(response) {
              var size = new Tmap.Size(30, 30);
              var offset = new Tmap.Pixel(-(size.w / 2), -(size.h * 1.5));
              var icon = new Tmap.Icon('station.png', size, offset);

              var lonLat = new Tmap.LonLat(response.data.coordinate.lon, response.data.coordinate.lat);
              var stationMarker = new Tmap.Marker(lonLat, icon);
              var markerLayer = new Tmap.Layer.Markers("MarkerLayer");
              stationMarker.events.register("click", markerLayer, function () {
                var popupMessage = "<ul><li>hello</li></ul>";
                var popup = new Tmap.Popup("lablePopup", lonLat, new Tmap.Size(100,20), popupMessage, true);
                popup.autoSize = true;
                $scope.map.addPopup(popup);
              });

              $scope.map.addLayer(markerLayer);
              markerLayer.addMarker(stationMarker);
            });
          }
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
        $scope.map.addLayer(routeLayer);
      };

      //경로 그리기 후 해당영역으로 줌
      $scope.onDrawnFeatures = function(e) {
        $scope.map.zoomToExtent(this.getDataExtent());
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
        $scope.map.addLayer(markerLayer);
        setTimeout(function(){
          markerLayer.addMarker(eventMarker);
        },10000);
      };

      $scope.driving = function(url, src, dest, passlist) {
        var add = function (pos, driveStatus) {
          var size = new Tmap.Size(50, 50);
          var offset = new Tmap.Pixel(-(size.w / 2), -(size.h / 2));
          var icon = new Tmap.Icon('vehicle.png', size, offset);
          var marker = new Tmap.Marker(new Tmap.LonLat(pos.lng, pos.lat), icon);
          $scope.markerLayer.addMarker(marker);

          if(driveStatus) {
            var popupMessage = "<ul><li>출발지: "+src.evName+"</li><li>목적지: "+dest.evName+"</li><li>예상 주행거리: "+Math.round(driveStatus.totalDistance*100)/100+"km</li><li>예상 소요시간: "+Math.round(driveStatus.totalTime)+"초</li></ul>";
            var popup = new Tmap.Popup("lablePopup", new Tmap.LonLat(pos.lng, pos.lat), new Tmap.Size(100,20), popupMessage, false);
            popup.autoSize = true;
            $scope.map.setCenter(new Tmap.LonLat(pos.lng, pos.lat));
            $scope.map.addPopup(popup);
            return {marker: marker, popup: popup};
          }
          else
            return {marker: marker};
        };
        var removePrev = function(draw) {
          if(draw) {
            if(draw.marker) {
              $scope.markerLayer.removeMarker(draw.marker);
              delete draw.marker;
            }
            if(draw.popup) {
              $scope.map.removePopup(draw.popup);
              delete draw.popup;
            }
          }
        };

        io.socket.on('drivelog', function(event) {
          console.log(event);
          switch (event.verb) {
            case 'created':
              console.log(event.data.belongs);
              if($scope.vehicle && event.data.belongs === $scope.vehicle.id)
                return;
              if(_.isUndefined($scope.vehicles[event.data.belongs]))
              //create new vehicle
                vehicleFactory(event.data.belongs, undefined, undefined, undefined, function(vehicle) {
                  console.log('주변 차량 생성', event.data.belongs, $scope.map);
                  $scope.vehicles[event.data.belongs] = vehicle;
                  vehicle.changePosition(event.data, add, removePrev)
                });
              else
                $scope.vehicles[event.data.belongs].changePosition(event.data, add, removePrev);
              break;
            default:
              console.warn('Unrecognized socket event (`%s`) from server:',event.verb, event);
          }
        });

        vehicleFactory(undefined, src, dest, passlist, function (vehicle) {
          $scope.vehicle = vehicle;
          $http.get(url).then(function (response) {
            var data = response.data;
            var routes = [];
            var totalLength =0;
            for (var i in data.features) {
              if(data.features[i].geometry.coordinates.length==2){
                totalLength +=1
              }
              else{
                totalLength += data.features[i].geometry.coordinates.length;
              }
            }
            vehicle.driveStatus = {
              totalDistance: data.features[0].properties.totalDistance/1000,
              totalTime: data.features[0].properties.totalTime,
              timeStep: data.features[0].properties.totalTime/totalLength,
              distanceStep: data.features[0].properties.totalDistance/1000/totalLength
            }

            for (var i in data.features) {
              var coordinates = data.features[i].geometry.coordinates;

              if (data.features[i].geometry.type === "Point")
                routes.push([coordinates]);
              else
                routes.push(coordinates);
            }
            vehicle.routes = _.flatten(routes);
            vehicle.startDrive(add, removePrev);
          });
        });

        function vehicleFactory(id, src, dest, passlist, cb) {
          var new_vehicle = new Vehicle(src, dest, passlist);
          if(!_.isUndefined(id))
            cb(new_vehicle);
          else
            $http.post('/Vehicle', angular.toJson(new_vehicle)).then(function (response) {
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
          console.log('startstart');
          var self = this;
          this.addMarkerInterval = setInterval(function () {
            var new_pos = {lng: self.routes[self.index][0], lat: self.routes[self.index][1]};
            self.driveStatus.totalDistance -= self.driveStatus.distanceStep;
            self.driveStatus.totalTime -= self.driveStatus.timeStep;
            if (self.driveStatus.totalDistance <= 0) self.driveStatus.totalDistance = 0;
            if (self.driveStatus.totalTime <= 0) self.driveStatus.totalTime = 0;
            self.changePosition(new_pos, add, removePrev);
            self.writeStatus();
            console.log(self.index, self.routes.length);
            if (++self.index >= self.routes.length) {
              self.stopDrive();
            }
          }, 100);

        };

        Vehicle.prototype.stopDrive = function () {
          console.log('stop driving');
          clearInterval(this.addMarkerInterval);
          delete this.addMarkerInterval;
        };

        //TODO: 배터리 정보 추가 기입
        Vehicle.prototype.writeStatus = function() {
          $http.post('/DriveLog', {belongs:this.id, lng: this.routes[this.index][0], lat: this.routes[this.index][1]}).then(function(response) {
            console.log(response.data);
          });
        };

        Vehicle.prototype.changePosition = function(new_pos, add, removePrev) {
          removePrev(this.draw);
          this.draw = add(new_pos, this.driveStatus);
        };

        Vehicle.prototype.terminate = function() {
          removePrev(this.draw);
        }
      };
    }]);

    return $app;
  }
);


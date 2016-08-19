/**
 * ChargingStationController
 *
 * @description :: Server-side logic for managing Chargingstations
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var request = require('request');
var parseString = require('xml2js').parseString;

module.exports = {
	collect: function (req, res) {

    var url1 = 'http://open.ev.or.kr:8080/openapi/services/rest/EvChargerService';
    var queryParams = '?' + encodeURIComponent('ServiceKey') + '=GtP%2FPfGlRjeg2W%2BHvhMU7HuxUF2WsmIr7dcD8TsGIWtgKz16d339abzgZj6QWFQmy1XBxSHNLgu6Q%2BYtlD91kA%3D%3D';
    queryParams += '&'+ encodeURIComponent('numOfRows') + '=' + encodeURIComponent('999');
    queryParams += '&'+ encodeURIComponent('pageNo') + '=' + encodeURIComponent('2');
    request({
      url:url1+queryParams,
      method: 'GET'
    }, function(e, r, data) {
      //console.log('Status:', response.statusCode);
      //console.log('Headers: ', JSON.stringify(response.headers) );
      //console.log('Response received' , data);
      parseString(data, function(err, result) {
        var stations = _.map(result.response.body[0].items[0].body[0].item, function(item) {
          return _.mapValues(item, function(val) {
            return val[0];
          });
        });

        ChargingStation.create(stations).exec(function(err, stations) {
          console.log(stations.length);
        });
      });
    });


  },
  route: function(req, res) {
    request({
      url:'https://apis.skplanetx.com/tmap/routes?version=1&format=json&startX=126.99588&startY=37.571076&passList=126.976011,37.573611,0,0,0_127.00235,37.559352,0,G,0&endX=127.002804&endY=37.540085&appKey=35bfd940-2738-36fa-9502-f25ddde1ed96&reqCoordType=WGS84GEO&resCoordType=WGS84GEO',
      method: 'GET'
    }, function(e, r, data) {

    });

  }
};


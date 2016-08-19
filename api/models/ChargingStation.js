/**
 * ChargingStation.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    statId: {
      type: 'string',
      size: 20
    },
    statNm: {
      type: 'string',
      size: 100
    },
    chgerId: {
      type: 'string',
      size: 16
    },
    chgerType: {
      type: 'string',
      enum: ['01', '03', '06']
    },
    stat: {
      type: 'string',
      enum: ['1', '2', '3', '4', '5']
    },
    lat: {
      type: 'string',
      size: 20
    },
    lng: {
      type: 'string',
      size: 20
    },
    addr: {
      type: 'string',
      size: 150
    },
    useTime: {
      type: 'string',
      size: 50
    }
  }
};


/**
 * EvPos.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    evName: {
      type: 'string',
      size: 100
    },
    evNum: {
      type: 'integer'
    },
    type: {
      type: 'string',
      size: 16
    },
    address: {
      type: 'string',
      size: 100
    },
    lat: {
      type: 'float'
    },
    lng: {
      type: 'float'
    }
  }
};


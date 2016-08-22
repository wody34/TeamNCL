/**
 * Obstacle.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    lat: {
      type: 'float'
    },
    lng: {
      type: 'float'
    },
    type: {
      type: 'integer',
      enum: [0, 1, 2]
    },
    status: {
      type: 'integer',
      enum: [0, 1, 2] //생성, 발견, 제거?
    }
  }
};


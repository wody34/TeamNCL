/**
 * ObstacleController
 *
 * @description :: Server-side logic for managing Obstacles
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  subscribe: function (req, res) {
    if (!req.isSocket) {
      return res.badRequest();
    }
    Obstacle.watch(req);
    return res.ok();
  }
};


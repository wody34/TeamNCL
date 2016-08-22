/**
 * DriveLogController
 *
 * @description :: Server-side logic for managing Drivelogs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  subscribe: function(req, res) {
    if (!req.isSocket) {return res.badRequest();}
    DriveLog.watch( req );
    return res.ok();
  }
};


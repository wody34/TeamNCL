/**
 * DriveLogController
 *
 * @description :: Server-side logic for managing Drivelogs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  subscribe: function(req, res) {
    console.log('aa');
    if (!req.isSocket) {return res.badRequest();}
    // Have the socket which made the request join the "funSockets" room
    DriveLog.watch( req );
    // Broadcast a "hello" message to all the fun sockets.
    // This message will be sent to all sockets in the "funSockets" room,
    // but will be ignored by any client sockets that are not listening-- i.e. that didn't call `io.socket.on('hello', ...)`
    // sails.sockets.broadcast('funSockets', 'obstacle', req);
    // Respond to the request with an a-ok message
    return res.ok();
  }
};


var WebSocketServer = require('websocket').server;
var http = require('http');

var _ = require('underscore');

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(3000, function() { console.log("Server is listning") });

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

var x3g_settings = {
  'x_max_feedrate': "1",
  'x_home_feedrate': "1",
  'x_steps_per_mm': "1",
  'x_endstop_is_max': 'true',

  'y_max_feedrate': "1",
  'y_home_feedrate': "1",
  'y_steps_per_mm': "1",
  'y_endstop_is_max': 'true',

  'z_max_feedrate': "1",
  'z_home_feedrate': "1",
  'z_steps_per_mm': "1",
  'z_endstop_is_max': 'true',

  'e_max_feedrate': "1",
  'e_steps_per_mm': "1",
  'e_motor_steps': '1',

  'has_heated_bed': 'true'
};

var answered = false;

var machines_connected = [];

var clients = [];
// WebSocket server
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);
    var index = clients.push(connection) - 1;

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    console.log("Connection accepted");
    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        // console.log("Message: " + JSON.stringify(message) );
        var msg = JSON.parse(message.utf8Data);
        var payload = msg[1].data;

        var header = msg[0];
        console.log("Msg header: " + msg[0]);

        switch(header) {
          case "server.machine_connected":
            var uuid = payload.uuid;
            var exists = _.where(machines_connected, {uuid: uuid});
            if (exists.length > 0) { return; }
            machines_connected.push({uuid: uuid});
          break;
          case "server.machine_disconnected":
            var uuid = payload.uuid;
            var exists = _.where(machines_connected, {uuid: uuid});
            if (exists.length == 0) { return; }
            machines_connected = _.reject(machines_connected, function(machine) { return machine.uuid == uuid; });
          break;
          case "server.update_data":
            console.log(payload);

            var machine_uuid_connected = payload.uuid_map;
            var serial_map = payload.iserial_map;

            var uuids = _.keys(serial_map);
            var machines_not_connected = {};
            _.each(uuids, function(key) {
              var connected = _.findWhere(machines_connected, {uuid: key});
              if (connected == undefined) {
                machines_not_connected[key] = {
                  protocol: JSON.stringify({protocol: 'x3g', x3g_settings: x3g_settings}),
                  uuid: key,
                  baud: "115200"
                }
                machines_connected.push({uuid: key});
              }
            });
            if (_.size(machines_not_connected) > 0) {
              console.log("Send connect machines");
              var output = JSON.stringify([ ["connect_machines", {data: machines_not_connected}] ]);
              console.log(">>" + output);
              connection.sendUTF( output );
            }

            _.each(payload.machines, function(machine) {
              console.log(machine.temperatures);
            });
            // var uuid = keys[0];
            // var port_name = serial_map[keys[0]];
            // var output = JSON.stringify([ ["machine_info", {data: {uuid: uuid, port_name: port_name} }] ]);
          break;
          default:
            console.log(payload);
          break;
        }
      }
    });

    connection.on('close', function(connection) {
      answered = false;
      console.log("Connection closed");
      clients.splice(index, 1);
    });
});

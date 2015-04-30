HTTP_HOST = "https://printtopeer.io"
SOCKET_HOST = "ws://10.24.19.234:3000"

require 'eventmachine'
require 'faye/websocket'
require 'yajl/json_gem'
require 'msgpack'
require 'yaml'
require 'em-http'
require 'fileutils'

Dir["/home/pi/PrintToPeer/ptp-client/*.rb"].sort.each { |f| require f }

# p [:ptp_client, :startup]
# p `/home/pi/PrintToPi/update/update_all.sh`
p [:ptp_client, :em_run]
EM.run {
  Signal.trap('INT')  { EM.stop }
  Signal.trap('TERM') { EM.stop }

  p [:ptp_client, :client_assignment]
  client = PrintToClient.new(host: SOCKET_HOST)
  EM.stop unless client.configured?
}

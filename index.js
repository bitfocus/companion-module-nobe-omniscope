var instance_skel = require('../../instance_skel')
var WebSocket = require('ws')
var debug
var log
var DEFAULT_PORT = 4475
var RECONNECT_INITIAL_MS = 1000
var RECONNECT_MAX_MS = 10000

function instance(system, id, config) {
	var self = this

	// super-constructor
	instance_skel.apply(this, arguments)
	self.socket = undefined
	self.reconnectTimer = undefined
	self.reconnectDelayMs = RECONNECT_INITIAL_MS
	self.destroying = false
	self.actions() // export actions
	return self
}

instance.prototype.init = function () {
	var self = this

	debug = self.debug
	log = self.log

	self.destroying = false
	self.reconnectDelayMs = RECONNECT_INITIAL_MS
	self.status(self.STATUS_UNKNOWN)

	if (self.getHost() !== '') {
		self.initSocket()
	}
}

instance.prototype.getHost = function () {
	var self = this
	if (!self.config || typeof self.config.host !== 'string') {
		return ''
	}
	return self.config.host.trim()
}

instance.prototype.getPort = function () {
	var self = this
	var port

	if (!self.config) {
		return DEFAULT_PORT
	}

	port = parseInt(self.config.port, 10)
	if (!Number.isFinite(port) || port <= 0 || port > 65535) {
		return DEFAULT_PORT
	}

	return port
}

instance.prototype.stopReconnectTimer = function () {
	var self = this
	if (self.reconnectTimer !== undefined) {
		clearTimeout(self.reconnectTimer)
		self.reconnectTimer = undefined
	}
}

instance.prototype.scheduleReconnect = function () {
	var self = this
	var delay

	if (self.destroying || self.getHost() === '') {
		return
	}

	if (self.reconnectTimer !== undefined) {
		return
	}

	delay = self.reconnectDelayMs
	self.status(self.STATUS_WARNING, 'Reconnecting in ' + delay + 'ms...')
	self.reconnectTimer = setTimeout(function () {
		self.reconnectTimer = undefined
		self.initSocket()
	}, delay)
	self.reconnectDelayMs = Math.min(delay * 2, RECONNECT_MAX_MS)
}

instance.prototype.destroySocket = function () {
	var self = this
	var socket = self.socket

	if (socket === undefined) {
		return
	}

	self.socket = undefined
	socket.removeAllListeners('open')
	socket.removeAllListeners('close')
	socket.removeAllListeners('error')

	try {
		socket.close()
	} catch (error) {
		// Ignore close errors while replacing sockets.
	}
}

instance.prototype.initSocket = function () {
	var self = this
	var host
	var port
	var socket
	var url

	host = self.getHost()
	if (self.destroying || host === '') {
		return
	}
	port = self.getPort()

	self.stopReconnectTimer()
	self.destroySocket()
	self.status(self.STATUS_WARNING, 'Connecting to socket')
	url = 'ws://' + host + ':' + port + '/'
	socket = new WebSocket(url, { handshakeTimeout: 5000 })
	self.socket = socket

	socket
		.on('open', function () {
			if (socket !== self.socket) {
				return
			}
			self.reconnectDelayMs = RECONNECT_INITIAL_MS
			self.status(self.STATUS_OK)
			self.log('info', 'Nobe: connection established to ' + host + ':' + port)
		})
		.on('close', function () {
			if (socket !== self.socket) {
				return
			}

			self.socket = undefined
			if (self.destroying) {
				return
			}

			self.status(self.STATUS_WARNING, 'Connection closed')
			self.scheduleReconnect()
		})
		.on('error', function (err) {
			var message
			if (socket !== self.socket) {
				return
			}

			message = err && err.message ? err.message : String(err)
			self.status(self.STATUS_ERROR, 'Connection error')
			self.log('error', 'Nobe: ' + host + ':' + port + ': ' + message)
			self.scheduleReconnect()
		})
}

instance.prototype.updateConfig = function (config) {
	var self = this
	self.config = config

	self.status(self.STATUS_WARNING, 'Update Config')
	self.reconnectDelayMs = RECONNECT_INITIAL_MS
	self.stopReconnectTimer()
	self.destroySocket()

	if (self.getHost() !== '') {
		self.status(this.STATUS_WARNING, 'Connecting...')
		self.initSocket()
	}
}

instance.prototype.destroy = function () {
	var self = this
	self.destroying = true
	self.stopReconnectTimer()
	self.destroySocket()
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this
	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module triggers channels in Nobe Omniscope',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 6,
			default: '127.0.0.1',
			regex: self.REGEX_IP,
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Target Port',
			width: 6,
			default: String(DEFAULT_PORT),
		},
	]
}

instance.prototype.CHANNELS = [
	{ label: 'Channel 1', id: '0' },
	{ label: 'Channel 2', id: '1' },
	{ label: 'Channel 3', id: '2' },
	{ label: 'Channel 4', id: '3' },
	{ label: 'Channel 5', id: '4' },
	{ label: 'Channel 6', id: '5' },
	{ label: 'Channel 7', id: '6' },
	{ label: 'Channel 8', id: '7' },
	{ label: 'Channel 9', id: '8' },
	{ label: 'Channel 10', id: '9' },
	{ label: 'Channel 11', id: '10' },
	{ label: 'Channel 12', id: '11' },
	{ label: 'Channel 13', id: '12' },
	{ label: 'Channel 14', id: '13' },
	{ label: 'Channel 15', id: '14' },
	{ label: 'Channel 16', id: '15' },
	{ label: 'Channel 17', id: '16' },
	{ label: 'Channel 18', id: '17' },
	{ label: 'Channel 19', id: '18' },
	{ label: 'Channel 20', id: '19' },
	{ label: 'Channel 21', id: '20' },
	{ label: 'Channel 22', id: '21' },
	{ label: 'Channel 23', id: '22' },
	{ label: 'Channel 24', id: '23' },
	{ label: 'Channel 25', id: '24' },
	{ label: 'Channel 26', id: '25' },
	{ label: 'Channel 27', id: '26' },
	{ label: 'Channel 28', id: '27' },
	{ label: 'Channel 29', id: '28' },
	{ label: 'Channel 30', id: '29' },
	{ label: 'Channel 31', id: '30' },
	{ label: 'Channel 32', id: '31' },
]

instance.prototype.actions = function (system) {
	var self = this

	var actions = {
		channels: {
			label: 'Channel Trigger',
			options: [
				{
					type: 'dropdown',
					label: 'Send Channel Trigger',
					id: 'channels',
					default: '0',
					choices: self.CHANNELS,
				},
			],
		},
	}
	self.setActions(actions)
}

instance.prototype.action = function (action) {
	var self = this
	var channel
	var opt = action.options
	var cmd

	channel = parseInt(opt.channels, 10)
	if (!Number.isFinite(channel) || channel < 0 || channel > 31) {
		self.log('error', 'Nobe: invalid channel value: ' + String(opt.channels))
		return
	}

	cmd = JSON.stringify({ action: channel, event: 'testEvent' })

	if (cmd !== undefined) {
		if (self.socket !== undefined && self.socket.readyState === WebSocket.OPEN) {
			debug('sending ', cmd, 'to', self.config.host)
			try {
				self.socket.send(cmd)
			} catch (error) {
				self.log('error', 'Nobe: failed to send command: ' + error.message)
			}
		} else {
			self.log('warn', 'Nobe: command ignored because socket is not connected')
			self.scheduleReconnect()
		}
	}
}

instance_skel.extendedBy(instance)
exports = module.exports = instance

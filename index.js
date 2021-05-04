var instance_skel = require('../../instance_skel')
var WebSocket = require('ws')
var debug
var log

function instance(system, id, config) {
	var self = this

	// super-constructor
	instance_skel.apply(this, arguments)
	self.actions() // export actions
	return self
}

instance.prototype.init = function () {
	var self = this

	debug = self.debug
	log = self.log

	self.status(self.STATUS_UNKNOWN)

	if (self.config.host !== undefined) {
		self.initSocket()
	}
}

instance.prototype.initSocket = function () {
	var self = this

	self.status(self.STATUS_WARNING, 'Connecting to socket')
	self.socket = new WebSocket('ws://' + self.config.host + ':4475/')

	self.socket
		.on('open', () => {
			console.log('Connection has been established.')
			self.status(self.STATUS_OK)
		})
		.on('close', () => {
			console.log('Connection closed')
			self.status(self.STATUS_WARNING, 'Connection closed')
		})
		.on('error', (err) => {
			console.log('Error:', err)
			self.status(self.STATUS_ERROR, 'Connection error')
			self.log('error', 'Nobe: ' + err)
		})
}

instance.prototype.updateConfig = function (config) {
	var self = this
	self.config = config

	self.status(self.STATUS_WARNING, 'Update Config')

	if (self.socket !== undefined) {
		self.socket.close()
	}

	self.config = config
	if (self.config.host) {
		self.status(this.STATUS_WARNING, 'Connecting...')
		self.initSocket()
	}
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
			default: '192.168.0.100',
			regex: self.REGEX_IP,
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
	var id = action.action
	var opt = action.options
	var cmd

	cmd = '{"action":' + opt.channels + ', "event": "testEvent"}'

	if (cmd !== undefined) {
		if (self.socket !== undefined) {
			debug('sending ', cmd, 'to', self.config.host)
			self.socket.send(cmd)
		}
	}
}

instance_skel.extendedBy(instance)
exports = module.exports = instance

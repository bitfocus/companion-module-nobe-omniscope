const { InstanceBase, InstanceStatus, Regex, runEntrypoint } = require('@companion-module/base')

const DEFAULT_PORT = 4475
const RECONNECT_INITIAL_MS = 1000
const RECONNECT_MAX_MS = 10000

const CHANNELS = Array.from({ length: 32 }, (_, index) => ({
	id: String(index),
	label: `Channel ${index + 1}`,
}))

let ExternalWebSocket = undefined

class NobeOmniscopeInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.config = {}
		this.socket = undefined
		this.socketHandlers = undefined
		this.reconnectTimer = undefined
		this.reconnectDelayMs = RECONNECT_INITIAL_MS
		this.destroying = false
	}

	async init(config) {
		this.config = config || {}
		this.destroying = false
		this.reconnectDelayMs = RECONNECT_INITIAL_MS

		this.updateActions()
		this.updateStatus(InstanceStatus.Unknown)
		this.connectIfConfigured()
	}

	async destroy() {
		this.destroying = true
		this.stopReconnectTimer()
		this.destroySocket()
	}

	async configUpdated(config) {
		this.config = config || {}

		this.reconnectDelayMs = RECONNECT_INITIAL_MS
		this.stopReconnectTimer()
		this.destroySocket()
		this.connectIfConfigured()
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Target IP',
				width: 8,
				default: '127.0.0.1',
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 4,
				default: String(DEFAULT_PORT),
			},
		]
	}

	updateActions() {
		this.setActionDefinitions({
			triggerChannel: {
				name: 'Trigger Channel',
				options: [
					{
						type: 'dropdown',
						label: 'Send Channel Trigger',
						id: 'channel',
						default: '0',
						choices: CHANNELS,
					},
				],
				callback: async (event) => {
					this.sendChannel(event.options.channel)
				},
			},
		})
	}

	getHost() {
		if (!this.config || typeof this.config.host !== 'string') {
			return ''
		}

		return this.config.host.trim()
	}

	getPort() {
		if (!this.config) {
			return DEFAULT_PORT
		}

		const port = parseInt(this.config.port, 10)
		if (!Number.isFinite(port) || port <= 0 || port > 65535) {
			return DEFAULT_PORT
		}

		return port
	}

	getWebSocketClass() {
		if (typeof WebSocket !== 'undefined') {
			return WebSocket
		}

		if (ExternalWebSocket === undefined) {
			try {
				// Optional fallback if runtime does not provide a global WebSocket.
				ExternalWebSocket = require('ws')
			} catch (error) {
				this.log('error', `Nobe: websocket runtime is unavailable: ${error.message}`)
				ExternalWebSocket = null
			}
		}

		return ExternalWebSocket
	}

	connectIfConfigured() {
		if (this.getHost() === '') {
			this.updateStatus(InstanceStatus.Unknown, 'Target IP is required')
			return
		}

		this.initSocket()
	}

	stopReconnectTimer() {
		if (this.reconnectTimer !== undefined) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = undefined
		}
	}

	scheduleReconnect() {
		if (this.destroying || this.getHost() === '') {
			return
		}

		if (this.reconnectTimer !== undefined) {
			return
		}

		const delay = this.reconnectDelayMs
		this.updateStatus(InstanceStatus.Connecting, `Reconnecting in ${delay}ms`)
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = undefined
			this.initSocket()
		}, delay)
		this.reconnectDelayMs = Math.min(delay * 2, RECONNECT_MAX_MS)
	}

	destroySocket() {
		const socket = this.socket

		if (socket === undefined) {
			return
		}

		this.socket = undefined

		if (typeof socket.removeAllListeners === 'function') {
			socket.removeAllListeners('open')
			socket.removeAllListeners('close')
			socket.removeAllListeners('error')
		} else if (typeof socket.removeEventListener === 'function' && this.socketHandlers) {
			socket.removeEventListener('open', this.socketHandlers.open)
			socket.removeEventListener('close', this.socketHandlers.close)
			socket.removeEventListener('error', this.socketHandlers.error)
		}
		this.socketHandlers = undefined

		try {
			socket.close()
		} catch (error) {
			// Ignore close errors while replacing sockets.
		}
	}

	initSocket() {
		const host = this.getHost()
		const port = this.getPort()
		const url = `ws://${host}:${port}/`
		const WebSocketClass = this.getWebSocketClass()

		if (this.destroying || host === '') {
			return
		}
		if (!WebSocketClass) {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'WebSocket runtime unavailable')
			return
		}

		this.stopReconnectTimer()
		this.destroySocket()
		this.updateStatus(InstanceStatus.Connecting, `Connecting to ${host}:${port}`)

		let socket
		try {
			socket = new WebSocketClass(url)
		} catch (error) {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Connection error')
			this.log('error', `Nobe: ${host}:${port}: ${this.describeError(error)}`)
			this.scheduleReconnect()
			return
		}

		this.socket = socket

		const handleOpen = () => {
			if (socket !== this.socket) {
				return
			}

			this.reconnectDelayMs = RECONNECT_INITIAL_MS
			this.updateStatus(InstanceStatus.Ok)
			this.log('info', `Nobe: connection established to ${host}:${port}`)
		}

		const handleClose = () => {
			if (socket !== this.socket) {
				return
			}

			this.socket = undefined
			this.socketHandlers = undefined
			if (this.destroying) {
				return
			}

			this.updateStatus(InstanceStatus.Disconnected, 'Connection closed')
			this.scheduleReconnect()
		}

		const handleError = (error) => {
			if (socket !== this.socket) {
				return
			}

			this.updateStatus(InstanceStatus.ConnectionFailure, 'Connection error')
			this.log('error', `Nobe: ${host}:${port}: ${this.describeError(error)}`)
			this.scheduleReconnect()
		}

		if (typeof socket.on === 'function') {
			socket.on('open', handleOpen)
			socket.on('close', handleClose)
			socket.on('error', handleError)
		} else if (typeof socket.addEventListener === 'function') {
			const openListener = () => handleOpen()
			const closeListener = () => handleClose()
			const errorListener = (event) => handleError(event && (event.error || event.message || event.type))

			socket.addEventListener('open', openListener)
			socket.addEventListener('close', closeListener)
			socket.addEventListener('error', errorListener)

			this.socketHandlers = {
				open: openListener,
				close: closeListener,
				error: errorListener,
			}
		} else {
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Unsupported WebSocket implementation')
			this.log('error', 'Nobe: websocket implementation does not expose on/addEventListener')
		}
	}

	describeError(error) {
		if (!error) {
			return 'Unknown error'
		}
		if (typeof error === 'string') {
			return error
		}
		if (error instanceof Error && error.message) {
			return error.message
		}
		if (typeof error.message === 'string') {
			return error.message
		}

		try {
			return JSON.stringify(error)
		} catch {
			return String(error)
		}
	}

	isSocketOpen(socket) {
		if (!socket) {
			return false
		}

		const openValue =
			typeof socket.OPEN === 'number'
				? socket.OPEN
				: socket.constructor && typeof socket.constructor.OPEN === 'number'
					? socket.constructor.OPEN
					: 1

		return socket.readyState === openValue
	}

	sendChannel(rawChannel) {
		const channel = parseInt(rawChannel, 10)
		if (!Number.isFinite(channel) || channel < 0 || channel > 31) {
			this.log('error', `Nobe: invalid channel value: ${String(rawChannel)}`)
			return
		}

		const cmd = JSON.stringify({ action: channel, event: 'testEvent' })
		const socket = this.socket

		if (!this.isSocketOpen(socket)) {
			this.log('warn', 'Nobe: command ignored because socket is not connected')
			this.scheduleReconnect()
			return
		}

		try {
			socket.send(cmd)
		} catch (error) {
			this.log('error', `Nobe: failed to send command: ${this.describeError(error)}`)
		}
	}
}

runEntrypoint(NobeOmniscopeInstance, [])

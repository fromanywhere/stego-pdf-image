function Notification() {
	let socketId = null;

	return {
		init: function (sockId) {
			socketId = sockId;
		},
		log: function (message) {
			global.jobs[socketId] && global.jobs[socketId].socket.emit('notification', {
				message: message,
				id: socketId
			})
			console.log(message);
		}
	}
}

module.exports = new Notification();

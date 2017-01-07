var cmdExec = require('../cmdExec');
var notification = require('../notification');
var Promise = require('es6-promise').Promise;

function packFiles(params) {
	var startTime = Date.now();

	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {
		var newParam = params;
		var zip = new cmdExec('zip ' + params.name + '.zip *', {
				cwd: newParam.targetPath
			},
			function () {
				resolve(params.absolutePath + params.name + '.zip');
				notification.log("Файлы упакованы за " + (Date.now() - startTime)/1000 + "с.");
			}
		);
	});
}

module.exports = packFiles;
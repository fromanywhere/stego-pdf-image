var cmdExec = require('../cmdExec');
var notification = require('../notification');
var Promise = require('es6-promise').Promise;
var fs = require('fs');


function packFiles(params) {
	var startTime = Date.now();

	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {

		fs.stat(params.targetPath, () => {
			let cmd = 'cd ' + params.targetPath + ' && ' + 'zip ' + params.name + '.zip *';

			cmdExec(cmd, {
					cwd: params.targetPath
				})
				.then (() => {
					notification.log("Файлы упакованы за " + (Date.now() - startTime)/1000 + "с.");
					resolve (params.targetPath + params.name + '.zip');
				})
		});
	})
}

module.exports = packFiles;

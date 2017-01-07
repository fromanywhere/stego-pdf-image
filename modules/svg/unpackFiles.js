var cmdExec = require('../cmdExec');
var notification = require('../notification');
var Promise = require('es6-promise').Promise;

function unpackFiles(params) {
	var startTime = Date.now();

	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {

		var zip = new cmdExec('unzip ' + params.name, {
				cwd: params.targetPath
			},
			function () {
				var svgFiles = new cmdExec("find *.svg | sort -t '_' -k 2n", {
					cwd: params.targetPath
				},
				function (stdout) {
					resolve(stdout.toString().trim().split('\n'));
					notification.log("ZIP-архив распакован за " + (Date.now() - startTime)/1000 + "с. Запуск постраничной конвертации...");
				})
			}
		);
	});
}

module.exports = unpackFiles;
var Promise = require('es6-promise').Promise;
var path = require('path');

var notification = require('../notification');
var cmdExec = require('../cmdExec');

function convertToSVG(params) {
	var startTime = Date.now();

	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {
		var shortName = path.basename(params.name, '.pdf');
		var convert = new cmdExec('pdf2svg ' + shortName + '.pdf ' + shortName + '_%d.svg all', {
				cwd: params.targetPath
			},
			function () {
				var svgFiles = new cmdExec("find *.svg | sort -t '_' -k 2n", {
					cwd: params.targetPath
				},
				function (stdout) {
					notification.log("PDF декодирован за " + (Date.now() - startTime)/1000 + "с. Запуск извлечения изображений...");
					resolve(stdout.toString().trim().split('\n'));
				})
			}
		);
	})
}

module.exports = convertToSVG;
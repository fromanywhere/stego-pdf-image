const Promise = require('es6-promise').Promise;
const path = require('path');
const fs = require('fs');

const notification = require('../notification');
const cmdExec = require('../cmdExec');

function convertToSVG(params) {
	const startTime = Date.now();

	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {
		let shortName = path.basename(params.name, '.pdf');

		fs.stat(params.targetPath, () => {
			let cmd = 'pdf2svg ' + shortName + '.pdf ' + shortName + '_%d.svg all';

			cmdExec(cmd, {
					cwd: params.targetPath
				})
				.then (() => {
					return cmdExec("find *.svg | sort -t '_' -k 2n", {
					cwd: params.targetPath
					})
					.then ((stdout) => {
						notification.log("PDF декодирован за " + (Date.now() - startTime)/1000 + "с. Запуск извлечения изображений...");
						resolve (stdout.toString().trim().split('\n'));
					})
				});
		})

	})
}

module.exports = convertToSVG;

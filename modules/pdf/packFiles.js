const cmdExec = require('../cmdExec');
const notification = require('../notification');
const Promise = require('es6-promise').Promise;

function packFiles(params) {
	let startTime = Date.now();

	notification.init(params.socketId);

	return new Promise((resolve, reject) => {
		const cmd = `zip ${params.name}.zip *`;
		cmdExec(cmd, {
				cwd: params.targetPath
			})
			.then(() => {
        resolve(params.absolutePath + params.name + '.zip');
        notification.log("Файлы упакованы за " + (Date.now() - startTime)/1000 + "с.");
			});
	});

}
module.exports = packFiles;
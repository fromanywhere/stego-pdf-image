const spawn = require('child_process').exec;
const Promise = require('es6-promise').Promise;

function cmdExec(cmd, args) {
	let child = spawn(cmd, args);
	let stdout = '';

	return new Promise((resolve, reject) => {
		child.stdout.on('data', (data) =>{
			stdout += data;
		});
		child.stdout.on('end', () => {
			resolve(stdout);
		});
	});
};

module.exports = cmdExec;

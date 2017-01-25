var spawn = require('child_process').exec;
var Promise = require('es6-promise').Promise;

function cmdExec(cmd, args) {
	var child = spawn(cmd, args);
	var stdout = '';

	return new Promise(function (resolve, reject) {
		child.stdout.on('data', function (data) {
			stdout += data;
		});
		child.stdout.on('end', function () {
			resolve(stdout);
		});
	});
};

module.exports = cmdExec;

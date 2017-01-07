var spawn = require('child_process').exec;

function cmdExec(cmd, args, cb) {
	var child = spawn(cmd, args);
	var stdout = '';

	child.stdout.on('data', function (data) {
		stdout += data;
	});

	child.stdout.on('end', function () {
		cb(stdout)
	});
}

module.exports = cmdExec;
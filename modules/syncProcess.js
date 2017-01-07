function syncProcess(func, threads, currentNum, targetNum, callback) {

	var processes = [];
	var currentFile = null;

	function makeSyncProcess(func, threads, currentNum, targetNum, callback) {

		currentFile = currentFile || currentNum;

		if (currentFile < targetNum) {
			for (var processCount = processes.length; (processCount < threads) && (currentFile < targetNum); processCount++) {

				func(currentFile, function () {
					processes.pop();
					makeSyncProcess(func, threads, currentFile, targetNum, callback);
				});

				currentFile += 1;
				processes.push(currentFile);
			}
		} else {
			if (!processes.length) {
				currentFile = null;
				callback && callback();
			}
		}
	}

	makeSyncProcess(func, threads, currentNum, targetNum, callback);

}


module.exports = syncProcess;
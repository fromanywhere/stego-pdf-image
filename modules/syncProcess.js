function syncProcess(func, threads, currentNum, targetNum, callback) {

	let processes = [];
	let currentFile = null;

	function makeSyncProcess(func, threads, currentNum, targetNum, callback) {

		currentFile = currentFile || currentNum;

		if (currentFile < targetNum) {
			for (let processCount = processes.length; (processCount < threads) && (currentFile < targetNum); processCount++) {

				func(currentFile, () => {
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
var fs = require('fs');
var Promise = require('es6-promise').Promise;

var notification = require('../notification');

function uploadImages(params) {

	var startTime = Date.now();

	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {
		var fileProp = params.files['pdf'];

		if (!fileProp.name) {
			reject();
		} else {
			var tempPath = fileProp.path;
			var rename = function () {
				fs.rename(tempPath, params.targetPath + params.name, function () {
					notification.log("Обработка PDF-файла...");
					resolve();
				});
			}

				fs.exists(params.targetPath, function (exist) {
					if (!exist) {
						fs.mkdir(params.targetPath, function () {
							rename();
						});
					} else {
						rename();
					}
			})
		}
	})
}

module.exports = uploadImages;

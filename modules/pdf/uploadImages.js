const fs = require('fs');
const Promise = require('es6-promise').Promise;

const notification = require('../notification');

function uploadImages(params) {


	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {
		let fileProp = params.files['pdf'];

		if (!fileProp.name) {
			reject();
		} else {
			let tempPath = fileProp.path;
			let rename = function () {
				fs.rename(tempPath, params.targetPath + params.name, () => {
					notification.log("Обработка PDF-файла...");
					resolve();
				});
			};

				fs.stat(params.targetPath, (err, stats) => {
					if (err) {
						fs.mkdir(params.targetPath, () => {
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

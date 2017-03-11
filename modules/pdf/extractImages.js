var fs = require('fs');
var Promise = require('es6-promise').Promise;
var cheerio = require('cheerio');
var cp = require('child_process');
var extend = require('xtend');
var path = require('path');

var notification = require('../notification');
var syncProcess = require('../syncProcess');
var protectImages = require('../protectImages')

function extractImages(params) {
	var startTime = Date.now();
	//console.log(params);
	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {
		var symbols = [];
		var filesProcessed = [];
		var shortName = path.basename(params.name, '.pdf');


		function processSvgFile(svgNum, callback) {
			// 1) Прочитать svg
			//console.log(svgNum, 'svgNum');
			svgNum = 0;

			for (var i = 0; i < params.svg.length; i++) {
				fs.readFile(params.targetPath + params.svg[i], {encoding: 'utf8'}, (err, currentSVGfileText) => {

					if (err) console.log(err);
					++svgNum;

					// 2) Распарсить svg images
					var $ = cheerio.load(currentSVGfileText, {
						xmlMode: true
					});

					// 3) Извлечь base64-encoded
					var imageId = 0,
					 		re = /^data:image\/png;base64,/,
							encodedImage,
							format;
					var p = 0,
							j = 0;
					$('image').each(function() {
						++imageId;
						var string = $(this).attr('xlink:href');

						if (string && string.indexOf('data:image/jpeg;base64') !== -1) {
							console.log(imageId, svgNum); //ПОКА ВСТРАИВАТЬ В PNG
						}

						if (string && string.indexOf('data:image/png;base64') !== -1) {
							console.log(imageId, svgNum);

							const buffer = Buffer.from(string.replace(re, ""), 'base64');
							encodedImage = buffer.toString('utf8');
							format = 'png';

							protectImages($(this).attr('xlink:href', imageId + '.png'), string, imageId, svgNum);
						}
					});
				});
			}

		}

		syncProcess(processSvgFile, params.cheerioProcessThreadsNum, 1, params.svg.length+1);
	});
}

module.exports = extractImages;

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

	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {
		var symbols = [];
		var filesProcessed = [];
		var shortName = path.basename(params.name, '.pdf');

		function writeFlag (currentSvgNum, logFunction, completeLogFunction, resolveData) {
			if (filesProcessed.indexOf(currentSvgNum) === -1) {
				filesProcessed.push(currentSvgNum);
			}
			logFunction();

			if (filesProcessed.length === params.svg.length) {
				resolve(resolveData);
				completeLogFunction();
			}
		}

		function writeFileFlag(currentSvgNum) {
			writeFlag(currentSvgNum, function() {
				notification.log("Извлечение изображений... " + ((filesProcessed.length/(params.svg.length))*100).toFixed(2) + "%");
			}, function () {
				notification.log("Изображения извлечены за " + (Date.now() - startTime)/1000);
			});
		}

		function writeDetectFlag(currentSvgNum, resolveData) {
			writeFlag(currentSvgNum, function() {
				notification.log("Поиск факта внедрения... " + ((filesProcessed.length/(params.svg.length))*100).toFixed(2) + "%");
			}, function () {
				notification.log("Поиск завершен за " + (Date.now() - startTime)/1000 + "c.");
			}, resolveData);
		}

		function processSvgFile(svgNum, callback) {
			// 1) Прочитать svg
			var currentSVGfile = params.svg[svgNum-1];
			fs.readFile(params.targetPath + currentSVGfile, {encoding: 'utf8'}, function (err, currentSVGfileText) {

				if (err) console.log(err);

				// 2) Распарсить svg images
				var $ = cheerio.load(currentSVGfileText, {
					xmlMode: true
				});

				// 3) Извлечь base64-encoded
				var imageId = 0;
				var re = /^data:image\/png;base64,/;

				$('image').each(function () {
					imageId++;
					var string = $(this).attr('xlink:href');

					if (string && string.indexOf('data:image/png;base64') !== -1) {
						const buffer = Buffer.from(string.replace(re, ""), 'base64');
						var encodedImage = buffer.toString('utf8');
						
						protectImages(encodedImage);
					}

					if (string && string.indexOf('data:image/jpeg;base64') !== -1) {
						fs.writeFileSync(params.targetPath + 'svg_' + svgNum + '_' + imageId + '.jpeg', string.replace(/^data:image\/jpeg;base64,/, ""), 'base64');
						$(this).attr('xlink:href', 'svg_' + svgNum + '_' + imageId + '.jpeg');
					}
				});
			});
		}

		syncProcess(processSvgFile, params.cheerioProcessThreadsNum, 1, params.svg.length+1);
	});
}

module.exports = extractImages;

var fs = require('fs');
var Promise = require('es6-promise').Promise;
var cheerio = require('cheerio');
var path = require('path');

var notification = require('../notification');
var cmdExec = require('../cmdExec');
var syncProcess = require('../syncProcess');

function convertToPdf(params) {
	var startTime = Date.now();

	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {

		var filesWrited = [];
		var writeFileFlag = function(currentPdfNum) {
			if (filesWrited.indexOf(currentPdfNum) === -1) {
				filesWrited.push(currentPdfNum);
			}

			notification.log("Обработка SVG-файлов... " + ((filesWrited.length/(params.svgFileList.length))*100).toFixed(2) + "%");

			if (filesWrited.length === params.svgFileList.length) {
				notification.log("Обработка SVG завершена за " + (Date.now() - startTime)/1000 + "с. Запуск генерации PDF-файла...");
				generateSinglePdf();
			}
		}

		var generateSinglePdf = function () {
			var pdfName = path.basename(params.name, '.zip') + '_conv.pdf';
			var command = 'cpdf ';
			for (var i = 0; i < params.svgFileList.length; i++) {
				command += path.basename(params.svgFileList[i], '.svg') + '.pdf ';
			}
			command += '-o ' + pdfName;

			if (params.generateCompressedPdf) {
				command += ' compress';
			}

			startTime = Date.now();
			var pdf = new cmdExec(command, {
					cwd: params.targetPath
				},
				function () {
					resolve(params.absolutePath + pdfName);
					notification.log("PDF-файл сгенерирован за " + (Date.now() - startTime)/1000 + "с.");
				}
			);
		}

		function processSvgFile (svgNum, callback) {
			var targetPdfName = path.basename(params.svgFileList[svgNum], '.svg') + '.pdf';

			var pdf = new cmdExec('svg2pdf ' + params.svgFileList[svgNum] + ' ' + targetPdfName, {
					cwd: params.targetPath
				},
				function () {
					writeFileFlag(targetPdfName);
					callback();
				}
			);
		}


		syncProcess(processSvgFile, params.svgProcessThreadsNum, 0, params.svgFileList.length);
	});
}

module.exports = convertToPdf;

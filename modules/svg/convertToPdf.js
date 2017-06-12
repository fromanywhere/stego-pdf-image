const fs = require('fs');
const Promise = require('es6-promise').Promise;
const cheerio = require('cheerio');
const path = require('path');

const notification = require('../notification');
const cmdExec = require('../cmdExec');
const syncProcess = require('../syncProcess');

function convertToPdf(params) {
	let startTime = Date.now();

	notification.init(params.socketId);


  return new Promise((resolve, reject) => {
		let filesWrited = [];

		function writeFileFlag(currentPdfNum) {
      if (filesWrited.indexOf(currentPdfNum) === -1) {
				filesWrited.push(currentPdfNum);
			}

			notification.log("Обработка SVG-файлов... " + ((filesWrited.length/(params.svg.length))*100).toFixed(2) + "%");

			if (filesWrited.length === params.svg.length) {
				notification.log("Обработка SVG завершена за " + (Date.now() - startTime)/1000 + "с. Запуск генерации PDF-файла...");
				generateSinglePdf();
			}
		}

		function generateSinglePdf() {
			let pdfName = path.basename(params.name, '.zip') + '_conv.pdf';
			let command = 'cpdf ';
			for (let i = 0; i < params.svg.length; i++) {
				command += path.basename(params.svg[i], '.svg') + '.pdf ';
			}
			command += '-o ' + pdfName;

			if (params.generateCompressedPdf) {
				command += ' compress';
			}

			startTime = Date.now();
			let pdf = new cmdExec(command, {
					cwd: params.targetPath
				});
      pdf
				.then(() => {
          resolve(params.absolutePath + pdfName);
          notification.log("PDF-файл сгенерирован за " + (Date.now() - startTime)/1000 + "с.");
      	})
		}

		function processSvgFile (svgNum, callback) {
			let targetPdfName = path.basename(params.svg[svgNum], '.svg') + '.pdf';

			let pdf = new cmdExec('rsvg-convert -f pdf -o ' + targetPdfName + ' ' + params.svg[svgNum], {
					cwd: params.targetPath
				});

			pdf.then(() => {
        writeFileFlag(targetPdfName);
        callback();
			})
		}

		syncProcess(processSvgFile, params.svgProcessThreadsNum, 0, params.svg.length);
	});
}

module.exports = convertToPdf;

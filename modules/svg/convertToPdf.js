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

		var jsonFile = {};
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
console.log('!', params.targetPath, command);
			var pdf = new cmdExec(command, {
					cwd: params.targetPath
				},
				function () {
					resolve(params.absolutePath + pdfName);
					notification.log("PDF-файл сгенерирован за " + (Date.now() - startTime)/1000 + "с.");
				}
			);
		}

		function patchSVGFile(svgNum, callback) {
			// Открыть svg-файл и заменить path тех символов в оглавлении, что есть, на те, что в json
			if (jsonFile.protectedPages.indexOf(svgNum+1) != -1) {

				// 1) Прочитать svg
				var currentSVGfile = params.svgFileList[svgNum];
				var symbolsWhichCanBeReplaced = {};

				fs.readFile(params.targetPath + currentSVGfile, {encoding: 'utf8'}, function (err, currentSVGfileText) {

					// 2) Распарсить svg defs symbol
					var $ = cheerio.load(currentSVGfileText, {
						xmlMode: true
					});

					var $symbols = $('svg defs symbol');
					var $summary = $('svg defs g');
					var replaceIndex = [];

					// 3) Заменить символы в оглавлении на те, что в json
					$symbols.each(function () {
						var $this = $(this);
						var id = $this.attr('id');

						if (jsonFile.symbols[id]) {
							var mod = jsonFile.symbols[id].mod;

							$this.children('path').attr('d', jsonFile.symbols[id].path);

							// По ходу замены нужно проверять поля json на существование mod
							if (mod) {
								replaceIndex.push(id);

								// Добавить в оглавление новый соответствующий символ
								$summary.append('<symbol overflow="visible" id="' + mod + '"><path style="stroke:none;" d="' + jsonFile.symbols[mod].path + '"/></symbol>');
							}
						}

					});

					// Обойти все замещаемые символы в документе
					var replacedCount = 0;
					for (var i = 0; i < replaceIndex.length; i++) {
						var id = replaceIndex[i];
						var mod = jsonFile.symbols[id].mod;
						var $mainSelector = $('[xlink\\:href="#' + id+ '"]');
						var maxItemCount = Math.floor($mainSelector.length / jsonFile.countThreshold);

						for (var j = 0; j < maxItemCount; j++) {
							var $selector = $mainSelector.eq(j*jsonFile.countThreshold + Math.floor(Math.random()*jsonFile.countThreshold));

							if ($selector.length) {
								$selector.attr('xlink:href', '#' + mod);

								/* temporary */
								//$selector.parent().attr('style', 'fill:rgb(255%,0%,0%);fill-opacity:1;')
								/* /temporaty */

								replacedCount++;
							}
						}
					}
					notification.log("На странице " + Number(svgNum+1) +  " заменено символов: " + replacedCount);

					fs.writeFile(params.targetPath + params.svgFileList[svgNum], $.html(), function(err) {
						if (!err) {
							callback();
						}
					});
				});
			} else {
				// Нужно сымитировать асинхронность
				setTimeout(function () {
					callback();
				}, 1);
			}
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

		var jsonFiles = new cmdExec("find *.json", {
			cwd: params.targetPath
		},
		function (stdout) {
			jsonFileName = stdout.toString().trim().split('\n');
			jsonFile = jsonFileName.length && jsonFileName[0] && JSON.parse(fs.readFileSync(params.targetPath + jsonFileName[0], 'utf8'));

			// Проверить, что мы хотим и можем обработать json
			if (params.usePalette !== 'false' && jsonFile) {
				notification.log("Применение палитры... ");

				syncProcess(patchSVGFile, params.cheerioProcessThreadsNum, 0, params.svgFileList.length, function () {
					syncProcess(processSvgFile, params.svgProcessThreadsNum, 0, params.svgFileList.length);
				});
			} else {
				syncProcess(processSvgFile, params.svgProcessThreadsNum, 0, params.svgFileList.length);
			}
		})

	});
}

module.exports = convertToPdf;

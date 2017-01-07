var fs = require('fs');
var Promise = require('es6-promise').Promise;
var cheerio = require('cheerio');

var notification = require('../notification');
var syncProcess = require('../syncProcess');

function generateJSON(params) {
	var startTime = Date.now();

	notification.init(params.socketId);

	return new Promise(function (resolve, reject) {
		if (params.generatePalette === 'false') {
			notification.log("Генерация палитры отключена. Запуск архивации...");
			resolve();
			return;
		}

		var exportJSON = {
				symbols: {}
			}

		var shortName = params.name.replace('.pdf', '');
		var usedPaths = {};
		var processedFiles = 0;

		function processSvgFile(svgNum, callback) {
			// 1) Прочитать svg
			var currentSVGfile = params.svg[svgNum-1];

			fs.readFile(params.targetPath + currentSVGfile, {encoding: 'utf8'}, function (err, currentSVGfileText) {

				// 2) Распарсить svg defs symbol
				var $ = cheerio.load(currentSVGfileText, {
					xmlMode: true
				});

				var $symbols = $('svg defs symbol');
				var localUsedPath = [];

				// 3) Создать алфавит symbolId -> path
				$symbols.each(function (index) {
					var $this = $(this);
					var id = 'svg_' + svgNum + '_' + index;
					var path = $this.children('path').attr('d').trim();
					var $linkedItems = $('[xlink\\:href="#' + $this.attr('id') + '"]');

					if (path) {
						// Записать только уникальные символы
						if (usedPaths[path] === undefined) {
							usedPaths[path] = id;

							exportJSON.symbols[id] = {
								path: path
							}
						}

						// Сформируем список всех использованных на странице символов
						// Затем на основе этого списка перегенерируем локальный алфавит на странице,
						// ссылаясь на глобальный алфавит
						localUsedPath.push(usedPaths[path]);

						// Переписать элементы, ссылающиеся на алфавит
						$linkedItems.attr('xlink:href', '#' + usedPaths[path]);
					} else {
						$linkedItems.remove();
					}

				});

				// Очистить локальный алфавит
				$symbols.remove();

				// Создать его заново
				localUsedPath.forEach(function (element) {
					$('svg defs g').append('<symbol overflow="visible" id="' + element + '"><path style="stroke:none;" d="' + exportJSON.symbols[element].path + '"/></symbol>');
				})

				// Обойти все используемые локально символы, собрать статистику по
				// частоте использования, размеру и расположению на странице
				$('[xlink\\:href^="#svg"]').each(function () {
					var id = $(this).attr('xlink:href').replace('#', '');

					exportJSON.symbols[id].count
						? exportJSON.symbols[id].count++
						: exportJSON.symbols[id].count = 1;

					exportJSON.symbols[id].pageUsage
						? true
						: exportJSON.symbols[id].pageUsage = {};

					exportJSON.symbols[id].pageUsage['page_' + svgNum]
						? exportJSON.symbols[id].pageUsage['page_' + svgNum]++
						: exportJSON.symbols[id].pageUsage['page_' + svgNum] = 1;
				})

				fs.writeFile(params.targetPath + shortName + '_'+ svgNum + '.svg', $.html(), function(err) {
					if (!err) {
						processedFiles++;
						callback();
						notification.log("Генерация палитры... " + ((processedFiles/(params.svg.length+1))*100).toFixed(2) + "%");
					}
				});

			});
		}

		syncProcess(processSvgFile, params.cheerioProcessThreadsNum, 1, params.svg.length+1, function () {
			// 5) Сохранить в json
			exportJSON.pageCount = params.svg.length;
			exportJSON.protectedPages = [];
			exportJSON.countThreshold = 0;
			fs.writeFile(params.targetPath + shortName + '.json', JSON.stringify(exportJSON, null, 4), function(err) {
				if (!err) {
					resolve();
					notification.log('Палитра сгенерирована за ' +  (Date.now() - startTime)/1000 + "c. Запуск архивации...")
				}
			});
		});
	});
}

module.exports = generateJSON;
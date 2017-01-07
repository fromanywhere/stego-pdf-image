/**
Где-то тут течет очень много памяти.
Довольно большая часть из этой памяти — неубиваемый new Canvas, который не чистится даже принудительным global.gc()
Для решения этой проблемы рекомендуется вызывать этот модуль, как дочерний процесс, а после завершения работы прибивать
*/

var fs = require('fs');
var Canvas = require('canvas');
var parse = require('parse-svg-path');
var draw = require('draw-svg-path');
var Promise = require('es6-promise').Promise;

var ZOOM = 10;
var MIN_DIFF = 1;
var MAX_DIFF = 20;
var DETECT_MODIFY = '____';

Array.prototype.max = function() {
	return Math.max.apply(null, this);
};

Array.prototype.min = function() {
	return Math.min.apply(null, this);
};

function createLightPath(oldPath) {
	var splitted = oldPath.split(' ');
	var resultArray = [];
	var xMinArray = [];
	var yMinArray = [];
	var xMin = 0;
	var yMin = 0;
	var coordIsX = true;

	for (var i = 0; i < splitted.length; i++) {
		var token = parseFloat(splitted[i]);

		if (isNaN(token)) {
			coordIsX = true;
		} else {
			if (coordIsX) {
				xMinArray.push(token);
			} else {
				yMinArray.push(token);
			}
			coordIsX = !coordIsX;
		}
	}

	xMin = xMinArray.min();
	yMin = yMinArray.min();

	for (var i = 0; i < splitted.length; i++) {
		var token = parseFloat(splitted[i]);
		if (isNaN(token)) {
			coordIsX = true;
			resultArray.push(splitted[i]);
		} else {
			if (coordIsX) {
				resultArray.push((token-xMin) * ZOOM);

			} else {
				resultArray.push((token-yMin) * ZOOM);
			}
			coordIsX = !coordIsX;
		}
	}

	return {
		path: resultArray.join(' ').trim(),
		width: (xMinArray.max() - xMinArray.min()) * ZOOM,
		height: (yMinArray.max() - yMinArray.min()) * ZOOM
	}
}

function detectSimilarSymbols(symbolPathArray, svgNum, params) {

	return new Promise(function (resolve, reject) {

		var usedSymbols = {};
		var allSymbols = [];

		// Нарежем картинок с символами
		for (var i = 0; i < symbolPathArray.length; i++) {

			var path = createLightPath(symbolPathArray[i].path);
			var width = Math.ceil(path.width);
			var height = Math.ceil(path.height);

			var canvas = new Canvas(width, height);

			var parsedPath = parse(path.path);
			draw(canvas.getContext('2d'), parsedPath);
			canvas.getContext('2d').fill();
			canvas.getContext('2d').stroke();

			allSymbols.push(canvas);
		}


		var allSymbolsCount = allSymbols.length;

		for (var i = 0; i < allSymbolsCount; i++) {

			if (allSymbols[i].excluded) {
				continue;
			}

			var pixelsTest = allSymbols[i].getContext('2d').getImageData(0, 0, allSymbols[i].width, allSymbols[i].height);
			var hasDifference = false;
			for (var d = 3; d < pixelsTest.data.length; d += 4) {
				if (pixelsTest.data[d] != pixelsTest.data[d-4]) {
					hasDifference = true;
					break;
				}
			}

			if (!hasDifference) {
				continue;
			}

			for (var j = i+1; j < allSymbolsCount; j++) {

				if (allSymbols[j].excluded) {
					continue;
				}

				if (allSymbols[i].width === allSymbols[j].width) {
					if (allSymbols[i].height === allSymbols[j].height) {

						var pixelsI = allSymbols[i].getContext('2d').getImageData(0, 0, allSymbols[i].width, allSymbols[i].height);
						var pixelsJ = allSymbols[j].getContext('2d').getImageData(0, 0, allSymbols[j].width, allSymbols[j].height);
						var l = pixelsI.data.length;
						var diff = 0;

						for (k = 0; k < l; k++) {			;

							diff += (pixelsI.data[k] === pixelsJ.data[k])
								? 0
								: 1;
						}

						if (diff < MAX_DIFF * ZOOM) {
							usedSymbols[i] ? usedSymbols[i].push(j) : usedSymbols[i] = [j];
							usedSymbols[i].equal = usedSymbols[i].equal || 0;
							usedSymbols[i].notEqual = usedSymbols[i].notEqual || 0;

							allSymbols[i].excluded = true;
							allSymbols[j].excluded = true;

							if (diff > MIN_DIFF * ZOOM) {
								usedSymbols[i].maybeModified = true;
								usedSymbols[i].notEqual += 1;
								allSymbols[j].asSample = false;
							} else {
								usedSymbols[i].equal +=1;
								allSymbols[j].asSample = true;
							}

						}

					}
				}
			}
		}

		function writeSymbol(similarSymbolIndex, folderPath) {

			return new Promise(function (resolve, reject) {
				var buffer = [];
				var namePostfix = symbolPathArray[similarSymbolIndex].isModified ? DETECT_MODIFY : '';
				var fileName = folderPath + '/'  + similarSymbolIndex + namePostfix + '.png';
				var stream = allSymbols[similarSymbolIndex].pngStream();

				stream.on('data', function(chunk) {
					buffer.push(chunk);
				});

				stream.on('end', function() {
					fs.writeFile(fileName, Buffer.concat(buffer), 'binary', function () {
						resolve();
					});
				});
			})
		}

		function walkSimilarSymbols(index, similarSymbolsArray, folderPath, callback) {
			if (index < similarSymbolsArray.length) {
				writeSymbol(similarSymbolsArray[index], folderPath).then(function () {
					walkSimilarSymbols(index + 1, similarSymbolsArray, folderPath, callback)
				})
			} else {
				callback();
			}
		}

		function walkUniqSymbols(index, uniqSymbolArray, callback) {
			if (index < uniqSymbolArray.length) {
				var currentUniqSymbolKey = uniqSymbolArray[index];
				var namePostfix = usedSymbols[currentUniqSymbolKey].maybeModified ? DETECT_MODIFY : '';

				var folderPath = params.targetPath + svgNum + '_' + currentUniqSymbolKey + namePostfix;

				fs.mkdir(folderPath, function () {

					writeSymbol(currentUniqSymbolKey, folderPath).then(function () {
						walkSimilarSymbols(0, usedSymbols[currentUniqSymbolKey], folderPath, function () {
							walkUniqSymbols(index+1, uniqSymbolArray, callback);
						})
					});
				});

			} else {
				callback();
			}
		}

		function getPrimaryOrModified(usedSymbols) {
			var result = [];
			for (var i in usedSymbols) {

				if (usedSymbols[i].notEqual) {
					var statCoeff = !!(Math.floor(usedSymbols[i].equal / usedSymbols[i].notEqual));
					var symbols = usedSymbols[i];
					var path = params.absolutePath + svgNum + '_' + i + DETECT_MODIFY + '/';
					var alterSymbol;
					symbols.push(Number(i));

					for (var j = 0; j < symbols.length; j++) {
						if (!allSymbols[symbols[j]].asSample) {
							alterSymbol = symbols[j];
							break;
						}
					}

					var symbolsPair = statCoeff
						? {sourceImgOriginal: path + i + '.png', sourceImgAlter: path + alterSymbol + DETECT_MODIFY + '.png'}
						: {sourceImgOriginal: path + alterSymbol + '.png', sourceImgAlter: path + i + DETECT_MODIFY + '.png'};

					result.push(symbolsPair);
				}
			}

			return result;
		}

		var uniqSymbolArray = Object.keys(usedSymbols);
		var symbolsSet = [];

		walkUniqSymbols(0, uniqSymbolArray, function () {
			console.log("Уникальных символов:", uniqSymbolArray.length);
			symbolsSet = getPrimaryOrModified(usedSymbols);
			resolve(symbolsSet);
		});
	})
}

process.on('message', function(data) {

	var symbolPathArray = data.symbolsArray;
	var svgNum = data.svgNum;
	var params = data.params;

	detectSimilarSymbols(symbolPathArray, svgNum, params).then(function (result) {
		process.send(result);
	})
});

module.exports = detectSimilarSymbols;
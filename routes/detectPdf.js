var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var extend = require('xtend');
var handlebars = require('handlebars');
var hbs = require('express-hbs');

var notification = require('../modules/notification');

var convertToSVG = require('../modules/pdf/convertToSVG');
var uploadImages = require('../modules/pdf/uploadImages');
var extractImages = require('../modules/pdf/extractImages');

var CHEERIO_PROCESS_THREADS_NUM = 1;
var detectTemplate = " \
	{{#if similar}} \
		Измененные символы (разница видна по наведению мыши): <br /><br />\
		{{#each similar}} \
			<span class='container-img'> \
				<img src='{{sourceImgOriginal}}' class='original-img' /> \
				<img src='{{sourceImgAlter}}' class='alter-img' /> \
			</span> \
		{{/each}} \
	{{else}} \
		Признаков внедрения не найдено. \
	{{/if}}";
var compiledDetectTemplate = handlebars.compile(detectTemplate);

router.post('/', function(req, res) {
console.log("post event");
	var form = new formidable.IncomingForm();
	var params = {};

    form.parse(req, function(err, fields, files) {

		var name = files['pdf'].name;
		var absolutePath = '/uploads/' + name + '_' + Date.now() + '/';
		var targetPath = appRoot + '/public' + absolutePath;
		var startTime = Date.now();

		params = extend(params, {
			name: name,
			files: files,
			absolutePath: absolutePath,
			targetPath: targetPath,
			generatePalette: fields.palette || 'false',
			socketId: fields.socketCookie
		});

		notification.init(params.socketId);

		uploadImages(params)
			.then(function resolveUpload() {
				return convertToSVG(params);
			})
			.then(function resolveConvert(svgs) {
				params.svg = svgs;
				params.cheerioProcessThreadsNum = CHEERIO_PROCESS_THREADS_NUM;
				return extractImages(params);
			})
			.then(function resolveDetect(embedded) {
				params.embedded = embedded;
				res.send(compiledDetectTemplate(embedded));
				notification.log("Детектирование завершено за " + (Date.now()-startTime)/1000 + 'c.');
			});
    });


	form.on('field', function(name, value) {
		if (name === 'socketCookie') {
			params.socketId = value;
			notification.init(params.socketId);
		}
	});

	form.on('progress', function(bytesReceived, bytesExpected) {
		notification.log("Загрузка файла... " + ((bytesReceived/bytesExpected)*100).toFixed(2) + "%")
	});
});

module.exports = router;

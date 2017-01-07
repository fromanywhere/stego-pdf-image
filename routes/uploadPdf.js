var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var extend = require('xtend');
var handlebars = require('handlebars');

var notification = require('../modules/notification');

var packFiles = require('../modules/pdf/packFiles');
var generateJSON = require('../modules/pdf/generateJSON');
var convertToSVG = require('../modules/pdf/convertToSVG');
var uploadImages = require('../modules/pdf/uploadImages');
var extractImages = require('../modules/pdf/extractImages');

var CHEERIO_PROCESS_THREADS_NUM = 1;
var downloadTemplate = "<a href='{{href}}' download>Скачать</a>";
var compiledDownloadTemplate = handlebars.compile(downloadTemplate);

router.post('/', function(req, res) {

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
			.then(function resolveExtract () {
				return generateJSON(params);
			})
			.then(function resolveGenerate() {
				return packFiles(params);
			})
			.then(function resolvePack(ziplink) {
				params.ziplink = ziplink;
				res.send(compiledDownloadTemplate({href: ziplink}));
				notification.log("Конвертация завершена за " + (Date.now()-startTime)/1000 + 'c.');
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
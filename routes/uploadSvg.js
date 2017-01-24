var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var extend = require('xtend');
var handlebars = require('handlebars');

var notification = require('../modules/notification');

var uploadImages = require('../modules/svg/uploadImages');
var unpackFiles = require('../modules/svg/unpackFiles');
var convertToPdf = require('../modules/svg/convertToPdf');

var SVG_PROCESS_THREADS_NUM = 8;
var CHEERIO_PROCESS_THREADS_NUM = 1;
var GENERATE_COMPRESSED_PDF = false;
var downloadTemplate = "<a href='{{href}}' download>Скачать</a>";
var compiledDownloadTemplate = handlebars.compile(downloadTemplate);

/* File upload */

router.post('/', function(req, res) {

	var form = new formidable.IncomingForm();
	var params = {};

    form.parse(req, function(err, fields, files) {

		var name = files['zip'].name;
		var absolutePath = '/uploads/' + name + '_' + Date.now() + '/';
		var targetPath = appRoot + '/public' + absolutePath;
		var startTime = Date.now();

		params = extend(params, {
			name: name,
			files: files,
			absolutePath: absolutePath,
			targetPath: targetPath,
			svgProcessThreadsNum: SVG_PROCESS_THREADS_NUM,
			cheerioProcessThreadsNum: CHEERIO_PROCESS_THREADS_NUM,
			generateCompressedPdf: GENERATE_COMPRESSED_PDF,
			socketId: fields.socketCookie
		});

		notification.init(params.socketId);

		uploadImages(params)
			.then(function resolveUpload() {
				return unpackFiles(params);
			})
			.then(function resolvePack(svgFileList) {
				params.svgFileList = svgFileList;
				return convertToPdf(params);
			})
			.then(function resolveConvert(pdflink) {
				params.pdflink = pdflink;
				res.send(compiledDownloadTemplate({href: pdflink}));
				notification.log("Конвертация завершена за " + (Date.now()-startTime)/1000 + 'c.');
			})
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

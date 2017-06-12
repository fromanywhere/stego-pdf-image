const express = require('express');
const router = express.Router();
const formidable = require('formidable');
const extend = require('xtend');
const handlebars = require('handlebars');
const hbs = require('express-hbs');

const notification = require('../modules/notification');
const convertToSVG = require('../modules/pdf/convertToSVG');
const uploadImages = require('../modules/pdf/uploadImages');
const extractImages = require('../modules/pdf/extractImages');
const convertToPdf = require('../modules/svg/convertToPdf');
const packFiles = require('../modules/pdf/packFiles');

let CHEERIO_PROCESS_THREADS_NUM = 1;
let SVG_PROCESS_THREADS_NUM = 8;

const downloadTemplate = "<a class='navigationButton' href='{{href}}' download>Скачать</a>";
const compiledDetectTemplate = handlebars.compile(downloadTemplate);

router.post('/', (req, res) => {
console.log("post event");
	let form = new formidable.IncomingForm();
	let params = {};

    form.parse(req, (err, fields, files) => {

		let name = files['pdf'].name;
		let absolutePath = '/uploads/' + name + '_' + Date.now() + '/';
		let targetPath = appRoot + '/public' + absolutePath;
		let startTime = Date.now();

		params = extend(params, {
			name: name,
			files: files,
			absolutePath: absolutePath,
			targetPath: targetPath,
			generatePalette: fields.palette || 'false',
			socketId: fields.socketCookie,
      svgProcessThreadsNum: SVG_PROCESS_THREADS_NUM
		});

		notification.init(params.socketId);

		uploadImages(params)
			.then(() => {
				return convertToSVG(params);
			})
			.then((svgs) => {
				params.svg = svgs;
				params.cheerioProcessThreadsNum = CHEERIO_PROCESS_THREADS_NUM;
				return extractImages(params, 'detect');
			})
      .then(() => {
        return convertToPdf(params);
      })
      .then(() => {
        return packFiles(params);
      })
      .then((ziplink) => {
        params.ziplink = ziplink;
        res.send(compiledDetectTemplate({href: ziplink}));
        notification.log("Конвертация завершена за " + (Date.now()-startTime)/1000 + 'c.');
      });
    });


	form.on('field', (name, value) => {
		if (name === 'socketCookie') {
			params.socketId = value;
			notification.init(params.socketId);
		}
	});

	form.on('progress', (bytesReceived, bytesExpected) => {
		notification.log("Загрузка файла... " + ((bytesReceived/bytesExpected)*100).toFixed(2) + "%")
	});
});

module.exports = router;

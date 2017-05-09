const express = require('express');
const router = express.Router();
const formidable = require('formidable');
const extend = require('xtend');

const notification = require('../modules/notification');
const convertToSVG = require('../modules/pdf/convertToSVG');
const uploadImages = require('../modules/pdf/uploadImages');
const extractImages = require('../modules/pdf/extractImages');
const convertToPdf = require('../modules/svg/convertToPdf');
const cmdExec = require('../modules/cmdExec');

let CHEERIO_PROCESS_THREADS_NUM = 1;
var SVG_PROCESS_THREADS_NUM = 8;

router.post('/', function(req, res) {

	let form = new formidable.IncomingForm();
	let params = {};

    form.parse(req, function(err, fields, files) {

		let name = files['pdf'].name;
		let path = appRoot + '/public/uploads';
		let absolutePath = '/uploads/' + name + '_' + Date.now() + '/';
		let targetPath = appRoot + '/public' + absolutePath;
		let startTime = Date.now();
		let protectedImages = [];


      params = extend(params, {
			name: name,
			files: files,
			path: path,
			absolutePath: absolutePath,
			targetPath: targetPath,
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
				return extractImages(params);
			})
			.then(() => {
        return cmdExec("find *.png | sort -t '_' -k 2n", {
          cwd: params.targetPath
        })
          .then ((stdout) => {
            return (stdout.toString().trim().split('\n'));
          })
				})
			.then((protectedImages) => {
        params.files = protectedImages;
        notification.log("Конвертация завершена за " + (Date.now()-startTime)/1000 + 'c.');
        return convertToPdf(params);å
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

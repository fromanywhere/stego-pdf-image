const fs = require('fs');
const Promise = require('es6-promise').Promise;
const cheerio = require('cheerio');
const path = require('path');

const notification = require('../notification');
const syncProcess = require('../syncProcess');
const protectImages = require('../protectImages');
const extractWTM = require('../extractWTM');
const transformMessage = require('../transformMessage');



function extractImages(params, flag) {
  const startTime = Date.now();
	notification.init(params.socketId);

	return new Promise((resolve, reject) => {
    let filesProcessed = [];
    let shortName = path.basename(params.name, '.pdf');

    function writeFlag (currentSvgNum, logFunction, completeLogFunction, resolveData) {
      if (filesProcessed.indexOf(currentSvgNum) === -1) {
        filesProcessed.push(currentSvgNum);
      }
      logFunction();

      if (filesProcessed.length === params.svg.length) {
        resolve(resolveData);
        completeLogFunction();
      }
    }

    function writeFileFlag(currentSvgNum) {
      writeFlag(currentSvgNum, () => {
        notification.log("Извлечение изображений... " + ((filesProcessed.length/(params.svg.length))*100).toFixed(2) + "%");
      }, function () {
        notification.log("Изображения извлечены за " + (Date.now() - startTime)/1000);
      });
    }

		function processSvgFile(svgNum, callback) {
			// 1) Прочитать svg
      let currentSVGfile = params.svg[svgNum-1];
      fs.readFile(params.targetPath + currentSVGfile, {encoding: 'utf8'}, (err, currentSVGfileText) => {

					if (err) console.log(err);

					// 2) Распарсить svg images
					let $ = cheerio.load(currentSVGfileText, {
						xmlMode: true
					});

					// 3) Извлечь base64-encoded
					let re = /^data:image\/png;base64,/,
							encodedImage;

					if (flag === 'protect') {
            let resultOfTransformMessage = transformMessage();

            $('image').each(function() {
              let string = $(this).attr('xlink:href');

              if (string && ((string.indexOf('data:image/jpeg;base64') !== -1 || string.indexOf('data:image/png;base64')) !== -1)) {
                const buffer = Buffer.from(string.replace(re, ""), 'base64');
                encodedImage = buffer.toString('utf8');

                let protectedImg = protectImages(string, $(this).attr('width'), $(this).attr('height'), resultOfTransformMessage, params);
                $(this).attr('xlink:href', protectedImg);
              }
            });
          } else if (flag === 'detect') {
            $('image').each(function() {
              let string = $(this).attr('xlink:href');

              if (string && ((string.indexOf('data:image/jpeg;base64') !== -1 || string.indexOf('data:image/png;base64')) !== -1)) {
                const buffer = Buffer.from(string.replace(re, ""), 'base64');
                encodedImage = buffer.toString('utf8');

                let refreshedImg = extractWTM(string, $(this).attr('width'), $(this).attr('height'), params);
                $(this).attr('xlink:href', refreshedImg);
              }
            });
          }



          fs.writeFile(params.targetPath + shortName + '_'+ svgNum + '.svg', $.html(), () => {
            writeFileFlag(svgNum);
            callback();
          });

        });
    }
		syncProcess(processSvgFile, params.cheerioProcessThreadsNum, 1, params.svg.length+1);
	});
}

module.exports = extractImages;

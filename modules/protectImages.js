
var fs = require('fs');
var Promise = require('es6-promise').Promise;
var pdf2svg = require('../routes/pdf2svg');
var sizeOf = require('image-size');
var Canvas = require('../node_modules/canvas');
var Image = Canvas.Image,
    ImageData = Canvas.ImageData;

function transformMessage() {
  var messageSrc = appRoot + '/matlab/message.png';
  var imageM = new Image();
  imageM.src = messageSrc;
  var widthM = +imageM.width,
      heightM = +imageM.height,
      canvasM = new Canvas(widthM, heightM),
      binaryMessage = [],
      imageDataM, ctxM;

    ctxM = canvasM.getContext('2d');
    ctxM.drawImage(imageM, 0, 0);
    imageDataM = ctxM.getImageData(0, 0, widthM, heightM);
    console.log(widthM, heightM);
    console.log(imageDataM.data.length);

    for (var i = 0; i < imageDataM.data.length; i+=4) {
      if (imageDataM.data[i] == 255) {
        binaryMessage.push(0);
      } else {
        binaryMessage.push(1);
      }
    }
    console.log('m', binaryMessage.length);
    var result = {
      binaryMessage: binaryMessage,
      widthM: widthM
    }
    return result;
  }

function protectImages(img, string, imageId, svgNum) {

  let image = new Image();
  image.src = string;
  let width = +img[0].attribs.width,
      height = +img[0].attribs.height,
      canvas = new Canvas(width, height),
      imageData, ctx,
      arrRed = [], arrGreen = [], arrBlue = [],
      arrRed8 = [], arrGreen8 = [], arrBlue8 = [],
      binaryMessage = [], resultOfTransformMessage = {};

  ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  imageData = ctx.getImageData(0, 0, width, height);

  resultOfTransformMessage = transformMessage();
  binaryMessage = resultOfTransformMessage.binaryMessage;
  console.log('widthM', resultOfTransformMessage.widthM);

  console.log(imageData.data.length, width, height);

    //exrtract channels
  for (var i = 0; i < imageData.data.length; i+=4) {
    arrRed.push(('00000000' + imageData.data[i].toString(2)).slice(-8));
    arrGreen.push(('00000000' + imageData.data[i + 1].toString(2)).slice(-8));
    arrBlue.push(('00000000' + imageData.data[i + 2].toString(2)).slice(-8));
  }
  console.log(arrRed.length, width, height);

  var channelLength = arrRed.length;

  //extract 8th bit plane and copy its to first plane in a red channel
    for (var i = 0; i < channelLength; i++) {
      let arr = arrRed[i].split('');
      arr[7] = arr[0];
      arrRed8.push(arr[0]);
      arrRed[i] = arr.join('');
    }

  //extract 8th bit plane and copy its to first plane in a green channel
    for (var i = 0; i < channelLength; i++) {
      let arr = arrGreen[i].split('');
      arr[7] = arr[0];
      arrGreen8.push(arr[0]);
      arrGreen[i] = arr.join('');
    }

  //extract 8th bit plane and copy its to first plane in a blue channel
    for (var i = 0; i < channelLength; i++) {
      let arr = arrBlue[i].split('');
      arr[7] = arr[0];
      arrBlue8.push(arr[0]);
      arrBlue[i] = arr.join('');
    }

    console.log(arrRed8.length);
    console.log(arrGreen8.length);
    console.log(arrBlue8.length);

    //embedding the message into the channels
    var numberOfString = 1, j = 0;

    for (var i = 0; i < binaryMessage.length; i++) {
      if (j === (width * (numberOfString - 1) + resultOfTransformMessage.widthM)) {
        numberOfString++;
        j += (width - resultOfTransformMessage.widthM);
      }
      arrRed8[j] = binaryMessage[i] ^ arrRed8[j];
      arrGreen8[j] = binaryMessage[i] ^ arrGreen8[j];
      arrBlue8[j] = binaryMessage[i] ^ arrBlue8[j];
      j++;
    }

    //replace 8th plane in red channel to protected
    for (var i = 0; i < arrRed.length; i++) {
      let arr = arrRed[i].split('');
      arr[0] = arrRed8[i];
      arrRed[i] = arr.join('');

    }

    //replace 8th plane in green channel to protected
    for (var i = 0; i < arrGreen.length; i++) {
      let arr = arrGreen[i].split('');
      arr[0] = arrGreen8[i];
      arrGreen[i] = arr.join('');
    }

    //replace 8th plane in blue channel to protected
    for (var i = 0; i < arrBlue.length; i++) {
      let arr = arrBlue[i].split('');
      arr[0] = arrBlue8[i];
      arrBlue[i] = arr.join('');
    }

    for (var i = 0; i < channelLength; i++) {
        imageData.data[i * 4] = parseInt(arrRed[i], 2);
        imageData.data[i * 4 + 1] = parseInt(arrGreen[i], 2);
        imageData.data[i * 4 + 2] = parseInt(arrBlue[i], 2);
    }

    ctx.putImageData(imageData, 0, 0);
    var newImg  = canvas.toDataURL();
    fs.writeFileSync(`${appRoot}/newImg${svgNum}_${imageId}.png`, newImg.replace(/^data:image\/png;base64,/, ""), 'base64');


}

module.exports = protectImages;

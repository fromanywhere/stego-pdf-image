const fs = require('fs');
const Promise = require('es6-promise').Promise;
const pdf2svg = require('../routes/pdf2svg');
const sizeOf = require('image-size');
const Canvas = require('canvas');
const Image = Canvas.Image;

const transformMessage = require('./transformMessage');

function protectImages(imageSrc, imageWidth, imageHeight) {

  let image = new Image();
  image.src = imageSrc;
  let width = parseInt(imageWidth, 10),
      height = parseInt(imageHeight, 10),
      canvas = new Canvas(width, height),
      imageData, ctx,
      arrRed = [], arrGreen = [], arrBlue = [],
      arrRed8 = [], arrGreen8 = [], arrBlue8 = [],
      binaryMessage, resultOfTransformMessage;

  ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  imageData = ctx.getImageData(0, 0, width, height);

  resultOfTransformMessage = transformMessage();
  binaryMessage = resultOfTransformMessage.binaryMessage;

  //exrtract channels
  for (let i = 0; i < imageData.data.length; i+=4) {
    arrRed.push(('00000000' + imageData.data[i].toString(2)).slice(-8));
    arrGreen.push(('00000000' + imageData.data[i + 1].toString(2)).slice(-8));
    arrBlue.push(('00000000' + imageData.data[i + 2].toString(2)).slice(-8));
  }

  let channelLength = arrRed.length;

    //extract 8th bit plane and copy its to first plane in a red channel
    for (let i = 0; i < channelLength; i++) {
      let arr = arrRed[i].split('');
      arr[7] = arr[0];
      arrRed8.push(arr[0]);
      arrRed[i] = arr.join('');
    }

    //extract 8th bit plane and copy its to first plane in a green channel
    for (let i = 0; i < channelLength; i++) {
      let arr = arrGreen[i].split('');
      arr[7] = arr[0];
      arrGreen8.push(arr[0]);
      arrGreen[i] = arr.join('');
    }

    //extract 8th bit plane and copy its to first plane in a blue channel
    for (let i = 0; i < channelLength; i++) {
      let arr = arrBlue[i].split('');
      arr[7] = arr[0];
      arrBlue8.push(arr[0]);
      arrBlue[i] = arr.join('');
    }

    //embedding the message into the channels
    let numberOfString = 1, j = 0;

    for (let i = 0; i < binaryMessage.length; i++) {
      if (j === (width * (numberOfString - 1) + resultOfTransformMessage.width)) {
        numberOfString++;
        j += (width - resultOfTransformMessage.width);
      }
      arrRed8[j] = binaryMessage[i] ^ arrRed8[j];
      arrGreen8[j] = binaryMessage[i] ^ arrGreen8[j];
      arrBlue8[j] = binaryMessage[i] ^ arrBlue8[j];
      j++;
    }

    //replace 8th plane in red channel to protected
    for (let i = 0; i < arrRed.length; i++) {
      let arr = arrRed[i].split('');
      arr[0] = arrRed8[i];
      arrRed[i] = arr.join('');

    }

    //replace 8th plane in green channel to protected
    for (let i = 0; i < arrGreen.length; i++) {
      let arr = arrGreen[i].split('');
      arr[0] = arrGreen8[i];
      arrGreen[i] = arr.join('');
    }

    //replace 8th plane in blue channel to protected
    for (let i = 0; i < arrBlue.length; i++) {
      let arr = arrBlue[i].split('');
      arr[0] = arrBlue8[i];
      arrBlue[i] = arr.join('');
    }

    for (let i = 0; i < channelLength; i++) {
        imageData.data[i * 4] = parseInt(arrRed[i], 2);
        imageData.data[i * 4 + 1] = parseInt(arrGreen[i], 2);
        imageData.data[i * 4 + 2] = parseInt(arrBlue[i], 2);
    }

    ctx.putImageData(imageData, 0, 0);
    let newImg  = canvas.toDataURL();
    return newImg;

}

module.exports = protectImages;

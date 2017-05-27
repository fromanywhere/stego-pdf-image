const Canvas = require('canvas');
const Image = Canvas.Image;

const transformMessage = require('./transformMessage');
const extractWTM = require('./extractWTM');

function protectImages(imageSrc, imageWidth, imageHeight, params) {

  let image = new Image();
  image.src = imageSrc;
  let width = parseInt(imageWidth, 10),
      height = parseInt(imageHeight, 10),
      canvas = new Canvas(width, height),
      imageData, ctx,
      arrRed = [], arrGreen = [], arrBlue = [],
      binaryMessage, resultOfTransformMessage;

  ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  imageData = ctx.getImageData(0, 0, width, height);

  resultOfTransformMessage = transformMessage();
  binaryMessage = resultOfTransformMessage.binaryMessage;

  //exrtract channels
  for (let i = 0; i < imageData.data.length; i+=4) {
    arrRed.push(imageData.data[i]);
    arrGreen.push(imageData.data[i + 1]);
    arrBlue.push(imageData.data[i + 2]);
  }

  let channelLength = arrRed.length;
  const mask = 1 << 7;


    //extract 8th bit plane and copy its to first plane in the channels
  for (let i = 0; i < channelLength; i++) {
    let firstRedBitValue = (arrRed[i] & mask) >>> 7;
    let changedLastRedBit = arrRed[i] & ((1 << 8) - 2);

    arrRed[i] = changedLastRedBit ^ firstRedBitValue;

    let firstGreenBitValue = (arrGreen[i] & mask) >>> 7;
    let changedLastGreenBit = arrGreen[i] & ((1 << 8) - 2);

    arrGreen[i] = changedLastGreenBit ^ firstGreenBitValue;

    let firstBlueBitValue = (arrBlue[i] & mask) >>> 7;
    let changedLastBlueBit = arrBlue[i] & ((1 << 8) - 2);

    arrBlue[i] = changedLastBlueBit ^ firstBlueBitValue;
  }

    //embedding the message into the channels
    let numberOfString = 1, j = 0;

    for (let i = 0; i < binaryMessage.length; i++) {
      if (j === (width * (numberOfString - 1) + resultOfTransformMessage.width)) {
        numberOfString++;
        j += (width - resultOfTransformMessage.width);
      }

      let firstRedBitValue = arrRed[j] & mask;
      arrRed[j] = arrRed[j] ^ ((binaryMessage[i] << 7) ^ firstRedBitValue);

      let firstGreenBitValue = arrGreen[j] & mask;
      arrGreen[j] = arrGreen[j] ^ ((binaryMessage[i] << 7) ^ firstGreenBitValue);

      let firstBlueBitValue = arrBlue[j] & mask;
      arrBlue[j] = arrBlue[j] ^ ((binaryMessage[i] << 7) ^ firstBlueBitValue);

      j++;
    }


    for (let i = 0; i < channelLength; i++) {
        imageData.data[i * 4] = arrRed[i];
        imageData.data[i * 4 + 1] = arrGreen[i];
        imageData.data[i * 4 + 2] = arrBlue[i];
    }

    ctx.putImageData(imageData, 0, 0);
    let newImg  = canvas.toDataURL();

    extractWTM(newImg, imageWidth, imageHeight, binaryMessage.length, resultOfTransformMessage.width, params);

    return newImg;

}

module.exports = protectImages;

const fs = require('fs');
const Canvas = require('canvas');
const Image = Canvas.Image;


function protectImages(imageSrc, imgWidth, imgHeight, resultOfTransformMessage, params) {

  let image = new Image();
  image.src = imageSrc;
  let width = parseInt(imgWidth, 10),
      height = parseInt(imgHeight, 10),
      canvas = new Canvas(width, height),
      imageData, ctx,
      arrRed = [], arrGreen = [], arrBlue = [],
      binaryMessage;

  ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  imageData = ctx.getImageData(0, 0, width, height);

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

  fs.writeFileSync(`${params.targetPath}protected${Math.floor(Math.random() * 1000 + 1)}.png`, newImg.replace(/^data:image\/png;base64,/, ""), 'base64');
  return newImg;

}

module.exports = protectImages;

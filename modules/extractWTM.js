const fs = require('fs');
const Canvas = require('canvas');
const Image = Canvas.Image;


function extractWatermarks(imageSrc, imgWidth, imgHeight, params) {
  let image = new Image();
  image.src = imageSrc;

  let width = parseInt(imgWidth, 10),
    height = parseInt(imgHeight, 10),
    canvas = new Canvas(width, height),
    imageData, ctx,
    arrRed = [], arrGreen = [], arrBlue = [];

  ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  imageData = ctx.getImageData(0, 0, width, height);


  //exrtract channels
  for (let i = 0; i < imageData.data.length; i+=4) {
    arrRed.push(imageData.data[i]);
    arrGreen.push(imageData.data[i + 1]);
    arrBlue.push(imageData.data[i + 2]);
  }

  let channelLength = arrRed.length;
  const mask = 1 << 7;

  //the fist bit change on the last bit
  for (let i = 0; i < channelLength; i++) {

    let lastRedBitValue = arrRed[i] & 1;
    let changedFirstRedBit = arrRed[i] & ~(mask);

    arrRed[i] = changedFirstRedBit ^ (lastRedBitValue << 7);


    let lastGreenBitValue = arrGreen[i] & 1;
    let changedFirstGreenBit = arrGreen[i] & ~(mask);

    arrGreen[i] = changedFirstGreenBit ^ (lastGreenBitValue << 7);

    let lastBlueBitValue = arrBlue[i] & 1;
    let changedFirstBlueBit = arrBlue[i] & ~(mask);

    arrBlue[i] = changedFirstBlueBit ^ (lastBlueBitValue << 7);
  }


  for (let i = 0; i < channelLength; i++) {
    imageData.data[i * 4] = arrRed[i];
    imageData.data[i * 4 + 1] = arrGreen[i];
    imageData.data[i * 4 + 2] = arrBlue[i];
  }


  ctx.putImageData(imageData, 0, 0);
  let newImg  = canvas.toDataURL();

  fs.writeFileSync(`${params.targetPath}extracted${Math.floor(Math.random() * 1000 + 1)}.png`, newImg.replace(/^data:image\/png;base64,/, ""), 'base64');
  return newImg;

}

module.exports = extractWatermarks;
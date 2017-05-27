const Canvas = require('../node_modules/canvas');
const Image = Canvas.Image;

function transformMessage() {
  let messageSrc = appRoot + '/matlab/bM10.jpg';
  let image = new Image();
  image.src = messageSrc;
  let width = parseInt(image.width, 10),
      height = parseInt(image.height, 10),
      canvas = new Canvas(width, height),
      binaryMessage = [],
      imageData, ctx;

  ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  imageData = ctx.getImageData(0, 0, width, height);

  for (let i = 0; i < imageData.data.length; i+=4) {
    if (imageData.data[i] == 255) {
      binaryMessage.push(1);
    } else {
      binaryMessage.push(0);
    }
  }
  let result = {
    binaryMessage: binaryMessage,
    width: width
  };
  return result;
}


module.exports = transformMessage;

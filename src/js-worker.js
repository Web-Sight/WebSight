importScripts('haarcascade_frontalface_alt.js');
importScripts('haar-detector.min.js');

// let img = new Image();

function faceDetect(imageData, imageDataRaw) {
    new HAAR.Detector(haarcascade_frontalface_alt, false)
        .image(img, .5)
        .interval(40)
        .selection('auto')
        .complete(function () {
            let message = [];
            let i;
            let rect;
            let l = this.objects.length;   
            
            for (i = 0; i < l; i++) {
                rect = this.objects[i];
                // imageData.strokeRect(rect.x, rect.y, rect.width, rect.height);
                message.push({x:rect.x, y:rect.y, width:rect.width, height:rect.height})
            }
            postMessage(message);

        })
        // .cannyThreshold({ low: 90, high: 200 })
        // .detect(1, 1.1, 0.12, 1, true);
}

self.onmessage = function (e) {
  if (e.data.cmd === 'faceDetect') {
      console.log(e.data)
    faceDetect(e.data.img, e.data.imgRaw);
  }
	else if (e.data.cmd === 'eyesDetect') {
		eyesDetect(e.data.img);
	}
}
importScripts('haarcascade_frontalface_alt.js');
importScripts('haar-detector.noDOM.min.js');
importScripts('haarcascade_eye.js');

function featureDetect(imageData, feature) {
  // console.log('running jsworker')
  let trainingSet;

  switch(feature) {
    case 'face':
      trainingSet = haarcascade_frontalface_alt;
      break;
    case 'eyes':
      trainingSet = haarcascade_eye;
      break;
    default:
      console.log(`${feature} not found`);
      postMessage({message: null, length: 0});
      return;
  }

  new HAAR.Detector(trainingSet, false)
    .image(imageData, 1)
    .interval(5)
    .selection('auto')
    .complete(function () {
        let rects = [];
        let rect;
        let l = this.objects.length;   
        
        for (let i = 0; i < l; i++) {
            rect = this.objects[i];
            rects.push({x:rect.x, y:rect.y, width:rect.width, height:rect.height})
        }        
        postMessage({features : rects});

    })
    .cannyThreshold({ low: 90, high: 200 })
    .detect(1, 1.1, 0.12, 1, true);
}

self.onmessage = function (e) {
  if (e.data.cmd === 'faceDetect') {
    featureDetect(e.data.img, 'face');
  }
  else if (e.data.cmd === 'eyesDetect') {
    featureDetect(e.data.img, 'eyes');
  }
}
self.onerror = function (e) {
	console.log(e);
}



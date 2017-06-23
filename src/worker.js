var face_cascade, eye_cascade;

// class FaceRecognition {
// 	constructor(imageData) {
// 		this.imageData = imageData;
// 		this.loadFaceDetectTrainingSet();
// 	}

// 	loadFaceDetectTrainingSet() {
// 		if (face_cascade == undefined){
// 					console.log("Creating the Face cascade classifier");
// 					face_cascade = new cv.CascadeClassifier();
// 					let load = face_cascade.load('../../test/data/haarcascade_frontalface_default.xml');
// 					console.log('load training data', load);
// 		}
// 	}

// 	detect() {
// 		this.img = cv.matFromArray(this.imageData, 24); // 24 for rgba

// 		this.img_gray = new cv.Mat();
// 		this.img_color = new cv.Mat(); // Opencv likes RGB
// 		cv.cvtColor(this.img, this.img_gray, cv.ColorConversionCodes.COLOR_RGBA2GRAY.value, 0);
// 		cv.cvtColor(this.img, this.img_color, cv.ColorConversionCodes.COLOR_RGBA2RGB.value, 0);

// 		this.faces = new cv.RectVector();
// 		let s1 = [0, 0];
// 		let s2 = [0, 0];
// 		face_cascade.detectMultiScale(this.img_gray, this.faces, 1.1, 3, 0, s1, s2);
// 	}

// 	outline() {
// 		for (let i = 0; i < this.faces.size(); i += 1)
// 		{
// 			let faceRect = this.faces.get(i);
// 			let x = faceRect.x ;
// 			let y = faceRect.y ;
// 			let w = faceRect.width ;
// 			let h = faceRect.height;
// 			let p1 = [x, y];
// 			let p2 = [x+w, y+h];
// 			let color = new cv.Scalar(255,0,0);
// 			cv.rectangle(this.img_color, p1, p2, color, 2, 8, 0);
// 			faceRect.delete();
// 			color.delete();
// 		}
// 	}

// 	postMessageToRedraw() {
// 		let message = {
// 			width: this.img_color.cols,
// 			height: this.img_color.rows,
// 			data: this.img_color.data(),
// 			channels: this.img_color.channels(),
// 			channelSize: this.img_color.elemSize1()
// 		};

// 		postMessage(message);
// 	}

// 	free() {
// 		this.img.delete();
// 	  this.img_color.delete();
// 		this.faces.delete();
// 		this.img_gray.delete();
// 		this.imageData.delete;
// 	}
// }

// class EyesRecognition extends FaceRecognition {
// 	constructor(imageData) {
// 		super(imageData);
// 		this.loadEyesDetectTrainingSet();
// 	}

// 	loadEyesDetectTrainingSet() {
// 		if (eye_cascade == undefined ){
// 			console.log("Creating the eye cascade classifier");
// 			eye_cascade = new cv.CascadeClassifier();
// 			eye_cascade.load('../../test/data/haarcascade_eye.xml');
// 		}
// 	}

// 	detect() {
// 		// Detect face.
// 		super.detect();

// 		let s1 = [0, 0];
// 		let s2 = [0, 0];

// 		// Detect eyes within face.
// 		for (var i = 0 ; i < this.faces.size(); i += 1)
// 		{
// 			let faceRect = this.faces.get(i);
// 			let x = faceRect.x ;
// 			let y = faceRect.y ;
// 			let w = faceRect.width ;
// 			let h = faceRect.height;
// 			let roiRect = new cv.Rect(x, y, w, h);

// 			let roi_gray = this.img_gray.getROI_Rect(roiRect);
// 			let roi_color = this.img_color.getROI_Rect(roiRect);

// 			this.eyes = new cv.RectVector();
// 			eye_cascade.detectMultiScale(roi_gray, this.eyes, 1.1, 3, 0, s1, s2);

// 			faceRect.delete();
// 			roiRect.delete();
// 			roi_gray.delete();
// 			roi_color.delete();
// 		}
// 	}

// 	outline() {
// 		console.log(this.eyes.size() + " eyes were found.");

//     for (let i = 0; i < this.faces.size(); i++) {
// 			let faceRect = this.faces.get(i);

// 			for (let j = 0; j < this.eyes.size(); j += 1) {
// 				let gcolor = new cv.Scalar(0, 255, 0);
// 				let eyeRect = this.eyes.get(j);

// 				console.log(eyeRect.width + "," + eyeRect.height);

// 				let p1 = [faceRect.x + eyeRect.x, faceRect.y + eyeRect.y];
// 				let p2 = [p1[0] + eyeRect.width, p1[1] + eyeRect.height];

// 				cv.rectangle(this.img_color, p1, p2, gcolor, 2, 8, 0);

// 				gcolor.delete();
// 			}
// 		}
// 	}

// 	free() {
// 		super.free();
// 		this.eyes.delete();
// 	}
// }

function loadFaceDetectTrainingSet() {
	if (face_cascade == undefined) {	
		face_cascade = new cv.CascadeClassifier();
		let load = face_cascade.load('../../test/data/haarcascade_frontalface_default.xml');
		console.log('load training data', load);
	}
}

function loadEyesDetectTrainingSet() {
	if (eye_cascade == undefined) {		
		eye_cascade = new cv.CascadeClassifier();
		eye_cascade.load('../../test/data/haarcascade_eye.xml');
	}
}

function postMessageToRedraw(img_color) {
	let message = {
		width: img_color.cols,
		height: img_color.rows,
		data: img_color.data(),
		channels: img_color.channels(),
		channelSize: img_color.elemSize1()
	};

	postMessage(message);
}

function faceDetect(imageData, type) {
	loadFaceDetectTrainingSet();

	let img = cv.matFromArray(imageData, 24); // 24 for rgba

	let img_gray = new cv.Mat();
	let img_color = new cv.Mat(); // Opencv likes RGB
	cv.cvtColor(img, img_gray, cv.ColorConversionCodes.COLOR_RGBA2GRAY.value, 0);
	cv.cvtColor(img, img_color, cv.ColorConversionCodes.COLOR_RGBA2RGB.value, 0);

	let faces = new cv.RectVector();
	let s1 = [0, 0];
	let s2 = [0, 0];
	face_cascade.detectMultiScale(img_gray, faces, 1.1, 3, 0, s1, s2);

	for (let i = 0; i < faces.size(); i += 1) {
		let faceRect = faces.get(i);
		x = faceRect.x;
		y = faceRect.y;
		w = faceRect.width;
		h = faceRect.height;
		let p1 = [x, y];
		let p2 = [x + w, y + h];
		let color;
		if (type) {
			color = new cv.Scalar(0, 0, 255);
		} else {
			color = new cv.Scalar(255, 0, 0);
		}
		cv.rectangle(img_color, p1, p2, color, 2, 16, 0);
		faceRect.delete();
		color.delete();
	}

	postMessageToRedraw(img_color);

	img.delete();
	img_color.delete();
	faces.delete();
	img_gray.delete();
}

function eyesDetect(imageData, type) {
	loadFaceDetectTrainingSet();
	loadEyesDetectTrainingSet()

	let img = cv.matFromArray(imageData, 24); // 24 for rgba
	let img_gray = new cv.Mat();
	let img_color = new cv.Mat();
	cv.cvtColor(img, img_gray, cv.ColorConversionCodes.COLOR_RGBA2GRAY.value, 0);
	cv.cvtColor(img, img_color, cv.ColorConversionCodes.COLOR_RGBA2RGB.value, 0);

	let faces = new cv.RectVector();
	let s1 = [0, 0];
	let s2 = [0, 0];
	face_cascade.detectMultiScale(img_gray, faces, 1.1, 3, 0, s1, s2);

	for (let i = 0; i < faces.size(); i += 1) {
		let faceRect = faces.get(i);
		x = faceRect.x;
		y = faceRect.y;
		w = faceRect.width;
		h = faceRect.height;
		let p1 = [x, y];
		let p2 = [x + w, y + h];
		if (type) {
			color = new cv.Scalar(0, 0, 255);
		} else {
			color = new cv.Scalar(255, 0, 0);
		}		
		let gcolor = new cv.Scalar(0, 255, 0);
		cv.rectangle(img_color, p1, p2, color, 2, 8, 0);
		let roiRect = new cv.Rect(x, y, w, h);

		let roi_gray = img_gray.getROI_Rect(roiRect);
		let roi_color = img_color.getROI_Rect(roiRect);

		let eyes = new cv.RectVector();
		eye_cascade.detectMultiScale(roi_gray, eyes, 1.1, 3, 0, s1, s2);
		
		for (let j = 0; j < eyes.size(); j += 1) {

			let eyeRect = eyes.get(j);			

			let p1 = [x + eyeRect.x, y + eyeRect.y];
			let p2 = [x + eyeRect.x + eyeRect.width, y + eyeRect.y + eyeRect.height];

			cv.rectangle(img_color, p1, p2, gcolor, 2, 8, 0);
		}

		eyes.delete();
		faceRect.delete();
		color.delete();
		gcolor.delete();
		roi_gray.delete();
		roi_color.delete();
	}

	postMessageToRedraw(img_color);

	img.delete();
	img_color.delete();
	faces.delete();
	img_gray.delete();
}

self.onmessage = function (e) {
	// let objectRecognition;

	if (e.data.cmd === 'faceDetect') {
		faceDetect(e.data.img, e.data.type);
		// objectRecognition = new FaceRecognition(e.data.img);
	}
	else if (e.data.cmd === 'eyesDetect') {
		eyesDetect(e.data.img,e.data.type);
		// objectRecognition = new EyesRecognition(e.data.img);
	}

	// if (objectRecognition) {
	// 	objectRecognition.detect();
	// 	objectRecognition.outline();
	// 	objectRecognition.postMessageToRedraw();
	// 	objectRecognition.free();
	// }
}

self.onerror = function (e) {
	console.log(e);
}
console.log('done loading --worker')
let video = document.querySelector("#videoElement");
let face_cascade;
let eye_cascade;
// check for getUserMedia support
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

if (navigator.getUserMedia) {
    // get webcam feed if available
    navigator.getUserMedia({ video: true }, handleVideo, () => console.log('error with webcam'));
}

function handleVideo(stream) {
    // if found attach feed to video element
    video.src = window.URL.createObjectURL(stream);
}
document.addEventListener('DOMContentLoaded', function () {
    console.log('dom laoded')
    // when DOM loaded, get canvas 2D context and store width and height of element
    v = document.getElementById('videoElement');
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    w = canvas.width;
    h = canvas.height;

}, false);

let fr;
let ch, cw;
function paintCanvas(e) {
    console.log('painting canvas')
    const v = document.getElementById('videoElement');
    const canvas = document.getElementById('mrCanvas');
    const context = canvas.getContext('2d');
    cw = Math.floor(canvas.clientWidth);
    ch = Math.floor(canvas.clientHeight);
    canvas.width = cw;
    canvas.height = ch;

    draw(v, context, cw, ch);
}

function draw(v, c, w, h) {
    videoRunning = true;
    if (v.paused || v.ended) return false;
    c.drawImage(v, 0, 0, w, h);
    detectFace();
    requestAnimationFrame(function () { draw(v, c, w, h) });
}

showImage = function (mat, canvas_id) {
    let data = mat.data(); 	// output is a Uint8Array that aliases directly into the Emscripten heap

    channels = mat.channels();
    channelSize = mat.elemSize1();

    let canvas = document.getElementById(canvas_id);

    ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = mat.cols;
    canvas.height = mat.rows;

    imdata = ctx.createImageData(mat.cols, mat.rows);

    for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
        imdata.data[j] = data[i];
        imdata.data[j + 1] = data[i + 1 % channels];
        imdata.data[j + 2] = data[i + 2 % channels];
        imdata.data[j + 3] = 255;
    }
    ctx.putImageData(imdata, 0, 0);
}

function getInput() {
    let canvas = document.getElementById('mrCanvas');
    let ctx = canvas.getContext('2d');
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imgData;
}

function detectFace() {
    if (face_cascade == undefined) {
        console.log("Creating the Face cascade classifier");
        face_cascade = new cv.CascadeClassifier();
        face_cascade.load('../../test/data/haarcascade_frontalface_default.xml');
    }

    let img = cv.matFromArray(getInput(), 24); // 24 for rgba

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
        let color = new cv.Scalar(255, 0, 0);
        cv.rectangle(img_color, p1, p2, color, 2, 8, 0);
        faceRect.delete();
        color.delete();

    }

    showImage(img_color, "canvas");

    img.delete();
    img_color.delete();
    faces.delete();
    img_gray.delete();
    perf1 = performance.now();
    // console.log(`performance is ${perf1 - perf0}`)
}

function detectEyes() {
    if (face_cascade == undefined) {
        face_cascade = new cv.CascadeClassifier();
        face_cascade.load('../../test/data/haarcascade_frontalface_default.xml');
    }
    if (eye_cascade == undefined) {
        console.log("Creating the eye cascade classifier");
        eye_cascade = new cv.CascadeClassifier();
        eye_cascade.load('../../test/data/haarcascade_eye.xml');
    }

    let img = cv.matFromArray(getInput(), 24); // 24 for rgba
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
        let color = new cv.Scalar(255, 0, 0);
        let gcolor = new cv.Scalar(0, 255, 0);
        cv.rectangle(img_color, p1, p2, color, 2, 8, 0);
        let roiRect = new cv.Rect(x, y, w, h);

        let roi_gray = img_gray.getROI_Rect(roiRect);
        let roi_color = img_color.getROI_Rect(roiRect);

        let eyes = new cv.RectVector();
        eye_cascade.detectMultiScale(roi_gray, eyes, 1.1, 3, 0, s1, s2);


        console.log(eyes.size() + " eyes were found.");
        for (let j = 0; j < eyes.size(); j += 1) {

            let eyeRect = eyes.get(j);
            console.log(eyeRect.width + "," + eyeRect.height);

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

    showImage(img_color, "canvas");

    img.delete();
    img_color.delete();
    faces.delete();
    img_gray.delete();

}

function convertArrayOfObjectsToCSV(args) {
    let result, ctr, keys, columnDelimiter, lineDelimiter, data;

    data = args.data || null;
    if (data == null || !data.length) {
        return null;
    }

    columnDelimiter = args.columnDelimiter || ',';
    lineDelimiter = args.lineDelimiter || '\n';

    keys = Object.keys(data[0]);

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(function (item) {
        ctr = 0;
        keys.forEach(function (key) {
            if (ctr > 0) result += columnDelimiter;

            result += item[key];
            ctr++;
        });
        result += lineDelimiter;
    });

    return result;
}

let Control = {
    detectFace: detectFace,
    detectEyes: detectEyes,
    paintCanvas: paintCanvas,
    drawSquare: drawSquare
};

function drawSquare() {
    requestAnimationFrame(detectFace);
}

//wasm-module related code

let Module = {
    preRun: [],
    postRun: [],
    print: (function () {
        let element = document.getElementById('output');
        if (element) element.value = ''; // clear browser cache
        return function (text) {
            text = Array.prototype.slice.call(arguments).join(' ');
            console.log(text);
            if (element) {
                element.value += text + "\n";
                element.scrollTop = element.scrollHeight; // focus on bottom
            }
        };
    })(),
    printErr: function (text) {
        text = Array.prototype.slice.call(arguments).join(' ');
        if (0) { // XXX disabled for safety typeof dump == 'function') {
            dump(text + '\n'); // fast, straight to the real console
        } else {
            console.error(text);
        }
    },
    canvas: (function () {
        let canvas = document.getElementById('resCanvas');
        return canvas;
    })(),
    setStatus: function (text) {
        if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
        if (text === Module.setStatus.text) return;
        let m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
        let now = Date.now();
        if (m && now - Date.now() < 30) return; // if this is a progress update, skip it if too soon
        if (m) {
            text = m[1];
        }
    },
    totalDependencies: 0,
    monitorRunDependencies: function (left) {
        this.totalDependencies = Math.max(this.totalDependencies, left);
        Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies - left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
    }
};
Module.setStatus('Downloading...');
window.onerror = function (event) {
    // TODO: do not warn on ok events like simulating an infinite loop or exitStatus
    Module.setStatus('Exception thrown, see JavaScript console');
    // spinnerElement.style.display = 'none';
    Module.setStatus = function (text) {
        if (text) Module.printErr('[post-exception status] ' + text);
    };
};
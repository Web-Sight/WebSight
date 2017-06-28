let wasmWorker = new Worker('wasm-worker.js');
let asmWorker = new Worker('asm-worker.js');
let jsWorker = new Worker('js-worker.js');

let video = document.querySelector("#videoElement");
let face_cascade;
let eye_cascade;

var canvases = {};

// check for getUserMedia support
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

if (navigator.getUserMedia) {
    // get webcam feed if available
    navigator.getUserMedia({ video: true }, handleVideo, () => console.log('error with webcam'));
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('dom loaded')
}, false);

function handleVideo(stream) {
    video.src = window.URL.createObjectURL(stream);
    // console.log(video)
}

clickme2 = () => {
    canvases.wasm = {};
    canvases.asm = {};
    canvases.js = {};

    canvases.wasm.fps = 0;
    canvases.asm.fps = 0;
    canvases.js.fps = 0;

    canvases.wasm.lastTime = +new Date;
    canvases.asm.lastTime = +new Date;
    canvases.js.lastTime = +new Date;

    canvases.wasm.color = 'rgba(255, 0, 0, 1)';
    canvases.asm.color = 'rgba(	0,191,255, 1)';
    canvases.js.color = 'rgba(0, 255, 0, 1)';
    canvases.scale = 2;

    // canvases.wasm.canvas = document.getElementById('wasm');
    // canvases.wasm.context = canvases.wasm.canvas.getContext('2d');

    canvases.asm.canvas = document.getElementById('asm');
    canvases.asm.context = canvases.asm.canvas.getContext('2d');

    // canvases.js.canvas = document.getElementById('js');
    // canvases.js.context = canvases.js.canvas.getContext('2d');

    canvases.dummy = {};
    canvases.dummy.canvas = document.getElementById('dummy');
    canvases.dummy.context = canvases.dummy.canvas.getContext('2d');

    // canvases.dummy.canvas.width = canvases.wasm.canvas.width = canvases.asm.canvas.width = canvases.js.canvas.width = video.width;
    // canvases.dummy.canvas.height = canvases.wasm.canvas.height = canvases.asm.canvas.height = canvases.js.canvas.height = video.height;
    canvases.dummy.canvas.width = canvases.asm.canvas.width = video.width;
    canvases.dummy.canvas.height  = canvases.asm.canvas.height =  video.height;

    console.log(`object created`)
}

function detectFace() {
    // startWorker(canvases.wasm.context.getImageData(0, 0, canvases.wasm.canvas.width || 200, canvases.wasm.canvas.height || 200), 'faceDetect', 'wasm');
    startWorker(canvases.asm.context.getImageData(0, 0, canvases.asm.canvas.width || 200, canvases.asm.canvas.height || 200), 'faceDetect', 'asm');
    // startWorker(canvases.js.context.getImageData(0, 0, canvases.js.canvas.width || 200, canvases.js.canvas.height || 200), 'faceDetect', 'js');
}

function startWorker(imageData, command, type) {
    canvases.dummy.context.drawImage(asm, 0, 0, imageData.width, imageData.height, 0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height));
    let message = { cmd: command, img: canvases.dummy.context.getImageData(0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height)) };
    if (type == 'wasm') wasmWorker.postMessage(message);
    else if (type == 'asm') asmWorker.postMessage(message);
    else jsWorker.postMessage(message);
}

function updateCanvas(e, targetCanvas) {
    // console.log(targetCanvas)
    // console.log('startTime - lt',targetCanvas.startTime - targetCanvas.lastTime)

    // console.log('math round',Math.round(targetCanvas.fps * 100) / 100)
    targetCanvas.context.drawImage(video, 0, 0, targetCanvas.canvas.width, targetCanvas.canvas.height);
    targetCanvas.context.strokeStyle = targetCanvas.color;
    targetCanvas.context.lineWidth = 2;

    targetCanvas.context.fps = 1000 / (targetCanvas.startTime - targetCanvas.lastTime);
    // console.log('fps',targetCanvas.context.fps)
    targetCanvas.context.fillStyle = 'rgba(255,255,255,.5)';
    targetCanvas.context.fillRect(0,0,90,30)
    targetCanvas.context.font = "normal 14pt Arial";
    targetCanvas.context.fillStyle = targetCanvas.color;
    targetCanvas.context.fillText(Math.round(targetCanvas.context.fps * 100) / 100 + " fps", 5, 20);
    targetCanvas.lastTime = targetCanvas.startTime;

    for (let i = 0; i < e.data.features.length; i++) {
        let rect = e.data.features[i];
        targetCanvas.context.strokeRect(rect.x * canvases.scale, rect.y * canvases.scale, rect.width * canvases.scale, rect.height * canvases.scale);
    }
}

wasmWorker.onmessage = function (e) {
    updateCanvas(e, canvases.wasm);
    requestAnimationFrame((wasmTime) => {
        // console.log('wasmtime',wasmTime)
        canvases.wasm.startTime = wasmTime;
        startWorker(canvases.wasm.context.getImageData(0, 0, canvases.wasm.canvas.width || 200, canvases.wasm.canvas.height || 200), 'faceDetect', 'wasm')
    });
}

asmWorker.onmessage = function (e) {
    updateCanvas(e, canvases.asm);
    requestAnimationFrame((asmTime) => {
        canvases.asm.startTime = asmTime;
        startWorker(canvases.asm.context.getImageData(0, 0, canvases.asm.canvas.width || 200, canvases.asm.canvas.height || 200), 'faceDetect', 'asm')
    });
}

jsWorker.onmessage = function (e) {
    console.log('receiving js message')
    updateCanvas(e, canvases.js);
    requestAnimationFrame((jsTime) => {
        canvases.js.startTime = jsTime;
        startWorker(canvases.js.context.getImageData(0, 0, canvases.js.canvas.width || 200, canvases.js.canvas.height || 200), 'faceDetect', 'js')
    });
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
            dump(text + '\n'); // fast, straight to the wasm console
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
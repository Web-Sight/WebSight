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
}

    canvases.wasm = {};
    canvases.asm = {};
    canvases.js = {};

    canvases.wasm.fps = 0;
    canvases.asm.fps = 0;
    canvases.js.fps = 0;

    canvases.wasm.lastTime = +new Date;
    canvases.asm.lastTime = +new Date;
    canvases.js.lastTime = +new Date;
 
    canvases.wasm.fpsArr = [];
    canvases.asm.fpsArr = [];
    canvases.js.fpsArr = [];

    canvases.wasm.color = 'rgba(255, 0, 0, 1)';
    canvases.asm.color = 'rgba(	0,191,255, 1)';
    canvases.js.color = 'rgba(0, 255, 0, 1)';
    canvases.scale = 2;

    canvases.wasm.canvas = document.getElementById('wasm');
    canvases.wasm.context = canvases.wasm.canvas.getContext('2d');

    canvases.asm.canvas = document.getElementById('asm');
    canvases.asm.context = canvases.asm.canvas.getContext('2d');

    canvases.js.canvas = document.getElementById('js');
    canvases.js.context = canvases.js.canvas.getContext('2d');

    canvases.dummy = {};
    canvases.dummy.canvas = document.getElementById('dummy');
    canvases.dummy.context = canvases.dummy.canvas.getContext('2d');
    
    canvases.chart = {};
    canvases.chart.canvas = document.getElementById('chart');
    canvases.chart.context = canvases.chart.canvas.getContext('2d');

    canvases.dummy.canvas.width = canvases.wasm.canvas.width = canvases.asm.canvas.width = canvases.js.canvas.width = canvases.chart.canvas.width = 320
    canvases.dummy.canvas.height = canvases.wasm.canvas.height = canvases.asm.canvas.height = canvases.js.canvas.height = canvases.chart.canvas.height = 240;

    console.log(`object created`)

function detectFace() {
    startWorker(canvases.wasm.context.getImageData(0, 0, canvases.wasm.canvas.width || 200, canvases.wasm.canvas.height || 200), 'faceDetect', 'wasm');
    startWorker(canvases.asm.context.getImageData(0, 0, canvases.asm.canvas.width || 200, canvases.asm.canvas.height || 200), 'faceDetect', 'asm');
    startWorker(canvases.js.context.getImageData(0, 0, canvases.js.canvas.width || 200, canvases.js.canvas.height || 200), 'faceDetect', 'js');
}

function startWorker(imageData, command, type) {
    canvases.dummy.context.drawImage(wasm, 0, 0, imageData.width, imageData.height, 0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height));
    let message = { cmd: command, 
        img: canvases.dummy.context.getImageData(0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height)) };
    if (type == 'wasm') wasmWorker.postMessage(message);
    else if (type == 'asm') asmWorker.postMessage(message);
    else if(type == 'js')jsWorker.postMessage(message);
}

function updateCanvas(e, targetCanvas) {
    targetCanvas.context.drawImage(video, 0, 0, targetCanvas.canvas.width, targetCanvas.canvas.height);
    targetCanvas.context.strokeStyle = targetCanvas.color;
    targetCanvas.context.lineWidth = 2;
    targetCanvas.fpsArr.push(1000 / (Math.round(targetCanvas.startTime) - Math.round(targetCanvas.lastTime)));
    if(targetCanvas.fpsArr.length===10) {
    targetCanvas.context.fps = Math.round((targetCanvas.fpsArr.reduce((a,b)=>a + b)/10) * 100) / 100 
    targetCanvas.fpsArr = [];
    }
    targetCanvas.context.fillStyle = 'rgba(255,255,255,.5)';
    targetCanvas.context.fillRect(0,0,90,30)
    targetCanvas.context.font = "normal 14pt Arial";
    targetCanvas.context.fillStyle = targetCanvas.color;
    targetCanvas.context.fillText(targetCanvas.context.fps+ " fps", 5, 20);
    targetCanvas.lastTime = targetCanvas.startTime;
    for (let i = 0; i < e.data.features.length; i++) {
        let rect = e.data.features[i];
        targetCanvas.context.strokeRect(rect.x * canvases.scale, rect.y * canvases.scale, rect.width * canvases.scale, rect.height * canvases.scale);
    }
}

wasmWorker.onmessage = function (e) {
    updateCanvas(e, canvases.wasm);
    requestAnimationFrame((wasmTime) => {
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
    updateCanvas(e, canvases.js);
    requestAnimationFrame((jsTime) => {
        canvases.js.startTime = jsTime;
        startWorker(canvases.js.context.getImageData(0, 0, canvases.js.canvas.width || 200, canvases.js.canvas.height || 200), 'faceDetect', 'js')
    });
}

window.onerror = function (event) {
    console.log(event)
};
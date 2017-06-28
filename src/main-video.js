let wasmWorker = new Worker('wasm-worker.js');
let asmWorker = new Worker('asm-worker.js');

let video = document.querySelector("#videoElement");
let face_cascade;
let eye_cascade;

let canvases = {};

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

    canvases.wasm.color = 'rgba(255, 0, 0, 1)';
    canvases.asm.color = 'rgba(0, 0, 255, 1)';
    canvases.scale = 2;

    canvases.wasm.canvas = document.getElementById('wasm');
    canvases.wasm.context = canvases.wasm.canvas.getContext('2d');

    canvases.asm.canvas = document.getElementById('asm');
    canvases.asm.context = canvases.asm.canvas.getContext('2d');

    canvases.dummy = {};
    canvases.dummy.canvas = document.getElementById('dummy');
    canvases.dummy.context = canvases.dummy.canvas.getContext('2d');

    canvases.dummy.canvas.width = canvases.wasm.canvas.width = canvases.asm.canvas.width = video.width;
    canvases.dummy.canvas.height = canvases.wasm.canvas.height = canvases.asm.canvas.height = video.height;    
    console.log(`object created`)
}

function detectFace() {
    startWorker(canvases.wasm.context.getImageData(0, 0, canvases.wasm.canvas.width || 200, canvases.wasm.canvas.height || 200), 'faceDetect','wasm');
    startWorker(canvases.asm.context.getImageData(0, 0, canvases.asm.canvas.width || 200, canvases.asm.canvas.height || 200), 'faceDetect','asm');
}

function startWorker(imageData, command, type) {    
    canvases.dummy.context.drawImage(wasm, 0, 0, imageData.width, imageData.height, 0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height));
    let message = { cmd: command, img: canvases.dummy.context.getImageData(0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height)) };
    if(type == 'wasm') wasmWorker.postMessage(message);
    else asmWorker.postMessage(message);
}

function updateCanvas(e, targetCanvas) {
    targetCanvas.context.drawImage(video, 0, 0, targetCanvas.canvas.width, targetCanvas.canvas.height);
    targetCanvas.context.strokeStyle = targetCanvas.color;    
    targetCanvas.context.lineWidth = 2;
    
    for (let i = 0; i < e.data.features.length; i++) {
        let rect = e.data.features[i];        
        targetCanvas.context.strokeRect(rect.x * canvases.scale, rect.y * canvases.scale, rect.width * canvases.scale, rect.height * canvases.scale);
    }
}

wasmWorker.onmessage = function (e) {
    updateCanvas(e, canvases.wasm);
    requestAnimationFrame(()=>startWorker(canvases.wasm.context.getImageData(0, 0, canvases.wasm.canvas.width || 200, canvases.wasm.canvas.height || 200), 'faceDetect','wasm'));
}
asmWorker.onmessage = function (e) {
    updateCanvas(e, canvases.asm);
    requestAnimationFrame(()=>startWorker(canvases.asm.context.getImageData(0, 0, canvases.asm.canvas.width || 200, canvases.asm.canvas.height || 200), 'faceDetect','asm'));
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
let wasmWorker = new Worker('wasm-worker.js');

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
    console.log(video)
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
}

function detectFace() {
    startWasmWorker(canvases.wasm.context.getImageData(0, 0, canvases.wasm.canvas.width || 200, canvases.wasm.canvas.height || 200), 'faceDetect');
}

function startWasmWorker(imageData, command) {    
    canvases.dummy.context.drawImage(wasm, 0, 0, imageData.width, imageData.height, 0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height));
    let message = { cmd: command, img: canvases.dummy.context.getImageData(0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height)) };
    wasmWorker.postMessage(message);
}

function updateCanvas(e, canvas) {
    canvases.wasm.context.drawImage(video, 0, 0, canvases.wasm.canvas.width, canvases.wasm.canvas.height);
    canvas.wasm.context.strokeStyle = canvases.wasm.color;    
    canvas.wasm.context.lineWidth = 2;
    
    for (let i = 0; i < e.data.features.length; i++) {
        let rect = e.data.features[i];        
        canvas.wasm.context.strokeRect(rect.x * canvas.scale, rect.y * canvas.scale, rect.width * canvas.scale, rect.height * canvas.scale);
    }
}

wasmWorker.onmessage = function (e) {
    updateCanvas(e, canvases);
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
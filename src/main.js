
let wasmWorker = new Worker('wasm-worker.js');
let jsWorker = new Worker('js-worker.js');
let asmWorker = new Worker('asm-worker.js');

let wasmCanvas = {color: 'rgba(255, 0, 0, 1)', scale: 2}, 
    asmCanvas = {color: 'rgba(0, 0, 255, 1)', scale: 2}, 
    jsCanvas = {color: 'rgba(75,221,17,1)', scale: 2};

let perfwasm0, perfasm0, perfJS0, perfwasm1, perfasm1, perfjs1;
let img = new Image();

function reset() {
  wasmCanvas.holder.context.drawImage(img, 0, 0);
  asmCanvas.holder.context.drawImage(img, 0, 0);
  jsCanvas.holder.context.drawImage(img, 0, 0);
  wasmCanvas.real.context.drawImage(img, 0, 0);
  asmCanvas.real.context.drawImage(img, 0, 0);
  jsCanvas.real.context.drawImage(img, 0, 0);
}

function detectFace() {  
  perfasm0 = performance.now();
  startAsmWorker(asmCanvas.real.context.getImageData(0, 0, asmCanvas.real.canvas.width || 200, asmCanvas.real.canvas.height || 200), 'faceDetect');
  perfwasm0 = performance.now();
  startWasmWorker(wasmCanvas.real.context.getImageData(0, 0, wasmCanvas.real.canvas.width || 200, wasmCanvas.real.canvas.height || 200), 'faceDetect');
  perfJS0 = performance.now();
  startJSWorker(jsCanvas.real.context.getImageData(0, 0, jsCanvas.real.canvas.width || 200, jsCanvas.real.canvas.height || 200), 'faceDetect');
}

function detectEyes() {
  perfasm0 = performance.now();
  startAsmWorker(asmCanvas.real.context.getImageData(0, 0, asmCanvas.real.canvas.width || 200, asmCanvas.real.canvas.height || 200), 'eyesDetect');
  perfwasm0 = performance.now();
  startWasmWorker(wasmCanvas.real.context.getImageData(0, 0, wasmCanvas.real.canvas.width || 200, wasmCanvas.real.canvas.height || 200), 'eyesDetect');  
  perfJS0 = performance.now();
  startJSWorker(jsCanvas.real.context.getImageData(0, 0, jsCanvas.real.canvas.width || 200, jsCanvas.real.canvas.height || 200), 'eyesDetect');
}

function startWasmWorker(imageData, command) {
  wasmCanvas.holder.context.drawImage(img, 0, 0, imageData.width, imageData.height, 0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height));
  let message = { cmd: command, img: wasmCanvas.holder.context.getImageData(0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height))};

  wasmWorker.postMessage(message);
}

function startAsmWorker(imageData, command) {
  asmCanvas.holder.context.drawImage(img, 0, 0, imageData.width, imageData.height, 0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height));
  let message = { cmd: command, img: asmCanvas.holder.context.getImageData(0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height))};

  asmWorker.postMessage(message);
}

function startJSWorker(imageData, command) {
  jsCanvas.holder.context.drawImage(img, 0, 0, imageData.width, imageData.height, 0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height));
  let message = { cmd: command, img: jsCanvas.holder.context.getImageData(0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height))};
  jsWorker.postMessage(message);
}

function updateCanvas(e, canvas) {
  //canvas.real.context.clearRect(0, 0, canvas.width, canvas.height);
  canvas.real.context.strokeStyle = canvas.color;
  canvas.real.context.lineWidth = 2;
  for (let i = 0; i < e.data.features.length; i++) {
    let rect = e.data.features[i];
    canvas.real.context.strokeRect(rect.x * canvas.scale, rect.y * canvas.scale, rect.width * canvas.scale, rect.height * canvas.scale);
  }
}

wasmWorker.onmessage = function (e) {
  updateCanvas(e, wasmCanvas);
  perfwasm1 = performance.now();
  console.log(`WASM: ${perfwasm1 - perfwasm0}`);
}
asmWorker.onmessage = function (e) {
  updateCanvas(e, asmCanvas);
  perfasm1 = performance.now();
  console.log(`ASM: ${perfasm1 - perfasm0}`);
}

jsWorker.onmessage = function(e) {
  updateCanvas(e, jsCanvas);
  perfjs1 = performance.now();
  console.log(`JS: ${perfjs1 - perfJS0}`)
}

let inputElement = document.getElementById('input');
inputElement.addEventListener('change', handleFiles);

function handleFiles(e) {
  wasmCanvas.holder = { canvas: document.getElementById('canvas-wasm') };
  asmCanvas.holder = { canvas: document.getElementById('canvas-asm') };
  jsCanvas.holder = { canvas: document.getElementById('canvas-js') };
  wasmCanvas.real = { canvas: document.getElementById('real-wasm') };
  asmCanvas.real = { canvas: document.getElementById('real-asm') };
  jsCanvas.real = { canvas: document.getElementById('real-js') };

  wasmCanvas.holder.context = wasmCanvas.holder.canvas.getContext('2d');
  asmCanvas.holder.context = asmCanvas.holder.canvas.getContext('2d');
  jsCanvas.holder.context = jsCanvas.holder.canvas.getContext('2d');
  wasmCanvas.real.context = wasmCanvas.real.canvas.getContext('2d');
  asmCanvas.real.context = asmCanvas.real.canvas.getContext('2d');
  jsCanvas.real.context = jsCanvas.real.canvas.getContext('2d');
  let url = URL.createObjectURL(e.target.files[0]);
  img.onload = function () {
      wasmCanvas.real.canvas.width 
      = asmCanvas.real.canvas.width 
      = jsCanvas.real.canvas.width 
      = wasmCanvas.holder.canvas.width 
      = asmCanvas.holder.canvas.width 
      = jsCanvas.holder.canvas.width 
      = img.width;

      wasmCanvas.real.canvas.height 
      = asmCanvas.real.canvas.height 
      = jsCanvas.real.canvas.height 
      = wasmCanvas.holder.canvas.height 
      = asmCanvas.holder.canvas.height 
      = jsCanvas.holder.canvas.height 
      = img.height;
      
      reset();
  }

  img.src = url;
}

window.onload=function(){
  setTimeout(function() {
    wasmCanvas.holder = { canvas: document.getElementById('canvas-wasm') };
    asmCanvas.holder = { canvas: document.getElementById('canvas-asm') };
    jsCanvas.holder = { canvas: document.getElementById('canvas-js') };
    wasmCanvas.real = { canvas: document.getElementById('real-wasm') };
    asmCanvas.real = { canvas: document.getElementById('real-asm') };
    jsCanvas.real = { canvas: document.getElementById('real-js') };

    wasmCanvas.holder.context = wasmCanvas.holder.canvas.getContext('2d');
    asmCanvas.holder.context = asmCanvas.holder.canvas.getContext('2d');
    jsCanvas.holder.context = jsCanvas.holder.canvas.getContext('2d');
    wasmCanvas.real.context = wasmCanvas.real.canvas.getContext('2d');
    asmCanvas.real.context = asmCanvas.real.canvas.getContext('2d');
    jsCanvas.real.context = jsCanvas.real.canvas.getContext('2d');

    wasmCanvas.real.canvas.width 
      = asmCanvas.real.canvas.width 
      = jsCanvas.real.canvas.width 
      = wasmCanvas.holder.canvas.width 
      = asmCanvas.holder.canvas.width 
      = jsCanvas.holder.canvas.width 
      = img.width;

      wasmCanvas.real.canvas.height 
      = asmCanvas.real.canvas.height 
      = jsCanvas.real.canvas.height 
      = wasmCanvas.holder.canvas.height 
      = asmCanvas.holder.canvas.height 
      = jsCanvas.holder.canvas.height 
      = img.height;
      
    reset();

    // let canvasWasm = document.getElementById('canvas-wasm');
    // let canvasAsm = document.getElementById('canvas-asm');
    // let canvasJS = document.getElementById('canvas-js');
    // let canvasRealWasm = document.getElementById('real-wasm');
    // let canvasRealAsm = document.getElementById('real-asm');
    // let canvasRealJS = document.getElementById('real-js');
    // console.log("img data", img.width, img.height)
    // canvasWidth = 600 / 1.5;
    // canvasHeight = 400 / 1.5;
    // ctxWasm = canvasWasm.getContext('2d');
    // ctxAsm = canvasAsm.getContext('2d');
    // ctxJS = canvasJS.getContext('2d');
    // ctxRealWasm = canvasRealWasm.getContext('2d');
    // ctxRealAsm = canvasRealAsm.getContext('2d');
    // ctxRealJS = canvasRealJS.getContext('2d');
    //   canvasWidth = canvasRealWasm.width = canvasRealAsm.width = canvasRealJS.width = canvasWasm.width = canvasAsm.width = canvasJS.width = img.width;
    //   canvasHeight = canvasRealWasm.height = canvasRealAsm.height = canvasRealJS.height = canvasWasm.height = canvasAsm.height = canvasJS.height = img.height;
    //   ctxWasm.drawImage(img, 0, 0);
    //   ctxAsm.drawImage(img, 0, 0);
    //   // ctxJS.drawImage(img, 0, 0);
    //   ctxRealWasm.drawImage(img, 0, 0);
    //   ctxRealAsm.drawImage(img, 0, 0);
    //   ctxRealJS.drawImage(img, 0, 0);
    detectFace();
    }, 3000);  
}


let wasmWorker = new Worker('wasm-worker.js');
let jsWorker = new Worker('js-worker.js');
let asmWorker = new Worker('asm-worker.js');

let ctxWasm, ctxAsm, ctxJS, ctxRealWasm, ctxRealAsm, ctxRealJs;
let canvasWidth, canvasHeight;
let perfwasm0, perfasm0, perfJS0, perfwasm1, perfasm1, perfjs1;
let fn;
let img = new Image();

function reset() {
  ctxAsm.drawImage(img, 0, 0);
  ctxRealAsm.drawImage(img, 0, 0);
  ctxWasm.drawImage(img, 0, 0);
  ctxRealWasm.drawImage(img, 0, 0);
  ctxJS.drawImage(img, 0, 0);
  ctxRealJS.drawImage(img, 0, 0);
}

function detectFace() {  
  perfasm0 = performance.now();
  startAsmWorker(ctxAsm.getImageData(0, 0, canvasWidth, canvasHeight), 'faceDetect');
  perfwasm0 = performance.now();
  startWasmWorker(ctxWasm.getImageData(0, 0, canvasWidth, canvasHeight), 'faceDetect');
  fn = 'face';
}
function detectEyes() {
  perfasm0 = performance.now();
  startAsmWorker(ctxAsm.getImageData(0, 0, canvasWidth, canvasHeight), 'eyesDetect');
  perfwasm0 = performance.now();
  startWasmWorker(ctxWasm.getImageData(0, 0, canvasWidth, canvasHeight), 'eyesDetect');  
  fn = 'eyes';
}

function detectFaceWasm() {
  perfwasm0 = performance.now();
  startWasmWorker(ctxWasm.getImageData(0, 0, canvasWidth, canvasHeight), 'faceDetect');
}

function detectFaceAsm() {
  perfasm0 = performance.now();
  startAsmWorker(ctxWasm.getImageData(0, 0, canvasWidth, canvasHeight), 'faceDetect');
}

function detectFaceJs(obj) {
  perfJS0 = performance.now();
  getFaceJS(obj);
}

function startWasmWorker(imageData, command) {
  let message = { cmd: command, img: imageData };

  wasmWorker.postMessage(message);
}

function startAsmWorker(imageData, command) {
  let message = { cmd: command, img: imageData, type: "asm" };

  asmWorker.postMessage(message);
}


function updateCanvas(e, id) {
  let data = e.data.data; 	// output is a Uint8Array that aliases directly into the Emscripten heap

  channels = e.data.channels;
  channelSize = e.data.channelSize;

  let canvas = document.getElementById(id);

  ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  canvas.width = e.data.width;
  canvas.height = e.data.height;

  imdata = ctx.createImageData(canvas.width, canvas.height);

  for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
    imdata.data[j] = data[i];
    imdata.data[j + 1] = data[i + 1 % channels];
    imdata.data[j + 2] = data[i + 2 % channels];
    imdata.data[j + 3] = 255;
  }
  ctx.putImageData(imdata, 0, 0);
}

wasmWorker.onmessage = function (e) {
  updateCanvas(e, 'canvas-wasm');
  perfwasm1 = performance.now();
  console.log(`WASM: ${perfwasm1 - perfwasm0}`);
  ctxRealWasm.drawImage(document.getElementById('canvas-wasm'), 0, 0);

}
asmWorker.onmessage = function (e) {
  updateCanvas(e, 'canvas-asm');
  perfasm1 = performance.now();
  console.log(`ASM: ${perfasm1 - perfasm0}`);
  ctxRealAsm.drawImage(document.getElementById('canvas-asm'), 0, 0);
  perfJS0 = performance.now();
  detectFaceJs(fn);
}



let inputElement = document.getElementById("input");
inputElement.addEventListener("change", handleFiles);

function handleFiles(e) {
  let canvasWasm = document.getElementById('canvas-wasm');
  let canvasAsm = document.getElementById('canvas-asm');
  let canvasJS = document.getElementById('canvas-js');
  let canvasRealWasm = document.getElementById('real-wasm');
  let canvasRealAsm = document.getElementById('real-asm');
  let canvasRealJS = document.getElementById('real-js');

  canvasWidth = 600 / 1.5;
  canvasHeight = 400 / 1.5;
  ctxWasm = canvasWasm.getContext('2d');
  ctxAsm = canvasAsm.getContext('2d');
  ctxJS = canvasJS.getContext('2d');
  ctxRealWasm = canvasRealWasm.getContext('2d');
  ctxRealAsm = canvasRealAsm.getContext('2d');
  ctxRealJS = canvasRealJS.getContext('2d');
  let url = URL.createObjectURL(e.target.files[0]);
  img.onload = function () {
    canvasWidth = canvasRealWasm.width = canvasRealAsm.width = canvasRealJS.width = canvasWasm.width = canvasAsm.width = canvasJS.width = img.width;
    canvasHeight = canvasRealWasm.height = canvasRealAsm.height = canvasRealJS.height = canvasWasm.height = canvasAsm.height = canvasJS.height = img.height;
    ctxWasm.drawImage(img, 0, 0);
    ctxAsm.drawImage(img, 0, 0);
    ctxJS.drawImage(img, 0, 0);
    ctxRealWasm.drawImage(img, 0, 0);
    ctxRealAsm.drawImage(img, 0, 0);
    ctxRealJS.drawImage(img, 0, 0);
  }

  img.src = url;
}

let container;
let Control = {
  'Detect face(all)': detectFace,
  'Detect eyes(all)': detectEyes,
};

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  gui = new dat.GUI({ autoPlace: false });
  document.body.appendChild(gui.domElement);
  gui.domElement.style.position = "absolute";
  gui.domElement.style.top = "0px";
  gui.domElement.style.right = "5px";

  gui.add(Control, ['Detect eyes(all)']);
  gui.add(Control, ['Detect face(all)']);
};

init();

function getFaceJS(obj) {
  perfjs0 = performance.now();
  let detector;  
  if (obj === 'face') detector = new HAAR.Detector(haarcascade_frontalface_alt, false);
  else {
    
    detector = new HAAR.Detector(haarcascade_eye, false);
  }
  detector.image(img, .5)
    .interval(40)
    .selection('auto')
    .complete(function () {
      let i;
      let rect;
      let l = this.objects.length;
      ctxJS.strokeStyle = "rgba(75,221,17,1)";
      ctxJS.lineWidth = 4;
      for (i = 0; i < l; i++) {
        rect = this.objects[i];
        ctxJS.strokeRect(rect.x, rect.y, rect.width, rect.height);
      }
      perfjs1 = performance.now();
      console.log(`JS: ${perfjs1 - perfJS0}`)
      ctxRealJS.drawImage(document.getElementById('canvas-js'), 0, 0);
    })
    .cannyThreshold({ low: 90, high: 200 })
    .detect(1, 1.1, 0.12, 1, true)


}

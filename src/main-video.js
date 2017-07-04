let wasmWorker = new Worker('wasm-worker.js');
let asmWorker = new Worker('asm-worker.js');
let jsWorker = new Worker('js-worker.js');

let video = document.querySelector("#videoElement");
let face_cascade;
let eye_cascade;
let objType = 'faceDetect';

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
canvases.chart.canvas = document.getElementById('graph');
canvases.chart.context = canvases.chart.canvas.getContext('2d');

canvases.dummy.canvas.width = canvases.wasm.canvas.width = canvases.asm.canvas.width = canvases.js.canvas.width = canvases.chart.canvas.width = 320
canvases.dummy.canvas.height = canvases.wasm.canvas.height = canvases.asm.canvas.height = canvases.js.canvas.height = canvases.chart.canvas.height = 240;

console.log(`object created`)

function detectFace(type) {
    startWorker(canvases.wasm.context.getImageData(0, 0, canvases.wasm.canvas.width || 200, canvases.wasm.canvas.height || 200), objType, 'wasm');
    startWorker(canvases.asm.context.getImageData(0, 0, canvases.asm.canvas.width || 200, canvases.asm.canvas.height || 200), objType, 'asm');
    startWorker(canvases.js.context.getImageData(0, 0, canvases.js.canvas.width || 200, canvases.js.canvas.height || 200), 'faceDetect', 'js');
}

function startWorker(imageData, command, type) {
    canvases.dummy.context.drawImage(wasm, 0, 0, imageData.width, imageData.height, 0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height));
    let message = {
        cmd: command,
        img: canvases.dummy.context.getImageData(0, 0, Math.round(.5 * imageData.width), Math.round(.5 * imageData.height))
    };
    if (type == 'wasm') wasmWorker.postMessage(message);
    else if (type == 'asm') asmWorker.postMessage(message);
    else if (type == 'js') jsWorker.postMessage(message);
}

function selectObj(type) {
    if (type == 'face') {
        objType = 'faceDetect';
        document.getElementById('radio-face').checked = true;
        document.getElementById('radio-eyes').checked = false;
    }
    else {
        objType = 'eyesDetect';
        document.getElementById('radio-eyes').checked = true;
        document.getElementById('radio-face').checked = false;
    }
    console.log(objType)
    return;
}


let chartArr = [];
function updateCanvas(e, targetCanvas, plot) {
    targetCanvas.context.drawImage(video, 0, 0, targetCanvas.canvas.width, targetCanvas.canvas.height);
    targetCanvas.context.strokeStyle = targetCanvas.color;
    targetCanvas.context.lineWidth = 2;
    targetCanvas.fpsArr.push(1000 / (targetCanvas.startTime - targetCanvas.lastTime));
    plot.holder.push(1000 / (targetCanvas.startTime - targetCanvas.lastTime));

    if (plot.holder.length > 20) {
        plot.holder.shift();
        plot.displayPoints.push(Math.round((plot.holder.reduce((a, b) => a + b) / 20) * 100) / 100);

        if (plot.displayPoints.length > 20) {
            plot.displayPoints.shift();
        }

        myChart.update();
    }

    if (targetCanvas.fpsArr.length === 10) {
        targetCanvas.context.fps = Math.round((targetCanvas.fpsArr.reduce((a, b) => a + b) / 10) * 100) / 100;
        targetCanvas.fpsArr = [];
    }

    targetCanvas.context.fillStyle = 'rgba(255,255,255,.5)';
    targetCanvas.context.fillRect(0, 0, 90, 30)
    targetCanvas.context.font = "normal 14pt Arial";
    targetCanvas.context.fillStyle = targetCanvas.color;
    targetCanvas.context.fillText(targetCanvas.context.fps + " fps", 5, 20);
    targetCanvas.lastTime = targetCanvas.startTime;
    for (let i = 0; i < e.data.features.length; i++) {
        let rect = e.data.features[i];
        targetCanvas.context.strokeRect(rect.x * canvases.scale, rect.y * canvases.scale, rect.width * canvases.scale, rect.height * canvases.scale);
    }
}

wasmWorker.onmessage = function (e) {
    updateCanvas(e, canvases.wasm, wasmGraph);
    requestAnimationFrame((wasmTime) => {
        canvases.wasm.startTime = wasmTime;
        startWorker(canvases.wasm.context.getImageData(0, 0, canvases.wasm.canvas.width || 200, canvases.wasm.canvas.height || 200), objType, 'wasm')
    });
}

asmWorker.onmessage = function (e) {
    updateCanvas(e, canvases.asm, asmGraph);
    requestAnimationFrame((asmTime) => {
        canvases.asm.startTime = asmTime;
        startWorker(canvases.asm.context.getImageData(0, 0, canvases.asm.canvas.width || 200, canvases.asm.canvas.height || 200), objType, 'asm')
    });
}

jsWorker.onmessage = function (e) {
    updateCanvas(e, canvases.js, jsGraph);
    requestAnimationFrame((jsTime) => {
        canvases.js.startTime = jsTime;
        startWorker(canvases.js.context.getImageData(0, 0, canvases.js.canvas.width || 200, canvases.js.canvas.height || 200), 'faceDetect', 'js')
    });
}

window.onerror = function (event) {
    console.log(event)
};

const ctx = document.getElementById("graph").getContext('2d');
Chart.defaults.global.tooltips.enabled = false;
Chart.defaults.global.scalesLineColor = "rgba(0,0,0,0)";
Chart.defaults.global.defaultFontFamily = '"Palatino Linotype", "Book Antiqua", Palatino, serif';

const ctx2 = document.getElementById("graph");
ctx2.height = 50;

Chart.pluginService.register({
    beforeDraw: function (chart, easing) {
        if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
            var helpers = Chart.helpers;
            var ctx = chart.chart.ctx;
            var chartArea = chart.chartArea;

            ctx.save();
            ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
            ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
            ctx.restore();
        }
    }
});

let myChart = Chart.Line(ctx, {

    responsive: true,
    options: {
        legend: {
            display: true,
            labels: {
                fontColor: "#F16327"
            }
        },
        chartArea: {
            backgroundColor: "#D1D1D1"
        },
        elements: {
            point: {
                radius: 0
            }
        },
        animation: false,
        scales: {
            fontColor: "#FFFFFF",
            xAxes: [{
                gridLines: {
                    display: false,
                    color: "rgba(0,0,0,1)"
                },
                ticks: {
                    fontColor: "#F16327"
                },
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: "Frames",
                    fontColor: "#F16327"
                },
            }],
            yAxes: [
                {
                    display: true,
                    ticks: {
                        min: 0,
                        max: 60,
                        stepSize: 10,
                        fontColor: "#F16327"
                    },
                    scaleLabel: {
                        display: true,
                        labelString: "FPS",
                        fontColor: "#F16327"
                    },
                    gridLines: {
                        color: "rgba(0,0,0,1)",
                    }
                }],
        },
        labels: {
            fontColor: "blue"
        }
    },
    data: {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        datasets: [
            {
                fill: false,
                label: "wasm",
                borderColor: "rgba(255,0,0,1)",
                backgroundColor: "rgba(255,0,0,1)",
                data: []
            },
            {
                fill: false,
                label: "asm",
                borderColor: "rgba(0,191,255,1)",
                backgroundColor: "rgba(0,191,255,1)",
                data: []
            },
            {
                fill: false,
                label: "js",
                borderColor: "rgba(0,255,0,1)",
                backgroundColor: "rgba(0,255,0,1)",
                data: []
            }
        ]
    }
})

let wasmGraph = { displayPoints: myChart.config.data.datasets[0].data, holder: [] };
let asmGraph = { displayPoints: myChart.config.data.datasets[1].data, holder: [] };
let jsGraph = { displayPoints: myChart.config.data.datasets[2].data, holder: [] };
console.log(myChart);

let asmWorker = new Worker('asm-worker.js');
let wasmWorker = new Worker('wasm-worker.js');
let jsWorker = new Worker('js-worker.js');

let video = document.querySelector("#videoElement");
let objType = 'faceDetect';


// check for getUserMedia support
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;

if (navigator.getUserMedia) {
    // get webcam feed if available
    navigator.getUserMedia({ video: true }, handleVideo, () => console.log('error with webcam'));
    // setTimeout(detect, 8000)
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('dom loaded')
}, false);

function handleVideo(stream) {
    video.src = window.URL.createObjectURL(stream);
}

let canvases = {};
canvases.running = false;
canvases.ready = false;
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
canvases.asm.color = 'rgba(0, 191, 255, 1)';
canvases.js.color = 'rgba(0, 255, 0, 1)';
canvases.width = 320;
canvases.height = 240;
canvases.scale = 2;

canvases.wasm.canvas = document.getElementById('wasm');
canvases.wasm.context = canvases.wasm.canvas.getContext('2d');
canvases.wasm.canvas.width = canvases.width;
canvases.wasm.canvas.height = canvases.height;

canvases.asm.canvas = document.getElementById('asm');
canvases.asm.context = canvases.asm.canvas.getContext('2d');
canvases.asm.canvas.width = canvases.width;
canvases.asm.canvas.height = canvases.height;

canvases.js.canvas = document.getElementById('js');
canvases.js.context = canvases.js.canvas.getContext('2d');
canvases.js.canvas.width = canvases.width;
canvases.js.canvas.height = canvases.height;

canvases.dummy = {};
canvases.dummy.canvas = document.getElementById('dummy');
canvases.dummy.context = canvases.dummy.canvas.getContext('2d');
canvases.dummy.canvas.width = canvases.width;
canvases.dummy.canvas.height = canvases.height;

canvases.chart = {};
canvases.chart.canvas = document.getElementById('graph');
canvases.chart.context = canvases.chart.canvas.getContext('2d');
canvases.chart.canvas.width = canvases.width;
canvases.chart.canvas.height = canvases.height;

function detect(type) {
    if (!canvases.running) {
        canvases.running = true;
        startWorker(canvases.wasm.context.getImageData(0, 0, canvases.wasm.canvas.width, canvases.wasm.canvas.height), objType, 'wasm');
        startWorker(canvases.asm.context.getImageData(0, 0, canvases.asm.canvas.width, canvases.asm.canvas.height), objType, 'asm');
        startWorker(canvases.js.context.getImageData(0, 0, canvases.js.canvas.width, canvases.js.canvas.height), objType, 'js');
    }
}

function startWorker(imageData, command, type) {
    if (type == 'wasm')
        canvases.dummy.context.drawImage(wasm, 0, 0, imageData.width, imageData.height, 0, 0, Math.round(imageData.width/ canvases.scale), Math.round(imageData.height/canvases.scale));
    let message = {
        cmd: command,
        img: canvases.dummy.context.getImageData(0, 0, Math.round(imageData.width/ canvases.scale), Math.round(imageData.height/canvases.scale))
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
    return;
}

function updateCanvas(e, targetCanvas, plot) {
    targetCanvas.context.drawImage(video, 0, 0, targetCanvas.canvas.width, targetCanvas.canvas.height);
    targetCanvas.context.strokeStyle = targetCanvas.color;
    targetCanvas.context.lineWidth = 2;
    let fps = 1000 / (targetCanvas.startTime - targetCanvas.lastTime)
    if (fps) {
        targetCanvas.fpsArr.push(fps);
    }
    if (plot.displayPoints.length > 10) {
        plot.displayPoints.shift();
    }
    if (canvases.js.fpsArr.length === 1 || canvases.asm.fpsArr.length === 2  || canvases.wasm.fpsArr.length === 4 ) {
        targetCanvas.context.fps = Math.round((targetCanvas.fpsArr.reduce((a, b) => a + b) / targetCanvas.fpsArr.length) * 100) / 100;
        if ( targetCanvas.context.fps > myChart.controller.options.scales.yAxes[0].ticks.max) {
            myChart.controller.options.scales.yAxes[0].ticks.max =  targetCanvas.context.fps;
        }
        plot.displayPoints.push(targetCanvas.context.fps)
        targetCanvas.fpsArr = [];
    }
    myChart.update();
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
    if (e.data.msg == 'wasm') {
        if (canvases.ready) { 
            setTimeout(detect, 2000) }
        else {
            canvases.ready = true
        }
    }
    else {
        updateCanvas(e, canvases.wasm, wasmGraph);
        requestAnimationFrame((wasmTime) => {
            canvases.wasm.startTime = wasmTime;
            startWorker(canvases.wasm.context.getImageData(0, 0, canvases.wasm.canvas.width, canvases.wasm.canvas.height), objType, 'wasm')
        })
    }
}

asmWorker.onmessage = function (e) {
    if (e.data.msg == 'asm') {
        if (canvases.ready) { setTimeout(detect, 2000)}
        else {
            canvases.ready = true
        }
    }
    else {
        updateCanvas(e, canvases.asm, asmGraph);
        requestAnimationFrame((asmTime) => {
            canvases.asm.startTime = asmTime;
            startWorker(canvases.asm.context.getImageData(0, 0, canvases.asm.canvas.width, canvases.asm.canvas.height), objType, 'asm')
        });
    }
}

jsWorker.onmessage = function (e) {
    updateCanvas(e, canvases.js, jsGraph);
    requestAnimationFrame((jsTime) => {
        canvases.js.startTime = jsTime;
        startWorker(canvases.js.context.getImageData(0, 0, canvases.js.canvas.width, canvases.js.canvas.height), objType, 'js')
    });
}

window.onerror = function (event) {
    console.log(event)
};

Chart.defaults.global.tooltips.enabled = false;
Chart.defaults.global.scalesLineColor = "rgba(0,0,0,0)";
Chart.defaults.global.defaultFontFamily = '"Palatino Linotype", "Book Antiqua", Palatino, serif';

const graphEle = document.getElementById("graph");
graphEle.height = 80;
const ctx = graphEle.getContext('2d');

Chart.pluginService.register({
    beforeDraw: function (chart, easing) {
        if (chart.config.options.chartArea && chart.config.options.chartArea.backgroundColor) {
            var helpers = Chart.helpers;
            var ctx = chart.chart.ctx;
            var chartArea = chart.chartArea;

            ctx.save();
            ctx.fillStyle = chart.config.options.chartArea.backgroundColor;
            ctx.fillRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);            
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
                    display:false,
                    fontColor: "#F16327"
                },
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: "Inputs",
                    fontColor: "#F16327"
                },
            }],
            yAxes: [
                {
                    display: true,
                    ticks: {
                        min: 0,
                        max: 30,
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
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
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

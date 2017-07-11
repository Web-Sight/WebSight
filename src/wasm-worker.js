var Module = {};
importScripts('cv-wasm.js', 'worker.js');
postMessage({msg: 'wasm'});
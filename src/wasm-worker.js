var Module = {};
Module['onRuntimeInitialized'] = function() {
  postMessage({msg: 'wasm'});
}
importScripts('cv-wasm.js', 'worker.js');

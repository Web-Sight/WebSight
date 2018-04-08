var Module = {};
Module['onRuntimeInitialized'] = function() {
  postMessage({msg: 'asm'});
}
importScripts('cv-asm.js', 'worker.js');

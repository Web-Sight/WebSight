var Module = {};
importScripts('cv-asm.js', 'worker.js');
postMessage({msg: 'asm'});
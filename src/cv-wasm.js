(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(function () {
            return (root.cv = factory());
        });
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals
        root.cv = factory();
    }
}(this, function () {
    var cv = function(cv) {
  cv = cv || {};
  var Module = cv;

var Module;
if (typeof Module === "undefined") Module = {};
if (!Module.expectedDataFileDownloads) {
    Module.expectedDataFileDownloads = 0;
    Module.finishedDataFileDownloads = 0
}
Module.expectedDataFileDownloads++;
((function() {
    var loadPackage = (function(metadata) {
        var PACKAGE_PATH;
        if (typeof window === "object") {
            PACKAGE_PATH = window["encodeURIComponent"](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf("/")) + "/")
        } else if (typeof location !== "undefined") {
            PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf("/")) + "/")
        } else {
            throw "using preloaded data can only be done on a web page or in a web worker"
        }
        var PACKAGE_NAME = "../../build/cv-wasm.data";
        var REMOTE_PACKAGE_BASE = "cv-wasm.data";
        if (typeof Module["locateFilePackage"] === "function" && !Module["locateFile"]) {
            Module["locateFile"] = Module["locateFilePackage"];
            Module.printErr("warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)")
        }
        var REMOTE_PACKAGE_NAME = typeof Module["locateFile"] === "function" ? Module["locateFile"](REMOTE_PACKAGE_BASE) : (Module["filePackagePrefixURL"] || "") + REMOTE_PACKAGE_BASE;
        var REMOTE_PACKAGE_SIZE = metadata.remote_package_size;
        var PACKAGE_UUID = metadata.package_uuid;

        function fetchRemotePackage(packageName, packageSize, callback, errback) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", packageName, true);
            xhr.responseType = "arraybuffer";
            xhr.onprogress = (function(event) {
                var url = packageName;
                var size = packageSize;
                if (event.total) size = event.total;
                if (event.loaded) {
                    if (!xhr.addedTotal) {
                        xhr.addedTotal = true;
                        if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
                        Module.dataFileDownloads[url] = {
                            loaded: event.loaded,
                            total: size
                        }
                    } else {
                        Module.dataFileDownloads[url].loaded = event.loaded
                    }
                    var total = 0;
                    var loaded = 0;
                    var num = 0;
                    for (var download in Module.dataFileDownloads) {
                        var data = Module.dataFileDownloads[download];
                        total += data.total;
                        loaded += data.loaded;
                        num++
                    }
                    total = Math.ceil(total * Module.expectedDataFileDownloads / num);
                    if (Module["setStatus"]) Module["setStatus"]("Downloading data... (" + loaded + "/" + total + ")")
                } else if (!Module.dataFileDownloads) {
                    if (Module["setStatus"]) Module["setStatus"]("Downloading data...")
                }
            });
            xhr.onerror = (function(event) {
                throw new Error("NetworkError for: " + packageName)
            });
            xhr.onload = (function(event) {
                if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || xhr.status == 0 && xhr.response) {
                    var packageData = xhr.response;
                    callback(packageData)
                } else {
                    throw new Error(xhr.statusText + " : " + xhr.responseURL)
                }
            });
            xhr.send(null)
        }

        function handleError(error) {
            console.error("package error:", error)
        }
        var fetchedCallback = null;
        var fetched = Module["getPreloadedPackage"] ? Module["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;
        if (!fetched) fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, (function(data) {
            if (fetchedCallback) {
                fetchedCallback(data);
                fetchedCallback = null
            } else {
                fetched = data
            }
        }), handleError);

        function runWithFS() {
            function assert(check, msg) {
                if (!check) throw msg + (new Error).stack
            }
            Module["FS_createPath"]("/", "test", true, true);
            Module["FS_createPath"]("/test", "data", true, true);

            function DataRequest(start, end, crunched, audio) {
                this.start = start;
                this.end = end;
                this.crunched = crunched;
                this.audio = audio
            }
            DataRequest.prototype = {
                requests: {},
                open: (function(mode, name) {
                    this.name = name;
                    this.requests[name] = this;
                    Module["addRunDependency"]("fp " + this.name)
                }),
                send: (function() {}),
                onload: (function() {
                    var byteArray = this.byteArray.subarray(this.start, this.end);
                    this.finish(byteArray)
                }),
                finish: (function(byteArray) {
                    var that = this;
                    Module["FS_createDataFile"](this.name, null, byteArray, true, true, true);
                    Module["removeRunDependency"]("fp " + that.name);
                    this.requests[this.name] = null
                })
            };
            var files = metadata.files;
            for (i = 0; i < files.length; ++i) {
                (new DataRequest(files[i].start, files[i].end, files[i].crunched, files[i].audio)).open("GET", files[i].filename)
            }

            function processPackageData(arrayBuffer) {
                Module.finishedDataFileDownloads++;
                assert(arrayBuffer, "Loading data file failed.");
                assert(arrayBuffer instanceof ArrayBuffer, "bad input to processPackageData");
                var byteArray = new Uint8Array(arrayBuffer);
                if (Module["SPLIT_MEMORY"]) Module.printErr("warning: you should run the file packager with --no-heap-copy when SPLIT_MEMORY is used, otherwise copying into the heap may fail due to the splitting");
                var ptr = Module["getMemory"](byteArray.length);
                Module["HEAPU8"].set(byteArray, ptr);
                DataRequest.prototype.byteArray = Module["HEAPU8"].subarray(ptr, ptr + byteArray.length);
                var files = metadata.files;
                for (i = 0; i < files.length; ++i) {
                    DataRequest.prototype.requests[files[i].filename].onload()
                }
                Module["removeRunDependency"]("datafile_../../build/cv-wasm.data")
            }
            Module["addRunDependency"]("datafile_../../build/cv-wasm.data");
            if (!Module.preloadResults) Module.preloadResults = {};
            Module.preloadResults[PACKAGE_NAME] = {
                fromCache: false
            };
            if (fetched) {
                processPackageData(fetched);
                fetched = null
            } else {
                fetchedCallback = processPackageData
            }
        }
        if (Module["calledRun"]) {
            runWithFS()
        } else {
            if (!Module["preRun"]) Module["preRun"] = [];
            Module["preRun"].push(runWithFS)
        }
    });
    loadPackage({
        "files":[
         {
            "audio": 0,
            "start": 129768,
            "crunched": 0,
            "end": 471174,
            "filename": "/test/data/haarcascade_eye.xml"
        },
        {
            "audio": 0,
            "start": 475724,
            "crunched": 0,
            "end": 1405851,
            "filename": "/test/data/haarcascade_frontalface_default.xml"
        }],
        "remote_package_size": 1405851,
        "package_uuid": "dc160868-5d20-4fa9-9fa1-47aa876cd0af"
    })
}))();
var Module;
if (!Module) Module = (typeof cv !== "undefined" ? cv : null) || {};
var moduleOverrides = {};
for (var key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key]
    }
}
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
if (Module["ENVIRONMENT"]) {
    if (Module["ENVIRONMENT"] === "WEB") {
        ENVIRONMENT_IS_WEB = true
    } else if (Module["ENVIRONMENT"] === "WORKER") {
        ENVIRONMENT_IS_WORKER = true
    } else if (Module["ENVIRONMENT"] === "NODE") {
        ENVIRONMENT_IS_NODE = true
    } else if (Module["ENVIRONMENT"] === "SHELL") {
        ENVIRONMENT_IS_SHELL = true
    } else {
        throw new Error("The provided Module['ENVIRONMENT'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.")
    }
} else {
    ENVIRONMENT_IS_WEB = typeof window === "object";
    ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
    ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
    ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER
}
    Module["read"] = function shell_read(url) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.send(null);
        return xhr.responseText
    };
    if (ENVIRONMENT_IS_WORKER) {
        Module["readBinary"] = function readBinary(url) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.responseType = "arraybuffer";
            xhr.send(null);
            return new Uint8Array(xhr.response)
        }
    }
    Module["readAsync"] = function readAsync(url, onload, onerror) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function xhr_onload() {
            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                onload(xhr.response)
            } else {
                onerror()
            }
        };
        xhr.onerror = onerror;
        xhr.send(null)
    };
    if (typeof arguments != "undefined") {
        Module["arguments"] = arguments
    }
    if (typeof console !== "undefined") {
        if (!Module["print"]) Module["print"] = function shell_print(x) {
            console.log(x)
        };
        if (!Module["printErr"]) Module["printErr"] = function shell_printErr(x) {
            console.warn(x)
        }
    } else {
        var TRY_USE_DUMP = false;
        if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function(x) {
            dump(x)
        }) : (function(x) {})
    }
    if (ENVIRONMENT_IS_WORKER) {
        Module["load"] = importScripts
    }
    if (typeof Module["setWindowTitle"] === "undefined") {
        Module["setWindowTitle"] = (function(title) {
            document.title = title
        })
    }
function globalEval(x) {
    eval.call(null, x)
}
if (!Module["load"] && Module["read"]) {
    Module["load"] = function load(f) {
        globalEval(Module["read"](f))
    }
}
if (!Module["print"]) {
    Module["print"] = (function() {})
}
if (!Module["printErr"]) {
    Module["printErr"] = Module["print"]
}
if (!Module["arguments"]) {
    Module["arguments"] = []
}
if (!Module["thisProgram"]) {
    Module["thisProgram"] = "./this.program"
}
if (!Module["quit"]) {
    Module["quit"] = (function(status, toThrow) {
        throw toThrow
    })
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key]
    }
}
moduleOverrides = undefined;
var Runtime = {
    setTempRet0: (function(value) {
        tempRet0 = value;
        return value
    }),
    getTempRet0: (function() {
        return tempRet0
    }),
    stackSave: (function() {
        return STACKTOP
    }),
    stackRestore: (function(stackTop) {
        STACKTOP = stackTop
    }),
    getNativeTypeSize: (function(type) {
        switch (type) {
            case "i1":
            case "i8":
                return 1;
            case "i16":
                return 2;
            case "i32":
                return 4;
            case "i64":
                return 8;
            case "float":
                return 4;
            case "double":
                return 8;
            default:
                {
                    if (type[type.length - 1] === "*") {
                        return Runtime.QUANTUM_SIZE
                    } else if (type[0] === "i") {
                        var bits = parseInt(type.substr(1));
                        assert(bits % 8 === 0);
                        return bits / 8
                    } else {
                        return 0
                    }
                }
        }
    }),
    getNativeFieldSize: (function(type) {
        return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE)
    }),
    STACK_ALIGN: 16,
    prepVararg: (function(ptr, type) {
        if (type === "double" || type === "i64") {
            if (ptr & 7) {
                assert((ptr & 7) === 4);
                ptr += 4
            }
        } else {
            assert((ptr & 3) === 0)
        }
        return ptr
    }),
    getAlignSize: (function(type, size, vararg) {
        if (!vararg && (type == "i64" || type == "double")) return 8;
        if (!type) return Math.min(size, 8);
        return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE)
    }),
    dynCall: (function(sig, ptr, args) {
        if (args && args.length) {
            return Module["dynCall_" + sig].apply(null, [ptr].concat(args))
        } else {
            return Module["dynCall_" + sig].call(null, ptr)
        }
    }),
    functionPointers: [],
    addFunction: (function(func) {
        for (var i = 0; i < Runtime.functionPointers.length; i++) {
            if (!Runtime.functionPointers[i]) {
                Runtime.functionPointers[i] = func;
                return 2 * (1 + i)
            }
        }
        throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS."
    }),
    removeFunction: (function(index) {
        Runtime.functionPointers[(index - 2) / 2] = null
    }),
    warnOnce: (function(text) {
        if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
        if (!Runtime.warnOnce.shown[text]) {
            Runtime.warnOnce.shown[text] = 1;
            Module.printErr(text)
        }
    }),
    funcWrappers: {},
    getFuncWrapper: (function(func, sig) {
        assert(sig);
        if (!Runtime.funcWrappers[sig]) {
            Runtime.funcWrappers[sig] = {}
        }
        var sigCache = Runtime.funcWrappers[sig];
        if (!sigCache[func]) {
            if (sig.length === 1) {
                sigCache[func] = function dynCall_wrapper() {
                    return Runtime.dynCall(sig, func)
                }
            } else if (sig.length === 2) {
                sigCache[func] = function dynCall_wrapper(arg) {
                    return Runtime.dynCall(sig, func, [arg])
                }
            } else {
                sigCache[func] = function dynCall_wrapper() {
                    return Runtime.dynCall(sig, func, Array.prototype.slice.call(arguments))
                }
            }
        }
        return sigCache[func]
    }),
    getCompilerSetting: (function(name) {
        throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work"
    }),
    stackAlloc: (function(size) {
        var ret = STACKTOP;
        STACKTOP = STACKTOP + size | 0;
        STACKTOP = STACKTOP + 15 & -16;
        return ret
    }),
    staticAlloc: (function(size) {
        var ret = STATICTOP;
        STATICTOP = STATICTOP + size | 0;
        STATICTOP = STATICTOP + 15 & -16;
        return ret
    }),
    dynamicAlloc: (function(size) {
        var ret = HEAP32[DYNAMICTOP_PTR >> 2];
        var end = (ret + size + 15 | 0) & -16;
        HEAP32[DYNAMICTOP_PTR >> 2] = end;
        if (end >= TOTAL_MEMORY) {
            var success = enlargeMemory();
            if (!success) {
                HEAP32[DYNAMICTOP_PTR >> 2] = ret;
                return 0
            }
        }
        return ret
    }),
    alignMemory: (function(size, quantum) {
        var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
        return ret
    }),
    makeBigInt: (function(low, high, unsigned) {
        var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * 4294967296 : +(low >>> 0) + +(high | 0) * 4294967296;
        return ret
    }),
    GLOBAL_BASE: 1024,
    QUANTUM_SIZE: 4,
    __dummy__: 0
};
Module["Runtime"] = Runtime;
var ABORT = 0;
var EXITSTATUS = 0;

function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text)
    }
}

function getCFunc(ident) {
    var func = Module["_" + ident];
    if (!func) {
        try {
            func = eval("_" + ident)
        } catch (e) {}
    }
    assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
    return func
}
var cwrap, ccall;
((function() {
    var JSfuncs = {
        "stackSave": (function() {
            Runtime.stackSave()
        }),
        "stackRestore": (function() {
            Runtime.stackRestore()
        }),
        "arrayToC": (function(arr) {
            var ret = Runtime.stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret
        }),
        "stringToC": (function(str) {
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                var len = (str.length << 2) + 1;
                ret = Runtime.stackAlloc(len);
                stringToUTF8(str, ret, len)
            }
            return ret
        })
    };
    var toC = {
        "string": JSfuncs["stringToC"],
        "array": JSfuncs["arrayToC"]
    };
    ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
        var func = getCFunc(ident);
        var cArgs = [];
        var stack = 0;
        if (args) {
            for (var i = 0; i < args.length; i++) {
                var converter = toC[argTypes[i]];
                if (converter) {
                    if (stack === 0) stack = Runtime.stackSave();
                    cArgs[i] = converter(args[i])
                } else {
                    cArgs[i] = args[i]
                }
            }
        }
        var ret = func.apply(null, cArgs);
        if (returnType === "string") ret = Pointer_stringify(ret);
        if (stack !== 0) {
            if (opts && opts.async) {
                EmterpreterAsync.asyncFinalizers.push((function() {
                    Runtime.stackRestore(stack)
                }));
                return
            }
            Runtime.stackRestore(stack)
        }
        return ret
    };
    var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;

    function parseJSFunc(jsfunc) {
        var parsed = jsfunc.toString().match(sourceRegex).slice(1);
        return {
            arguments: parsed[0],
            body: parsed[1],
            returnValue: parsed[2]
        }
    }
    var JSsource = null;

    function ensureJSsource() {
        if (!JSsource) {
            JSsource = {};
            for (var fun in JSfuncs) {
                if (JSfuncs.hasOwnProperty(fun)) {
                    JSsource[fun] = parseJSFunc(JSfuncs[fun])
                }
            }
        }
    }
    cwrap = function cwrap(ident, returnType, argTypes) {
        argTypes = argTypes || [];
        var cfunc = getCFunc(ident);
        var numericArgs = argTypes.every((function(type) {
            return type === "number"
        }));
        var numericRet = returnType !== "string";
        if (numericRet && numericArgs) {
            return cfunc
        }
        var argNames = argTypes.map((function(x, i) {
            return "$" + i
        }));
        var funcstr = "(function(" + argNames.join(",") + ") {";
        var nargs = argTypes.length;
        if (!numericArgs) {
            ensureJSsource();
            funcstr += "var stack = " + JSsource["stackSave"].body + ";";
            for (var i = 0; i < nargs; i++) {
                var arg = argNames[i],
                    type = argTypes[i];
                if (type === "number") continue;
                var convertCode = JSsource[type + "ToC"];
                funcstr += "var " + convertCode.arguments + " = " + arg + ";";
                funcstr += convertCode.body + ";";
                funcstr += arg + "=(" + convertCode.returnValue + ");"
            }
        }
        var cfuncname = parseJSFunc((function() {
            return cfunc
        })).returnValue;
        funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
        if (!numericRet) {
            var strgfy = parseJSFunc((function() {
                return Pointer_stringify
            })).returnValue;
            funcstr += "ret = " + strgfy + "(ret);"
        }
        if (!numericArgs) {
            ensureJSsource();
            funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";"
        }
        funcstr += "return ret})";
        return eval(funcstr)
    }
}))();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;

function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            HEAP8[ptr >> 0] = value;
            break;
        case "i8":
            HEAP8[ptr >> 0] = value;
            break;
        case "i16":
            HEAP16[ptr >> 1] = value;
            break;
        case "i32":
            HEAP32[ptr >> 2] = value;
            break;
        case "i64":
            tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min(+Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
            break;
        case "float":
            HEAPF32[ptr >> 2] = value;
            break;
        case "double":
            HEAPF64[ptr >> 3] = value;
            break;
        default:
            abort("invalid type for setValue: " + type)
    }
}
Module["setValue"] = setValue;

function getValue(ptr, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            return HEAP8[ptr >> 0];
        case "i8":
            return HEAP8[ptr >> 0];
        case "i16":
            return HEAP16[ptr >> 1];
        case "i32":
            return HEAP32[ptr >> 2];
        case "i64":
            return HEAP32[ptr >> 2];
        case "float":
            return HEAPF32[ptr >> 2];
        case "double":
            return HEAPF64[ptr >> 3];
        default:
            abort("invalid type for setValue: " + type)
    }
    return null
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;

function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab === "number") {
        zeroinit = true;
        size = slab
    } else {
        zeroinit = false;
        size = slab.length
    }
    var singleType = typeof types === "string" ? types : null;
    var ret;
    if (allocator == ALLOC_NONE) {
        ret = ptr
    } else {
        ret = [typeof _malloc === "function" ? _malloc : Runtime.staticAlloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length))
    }
    if (zeroinit) {
        var ptr = ret,
            stop;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);
        for (; ptr < stop; ptr += 4) {
            HEAP32[ptr >> 2] = 0
        }
        stop = ret + size;
        while (ptr < stop) {
            HEAP8[ptr++ >> 0] = 0
        }
        return ret
    }
    if (singleType === "i8") {
        if (slab.subarray || slab.slice) {
            HEAPU8.set(slab, ret)
        } else {
            HEAPU8.set(new Uint8Array(slab), ret)
        }
        return ret
    }
    var i = 0,
        type, typeSize, previousType;
    while (i < size) {
        var curr = slab[i];
        if (typeof curr === "function") {
            curr = Runtime.getFunctionIndex(curr)
        }
        type = singleType || types[i];
        if (type === 0) {
            i++;
            continue
        }
        if (type == "i64") type = "i32";
        setValue(ret + i, curr, type);
        if (previousType !== type) {
            typeSize = Runtime.getNativeTypeSize(type);
            previousType = type
        }
        i += typeSize
    }
    return ret
}
Module["allocate"] = allocate;

function getMemory(size) {
    if (!staticSealed) return Runtime.staticAlloc(size);
    if (!runtimeInitialized) return Runtime.dynamicAlloc(size);
    return _malloc(size)
}
Module["getMemory"] = getMemory;

function Pointer_stringify(ptr, length) {
    if (length === 0 || !ptr) return "";
    var hasUtf = 0;
    var t;
    var i = 0;
    while (1) {
        t = HEAPU8[ptr + i >> 0];
        hasUtf |= t;
        if (t == 0 && !length) break;
        i++;
        if (length && i == length) break
    }
    if (!length) length = i;
    var ret = "";
    if (hasUtf < 128) {
        var MAX_CHUNK = 1024;
        var curr;
        while (length > 0) {
            curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
            ret = ret ? ret + curr : curr;
            ptr += MAX_CHUNK;
            length -= MAX_CHUNK
        }
        return ret
    }
    return Module["UTF8ToString"](ptr)
}
Module["Pointer_stringify"] = Pointer_stringify;

function AsciiToString(ptr) {
    var str = "";
    while (1) {
        var ch = HEAP8[ptr++ >> 0];
        if (!ch) return str;
        str += String.fromCharCode(ch)
    }
}
Module["AsciiToString"] = AsciiToString;

function stringToAscii(str, outPtr) {
    return writeAsciiToMemory(str, outPtr, false)
}
Module["stringToAscii"] = stringToAscii;
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(u8Array, idx) {
    var endPtr = idx;
    while (u8Array[endPtr]) ++endPtr;
    if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
    } else {
        var u0, u1, u2, u3, u4, u5;
        var str = "";
        while (1) {
            u0 = u8Array[idx++];
            if (!u0) return str;
            if (!(u0 & 128)) {
                str += String.fromCharCode(u0);
                continue
            }
            u1 = u8Array[idx++] & 63;
            if ((u0 & 224) == 192) {
                str += String.fromCharCode((u0 & 31) << 6 | u1);
                continue
            }
            u2 = u8Array[idx++] & 63;
            if ((u0 & 240) == 224) {
                u0 = (u0 & 15) << 12 | u1 << 6 | u2
            } else {
                u3 = u8Array[idx++] & 63;
                if ((u0 & 248) == 240) {
                    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3
                } else {
                    u4 = u8Array[idx++] & 63;
                    if ((u0 & 252) == 248) {
                        u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4
                    } else {
                        u5 = u8Array[idx++] & 63;
                        u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5
                    }
                }
            }
            if (u0 < 65536) {
                str += String.fromCharCode(u0)
            } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
            }
        }
    }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;

function UTF8ToString(ptr) {
    return UTF8ArrayToString(HEAPU8, ptr)
}
Module["UTF8ToString"] = UTF8ToString;

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            outU8Array[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            outU8Array[outIdx++] = 192 | u >> 6;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            outU8Array[outIdx++] = 224 | u >> 12;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 2097151) {
            if (outIdx + 3 >= endIdx) break;
            outU8Array[outIdx++] = 240 | u >> 18;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 67108863) {
            if (outIdx + 4 >= endIdx) break;
            outU8Array[outIdx++] = 248 | u >> 24;
            outU8Array[outIdx++] = 128 | u >> 18 & 63;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 5 >= endIdx) break;
            outU8Array[outIdx++] = 252 | u >> 30;
            outU8Array[outIdx++] = 128 | u >> 24 & 63;
            outU8Array[outIdx++] = 128 | u >> 18 & 63;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        }
    }
    outU8Array[outIdx] = 0;
    return outIdx - startIdx
}
Module["stringToUTF8Array"] = stringToUTF8Array;

function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}
Module["stringToUTF8"] = stringToUTF8;

function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127) {
            ++len
        } else if (u <= 2047) {
            len += 2
        } else if (u <= 65535) {
            len += 3
        } else if (u <= 2097151) {
            len += 4
        } else if (u <= 67108863) {
            len += 5
        } else {
            len += 6
        }
    }
    return len
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;

function demangle(func) {
    var __cxa_demangle_func = Module["___cxa_demangle"] || Module["__cxa_demangle"];
    if (__cxa_demangle_func) {
        try {
            var s = func.substr(1);
            var len = lengthBytesUTF8(s) + 1;
            var buf = _malloc(len);
            stringToUTF8(s, buf, len);
            var status = _malloc(4);
            var ret = __cxa_demangle_func(buf, 0, 0, status);
            if (getValue(status, "i32") === 0 && ret) {
                return Pointer_stringify(ret)
            }
        } catch (e) {} finally {
            if (buf) _free(buf);
            if (status) _free(status);
            if (ret) _free(ret)
        }
        return func
    }
    Runtime.warnOnce("warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
    return func
}

function demangleAll(text) {
    var regex = /__Z[\w\d_]+/g;
    return text.replace(regex, (function(x) {
        var y = demangle(x);
        return x === y ? x : x + " [" + y + "]"
    }))
}

function jsStackTrace() {
    var err = new Error;
    if (!err.stack) {
        try {
            throw new Error(0)
        } catch (e) {
            err = e
        }
        if (!err.stack) {
            return "(no stack trace available)"
        }
    }
    return err.stack.toString()
}

function stackTrace() {
    var js = jsStackTrace();
    if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
    return demangleAll(js)
}
Module["stackTrace"] = stackTrace;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;
var MIN_TOTAL_MEMORY = 16777216;

function alignUp(x, multiple) {
    if (x % multiple > 0) {
        x += multiple - x % multiple
    }
    return x
}
var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBuffer(buf) {
    Module["buffer"] = buffer = buf
}

function updateGlobalBufferViews() {
    Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
    Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
    Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer)
}
var STATIC_BASE, STATICTOP, staticSealed;
var STACK_BASE, STACKTOP, STACK_MAX;
var DYNAMIC_BASE, DYNAMICTOP_PTR;
STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
staticSealed = false;

function abortOnCannotGrowMemory() {
    abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ")
}
if (!Module["reallocBuffer"]) Module["reallocBuffer"] = (function(size) {
    var ret;
    try {
        if (ArrayBuffer.transfer) {
            ret = ArrayBuffer.transfer(buffer, size)
        } else {
            var oldHEAP8 = HEAP8;
            ret = new ArrayBuffer(size);
            var temp = new Int8Array(ret);
            temp.set(oldHEAP8)
        }
    } catch (e) {
        return false
    }
    var success = _emscripten_replace_memory(ret);
    if (!success) return false;
    return ret
});

function enlargeMemory() {
    var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE;
    var LIMIT = 2147483648 - PAGE_MULTIPLE;
    if (HEAP32[DYNAMICTOP_PTR >> 2] > LIMIT) {
        return false
    }
    var OLD_TOTAL_MEMORY = TOTAL_MEMORY;
    TOTAL_MEMORY = Math.max(TOTAL_MEMORY, MIN_TOTAL_MEMORY);
    while (TOTAL_MEMORY < HEAP32[DYNAMICTOP_PTR >> 2]) {
        if (TOTAL_MEMORY <= 536870912) {
            TOTAL_MEMORY = alignUp(2 * TOTAL_MEMORY, PAGE_MULTIPLE)
        } else {
            TOTAL_MEMORY = Math.min(alignUp((3 * TOTAL_MEMORY + 2147483648) / 4, PAGE_MULTIPLE), LIMIT)
        }
    }
    var replacement = Module["reallocBuffer"](TOTAL_MEMORY);
    if (!replacement || replacement.byteLength != TOTAL_MEMORY) {
        TOTAL_MEMORY = OLD_TOTAL_MEMORY;
        return false
    }
    updateGlobalBuffer(replacement);
    updateGlobalBufferViews();
    return true
}
var byteLength;
try {
    byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get);
    byteLength(new ArrayBuffer(4))
} catch (e) {
    byteLength = (function(buffer) {
        return buffer.byteLength
    })
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 134217728;
if (TOTAL_MEMORY < TOTAL_STACK) Module.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");
if (Module["buffer"]) {
    buffer = Module["buffer"]
} else {
    if (typeof WebAssembly === "object" && typeof WebAssembly.Memory === "function") {
        Module["wasmMemory"] = new WebAssembly.Memory({
            "initial": TOTAL_MEMORY / WASM_PAGE_SIZE
        });
        buffer = Module["wasmMemory"].buffer
    } else {
        buffer = new ArrayBuffer(TOTAL_MEMORY)
    }
}
updateGlobalBufferViews();

function getTotalMemory() {
    return TOTAL_MEMORY
}
HEAP32[0] = 1668509029;
HEAP16[1] = 25459;
if (HEAPU8[2] !== 115 || HEAPU8[3] !== 99) throw "Runtime error: expected the system to be little-endian!";
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback();
            continue
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                Module["dynCall_v"](func)
            } else {
                Module["dynCall_vi"](func, callback.arg)
            }
        } else {
            func(callback.arg === undefined ? null : callback.arg)
        }
    }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;

function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}

function ensureInitRuntime() {
    if (runtimeInitialized) return;
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__)
}

function preMain() {
    callRuntimeCallbacks(__ATMAIN__)
}

function exitRuntime() {
    callRuntimeCallbacks(__ATEXIT__);
    runtimeExited = true
}

function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}

function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}
Module["addOnPreRun"] = addOnPreRun;

function addOnInit(cb) {
    __ATINIT__.unshift(cb)
}
Module["addOnInit"] = addOnInit;

function addOnPreMain(cb) {
    __ATMAIN__.unshift(cb)
}
Module["addOnPreMain"] = addOnPreMain;

function addOnExit(cb) {
    __ATEXIT__.unshift(cb)
}
Module["addOnExit"] = addOnExit;

function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
Module["addOnPostRun"] = addOnPostRun;

function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array
}
Module["intArrayFromString"] = intArrayFromString;

function intArrayToString(array) {
    var ret = [];
    for (var i = 0; i < array.length; i++) {
        var chr = array[i];
        if (chr > 255) {
            chr &= 255
        }
        ret.push(String.fromCharCode(chr))
    }
    return ret.join("")
}
Module["intArrayToString"] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
    Runtime.warnOnce("writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!");
    var lastChar, end;
    if (dontAddNull) {
        end = buffer + lengthBytesUTF8(string);
        lastChar = HEAP8[end]
    }
    stringToUTF8(string, buffer, Infinity);
    if (dontAddNull) HEAP8[end] = lastChar
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer)
}
Module["writeArrayToMemory"] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++ >> 0] = str.charCodeAt(i)
    }
    if (!dontAddNull) HEAP8[buffer >> 0] = 0
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
    var ah = a >>> 16;
    var al = a & 65535;
    var bh = b >>> 16;
    var bl = b & 65535;
    return al * bl + (ah * bl + al * bh << 16) | 0
};
Math.imul = Math["imul"];
if (!Math["fround"]) {
    var froundBuffer = new Float32Array(1);
    Math["fround"] = (function(x) {
        froundBuffer[0] = x;
        return froundBuffer[0]
    })
}
Math.fround = Math["fround"];
if (!Math["clz32"]) Math["clz32"] = (function(x) {
    x = x >>> 0;
    for (var i = 0; i < 32; i++) {
        if (x & 1 << 31 - i) return i
    }
    return 32
});
Math.clz32 = Math["clz32"];
if (!Math["trunc"]) Math["trunc"] = (function(x) {
    return x < 0 ? Math.ceil(x) : Math.floor(x)
});
Math.trunc = Math["trunc"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;

function getUniqueRunDependency(id) {
    return id
}

function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
}
Module["addRunDependency"] = addRunDependency;

function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;

function integrateWasmJS(Module) {
    var method = Module["wasmJSMethod"] || "native-wasm";
    Module["wasmJSMethod"] = method;
    var wasmTextFile = Module["wasmTextFile"] || "cv-wasm.wast";
    var wasmBinaryFile = Module["wasmBinaryFile"] || "cv-wasm.wasm";
    var asmjsCodeFile = Module["asmjsCodeFile"] || "cv-wasm.temp.asm.js";
    if (typeof Module["locateFile"] === "function") {
        wasmTextFile = Module["locateFile"](wasmTextFile);
        wasmBinaryFile = Module["locateFile"](wasmBinaryFile);
        asmjsCodeFile = Module["locateFile"](asmjsCodeFile)
    }
    var wasmPageSize = 64 * 1024;
    var asm2wasmImports = {
        "f64-rem": (function(x, y) {
            return x % y
        }),
        "f64-to-int": (function(x) {
            return x | 0
        }),
        "i32s-div": (function(x, y) {
            return (x | 0) / (y | 0) | 0
        }),
        "i32u-div": (function(x, y) {
            return (x >>> 0) / (y >>> 0) >>> 0
        }),
        "i32s-rem": (function(x, y) {
            return (x | 0) % (y | 0) | 0
        }),
        "i32u-rem": (function(x, y) {
            return (x >>> 0) % (y >>> 0) >>> 0
        }),
        "debugger": (function() {
            debugger
        })
    };
    var info = {
        "global": null,
        "env": null,
        "asm2wasm": asm2wasmImports,
        "parent": Module
    };
    var exports = null;

    function lookupImport(mod, base) {
        var lookup = info;
        if (mod.indexOf(".") < 0) {
            lookup = (lookup || {})[mod]
        } else {
            var parts = mod.split(".");
            lookup = (lookup || {})[parts[0]];
            lookup = (lookup || {})[parts[1]]
        }
        if (base) {
            lookup = (lookup || {})[base]
        }
        if (lookup === undefined) {
            abort("bad lookupImport to (" + mod + ")." + base)
        }
        return lookup
    }

    function mergeMemory(newBuffer) {
        var oldBuffer = Module["buffer"];
        if (newBuffer.byteLength < oldBuffer.byteLength) {
            Module["printErr"]("the new buffer in mergeMemory is smaller than the previous one. in native wasm, we should grow memory here")
        }
        var oldView = new Int8Array(oldBuffer);
        var newView = new Int8Array(newBuffer);
        if (!memoryInitializer) {
            oldView.set(newView.subarray(Module["STATIC_BASE"], Module["STATIC_BASE"] + Module["STATIC_BUMP"]), Module["STATIC_BASE"])
        }
        newView.set(oldView);
        updateGlobalBuffer(newBuffer);
        updateGlobalBufferViews()
    }
    var WasmTypes = {
        none: 0,
        i32: 1,
        i64: 2,
        f32: 3,
        f64: 4
    };

    function fixImports(imports) {
        if (!0) return imports;
        var ret = {};
        for (var i in imports) {
            var fixed = i;
            if (fixed[0] == "_") fixed = fixed.substr(1);
            ret[fixed] = imports[i]
        }
        return ret
    }

    function getBinary() {
        var binary;
        if (Module["wasmBinary"]) {
            binary = Module["wasmBinary"];
            binary = new Uint8Array(binary)
        } else if (Module["readBinary"]) {
            binary = Module["readBinary"](wasmBinaryFile)
        } else {
            throw "on the web, we need the wasm binary to be preloaded and set on Module['wasmBinary']. emcc.py will do that for you when generating HTML (but not JS)"
        }
        return binary
    }

    function getBinaryPromise() {
        if (!Module["wasmBinary"] && typeof fetch === "function") {
            return fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then((function(response) {
                if (!response["ok"]) {
                    throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
                }
                return response["arrayBuffer"]()
            }))
        }
        return new Promise((function(resolve, reject) {
            resolve(getBinary())
        }))
    }

    function doJustAsm(global, env, providedBuffer) {
        if (typeof Module["asm"] !== "function" || Module["asm"] === methodHandler) {
            if (!Module["asmPreload"]) {
                eval(Module["read"](asmjsCodeFile))
            } else {
                Module["asm"] = Module["asmPreload"]
            }
        }
        if (typeof Module["asm"] !== "function") {
            Module["printErr"]("asm evalling did not set the module properly");
            return false
        }
        return Module["asm"](global, env, providedBuffer)
    }

    function doNativeWasm(global, env, providedBuffer) {
        if (typeof WebAssembly !== "object") {
            Module["printErr"]("no native wasm support detected");
            return false
        }
        if (!(Module["wasmMemory"] instanceof WebAssembly.Memory)) {
            Module["printErr"]("no native wasm Memory in use");
            return false
        }
        env["memory"] = Module["wasmMemory"];
        info["global"] = {
            "NaN": NaN,
            "Infinity": Infinity
        };
        info["global.Math"] = global.Math;
        info["env"] = env;

        function receiveInstance(instance) {
            exports = instance.exports;
            if (exports.memory) mergeMemory(exports.memory);
            Module["asm"] = exports;
            Module["usingWasm"] = true;
            removeRunDependency("wasm-instantiate")
        }
        addRunDependency("wasm-instantiate");
        if (Module["instantiateWasm"]) {
            try {
                return Module["instantiateWasm"](info, receiveInstance)
            } catch (e) {
                Module["printErr"]("Module.instantiateWasm callback failed with error: " + e);
                return false
            }
        }
        getBinaryPromise().then((function(binary) {
            return WebAssembly.instantiate(binary, info)
        })).then((function(output) {
            receiveInstance(output["instance"])
        })).catch((function(reason) {
            Module["printErr"]("failed to asynchronously prepare wasm: " + reason);
            Module["quit"](1, reason)
        }));
        return {}
    }

    function doWasmPolyfill(global, env, providedBuffer, method) {
        if (typeof WasmJS !== "function") {
            Module["printErr"]("WasmJS not detected - polyfill not bundled?");
            return false
        }
        var wasmJS = WasmJS({});
        wasmJS["outside"] = Module;
        wasmJS["info"] = info;
        wasmJS["lookupImport"] = lookupImport;
        assert(providedBuffer === Module["buffer"]);
        info.global = global;
        info.env = env;
        assert(providedBuffer === Module["buffer"]);
        env["memory"] = providedBuffer;
        assert(env["memory"] instanceof ArrayBuffer);
        wasmJS["providedTotalMemory"] = Module["buffer"].byteLength;
        var code;
        if (method === "interpret-binary") {
            code = getBinary()
        } else {
            code = Module["read"](method == "interpret-asm2wasm" ? asmjsCodeFile : wasmTextFile)
        }
        var temp;
        if (method == "interpret-asm2wasm") {
            temp = wasmJS["_malloc"](code.length + 1);
            wasmJS["writeAsciiToMemory"](code, temp);
            wasmJS["_load_asm2wasm"](temp)
        } else if (method === "interpret-s-expr") {
            temp = wasmJS["_malloc"](code.length + 1);
            wasmJS["writeAsciiToMemory"](code, temp);
            wasmJS["_load_s_expr2wasm"](temp)
        } else if (method === "interpret-binary") {
            temp = wasmJS["_malloc"](code.length);
            wasmJS["HEAPU8"].set(code, temp);
            wasmJS["_load_binary2wasm"](temp, code.length)
        } else {
            throw "what? " + method
        }
        wasmJS["_free"](temp);
        wasmJS["_instantiate"](temp);
        if (Module["newBuffer"]) {
            mergeMemory(Module["newBuffer"]);
            Module["newBuffer"] = null
        }
        exports = wasmJS["asmExports"];
        return exports
    }
    Module["asmPreload"] = Module["asm"];
    var asmjsReallocBuffer = Module["reallocBuffer"];
    var wasmReallocBuffer = (function(size) {
        var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE;
        size = alignUp(size, PAGE_MULTIPLE);
        var old = Module["buffer"];
        var oldSize = old.byteLength;
        if (Module["usingWasm"]) {
            try {
                var result = Module["wasmMemory"].grow((size - oldSize) / wasmPageSize);
                if (result !== (-1 | 0)) {
                    return Module["buffer"] = Module["wasmMemory"].buffer
                } else {
                    return null
                }
            } catch (e) {
                return null
            }
        } else {
            exports["__growWasmMemory"]((size - oldSize) / wasmPageSize);
            return Module["buffer"] !== old ? Module["buffer"] : null
        }
    });
    Module["reallocBuffer"] = (function(size) {
        if (finalMethod === "asmjs") {
            return asmjsReallocBuffer(size)
        } else {
            return wasmReallocBuffer(size)
        }
    });
    var finalMethod = "";
    Module["asm"] = (function(global, env, providedBuffer) {
        global = fixImports(global);
        env = fixImports(env);
        if (!env["table"]) {
            var TABLE_SIZE = Module["wasmTableSize"];
            if (TABLE_SIZE === undefined) TABLE_SIZE = 1024;
            var MAX_TABLE_SIZE = Module["wasmMaxTableSize"];
            if (typeof WebAssembly === "object" && typeof WebAssembly.Table === "function") {
                if (MAX_TABLE_SIZE !== undefined) {
                    env["table"] = new WebAssembly.Table({
                        "initial": TABLE_SIZE,
                        "maximum": MAX_TABLE_SIZE,
                        "element": "anyfunc"
                    })
                } else {
                    env["table"] = new WebAssembly.Table({
                        "initial": TABLE_SIZE,
                        element: "anyfunc"
                    })
                }
            } else {
                env["table"] = new Array(TABLE_SIZE)
            }
            Module["wasmTable"] = env["table"]
        }
        if (!env["memoryBase"]) {
            env["memoryBase"] = Module["STATIC_BASE"]
        }
        if (!env["tableBase"]) {
            env["tableBase"] = 0
        }
        var exports;
        var methods = method.split(",");
        for (var i = 0; i < methods.length; i++) {
            var curr = methods[i];
            finalMethod = curr;
            if (curr === "native-wasm") {
                if (exports = doNativeWasm(global, env, providedBuffer)) break
            } else if (curr === "asmjs") {
                if (exports = doJustAsm(global, env, providedBuffer)) break
            } else if (curr === "interpret-asm2wasm" || curr === "interpret-s-expr" || curr === "interpret-binary") {
                if (exports = doWasmPolyfill(global, env, providedBuffer, curr)) break
            } else {
                throw "bad method: " + curr
            }
        }
        if (!exports) throw "no binaryen method succeeded. consider enabling more options, like interpreting, if you want that: https://github.com/kripken/emscripten/wiki/WebAssembly#binaryen-methods";
        return exports
    });
    var methodHandler = Module["asm"]
}
integrateWasmJS(Module);
var ASM_CONSTS = [];
STATIC_BASE = Runtime.GLOBAL_BASE;
STATICTOP = STATIC_BASE + 1009888;
__ATINIT__.push({
    func: (function() {
        __GLOBAL__I_000101()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_persistence_cpp()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_iostream_cpp()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_bind_cpp()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_haar_cpp()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_hog_cpp()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_38()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_37()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_36()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_knearest_cpp()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_loadsave_cpp()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_imgwarp_cpp()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_histogram_cpp()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_1428()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_umatrix_cpp()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_system_cpp()
    })
}, {
    func: (function() {
        __GLOBAL__sub_I_bindings_cpp()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_1436()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_1435()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_1434()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_1433()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_1432()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_1431()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_1430()
    })
}, {
    func: (function() {
        ___cxx_global_var_init_1429()
    })
});
memoryInitializer = Module["wasmJSMethod"].indexOf("asmjs") >= 0 || Module["wasmJSMethod"].indexOf("interpret-asm2wasm") >= 0 ? "cv-wasm.js.mem" : null;
var STATIC_BUMP = 1009888;
Module["STATIC_BASE"] = STATIC_BASE;
Module["STATIC_BUMP"] = STATIC_BUMP;
var tempDoublePtr = STATICTOP;
STATICTOP += 16;

function _atexit(func, arg) {
    __ATEXIT__.unshift({
        func: func,
        arg: arg
    })
}

function ___cxa_atexit() {
    return _atexit.apply(null, arguments)
}
var emval_symbols = {};

function embind_init_charCodes() {
    var codes = new Array(256);
    for (var i = 0; i < 256; ++i) {
        codes[i] = String.fromCharCode(i)
    }
    embind_charCodes = codes
}
var embind_charCodes = undefined;

function readLatin1String(ptr) {
    var ret = "";
    var c = ptr;
    while (HEAPU8[c]) {
        ret += embind_charCodes[HEAPU8[c++]]
    }
    return ret
}

function getStringOrSymbol(address) {
    var symbol = emval_symbols[address];
    if (symbol === undefined) {
        return readLatin1String(address)
    } else {
        return symbol
    }
}
var emval_free_list = [];
var emval_handle_array = [{}, {
    value: undefined
}, {
    value: null
}, {
    value: true
}, {
    value: false
}];

function count_emval_handles() {
    var count = 0;
    for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
            ++count
        }
    }
    return count
}

function get_first_emval() {
    for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
            return emval_handle_array[i]
        }
    }
    return null
}

function init_emval() {
    Module["count_emval_handles"] = count_emval_handles;
    Module["get_first_emval"] = get_first_emval
}

function __emval_register(value) {
    switch (value) {
        case undefined:
            {
                return 1
            };
        case null:
            {
                return 2
            };
        case true:
            {
                return 3
            };
        case false:
            {
                return 4
            };
        default:
            {
                var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
                emval_handle_array[handle] = {
                    refcount: 1,
                    value: value
                };
                return handle
            }
    }
}

function __emval_new_cstring(v) {
    return __emval_register(getStringOrSymbol(v))
}

function __ZSt18uncaught_exceptionv() {
    return !!__ZSt18uncaught_exceptionv.uncaught_exception
}
var EXCEPTIONS = {
    last: 0,
    caught: [],
    infos: {},
    deAdjust: (function(adjusted) {
        if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
        for (var ptr in EXCEPTIONS.infos) {
            var info = EXCEPTIONS.infos[ptr];
            if (info.adjusted === adjusted) {
                return ptr
            }
        }
        return adjusted
    }),
    addRef: (function(ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount++
    }),
    decRef: (function(ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        assert(info.refcount > 0);
        info.refcount--;
        if (info.refcount === 0 && !info.rethrown) {
            if (info.destructor) {
                Module["dynCall_vi"](info.destructor, ptr)
            }
            delete EXCEPTIONS.infos[ptr];
            ___cxa_free_exception(ptr)
        }
    }),
    clearRef: (function(ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount = 0
    })
};

function ___resumeException(ptr) {
    if (!EXCEPTIONS.last) {
        EXCEPTIONS.last = ptr
    }
    throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch."
}

function ___cxa_find_matching_catch() {
    var thrown = EXCEPTIONS.last;
    if (!thrown) {
        return (Runtime.setTempRet0(0), 0) | 0
    }
    var info = EXCEPTIONS.infos[thrown];
    var throwntype = info.type;
    if (!throwntype) {
        return (Runtime.setTempRet0(0), thrown) | 0
    }
    var typeArray = Array.prototype.slice.call(arguments);
    var pointer = Module["___cxa_is_pointer_type"](throwntype);
    if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
    HEAP32[___cxa_find_matching_catch.buffer >> 2] = thrown;
    thrown = ___cxa_find_matching_catch.buffer;
    for (var i = 0; i < typeArray.length; i++) {
        if (typeArray[i] && Module["___cxa_can_catch"](typeArray[i], throwntype, thrown)) {
            thrown = HEAP32[thrown >> 2];
            info.adjusted = thrown;
            return (Runtime.setTempRet0(typeArray[i]), thrown) | 0
        }
    }
    thrown = HEAP32[thrown >> 2];
    return (Runtime.setTempRet0(throwntype), thrown) | 0
}

function ___cxa_throw(ptr, type, destructor) {
    EXCEPTIONS.infos[ptr] = {
        ptr: ptr,
        adjusted: ptr,
        type: type,
        destructor: destructor,
        refcount: 0,
        caught: false,
        rethrown: false
    };
    EXCEPTIONS.last = ptr;
    if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1
    } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++
    }
    throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch."
}
Module["_pthread_mutex_unlock"] = _pthread_mutex_unlock;
Module["_pthread_mutex_lock"] = _pthread_mutex_lock;

function _free() {}
Module["_free"] = _free;

function _malloc(bytes) {
    var ptr = Runtime.dynamicAlloc(bytes + 8);
    return ptr + 8 & 4294967288
}
Module["_malloc"] = _malloc;
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var char_0 = 48;
var char_9 = 57;

function makeLegalFunctionName(name) {
    if (undefined === name) {
        return "_unknown"
    }
    name = name.replace(/[^a-zA-Z0-9_]/g, "$");
    var f = name.charCodeAt(0);
    if (f >= char_0 && f <= char_9) {
        return "_" + name
    } else {
        return name
    }
}

function createNamedFunction(name, body) {
    name = makeLegalFunctionName(name);
    return (new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n"))(body)
}

function extendError(baseErrorType, errorName) {
    var errorClass = createNamedFunction(errorName, (function(message) {
        this.name = errorName;
        this.message = message;
        var stack = (new Error(message)).stack;
        if (stack !== undefined) {
            this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "")
        }
    }));
    errorClass.prototype = Object.create(baseErrorType.prototype);
    errorClass.prototype.constructor = errorClass;
    errorClass.prototype.toString = (function() {
        if (this.message === undefined) {
            return this.name
        } else {
            return this.name + ": " + this.message
        }
    });
    return errorClass
}
var BindingError = undefined;

function throwBindingError(message) {
    throw new BindingError(message)
}
var InternalError = undefined;

function throwInternalError(message) {
    throw new InternalError(message)
}

function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
    myTypes.forEach((function(type) {
        typeDependencies[type] = dependentTypes
    }));

    function onComplete(typeConverters) {
        var myTypeConverters = getTypeConverters(typeConverters);
        if (myTypeConverters.length !== myTypes.length) {
            throwInternalError("Mismatched type converter count")
        }
        for (var i = 0; i < myTypes.length; ++i) {
            registerType(myTypes[i], myTypeConverters[i])
        }
    }
    var typeConverters = new Array(dependentTypes.length);
    var unregisteredTypes = [];
    var registered = 0;
    dependentTypes.forEach((function(dt, i) {
        if (registeredTypes.hasOwnProperty(dt)) {
            typeConverters[i] = registeredTypes[dt]
        } else {
            unregisteredTypes.push(dt);
            if (!awaitingDependencies.hasOwnProperty(dt)) {
                awaitingDependencies[dt] = []
            }
            awaitingDependencies[dt].push((function() {
                typeConverters[i] = registeredTypes[dt];
                ++registered;
                if (registered === unregisteredTypes.length) {
                    onComplete(typeConverters)
                }
            }))
        }
    }));
    if (0 === unregisteredTypes.length) {
        onComplete(typeConverters)
    }
}

function registerType(rawType, registeredInstance, options) {
    options = options || {};
    if (!("argPackAdvance" in registeredInstance)) {
        throw new TypeError("registerType registeredInstance requires argPackAdvance")
    }
    var name = registeredInstance.name;
    if (!rawType) {
        throwBindingError('type "' + name + '" must have a positive integer typeid pointer')
    }
    if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
            return
        } else {
            throwBindingError("Cannot register type '" + name + "' twice")
        }
    }
    registeredTypes[rawType] = registeredInstance;
    delete typeDependencies[rawType];
    if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach((function(cb) {
            cb()
        }))
    }
}

function simpleReadValueFromPointer(pointer) {
    return this["fromWireType"](HEAPU32[pointer >> 2])
}

function __embind_register_std_string(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": (function(value) {
            var length = HEAPU32[value >> 2];
            var a = new Array(length);
            for (var i = 0; i < length; ++i) {
                a[i] = String.fromCharCode(HEAPU8[value + 4 + i])
            }
            _free(value);
            return a.join("")
        }),
        "toWireType": (function(destructors, value) {
            if (value instanceof ArrayBuffer) {
                value = new Uint8Array(value)
            }

            function getTAElement(ta, index) {
                return ta[index]
            }

            function getStringElement(string, index) {
                return string.charCodeAt(index)
            }
            var getElement;
            if (value instanceof Uint8Array) {
                getElement = getTAElement
            } else if (value instanceof Uint8ClampedArray) {
                getElement = getTAElement
            } else if (value instanceof Int8Array) {
                getElement = getTAElement
            } else if (typeof value === "string") {
                getElement = getStringElement
            } else {
                throwBindingError("Cannot pass non-string to std::string")
            }
            var length = value.length;
            var ptr = _malloc(4 + length);
            HEAPU32[ptr >> 2] = length;
            for (var i = 0; i < length; ++i) {
                var charCode = getElement(value, i);
                if (charCode > 255) {
                    _free(ptr);
                    throwBindingError("String has UTF-16 code units that do not fit in 8 bits")
                }
                HEAPU8[ptr + 4 + i] = charCode
            }
            if (destructors !== null) {
                destructors.push(_free, ptr)
            }
            return ptr
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": simpleReadValueFromPointer,
        destructorFunction: (function(ptr) {
            _free(ptr)
        })
    })
}

function __embind_register_std_wstring(rawType, charSize, name) {
    name = readLatin1String(name);
    var getHeap, shift;
    if (charSize === 2) {
        getHeap = (function() {
            return HEAPU16
        });
        shift = 1
    } else if (charSize === 4) {
        getHeap = (function() {
            return HEAPU32
        });
        shift = 2
    }
    registerType(rawType, {
        name: name,
        "fromWireType": (function(value) {
            var HEAP = getHeap();
            var length = HEAPU32[value >> 2];
            var a = new Array(length);
            var start = value + 4 >> shift;
            for (var i = 0; i < length; ++i) {
                a[i] = String.fromCharCode(HEAP[start + i])
            }
            _free(value);
            return a.join("")
        }),
        "toWireType": (function(destructors, value) {
            var HEAP = getHeap();
            var length = value.length;
            var ptr = _malloc(4 + length * charSize);
            HEAPU32[ptr >> 2] = length;
            var start = ptr + 4 >> shift;
            for (var i = 0; i < length; ++i) {
                HEAP[start + i] = value.charCodeAt(i)
            }
            if (destructors !== null) {
                destructors.push(_free, ptr)
            }
            return ptr
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": simpleReadValueFromPointer,
        destructorFunction: (function(ptr) {
            _free(ptr)
        })
    })
}

function _pthread_mutex_init() {}

function __emval_decref(handle) {
    if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
        emval_handle_array[handle] = undefined;
        emval_free_list.push(handle)
    }
}
var structRegistrations = {};

function runDestructors(destructors) {
    while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr)
    }
}

function __embind_finalize_value_object(structType) {
    var reg = structRegistrations[structType];
    delete structRegistrations[structType];
    var rawConstructor = reg.rawConstructor;
    var rawDestructor = reg.rawDestructor;
    var fieldRecords = reg.fields;
    var fieldTypes = fieldRecords.map((function(field) {
        return field.getterReturnType
    })).concat(fieldRecords.map((function(field) {
        return field.setterArgumentType
    })));
    whenDependentTypesAreResolved([structType], fieldTypes, (function(fieldTypes) {
        var fields = {};
        fieldRecords.forEach((function(field, i) {
            var fieldName = field.fieldName;
            var getterReturnType = fieldTypes[i];
            var getter = field.getter;
            var getterContext = field.getterContext;
            var setterArgumentType = fieldTypes[i + fieldRecords.length];
            var setter = field.setter;
            var setterContext = field.setterContext;
            fields[fieldName] = {
                read: (function(ptr) {
                    return getterReturnType["fromWireType"](getter(getterContext, ptr))
                }),
                write: (function(ptr, o) {
                    var destructors = [];
                    setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
                    runDestructors(destructors)
                })
            }
        }));
        return [{
            name: reg.name,
            "fromWireType": (function(ptr) {
                var rv = {};
                for (var i in fields) {
                    rv[i] = fields[i].read(ptr)
                }
                rawDestructor(ptr);
                return rv
            }),
            "toWireType": (function(destructors, o) {
                for (var fieldName in fields) {
                    if (!(fieldName in o)) {
                        throw new TypeError("Missing field")
                    }
                }
                var ptr = rawConstructor();
                for (fieldName in fields) {
                    fields[fieldName].write(ptr, o[fieldName])
                }
                if (destructors !== null) {
                    destructors.push(rawDestructor, ptr)
                }
                return ptr
            }),
            "argPackAdvance": 8,
            "readValueFromPointer": simpleReadValueFromPointer,
            destructorFunction: rawDestructor
        }]
    }))
}
var PTHREAD_SPECIFIC = {};
var PTHREAD_SPECIFIC_NEXT_KEY = 1;
var ERRNO_CODES = {
    EPERM: 1,
    ENOENT: 2,
    ESRCH: 3,
    EINTR: 4,
    EIO: 5,
    ENXIO: 6,
    E2BIG: 7,
    ENOEXEC: 8,
    EBADF: 9,
    ECHILD: 10,
    EAGAIN: 11,
    EWOULDBLOCK: 11,
    ENOMEM: 12,
    EACCES: 13,
    EFAULT: 14,
    ENOTBLK: 15,
    EBUSY: 16,
    EEXIST: 17,
    EXDEV: 18,
    ENODEV: 19,
    ENOTDIR: 20,
    EISDIR: 21,
    EINVAL: 22,
    ENFILE: 23,
    EMFILE: 24,
    ENOTTY: 25,
    ETXTBSY: 26,
    EFBIG: 27,
    ENOSPC: 28,
    ESPIPE: 29,
    EROFS: 30,
    EMLINK: 31,
    EPIPE: 32,
    EDOM: 33,
    ERANGE: 34,
    ENOMSG: 42,
    EIDRM: 43,
    ECHRNG: 44,
    EL2NSYNC: 45,
    EL3HLT: 46,
    EL3RST: 47,
    ELNRNG: 48,
    EUNATCH: 49,
    ENOCSI: 50,
    EL2HLT: 51,
    EDEADLK: 35,
    ENOLCK: 37,
    EBADE: 52,
    EBADR: 53,
    EXFULL: 54,
    ENOANO: 55,
    EBADRQC: 56,
    EBADSLT: 57,
    EDEADLOCK: 35,
    EBFONT: 59,
    ENOSTR: 60,
    ENODATA: 61,
    ETIME: 62,
    ENOSR: 63,
    ENONET: 64,
    ENOPKG: 65,
    EREMOTE: 66,
    ENOLINK: 67,
    EADV: 68,
    ESRMNT: 69,
    ECOMM: 70,
    EPROTO: 71,
    EMULTIHOP: 72,
    EDOTDOT: 73,
    EBADMSG: 74,
    ENOTUNIQ: 76,
    EBADFD: 77,
    EREMCHG: 78,
    ELIBACC: 79,
    ELIBBAD: 80,
    ELIBSCN: 81,
    ELIBMAX: 82,
    ELIBEXEC: 83,
    ENOSYS: 38,
    ENOTEMPTY: 39,
    ENAMETOOLONG: 36,
    ELOOP: 40,
    EOPNOTSUPP: 95,
    EPFNOSUPPORT: 96,
    ECONNRESET: 104,
    ENOBUFS: 105,
    EAFNOSUPPORT: 97,
    EPROTOTYPE: 91,
    ENOTSOCK: 88,
    ENOPROTOOPT: 92,
    ESHUTDOWN: 108,
    ECONNREFUSED: 111,
    EADDRINUSE: 98,
    ECONNABORTED: 103,
    ENETUNREACH: 101,
    ENETDOWN: 100,
    ETIMEDOUT: 110,
    EHOSTDOWN: 112,
    EHOSTUNREACH: 113,
    EINPROGRESS: 115,
    EALREADY: 114,
    EDESTADDRREQ: 89,
    EMSGSIZE: 90,
    EPROTONOSUPPORT: 93,
    ESOCKTNOSUPPORT: 94,
    EADDRNOTAVAIL: 99,
    ENETRESET: 102,
    EISCONN: 106,
    ENOTCONN: 107,
    ETOOMANYREFS: 109,
    EUSERS: 87,
    EDQUOT: 122,
    ESTALE: 116,
    ENOTSUP: 95,
    ENOMEDIUM: 123,
    EILSEQ: 84,
    EOVERFLOW: 75,
    ECANCELED: 125,
    ENOTRECOVERABLE: 131,
    EOWNERDEAD: 130,
    ESTRPIPE: 86
};

function _pthread_key_create(key, destructor) {
    if (key == 0) {
        return ERRNO_CODES.EINVAL
    }
    HEAP32[key >> 2] = PTHREAD_SPECIFIC_NEXT_KEY;
    PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
    PTHREAD_SPECIFIC_NEXT_KEY++;
    return 0
}

function getTypeName(type) {
    var ptr = ___getTypeName(type);
    var rv = readLatin1String(ptr);
    _free(ptr);
    return rv
}

function requireRegisteredType(rawType, humanName) {
    var impl = registeredTypes[rawType];
    if (undefined === impl) {
        throwBindingError(humanName + " has unknown type " + getTypeName(rawType))
    }
    return impl
}

function __emval_take_value(type, argv) {
    type = requireRegisteredType(type, "_emval_take_value");
    var v = type["readValueFromPointer"](argv);
    return __emval_register(v)
}
var _llvm_pow_f32 = Math_pow;
var ERRNO_MESSAGES = {
    0: "Success",
    1: "Not super-user",
    2: "No such file or directory",
    3: "No such process",
    4: "Interrupted system call",
    5: "I/O error",
    6: "No such device or address",
    7: "Arg list too long",
    8: "Exec format error",
    9: "Bad file number",
    10: "No children",
    11: "No more processes",
    12: "Not enough core",
    13: "Permission denied",
    14: "Bad address",
    15: "Block device required",
    16: "Mount device busy",
    17: "File exists",
    18: "Cross-device link",
    19: "No such device",
    20: "Not a directory",
    21: "Is a directory",
    22: "Invalid argument",
    23: "Too many open files in system",
    24: "Too many open files",
    25: "Not a typewriter",
    26: "Text file busy",
    27: "File too large",
    28: "No space left on device",
    29: "Illegal seek",
    30: "Read only file system",
    31: "Too many links",
    32: "Broken pipe",
    33: "Math arg out of domain of func",
    34: "Math result not representable",
    35: "File locking deadlock error",
    36: "File or path name too long",
    37: "No record locks available",
    38: "Function not implemented",
    39: "Directory not empty",
    40: "Too many symbolic links",
    42: "No message of desired type",
    43: "Identifier removed",
    44: "Channel number out of range",
    45: "Level 2 not synchronized",
    46: "Level 3 halted",
    47: "Level 3 reset",
    48: "Link number out of range",
    49: "Protocol driver not attached",
    50: "No CSI structure available",
    51: "Level 2 halted",
    52: "Invalid exchange",
    53: "Invalid request descriptor",
    54: "Exchange full",
    55: "No anode",
    56: "Invalid request code",
    57: "Invalid slot",
    59: "Bad font file fmt",
    60: "Device not a stream",
    61: "No data (for no delay io)",
    62: "Timer expired",
    63: "Out of streams resources",
    64: "Machine is not on the network",
    65: "Package not installed",
    66: "The object is remote",
    67: "The link has been severed",
    68: "Advertise error",
    69: "Srmount error",
    70: "Communication error on send",
    71: "Protocol error",
    72: "Multihop attempted",
    73: "Cross mount point (not really error)",
    74: "Trying to read unreadable message",
    75: "Value too large for defined data type",
    76: "Given log. name not unique",
    77: "f.d. invalid for this operation",
    78: "Remote address changed",
    79: "Can   access a needed shared lib",
    80: "Accessing a corrupted shared lib",
    81: ".lib section in a.out corrupted",
    82: "Attempting to link in too many libs",
    83: "Attempting to exec a shared library",
    84: "Illegal byte sequence",
    86: "Streams pipe error",
    87: "Too many users",
    88: "Socket operation on non-socket",
    89: "Destination address required",
    90: "Message too long",
    91: "Protocol wrong type for socket",
    92: "Protocol not available",
    93: "Unknown protocol",
    94: "Socket type not supported",
    95: "Not supported",
    96: "Protocol family not supported",
    97: "Address family not supported by protocol family",
    98: "Address already in use",
    99: "Address not available",
    100: "Network interface is not configured",
    101: "Network is unreachable",
    102: "Connection reset by network",
    103: "Connection aborted",
    104: "Connection reset by peer",
    105: "No buffer space available",
    106: "Socket is already connected",
    107: "Socket is not connected",
    108: "Can't send after socket shutdown",
    109: "Too many references",
    110: "Connection timed out",
    111: "Connection refused",
    112: "Host is down",
    113: "Host is unreachable",
    114: "Socket already connected",
    115: "Connection already in progress",
    116: "Stale file handle",
    122: "Quota exceeded",
    123: "No medium (in tape drive)",
    125: "Operation canceled",
    130: "Previous owner died",
    131: "State not recoverable"
};

function ___setErrNo(value) {
    if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
    return value
}
var PATH = {
    splitPath: (function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    }),
    normalizeArray: (function(parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up--; up) {
                parts.unshift("..")
            }
        }
        return parts
    }),
    normalize: (function(path) {
        var isAbsolute = path.charAt(0) === "/",
            trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter((function(p) {
            return !!p
        })), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    }),
    dirname: (function(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    }),
    basename: (function(path) {
        if (path === "/") return "/";
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1)
    }),
    extname: (function(path) {
        return PATH.splitPath(path)[3]
    }),
    join: (function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"))
    }),
    join2: (function(l, r) {
        return PATH.normalize(l + "/" + r)
    }),
    resolve: (function() {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/"
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((function(p) {
            return !!p
        })), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
    }),
    relative: (function(from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);

        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    })
};
var TTY = {
    ttys: [],
    init: (function() {}),
    shutdown: (function() {}),
    register: (function(dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    }),
    stream_ops: {
        open: (function(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
            }
            stream.tty = tty;
            stream.seekable = false
        }),
        close: (function(stream) {
            stream.tty.ops.flush(stream.tty)
        }),
        flush: (function(stream) {
            stream.tty.ops.flush(stream.tty)
        }),
        read: (function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(ERRNO_CODES.ENXIO)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now()
            }
            return bytesRead
        }),
        write: (function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(ERRNO_CODES.ENXIO)
            }
            for (var i = 0; i < length; i++) {
                try {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                } catch (e) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO)
                }
            }
            if (length) {
                stream.node.timestamp = Date.now()
            }
            return i
        })
    },
    default_tty_ops: {
        get_char: (function(tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    var isPosixPlatform = process.platform != "win32";
                    var fd = process.stdin.fd;
                    if (isPosixPlatform) {
                        var usingDevice = false;
                        try {
                            fd = fs.openSync("/dev/stdin", "r");
                            usingDevice = true
                        } catch (e) {}
                    }
                    try {
                        bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null)
                    } catch (e) {
                        if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                        else throw e
                    }
                    if (usingDevice) {
                        fs.closeSync(fd)
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8")
                    } else {
                        result = null
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n"
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n"
                    }
                }
                if (!result) {
                    return null
                }
                tty.input = intArrayFromString(result, true)
            }
            return tty.input.shift()
        }),
        put_char: (function(tty, val) {
            if (val === null || val === 10) {
                Module["print"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        }),
        flush: (function(tty) {
            if (tty.output && tty.output.length > 0) {
                Module["print"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        })
    },
    default_tty1_ops: {
        put_char: (function(tty, val) {
            if (val === null || val === 10) {
                Module["printErr"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        }),
        flush: (function(tty) {
            if (tty.output && tty.output.length > 0) {
                Module["printErr"](UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        })
    }
};
var MEMFS = {
    ops_table: null,
    mount: (function(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0)
    }),
    createNode: (function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek
                    }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            }
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node
        }
        return node
    }),
    getFileDataAsRegularArray: (function(node) {
        if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
            return arr
        }
        return node.contents
    }),
    getFileDataAsTypedArray: (function(node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    }),
    expandFileStorage: (function(node, newCapacity) {
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
            node.contents = MEMFS.getFileDataAsRegularArray(node);
            node.usedBytes = node.contents.length
        }
        if (!node.contents || node.contents.subarray) {
            var prevCapacity = node.contents ? node.contents.length : 0;
            if (prevCapacity >= newCapacity) return;
            var CAPACITY_DOUBLING_MAX = 1024 * 1024;
            newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
            if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
            var oldContents = node.contents;
            node.contents = new Uint8Array(newCapacity);
            if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
            return
        }
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0)
    }),
    resizeFileStorage: (function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
            return
        }
        if (!node.contents || node.contents.subarray) {
            var oldContents = node.contents;
            node.contents = new Uint8Array(new ArrayBuffer(newSize));
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize;
            return
        }
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else
            while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize
    }),
    node_ops: {
        getattr: (function(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        }),
        setattr: (function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        }),
        lookup: (function(parent, name) {
            throw FS.genericErrors[ERRNO_CODES.ENOENT]
        }),
        mknod: (function(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        }),
        rename: (function(old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir
        }),
        unlink: (function(parent, name) {
            delete parent.contents[name]
        }),
        rmdir: (function(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
            }
            delete parent.contents[name]
        }),
        readdir: (function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        }),
        symlink: (function(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        }),
        readlink: (function(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return node.link
        })
    },
    stream_ops: {
        read: (function(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            assert(size >= 0);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
            }
            return size
        }),
        write: (function(stream, buffer, offset, length, position, canOwn) {
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
            else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        }),
        llseek: (function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return position
        }),
        allocate: (function(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
        }),
        mmap: (function(stream, buffer, offset, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                if (position > 0 || position + length < stream.node.usedBytes) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length)
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length)
                    }
                }
                allocated = true;
                ptr = _malloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(ERRNO_CODES.ENOMEM)
                }
                buffer.set(contents, ptr)
            }
            return {
                ptr: ptr,
                allocated: allocated
            }
        }),
        msync: (function(stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
            }
            if (mmapFlags & 2) {
                return 0
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        })
    }
};
var IDBFS = {
    dbs: {},
    indexedDB: (function() {
        if (typeof indexedDB !== "undefined") return indexedDB;
        var ret = null;
        if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret
    }),
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    mount: (function(mount) {
        return MEMFS.mount.apply(null, arguments)
    }),
    syncfs: (function(mount, populate, callback) {
        IDBFS.getLocalSet(mount, (function(err, local) {
            if (err) return callback(err);
            IDBFS.getRemoteSet(mount, (function(err, remote) {
                if (err) return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback)
            }))
        }))
    }),
    getDB: (function(name, callback) {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db)
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
        } catch (e) {
            return callback(e)
        }
        if (!req) {
            return callback("Unable to connect to IndexedDB")
        }
        req.onupgradeneeded = (function(e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", {
                    unique: false
                })
            }
        });
        req.onsuccess = (function() {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db)
        });
        req.onerror = (function(e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    getLocalSet: (function(mount, callback) {
        var entries = {};

        function isRealDir(p) {
            return p !== "." && p !== ".."
        }

        function toAbsolute(root) {
            return (function(p) {
                return PATH.join2(root, p)
            })
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path)
            } catch (e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
            }
            entries[path] = {
                timestamp: stat.mtime
            }
        }
        return callback(null, {
            type: "local",
            entries: entries
        })
    }),
    getRemoteSet: (function(mount, callback) {
        var entries = {};
        IDBFS.getDB(mount.mountpoint, (function(err, db) {
            if (err) return callback(err);
            var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
            transaction.onerror = (function(e) {
                callback(this.error);
                e.preventDefault()
            });
            var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
            var index = store.index("timestamp");
            index.openKeyCursor().onsuccess = (function(event) {
                var cursor = event.target.result;
                if (!cursor) {
                    return callback(null, {
                        type: "remote",
                        db: db,
                        entries: entries
                    })
                }
                entries[cursor.primaryKey] = {
                    timestamp: cursor.key
                };
                cursor.continue()
            })
        }))
    }),
    loadLocalEntry: (function(path, callback) {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path)
        } catch (e) {
            return callback(e)
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode
            })
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode,
                contents: node.contents
            })
        } else {
            return callback(new Error("node type not supported"))
        }
    }),
    storeLocalEntry: (function(path, entry, callback) {
        try {
            if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode)
            } else if (FS.isFile(entry.mode)) {
                FS.writeFile(path, entry.contents, {
                    encoding: "binary",
                    canOwn: true
                })
            } else {
                return callback(new Error("node type not supported"))
            }
            FS.chmod(path, entry.mode);
            FS.utime(path, entry.timestamp, entry.timestamp)
        } catch (e) {
            return callback(e)
        }
        callback(null)
    }),
    removeLocalEntry: (function(path, callback) {
        try {
            var lookup = FS.lookupPath(path);
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path)
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path)
            }
        } catch (e) {
            return callback(e)
        }
        callback(null)
    }),
    loadRemoteEntry: (function(store, path, callback) {
        var req = store.get(path);
        req.onsuccess = (function(event) {
            callback(null, event.target.result)
        });
        req.onerror = (function(e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    storeRemoteEntry: (function(store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = (function() {
            callback(null)
        });
        req.onerror = (function(e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    removeRemoteEntry: (function(store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = (function() {
            callback(null)
        });
        req.onerror = (function(e) {
            callback(this.error);
            e.preventDefault()
        })
    }),
    reconcile: (function(src, dst, callback) {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach((function(key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e.timestamp > e2.timestamp) {
                create.push(key);
                total++
            }
        }));
        var remove = [];
        Object.keys(dst.entries).forEach((function(key) {
            var e = dst.entries[key];
            var e2 = src.entries[key];
            if (!e2) {
                remove.push(key);
                total++
            }
        }));
        if (!total) {
            return callback(null)
        }
        var completed = 0;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);

        function done(err) {
            if (err) {
                if (!done.errored) {
                    done.errored = true;
                    return callback(err)
                }
                return
            }
            if (++completed >= total) {
                return callback(null)
            }
        }
        transaction.onerror = (function(e) {
            done(this.error);
            e.preventDefault()
        });
        create.sort().forEach((function(path) {
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path, (function(err, entry) {
                    if (err) return done(err);
                    IDBFS.storeLocalEntry(path, entry, done)
                }))
            } else {
                IDBFS.loadLocalEntry(path, (function(err, entry) {
                    if (err) return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done)
                }))
            }
        }));
        remove.sort().reverse().forEach((function(path) {
            if (dst.type === "local") {
                IDBFS.removeLocalEntry(path, done)
            } else {
                IDBFS.removeRemoteEntry(store, path, done)
            }
        }))
    })
};
var NODEFS = {
    isWindows: false,
    staticInit: (function() {
        NODEFS.isWindows = !!process.platform.match(/^win/)
    }),
    mount: (function(mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0)
    }),
    createNode: (function(parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node
    }),
    getMode: (function(path) {
        var stat;
        try {
            stat = fs.lstatSync(path);
            if (NODEFS.isWindows) {
                stat.mode = stat.mode | (stat.mode & 146) >> 1
            }
        } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code])
        }
        return stat.mode
    }),
    realPath: (function(node) {
        var parts = [];
        while (node.parent !== node) {
            parts.push(node.name);
            node = node.parent
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts)
    }),
    flagsToPermissionStringMap: {
        0: "r",
        1: "r+",
        2: "r+",
        64: "r",
        65: "r+",
        66: "r+",
        129: "rx+",
        193: "rx+",
        514: "w+",
        577: "w",
        578: "w+",
        705: "wx",
        706: "wx+",
        1024: "a",
        1025: "a",
        1026: "a+",
        1089: "a",
        1090: "a+",
        1153: "ax",
        1154: "ax+",
        1217: "ax",
        1218: "ax+",
        4096: "rs",
        4098: "rs+"
    },
    flagsToPermissionString: (function(flags) {
        flags &= ~2097152;
        flags &= ~2048;
        flags &= ~32768;
        flags &= ~524288;
        if (flags in NODEFS.flagsToPermissionStringMap) {
            return NODEFS.flagsToPermissionStringMap[flags]
        } else {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
    }),
    node_ops: {
        getattr: (function(node) {
            var path = NODEFS.realPath(node);
            var stat;
            try {
                stat = fs.lstatSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            if (NODEFS.isWindows && !stat.blksize) {
                stat.blksize = 4096
            }
            if (NODEFS.isWindows && !stat.blocks) {
                stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0
            }
            return {
                dev: stat.dev,
                ino: stat.ino,
                mode: stat.mode,
                nlink: stat.nlink,
                uid: stat.uid,
                gid: stat.gid,
                rdev: stat.rdev,
                size: stat.size,
                atime: stat.atime,
                mtime: stat.mtime,
                ctime: stat.ctime,
                blksize: stat.blksize,
                blocks: stat.blocks
            }
        }),
        setattr: (function(node, attr) {
            var path = NODEFS.realPath(node);
            try {
                if (attr.mode !== undefined) {
                    fs.chmodSync(path, attr.mode);
                    node.mode = attr.mode
                }
                if (attr.timestamp !== undefined) {
                    var date = new Date(attr.timestamp);
                    fs.utimesSync(path, date, date)
                }
                if (attr.size !== undefined) {
                    fs.truncateSync(path, attr.size)
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        lookup: (function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            var mode = NODEFS.getMode(path);
            return NODEFS.createNode(parent, name, mode)
        }),
        mknod: (function(parent, name, mode, dev) {
            var node = NODEFS.createNode(parent, name, mode, dev);
            var path = NODEFS.realPath(node);
            try {
                if (FS.isDir(node.mode)) {
                    fs.mkdirSync(path, node.mode)
                } else {
                    fs.writeFileSync(path, "", {
                        mode: node.mode
                    })
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            return node
        }),
        rename: (function(oldNode, newDir, newName) {
            var oldPath = NODEFS.realPath(oldNode);
            var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
            try {
                fs.renameSync(oldPath, newPath)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        unlink: (function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.unlinkSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        rmdir: (function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.rmdirSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        readdir: (function(node) {
            var path = NODEFS.realPath(node);
            try {
                return fs.readdirSync(path)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        symlink: (function(parent, newName, oldPath) {
            var newPath = PATH.join2(NODEFS.realPath(parent), newName);
            try {
                fs.symlinkSync(oldPath, newPath)
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        readlink: (function(node) {
            var path = NODEFS.realPath(node);
            try {
                path = fs.readlinkSync(path);
                path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                return path
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        })
    },
    stream_ops: {
        open: (function(stream) {
            var path = NODEFS.realPath(stream.node);
            try {
                if (FS.isFile(stream.node.mode)) {
                    stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags))
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        close: (function(stream) {
            try {
                if (FS.isFile(stream.node.mode) && stream.nfd) {
                    fs.closeSync(stream.nfd)
                }
            } catch (e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
        }),
        read: (function(stream, buffer, offset, length, position) {
            if (length === 0) return 0;
            var nbuffer = new Buffer(length);
            var res;
            try {
                res = fs.readSync(stream.nfd, nbuffer, 0, length, position)
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            if (res > 0) {
                for (var i = 0; i < res; i++) {
                    buffer[offset + i] = nbuffer[i]
                }
            }
            return res
        }),
        write: (function(stream, buffer, offset, length, position) {
            var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
            var res;
            try {
                res = fs.writeSync(stream.nfd, nbuffer, 0, length, position)
            } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code])
            }
            return res
        }),
        llseek: (function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    try {
                        var stat = fs.fstatSync(stream.nfd);
                        position += stat.size
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES[e.code])
                    }
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return position
        })
    }
};
var WORKERFS = {
    DIR_MODE: 16895,
    FILE_MODE: 33279,
    reader: null,
    mount: (function(mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync;
        var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
        var createdParents = {};

        function ensureParent(path) {
            var parts = path.split("/");
            var parent = root;
            for (var i = 0; i < parts.length - 1; i++) {
                var curr = parts.slice(0, i + 1).join("/");
                if (!createdParents[curr]) {
                    createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0)
                }
                parent = createdParents[curr]
            }
            return parent
        }

        function base(path) {
            var parts = path.split("/");
            return parts[parts.length - 1]
        }
        Array.prototype.forEach.call(mount.opts["files"] || [], (function(file) {
            WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate)
        }));
        (mount.opts["blobs"] || []).forEach((function(obj) {
            WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"])
        }));
        (mount.opts["packages"] || []).forEach((function(pack) {
            pack["metadata"].files.forEach((function(file) {
                var name = file.filename.substr(1);
                WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end))
            }))
        }));
        return root
    }),
    createNode: (function(parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
            node.size = contents.size;
            node.contents = contents
        } else {
            node.size = 4096;
            node.contents = {}
        }
        if (parent) {
            parent.contents[name] = node
        }
        return node
    }),
    node_ops: {
        getattr: (function(node) {
            return {
                dev: 1,
                ino: undefined,
                mode: node.mode,
                nlink: 1,
                uid: 0,
                gid: 0,
                rdev: undefined,
                size: node.size,
                atime: new Date(node.timestamp),
                mtime: new Date(node.timestamp),
                ctime: new Date(node.timestamp),
                blksize: 4096,
                blocks: Math.ceil(node.size / 4096)
            }
        }),
        setattr: (function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
        }),
        lookup: (function(parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }),
        mknod: (function(parent, name, mode, dev) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        rename: (function(oldNode, newDir, newName) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        unlink: (function(parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        rmdir: (function(parent, name) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        readdir: (function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        }),
        symlink: (function(parent, newName, oldPath) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }),
        readlink: (function(node) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        })
    },
    stream_ops: {
        read: (function(stream, buffer, offset, length, position) {
            if (position >= stream.node.size) return 0;
            var chunk = stream.node.contents.slice(position, position + length);
            var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
            buffer.set(new Uint8Array(ab), offset);
            return chunk.size
        }),
        write: (function(stream, buffer, offset, length, position) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO)
        }),
        llseek: (function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.size
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
            }
            return position
        })
    }
};
STATICTOP += 16;
STATICTOP += 16;
STATICTOP += 16;
var FS = {
    root: null,
    mounts: [],
    devices: [null],
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: {
        openFlags: {
            READ: 1,
            WRITE: 2
        }
    },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    handleFSError: (function(e) {
        if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
        return ___setErrNo(e.errno)
    }),
    lookupPath: (function(path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return {
            path: "",
            node: null
        };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key]
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(ERRNO_CODES.ELOOP)
        }
        var parts = PATH.normalizeArray(path.split("/").filter((function(p) {
            return !!p
        })), false);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, {
                        recurse_count: opts.recurse_count
                    });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(ERRNO_CODES.ELOOP)
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        }
    }),
    getPath: (function(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent
        }
    }),
    hashName: (function(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    }),
    hashAddNode: (function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    }),
    hashRemoveNode: (function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    }),
    lookupNode: (function(parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
            throw new FS.ErrnoError(err, parent)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    }),
    createNode: (function(parent, name, mode, rdev) {
        if (!FS.FSNode) {
            FS.FSNode = (function(parent, name, mode, rdev) {
                if (!parent) {
                    parent = this
                }
                this.parent = parent;
                this.mount = parent.mount;
                this.mounted = null;
                this.id = FS.nextInode++;
                this.name = name;
                this.mode = mode;
                this.node_ops = {};
                this.stream_ops = {};
                this.rdev = rdev
            });
            FS.FSNode.prototype = {};
            var readMode = 292 | 73;
            var writeMode = 146;
            Object.defineProperties(FS.FSNode.prototype, {
                read: {
                    get: (function() {
                        return (this.mode & readMode) === readMode
                    }),
                    set: (function(val) {
                        val ? this.mode |= readMode : this.mode &= ~readMode
                    })
                },
                write: {
                    get: (function() {
                        return (this.mode & writeMode) === writeMode
                    }),
                    set: (function(val) {
                        val ? this.mode |= writeMode : this.mode &= ~writeMode
                    })
                },
                isFolder: {
                    get: (function() {
                        return FS.isDir(this.mode)
                    })
                },
                isDevice: {
                    get: (function() {
                        return FS.isChrdev(this.mode)
                    })
                }
            })
        }
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node
    }),
    destroyNode: (function(node) {
        FS.hashRemoveNode(node)
    }),
    isRoot: (function(node) {
        return node === node.parent
    }),
    isMountpoint: (function(node) {
        return !!node.mounted
    }),
    isFile: (function(mode) {
        return (mode & 61440) === 32768
    }),
    isDir: (function(mode) {
        return (mode & 61440) === 16384
    }),
    isLink: (function(mode) {
        return (mode & 61440) === 40960
    }),
    isChrdev: (function(mode) {
        return (mode & 61440) === 8192
    }),
    isBlkdev: (function(mode) {
        return (mode & 61440) === 24576
    }),
    isFIFO: (function(mode) {
        return (mode & 61440) === 4096
    }),
    isSocket: (function(mode) {
        return (mode & 49152) === 49152
    }),
    flagModes: {
        "r": 0,
        "rs": 1052672,
        "r+": 2,
        "w": 577,
        "wx": 705,
        "xw": 705,
        "w+": 578,
        "wx+": 706,
        "xw+": 706,
        "a": 1089,
        "ax": 1217,
        "xa": 1217,
        "a+": 1090,
        "ax+": 1218,
        "xa+": 1218
    },
    modeStringToFlags: (function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str)
        }
        return flags
    }),
    flagsToPermissionString: (function(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    }),
    nodePermissions: (function(node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
            return ERRNO_CODES.EACCES
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
            return ERRNO_CODES.EACCES
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
            return ERRNO_CODES.EACCES
        }
        return 0
    }),
    mayLookup: (function(dir) {
        var err = FS.nodePermissions(dir, "x");
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0
    }),
    mayCreate: (function(dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return ERRNO_CODES.EEXIST
        } catch (e) {}
        return FS.nodePermissions(dir, "wx")
    }),
    mayDelete: (function(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch (e) {
            return e.errno
        }
        var err = FS.nodePermissions(dir, "wx");
        if (err) {
            return err
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return ERRNO_CODES.ENOTDIR
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return ERRNO_CODES.EBUSY
            }
        } else {
            if (FS.isDir(node.mode)) {
                return ERRNO_CODES.EISDIR
            }
        }
        return 0
    }),
    mayOpen: (function(node, flags) {
        if (!node) {
            return ERRNO_CODES.ENOENT
        }
        if (FS.isLink(node.mode)) {
            return ERRNO_CODES.ELOOP
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return ERRNO_CODES.EISDIR
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    }),
    MAX_OPEN_FDS: 4096,
    nextfd: (function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE)
    }),
    getStream: (function(fd) {
        return FS.streams[fd]
    }),
    createStream: (function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = (function() {});
            FS.FSStream.prototype = {};
            Object.defineProperties(FS.FSStream.prototype, {
                object: {
                    get: (function() {
                        return this.node
                    }),
                    set: (function(val) {
                        this.node = val
                    })
                },
                isRead: {
                    get: (function() {
                        return (this.flags & 2097155) !== 1
                    })
                },
                isWrite: {
                    get: (function() {
                        return (this.flags & 2097155) !== 0
                    })
                },
                isAppend: {
                    get: (function() {
                        return this.flags & 1024
                    })
                }
            })
        }
        var newStream = new FS.FSStream;
        for (var p in stream) {
            newStream[p] = stream[p]
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    }),
    closeStream: (function(fd) {
        FS.streams[fd] = null
    }),
    chrdev_stream_ops: {
        open: (function(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream)
            }
        }),
        llseek: (function() {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        })
    },
    major: (function(dev) {
        return dev >> 8
    }),
    minor: (function(dev) {
        return dev & 255
    }),
    makedev: (function(ma, mi) {
        return ma << 8 | mi
    }),
    registerDevice: (function(dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    }),
    getDevice: (function(dev) {
        return FS.devices[dev]
    }),
    getMounts: (function(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
        }
        return mounts
    }),
    syncfs: (function(populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;

        function doCallback(err) {
            assert(FS.syncFSRequests > 0);
            FS.syncFSRequests--;
            return callback(err)
        }

        function done(err) {
            if (err) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(err)
                }
                return
            }
            if (++completed >= mounts.length) {
                doCallback(null)
            }
        }
        mounts.forEach((function(mount) {
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        }))
    }),
    mount: (function(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    }),
    unmount: (function(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach((function(hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current)
                }
                current = next
            }
        }));
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1)
    }),
    lookup: (function(parent, name) {
        return parent.node_ops.lookup(parent, name)
    }),
    mknod: (function(path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    }),
    create: (function(path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    }),
    mkdir: (function(path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    }),
    mkdirTree: (function(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode)
            } catch (e) {
                if (e.errno != ERRNO_CODES.EEXIST) throw e
            }
        }
    }),
    mkdev: (function(path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    }),
    symlink: (function(oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    }),
    rename: (function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        try {
            lookup = FS.lookupPath(old_path, {
                parent: true
            });
            old_dir = lookup.node;
            lookup = FS.lookupPath(new_path, {
                parent: true
            });
            new_dir = lookup.node
        } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(ERRNO_CODES.EXDEV)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        if (new_dir !== old_dir) {
            err = FS.nodePermissions(old_dir, "w");
            if (err) {
                throw new FS.ErrnoError(err)
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
        } catch (e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
        try {
            if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path)
        } catch (e) {
            console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
    }),
    rmdir: (function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    }),
    readdir: (function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
        }
        return node.node_ops.readdir(node)
    }),
    unlink: (function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch (e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    }),
    readlink: (function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
    }),
    stat: (function(path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        return node.node_ops.getattr(node)
    }),
    lstat: (function(path) {
        return FS.stat(path, true)
    }),
    chmod: (function(path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        })
    }),
    lchmod: (function(path, mode) {
        FS.chmod(path, mode, true)
    }),
    fchmod: (function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        FS.chmod(stream.node, mode)
    }),
    chown: (function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
        })
    }),
    lchown: (function(path, uid, gid) {
        FS.chown(path, uid, gid, true)
    }),
    fchown: (function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        FS.chown(stream.node, uid, gid)
    }),
    truncate: (function(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(ERRNO_CODES.EPERM)
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var err = FS.nodePermissions(node, "w");
        if (err) {
            throw new FS.ErrnoError(err)
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        })
    }),
    ftruncate: (function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        FS.truncate(stream.node, len)
    }),
    utime: (function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        })
    }),
    open: (function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        if (typeof path === "object") {
            node = path
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(ERRNO_CODES.EEXIST)
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
        }
        if (!created) {
            var err = FS.mayOpen(node, flags);
            if (err) {
                throw new FS.ErrnoError(err)
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0)
        }
        flags &= ~(128 | 512);
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        }, fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                Module["printErr"]("read file: " + path)
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags)
            }
        } catch (e) {
            console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
        }
        return stream
    }),
    close: (function(stream) {
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch (e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
    }),
    llseek: (function(stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    }),
    read: (function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        var seeking = true;
        if (typeof position === "undefined") {
            position = stream.position;
            seeking = false
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead
    }),
    write: (function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EISDIR)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if (stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = true;
        if (typeof position === "undefined") {
            position = stream.position;
            seeking = false
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(ERRNO_CODES.ESPIPE)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path)
        } catch (e) {
            console.log("FS.trackingDelegate['onWriteToFile']('" + path + "') threw an exception: " + e.message)
        }
        return bytesWritten
    }),
    allocate: (function(stream, offset, length) {
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EBADF)
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP)
        }
        stream.stream_ops.allocate(stream, offset, length)
    }),
    mmap: (function(stream, buffer, offset, length, position, prot, flags) {
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(ERRNO_CODES.EACCES)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV)
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags)
    }),
    msync: (function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    }),
    munmap: (function(stream) {
        return 0
    }),
    ioctl: (function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTTY)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    }),
    readFile: (function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "r";
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    }),
    writeFile: (function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "w";
        opts.encoding = opts.encoding || "utf8";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === "utf8") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn)
        } else if (opts.encoding === "binary") {
            FS.write(stream, data, 0, data.length, 0, opts.canOwn)
        }
        FS.close(stream)
    }),
    cwd: (function() {
        return FS.currentPath
    }),
    chdir: (function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (lookup.node === null) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOENT)
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR)
        }
        var err = FS.nodePermissions(lookup.node, "x");
        if (err) {
            throw new FS.ErrnoError(err)
        }
        FS.currentPath = lookup.path
    }),
    createDefaultDirectories: (function() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    }),
    createDefaultDevices: (function() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: (function() {
                return 0
            }),
            write: (function(stream, buffer, offset, length, pos) {
                return length
            })
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device;
        if (typeof crypto !== "undefined") {
            var randomBuffer = new Uint8Array(1);
            random_device = (function() {
                crypto.getRandomValues(randomBuffer);
                return randomBuffer[0]
            })
        } else if (ENVIRONMENT_IS_NODE) {
            random_device = (function() {
                return require("crypto").randomBytes(1)[0]
            })
        } else {
            random_device = (function() {
                return Math.random() * 256 | 0
            })
        }
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    }),
    createSpecialDirectories: (function() {
        FS.mkdir("/proc");
        FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount: (function() {
                var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                node.node_ops = {
                    lookup: (function(parent, name) {
                        var fd = +name;
                        var stream = FS.getStream(fd);
                        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                        var ret = {
                            parent: null,
                            mount: {
                                mountpoint: "fake"
                            },
                            node_ops: {
                                readlink: (function() {
                                    return stream.path
                                })
                            }
                        };
                        ret.parent = ret;
                        return ret
                    })
                };
                return node
            })
        }, {}, "/proc/self/fd")
    }),
    createStandardStreams: (function() {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", "r");
        assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
        var stdout = FS.open("/dev/stdout", "w");
        assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
        var stderr = FS.open("/dev/stderr", "w");
        assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")")
    }),
    ensureErrnoError: (function() {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = (function(errno) {
                this.errno = errno;
                for (var key in ERRNO_CODES) {
                    if (ERRNO_CODES[key] === errno) {
                        this.code = key;
                        break
                    }
                }
            });
            this.setErrno(errno);
            this.message = ERRNO_MESSAGES[errno]
        };
        FS.ErrnoError.prototype = new Error;
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [ERRNO_CODES.ENOENT].forEach((function(code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
        }))
    }),
    staticInit: (function() {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS,
            "IDBFS": IDBFS,
            "NODEFS": NODEFS,
            "WORKERFS": WORKERFS
        }
    }),
    init: (function(input, output, error) {
        assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams()
    }),
    quit: (function() {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue
            }
            FS.close(stream)
        }
    }),
    getMode: (function(canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode
    }),
    joinPath: (function(parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == "/") path = path.substr(1);
        return path
    }),
    absolutePath: (function(relative, base) {
        return PATH.resolve(base, relative)
    }),
    standardizePath: (function(path) {
        return PATH.normalize(path)
    }),
    findObject: (function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object
        } else {
            ___setErrNo(ret.error);
            return null
        }
    }),
    analyzePath: (function(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch (e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch (e) {
            ret.error = e.errno
        }
        return ret
    }),
    createFolder: (function(parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode)
    }),
    createPath: (function(parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch (e) {}
            parent = current
        }
        return current
    }),
    createFile: (function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode)
    }),
    createDataFile: (function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, "w");
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
        return node
    }),
    createDevice: (function(parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: (function(stream) {
                stream.seekable = false
            }),
            close: (function(stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10)
                }
            }),
            read: (function(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES.EIO)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(ERRNO_CODES.EAGAIN)
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            }),
            write: (function(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch (e) {
                        throw new FS.ErrnoError(ERRNO_CODES.EIO)
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            })
        });
        return FS.mkdev(path, mode, dev)
    }),
    createLink: (function(parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path)
    }),
    forceLoadFile: (function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else if (Module["read"]) {
            try {
                obj.contents = intArrayFromString(Module["read"](obj.url), true);
                obj.usedBytes = obj.contents.length
            } catch (e) {
                success = false
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success
    }),
    createLazyFile: (function(parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined")
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || [])
                } else {
                    return intArrayFromString(xhr.responseText || "", true)
                }
            });
            var lazyArray = this;
            lazyArray.setDataGetter((function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end)
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum]
            }));
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                console.log("LazyFiles on gzip forces download of the whole file when length is accessed")
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
        };
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperties(lazyArray, {
                length: {
                    get: (function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._length
                    })
                },
                chunkSize: {
                    get: (function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._chunkSize
                    })
                }
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url: url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: (function() {
                    return this.contents.length
                })
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach((function(key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                if (!FS.forceLoadFile(node)) {
                    throw new FS.ErrnoError(ERRNO_CODES.EIO)
                }
                return fn.apply(null, arguments)
            }
        }));
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            if (!FS.forceLoadFile(node)) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO)
            }
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            assert(size >= 0);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        };
        node.stream_ops = stream_ops;
        return node
    }),
    createPreloadedFile: (function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);

        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                }
                if (onload) onload();
                removeRunDependency(dep)
            }
            var handled = false;
            Module["preloadPlugins"].forEach((function(plugin) {
                if (handled) return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish, (function() {
                        if (onerror) onerror();
                        removeRunDependency(dep)
                    }));
                    handled = true
                }
            }));
            if (!handled) finish(byteArray)
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(url, (function(byteArray) {
                processData(byteArray)
            }), onerror)
        } else {
            processData(url)
        }
    }),
    indexedDB: (function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    }),
    DB_NAME: (function() {
        return "EM_FS_" + window.location.pathname
    }),
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: (function(paths, onload, onerror) {
        onload = onload || (function() {});
        onerror = onerror || (function() {});
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            console.log("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME)
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach((function(path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total) finish()
                };
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            }));
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    }),
    loadFilesFromDB: (function(paths, onload, onerror) {
        onload = onload || (function() {});
        onerror = onerror || (function() {});
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch (e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
            } catch (e) {
                onerror(e);
                return
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;

            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach((function(path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path)
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total) finish()
                };
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            }));
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    })
};
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    mappings: {},
    umask: 511,
    calculateAt: (function(dirfd, path) {
        if (path[0] !== "/") {
            var dir;
            if (dirfd === -100) {
                dir = FS.cwd()
            } else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                dir = dirstream.path
            }
            path = PATH.join2(dir, path)
        }
        return path
    }),
    doStat: (function(func, path, buf) {
        try {
            var stat = func(path)
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -ERRNO_CODES.ENOTDIR
            }
            throw e
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = 0;
        HEAP32[buf + 8 >> 2] = stat.ino;
        HEAP32[buf + 12 >> 2] = stat.mode;
        HEAP32[buf + 16 >> 2] = stat.nlink;
        HEAP32[buf + 20 >> 2] = stat.uid;
        HEAP32[buf + 24 >> 2] = stat.gid;
        HEAP32[buf + 28 >> 2] = stat.rdev;
        HEAP32[buf + 32 >> 2] = 0;
        HEAP32[buf + 36 >> 2] = stat.size;
        HEAP32[buf + 40 >> 2] = 4096;
        HEAP32[buf + 44 >> 2] = stat.blocks;
        HEAP32[buf + 48 >> 2] = stat.atime.getTime() / 1e3 | 0;
        HEAP32[buf + 52 >> 2] = 0;
        HEAP32[buf + 56 >> 2] = stat.mtime.getTime() / 1e3 | 0;
        HEAP32[buf + 60 >> 2] = 0;
        HEAP32[buf + 64 >> 2] = stat.ctime.getTime() / 1e3 | 0;
        HEAP32[buf + 68 >> 2] = 0;
        HEAP32[buf + 72 >> 2] = stat.ino;
        return 0
    }),
    doMsync: (function(addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags)
    }),
    doMkdir: (function(path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0
    }),
    doMknod: (function(path, mode, dev) {
        switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default:
                return -ERRNO_CODES.EINVAL
        }
        FS.mknod(path, mode, dev);
        return 0
    }),
    doReadlink: (function(path, buf, bufsize) {
        if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len
    }),
    doAccess: (function(path, amode) {
        if (amode & ~7) {
            return -ERRNO_CODES.EINVAL
        }
        var node;
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        node = lookup.node;
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -ERRNO_CODES.EACCES
        }
        return 0
    }),
    doDup: (function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd
    }),
    doReadv: (function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr;
            if (curr < len) break
        }
        return ret
    }),
    doWritev: (function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return -1;
            ret += curr
        }
        return ret
    }),
    varargs: 0,
    get: (function(varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    }),
    getStr: (function() {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret
    }),
    getStreamFromFD: (function() {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return stream
    }),
    getSocketFromFD: (function() {
        var socket = SOCKFS.getSocket(SYSCALLS.get());
        if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return socket
    }),
    getSocketAddress: (function(allowNull) {
        var addrp = SYSCALLS.get(),
            addrlen = SYSCALLS.get();
        if (allowNull && addrp === 0) return null;
        var info = __read_sockaddr(addrp, addrlen);
        if (info.errno) throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info
    }),
    get64: (function() {
        var low = SYSCALLS.get(),
            high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low
    }),
    getZero: (function() {
        assert(SYSCALLS.get() === 0)
    })
};

function ___syscall91(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var addr = SYSCALLS.get(),
            len = SYSCALLS.get();
        var info = SYSCALLS.mappings[addr];
        if (!info) return 0;
        if (len === info.len) {
            var stream = FS.getStream(info.fd);
            SYSCALLS.doMsync(addr, stream, len, info.flags);
            FS.munmap(stream);
            SYSCALLS.mappings[addr] = null;
            if (info.allocated) {
                _free(info.malloc)
            }
        }
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function _pthread_mutexattr_destroy() {}

function ___syscall54(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            op = SYSCALLS.get();
        switch (op) {
            case 21505:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return 0
                };
            case 21506:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return 0
                };
            case 21519:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    var argp = SYSCALLS.get();
                    HEAP32[argp >> 2] = 0;
                    return 0
                };
            case 21520:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return -ERRNO_CODES.EINVAL
                };
            case 21531:
                {
                    var argp = SYSCALLS.get();
                    return FS.ioctl(stream, op, argp)
                };
            case 21523:
                {
                    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
                    return 0
                };
            default:
                abort("bad ioctl syscall " + op)
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function __ZN2cv3EMDERKNS_11_InputArrayES2_iS2_PfRKNS_12_OutputArrayE() {
    Module["printErr"]("missing function: _ZN2cv3EMDERKNS_11_InputArrayES2_iS2_PfRKNS_12_OutputArrayE");
    abort(-1)
}

function upcastPointer(ptr, ptrClass, desiredClass) {
    while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
            throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name)
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass
    }
    return ptr
}

function constNoSmartPtrRawPointerToWireType(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError("null is not a valid " + this.name)
        }
        return 0
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
    }
    if (!handle.$$.ptr) {
        throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr
}

function genericPointerToWireType(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError("null is not a valid " + this.name)
        }
        if (this.isSmartPointer) {
            var ptr = this.rawConstructor();
            if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr)
            }
            return ptr
        } else {
            return 0
        }
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
    }
    if (!handle.$$.ptr) {
        throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
    }
    if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name)
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    if (this.isSmartPointer) {
        if (undefined === handle.$$.smartPtr) {
            throwBindingError("Passing raw pointer to smart pointer is illegal")
        }
        switch (this.sharingPolicy) {
            case 0:
                if (handle.$$.smartPtrType === this) {
                    ptr = handle.$$.smartPtr
                } else {
                    throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name)
                }
                break;
            case 1:
                ptr = handle.$$.smartPtr;
                break;
            case 2:
                if (handle.$$.smartPtrType === this) {
                    ptr = handle.$$.smartPtr
                } else {
                    var clonedHandle = handle["clone"]();
                    ptr = this.rawShare(ptr, __emval_register((function() {
                        clonedHandle["delete"]()
                    })));
                    if (destructors !== null) {
                        destructors.push(this.rawDestructor, ptr)
                    }
                }
                break;
            default:
                throwBindingError("Unsupporting sharing policy")
        }
    }
    return ptr
}

function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError("null is not a valid " + this.name)
        }
        return 0
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
    }
    if (!handle.$$.ptr) {
        throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
    }
    if (handle.$$.ptrType.isConst) {
        throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name)
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr
}

function RegisteredPointer_getPointee(ptr) {
    if (this.rawGetPointee) {
        ptr = this.rawGetPointee(ptr)
    }
    return ptr
}

function RegisteredPointer_destructor(ptr) {
    if (this.rawDestructor) {
        this.rawDestructor(ptr)
    }
}

function RegisteredPointer_deleteObject(handle) {
    if (handle !== null) {
        handle["delete"]()
    }
}

function downcastPointer(ptr, ptrClass, desiredClass) {
    if (ptrClass === desiredClass) {
        return ptr
    }
    if (undefined === desiredClass.baseClass) {
        return null
    }
    var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
    if (rv === null) {
        return null
    }
    return desiredClass.downcast(rv)
}
var registeredPointers = {};

function getInheritedInstanceCount() {
    return Object.keys(registeredInstances).length
}

function getLiveInheritedInstances() {
    var rv = [];
    for (var k in registeredInstances) {
        if (registeredInstances.hasOwnProperty(k)) {
            rv.push(registeredInstances[k])
        }
    }
    return rv
}
var deletionQueue = [];

function flushPendingDeletes() {
    while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj["delete"]()
    }
}
var delayFunction = undefined;

function setDelayFunction(fn) {
    delayFunction = fn;
    if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes)
    }
}

function init_embind() {
    Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
    Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
    Module["flushPendingDeletes"] = flushPendingDeletes;
    Module["setDelayFunction"] = setDelayFunction
}
var registeredInstances = {};

function getBasestPointer(class_, ptr) {
    if (ptr === undefined) {
        throwBindingError("ptr should not be undefined")
    }
    while (class_.baseClass) {
        ptr = class_.upcast(ptr);
        class_ = class_.baseClass
    }
    return ptr
}

function getInheritedInstance(class_, ptr) {
    ptr = getBasestPointer(class_, ptr);
    return registeredInstances[ptr]
}

function makeClassHandle(prototype, record) {
    if (!record.ptrType || !record.ptr) {
        throwInternalError("makeClassHandle requires ptr and ptrType")
    }
    var hasSmartPtrType = !!record.smartPtrType;
    var hasSmartPtr = !!record.smartPtr;
    if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError("Both smartPtrType and smartPtr must be specified")
    }
    record.count = {
        value: 1
    };
    return Object.create(prototype, {
        $$: {
            value: record
        }
    })
}

function RegisteredPointer_fromWireType(ptr) {
    var rawPointer = this.getPointee(ptr);
    if (!rawPointer) {
        this.destructor(ptr);
        return null
    }
    var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
    if (undefined !== registeredInstance) {
        if (0 === registeredInstance.$$.count.value) {
            registeredInstance.$$.ptr = rawPointer;
            registeredInstance.$$.smartPtr = ptr;
            return registeredInstance["clone"]()
        } else {
            var rv = registeredInstance["clone"]();
            this.destructor(ptr);
            return rv
        }
    }

    function makeDefaultHandle() {
        if (this.isSmartPointer) {
            return makeClassHandle(this.registeredClass.instancePrototype, {
                ptrType: this.pointeeType,
                ptr: rawPointer,
                smartPtrType: this,
                smartPtr: ptr
            })
        } else {
            return makeClassHandle(this.registeredClass.instancePrototype, {
                ptrType: this,
                ptr: ptr
            })
        }
    }
    var actualType = this.registeredClass.getActualType(rawPointer);
    var registeredPointerRecord = registeredPointers[actualType];
    if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this)
    }
    var toType;
    if (this.isConst) {
        toType = registeredPointerRecord.constPointerType
    } else {
        toType = registeredPointerRecord.pointerType
    }
    var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
    if (dp === null) {
        return makeDefaultHandle.call(this)
    }
    if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
            ptrType: toType,
            ptr: dp,
            smartPtrType: this,
            smartPtr: ptr
        })
    } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
            ptrType: toType,
            ptr: dp
        })
    }
}

function init_RegisteredPointer() {
    RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
    RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
    RegisteredPointer.prototype["argPackAdvance"] = 8;
    RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
    RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
    RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType
}

function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
    this.name = name;
    this.registeredClass = registeredClass;
    this.isReference = isReference;
    this.isConst = isConst;
    this.isSmartPointer = isSmartPointer;
    this.pointeeType = pointeeType;
    this.sharingPolicy = sharingPolicy;
    this.rawGetPointee = rawGetPointee;
    this.rawConstructor = rawConstructor;
    this.rawShare = rawShare;
    this.rawDestructor = rawDestructor;
    if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
            this["toWireType"] = constNoSmartPtrRawPointerToWireType;
            this.destructorFunction = null
        } else {
            this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
            this.destructorFunction = null
        }
    } else {
        this["toWireType"] = genericPointerToWireType
    }
}

function requireFunction(signature, rawFunction) {
    signature = readLatin1String(signature);

    function makeDynCaller(dynCall) {
        var args = [];
        for (var i = 1; i < signature.length; ++i) {
            args.push("a" + i)
        }
        var name = "dynCall_" + signature + "_" + rawFunction;
        var body = "return function " + name + "(" + args.join(", ") + ") {\n";
        body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
        body += "};\n";
        return (new Function("dynCall", "rawFunction", body))(dynCall, rawFunction)
    }
    var fp;
    if (Module["FUNCTION_TABLE_" + signature] !== undefined) {
        fp = Module["FUNCTION_TABLE_" + signature][rawFunction]
    } else if (typeof FUNCTION_TABLE !== "undefined") {
        fp = FUNCTION_TABLE[rawFunction]
    } else {
        var dc = Module["asm"]["dynCall_" + signature];
        if (dc === undefined) {
            dc = Module["asm"]["dynCall_" + signature.replace(/f/g, "d")];
            if (dc === undefined) {
                throwBindingError("No dynCall invoker for signature: " + signature)
            }
        }
        fp = makeDynCaller(dc)
    }
    if (typeof fp !== "function") {
        throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction)
    }
    return fp
}

function __embind_register_smart_ptr(rawType, rawPointeeType, name, sharingPolicy, getPointeeSignature, rawGetPointee, constructorSignature, rawConstructor, shareSignature, rawShare, destructorSignature, rawDestructor) {
    name = readLatin1String(name);
    rawGetPointee = requireFunction(getPointeeSignature, rawGetPointee);
    rawConstructor = requireFunction(constructorSignature, rawConstructor);
    rawShare = requireFunction(shareSignature, rawShare);
    rawDestructor = requireFunction(destructorSignature, rawDestructor);
    whenDependentTypesAreResolved([rawType], [rawPointeeType], (function(pointeeType) {
        pointeeType = pointeeType[0];
        var registeredPointer = new RegisteredPointer(name, pointeeType.registeredClass, false, false, true, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor);
        return [registeredPointer]
    }))
}

function _llvm_exp2_f32(x) {
    return Math.pow(2, x)
}

function _llvm_exp2_f64() {
    return _llvm_exp2_f32.apply(null, arguments)
}
Module["_pthread_cond_broadcast"] = _pthread_cond_broadcast;

function new_(constructor, argumentList) {
    if (!(constructor instanceof Function)) {
        throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function")
    }
    var dummy = createNamedFunction(constructor.name || "unknownFunctionName", (function() {}));
    dummy.prototype = constructor.prototype;
    var obj = new dummy;
    var r = constructor.apply(obj, argumentList);
    return r instanceof Object ? r : obj
}

function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
    var argCount = argTypes.length;
    if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")
    }
    var isClassMethodFunc = argTypes[1] !== null && classType !== null;
    var argsList = "";
    var argsListWired = "";
    for (var i = 0; i < argCount - 2; ++i) {
        argsList += (i !== 0 ? ", " : "") + "arg" + i;
        argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired"
    }
    var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
    var needsDestructorStack = false;
    for (var i = 1; i < argTypes.length; ++i) {
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
            needsDestructorStack = true;
            break
        }
    }
    if (needsDestructorStack) {
        invokerFnBody += "var destructors = [];\n"
    }
    var dtorStack = needsDestructorStack ? "destructors" : "null";
    var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
    var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
    if (isClassMethodFunc) {
        invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n"
    }
    for (var i = 0; i < argCount - 2; ++i) {
        invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
        args1.push("argType" + i);
        args2.push(argTypes[i + 2])
    }
    if (isClassMethodFunc) {
        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired
    }
    var returns = argTypes[0].name !== "void";
    invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
    if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n"
    } else {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
            var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
            if (argTypes[i].destructorFunction !== null) {
                invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
                args1.push(paramName + "_dtor");
                args2.push(argTypes[i].destructorFunction)
            }
        }
    }
    if (returns) {
        invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n"
    } else {}
    invokerFnBody += "}\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction
}

function ensureOverloadTable(proto, methodName, humanName) {
    if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        proto[methodName] = (function() {
            if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!")
            }
            return proto[methodName].overloadTable[arguments.length].apply(this, arguments)
        });
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
    }
}

function heap32VectorToArray(count, firstElement) {
    var array = [];
    for (var i = 0; i < count; i++) {
        array.push(HEAP32[(firstElement >> 2) + i])
    }
    return array
}
var UnboundTypeError = undefined;

function throwUnboundTypeError(message, types) {
    var unboundTypes = [];
    var seen = {};

    function visit(type) {
        if (seen[type]) {
            return
        }
        if (registeredTypes[type]) {
            return
        }
        if (typeDependencies[type]) {
            typeDependencies[type].forEach(visit);
            return
        }
        unboundTypes.push(type);
        seen[type] = true
    }
    types.forEach(visit);
    throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]))
}

function __embind_register_class_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, fn) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    methodName = readLatin1String(methodName);
    rawInvoker = requireFunction(invokerSignature, rawInvoker);
    whenDependentTypesAreResolved([], [rawClassType], (function(classType) {
        classType = classType[0];
        var humanName = classType.name + "." + methodName;

        function unboundTypesHandler() {
            throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes)
        }
        var proto = classType.registeredClass.constructor;
        if (undefined === proto[methodName]) {
            unboundTypesHandler.argCount = argCount - 1;
            proto[methodName] = unboundTypesHandler
        } else {
            ensureOverloadTable(proto, methodName, humanName);
            proto[methodName].overloadTable[argCount - 1] = unboundTypesHandler
        }
        whenDependentTypesAreResolved([], rawArgTypes, (function(argTypes) {
            var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
            var func = craftInvokerFunction(humanName, invokerArgsArray, null, rawInvoker, fn);
            if (undefined === proto[methodName].overloadTable) {
                func.argCount = argCount - 1;
                proto[methodName] = func
            } else {
                proto[methodName].overloadTable[argCount - 1] = func
            }
            return []
        }));
        return []
    }))
}
var _environ = STATICTOP;
STATICTOP += 16;

function ___buildEnvironment(env) {
    var MAX_ENV_VALUES = 64;
    var TOTAL_ENV_SIZE = 1024;
    var poolPtr;
    var envPtr;
    if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        ENV["USER"] = ENV["LOGNAME"] = "web_user";
        ENV["PATH"] = "/";
        ENV["PWD"] = "/";
        ENV["HOME"] = "/home/web_user";
        ENV["LANG"] = "C";
        ENV["_"] = Module["thisProgram"];
        poolPtr = allocate(TOTAL_ENV_SIZE, "i8", ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4, "i8*", ALLOC_STATIC);
        HEAP32[envPtr >> 2] = poolPtr;
        HEAP32[_environ >> 2] = envPtr
    } else {
        envPtr = HEAP32[_environ >> 2];
        poolPtr = HEAP32[envPtr >> 2]
    }
    var strings = [];
    var totalSize = 0;
    for (var key in env) {
        if (typeof env[key] === "string") {
            var line = key + "=" + env[key];
            strings.push(line);
            totalSize += line.length
        }
    }
    if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error("Environment size exceeded TOTAL_ENV_SIZE!")
    }
    var ptrSize = 4;
    for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[envPtr + i * ptrSize >> 2] = poolPtr;
        poolPtr += line.length + 1
    }
    HEAP32[envPtr + strings.length * ptrSize >> 2] = 0
}
var ENV = {};

function _getenv(name) {
    if (name === 0) return 0;
    name = Pointer_stringify(name);
    if (!ENV.hasOwnProperty(name)) return 0;
    if (_getenv.ret) _free(_getenv.ret);
    _getenv.ret = allocate(intArrayFromString(ENV[name]), "i8", ALLOC_NORMAL);
    return _getenv.ret
}

function _gettimeofday(ptr) {
    var now = Date.now();
    HEAP32[ptr >> 2] = now / 1e3 | 0;
    HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
    return 0
}

function ___map_file(pathname, size) {
    ___setErrNo(ERRNO_CODES.EPERM);
    return -1
}

function _llvm_trap() {
    abort("trap!")
}

function __emval_run_destructors(handle) {
    var destructors = emval_handle_array[handle].value;
    runDestructors(destructors);
    __emval_decref(handle)
}

function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
    structRegistrations[rawType] = {
        name: readLatin1String(name),
        rawConstructor: requireFunction(constructorSignature, rawConstructor),
        rawDestructor: requireFunction(destructorSignature, rawDestructor),
        fields: []
    }
}

function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
    return dest
}
Module["_memcpy"] = _memcpy;

function __embind_register_enum_value(rawEnumType, name, enumValue) {
    var enumType = requireRegisteredType(rawEnumType, "enum");
    name = readLatin1String(name);
    var Enum = enumType.constructor;
    var Value = Object.create(enumType.constructor.prototype, {
        value: {
            value: enumValue
        },
        constructor: {
            value: createNamedFunction(enumType.name + "_" + name, (function() {}))
        }
    });
    Enum.values[enumValue] = Value;
    Enum[name] = Value
}
var tupleRegistrations = {};

function __embind_finalize_value_array(rawTupleType) {
    var reg = tupleRegistrations[rawTupleType];
    delete tupleRegistrations[rawTupleType];
    var elements = reg.elements;
    var elementsLength = elements.length;
    var elementTypes = elements.map((function(elt) {
        return elt.getterReturnType
    })).concat(elements.map((function(elt) {
        return elt.setterArgumentType
    })));
    var rawConstructor = reg.rawConstructor;
    var rawDestructor = reg.rawDestructor;
    whenDependentTypesAreResolved([rawTupleType], elementTypes, (function(elementTypes) {
        elements.forEach((function(elt, i) {
            var getterReturnType = elementTypes[i];
            var getter = elt.getter;
            var getterContext = elt.getterContext;
            var setterArgumentType = elementTypes[i + elementsLength];
            var setter = elt.setter;
            var setterContext = elt.setterContext;
            elt.read = (function(ptr) {
                return getterReturnType["fromWireType"](getter(getterContext, ptr))
            });
            elt.write = (function(ptr, o) {
                var destructors = [];
                setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
                runDestructors(destructors)
            })
        }));
        return [{
            name: reg.name,
            "fromWireType": (function(ptr) {
                var rv = new Array(elementsLength);
                for (var i = 0; i < elementsLength; ++i) {
                    rv[i] = elements[i].read(ptr)
                }
                rawDestructor(ptr);
                return rv
            }),
            "toWireType": (function(destructors, o) {
                if (elementsLength !== o.length) {
                    throw new TypeError("Incorrect number of tuple elements for " + reg.name + ": expected=" + elementsLength + ", actual=" + o.length)
                }
                var ptr = rawConstructor();
                for (var i = 0; i < elementsLength; ++i) {
                    elements[i].write(ptr, o[i])
                }
                if (destructors !== null) {
                    destructors.push(rawDestructor, ptr)
                }
                return ptr
            }),
            "argPackAdvance": 8,
            "readValueFromPointer": simpleReadValueFromPointer,
            destructorFunction: rawDestructor
        }]
    }))
}
Module["_sbrk"] = _sbrk;
Module["_memmove"] = _memmove;

function ___cxa_allocate_exception(size) {
    return _malloc(size)
}

function ___gxx_personality_v0() {}

function _pthread_mutex_destroy() {}

function _pthread_cond_wait() {
    return 0
}
Module["_llvm_bswap_i32"] = _llvm_bswap_i32;

function __embind_register_memory_view(rawType, dataTypeIndex, name) {
    var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
    var TA = typeMapping[dataTypeIndex];

    function decodeMemoryView(handle) {
        handle = handle >> 2;
        var heap = HEAPU32;
        var size = heap[handle];
        var data = heap[handle + 1];
        return new TA(heap["buffer"], data, size)
    }
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": decodeMemoryView,
        "argPackAdvance": 8,
        "readValueFromPointer": decodeMemoryView
    }, {
        ignoreDuplicateRegistrations: true
    })
}
var _llvm_pow_f64 = Math_pow;

function validateThis(this_, classType, humanName) {
    if (!(this_ instanceof Object)) {
        throwBindingError(humanName + ' with invalid "this": ' + this_)
    }
    if (!(this_ instanceof classType.registeredClass.constructor)) {
        throwBindingError(humanName + ' incompatible with "this" of type ' + this_.constructor.name)
    }
    if (!this_.$$.ptr) {
        throwBindingError("cannot call emscripten binding method " + humanName + " on deleted object")
    }
    return upcastPointer(this_.$$.ptr, this_.$$.ptrType.registeredClass, classType.registeredClass)
}

function __embind_register_class_property(classType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
    fieldName = readLatin1String(fieldName);
    getter = requireFunction(getterSignature, getter);
    whenDependentTypesAreResolved([], [classType], (function(classType) {
        classType = classType[0];
        var humanName = classType.name + "." + fieldName;
        var desc = {
            get: (function() {
                throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType])
            }),
            enumerable: true,
            configurable: true
        };
        if (setter) {
            desc.set = (function() {
                throwUnboundTypeError("Cannot access " + humanName + " due to unbound types", [getterReturnType, setterArgumentType])
            })
        } else {
            desc.set = (function(v) {
                throwBindingError(humanName + " is a read-only property")
            })
        }
        Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
        whenDependentTypesAreResolved([], setter ? [getterReturnType, setterArgumentType] : [getterReturnType], (function(types) {
            var getterReturnType = types[0];
            var desc = {
                get: (function() {
                    var ptr = validateThis(this, classType, humanName + " getter");
                    return getterReturnType["fromWireType"](getter(getterContext, ptr))
                }),
                enumerable: true
            };
            if (setter) {
                setter = requireFunction(setterSignature, setter);
                var setterArgumentType = types[1];
                desc.set = (function(v) {
                    var ptr = validateThis(this, classType, humanName + " setter");
                    var destructors = [];
                    setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, v));
                    runDestructors(destructors)
                })
            }
            Object.defineProperty(classType.registeredClass.instancePrototype, fieldName, desc);
            return []
        }));
        return []
    }))
}

function ___syscall40(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var path = SYSCALLS.getStr();
        FS.rmdir(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function __emval_incref(handle) {
    if (handle > 4) {
        emval_handle_array[handle].refcount += 1
    }
}

function _pthread_mutexattr_settype() {}

function __embind_register_value_array(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
    tupleRegistrations[rawType] = {
        name: readLatin1String(name),
        rawConstructor: requireFunction(constructorSignature, rawConstructor),
        rawDestructor: requireFunction(destructorSignature, rawDestructor),
        elements: []
    }
}

function getShiftFromSize(size) {
    switch (size) {
        case 1:
            return 0;
        case 2:
            return 1;
        case 4:
            return 2;
        case 8:
            return 3;
        default:
            throw new TypeError("Unknown type size: " + size)
    }
}

function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": (function(wt) {
            return !!wt
        }),
        "toWireType": (function(destructors, o) {
            return o ? trueValue : falseValue
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": (function(pointer) {
            var heap;
            if (size === 1) {
                heap = HEAP8
            } else if (size === 2) {
                heap = HEAP16
            } else if (size === 4) {
                heap = HEAP32
            } else {
                throw new TypeError("Unknown boolean type size: " + name)
            }
            return this["fromWireType"](heap[pointer >> shift])
        }),
        destructorFunction: null
    })
}

function ___assert_fail(condition, filename, line, func) {
    ABORT = true;
    throw "Assertion failed: " + Pointer_stringify(condition) + ", at: " + [filename ? Pointer_stringify(filename) : "unknown filename", line, func ? Pointer_stringify(func) : "unknown function"] + " at " + stackTrace()
}

function __embind_register_void(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        isVoid: true,
        name: name,
        "argPackAdvance": 0,
        "fromWireType": (function() {
            return undefined
        }),
        "toWireType": (function(destructors, o) {
            return undefined
        })
    })
}
Module["_memset"] = _memset;

function __isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function __arraySum(array, index) {
    var sum = 0;
    for (var i = 0; i <= index; sum += array[i++]);
    return sum
}
var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function __addDays(date, days) {
    var newDate = new Date(date.getTime());
    while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
                newDate.setMonth(currentMonth + 1)
            } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear() + 1)
            }
        } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate
        }
    }
    return newDate
}

function _strftime(s, maxsize, format, tm) {
    var tm_zone = HEAP32[tm + 40 >> 2];
    var date = {
        tm_sec: HEAP32[tm >> 2],
        tm_min: HEAP32[tm + 4 >> 2],
        tm_hour: HEAP32[tm + 8 >> 2],
        tm_mday: HEAP32[tm + 12 >> 2],
        tm_mon: HEAP32[tm + 16 >> 2],
        tm_year: HEAP32[tm + 20 >> 2],
        tm_wday: HEAP32[tm + 24 >> 2],
        tm_yday: HEAP32[tm + 28 >> 2],
        tm_isdst: HEAP32[tm + 32 >> 2],
        tm_gmtoff: HEAP32[tm + 36 >> 2],
        tm_zone: tm_zone ? Pointer_stringify(tm_zone) : ""
    };
    var pattern = Pointer_stringify(format);
    var EXPANSION_RULES_1 = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S"
    };
    for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule])
    }
    var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function leadingSomething(value, digits, character) {
        var str = typeof value === "number" ? value.toString() : value || "";
        while (str.length < digits) {
            str = character[0] + str
        }
        return str
    }

    function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0")
    }

    function compareByDay(date1, date2) {
        function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                compare = sgn(date1.getDate() - date2.getDate())
            }
        }
        return compare
    }

    function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
            case 0:
                return new Date(janFourth.getFullYear() - 1, 11, 29);
            case 1:
                return janFourth;
            case 2:
                return new Date(janFourth.getFullYear(), 0, 3);
            case 3:
                return new Date(janFourth.getFullYear(), 0, 2);
            case 4:
                return new Date(janFourth.getFullYear(), 0, 1);
            case 5:
                return new Date(janFourth.getFullYear() - 1, 11, 31);
            case 6:
                return new Date(janFourth.getFullYear() - 1, 11, 30)
        }
    }

    function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                return thisDate.getFullYear() + 1
            } else {
                return thisDate.getFullYear()
            }
        } else {
            return thisDate.getFullYear() - 1
        }
    }
    var EXPANSION_RULES_2 = {
        "%a": (function(date) {
            return WEEKDAYS[date.tm_wday].substring(0, 3)
        }),
        "%A": (function(date) {
            return WEEKDAYS[date.tm_wday]
        }),
        "%b": (function(date) {
            return MONTHS[date.tm_mon].substring(0, 3)
        }),
        "%B": (function(date) {
            return MONTHS[date.tm_mon]
        }),
        "%C": (function(date) {
            var year = date.tm_year + 1900;
            return leadingNulls(year / 100 | 0, 2)
        }),
        "%d": (function(date) {
            return leadingNulls(date.tm_mday, 2)
        }),
        "%e": (function(date) {
            return leadingSomething(date.tm_mday, 2, " ")
        }),
        "%g": (function(date) {
            return getWeekBasedYear(date).toString().substring(2)
        }),
        "%G": (function(date) {
            return getWeekBasedYear(date)
        }),
        "%H": (function(date) {
            return leadingNulls(date.tm_hour, 2)
        }),
        "%I": (function(date) {
            var twelveHour = date.tm_hour;
            if (twelveHour == 0) twelveHour = 12;
            else if (twelveHour > 12) twelveHour -= 12;
            return leadingNulls(twelveHour, 2)
        }),
        "%j": (function(date) {
            return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
        }),
        "%m": (function(date) {
            return leadingNulls(date.tm_mon + 1, 2)
        }),
        "%M": (function(date) {
            return leadingNulls(date.tm_min, 2)
        }),
        "%n": (function() {
            return "\n"
        }),
        "%p": (function(date) {
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return "AM"
            } else {
                return "PM"
            }
        }),
        "%S": (function(date) {
            return leadingNulls(date.tm_sec, 2)
        }),
        "%t": (function() {
            return "\t"
        }),
        "%u": (function(date) {
            var day = new Date(date.tm_year + 1900, date.tm_mon + 1, date.tm_mday, 0, 0, 0, 0);
            return day.getDay() || 7
        }),
        "%U": (function(date) {
            var janFirst = new Date(date.tm_year + 1900, 0, 1);
            var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstSunday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstSunday, janFirst) === 0 ? "01" : "00"
        }),
        "%V": (function(date) {
            var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
            var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
            var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
            var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
            var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
            if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                return "53"
            }
            if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                return "01"
            }
            var daysDifference;
            if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
            } else {
                daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate()
            }
            return leadingNulls(Math.ceil(daysDifference / 7), 2)
        }),
        "%w": (function(date) {
            var day = new Date(date.tm_year + 1900, date.tm_mon + 1, date.tm_mday, 0, 0, 0, 0);
            return day.getDay()
        }),
        "%W": (function(date) {
            var janFirst = new Date(date.tm_year, 0, 1);
            var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstMonday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstMonday, janFirst) === 0 ? "01" : "00"
        }),
        "%y": (function(date) {
            return (date.tm_year + 1900).toString().substring(2)
        }),
        "%Y": (function(date) {
            return date.tm_year + 1900
        }),
        "%z": (function(date) {
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            off = off / 60 * 100 + off % 60;
            return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
        }),
        "%Z": (function(date) {
            return date.tm_zone
        }),
        "%%": (function() {
            return "%"
        })
    };
    for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
            pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date))
        }
    }
    var bytes = intArrayFromString(pattern, false);
    if (bytes.length > maxsize) {
        return 0
    }
    writeArrayToMemory(bytes, s);
    return bytes.length - 1
}

function _strftime_l(s, maxsize, format, tm) {
    return _strftime(s, maxsize, format, tm)
}

function _abort() {
    Module["abort"]()
}

function requireHandle(handle) {
    if (!handle) {
        throwBindingError("Cannot use deleted val. handle = " + handle)
    }
    return emval_handle_array[handle].value
}

function __emval_as(handle, returnType, destructorsRef) {
    handle = requireHandle(handle);
    returnType = requireRegisteredType(returnType, "emval::as");
    var destructors = [];
    var rd = __emval_register(destructors);
    HEAP32[destructorsRef >> 2] = rd;
    return returnType["toWireType"](destructors, handle)
}

function _pthread_once(ptr, func) {
    if (!_pthread_once.seen) _pthread_once.seen = {};
    if (ptr in _pthread_once.seen) return;
    Module["dynCall_v"](func);
    _pthread_once.seen[ptr] = 1
}

function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
    structRegistrations[structType].fields.push({
        fieldName: readLatin1String(fieldName),
        getterReturnType: getterReturnType,
        getter: requireFunction(getterSignature, getter),
        getterContext: getterContext,
        setterArgumentType: setterArgumentType,
        setter: requireFunction(setterSignature, setter),
        setterContext: setterContext
    })
}

function ClassHandle_isAliasOf(other) {
    if (!(this instanceof ClassHandle)) {
        return false
    }
    if (!(other instanceof ClassHandle)) {
        return false
    }
    var leftClass = this.$$.ptrType.registeredClass;
    var left = this.$$.ptr;
    var rightClass = other.$$.ptrType.registeredClass;
    var right = other.$$.ptr;
    while (leftClass.baseClass) {
        left = leftClass.upcast(left);
        leftClass = leftClass.baseClass
    }
    while (rightClass.baseClass) {
        right = rightClass.upcast(right);
        rightClass = rightClass.baseClass
    }
    return leftClass === rightClass && left === right
}

function shallowCopyInternalPointer(o) {
    return {
        count: o.count,
        deleteScheduled: o.deleteScheduled,
        preservePointerOnDelete: o.preservePointerOnDelete,
        ptr: o.ptr,
        ptrType: o.ptrType,
        smartPtr: o.smartPtr,
        smartPtrType: o.smartPtrType
    }
}

function throwInstanceAlreadyDeleted(obj) {
    function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name
    }
    throwBindingError(getInstanceTypeName(obj) + " instance already deleted")
}

function ClassHandle_clone() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this)
    }
    if (this.$$.preservePointerOnDelete) {
        this.$$.count.value += 1;
        return this
    } else {
        var clone = Object.create(Object.getPrototypeOf(this), {
            $$: {
                value: shallowCopyInternalPointer(this.$$)
            }
        });
        clone.$$.count.value += 1;
        clone.$$.deleteScheduled = false;
        return clone
    }
}

function runDestructor(handle) {
    var $$ = handle.$$;
    if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr)
    } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr)
    }
}

function ClassHandle_delete() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this)
    }
    if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError("Object already scheduled for deletion")
    }
    this.$$.count.value -= 1;
    var toDelete = 0 === this.$$.count.value;
    if (toDelete) {
        runDestructor(this)
    }
    if (!this.$$.preservePointerOnDelete) {
        this.$$.smartPtr = undefined;
        this.$$.ptr = undefined
    }
}

function ClassHandle_isDeleted() {
    return !this.$$.ptr
}

function ClassHandle_deleteLater() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this)
    }
    if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError("Object already scheduled for deletion")
    }
    deletionQueue.push(this);
    if (deletionQueue.length === 1 && delayFunction) {
        delayFunction(flushPendingDeletes)
    }
    this.$$.deleteScheduled = true;
    return this
}

function init_ClassHandle() {
    ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
    ClassHandle.prototype["clone"] = ClassHandle_clone;
    ClassHandle.prototype["delete"] = ClassHandle_delete;
    ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
    ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater
}

function ClassHandle() {}

function exposePublicSymbol(name, value, numArguments) {
    if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
            throwBindingError("Cannot register public name '" + name + "' twice")
        }
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
            throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!")
        }
        Module[name].overloadTable[numArguments] = value
    } else {
        Module[name] = value;
        if (undefined !== numArguments) {
            Module[name].numArguments = numArguments
        }
    }
}

function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
    this.name = name;
    this.constructor = constructor;
    this.instancePrototype = instancePrototype;
    this.rawDestructor = rawDestructor;
    this.baseClass = baseClass;
    this.getActualType = getActualType;
    this.upcast = upcast;
    this.downcast = downcast;
    this.pureVirtualFunctions = []
}

function replacePublicSymbol(name, value, numArguments) {
    if (!Module.hasOwnProperty(name)) {
        throwInternalError("Replacing nonexistant public symbol")
    }
    if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value
    } else {
        Module[name] = value;
        Module[name].argCount = numArguments
    }
}

function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
    name = readLatin1String(name);
    getActualType = requireFunction(getActualTypeSignature, getActualType);
    if (upcast) {
        upcast = requireFunction(upcastSignature, upcast)
    }
    if (downcast) {
        downcast = requireFunction(downcastSignature, downcast)
    }
    rawDestructor = requireFunction(destructorSignature, rawDestructor);
    var legalFunctionName = makeLegalFunctionName(name);
    exposePublicSymbol(legalFunctionName, (function() {
        throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [baseClassRawType])
    }));
    whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [], (function(base) {
        base = base[0];
        var baseClass;
        var basePrototype;
        if (baseClassRawType) {
            baseClass = base.registeredClass;
            basePrototype = baseClass.instancePrototype
        } else {
            basePrototype = ClassHandle.prototype
        }
        var constructor = createNamedFunction(legalFunctionName, (function() {
            if (Object.getPrototypeOf(this) !== instancePrototype) {
                throw new BindingError("Use 'new' to construct " + name)
            }
            if (undefined === registeredClass.constructor_body) {
                throw new BindingError(name + " has no accessible constructor")
            }
            var body = registeredClass.constructor_body[arguments.length];
            if (undefined === body) {
                throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!")
            }
            return body.apply(this, arguments)
        }));
        var instancePrototype = Object.create(basePrototype, {
            constructor: {
                value: constructor
            }
        });
        constructor.prototype = instancePrototype;
        var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
        var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
        var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
        var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
        registeredPointers[rawType] = {
            pointerType: pointerConverter,
            constPointerType: constPointerConverter
        };
        replacePublicSymbol(legalFunctionName, constructor);
        return [referenceConverter, pointerConverter, constPointerConverter]
    }))
}

function ___lock() {}

function ___unlock() {}

function _pthread_mutexattr_init() {}

function _pthread_getspecific(key) {
    return PTHREAD_SPECIFIC[key] || 0
}

function _embind_repr(v) {
    if (v === null) {
        return "null"
    }
    var t = typeof v;
    if (t === "object" || t === "array" || t === "function") {
        return v.toString()
    } else {
        return "" + v
    }
}

function integerReadValueFromPointer(name, shift, signed) {
    switch (shift) {
        case 0:
            return signed ? function readS8FromPointer(pointer) {
                return HEAP8[pointer]
            } : function readU8FromPointer(pointer) {
                return HEAPU8[pointer]
            };
        case 1:
            return signed ? function readS16FromPointer(pointer) {
                return HEAP16[pointer >> 1]
            } : function readU16FromPointer(pointer) {
                return HEAPU16[pointer >> 1]
            };
        case 2:
            return signed ? function readS32FromPointer(pointer) {
                return HEAP32[pointer >> 2]
            } : function readU32FromPointer(pointer) {
                return HEAPU32[pointer >> 2]
            };
        default:
            throw new TypeError("Unknown integer type: " + name)
    }
}

function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
    name = readLatin1String(name);
    if (maxRange === -1) {
        maxRange = 4294967295
    }
    var shift = getShiftFromSize(size);
    var fromWireType = (function(value) {
        return value
    });
    if (minRange === 0) {
        var bitshift = 32 - 8 * size;
        fromWireType = (function(value) {
            return value << bitshift >>> bitshift
        })
    }
    var isUnsignedType = name.indexOf("unsigned") != -1;
    registerType(primitiveType, {
        name: name,
        "fromWireType": fromWireType,
        "toWireType": (function(destructors, value) {
            if (typeof value !== "number" && typeof value !== "boolean") {
                throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
            }
            if (value < minRange || value > maxRange) {
                throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!")
            }
            return isUnsignedType ? value >>> 0 : value | 0
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
        destructorFunction: null
    })
}

function __emval_get_property(handle, key) {
    handle = requireHandle(handle);
    key = requireHandle(key);
    return __emval_register(handle[key])
}

function __embind_register_emval(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": (function(handle) {
            var rv = emval_handle_array[handle].value;
            __emval_decref(handle);
            return rv
        }),
        "toWireType": (function(destructors, value) {
            return __emval_register(value)
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": simpleReadValueFromPointer,
        destructorFunction: null
    })
}

function _pthread_setspecific(key, value) {
    if (!(key in PTHREAD_SPECIFIC)) {
        return ERRNO_CODES.EINVAL
    }
    PTHREAD_SPECIFIC[key] = value;
    return 0
}

function __embind_register_value_array_element(rawTupleType, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
    tupleRegistrations[rawTupleType].elements.push({
        getterReturnType: getterReturnType,
        getter: requireFunction(getterSignature, getter),
        getterContext: getterContext,
        setterArgumentType: setterArgumentType,
        setter: requireFunction(setterSignature, setter),
        setterContext: setterContext
    })
}

function ___cxa_pure_virtual() {
    ABORT = true;
    throw "Pure virtual function called!"
}

function floatReadValueFromPointer(name, shift) {
    switch (shift) {
        case 2:
            return (function(pointer) {
                return this["fromWireType"](HEAPF32[pointer >> 2])
            });
        case 3:
            return (function(pointer) {
                return this["fromWireType"](HEAPF64[pointer >> 3])
            });
        default:
            throw new TypeError("Unknown float type: " + name)
    }
}

function __embind_register_float(rawType, name, size) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": (function(value) {
            return value
        }),
        "toWireType": (function(destructors, value) {
            if (typeof value !== "number" && typeof value !== "boolean") {
                throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
            }
            return value
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": floatReadValueFromPointer(name, shift),
        destructorFunction: null
    })
}

function ___syscall10(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var path = SYSCALLS.getStr();
        FS.unlink(path);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function _emscripten_get_now() {
    abort()
}

function _emscripten_get_now_is_monotonic() {
    return ENVIRONMENT_IS_NODE || typeof dateNow !== "undefined" || (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && self["performance"] && self["performance"]["now"]
}

function _clock_gettime(clk_id, tp) {
    var now;
    if (clk_id === 0) {
        now = Date.now()
    } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
        now = _emscripten_get_now()
    } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1
    }
    HEAP32[tp >> 2] = now / 1e3 | 0;
    HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
    return 0
}

function ___clock_gettime() {
    return _clock_gettime.apply(null, arguments)
}

function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
    var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    name = readLatin1String(name);
    rawInvoker = requireFunction(signature, rawInvoker);
    exposePublicSymbol(name, (function() {
        throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes)
    }), argCount - 1);
    whenDependentTypesAreResolved([], argTypes, (function(argTypes) {
        var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
        replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
        return []
    }))
}

function __embind_register_constant(name, type, value) {
    name = readLatin1String(name);
    whenDependentTypesAreResolved([], [type], (function(type) {
        type = type[0];
        Module[name] = type["fromWireType"](value);
        return []
    }))
}

function ___cxa_begin_catch(ptr) {
    var info = EXCEPTIONS.infos[ptr];
    if (info && !info.caught) {
        info.caught = true;
        __ZSt18uncaught_exceptionv.uncaught_exception--
    }
    if (info) info.rethrown = false;
    EXCEPTIONS.caught.push(ptr);
    EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
    return ptr
}

function ___syscall3(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            buf = SYSCALLS.get(),
            count = SYSCALLS.get();
        return FS.read(stream, HEAP8, buf, count)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall5(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var pathname = SYSCALLS.getStr(),
            flags = SYSCALLS.get(),
            mode = SYSCALLS.get();
        var stream = FS.open(pathname, flags, mode);
        return stream.fd
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall4(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            buf = SYSCALLS.get(),
            count = SYSCALLS.get();
        return FS.write(stream, HEAP8, buf, count)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall6(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD();
        FS.close(stream);
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function enumReadValueFromPointer(name, shift, signed) {
    switch (shift) {
        case 0:
            return (function(pointer) {
                var heap = signed ? HEAP8 : HEAPU8;
                return this["fromWireType"](heap[pointer])
            });
        case 1:
            return (function(pointer) {
                var heap = signed ? HEAP16 : HEAPU16;
                return this["fromWireType"](heap[pointer >> 1])
            });
        case 2:
            return (function(pointer) {
                var heap = signed ? HEAP32 : HEAPU32;
                return this["fromWireType"](heap[pointer >> 2])
            });
        default:
            throw new TypeError("Unknown integer type: " + name)
    }
}

function __embind_register_enum(rawType, name, size, isSigned) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);

    function ctor() {}
    ctor.values = {};
    registerType(rawType, {
        name: name,
        constructor: ctor,
        "fromWireType": (function(c) {
            return this.constructor.values[c]
        }),
        "toWireType": (function(destructors, c) {
            return c.value
        }),
        "argPackAdvance": 8,
        "readValueFromPointer": enumReadValueFromPointer(name, shift, isSigned),
        destructorFunction: null
    });
    exposePublicSymbol(name, ctor)
}

function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    invoker = requireFunction(invokerSignature, invoker);
    whenDependentTypesAreResolved([], [rawClassType], (function(classType) {
        classType = classType[0];
        var humanName = "constructor " + classType.name;
        if (undefined === classType.registeredClass.constructor_body) {
            classType.registeredClass.constructor_body = []
        }
        if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
            throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!")
        }
        classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
            throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes)
        };
        whenDependentTypesAreResolved([], rawArgTypes, (function(argTypes) {
            classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
                if (arguments.length !== argCount - 1) {
                    throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1))
                }
                var destructors = [];
                var args = new Array(argCount);
                args[0] = rawConstructor;
                for (var i = 1; i < argCount; ++i) {
                    args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1])
                }
                var ptr = invoker.apply(null, args);
                runDestructors(destructors);
                return argTypes[0]["fromWireType"](ptr)
            };
            return []
        }));
        return []
    }))
}

function ___syscall140(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            offset_high = SYSCALLS.get(),
            offset_low = SYSCALLS.get(),
            result = SYSCALLS.get(),
            whence = SYSCALLS.get();
        var offset = offset_low;
        FS.llseek(stream, offset, whence);
        HEAP32[result >> 2] = stream.position;
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    methodName = readLatin1String(methodName);
    rawInvoker = requireFunction(invokerSignature, rawInvoker);
    whenDependentTypesAreResolved([], [rawClassType], (function(classType) {
        classType = classType[0];
        var humanName = classType.name + "." + methodName;
        if (isPureVirtual) {
            classType.registeredClass.pureVirtualFunctions.push(methodName)
        }

        function unboundTypesHandler() {
            throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes)
        }
        var proto = classType.registeredClass.instancePrototype;
        var method = proto[methodName];
        if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
            unboundTypesHandler.argCount = argCount - 2;
            unboundTypesHandler.className = classType.name;
            proto[methodName] = unboundTypesHandler
        } else {
            ensureOverloadTable(proto, methodName, humanName);
            proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler
        }
        whenDependentTypesAreResolved([], rawArgTypes, (function(argTypes) {
            var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
            if (undefined === proto[methodName].overloadTable) {
                memberFunction.argCount = argCount - 2;
                proto[methodName] = memberFunction
            } else {
                proto[methodName].overloadTable[argCount - 2] = memberFunction
            }
            return []
        }));
        return []
    }))
}

function ___syscall146(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            iov = SYSCALLS.get(),
            iovcnt = SYSCALLS.get();
        return SYSCALLS.doWritev(stream, iov, iovcnt)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall221(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            cmd = SYSCALLS.get();
        switch (cmd) {
            case 0:
                {
                    var arg = SYSCALLS.get();
                    if (arg < 0) {
                        return -ERRNO_CODES.EINVAL
                    }
                    var newStream;
                    newStream = FS.open(stream.path, stream.flags, 0, arg);
                    return newStream.fd
                };
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4:
                {
                    var arg = SYSCALLS.get();
                    stream.flags |= arg;
                    return 0
                };
            case 12:
            case 12:
                {
                    var arg = SYSCALLS.get();
                    var offset = 0;
                    HEAP16[arg + offset >> 1] = 2;
                    return 0
                };
            case 13:
            case 14:
            case 13:
            case 14:
                return 0;
            case 16:
            case 8:
                return -ERRNO_CODES.EINVAL;
            case 9:
                ___setErrNo(ERRNO_CODES.EINVAL);
                return -1;
            default:
                {
                    return -ERRNO_CODES.EINVAL
                }
        }
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}

function ___syscall145(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            iov = SYSCALLS.get(),
            iovcnt = SYSCALLS.get();
        return SYSCALLS.doReadv(stream, iov, iovcnt)
    } catch (e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno
    }
}
var ___dso_handle = STATICTOP;
STATICTOP += 16;
embind_init_charCodes();
init_emval();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
FS.staticInit();
__ATINIT__.unshift((function() {
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init()
}));
__ATMAIN__.push((function() {
    FS.ignorePermissions = false
}));
__ATEXIT__.push((function() {
    FS.quit()
}));
Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
__ATINIT__.unshift((function() {
    TTY.init()
}));
__ATEXIT__.push((function() {
    TTY.shutdown()
}));
if (ENVIRONMENT_IS_NODE) {
    var fs = require("fs");
    var NODEJS_PATH = require("path");
    NODEFS.staticInit()
}
init_RegisteredPointer();
init_embind();
UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
___buildEnvironment(ENV);
init_ClassHandle();
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function _emscripten_get_now_actual() {
        var t = process["hrtime"]();
        return t[0] * 1e3 + t[1] / 1e6
    }
} else if (typeof dateNow !== "undefined") {
    _emscripten_get_now = dateNow
} else if (typeof self === "object" && self["performance"] && typeof self["performance"]["now"] === "function") {
    _emscripten_get_now = (function() {
        return self["performance"]["now"]()
    })
} else if (typeof performance === "object" && typeof performance["now"] === "function") {
    _emscripten_get_now = (function() {
        return performance["now"]()
    })
} else {
    _emscripten_get_now = Date.now
}
DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
staticSealed = true;
Module["wasmTableSize"] = 8300;
Module["wasmMaxTableSize"] = 8300;

function invoke_viiifiii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiifiii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiiid(index, a1, a2, a3, a4, a5, a6) {
    try {
        return Module["dynCall_iiiiiid"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiddd(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiiiddd"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiidiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiidiii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiddi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiiiddi"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiidiii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiidiii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
    try {
        return Module["dynCall_iiiiiii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiidddiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    try {
        Module["dynCall_viiiidddiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiffiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiffiii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    try {
        Module["dynCall_viiiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iidd(index, a1, a2, a3) {
    try {
        return Module["dynCall_iidd"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiiiiid(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    try {
        Module["dynCall_viiiiiiiiiid"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiffii(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiffii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iidi(index, a1, a2, a3) {
    try {
        return Module["dynCall_iidi"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_dii(index, a1, a2) {
    try {
        return Module["dynCall_dii"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiifff(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiifff"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iifff(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_iifff"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vidi(index, a1, a2, a3) {
    try {
        Module["dynCall_vidi"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_fiiiiiiiid(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        return Module["dynCall_fiiiiiiiid"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiddii(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiddii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiddiddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viiiiddiddi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiifiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        return Module["dynCall_iiiiifiii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiidi(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiiiidi"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiddidddd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiddidddd"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiddi(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiiiddi"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiidi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiiiiiidi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_fii(index, a1, a2) {
    try {
        return Module["dynCall_fii"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiidii(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiidii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiiifii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiifiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        return Module["dynCall_iiifiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_di(index, a1) {
    try {
        return Module["dynCall_di"](index, a1)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiid(index, a1, a2, a3, a4, a5) {
    try {
        Module["dynCall_viiiid"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viifiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viifiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiidiiddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viiiidiiddi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiididii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiididii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        return Module["dynCall_diiiiiii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiiddiddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        return Module["dynCall_iiiiiddiddi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viidddddi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viidddddi"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_fiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        return Module["dynCall_fiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiddiiid(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiiddiiid"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiidddddi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        return Module["dynCall_iiidddddi"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diidi(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_diidi"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiiiiiddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
    try {
        Module["dynCall_viiiiiiiiiiddi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        return Module["dynCall_iiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiid(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_iiiid"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiif(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_iiiif"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        return Module["dynCall_iiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiddiii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiddiii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiddiid(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiddiid"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiiiiididiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
    try {
        return Module["dynCall_iiiiiiiididiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiffiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        return Module["dynCall_iiiiffiii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iidddd(index, a1, a2, a3, a4, a5) {
    try {
        return Module["dynCall_iidddd"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viidiiid(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viidiiid"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiidiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiiidiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiidiiid(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiidiiid"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiif(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_viiif"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diiiddi(index, a1, a2, a3, a4, a5, a6) {
    try {
        return Module["dynCall_diiiddi"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiii(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_iiiii"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iifffffii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        return Module["dynCall_iifffffii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        return Module["dynCall_diiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiidd(index, a1, a2, a3, a4, a5) {
    try {
        Module["dynCall_viiidd"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiddddii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiiddddii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiid(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiiiid"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiddddii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viiiiddddii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vifi(index, a1, a2, a3) {
    try {
        Module["dynCall_vifi"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vifff(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_vifff"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiiiii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiidiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiidiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_fiii(index, a1, a2, a3) {
    try {
        return Module["dynCall_fiii"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiddidd(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiddidd"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiidi(index, a1, a2, a3, a4, a5) {
    try {
        Module["dynCall_viiidi"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiiidii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        return Module["dynCall_iiiiiidii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiddd(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_iiddd"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diiddi(index, a1, a2, a3, a4, a5) {
    try {
        return Module["dynCall_diiddi"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diii(index, a1, a2, a3) {
    try {
        return Module["dynCall_diii"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiddd(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiiddd"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiddidddd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viiiddidddd"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiiiiiid(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
    try {
        Module["dynCall_viiiiiiiiiiid"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiddidd(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiddidd"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiidiiiidi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viiidiiiidi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiddi(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiiddi"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_fiiii(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_fiiii"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
    try {
        return Module["dynCall_iiiiii"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiid(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_viiid"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiij(index, a1, a2, a3, a4, a5, a6) {
    try {
        return Module["dynCall_iiiiij"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiffi(index, a1, a2, a3, a4, a5, a6) {
    try {
        return Module["dynCall_iiiiffi"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viidii(index, a1, a2, a3, a4, a5) {
    try {
        Module["dynCall_viidii"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiff(index, a1, a2, a3, a4, a5) {
    try {
        Module["dynCall_viiiff"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
    try {
        return Module["dynCall_iiiiid"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiif(index, a1, a2, a3, a4, a5) {
    try {
        return Module["dynCall_iiiiif"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiii(index, a1, a2, a3, a4, a5) {
    try {
        Module["dynCall_viiiii"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vif(index, a1, a2) {
    try {
        Module["dynCall_vif"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vid(index, a1, a2) {
    try {
        Module["dynCall_vid"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiidi(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_iiidi"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiidd(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_iiidd"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vii(index, a1, a2) {
    try {
        Module["dynCall_vii"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiffff(index, a1, a2, a3, a4, a5) {
    try {
        return Module["dynCall_iiffff"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiifiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiifiii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viidd(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_viidd"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viifii(index, a1, a2, a3, a4, a5) {
    try {
        Module["dynCall_viifii"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viidi(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_viidi"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiffii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiiffii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiidiiddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiidiiddi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiidii(index, a1, a2, a3, a4, a5, a6) {
    try {
        return Module["dynCall_iiiidii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diiid(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_diiid"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiidddiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viiidddiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiid(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiiiiid"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiiiiiddi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diiii(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_diiii"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiidiiddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    try {
        Module["dynCall_viiiiidiiddi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiddddddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiddddddi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiifi(index, a1, a2, a3, a4, a5, a6) {
    try {
        return Module["dynCall_iiiiifi"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_fiiiiiiiiid(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        return Module["dynCall_fiiiiiiiiid"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiifii(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiifii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiidii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiiidii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_fiiiii(index, a1, a2, a3, a4, a5) {
    try {
        return Module["dynCall_fiiiii"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iif(index, a1, a2) {
    try {
        return Module["dynCall_iif"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiiid(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiiiiiiid"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiiiiii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiidi(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiiidi"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiddiiid(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viiiiddiiid"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiid(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiiiiid"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iii(index, a1, a2) {
    try {
        return Module["dynCall_iii"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiddii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiiddii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiidi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiiiidi"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vdiii(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_vdiii"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiddddddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        return Module["dynCall_iiiddddddi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiidiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    try {
        Module["dynCall_viiiiidiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viii(index, a1, a2, a3) {
    try {
        Module["dynCall_viii"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_v(index) {
    try {
        Module["dynCall_v"](index)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viid(index, a1, a2, a3) {
    try {
        Module["dynCall_viid"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiff(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiiiff"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viif(index, a1, a2, a3) {
    try {
        Module["dynCall_viif"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiddiid(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        return Module["dynCall_iiiddiid"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiidiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viiiiidiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vi(index, a1) {
    try {
        Module["dynCall_vi"](index, a1)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        return Module["dynCall_iiiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiidiiiidi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    try {
        Module["dynCall_viiiidiiiidi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_ii(index, a1) {
    try {
        return Module["dynCall_ii"](index, a1)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viijii(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viijii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiifff(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiiifff"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiiiddi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    try {
        Module["dynCall_viiiiiiiddi"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viifi(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_viifi"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiff(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_viiff"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiffi(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiiiffi"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiifi(index, a1, a2, a3, a4) {
    try {
        return Module["dynCall_iiifi"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vidii(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_vidii"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vididdii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_vididdii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiddiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viiiddiii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiffii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiiffii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiidiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
    try {
        Module["dynCall_viiiiiidiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_fiiiiii(index, a1, a2, a3, a4, a5, a6) {
    try {
        return Module["dynCall_fiiiiii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiifii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viiiifii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viffff(index, a1, a2, a3, a4, a5) {
    try {
        Module["dynCall_viffff"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiii(index, a1, a2, a3) {
    try {
        return Module["dynCall_iiii"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viididii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        Module["dynCall_viididii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiif(index, a1, a2, a3) {
    try {
        return Module["dynCall_iiif"](index, a1, a2, a3)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiffi(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiiffi"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diiiii(index, a1, a2, a3, a4, a5) {
    try {
        return Module["dynCall_diiiii"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diiiid(index, a1, a2, a3, a4, a5) {
    try {
        return Module["dynCall_diiiid"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
    try {
        return Module["dynCall_iiiiiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiifiii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        return Module["dynCall_iiiifiii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_fi(index, a1) {
    try {
        return Module["dynCall_fi"](index, a1)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiiffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiiiiffii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiidid(index, a1, a2, a3, a4, a5) {
    try {
        return Module["dynCall_iiidid"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iid(index, a1, a2) {
    try {
        return Module["dynCall_iid"](index, a1, a2)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_i(index) {
    try {
        return Module["dynCall_i"](index)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiidii(index, a1, a2, a3, a4, a5, a6, a7) {
    try {
        return Module["dynCall_iiiiidii"](index, a1, a2, a3, a4, a5, a6, a7)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_diiiiii(index, a1, a2, a3, a4, a5, a6) {
    try {
        return Module["dynCall_diiiiii"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vifffff(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_vifffff"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiiidiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    try {
        Module["dynCall_viiiiidiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        return Module["dynCall_iiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viididdii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    try {
        Module["dynCall_viididdii"](index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiii(index, a1, a2, a3, a4) {
    try {
        Module["dynCall_viiii"](index, a1, a2, a3, a4)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_viiiidd(index, a1, a2, a3, a4, a5, a6) {
    try {
        Module["dynCall_viiiidd"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_vidiii(index, a1, a2, a3, a4, a5) {
    try {
        Module["dynCall_vidiii"](index, a1, a2, a3, a4, a5)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}

function invoke_iifffff(index, a1, a2, a3, a4, a5, a6) {
    try {
        return Module["dynCall_iifffff"](index, a1, a2, a3, a4, a5, a6)
    } catch (e) {
        if (typeof e !== "number" && e !== "longjmp") throw e;
        Module["setThrew"](1, 0)
    }
}
Module.asmGlobalArg = {
    "Math": Math,
    "Int8Array": Int8Array,
    "Int16Array": Int16Array,
    "Int32Array": Int32Array,
    "Uint8Array": Uint8Array,
    "Uint16Array": Uint16Array,
    "Uint32Array": Uint32Array,
    "Float32Array": Float32Array,
    "Float64Array": Float64Array,
    "NaN": NaN,
    "Infinity": Infinity,
    "byteLength": byteLength
};
Module.asmLibraryArg = {
    "abort": abort,
    "assert": assert,
    "enlargeMemory": enlargeMemory,
    "getTotalMemory": getTotalMemory,
    "abortOnCannotGrowMemory": abortOnCannotGrowMemory,
    "invoke_viiifiii": invoke_viiifiii,
    "invoke_iiiiiid": invoke_iiiiiid,
    "invoke_viiiiddd": invoke_viiiiddd,
    "invoke_viiiidiii": invoke_viiiidiii,
    "invoke_viiiiiddi": invoke_viiiiiddi,
    "invoke_viiidiii": invoke_viiidiii,
    "invoke_iiiiiii": invoke_iiiiiii,
    "invoke_viiiidddiiii": invoke_viiiidddiiii,
    "invoke_viiiffiii": invoke_viiiffiii,
    "invoke_viiiiiiiiiii": invoke_viiiiiiiiiii,
    "invoke_iidd": invoke_iidd,
    "invoke_viiiiiiiiiid": invoke_viiiiiiiiiid,
    "invoke_viiffii": invoke_viiffii,
    "invoke_iidi": invoke_iidi,
    "invoke_dii": invoke_dii,
    "invoke_viiifff": invoke_viiifff,
    "invoke_iifff": invoke_iifff,
    "invoke_vidi": invoke_vidi,
    "invoke_fiiiiiiiid": invoke_fiiiiiiiid,
    "invoke_viiddii": invoke_viiddii,
    "invoke_viiiiddiddi": invoke_viiiiddiddi,
    "invoke_iiiiifiii": invoke_iiiiifiii,
    "invoke_viiiiidi": invoke_viiiiidi,
    "invoke_viiddidddd": invoke_viiddidddd,
    "invoke_viiiiddi": invoke_viiiiddi,
    "invoke_viiiiiiidi": invoke_viiiiiiidi,
    "invoke_fii": invoke_fii,
    "invoke_viiidii": invoke_viiidii,
    "invoke_viiiiifii": invoke_viiiiifii,
    "invoke_iiifiiiiiii": invoke_iiifiiiiiii,
    "invoke_di": invoke_di,
    "invoke_viiiid": invoke_viiiid,
    "invoke_viifiiiiiii": invoke_viifiiiiiii,
    "invoke_viiiidiiddi": invoke_viiiidiiddi,
    "invoke_viiididii": invoke_viiididii,
    "invoke_diiiiiii": invoke_diiiiiii,
    "invoke_iiiiiddiddi": invoke_iiiiiddiddi,
    "invoke_viidddddi": invoke_viidddddi,
    "invoke_fiiiiiii": invoke_fiiiiiii,
    "invoke_viiiddiiid": invoke_viiiddiiid,
    "invoke_iiidddddi": invoke_iiidddddi,
    "invoke_diidi": invoke_diidi,
    "invoke_viiiiiiiiiiddi": invoke_viiiiiiiiiiddi,
    "invoke_iiiiiiiiii": invoke_iiiiiiiiii,
    "invoke_iiiid": invoke_iiiid,
    "invoke_iiiif": invoke_iiiif,
    "invoke_iiiiiiii": invoke_iiiiiiii,
    "invoke_viiddiii": invoke_viiddiii,
    "invoke_viiddiid": invoke_viiddiid,
    "invoke_iiiiiiiididiii": invoke_iiiiiiiididiii,
    "invoke_iiiiffiii": invoke_iiiiffiii,
    "invoke_iidddd": invoke_iidddd,
    "invoke_viidiiid": invoke_viidiiid,
    "invoke_viiiidiiii": invoke_viiiidiiii,
    "invoke_viiidiiid": invoke_viiidiiid,
    "invoke_viiif": invoke_viiif,
    "invoke_diiiddi": invoke_diiiddi,
    "invoke_iiiii": invoke_iiiii,
    "invoke_iifffffii": invoke_iifffffii,
    "invoke_diiiiiiii": invoke_diiiiiiii,
    "invoke_viiidd": invoke_viiidd,
    "invoke_viiiddddii": invoke_viiiddddii,
    "invoke_viiiiid": invoke_viiiiid,
    "invoke_viiiiddddii": invoke_viiiiddddii,
    "invoke_vifi": invoke_vifi,
    "invoke_vifff": invoke_vifff,
    "invoke_viiiiii": invoke_viiiiii,
    "invoke_viiidiiii": invoke_viiidiiii,
    "invoke_fiii": invoke_fiii,
    "invoke_viiddidd": invoke_viiddidd,
    "invoke_viiidi": invoke_viiidi,
    "invoke_iiiiiidii": invoke_iiiiiidii,
    "invoke_iiddd": invoke_iiddd,
    "invoke_viiiiiiiiii": invoke_viiiiiiiiii,
    "invoke_diiddi": invoke_diiddi,
    "invoke_diii": invoke_diii,
    "invoke_viiiddd": invoke_viiiddd,
    "invoke_viiiddidddd": invoke_viiiddidddd,
    "invoke_viiiiiiiiiiid": invoke_viiiiiiiiiiid,
    "invoke_viiiddidd": invoke_viiiddidd,
    "invoke_viiidiiiidi": invoke_viiidiiiidi,
    "invoke_viiiddi": invoke_viiiddi,
    "invoke_fiiii": invoke_fiiii,
    "invoke_iiiiii": invoke_iiiiii,
    "invoke_viiid": invoke_viiid,
    "invoke_iiiiij": invoke_iiiiij,
    "invoke_iiiiffi": invoke_iiiiffi,
    "invoke_viidii": invoke_viidii,
    "invoke_viiiff": invoke_viiiff,
    "invoke_iiiiid": invoke_iiiiid,
    "invoke_iiiiif": invoke_iiiiif,
    "invoke_viiiii": invoke_viiiii,
    "invoke_vif": invoke_vif,
    "invoke_vid": invoke_vid,
    "invoke_iiidi": invoke_iiidi,
    "invoke_iiidd": invoke_iiidd,
    "invoke_vii": invoke_vii,
    "invoke_iiffff": invoke_iiffff,
    "invoke_viiiifiii": invoke_viiiifiii,
    "invoke_viidd": invoke_viidd,
    "invoke_viifii": invoke_viifii,
    "invoke_viidi": invoke_viidi,
    "invoke_viiiiffii": invoke_viiiiffii,
    "invoke_viiidiiddi": invoke_viiidiiddi,
    "invoke_iiiidii": invoke_iiiidii,
    "invoke_diiid": invoke_diiid,
    "invoke_viiiiiiii": invoke_viiiiiiii,
    "invoke_viiidddiiii": invoke_viiidddiiii,
    "invoke_viiiiiiid": invoke_viiiiiiid,
    "invoke_viiiiiiddi": invoke_viiiiiiddi,
    "invoke_diiii": invoke_diiii,
    "invoke_viiiiidiiddi": invoke_viiiiidiiddi,
    "invoke_viiddddddi": invoke_viiddddddi,
    "invoke_iiiiifi": invoke_iiiiifi,
    "invoke_fiiiiiiiiid": invoke_fiiiiiiiiid,
    "invoke_viiifii": invoke_viiifii,
    "invoke_viiiiidii": invoke_viiiiidii,
    "invoke_fiiiii": invoke_fiiiii,
    "invoke_iif": invoke_iif,
    "invoke_viiiiiiiid": invoke_viiiiiiiid,
    "invoke_viiiiiii": invoke_viiiiiii,
    "invoke_viiiidi": invoke_viiiidi,
    "invoke_viiiiddiiid": invoke_viiiiddiiid,
    "invoke_viiiiiid": invoke_viiiiiid,
    "invoke_viiiiiiiii": invoke_viiiiiiiii,
    "invoke_iii": invoke_iii,
    "invoke_viiiddii": invoke_viiiddii,
    "invoke_viiiiiidi": invoke_viiiiiidi,
    "invoke_vdiii": invoke_vdiii,
    "invoke_iiiddddddi": invoke_iiiddddddi,
    "invoke_viiiiidiiiii": invoke_viiiiidiiiii,
    "invoke_viii": invoke_viii,
    "invoke_v": invoke_v,
    "invoke_viid": invoke_viid,
    "invoke_viiiiff": invoke_viiiiff,
    "invoke_viif": invoke_viif,
    "invoke_iiiddiid": invoke_iiiddiid,
    "invoke_viiiiidiiii": invoke_viiiiidiiii,
    "invoke_vi": invoke_vi,
    "invoke_iiiiiiiiiii": invoke_iiiiiiiiiii,
    "invoke_viiiidiiiidi": invoke_viiiidiiiidi,
    "invoke_ii": invoke_ii,
    "invoke_viijii": invoke_viijii,
    "invoke_viiiifff": invoke_viiiifff,
    "invoke_viiiiiiiddi": invoke_viiiiiiiddi,
    "invoke_viifi": invoke_viifi,
    "invoke_viiff": invoke_viiff,
    "invoke_viiiiffi": invoke_viiiiffi,
    "invoke_iiifi": invoke_iiifi,
    "invoke_vidii": invoke_vidii,
    "invoke_vididdii": invoke_vididdii,
    "invoke_viiiddiii": invoke_viiiddiii,
    "invoke_viiiffii": invoke_viiiffii,
    "invoke_viiiiiidiiiii": invoke_viiiiiidiiiii,
    "invoke_fiiiiii": invoke_fiiiiii,
    "invoke_viiiifii": invoke_viiiifii,
    "invoke_viffff": invoke_viffff,
    "invoke_iiii": invoke_iiii,
    "invoke_viididii": invoke_viididii,
    "invoke_iiif": invoke_iiif,
    "invoke_viiiffi": invoke_viiiffi,
    "invoke_diiiii": invoke_diiiii,
    "invoke_diiiid": invoke_diiiid,
    "invoke_iiiiiiiiiiiii": invoke_iiiiiiiiiiiii,
    "invoke_iiiifiii": invoke_iiiifiii,
    "invoke_fi": invoke_fi,
    "invoke_viiiiiffii": invoke_viiiiiffii,
    "invoke_iiidid": invoke_iiidid,
    "invoke_iid": invoke_iid,
    "invoke_i": invoke_i,
    "invoke_iiiiidii": invoke_iiiiidii,
    "invoke_diiiiii": invoke_diiiiii,
    "invoke_vifffff": invoke_vifffff,
    "invoke_viiiiidiii": invoke_viiiiidiii,
    "invoke_iiiiiiiii": invoke_iiiiiiiii,
    "invoke_viididdii": invoke_viididdii,
    "invoke_viiii": invoke_viiii,
    "invoke_viiiidd": invoke_viiiidd,
    "invoke_vidiii": invoke_vidiii,
    "invoke_iifffff": invoke_iifffff,
    "___syscall221": ___syscall221,
    "floatReadValueFromPointer": floatReadValueFromPointer,
    "simpleReadValueFromPointer": simpleReadValueFromPointer,
    "throwInternalError": throwInternalError,
    "get_first_emval": get_first_emval,
    "whenDependentTypesAreResolved": whenDependentTypesAreResolved,
    "constNoSmartPtrRawPointerToWireType": constNoSmartPtrRawPointerToWireType,
    "getLiveInheritedInstances": getLiveInheritedInstances,
    "___assert_fail": ___assert_fail,
    "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv,
    "ClassHandle": ClassHandle,
    "getShiftFromSize": getShiftFromSize,
    "__emval_get_property": __emval_get_property,
    "_llvm_exp2_f64": _llvm_exp2_f64,
    "_clock_gettime": _clock_gettime,
    "___cxa_begin_catch": ___cxa_begin_catch,
    "_emscripten_memcpy_big": _emscripten_memcpy_big,
    "runDestructor": runDestructor,
    "throwInstanceAlreadyDeleted": throwInstanceAlreadyDeleted,
    "__embind_register_std_string": __embind_register_std_string,
    "init_RegisteredPointer": init_RegisteredPointer,
    "___lock": ___lock,
    "getStringOrSymbol": getStringOrSymbol,
    "flushPendingDeletes": flushPendingDeletes,
    "__embind_register_enum_value": __embind_register_enum_value,
    "makeClassHandle": makeClassHandle,
    "__isLeapYear": __isLeapYear,
    "__embind_register_class_constructor": __embind_register_class_constructor,
    "___cxa_atexit": ___cxa_atexit,
    "__embind_finalize_value_array": __embind_finalize_value_array,
    "init_ClassHandle": init_ClassHandle,
    "__embind_register_constant": __embind_register_constant,
    "___syscall140": ___syscall140,
    "ClassHandle_clone": ClassHandle_clone,
    "___syscall145": ___syscall145,
    "___syscall146": ___syscall146,
    "_emscripten_get_now_is_monotonic": _emscripten_get_now_is_monotonic,
    "throwBindingError": throwBindingError,
    "RegisteredClass": RegisteredClass,
    "___cxa_find_matching_catch": ___cxa_find_matching_catch,
    "__embind_register_value_object_field": __embind_register_value_object_field,
    "embind_init_charCodes": embind_init_charCodes,
    "__emval_as": __emval_as,
    "___setErrNo": ___setErrNo,
    "__embind_register_class_class_function": __embind_register_class_class_function,
    "_llvm_pow_f32": _llvm_pow_f32,
    "__embind_register_bool": __embind_register_bool,
    "___resumeException": ___resumeException,
    "createNamedFunction": createNamedFunction,
    "__embind_register_class_property": __embind_register_class_property,
    "__embind_register_emval": __embind_register_emval,
    "___buildEnvironment": ___buildEnvironment,
    "__embind_finalize_value_object": __embind_finalize_value_object,
    "__emval_decref": __emval_decref,
    "_pthread_once": _pthread_once,
    "_llvm_trap": _llvm_trap,
    "__embind_register_class": __embind_register_class,
    "___syscall91": ___syscall91,
    "heap32VectorToArray": heap32VectorToArray,
    "_emscripten_get_now": _emscripten_get_now,
    "___syscall10": ___syscall10,
    "__emval_run_destructors": __emval_run_destructors,
    "ClassHandle_delete": ClassHandle_delete,
    "__ZN2cv3EMDERKNS_11_InputArrayES2_iS2_PfRKNS_12_OutputArrayE": __ZN2cv3EMDERKNS_11_InputArrayES2_iS2_PfRKNS_12_OutputArrayE,
    "___syscall3": ___syscall3,
    "__addDays": __addDays,
    "_llvm_exp2_f32": _llvm_exp2_f32,
    "___syscall6": ___syscall6,
    "___syscall5": ___syscall5,
    "ensureOverloadTable": ensureOverloadTable,
    "_gettimeofday": _gettimeofday,
    "new_": new_,
    "downcastPointer": downcastPointer,
    "replacePublicSymbol": replacePublicSymbol,
    "init_embind": init_embind,
    "_llvm_pow_f64": _llvm_pow_f64,
    "ClassHandle_deleteLater": ClassHandle_deleteLater,
    "___syscall54": ___syscall54,
    "RegisteredPointer_deleteObject": RegisteredPointer_deleteObject,
    "ClassHandle_isDeleted": ClassHandle_isDeleted,
    "__embind_register_integer": __embind_register_integer,
    "___cxa_allocate_exception": ___cxa_allocate_exception,
    "__emval_take_value": __emval_take_value,
    "__embind_register_value_object": __embind_register_value_object,
    "enumReadValueFromPointer": enumReadValueFromPointer,
    "getTypeName": getTypeName,
    "___clock_gettime": ___clock_gettime,
    "_strftime": _strftime,
    "__embind_register_class_function": __embind_register_class_function,
    "throwUnboundTypeError": throwUnboundTypeError,
    "craftInvokerFunction": craftInvokerFunction,
    "_getenv": _getenv,
    "runDestructors": runDestructors,
    "requireRegisteredType": requireRegisteredType,
    "makeLegalFunctionName": makeLegalFunctionName,
    "_pthread_key_create": _pthread_key_create,
    "upcastPointer": upcastPointer,
    "init_emval": init_emval,
    "shallowCopyInternalPointer": shallowCopyInternalPointer,
    "nonConstNoSmartPtrRawPointerToWireType": nonConstNoSmartPtrRawPointerToWireType,
    "__embind_register_value_array": __embind_register_value_array,
    "_abort": _abort,
    "requireHandle": requireHandle,
    "_embind_repr": _embind_repr,
    "validateThis": validateThis,
    "exposePublicSymbol": exposePublicSymbol,
    "RegisteredPointer_fromWireType": RegisteredPointer_fromWireType,
    "___cxa_pure_virtual": ___cxa_pure_virtual,
    "_pthread_getspecific": _pthread_getspecific,
    "_pthread_cond_wait": _pthread_cond_wait,
    "RegisteredPointer_destructor": RegisteredPointer_destructor,
    "__embind_register_value_array_element": __embind_register_value_array_element,
    "__embind_register_memory_view": __embind_register_memory_view,
    "getInheritedInstance": getInheritedInstance,
    "___syscall40": ___syscall40,
    "setDelayFunction": setDelayFunction,
    "___gxx_personality_v0": ___gxx_personality_v0,
    "extendError": extendError,
    "___syscall4": ___syscall4,
    "__embind_register_void": __embind_register_void,
    "__embind_register_smart_ptr": __embind_register_smart_ptr,
    "__embind_register_function": __embind_register_function,
    "_pthread_mutexattr_destroy": _pthread_mutexattr_destroy,
    "_strftime_l": _strftime_l,
    "RegisteredPointer_getPointee": RegisteredPointer_getPointee,
    "__emval_register": __emval_register,
    "__embind_register_std_wstring": __embind_register_std_wstring,
    "ClassHandle_isAliasOf": ClassHandle_isAliasOf,
    "__emval_incref": __emval_incref,
    "RegisteredPointer": RegisteredPointer,
    "__arraySum": __arraySum,
    "readLatin1String": readLatin1String,
    "_pthread_mutex_destroy": _pthread_mutex_destroy,
    "getBasestPointer": getBasestPointer,
    "getInheritedInstanceCount": getInheritedInstanceCount,
    "__embind_register_float": __embind_register_float,
    "integerReadValueFromPointer": integerReadValueFromPointer,
    "___unlock": ___unlock,
    "_pthread_mutexattr_settype": _pthread_mutexattr_settype,
    "_pthread_mutexattr_init": _pthread_mutexattr_init,
    "_pthread_setspecific": _pthread_setspecific,
    "genericPointerToWireType": genericPointerToWireType,
    "registerType": registerType,
    "___cxa_throw": ___cxa_throw,
    "__embind_register_enum": __embind_register_enum,
    "__emval_new_cstring": __emval_new_cstring,
    "count_emval_handles": count_emval_handles,
    "requireFunction": requireFunction,
    "_atexit": _atexit,
    "_pthread_mutex_init": _pthread_mutex_init,
    "___map_file": ___map_file,
    "DYNAMICTOP_PTR": DYNAMICTOP_PTR,
    "tempDoublePtr": tempDoublePtr,
    "ABORT": ABORT,
    "STACKTOP": STACKTOP,
    "STACK_MAX": STACK_MAX,
    "___dso_handle": ___dso_handle
};
var asm = Module["asm"](Module.asmGlobalArg, Module.asmLibraryArg, buffer);
Module["asm"] = asm;
var __GLOBAL__sub_I_system_cpp = Module["__GLOBAL__sub_I_system_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_system_cpp"].apply(null, arguments)
});
var __GLOBAL__sub_I_umatrix_cpp = Module["__GLOBAL__sub_I_umatrix_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_umatrix_cpp"].apply(null, arguments)
});
var stackSave = Module["stackSave"] = (function() {
    return Module["asm"]["stackSave"].apply(null, arguments)
});
var setThrew = Module["setThrew"] = (function() {
    return Module["asm"]["setThrew"].apply(null, arguments)
});
var __GLOBAL__sub_I_persistence_cpp = Module["__GLOBAL__sub_I_persistence_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_persistence_cpp"].apply(null, arguments)
});
var _fflush = Module["_fflush"] = (function() {
    return Module["asm"]["_fflush"].apply(null, arguments)
});
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = (function() {
    return Module["asm"]["___cxa_is_pointer_type"].apply(null, arguments)
});
var _memset = Module["_memset"] = (function() {
    return Module["asm"]["_memset"].apply(null, arguments)
});
var _sbrk = Module["_sbrk"] = (function() {
    return Module["asm"]["_sbrk"].apply(null, arguments)
});
var __GLOBAL__sub_I_imgwarp_cpp = Module["__GLOBAL__sub_I_imgwarp_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_imgwarp_cpp"].apply(null, arguments)
});
var _memcpy = Module["_memcpy"] = (function() {
    return Module["asm"]["_memcpy"].apply(null, arguments)
});
var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = (function() {
    return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments)
});
var ___cxx_global_var_init_1435 = Module["___cxx_global_var_init_1435"] = (function() {
    return Module["asm"]["___cxx_global_var_init_1435"].apply(null, arguments)
});
var ___cxx_global_var_init_1434 = Module["___cxx_global_var_init_1434"] = (function() {
    return Module["asm"]["___cxx_global_var_init_1434"].apply(null, arguments)
});
var ___cxx_global_var_init_1436 = Module["___cxx_global_var_init_1436"] = (function() {
    return Module["asm"]["___cxx_global_var_init_1436"].apply(null, arguments)
});
var ___cxx_global_var_init_1431 = Module["___cxx_global_var_init_1431"] = (function() {
    return Module["asm"]["___cxx_global_var_init_1431"].apply(null, arguments)
});
var ___cxx_global_var_init_1430 = Module["___cxx_global_var_init_1430"] = (function() {
    return Module["asm"]["___cxx_global_var_init_1430"].apply(null, arguments)
});
var ___cxx_global_var_init_1433 = Module["___cxx_global_var_init_1433"] = (function() {
    return Module["asm"]["___cxx_global_var_init_1433"].apply(null, arguments)
});
var ___cxx_global_var_init_1432 = Module["___cxx_global_var_init_1432"] = (function() {
    return Module["asm"]["___cxx_global_var_init_1432"].apply(null, arguments)
});
var stackAlloc = Module["stackAlloc"] = (function() {
    return Module["asm"]["stackAlloc"].apply(null, arguments)
});
var getTempRet0 = Module["getTempRet0"] = (function() {
    return Module["asm"]["getTempRet0"].apply(null, arguments)
});
var __GLOBAL__sub_I_bind_cpp = Module["__GLOBAL__sub_I_bind_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_bind_cpp"].apply(null, arguments)
});
var ___cxx_global_var_init_38 = Module["___cxx_global_var_init_38"] = (function() {
    return Module["asm"]["___cxx_global_var_init_38"].apply(null, arguments)
});
var setTempRet0 = Module["setTempRet0"] = (function() {
    return Module["asm"]["setTempRet0"].apply(null, arguments)
});
var ___cxx_global_var_init_36 = Module["___cxx_global_var_init_36"] = (function() {
    return Module["asm"]["___cxx_global_var_init_36"].apply(null, arguments)
});
var ___cxx_global_var_init_37 = Module["___cxx_global_var_init_37"] = (function() {
    return Module["asm"]["___cxx_global_var_init_37"].apply(null, arguments)
});
var _pthread_mutex_unlock = Module["_pthread_mutex_unlock"] = (function() {
    return Module["asm"]["_pthread_mutex_unlock"].apply(null, arguments)
});
var __GLOBAL__I_000101 = Module["__GLOBAL__I_000101"] = (function() {
    return Module["asm"]["__GLOBAL__I_000101"].apply(null, arguments)
});
var _emscripten_get_global_libc = Module["_emscripten_get_global_libc"] = (function() {
    return Module["asm"]["_emscripten_get_global_libc"].apply(null, arguments)
});
var ___getTypeName = Module["___getTypeName"] = (function() {
    return Module["asm"]["___getTypeName"].apply(null, arguments)
});
var __GLOBAL__sub_I_iostream_cpp = Module["__GLOBAL__sub_I_iostream_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_iostream_cpp"].apply(null, arguments)
});
var __GLOBAL__sub_I_knearest_cpp = Module["__GLOBAL__sub_I_knearest_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_knearest_cpp"].apply(null, arguments)
});
var _pthread_cond_broadcast = Module["_pthread_cond_broadcast"] = (function() {
    return Module["asm"]["_pthread_cond_broadcast"].apply(null, arguments)
});
var _pthread_mutex_lock = Module["_pthread_mutex_lock"] = (function() {
    return Module["asm"]["_pthread_mutex_lock"].apply(null, arguments)
});
var ___errno_location = Module["___errno_location"] = (function() {
    return Module["asm"]["___errno_location"].apply(null, arguments)
});
var ___cxa_can_catch = Module["___cxa_can_catch"] = (function() {
    return Module["asm"]["___cxa_can_catch"].apply(null, arguments)
});
var _free = Module["_free"] = (function() {
    return Module["asm"]["_free"].apply(null, arguments)
});
var runPostSets = Module["runPostSets"] = (function() {
    return Module["asm"]["runPostSets"].apply(null, arguments)
});
var __GLOBAL__sub_I_hog_cpp = Module["__GLOBAL__sub_I_hog_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_hog_cpp"].apply(null, arguments)
});
var establishStackSpace = Module["establishStackSpace"] = (function() {
    return Module["asm"]["establishStackSpace"].apply(null, arguments)
});
var _memmove = Module["_memmove"] = (function() {
    return Module["asm"]["_memmove"].apply(null, arguments)
});
var __GLOBAL__sub_I_bindings_cpp = Module["__GLOBAL__sub_I_bindings_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_bindings_cpp"].apply(null, arguments)
});
var stackRestore = Module["stackRestore"] = (function() {
    return Module["asm"]["stackRestore"].apply(null, arguments)
});
var _malloc = Module["_malloc"] = (function() {
    return Module["asm"]["_malloc"].apply(null, arguments)
});
var __GLOBAL__sub_I_histogram_cpp = Module["__GLOBAL__sub_I_histogram_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_histogram_cpp"].apply(null, arguments)
});
var __GLOBAL__sub_I_haar_cpp = Module["__GLOBAL__sub_I_haar_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_haar_cpp"].apply(null, arguments)
});
var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = (function() {
    return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments)
});
var ___cxx_global_var_init_1428 = Module["___cxx_global_var_init_1428"] = (function() {
    return Module["asm"]["___cxx_global_var_init_1428"].apply(null, arguments)
});
var ___cxx_global_var_init_1429 = Module["___cxx_global_var_init_1429"] = (function() {
    return Module["asm"]["___cxx_global_var_init_1429"].apply(null, arguments)
});
var __GLOBAL__sub_I_loadsave_cpp = Module["__GLOBAL__sub_I_loadsave_cpp"] = (function() {
    return Module["asm"]["__GLOBAL__sub_I_loadsave_cpp"].apply(null, arguments)
});
var dynCall_viiifiii = Module["dynCall_viiifiii"] = (function() {
    return Module["asm"]["dynCall_viiifiii"].apply(null, arguments)
});
var dynCall_iiiiiid = Module["dynCall_iiiiiid"] = (function() {
    return Module["asm"]["dynCall_iiiiiid"].apply(null, arguments)
});
var dynCall_viiiiddd = Module["dynCall_viiiiddd"] = (function() {
    return Module["asm"]["dynCall_viiiiddd"].apply(null, arguments)
});
var dynCall_viiiidiii = Module["dynCall_viiiidiii"] = (function() {
    return Module["asm"]["dynCall_viiiidiii"].apply(null, arguments)
});
var dynCall_viiiiiddi = Module["dynCall_viiiiiddi"] = (function() {
    return Module["asm"]["dynCall_viiiiiddi"].apply(null, arguments)
});
var dynCall_viiidiii = Module["dynCall_viiidiii"] = (function() {
    return Module["asm"]["dynCall_viiidiii"].apply(null, arguments)
});
var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = (function() {
    return Module["asm"]["dynCall_iiiiiii"].apply(null, arguments)
});
var dynCall_viiiidddiiii = Module["dynCall_viiiidddiiii"] = (function() {
    return Module["asm"]["dynCall_viiiidddiiii"].apply(null, arguments)
});
var dynCall_viiiffiii = Module["dynCall_viiiffiii"] = (function() {
    return Module["asm"]["dynCall_viiiffiii"].apply(null, arguments)
});
var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = (function() {
    return Module["asm"]["dynCall_viiiiiiiiiii"].apply(null, arguments)
});
var dynCall_iidd = Module["dynCall_iidd"] = (function() {
    return Module["asm"]["dynCall_iidd"].apply(null, arguments)
});
var dynCall_viiiiiiiiiid = Module["dynCall_viiiiiiiiiid"] = (function() {
    return Module["asm"]["dynCall_viiiiiiiiiid"].apply(null, arguments)
});
var dynCall_viiffii = Module["dynCall_viiffii"] = (function() {
    return Module["asm"]["dynCall_viiffii"].apply(null, arguments)
});
var dynCall_iidi = Module["dynCall_iidi"] = (function() {
    return Module["asm"]["dynCall_iidi"].apply(null, arguments)
});
var dynCall_dii = Module["dynCall_dii"] = (function() {
    return Module["asm"]["dynCall_dii"].apply(null, arguments)
});
var dynCall_viiifff = Module["dynCall_viiifff"] = (function() {
    return Module["asm"]["dynCall_viiifff"].apply(null, arguments)
});
var dynCall_iifff = Module["dynCall_iifff"] = (function() {
    return Module["asm"]["dynCall_iifff"].apply(null, arguments)
});
var dynCall_vidi = Module["dynCall_vidi"] = (function() {
    return Module["asm"]["dynCall_vidi"].apply(null, arguments)
});
var dynCall_fiiiiiiiid = Module["dynCall_fiiiiiiiid"] = (function() {
    return Module["asm"]["dynCall_fiiiiiiiid"].apply(null, arguments)
});
var dynCall_viiddii = Module["dynCall_viiddii"] = (function() {
    return Module["asm"]["dynCall_viiddii"].apply(null, arguments)
});
var dynCall_viiiiddiddi = Module["dynCall_viiiiddiddi"] = (function() {
    return Module["asm"]["dynCall_viiiiddiddi"].apply(null, arguments)
});
var dynCall_iiiiifiii = Module["dynCall_iiiiifiii"] = (function() {
    return Module["asm"]["dynCall_iiiiifiii"].apply(null, arguments)
});
var dynCall_viiiiidi = Module["dynCall_viiiiidi"] = (function() {
    return Module["asm"]["dynCall_viiiiidi"].apply(null, arguments)
});
var dynCall_viiddidddd = Module["dynCall_viiddidddd"] = (function() {
    return Module["asm"]["dynCall_viiddidddd"].apply(null, arguments)
});
var dynCall_viiiiddi = Module["dynCall_viiiiddi"] = (function() {
    return Module["asm"]["dynCall_viiiiddi"].apply(null, arguments)
});
var dynCall_viiiiiiidi = Module["dynCall_viiiiiiidi"] = (function() {
    return Module["asm"]["dynCall_viiiiiiidi"].apply(null, arguments)
});
var dynCall_fii = Module["dynCall_fii"] = (function() {
    return Module["asm"]["dynCall_fii"].apply(null, arguments)
});
var dynCall_viiidii = Module["dynCall_viiidii"] = (function() {
    return Module["asm"]["dynCall_viiidii"].apply(null, arguments)
});
var dynCall_viiiiifii = Module["dynCall_viiiiifii"] = (function() {
    return Module["asm"]["dynCall_viiiiifii"].apply(null, arguments)
});
var dynCall_iiifiiiiiii = Module["dynCall_iiifiiiiiii"] = (function() {
    return Module["asm"]["dynCall_iiifiiiiiii"].apply(null, arguments)
});
var dynCall_di = Module["dynCall_di"] = (function() {
    return Module["asm"]["dynCall_di"].apply(null, arguments)
});
var dynCall_viiiid = Module["dynCall_viiiid"] = (function() {
    return Module["asm"]["dynCall_viiiid"].apply(null, arguments)
});
var dynCall_viifiiiiiii = Module["dynCall_viifiiiiiii"] = (function() {
    return Module["asm"]["dynCall_viifiiiiiii"].apply(null, arguments)
});
var dynCall_viiiidiiddi = Module["dynCall_viiiidiiddi"] = (function() {
    return Module["asm"]["dynCall_viiiidiiddi"].apply(null, arguments)
});
var dynCall_viiididii = Module["dynCall_viiididii"] = (function() {
    return Module["asm"]["dynCall_viiididii"].apply(null, arguments)
});
var dynCall_diiiiiii = Module["dynCall_diiiiiii"] = (function() {
    return Module["asm"]["dynCall_diiiiiii"].apply(null, arguments)
});
var dynCall_iiiiiddiddi = Module["dynCall_iiiiiddiddi"] = (function() {
    return Module["asm"]["dynCall_iiiiiddiddi"].apply(null, arguments)
});
var dynCall_viidddddi = Module["dynCall_viidddddi"] = (function() {
    return Module["asm"]["dynCall_viidddddi"].apply(null, arguments)
});
var dynCall_fiiiiiii = Module["dynCall_fiiiiiii"] = (function() {
    return Module["asm"]["dynCall_fiiiiiii"].apply(null, arguments)
});
var dynCall_viiiddiiid = Module["dynCall_viiiddiiid"] = (function() {
    return Module["asm"]["dynCall_viiiddiiid"].apply(null, arguments)
});
var dynCall_iiidddddi = Module["dynCall_iiidddddi"] = (function() {
    return Module["asm"]["dynCall_iiidddddi"].apply(null, arguments)
});
var dynCall_diidi = Module["dynCall_diidi"] = (function() {
    return Module["asm"]["dynCall_diidi"].apply(null, arguments)
});
var dynCall_viiiiiiiiiiddi = Module["dynCall_viiiiiiiiiiddi"] = (function() {
    return Module["asm"]["dynCall_viiiiiiiiiiddi"].apply(null, arguments)
});
var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = (function() {
    return Module["asm"]["dynCall_iiiiiiiiii"].apply(null, arguments)
});
var dynCall_iiiid = Module["dynCall_iiiid"] = (function() {
    return Module["asm"]["dynCall_iiiid"].apply(null, arguments)
});
var dynCall_iiiif = Module["dynCall_iiiif"] = (function() {
    return Module["asm"]["dynCall_iiiif"].apply(null, arguments)
});
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = (function() {
    return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments)
});
var dynCall_viiddiii = Module["dynCall_viiddiii"] = (function() {
    return Module["asm"]["dynCall_viiddiii"].apply(null, arguments)
});
var dynCall_viiddiid = Module["dynCall_viiddiid"] = (function() {
    return Module["asm"]["dynCall_viiddiid"].apply(null, arguments)
});
var dynCall_iiiiiiiididiii = Module["dynCall_iiiiiiiididiii"] = (function() {
    return Module["asm"]["dynCall_iiiiiiiididiii"].apply(null, arguments)
});
var dynCall_iiiiffiii = Module["dynCall_iiiiffiii"] = (function() {
    return Module["asm"]["dynCall_iiiiffiii"].apply(null, arguments)
});
var dynCall_iidddd = Module["dynCall_iidddd"] = (function() {
    return Module["asm"]["dynCall_iidddd"].apply(null, arguments)
});
var dynCall_viidiiid = Module["dynCall_viidiiid"] = (function() {
    return Module["asm"]["dynCall_viidiiid"].apply(null, arguments)
});
var dynCall_viiiidiiii = Module["dynCall_viiiidiiii"] = (function() {
    return Module["asm"]["dynCall_viiiidiiii"].apply(null, arguments)
});
var dynCall_viiidiiid = Module["dynCall_viiidiiid"] = (function() {
    return Module["asm"]["dynCall_viiidiiid"].apply(null, arguments)
});
var dynCall_viiif = Module["dynCall_viiif"] = (function() {
    return Module["asm"]["dynCall_viiif"].apply(null, arguments)
});
var dynCall_diiiddi = Module["dynCall_diiiddi"] = (function() {
    return Module["asm"]["dynCall_diiiddi"].apply(null, arguments)
});
var dynCall_iiiii = Module["dynCall_iiiii"] = (function() {
    return Module["asm"]["dynCall_iiiii"].apply(null, arguments)
});
var dynCall_iifffffii = Module["dynCall_iifffffii"] = (function() {
    return Module["asm"]["dynCall_iifffffii"].apply(null, arguments)
});
var dynCall_diiiiiiii = Module["dynCall_diiiiiiii"] = (function() {
    return Module["asm"]["dynCall_diiiiiiii"].apply(null, arguments)
});
var dynCall_viiidd = Module["dynCall_viiidd"] = (function() {
    return Module["asm"]["dynCall_viiidd"].apply(null, arguments)
});
var dynCall_viiiddddii = Module["dynCall_viiiddddii"] = (function() {
    return Module["asm"]["dynCall_viiiddddii"].apply(null, arguments)
});
var dynCall_viiiiid = Module["dynCall_viiiiid"] = (function() {
    return Module["asm"]["dynCall_viiiiid"].apply(null, arguments)
});
var dynCall_viiiiddddii = Module["dynCall_viiiiddddii"] = (function() {
    return Module["asm"]["dynCall_viiiiddddii"].apply(null, arguments)
});
var dynCall_vifi = Module["dynCall_vifi"] = (function() {
    return Module["asm"]["dynCall_vifi"].apply(null, arguments)
});
var dynCall_vifff = Module["dynCall_vifff"] = (function() {
    return Module["asm"]["dynCall_vifff"].apply(null, arguments)
});
var dynCall_viiiiii = Module["dynCall_viiiiii"] = (function() {
    return Module["asm"]["dynCall_viiiiii"].apply(null, arguments)
});
var dynCall_viiidiiii = Module["dynCall_viiidiiii"] = (function() {
    return Module["asm"]["dynCall_viiidiiii"].apply(null, arguments)
});
var dynCall_fiii = Module["dynCall_fiii"] = (function() {
    return Module["asm"]["dynCall_fiii"].apply(null, arguments)
});
var dynCall_viiddidd = Module["dynCall_viiddidd"] = (function() {
    return Module["asm"]["dynCall_viiddidd"].apply(null, arguments)
});
var dynCall_viiidi = Module["dynCall_viiidi"] = (function() {
    return Module["asm"]["dynCall_viiidi"].apply(null, arguments)
});
var dynCall_iiiiiidii = Module["dynCall_iiiiiidii"] = (function() {
    return Module["asm"]["dynCall_iiiiiidii"].apply(null, arguments)
});
var dynCall_iiddd = Module["dynCall_iiddd"] = (function() {
    return Module["asm"]["dynCall_iiddd"].apply(null, arguments)
});
var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = (function() {
    return Module["asm"]["dynCall_viiiiiiiiii"].apply(null, arguments)
});
var dynCall_diiddi = Module["dynCall_diiddi"] = (function() {
    return Module["asm"]["dynCall_diiddi"].apply(null, arguments)
});
var dynCall_diii = Module["dynCall_diii"] = (function() {
    return Module["asm"]["dynCall_diii"].apply(null, arguments)
});
var dynCall_viiiddd = Module["dynCall_viiiddd"] = (function() {
    return Module["asm"]["dynCall_viiiddd"].apply(null, arguments)
});
var dynCall_viiiddidddd = Module["dynCall_viiiddidddd"] = (function() {
    return Module["asm"]["dynCall_viiiddidddd"].apply(null, arguments)
});
var dynCall_viiiiiiiiiiid = Module["dynCall_viiiiiiiiiiid"] = (function() {
    return Module["asm"]["dynCall_viiiiiiiiiiid"].apply(null, arguments)
});
var dynCall_viiiddidd = Module["dynCall_viiiddidd"] = (function() {
    return Module["asm"]["dynCall_viiiddidd"].apply(null, arguments)
});
var dynCall_viiidiiiidi = Module["dynCall_viiidiiiidi"] = (function() {
    return Module["asm"]["dynCall_viiidiiiidi"].apply(null, arguments)
});
var dynCall_viiiddi = Module["dynCall_viiiddi"] = (function() {
    return Module["asm"]["dynCall_viiiddi"].apply(null, arguments)
});
var dynCall_fiiii = Module["dynCall_fiiii"] = (function() {
    return Module["asm"]["dynCall_fiiii"].apply(null, arguments)
});
var dynCall_iiiiii = Module["dynCall_iiiiii"] = (function() {
    return Module["asm"]["dynCall_iiiiii"].apply(null, arguments)
});
var dynCall_viiid = Module["dynCall_viiid"] = (function() {
    return Module["asm"]["dynCall_viiid"].apply(null, arguments)
});
var dynCall_iiiiij = Module["dynCall_iiiiij"] = (function() {
    return Module["asm"]["dynCall_iiiiij"].apply(null, arguments)
});
var dynCall_iiiiffi = Module["dynCall_iiiiffi"] = (function() {
    return Module["asm"]["dynCall_iiiiffi"].apply(null, arguments)
});
var dynCall_viidii = Module["dynCall_viidii"] = (function() {
    return Module["asm"]["dynCall_viidii"].apply(null, arguments)
});
var dynCall_viiiff = Module["dynCall_viiiff"] = (function() {
    return Module["asm"]["dynCall_viiiff"].apply(null, arguments)
});
var dynCall_iiiiid = Module["dynCall_iiiiid"] = (function() {
    return Module["asm"]["dynCall_iiiiid"].apply(null, arguments)
});
var dynCall_iiiiif = Module["dynCall_iiiiif"] = (function() {
    return Module["asm"]["dynCall_iiiiif"].apply(null, arguments)
});
var dynCall_viiiii = Module["dynCall_viiiii"] = (function() {
    return Module["asm"]["dynCall_viiiii"].apply(null, arguments)
});
var dynCall_vif = Module["dynCall_vif"] = (function() {
    return Module["asm"]["dynCall_vif"].apply(null, arguments)
});
var dynCall_vid = Module["dynCall_vid"] = (function() {
    return Module["asm"]["dynCall_vid"].apply(null, arguments)
});
var dynCall_iiidi = Module["dynCall_iiidi"] = (function() {
    return Module["asm"]["dynCall_iiidi"].apply(null, arguments)
});
var dynCall_iiidd = Module["dynCall_iiidd"] = (function() {
    return Module["asm"]["dynCall_iiidd"].apply(null, arguments)
});
var dynCall_vii = Module["dynCall_vii"] = (function() {
    return Module["asm"]["dynCall_vii"].apply(null, arguments)
});
var dynCall_iiffff = Module["dynCall_iiffff"] = (function() {
    return Module["asm"]["dynCall_iiffff"].apply(null, arguments)
});
var dynCall_viiiifiii = Module["dynCall_viiiifiii"] = (function() {
    return Module["asm"]["dynCall_viiiifiii"].apply(null, arguments)
});
var dynCall_viidd = Module["dynCall_viidd"] = (function() {
    return Module["asm"]["dynCall_viidd"].apply(null, arguments)
});
var dynCall_viifii = Module["dynCall_viifii"] = (function() {
    return Module["asm"]["dynCall_viifii"].apply(null, arguments)
});
var dynCall_viidi = Module["dynCall_viidi"] = (function() {
    return Module["asm"]["dynCall_viidi"].apply(null, arguments)
});
var dynCall_viiiiffii = Module["dynCall_viiiiffii"] = (function() {
    return Module["asm"]["dynCall_viiiiffii"].apply(null, arguments)
});
var dynCall_viiidiiddi = Module["dynCall_viiidiiddi"] = (function() {
    return Module["asm"]["dynCall_viiidiiddi"].apply(null, arguments)
});
var dynCall_iiiidii = Module["dynCall_iiiidii"] = (function() {
    return Module["asm"]["dynCall_iiiidii"].apply(null, arguments)
});
var dynCall_diiid = Module["dynCall_diiid"] = (function() {
    return Module["asm"]["dynCall_diiid"].apply(null, arguments)
});
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = (function() {
    return Module["asm"]["dynCall_viiiiiiii"].apply(null, arguments)
});
var dynCall_viiidddiiii = Module["dynCall_viiidddiiii"] = (function() {
    return Module["asm"]["dynCall_viiidddiiii"].apply(null, arguments)
});
var dynCall_viiiiiiid = Module["dynCall_viiiiiiid"] = (function() {
    return Module["asm"]["dynCall_viiiiiiid"].apply(null, arguments)
});
var dynCall_viiiiiiddi = Module["dynCall_viiiiiiddi"] = (function() {
    return Module["asm"]["dynCall_viiiiiiddi"].apply(null, arguments)
});
var dynCall_diiii = Module["dynCall_diiii"] = (function() {
    return Module["asm"]["dynCall_diiii"].apply(null, arguments)
});
var dynCall_viiiiidiiddi = Module["dynCall_viiiiidiiddi"] = (function() {
    return Module["asm"]["dynCall_viiiiidiiddi"].apply(null, arguments)
});
var dynCall_viiddddddi = Module["dynCall_viiddddddi"] = (function() {
    return Module["asm"]["dynCall_viiddddddi"].apply(null, arguments)
});
var dynCall_iiiiifi = Module["dynCall_iiiiifi"] = (function() {
    return Module["asm"]["dynCall_iiiiifi"].apply(null, arguments)
});
var dynCall_fiiiiiiiiid = Module["dynCall_fiiiiiiiiid"] = (function() {
    return Module["asm"]["dynCall_fiiiiiiiiid"].apply(null, arguments)
});
var dynCall_viiifii = Module["dynCall_viiifii"] = (function() {
    return Module["asm"]["dynCall_viiifii"].apply(null, arguments)
});
var dynCall_viiiiidii = Module["dynCall_viiiiidii"] = (function() {
    return Module["asm"]["dynCall_viiiiidii"].apply(null, arguments)
});
var dynCall_fiiiii = Module["dynCall_fiiiii"] = (function() {
    return Module["asm"]["dynCall_fiiiii"].apply(null, arguments)
});
var dynCall_iif = Module["dynCall_iif"] = (function() {
    return Module["asm"]["dynCall_iif"].apply(null, arguments)
});
var dynCall_viiiiiiiid = Module["dynCall_viiiiiiiid"] = (function() {
    return Module["asm"]["dynCall_viiiiiiiid"].apply(null, arguments)
});
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = (function() {
    return Module["asm"]["dynCall_viiiiiii"].apply(null, arguments)
});
var dynCall_viiiidi = Module["dynCall_viiiidi"] = (function() {
    return Module["asm"]["dynCall_viiiidi"].apply(null, arguments)
});
var dynCall_viiiiddiiid = Module["dynCall_viiiiddiiid"] = (function() {
    return Module["asm"]["dynCall_viiiiddiiid"].apply(null, arguments)
});
var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = (function() {
    return Module["asm"]["dynCall_viiiiiid"].apply(null, arguments)
});
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = (function() {
    return Module["asm"]["dynCall_viiiiiiiii"].apply(null, arguments)
});
var dynCall_iii = Module["dynCall_iii"] = (function() {
    return Module["asm"]["dynCall_iii"].apply(null, arguments)
});
var dynCall_viiiddii = Module["dynCall_viiiddii"] = (function() {
    return Module["asm"]["dynCall_viiiddii"].apply(null, arguments)
});
var dynCall_viiiiiidi = Module["dynCall_viiiiiidi"] = (function() {
    return Module["asm"]["dynCall_viiiiiidi"].apply(null, arguments)
});
var dynCall_vdiii = Module["dynCall_vdiii"] = (function() {
    return Module["asm"]["dynCall_vdiii"].apply(null, arguments)
});
var dynCall_iiiddddddi = Module["dynCall_iiiddddddi"] = (function() {
    return Module["asm"]["dynCall_iiiddddddi"].apply(null, arguments)
});
var dynCall_viiiiidiiiii = Module["dynCall_viiiiidiiiii"] = (function() {
    return Module["asm"]["dynCall_viiiiidiiiii"].apply(null, arguments)
});
var dynCall_viii = Module["dynCall_viii"] = (function() {
    return Module["asm"]["dynCall_viii"].apply(null, arguments)
});
var dynCall_v = Module["dynCall_v"] = (function() {
    return Module["asm"]["dynCall_v"].apply(null, arguments)
});
var dynCall_viid = Module["dynCall_viid"] = (function() {
    return Module["asm"]["dynCall_viid"].apply(null, arguments)
});
var dynCall_viiiiff = Module["dynCall_viiiiff"] = (function() {
    return Module["asm"]["dynCall_viiiiff"].apply(null, arguments)
});
var dynCall_viif = Module["dynCall_viif"] = (function() {
    return Module["asm"]["dynCall_viif"].apply(null, arguments)
});
var dynCall_iiiddiid = Module["dynCall_iiiddiid"] = (function() {
    return Module["asm"]["dynCall_iiiddiid"].apply(null, arguments)
});
var dynCall_viiiiidiiii = Module["dynCall_viiiiidiiii"] = (function() {
    return Module["asm"]["dynCall_viiiiidiiii"].apply(null, arguments)
});
var dynCall_vi = Module["dynCall_vi"] = (function() {
    return Module["asm"]["dynCall_vi"].apply(null, arguments)
});
var dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = (function() {
    return Module["asm"]["dynCall_iiiiiiiiiii"].apply(null, arguments)
});
var dynCall_viiiidiiiidi = Module["dynCall_viiiidiiiidi"] = (function() {
    return Module["asm"]["dynCall_viiiidiiiidi"].apply(null, arguments)
});
var dynCall_ii = Module["dynCall_ii"] = (function() {
    return Module["asm"]["dynCall_ii"].apply(null, arguments)
});
var dynCall_viijii = Module["dynCall_viijii"] = (function() {
    return Module["asm"]["dynCall_viijii"].apply(null, arguments)
});
var dynCall_viiiifff = Module["dynCall_viiiifff"] = (function() {
    return Module["asm"]["dynCall_viiiifff"].apply(null, arguments)
});
var dynCall_viiiiiiiddi = Module["dynCall_viiiiiiiddi"] = (function() {
    return Module["asm"]["dynCall_viiiiiiiddi"].apply(null, arguments)
});
var dynCall_viifi = Module["dynCall_viifi"] = (function() {
    return Module["asm"]["dynCall_viifi"].apply(null, arguments)
});
var dynCall_viiff = Module["dynCall_viiff"] = (function() {
    return Module["asm"]["dynCall_viiff"].apply(null, arguments)
});
var dynCall_viiiiffi = Module["dynCall_viiiiffi"] = (function() {
    return Module["asm"]["dynCall_viiiiffi"].apply(null, arguments)
});
var dynCall_iiifi = Module["dynCall_iiifi"] = (function() {
    return Module["asm"]["dynCall_iiifi"].apply(null, arguments)
});
var dynCall_vidii = Module["dynCall_vidii"] = (function() {
    return Module["asm"]["dynCall_vidii"].apply(null, arguments)
});
var dynCall_vididdii = Module["dynCall_vididdii"] = (function() {
    return Module["asm"]["dynCall_vididdii"].apply(null, arguments)
});
var dynCall_viiiddiii = Module["dynCall_viiiddiii"] = (function() {
    return Module["asm"]["dynCall_viiiddiii"].apply(null, arguments)
});
var dynCall_viiiffii = Module["dynCall_viiiffii"] = (function() {
    return Module["asm"]["dynCall_viiiffii"].apply(null, arguments)
});
var dynCall_viiiiiidiiiii = Module["dynCall_viiiiiidiiiii"] = (function() {
    return Module["asm"]["dynCall_viiiiiidiiiii"].apply(null, arguments)
});
var dynCall_fiiiiii = Module["dynCall_fiiiiii"] = (function() {
    return Module["asm"]["dynCall_fiiiiii"].apply(null, arguments)
});
var dynCall_viiiifii = Module["dynCall_viiiifii"] = (function() {
    return Module["asm"]["dynCall_viiiifii"].apply(null, arguments)
});
var dynCall_viffff = Module["dynCall_viffff"] = (function() {
    return Module["asm"]["dynCall_viffff"].apply(null, arguments)
});
var dynCall_iiii = Module["dynCall_iiii"] = (function() {
    return Module["asm"]["dynCall_iiii"].apply(null, arguments)
});
var dynCall_viididii = Module["dynCall_viididii"] = (function() {
    return Module["asm"]["dynCall_viididii"].apply(null, arguments)
});
var dynCall_iiif = Module["dynCall_iiif"] = (function() {
    return Module["asm"]["dynCall_iiif"].apply(null, arguments)
});
var dynCall_viiiffi = Module["dynCall_viiiffi"] = (function() {
    return Module["asm"]["dynCall_viiiffi"].apply(null, arguments)
});
var dynCall_diiiii = Module["dynCall_diiiii"] = (function() {
    return Module["asm"]["dynCall_diiiii"].apply(null, arguments)
});
var dynCall_diiiid = Module["dynCall_diiiid"] = (function() {
    return Module["asm"]["dynCall_diiiid"].apply(null, arguments)
});
var dynCall_iiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiii"] = (function() {
    return Module["asm"]["dynCall_iiiiiiiiiiiii"].apply(null, arguments)
});
var dynCall_iiiifiii = Module["dynCall_iiiifiii"] = (function() {
    return Module["asm"]["dynCall_iiiifiii"].apply(null, arguments)
});
var dynCall_fi = Module["dynCall_fi"] = (function() {
    return Module["asm"]["dynCall_fi"].apply(null, arguments)
});
var dynCall_viiiiiffii = Module["dynCall_viiiiiffii"] = (function() {
    return Module["asm"]["dynCall_viiiiiffii"].apply(null, arguments)
});
var dynCall_iiidid = Module["dynCall_iiidid"] = (function() {
    return Module["asm"]["dynCall_iiidid"].apply(null, arguments)
});
var dynCall_iid = Module["dynCall_iid"] = (function() {
    return Module["asm"]["dynCall_iid"].apply(null, arguments)
});
var dynCall_i = Module["dynCall_i"] = (function() {
    return Module["asm"]["dynCall_i"].apply(null, arguments)
});
var dynCall_iiiiidii = Module["dynCall_iiiiidii"] = (function() {
    return Module["asm"]["dynCall_iiiiidii"].apply(null, arguments)
});
var dynCall_diiiiii = Module["dynCall_diiiiii"] = (function() {
    return Module["asm"]["dynCall_diiiiii"].apply(null, arguments)
});
var dynCall_vifffff = Module["dynCall_vifffff"] = (function() {
    return Module["asm"]["dynCall_vifffff"].apply(null, arguments)
});
var dynCall_viiiiidiii = Module["dynCall_viiiiidiii"] = (function() {
    return Module["asm"]["dynCall_viiiiidiii"].apply(null, arguments)
});
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = (function() {
    return Module["asm"]["dynCall_iiiiiiiii"].apply(null, arguments)
});
var dynCall_viididdii = Module["dynCall_viididdii"] = (function() {
    return Module["asm"]["dynCall_viididdii"].apply(null, arguments)
});
var dynCall_viiii = Module["dynCall_viiii"] = (function() {
    return Module["asm"]["dynCall_viiii"].apply(null, arguments)
});
var dynCall_viiiidd = Module["dynCall_viiiidd"] = (function() {
    return Module["asm"]["dynCall_viiiidd"].apply(null, arguments)
});
var dynCall_vidiii = Module["dynCall_vidiii"] = (function() {
    return Module["asm"]["dynCall_vidiii"].apply(null, arguments)
});
var dynCall_iifffff = Module["dynCall_iifffff"] = (function() {
    return Module["asm"]["dynCall_iifffff"].apply(null, arguments)
});
Runtime.stackAlloc = Module["stackAlloc"];
Runtime.stackSave = Module["stackSave"];
Runtime.stackRestore = Module["stackRestore"];
Runtime.establishStackSpace = Module["establishStackSpace"];
Runtime.setTempRet0 = Module["setTempRet0"];
Runtime.getTempRet0 = Module["getTempRet0"];
Module["asm"] = asm;
if (memoryInitializer) {
    if (typeof Module["locateFile"] === "function") {
        memoryInitializer = Module["locateFile"](memoryInitializer)
    } else if (Module["memoryInitializerPrefixURL"]) {
        memoryInitializer = Module["memoryInitializerPrefixURL"] + memoryInitializer
    }
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
        var data = Module["readBinary"](memoryInitializer);
        HEAPU8.set(data, Runtime.GLOBAL_BASE)
    } else {
        addRunDependency("memory initializer");
        var applyMemoryInitializer = (function(data) {
            if (data.byteLength) data = new Uint8Array(data);
            HEAPU8.set(data, Runtime.GLOBAL_BASE);
            if (Module["memoryInitializerRequest"]) delete Module["memoryInitializerRequest"].response;
            removeRunDependency("memory initializer")
        });

        function doBrowserLoad() {
            Module["readAsync"](memoryInitializer, applyMemoryInitializer, (function() {
                throw "could not load memory initializer " + memoryInitializer
            }))
        }
        if (Module["memoryInitializerRequest"]) {
            function useRequest() {
                var request = Module["memoryInitializerRequest"];
                if (request.status !== 200 && request.status !== 0) {
                    console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: " + request.status + ", retrying " + memoryInitializer);
                    doBrowserLoad();
                    return
                }
                applyMemoryInitializer(request.response)
            }
            if (Module["memoryInitializerRequest"].response) {
                setTimeout(useRequest, 0)
            } else {
                Module["memoryInitializerRequest"].addEventListener("load", useRequest)
            }
        } else {
            doBrowserLoad()
        }
    }
}
Module["then"] = (function(func) {
    if (Module["calledRun"]) {
        func(Module)
    } else {
        var old = Module["onRuntimeInitialized"];
        Module["onRuntimeInitialized"] = (function() {
            if (old) old();
            func(Module)
        })
    }
    return Module
});

function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
    if (!Module["calledRun"]) run();
    if (!Module["calledRun"]) dependenciesFulfilled = runCaller
};
Module["callMain"] = Module.callMain = function callMain(args) {
    args = args || [];
    ensureInitRuntime();
    var argc = args.length + 1;

    function pad() {
        for (var i = 0; i < 4 - 1; i++) {
            argv.push(0)
        }
    }
    var argv = [allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL)];
    pad();
    for (var i = 0; i < argc - 1; i = i + 1) {
        argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
        pad()
    }
    argv.push(0);
    argv = allocate(argv, "i32", ALLOC_NORMAL);
    try {
        var ret = Module["_main"](argc, argv, 0);
        exit(ret, true)
    } catch (e) {
        if (e instanceof ExitStatus) {
            return
        } else if (e == "SimulateInfiniteLoop") {
            Module["noExitRuntime"] = true;
            return
        } else {
            var toLog = e;
            if (e && typeof e === "object" && e.stack) {
                toLog = [e, e.stack]
            }
            Module.printErr("exception thrown: " + toLog);
            Module["quit"](1, e)
        }
    } finally {
        calledMain = true
    }
};

function run(args) {
    args = args || Module["arguments"];
    if (preloadStartTime === null) preloadStartTime = Date.now();
    if (runDependencies > 0) {
        return
    }
    preRun();
    if (runDependencies > 0) return;
    if (Module["calledRun"]) return;

    function doRun() {
        if (Module["calledRun"]) return;
        Module["calledRun"] = true;
        if (ABORT) return;
        ensureInitRuntime();
        preMain();
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        if (Module["_main"] && shouldRunNow) Module["callMain"](args);
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout((function() {
            setTimeout((function() {
                Module["setStatus"]("")
            }), 1);
            doRun()
        }), 1)
    } else {
        doRun()
    }
}
Module["run"] = Module.run = run;

function exit(status, implicit) {
    if (implicit && Module["noExitRuntime"]) {
        return
    }
    if (Module["noExitRuntime"]) {} else {
        ABORT = true;
        EXITSTATUS = status;
        STACKTOP = initialStackTop;
        exitRuntime();
        if (Module["onExit"]) Module["onExit"](status)
    }
    if (ENVIRONMENT_IS_NODE) {
        process["exit"](status)
    }
    Module["quit"](status, new ExitStatus(status))
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];

function abort(what) {
    if (what !== undefined) {
        Module.print(what);
        Module.printErr(what);
        what = JSON.stringify(what)
    } else {
        what = ""
    }
    ABORT = true;
    EXITSTATUS = 1;
    var extra = "\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.";
    var output = "abort(" + what + ") at " + stackTrace() + extra;
    if (abortDecorators) {
        abortDecorators.forEach((function(decorator) {
            output = decorator(output, what)
        }))
    }
    throw output
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
    shouldRunNow = false
}
run()
  return cv;
};
if (typeof module === "object" && module.exports) {
  module['exports'] = cv;
};

    return cv(Module);
}));
console.log('done loading')

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Sets up an enviroment for detecting that 
 * the camera is looking at objects.
 */

'use strict';
var EventEmitter = require('fast-event-emitter');
var util = require('util');

/*global THREE*/
/**
 * Keeps track of interactive 3D elements and 
 * can be used to trigger events on them.
 *
 * The domElement is to pick up touch ineractions
 * 
 * @param  {[type]} domElement [description]
 * @return {[type]}            [description]
 */
module.exports = function GoTargetConfig(domElement) {
	var _this2 = this;

	function GoTarget(node) {
		var _this = this;

		EventEmitter.call(this);

		this.position = node.position;
		this.hasHover = false;
		this.sprite = node;
		this.sprite.material.opacity = 0.5;

		this.on('hover', function () {
			_this.hasHover = true;
			_this.sprite.material.opacity = 1;
		});

		this.on('hoverOut', function () {
			_this.hasHover = false;
			_this.sprite.material.opacity = 0.5;
		});

		this.hide = function () {
			_this.sprite.visible = false;
		};

		this.show = function () {
			_this.sprite.visible = true;
		};
	}
	util.inherits(GoTarget, EventEmitter);

	this.targets = new Map();

	this.detectInteractions = function (camera) {

		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
		var hits = raycaster.intersectObjects(Array.from(this.targets.values()).map(function (target) {
			return target.sprite;
		}).filter(function (sprite) {
			return sprite.visible;
		}));

		var target = false;

		if (hits.length) {

			// Show hidden text sprite child
			target = this.targets.get(hits[0].object);
			if (target) target.emit('hover');
		}

		// if it is not the one just marked for highlight
		// and it used to be highlighted un highlight it.
		Array.from(this.targets.values()).filter(function (eachTarget) {
			return eachTarget !== target;
		}).forEach(function (eachNotHit) {
			if (eachNotHit.hasHover) eachNotHit.emit('hoverOut');
		});
	};

	var interact = function interact(event) {
		Array.from(_this2.targets.values()).forEach(function (target) {
			if (target.hasHover) {
				target.emit(event.type);
			}
		});
	};
	this.interact = interact;

	domElement.addEventListener('click', interact);
	domElement.addEventListener('mousedown', interact);
	domElement.addEventListener('mouseup', interact);
	domElement.addEventListener('touchup', interact);
	domElement.addEventListener('touchdown', interact);

	this.makeTarget = function (node) {
		var newTarget = new GoTarget(node);
		_this2.targets.set(node, newTarget);
		return newTarget;
	};
};

},{"fast-event-emitter":12,"util":11}],2:[function(require,module,exports){
'use strict';

function addScript(url) {
	return new Promise(function (resolve, reject) {
		var script = document.createElement('script');
		script.setAttribute('src', url);
		document.head.appendChild(script);
		script.onload = resolve;
		script.onerror = reject;
	});
}

module.exports = addScript;

},{}],3:[function(require,module,exports){
/*global THREE*/
'use strict';

module.exports = function initSky() {

	// Add Sky Mesh
	var sky = new THREE.Sky();

	var effectController = {
		turbidity: 10,
		reileigh: 2,
		mieCoefficient: 0.005,
		mieDirectionalG: 0.8,
		luminance: 1,
		inclination: 0.49, // elevation / inclination
		azimuth: 0.25 };

	// Facing front,
	var distance = 400000;

	function initUniforms() {

		var uniforms = sky.uniforms;
		var sunPos = new THREE.Vector3();
		uniforms.turbidity.value = effectController.turbidity;
		uniforms.reileigh.value = effectController.reileigh;
		uniforms.luminance.value = effectController.luminance;
		uniforms.mieCoefficient.value = effectController.mieCoefficient;
		uniforms.mieDirectionalG.value = effectController.mieDirectionalG;

		var theta = Math.PI * (effectController.inclination - 0.5);
		var phi = 2 * Math.PI * (effectController.azimuth - 0.5);

		sunPos.x = distance * Math.cos(phi);
		sunPos.y = distance * Math.sin(phi) * Math.sin(theta);
		sunPos.z = distance * Math.sin(phi) * Math.cos(theta);

		sky.uniforms.sunPosition.value.copy(sunPos);
	}
	initUniforms();

	return sky.mesh;
};

},{}],4:[function(require,module,exports){
// From http://stemkoski.github.io/Three.js/Sprite-Text-Labels.html
/*global THREE*/
'use strict';

function makeTextSprite(message, parameters) {
	if (parameters === undefined) parameters = {};

	var fontface = parameters.hasOwnProperty("fontface") ? parameters["fontface"] : "Arial";

	var borderThickness = parameters.hasOwnProperty("borderThickness") ? parameters["borderThickness"] : 2;

	// may tweaked later to scale text
	var size = parameters.hasOwnProperty("size") ? parameters["size"] : 1;

	var canvas1 = document.createElement('canvas');
	var context1 = canvas1.getContext('2d');
	var height = 256;

	function setStyle(context) {

		context.font = "Bold " + (height - borderThickness) + "px " + fontface;
		context.textAlign = 'center';
		context.textBaseline = 'middle';

		context.lineWidth = borderThickness;

		// text color
		context.strokeStyle = "rgba(255, 255, 255, 1.0)";
		context.fillStyle = "rgba(0, 0, 0, 1.0)";
	}

	setStyle(context1);

	var canvas2 = document.createElement('canvas');

	// Make the canvas width a power of 2 larger than the text width
	var measure = context1.measureText(message);
	canvas2.width = Math.pow(2, Math.ceil(Math.log2(measure.width)));
	canvas2.height = height;
	console.log(measure);
	var context2 = canvas2.getContext('2d');

	context2.rect(0, 0, canvas2.width, canvas2.height);
	context2.fillStyle = "red";
	context2.fill();

	setStyle(context2);

	context2.strokeText(message, canvas2.width / 2, canvas2.height / 2);
	context2.fillText(message, canvas2.width / 2, canvas2.height / 2);

	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas2);
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
	var sprite = new THREE.Sprite(spriteMaterial);

	var maxWidth = height * 4;

	if (canvas2.width > maxWidth) size *= maxWidth / canvas2.width;
	console.log(canvas2.width, canvas2.height);

	// get size data (height depends only on font size)
	sprite.scale.set(size * canvas2.width / canvas2.height, size, 1);
	return sprite;
}

module.exports = makeTextSprite;

},{}],5:[function(require,module,exports){
/* global THREE, DeviceOrientationController */
'use strict';
var EventEmitter = require('fast-event-emitter');
var util = require('util');

var l = new THREE.ObjectLoader();
var loadScene = function loadScene(id) {
	return new Promise(function (resolve, reject) {
		l.load('models/' + id + '.json', resolve, undefined, reject);
	});
};

function pickObjectsHelper(root) {

	var collection = {};

	for (var _len = arguments.length, namesIn = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
		namesIn[_key - 1] = arguments[_key];
	}

	var names = new Set(namesIn);

	(function pickObjects(root) {
		if (root.children) {
			root.children.forEach(function (node) {
				if (names.has(node.name)) {
					collection[node.name] = node;
					names['delete'](node.name);
				}
				if (names.size) {
					pickObjects(node);
				}
			});
		}
	})(root);

	if (names.size) {
		console.warn('Not all objects found: ' + names.values().next().value + ' missing');
	}

	return collection;
}

function myThreeFromJSON(id, options) {
	return loadScene(id).then(function (scene) {
		options.scene = scene;
		return new MyThreeHelper(options);
	});
}

/**
 * Helper object with some useful three functions
 * @param options
 *        scene: scene to use for default
 *        target: where in the dom to put the renderer
 *        camera: name of camera to use in the scene
 */
function MyThreeHelper(options) {
	var _this = this;

	EventEmitter.call(this);

	/**
  * Set up rendering
  */

	options.target = options.target || document.body;

	this.scene = options.scene || new THREE.Scene();

	var camera = pickObjectsHelper(this.scene, options.camera).Camera;

	if (!camera) {
		console.log(camera);
		camera = new THREE.PerspectiveCamera(75, options.target.scrollWidth / options.target.scrollHeight, 0.5, 100);
		camera.position.set(0, 2, 0);
		camera.lookAt(new THREE.Vector3(0, camera.height, -9));
		camera.rotation.y += Math.PI;
	}
	camera.height = camera.position.y; // reference value for how high the camera should be
	// above the ground to maintain the illusion of presence
	camera.fov = 75;

	this.camera = camera;
	var renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setPixelRatio(window.devicePixelRatio);

	this.renderMethod = renderer;

	var setAspect = function setAspect() {
		_this.renderMethod.setSize(options.target.scrollWidth, options.target.scrollHeight);
		camera.aspect = options.target.scrollWidth / options.target.scrollHeight;
		camera.updateProjectionMatrix();
	};
	window.addEventListener('resize', setAspect);
	setAspect();

	options.target.appendChild(renderer.domElement);
	this.domElement = renderer.domElement;

	// This is called to request a render
	this.render = function () {

		// note: three.js includes requestAnimationFrame shim
		_this.emit('prerender');
		_this.renderMethod.render(_this.scene, camera);
	};

	// Change render method to the stereo renderer (one for each eye)
	this.useCardboard = function () {

		var effect = new THREE.StereoEffect(renderer);
		setAspect();
		effect.eyeSeparation = 0.008;
		effect.focalLength = 0.25;
		effect.setSize(window.innerWidth, window.innerHeight);
		_this.renderMethod = effect;
	};

	/**
  * Add a heads up display object to the camera
  */

	var hud = new THREE.Object3D();
	hud.position.set(0, 0, -2.1);
	hud.scale.set(0.2, 0.2, 0.2);
	camera.add(hud);
	this.scene.add(this.camera);
	this.hud = hud;

	/**
  * A map of physics object id to three.js object 3d so we can update all the positions
  */

	var threeObjectsConnectedToPhysics = {};
	this.updateObjects = function (physicsObjects) {
		var l = physicsObjects.length;

		// iterate over the physics physicsObjects
		for (var j = 0; j < l; j++) {

			var i = physicsObjects[j];
			if (threeObjectsConnectedToPhysics[i.id]) {

				var o = threeObjectsConnectedToPhysics[i.id];

				// Support maniplating a single vertex
				if (o.constructor === THREE.Vector3) {
					o.set(i.position.x, i.position.y, i.position.z);
					continue;
				}

				o.position.set(i.position.x, i.position.y, i.position.z);

				// Rotation
				if (i.quaternion) {
					o.rotation.setFromQuaternion(new THREE.Quaternion(i.quaternion.x, i.quaternion.y, i.quaternion.z, i.quaternion.w));
				}
			}
		}
	};

	this.connectPhysicsToThree = function (mesh, physicsMesh) {
		threeObjectsConnectedToPhysics[physicsMesh.id] = mesh;
		if (mesh.constructor === THREE.Vector3) return;
		_this.scene.add(mesh);
	};

	/**
  * Turn on head tracking if manual control is disabled it won't steal mouse/touch events
  */
	this.deviceOrientation = function (_ref) {
		var manualControl = _ref.manualControl;

		// provide dummy element to prevent touch/click hijacking.
		var element = manualControl ? renderer.domElement : document.createElement("DIV");

		if (_this.deviceOrientationController) {
			_this.deviceOrientationController.disconnect();
			_this.deviceOrientationController.element = element;
			_this.deviceOrientationController.connect();
		} else {
			_this.deviceOrientationController = new DeviceOrientationController(_this.camera, element);
			_this.deviceOrientationController.connect();
			_this.on('prerender', function () {
				return _this.deviceOrientationController.update();
			});
		}
	};

	/**
  * Make the object picker available on this object
  */
	this.pickObjectsHelper = pickObjectsHelper;
}
util.inherits(MyThreeHelper, EventEmitter);

module.exports.MyThreeHelper = MyThreeHelper;
module.exports.myThreeFromJSON = myThreeFromJSON;

},{"fast-event-emitter":12,"util":11}],6:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var myWorker = new Worker("./scripts/verletworker.js");
var messageQueue = [];

function workerMessage(message) {

	var id = Date.now() + Math.floor(Math.random() * 1000000);

	// This wraps the message posting/response in a promise, which will resolve if the response doesn't
	// contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
	// controller.postMessage() and set up the onmessage handler independently of a promise, but this is
	// a convenient wrapper.
	return new Promise(function workerMessagePromise(resolve, reject) {
		var data = {
			id: id,
			message: message,
			resolve: resolve,
			reject: reject
		};
		messageQueue.push(data);
	});
}

// Process messages once per frame	
requestAnimationFrame(function process() {
	if (messageQueue.length) {
		(function () {

			var extractedMessages = messageQueue.splice(0);

			var messageToSend = JSON.stringify(extractedMessages.map(function (i) {
				return { message: i.message, id: i.id };
			}));

			var messageChannel = new MessageChannel();
			messageChannel.port1.onmessage = function resolveMessagePromise(event) {
				messageChannel.port1.onmessage = undefined;

				// Iterate over the responses and resolve/reject accordingly
				var response = JSON.parse(event.data);
				response.forEach(function (d, i) {
					if (extractedMessages[i].id !== d.id) {
						throw Error('ID Mismatch!!!');
					}
					if (!d.error) {
						extractedMessages[i].resolve(d);
					} else {
						extractedMessages[i].reject(d.error);
					}
				});
			};
			myWorker.postMessage(messageToSend, [messageChannel.port2]);
		})();
	}
	requestAnimationFrame(process);
});

var Verlet = (function () {
	function Verlet() {
		_classCallCheck(this, Verlet);
	}

	_createClass(Verlet, [{
		key: 'init',
		value: function init(options) {
			return workerMessage({ action: 'init', options: options });
		}
	}, {
		key: 'getPoints',
		value: function getPoints() {
			return workerMessage({ action: 'getPoints' }).then(function (e) {
				return e.points;
			});
		}
	}, {
		key: 'addPoint',
		value: function addPoint(pointOptions) {
			return workerMessage({ action: 'addPoint', pointOptions: pointOptions });
		}
	}, {
		key: 'updatePoint',
		value: function updatePoint(pointOptions) {
			return workerMessage({ action: 'updatePoint', pointOptions: pointOptions });
		}
	}, {
		key: 'connectPoints',
		value: function connectPoints(p1, p2, constraintOptions) {
			return workerMessage({ action: 'connectPoints', options: { p1: p1, p2: p2, constraintOptions: constraintOptions } });
		}
	}, {
		key: 'updateConstraint',
		value: function updateConstraint(options) {
			return workerMessage({ action: 'updateConstraint', options: options });
		}
	}, {
		key: 'reset',
		value: function reset() {
			return workerMessage({ action: 'reset' });
		}
	}]);

	return Verlet;
})();

module.exports = Verlet;

},{}],7:[function(require,module,exports){
/*global THREE*/
'use strict';
var addScript = require('./lib/loadScript'); // Promise wrapper for script loading
var VerletWrapper = require('./lib/verletwrapper'); // Wrapper of the verlet worker
var textSprite = require('./lib/textSprite'); // Generally sprites from canvas
var CameraInteractions = require('./lib/camerainteractions'); // Tool for making interactive VR elements
var TWEEN = require('tween.js');

// no hsts so just redirect to https
if (window.location.protocol !== "https:" && window.location.hostname !== 'localhost') {
	window.location.protocol = "https:";
}

function serviceWorker() {

	return new Promise(function (resolve) {

		// Start service worker
		if ('serviceWorker' in navigator) {

			if (navigator.serviceWorker.controller) {
				console.log('Offlining Availble');
				resolve();
			} else {
				navigator.serviceWorker.register('./sw.js').then(function (reg) {
					console.log('sw registered', reg);
				}).then(resolve);
			}
		} else {
			console.error('No Service Worker, assets may not be cached');
			resolve();
		}
	});
}

serviceWorker().then(function () {
	return Promise.all([addScript('https://polyfill.webservices.ft.com/v1/polyfill.min.js?features=fetch,default'), addScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r73/three.min.js')]);
}).then(function () {
	return Promise.all([addScript('https://cdn.rawgit.com/mrdoob/three.js/master/examples/js/effects/StereoEffect.js'), addScript('https://cdn.rawgit.com/mrdoob/three.js/master/examples/js/SkyShader.js'), addScript('https://cdn.rawgit.com/richtr/threeVR/master/js/DeviceOrientationController.js')]);
}).then(function () {
	return require('./lib/threeHelper').myThreeFromJSON('Kitchen/lickthewhisk', {
		camera: 'Camera',
		target: document.body
	});
}).then(function (threeHelper) {
	console.log('Ready');

	var textureLoader = new THREE.TextureLoader();
	var cubeTextureLoader = new THREE.CubeTextureLoader();
	var toTexture = threeHelper.pickObjectsHelper(threeHelper.scene, 'Room', 'Counter');
	var toShiny = threeHelper.pickObjectsHelper(threeHelper.scene, 'LickTheWhisk', 'Whisk', 'SaucePan', 'SaucePan.001', 'SaucePan.002', 'SaucePan.003');
	Object.keys(toTexture).forEach(function (name) {
		textureLoader.load('models/Kitchen/' + name + 'Bake.png', function (map) {
			return toTexture[name].material = new THREE.MeshBasicMaterial({ map: map });
		});
	});

	var path = "models/Kitchen/envmap/";
	var format = '.png';
	var urls = [path + '0004' + format, // +x
	path + '0002' + format, // -x
	path + '0006' + format, // +y
	path + '0005' + format, // -y
	path + '0001' + format, // +z
	path + '0003' + format // -z
	];
	cubeTextureLoader.load(urls, function (envMap) {
		var copper = new THREE.MeshPhongMaterial({ color: 0x99ff99, specular: 0x440000, envMap: envMap, combine: THREE.MixOperation, reflectivity: 0.3, metal: true });
		var aluminium = new THREE.MeshPhongMaterial({ color: 0x888888, specular: 0xaaaaaa, envMap: envMap, combine: THREE.MixOperation, reflectivity: 0.3, metal: true });
		var chocolate = new THREE.MeshPhongMaterial({ color: toShiny.LickTheWhisk.material.color, specular: 0xaaaaaa, envMap: envMap, combine: THREE.MixOperation, reflectivity: 0.3, metal: true });
		Object.keys(toShiny).forEach(function (name) {
			toShiny[name].material = copper;
		});

		toShiny.Whisk.material = aluminium;
		toShiny.LickTheWhisk.material = chocolate;
	});

	var goTargetWorld = new CameraInteractions(threeHelper.domElement);

	// Add a pretty skybox
	var skyBox = require('./lib/sky')();
	skyBox.scale.multiplyScalar(0.0002);
	threeHelper.scene.add(skyBox);

	threeHelper.useCardboard();

	threeHelper.deviceOrientation({ manualControl: true }); // Allow clicking and dragging to move the camera whilst testing

	threeHelper.deviceOrientationController.addEventListener('userinteractionend', function () {
		goTargetWorld.interact({ type: 'click' });
	}); // Allow it still be interacted with when clicks are hijacked

	// Brand lights
	var ambientLight = new THREE.AmbientLight(0xddedff);
	threeHelper.scene.add(ambientLight);

	// Run the verlet physics
	var verlet = new VerletWrapper();
	verlet.init({
		size: {
			x: 20,
			y: 20,
			z: 20
		},
		gravity: true
	}).then(function () {

		var waitingForPoints = false;
		requestAnimationFrame(function animate(time) {
			requestAnimationFrame(animate);
			goTargetWorld.detectInteractions(threeHelper.camera);

			if (!waitingForPoints) {
				verlet.getPoints().then(function (points) {
					threeHelper.updateObjects(points);
					waitingForPoints = false;
				});
				waitingForPoints = true;
			}
			threeHelper.render();
			TWEEN.update(time);
		});

		var map = THREE.ImageUtils.loadTexture("images/reticule.png");
		var material = new THREE.SpriteMaterial({ map: map, color: 0xffffff, fog: false, transparent: true });
		var sprite = new THREE.Sprite(material);
		threeHelper.hud.add(sprite);

		function addButton(str) {
			var sprite = textSprite(str, {
				fontsize: 18,
				fontface: 'Iceland',
				borderThickness: 20
			});
			threeHelper.scene.add(sprite);
			sprite.position.set(5, 5, 5);
			sprite.material.transparent = true;
			return goTargetWorld.makeTarget(sprite);
		}

		window.threeHelper = threeHelper;
	});
});

},{"./lib/camerainteractions":1,"./lib/loadScript":2,"./lib/sky":3,"./lib/textSprite":4,"./lib/threeHelper":5,"./lib/verletwrapper":6,"tween.js":14}],8:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],9:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],10:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],11:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":10,"_process":9,"inherits":8}],12:[function(require,module,exports){
"use strict";
var protoclass = require("protoclass");

/**
 * @module mojo
 * @submodule mojo-core
 */

/**
 * @class EventEmitter
 */

function EventEmitter () {
  this.__events = {};
}

/**
 * adds a listener on the event emitter
 *
 * @method on
 * @param {String} event event to listen on
 * @param {Function} listener to callback when `event` is emitted.
 * @returns {Disposable}
 */


EventEmitter.prototype.on = function (event, listener) {

  if (typeof listener !== "function") {
    throw new Error("listener must be a function for event '"+event+"'");
  }

  var listeners;
  if (!(listeners = this.__events[event])) {
    this.__events[event] = listener;
  } else if (typeof listeners === "function") {
    this.__events[event] = [listeners, listener];
  } else {
    listeners.push(listener);
  }

  var self = this;

  return {
    dispose: function() {
      self.off(event, listener);
    }
  };
};

/**
 * removes an event emitter
 * @method off
 * @param {String} event to remove
 * @param {Function} listener to remove
 */

EventEmitter.prototype.off = function (event, listener) {

  var listeners;

  if(!(listeners = this.__events[event])) {
    return;
  }

  if (typeof listeners === "function") {
    this.__events[event] = undefined;
  } else {
    var i = listeners.indexOf(listener);
    if (~i) listeners.splice(i, 1);
    if (!listeners.length) {
      this.__events[event] = undefined;
    }
  }
};

/**
 * adds a listener on the event emitter
 * @method once
 * @param {String} event event to listen on
 * @param {Function} listener to callback when `event` is emitted.
 * @returns {Disposable}
 */


EventEmitter.prototype.once = function (event, listener) {

  if (typeof listener !== "function") {
    throw new Error("listener must be a function for event '"+event+"'");
  }

  function listener2 () {
    disp.dispose();
    listener.apply(this, arguments);
  }

  var disp = this.on(event, listener2);
  disp.target = this;
  return disp;
};

/**
 * emits an event
 * @method emit
 * @param {String} event
 * @param {String}, `data...` data to emit
 */


EventEmitter.prototype.emit = function (event) {

  if (this.__events[event] === undefined) return;

  var listeners = this.__events[event],
  n = arguments.length,
  args,
  i,
  j;

  if (typeof listeners === "function") {
    if (n === 1) {
      listeners();
    } else {
      switch(n) {
        case 2:
          listeners(arguments[1]);
          break;
        case 3:
          listeners(arguments[1], arguments[2]);
          break;
        case 4:
          listeners(arguments[1], arguments[2], arguments[3]);
          break;
        default:
          args = new Array(n - 1);
          for(i = 1; i < n; i++) args[i-1] = arguments[i];
          listeners.apply(this, args);
    }
  }
  } else {
    args = new Array(n - 1);
    for(i = 1; i < n; i++) args[i-1] = arguments[i];
    for(j = listeners.length; j--;) {
      if(listeners[j]) listeners[j].apply(this, args);
    }
  }
};

/**
 * removes all listeners
 * @method removeAllListeners
 * @param {String} event (optional) removes all listeners of `event`. Omitting will remove everything.
 */

EventEmitter.prototype.removeAllListeners = function (event) {
  if (arguments.length === 1) {
    this.__events[event] = undefined;
  } else {
    this.__events = {};
  }
};

module.exports = EventEmitter;

},{"protoclass":13}],13:[function(require,module,exports){
function _copy (to, from) {

  for (var i = 0, n = from.length; i < n; i++) {

    var target = from[i];

    for (var property in target) {
      to[property] = target[property];
    }
  }

  return to;
}

function protoclass (parent, child) {

  var mixins = Array.prototype.slice.call(arguments, 2);

  if (typeof child !== "function") {
    if(child) mixins.unshift(child); // constructor is a mixin
    child   = parent;
    parent  = function() { };
  }

  _copy(child, parent); 

  function ctor () {
    this.constructor = child;
  }

  ctor.prototype  = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  child.parent    = child.superclass = parent;

  _copy(child.prototype, mixins);

  protoclass.setup(child);

  return child;
}

protoclass.setup = function (child) {


  if (!child.extend) {
    child.extend = function(constructor) {

      var args = Array.prototype.slice.call(arguments, 0);

      if (typeof constructor !== "function") {
        args.unshift(constructor = function () {
          constructor.parent.apply(this, arguments);
        });
      }

      return protoclass.apply(this, [this].concat(args));
    }

    child.mixin = function(proto) {
      _copy(this.prototype, arguments);
    }

    child.create = function () {
      var obj = Object.create(child.prototype);
      child.apply(obj, arguments);
      return obj;
    }
  }

  return child;
}


module.exports = protoclass;
},{}],14:[function(require,module,exports){
/**
 * Tween.js - Licensed under the MIT license
 * https://github.com/tweenjs/tween.js
 * ----------------------------------------------
 *
 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
 * Thank you all, you're awesome!
 */

// Include a performance.now polyfill
(function () {

	if ('performance' in window === false) {
		window.performance = {};
	}

	// IE 8
	Date.now = (Date.now || function () {
		return new Date().getTime();
	});

	if ('now' in window.performance === false) {
		var offset = window.performance.timing && window.performance.timing.navigationStart ? window.performance.timing.navigationStart
		                                                                                    : Date.now();

		window.performance.now = function () {
			return Date.now() - offset;
		};
	}

})();

var TWEEN = TWEEN || (function () {

	var _tweens = [];

	return {

		getAll: function () {

			return _tweens;

		},

		removeAll: function () {

			_tweens = [];

		},

		add: function (tween) {

			_tweens.push(tween);

		},

		remove: function (tween) {

			var i = _tweens.indexOf(tween);

			if (i !== -1) {
				_tweens.splice(i, 1);
			}

		},

		update: function (time) {

			if (_tweens.length === 0) {
				return false;
			}

			var i = 0;

			time = time !== undefined ? time : window.performance.now();

			while (i < _tweens.length) {

				if (_tweens[i].update(time)) {
					i++;
				} else {
					_tweens.splice(i, 1);
				}

			}

			return true;

		}
	};

})();

TWEEN.Tween = function (object) {

	var _object = object;
	var _valuesStart = {};
	var _valuesEnd = {};
	var _valuesStartRepeat = {};
	var _duration = 1000;
	var _repeat = 0;
	var _yoyo = false;
	var _isPlaying = false;
	var _reversed = false;
	var _delayTime = 0;
	var _startTime = null;
	var _easingFunction = TWEEN.Easing.Linear.None;
	var _interpolationFunction = TWEEN.Interpolation.Linear;
	var _chainedTweens = [];
	var _onStartCallback = null;
	var _onStartCallbackFired = false;
	var _onUpdateCallback = null;
	var _onCompleteCallback = null;
	var _onStopCallback = null;

	// Set all starting values present on the target object
	for (var field in object) {
		_valuesStart[field] = parseFloat(object[field], 10);
	}

	this.to = function (properties, duration) {

		if (duration !== undefined) {
			_duration = duration;
		}

		_valuesEnd = properties;

		return this;

	};

	this.start = function (time) {

		TWEEN.add(this);

		_isPlaying = true;

		_onStartCallbackFired = false;

		_startTime = time !== undefined ? time : window.performance.now();
		_startTime += _delayTime;

		for (var property in _valuesEnd) {

			// Check if an Array was provided as property value
			if (_valuesEnd[property] instanceof Array) {

				if (_valuesEnd[property].length === 0) {
					continue;
				}

				// Create a local copy of the Array with the start value at the front
				_valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);

			}

			_valuesStart[property] = _object[property];

			if ((_valuesStart[property] instanceof Array) === false) {
				_valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
			}

			_valuesStartRepeat[property] = _valuesStart[property] || 0;

		}

		return this;

	};

	this.stop = function () {

		if (!_isPlaying) {
			return this;
		}

		TWEEN.remove(this);
		_isPlaying = false;

		if (_onStopCallback !== null) {
			_onStopCallback.call(_object);
		}

		this.stopChainedTweens();
		return this;

	};

	this.stopChainedTweens = function () {

		for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
			_chainedTweens[i].stop();
		}

	};

	this.delay = function (amount) {

		_delayTime = amount;
		return this;

	};

	this.repeat = function (times) {

		_repeat = times;
		return this;

	};

	this.yoyo = function (yoyo) {

		_yoyo = yoyo;
		return this;

	};


	this.easing = function (easing) {

		_easingFunction = easing;
		return this;

	};

	this.interpolation = function (interpolation) {

		_interpolationFunction = interpolation;
		return this;

	};

	this.chain = function () {

		_chainedTweens = arguments;
		return this;

	};

	this.onStart = function (callback) {

		_onStartCallback = callback;
		return this;

	};

	this.onUpdate = function (callback) {

		_onUpdateCallback = callback;
		return this;

	};

	this.onComplete = function (callback) {

		_onCompleteCallback = callback;
		return this;

	};

	this.onStop = function (callback) {

		_onStopCallback = callback;
		return this;

	};

	this.update = function (time) {

		var property;
		var elapsed;
		var value;

		if (time < _startTime) {
			return true;
		}

		if (_onStartCallbackFired === false) {

			if (_onStartCallback !== null) {
				_onStartCallback.call(_object);
			}

			_onStartCallbackFired = true;

		}

		elapsed = (time - _startTime) / _duration;
		elapsed = elapsed > 1 ? 1 : elapsed;

		value = _easingFunction(elapsed);

		for (property in _valuesEnd) {

			var start = _valuesStart[property] || 0;
			var end = _valuesEnd[property];

			if (end instanceof Array) {

				_object[property] = _interpolationFunction(end, value);

			} else {

				// Parses relative end values with start as base (e.g.: +10, -3)
				if (typeof (end) === 'string') {
					end = start + parseFloat(end, 10);
				}

				// Protect against non numeric properties.
				if (typeof (end) === 'number') {
					_object[property] = start + (end - start) * value;
				}

			}

		}

		if (_onUpdateCallback !== null) {
			_onUpdateCallback.call(_object, value);
		}

		if (elapsed === 1) {

			if (_repeat > 0) {

				if (isFinite(_repeat)) {
					_repeat--;
				}

				// Reassign starting values, restart by making startTime = now
				for (property in _valuesStartRepeat) {

					if (typeof (_valuesEnd[property]) === 'string') {
						_valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property], 10);
					}

					if (_yoyo) {
						var tmp = _valuesStartRepeat[property];

						_valuesStartRepeat[property] = _valuesEnd[property];
						_valuesEnd[property] = tmp;
					}

					_valuesStart[property] = _valuesStartRepeat[property];

				}

				if (_yoyo) {
					_reversed = !_reversed;
				}

				_startTime = time + _delayTime;

				return true;

			} else {

				if (_onCompleteCallback !== null) {
					_onCompleteCallback.call(_object);
				}

				for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
					// Make the chained tweens start exactly at the time they should,
					// even if the `update()` method was called way past the duration of the tween
					_chainedTweens[i].start(_startTime + _duration);
				}

				return false;

			}

		}

		return true;

	};

};


TWEEN.Easing = {

	Linear: {

		None: function (k) {

			return k;

		}

	},

	Quadratic: {

		In: function (k) {

			return k * k;

		},

		Out: function (k) {

			return k * (2 - k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k;
			}

			return - 0.5 * (--k * (k - 2) - 1);

		}

	},

	Cubic: {

		In: function (k) {

			return k * k * k;

		},

		Out: function (k) {

			return --k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k + 2);

		}

	},

	Quartic: {

		In: function (k) {

			return k * k * k * k;

		},

		Out: function (k) {

			return 1 - (--k * k * k * k);

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k;
			}

			return - 0.5 * ((k -= 2) * k * k * k - 2);

		}

	},

	Quintic: {

		In: function (k) {

			return k * k * k * k * k;

		},

		Out: function (k) {

			return --k * k * k * k * k + 1;

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return 0.5 * k * k * k * k * k;
			}

			return 0.5 * ((k -= 2) * k * k * k * k + 2);

		}

	},

	Sinusoidal: {

		In: function (k) {

			return 1 - Math.cos(k * Math.PI / 2);

		},

		Out: function (k) {

			return Math.sin(k * Math.PI / 2);

		},

		InOut: function (k) {

			return 0.5 * (1 - Math.cos(Math.PI * k));

		}

	},

	Exponential: {

		In: function (k) {

			return k === 0 ? 0 : Math.pow(1024, k - 1);

		},

		Out: function (k) {

			return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

		},

		InOut: function (k) {

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if ((k *= 2) < 1) {
				return 0.5 * Math.pow(1024, k - 1);
			}

			return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

		}

	},

	Circular: {

		In: function (k) {

			return 1 - Math.sqrt(1 - k * k);

		},

		Out: function (k) {

			return Math.sqrt(1 - (--k * k));

		},

		InOut: function (k) {

			if ((k *= 2) < 1) {
				return - 0.5 * (Math.sqrt(1 - k * k) - 1);
			}

			return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

		}

	},

	Elastic: {

		In: function (k) {

			var s;
			var a = 0.1;
			var p = 0.4;

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if (!a || a < 1) {
				a = 1;
				s = p / 4;
			} else {
				s = p * Math.asin(1 / a) / (2 * Math.PI);
			}

			return - (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));

		},

		Out: function (k) {

			var s;
			var a = 0.1;
			var p = 0.4;

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if (!a || a < 1) {
				a = 1;
				s = p / 4;
			} else {
				s = p * Math.asin(1 / a) / (2 * Math.PI);
			}

			return (a * Math.pow(2, - 10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);

		},

		InOut: function (k) {

			var s;
			var a = 0.1;
			var p = 0.4;

			if (k === 0) {
				return 0;
			}

			if (k === 1) {
				return 1;
			}

			if (!a || a < 1) {
				a = 1;
				s = p / 4;
			} else {
				s = p * Math.asin(1 / a) / (2 * Math.PI);
			}

			if ((k *= 2) < 1) {
				return - 0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
			}

			return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;

		}

	},

	Back: {

		In: function (k) {

			var s = 1.70158;

			return k * k * ((s + 1) * k - s);

		},

		Out: function (k) {

			var s = 1.70158;

			return --k * k * ((s + 1) * k + s) + 1;

		},

		InOut: function (k) {

			var s = 1.70158 * 1.525;

			if ((k *= 2) < 1) {
				return 0.5 * (k * k * ((s + 1) * k - s));
			}

			return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

		}

	},

	Bounce: {

		In: function (k) {

			return 1 - TWEEN.Easing.Bounce.Out(1 - k);

		},

		Out: function (k) {

			if (k < (1 / 2.75)) {
				return 7.5625 * k * k;
			} else if (k < (2 / 2.75)) {
				return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
			} else if (k < (2.5 / 2.75)) {
				return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
			} else {
				return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
			}

		},

		InOut: function (k) {

			if (k < 0.5) {
				return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
			}

			return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

		}

	}

};

TWEEN.Interpolation = {

	Linear: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.Linear;

		if (k < 0) {
			return fn(v[0], v[1], f);
		}

		if (k > 1) {
			return fn(v[m], v[m - 1], m - f);
		}

		return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

	},

	Bezier: function (v, k) {

		var b = 0;
		var n = v.length - 1;
		var pw = Math.pow;
		var bn = TWEEN.Interpolation.Utils.Bernstein;

		for (var i = 0; i <= n; i++) {
			b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
		}

		return b;

	},

	CatmullRom: function (v, k) {

		var m = v.length - 1;
		var f = m * k;
		var i = Math.floor(f);
		var fn = TWEEN.Interpolation.Utils.CatmullRom;

		if (v[0] === v[m]) {

			if (k < 0) {
				i = Math.floor(f = m * (1 + k));
			}

			return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);

		} else {

			if (k < 0) {
				return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
			}

			if (k > 1) {
				return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
			}

			return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);

		}

	},

	Utils: {

		Linear: function (p0, p1, t) {

			return (p1 - p0) * t + p0;

		},

		Bernstein: function (n, i) {

			var fc = TWEEN.Interpolation.Utils.Factorial;

			return fc(n) / fc(i) / fc(n - i);

		},

		Factorial: (function () {

			var a = [1];

			return function (n) {

				var s = 1;

				if (a[n]) {
					return a[n];
				}

				for (var i = n; i > 1; i--) {
					s *= i;
				}

				a[n] = s;
				return s;

			};

		})(),

		CatmullRom: function (p0, p1, p2, p3, t) {

			var v0 = (p2 - p0) * 0.5;
			var v1 = (p3 - p1) * 0.5;
			var t2 = t * t;
			var t3 = t * t2;

			return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

		}

	}

};

// UMD (Universal Module Definition)
(function (root) {

	if (typeof define === 'function' && define.amd) {

		// AMD
		define([], function () {
			return TWEEN;
		});

	} else if (typeof exports === 'object') {

		// Node.js
		module.exports = TWEEN;

	} else {

		// Global variable
		root.TWEEN = TWEEN;

	}

})(this);

},{}]},{},[7])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvY2FtZXJhaW50ZXJhY3Rpb25zLmpzIiwiL2hvbWUvYWRhL2dpdFdvcmtpbmdEaXIvbGljay10aGUtd2hpc2svYXBwL3NjcmlwdHMvbGliL2xvYWRTY3JpcHQuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvc2t5LmpzIiwiL2hvbWUvYWRhL2dpdFdvcmtpbmdEaXIvbGljay10aGUtd2hpc2svYXBwL3NjcmlwdHMvbGliL3RleHRTcHJpdGUuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvdGhyZWVIZWxwZXIuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvdmVybGV0d3JhcHBlci5qcyIsIi9ob21lL2FkYS9naXRXb3JraW5nRGlyL2xpY2stdGhlLXdoaXNrL2FwcC9zY3JpcHRzL21haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvZmFzdC1ldmVudC1lbWl0dGVyL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mYXN0LWV2ZW50LWVtaXR0ZXIvbm9kZV9tb2R1bGVzL3Byb3RvY2xhc3MvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3R3ZWVuLmpzL3NyYy9Ud2Vlbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0FDS0EsWUFBWSxDQUFDO0FBQ2IsSUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDbkQsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7QUFZN0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLGNBQWMsQ0FBQyxVQUFVLEVBQUU7OztBQUVwRCxVQUFTLFFBQVEsQ0FBQyxJQUFJLEVBQUU7OztBQUV2QixjQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUV4QixNQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDOUIsTUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDdEIsTUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsTUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQzs7QUFFbkMsTUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsWUFBTTtBQUN0QixTQUFLLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDckIsU0FBSyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7R0FDakMsQ0FBQyxDQUFDOztBQUVILE1BQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFlBQU07QUFDekIsU0FBSyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLFNBQUssTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO0dBQ25DLENBQUMsQ0FBQzs7QUFFSCxNQUFJLENBQUMsSUFBSSxHQUFHLFlBQUs7QUFDaEIsU0FBSyxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztHQUM1QixDQUFD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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBTZXRzIHVwIGFuIGVudmlyb21lbnQgZm9yIGRldGVjdGluZyB0aGF0IFxuICogdGhlIGNhbWVyYSBpcyBsb29raW5nIGF0IG9iamVjdHMuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZmFzdC1ldmVudC1lbWl0dGVyJyk7XG5jb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG4vKmdsb2JhbCBUSFJFRSovXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIGludGVyYWN0aXZlIDNEIGVsZW1lbnRzIGFuZCBcbiAqIGNhbiBiZSB1c2VkIHRvIHRyaWdnZXIgZXZlbnRzIG9uIHRoZW0uXG4gKlxuICogVGhlIGRvbUVsZW1lbnQgaXMgdG8gcGljayB1cCB0b3VjaCBpbmVyYWN0aW9uc1xuICogXG4gKiBAcGFyYW0gIHtbdHlwZV19IGRvbUVsZW1lbnQgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBHb1RhcmdldENvbmZpZyhkb21FbGVtZW50KSB7XG5cblx0ZnVuY3Rpb24gR29UYXJnZXQobm9kZSkge1xuXG5cdFx0RXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cblx0XHR0aGlzLnBvc2l0aW9uID0gbm9kZS5wb3NpdGlvbjtcblx0XHR0aGlzLmhhc0hvdmVyID0gZmFsc2U7XG5cdFx0dGhpcy5zcHJpdGUgPSBub2RlO1xuXHRcdHRoaXMuc3ByaXRlLm1hdGVyaWFsLm9wYWNpdHkgPSAwLjU7XG5cblx0XHR0aGlzLm9uKCdob3ZlcicsICgpID0+IHtcblx0XHRcdHRoaXMuaGFzSG92ZXIgPSB0cnVlO1xuXHRcdFx0dGhpcy5zcHJpdGUubWF0ZXJpYWwub3BhY2l0eSA9IDE7XG5cdFx0fSk7XG5cblx0XHR0aGlzLm9uKCdob3Zlck91dCcsICgpID0+IHtcblx0XHRcdHRoaXMuaGFzSG92ZXIgPSBmYWxzZTtcblx0XHRcdHRoaXMuc3ByaXRlLm1hdGVyaWFsLm9wYWNpdHkgPSAwLjU7XG5cdFx0fSk7XG5cblx0XHR0aGlzLmhpZGUgPSAoKSA9Pntcblx0XHRcdHRoaXMuc3ByaXRlLnZpc2libGUgPSBmYWxzZTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zaG93ID0gKCkgPT57XG5cdFx0XHR0aGlzLnNwcml0ZS52aXNpYmxlID0gdHJ1ZTtcblx0XHR9O1xuXHR9XG5cdHV0aWwuaW5oZXJpdHMoR29UYXJnZXQsIEV2ZW50RW1pdHRlcik7XG5cblx0dGhpcy50YXJnZXRzID0gbmV3IE1hcCgpO1xuXG5cdHRoaXMuZGV0ZWN0SW50ZXJhY3Rpb25zID0gZnVuY3Rpb24gKGNhbWVyYSkge1xuXG5cdFx0Y29uc3QgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuXHRcdHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKG5ldyBUSFJFRS5WZWN0b3IyKDAsMCksIGNhbWVyYSk7XG5cdFx0Y29uc3QgaGl0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKFxuXHRcdFx0QXJyYXkuZnJvbSh0aGlzLnRhcmdldHMudmFsdWVzKCkpXG5cdFx0XHQubWFwKHRhcmdldCA9PiB0YXJnZXQuc3ByaXRlKVxuXHRcdFx0LmZpbHRlcihzcHJpdGUgPT4gc3ByaXRlLnZpc2libGUpXG5cdFx0KTtcblxuXHRcdGxldCB0YXJnZXQgPSBmYWxzZTtcblxuXHRcdGlmIChoaXRzLmxlbmd0aCkge1xuXG5cdFx0XHQvLyBTaG93IGhpZGRlbiB0ZXh0IHNwcml0ZSBjaGlsZFxuXHRcdFx0dGFyZ2V0ID0gdGhpcy50YXJnZXRzLmdldChoaXRzWzBdLm9iamVjdCk7XG5cdFx0XHRpZiAodGFyZ2V0KSB0YXJnZXQuZW1pdCgnaG92ZXInKTtcblx0XHR9XG5cblx0XHQvLyBpZiBpdCBpcyBub3QgdGhlIG9uZSBqdXN0IG1hcmtlZCBmb3IgaGlnaGxpZ2h0XG5cdFx0Ly8gYW5kIGl0IHVzZWQgdG8gYmUgaGlnaGxpZ2h0ZWQgdW4gaGlnaGxpZ2h0IGl0LlxuXHRcdEFycmF5LmZyb20odGhpcy50YXJnZXRzLnZhbHVlcygpKVxuXHRcdC5maWx0ZXIoZWFjaFRhcmdldCA9PiBlYWNoVGFyZ2V0ICE9PSB0YXJnZXQpXG5cdFx0LmZvckVhY2goZWFjaE5vdEhpdCA9PiB7XG5cdFx0XHRpZiAoZWFjaE5vdEhpdC5oYXNIb3ZlcikgZWFjaE5vdEhpdC5lbWl0KCdob3Zlck91dCcpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGNvbnN0IGludGVyYWN0ID0gKGV2ZW50KSA9PiB7XG5cdFx0QXJyYXkuZnJvbSh0aGlzLnRhcmdldHMudmFsdWVzKCkpLmZvckVhY2godGFyZ2V0ID0+IHtcblx0XHRcdGlmICh0YXJnZXQuaGFzSG92ZXIpIHtcblx0XHRcdFx0dGFyZ2V0LmVtaXQoZXZlbnQudHlwZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cdHRoaXMuaW50ZXJhY3QgPSBpbnRlcmFjdDtcblxuXHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaW50ZXJhY3QpO1xuXHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGludGVyYWN0KTtcblx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaW50ZXJhY3QpO1xuXHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNodXAnLCBpbnRlcmFjdCk7XG5cdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hkb3duJywgaW50ZXJhY3QpO1xuXG5cdHRoaXMubWFrZVRhcmdldCA9IG5vZGUgPT4ge1xuXHRcdGNvbnN0IG5ld1RhcmdldCA9IG5ldyBHb1RhcmdldChub2RlKTtcblx0XHR0aGlzLnRhcmdldHMuc2V0KG5vZGUsIG5ld1RhcmdldCk7XG5cdFx0cmV0dXJuIG5ld1RhcmdldDtcblx0fTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGFkZFNjcmlwdCh1cmwpIHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0XHR2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cdFx0c2NyaXB0LnNldEF0dHJpYnV0ZSgnc3JjJywgdXJsKTtcblx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cdFx0c2NyaXB0Lm9ubG9hZCA9IHJlc29sdmU7XG5cdFx0c2NyaXB0Lm9uZXJyb3IgPSByZWplY3Q7XG5cdH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFkZFNjcmlwdDtcbiIsIi8qZ2xvYmFsIFRIUkVFKi9cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbml0U2t5KCkge1xuXG5cdC8vIEFkZCBTa3kgTWVzaFxuXHRjb25zdCBza3kgPSBuZXcgVEhSRUUuU2t5KCk7XG5cblx0dmFyIGVmZmVjdENvbnRyb2xsZXIgID0ge1xuXHRcdHR1cmJpZGl0eTogMTAsXG5cdFx0cmVpbGVpZ2g6IDIsXG5cdFx0bWllQ29lZmZpY2llbnQ6IDAuMDA1LFxuXHRcdG1pZURpcmVjdGlvbmFsRzogMC44LFxuXHRcdGx1bWluYW5jZTogMSxcblx0XHRpbmNsaW5hdGlvbjogMC40OSwgLy8gZWxldmF0aW9uIC8gaW5jbGluYXRpb25cblx0XHRhemltdXRoOiAwLjI1LCAvLyBGYWNpbmcgZnJvbnQsXG5cdH07XG5cblx0dmFyIGRpc3RhbmNlID0gNDAwMDAwO1xuXG5cdGZ1bmN0aW9uIGluaXRVbmlmb3JtcygpIHtcblxuXHRcdGNvbnN0IHVuaWZvcm1zID0gc2t5LnVuaWZvcm1zO1xuXHRcdGNvbnN0IHN1blBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdFx0dW5pZm9ybXMudHVyYmlkaXR5LnZhbHVlID0gZWZmZWN0Q29udHJvbGxlci50dXJiaWRpdHk7XG5cdFx0dW5pZm9ybXMucmVpbGVpZ2gudmFsdWUgPSBlZmZlY3RDb250cm9sbGVyLnJlaWxlaWdoO1xuXHRcdHVuaWZvcm1zLmx1bWluYW5jZS52YWx1ZSA9IGVmZmVjdENvbnRyb2xsZXIubHVtaW5hbmNlO1xuXHRcdHVuaWZvcm1zLm1pZUNvZWZmaWNpZW50LnZhbHVlID0gZWZmZWN0Q29udHJvbGxlci5taWVDb2VmZmljaWVudDtcblx0XHR1bmlmb3Jtcy5taWVEaXJlY3Rpb25hbEcudmFsdWUgPSBlZmZlY3RDb250cm9sbGVyLm1pZURpcmVjdGlvbmFsRztcblxuXHRcdHZhciB0aGV0YSA9IE1hdGguUEkgKiAoIGVmZmVjdENvbnRyb2xsZXIuaW5jbGluYXRpb24gLSAwLjUgKTtcblx0XHR2YXIgcGhpID0gMiAqIE1hdGguUEkgKiAoIGVmZmVjdENvbnRyb2xsZXIuYXppbXV0aCAtIDAuNSApO1xuXG5cdFx0c3VuUG9zLnggPSBkaXN0YW5jZSAqIE1hdGguY29zKCBwaGkgKTtcblx0XHRzdW5Qb3MueSA9IGRpc3RhbmNlICogTWF0aC5zaW4oIHBoaSApICogTWF0aC5zaW4oIHRoZXRhICk7XG5cdFx0c3VuUG9zLnogPSBkaXN0YW5jZSAqIE1hdGguc2luKCBwaGkgKSAqIE1hdGguY29zKCB0aGV0YSApO1xuXG5cdFx0c2t5LnVuaWZvcm1zLnN1blBvc2l0aW9uLnZhbHVlLmNvcHkoIHN1blBvcyApO1xuXG5cdH1cblx0aW5pdFVuaWZvcm1zKCk7XG5cblx0cmV0dXJuIHNreS5tZXNoO1xufTtcbiIsIi8vIEZyb20gaHR0cDovL3N0ZW1rb3NraS5naXRodWIuaW8vVGhyZWUuanMvU3ByaXRlLVRleHQtTGFiZWxzLmh0bWxcbi8qZ2xvYmFsIFRIUkVFKi9cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gbWFrZVRleHRTcHJpdGUoIG1lc3NhZ2UsIHBhcmFtZXRlcnMgKSB7XG5cdGlmICggcGFyYW1ldGVycyA9PT0gdW5kZWZpbmVkICkgcGFyYW1ldGVycyA9IHt9O1xuXHRcblx0Y29uc3QgZm9udGZhY2UgPSBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwiZm9udGZhY2VcIikgPyBcblx0XHRwYXJhbWV0ZXJzW1wiZm9udGZhY2VcIl0gOiBcIkFyaWFsXCI7XG5cdFxuXHRjb25zdCBib3JkZXJUaGlja25lc3MgPSBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwiYm9yZGVyVGhpY2tuZXNzXCIpID8gXG5cdFx0cGFyYW1ldGVyc1tcImJvcmRlclRoaWNrbmVzc1wiXSA6IDI7XG5cblx0Ly8gbWF5IHR3ZWFrZWQgbGF0ZXIgdG8gc2NhbGUgdGV4dFxuXHRsZXQgc2l6ZSA9IHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJzaXplXCIpID8gXG5cdFx0cGFyYW1ldGVyc1tcInNpemVcIl0gOiAxO1xuXHRcdFxuXHRjb25zdCBjYW52YXMxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdGNvbnN0IGNvbnRleHQxID0gY2FudmFzMS5nZXRDb250ZXh0KCcyZCcpO1xuXHRjb25zdCBoZWlnaHQgPSAyNTY7XG5cblx0ZnVuY3Rpb24gc2V0U3R5bGUoY29udGV4dCkge1xuXG5cdFx0Y29udGV4dC5mb250ID0gXCJCb2xkIFwiICsgKGhlaWdodCAtIGJvcmRlclRoaWNrbmVzcykgKyBcInB4IFwiICsgZm9udGZhY2U7XG5cdFx0Y29udGV4dC50ZXh0QWxpZ24gPSAnY2VudGVyJztcblx0XHRjb250ZXh0LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xuXHRcdFxuXHRcdGNvbnRleHQubGluZVdpZHRoID0gYm9yZGVyVGhpY2tuZXNzO1xuXG5cdFx0Ly8gdGV4dCBjb2xvclxuXHRcdGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMS4wKVwiO1xuXHRcdGNvbnRleHQuZmlsbFN0eWxlID0gXCJyZ2JhKDAsIDAsIDAsIDEuMClcIjtcblx0fVxuXG5cdHNldFN0eWxlKGNvbnRleHQxKTtcblxuXHRjb25zdCBjYW52YXMyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cblx0Ly8gTWFrZSB0aGUgY2FudmFzIHdpZHRoIGEgcG93ZXIgb2YgMiBsYXJnZXIgdGhhbiB0aGUgdGV4dCB3aWR0aFxuXHRjb25zdCBtZWFzdXJlID0gY29udGV4dDEubWVhc3VyZVRleHQoIG1lc3NhZ2UgKTtcblx0Y2FudmFzMi53aWR0aCA9IE1hdGgucG93KDIsIE1hdGguY2VpbChNYXRoLmxvZzIoIG1lYXN1cmUud2lkdGggKSkpO1xuXHRjYW52YXMyLmhlaWdodCA9IGhlaWdodDtcblx0Y29uc29sZS5sb2cobWVhc3VyZSk7XG5cdGNvbnN0IGNvbnRleHQyID0gY2FudmFzMi5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdGNvbnRleHQyLnJlY3QoMCwgMCwgY2FudmFzMi53aWR0aCwgY2FudmFzMi5oZWlnaHQpO1xuXHRjb250ZXh0Mi5maWxsU3R5bGU9XCJyZWRcIjtcblx0Y29udGV4dDIuZmlsbCgpO1xuXG5cdHNldFN0eWxlKGNvbnRleHQyKTtcblxuXHRjb250ZXh0Mi5zdHJva2VUZXh0KCBtZXNzYWdlLCBjYW52YXMyLndpZHRoLzIsIGNhbnZhczIuaGVpZ2h0LzIpO1xuXHRjb250ZXh0Mi5maWxsVGV4dCggbWVzc2FnZSwgY2FudmFzMi53aWR0aC8yLCBjYW52YXMyLmhlaWdodC8yKTtcblx0XG5cdC8vIGNhbnZhcyBjb250ZW50cyB3aWxsIGJlIHVzZWQgZm9yIGEgdGV4dHVyZVxuXHRjb25zdCB0ZXh0dXJlID0gbmV3IFRIUkVFLlRleHR1cmUoY2FudmFzMikgO1xuXHR0ZXh0dXJlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcblxuXHRjb25zdCBzcHJpdGVNYXRlcmlhbCA9IG5ldyBUSFJFRS5TcHJpdGVNYXRlcmlhbCh7IG1hcDogdGV4dHVyZSwgdHJhbnNwYXJlbnQ6IHRydWUgfSk7XG5cdGNvbnN0IHNwcml0ZSA9IG5ldyBUSFJFRS5TcHJpdGUoc3ByaXRlTWF0ZXJpYWwpO1xuXG5cdGNvbnN0IG1heFdpZHRoID0gaGVpZ2h0ICogNDtcblxuXHRpZiAoY2FudmFzMi53aWR0aCA+IG1heFdpZHRoKSBzaXplICo9IG1heFdpZHRoL2NhbnZhczIud2lkdGg7XG5cdGNvbnNvbGUubG9nKGNhbnZhczIud2lkdGgsIGNhbnZhczIuaGVpZ2h0KTtcbiAgICBcblx0Ly8gZ2V0IHNpemUgZGF0YSAoaGVpZ2h0IGRlcGVuZHMgb25seSBvbiBmb250IHNpemUpXG5cdHNwcml0ZS5zY2FsZS5zZXQoc2l6ZSAqIGNhbnZhczIud2lkdGgvY2FudmFzMi5oZWlnaHQsIHNpemUsIDEpO1xuXHRyZXR1cm4gc3ByaXRlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1ha2VUZXh0U3ByaXRlO1xuIiwiLyogZ2xvYmFsIFRIUkVFLCBEZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIgKi9cbid1c2Ugc3RyaWN0JztcbmNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2Zhc3QtZXZlbnQtZW1pdHRlcicpO1xuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxudmFyIGwgPSBuZXcgVEhSRUUuT2JqZWN0TG9hZGVyKCk7XG5jb25zdCBsb2FkU2NlbmUgPSAoaWQpID0+IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0bC5sb2FkKCdtb2RlbHMvJyArIGlkICsgJy5qc29uJywgcmVzb2x2ZSwgdW5kZWZpbmVkLCByZWplY3QpO1xufSk7XG5cbmZ1bmN0aW9uIHBpY2tPYmplY3RzSGVscGVyKHJvb3QsIC4uLm5hbWVzSW4pIHtcblxuXHRjb25zdCBjb2xsZWN0aW9uID0ge307XG5cdGNvbnN0IG5hbWVzID0gbmV3IFNldChuYW1lc0luKTtcblxuXHQoZnVuY3Rpb24gcGlja09iamVjdHMocm9vdCkge1xuXHRcdGlmIChyb290LmNoaWxkcmVuKSB7XG5cdFx0XHRyb290LmNoaWxkcmVuLmZvckVhY2gobm9kZSA9PiB7XG5cdFx0XHRcdGlmIChuYW1lcy5oYXMobm9kZS5uYW1lKSkge1xuXHRcdFx0XHRcdGNvbGxlY3Rpb25bbm9kZS5uYW1lXSA9IG5vZGU7XG5cdFx0XHRcdFx0bmFtZXMuZGVsZXRlKG5vZGUubmFtZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKG5hbWVzLnNpemUpIHtcblx0XHRcdFx0XHRwaWNrT2JqZWN0cyhub2RlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KShyb290KTtcblxuXHRpZiAobmFtZXMuc2l6ZSkge1xuXHRcdGNvbnNvbGUud2FybignTm90IGFsbCBvYmplY3RzIGZvdW5kOiAnICsgbmFtZXMudmFsdWVzKCkubmV4dCgpLnZhbHVlICsgJyBtaXNzaW5nJyk7XG5cdH1cblxuXHRyZXR1cm4gY29sbGVjdGlvbjtcbn1cblxuZnVuY3Rpb24gbXlUaHJlZUZyb21KU09OKGlkLCBvcHRpb25zKSB7XG5cdHJldHVybiBsb2FkU2NlbmUoaWQpLnRoZW4oc2NlbmUgPT4ge1xuXHRcdG9wdGlvbnMuc2NlbmUgPSBzY2VuZTtcblx0XHRyZXR1cm4gbmV3IE15VGhyZWVIZWxwZXIob3B0aW9ucyk7XG5cdH0pO1xufVxuXG4vKipcbiAqIEhlbHBlciBvYmplY3Qgd2l0aCBzb21lIHVzZWZ1bCB0aHJlZSBmdW5jdGlvbnNcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiAgICAgICAgc2NlbmU6IHNjZW5lIHRvIHVzZSBmb3IgZGVmYXVsdFxuICogICAgICAgIHRhcmdldDogd2hlcmUgaW4gdGhlIGRvbSB0byBwdXQgdGhlIHJlbmRlcmVyXG4gKiAgICAgICAgY2FtZXJhOiBuYW1lIG9mIGNhbWVyYSB0byB1c2UgaW4gdGhlIHNjZW5lXG4gKi9cbmZ1bmN0aW9uIE15VGhyZWVIZWxwZXIob3B0aW9ucyl7XG5cblx0RXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cblx0LyoqXG5cdCAqIFNldCB1cCByZW5kZXJpbmdcblx0ICovXG5cblx0b3B0aW9ucy50YXJnZXQgPSBvcHRpb25zLnRhcmdldCB8fCBkb2N1bWVudC5ib2R5O1xuXG5cdHRoaXMuc2NlbmUgPSBvcHRpb25zLnNjZW5lIHx8IG5ldyBUSFJFRS5TY2VuZSgpO1xuXG5cdGxldCBjYW1lcmEgPSBwaWNrT2JqZWN0c0hlbHBlcih0aGlzLnNjZW5lLCBvcHRpb25zLmNhbWVyYSkuQ2FtZXJhO1xuXG5cdGlmICghY2FtZXJhKSB7XG5cdFx0Y29uc29sZS5sb2coY2FtZXJhKTtcblx0XHRjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoIDc1LCBvcHRpb25zLnRhcmdldC5zY3JvbGxXaWR0aCAvIG9wdGlvbnMudGFyZ2V0LnNjcm9sbEhlaWdodCwgMC41LCAxMDAgKTtcblx0XHRjYW1lcmEucG9zaXRpb24uc2V0KDAsIDIsIDApO1xuXHRcdGNhbWVyYS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoMCwgY2FtZXJhLmhlaWdodCwgLTkpKTtcblx0XHRjYW1lcmEucm90YXRpb24ueSArPSBNYXRoLlBJO1xuXHR9XG5cdGNhbWVyYS5oZWlnaHQgPSBjYW1lcmEucG9zaXRpb24ueTsgLy8gcmVmZXJlbmNlIHZhbHVlIGZvciBob3cgaGlnaCB0aGUgY2FtZXJhIHNob3VsZCBiZVxuXHRcdFx0XHRcdFx0XHRcdFx0ICAgLy8gYWJvdmUgdGhlIGdyb3VuZCB0byBtYWludGFpbiB0aGUgaWxsdXNpb24gb2YgcHJlc2VuY2Vcblx0Y2FtZXJhLmZvdiA9IDc1O1xuXG5cdHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXHRjb25zdCByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKCB7IGFudGlhbGlhczogZmFsc2UgfSApO1xuXHRyZW5kZXJlci5zZXRQaXhlbFJhdGlvKCB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyApO1xuXHRcblx0dGhpcy5yZW5kZXJNZXRob2QgPSByZW5kZXJlcjtcblx0XG5cdGNvbnN0IHNldEFzcGVjdCA9ICgpID0+IHtcblx0XHR0aGlzLnJlbmRlck1ldGhvZC5zZXRTaXplKCBvcHRpb25zLnRhcmdldC5zY3JvbGxXaWR0aCwgb3B0aW9ucy50YXJnZXQuc2Nyb2xsSGVpZ2h0ICk7XG5cdFx0Y2FtZXJhLmFzcGVjdCA9IG9wdGlvbnMudGFyZ2V0LnNjcm9sbFdpZHRoIC8gb3B0aW9ucy50YXJnZXQuc2Nyb2xsSGVpZ2h0O1xuXHRcdGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG5cdH07XG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBzZXRBc3BlY3QpO1xuXHRzZXRBc3BlY3QoKTtcblxuXHRvcHRpb25zLnRhcmdldC5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblx0dGhpcy5kb21FbGVtZW50ID0gcmVuZGVyZXIuZG9tRWxlbWVudDtcblxuXHQvLyBUaGlzIGlzIGNhbGxlZCB0byByZXF1ZXN0IGEgcmVuZGVyXG5cdHRoaXMucmVuZGVyID0gKCkgPT4ge1xuXG5cdFx0Ly8gbm90ZTogdGhyZWUuanMgaW5jbHVkZXMgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHNoaW1cblx0XHR0aGlzLmVtaXQoJ3ByZXJlbmRlcicpO1xuXHRcdHRoaXMucmVuZGVyTWV0aG9kLnJlbmRlcih0aGlzLnNjZW5lLCBjYW1lcmEpO1xuXHR9O1xuXG5cdC8vIENoYW5nZSByZW5kZXIgbWV0aG9kIHRvIHRoZSBzdGVyZW8gcmVuZGVyZXIgKG9uZSBmb3IgZWFjaCBleWUpXG5cdHRoaXMudXNlQ2FyZGJvYXJkID0gKCkgPT4ge1xuXG5cdFx0Y29uc3QgZWZmZWN0ID0gbmV3IFRIUkVFLlN0ZXJlb0VmZmVjdChyZW5kZXJlcik7XG5cdFx0c2V0QXNwZWN0KCk7XG5cdFx0ZWZmZWN0LmV5ZVNlcGFyYXRpb24gPSAwLjAwODtcblx0XHRlZmZlY3QuZm9jYWxMZW5ndGggPSAwLjI1O1xuXHRcdGVmZmVjdC5zZXRTaXplKCB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0ICk7XG5cdFx0dGhpcy5yZW5kZXJNZXRob2QgPSBlZmZlY3Q7XG5cdH07XG5cblxuXHQvKipcblx0ICogQWRkIGEgaGVhZHMgdXAgZGlzcGxheSBvYmplY3QgdG8gdGhlIGNhbWVyYVxuXHQgKi9cblxuXHRjb25zdCBodWQgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblx0aHVkLnBvc2l0aW9uLnNldCgwLCAwLCAtMi4xKTtcblx0aHVkLnNjYWxlLnNldCgwLjIsIDAuMiwgMC4yKTtcblx0Y2FtZXJhLmFkZChodWQpO1xuXHR0aGlzLnNjZW5lLmFkZCh0aGlzLmNhbWVyYSk7XG5cdHRoaXMuaHVkID0gaHVkO1xuXG5cdC8qKlxuXHQgKiBBIG1hcCBvZiBwaHlzaWNzIG9iamVjdCBpZCB0byB0aHJlZS5qcyBvYmplY3QgM2Qgc28gd2UgY2FuIHVwZGF0ZSBhbGwgdGhlIHBvc2l0aW9uc1xuXHQgKi9cblxuXHRjb25zdCB0aHJlZU9iamVjdHNDb25uZWN0ZWRUb1BoeXNpY3MgPSB7fTtcblx0dGhpcy51cGRhdGVPYmplY3RzID0gcGh5c2ljc09iamVjdHMgPT4ge1xuXHRcdGNvbnN0IGwgPSBwaHlzaWNzT2JqZWN0cy5sZW5ndGg7XG5cblx0XHQvLyBpdGVyYXRlIG92ZXIgdGhlIHBoeXNpY3MgcGh5c2ljc09iamVjdHNcblx0XHRmb3IgKCBsZXQgaj0wOyBqPGw7aisrICkge1xuXG5cdFx0XHRjb25zdCBpID0gcGh5c2ljc09iamVjdHNbal07XG5cdFx0XHRpZiAodGhyZWVPYmplY3RzQ29ubmVjdGVkVG9QaHlzaWNzW2kuaWRdKSB7XG5cblx0XHRcdFx0Y29uc3QgbyA9IHRocmVlT2JqZWN0c0Nvbm5lY3RlZFRvUGh5c2ljc1tpLmlkXTtcblxuXHRcdFx0XHQvLyBTdXBwb3J0IG1hbmlwbGF0aW5nIGEgc2luZ2xlIHZlcnRleFxuXHRcdFx0XHRpZiAoby5jb25zdHJ1Y3RvciA9PT0gVEhSRUUuVmVjdG9yMykge1xuXHRcdFx0XHRcdG8uc2V0KGkucG9zaXRpb24ueCwgaS5wb3NpdGlvbi55LCBpLnBvc2l0aW9uLnopO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0by5wb3NpdGlvbi5zZXQoaS5wb3NpdGlvbi54LCBpLnBvc2l0aW9uLnksIGkucG9zaXRpb24ueik7XG5cblx0XHRcdFx0Ly8gUm90YXRpb25cblx0XHRcdFx0aWYgKGkucXVhdGVybmlvbikge1xuXHRcdFx0XHRcdG8ucm90YXRpb24uc2V0RnJvbVF1YXRlcm5pb24obmV3IFRIUkVFLlF1YXRlcm5pb24oaS5xdWF0ZXJuaW9uLngsIGkucXVhdGVybmlvbi55LCBpLnF1YXRlcm5pb24ueiwgaS5xdWF0ZXJuaW9uLncpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmNvbm5lY3RQaHlzaWNzVG9UaHJlZSA9IChtZXNoLCBwaHlzaWNzTWVzaCkgPT4ge1xuXHRcdHRocmVlT2JqZWN0c0Nvbm5lY3RlZFRvUGh5c2ljc1twaHlzaWNzTWVzaC5pZF0gPSBtZXNoO1xuXHRcdGlmIChtZXNoLmNvbnN0cnVjdG9yID09PSBUSFJFRS5WZWN0b3IzKSByZXR1cm47XG5cdFx0dGhpcy5zY2VuZS5hZGQobWVzaCk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFR1cm4gb24gaGVhZCB0cmFja2luZyBpZiBtYW51YWwgY29udHJvbCBpcyBkaXNhYmxlZCBpdCB3b24ndCBzdGVhbCBtb3VzZS90b3VjaCBldmVudHNcblx0ICovXG5cdHRoaXMuZGV2aWNlT3JpZW50YXRpb24gPSAoe21hbnVhbENvbnRyb2x9KSA9PiB7XG5cblx0XHQvLyBwcm92aWRlIGR1bW15IGVsZW1lbnQgdG8gcHJldmVudCB0b3VjaC9jbGljayBoaWphY2tpbmcuXG5cdFx0Y29uc3QgZWxlbWVudCA9IG1hbnVhbENvbnRyb2wgPyByZW5kZXJlci5kb21FbGVtZW50IDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcblxuXHRcdGlmICh0aGlzLmRldmljZU9yaWVudGF0aW9uQ29udHJvbGxlcikge1xuXHRcdFx0dGhpcy5kZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIuZGlzY29ubmVjdCgpO1xuXHRcdFx0dGhpcy5kZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIuZWxlbWVudCA9IGVsZW1lbnQ7XG5cdFx0XHR0aGlzLmRldmljZU9yaWVudGF0aW9uQ29udHJvbGxlci5jb25uZWN0KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZGV2aWNlT3JpZW50YXRpb25Db250cm9sbGVyID0gbmV3IERldmljZU9yaWVudGF0aW9uQ29udHJvbGxlcih0aGlzLmNhbWVyYSwgZWxlbWVudCk7XG5cdFx0XHR0aGlzLmRldmljZU9yaWVudGF0aW9uQ29udHJvbGxlci5jb25uZWN0KCk7XG5cdFx0XHR0aGlzLm9uKCdwcmVyZW5kZXInLCAoKSA9PiB0aGlzLmRldmljZU9yaWVudGF0aW9uQ29udHJvbGxlci51cGRhdGUoKSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBNYWtlIHRoZSBvYmplY3QgcGlja2VyIGF2YWlsYWJsZSBvbiB0aGlzIG9iamVjdFxuXHQgKi9cblx0dGhpcy5waWNrT2JqZWN0c0hlbHBlciA9IHBpY2tPYmplY3RzSGVscGVyO1xufVxudXRpbC5pbmhlcml0cyhNeVRocmVlSGVscGVyLCBFdmVudEVtaXR0ZXIpO1xuXG5tb2R1bGUuZXhwb3J0cy5NeVRocmVlSGVscGVyID0gTXlUaHJlZUhlbHBlcjtcbm1vZHVsZS5leHBvcnRzLm15VGhyZWVGcm9tSlNPTiA9IG15VGhyZWVGcm9tSlNPTjtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgbXlXb3JrZXIgPSBuZXcgV29ya2VyKFwiLi9zY3JpcHRzL3ZlcmxldHdvcmtlci5qc1wiKTtcbmNvbnN0IG1lc3NhZ2VRdWV1ZSA9IFtdO1xuXG5mdW5jdGlvbiB3b3JrZXJNZXNzYWdlKG1lc3NhZ2UpIHtcblxuXHRjb25zdCBpZCA9IERhdGUubm93KCkgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwKTtcblxuXHQvLyBUaGlzIHdyYXBzIHRoZSBtZXNzYWdlIHBvc3RpbmcvcmVzcG9uc2UgaW4gYSBwcm9taXNlLCB3aGljaCB3aWxsIHJlc29sdmUgaWYgdGhlIHJlc3BvbnNlIGRvZXNuJ3Rcblx0Ly8gY29udGFpbiBhbiBlcnJvciwgYW5kIHJlamVjdCB3aXRoIHRoZSBlcnJvciBpZiBpdCBkb2VzLiBJZiB5b3UnZCBwcmVmZXIsIGl0J3MgcG9zc2libGUgdG8gY2FsbFxuXHQvLyBjb250cm9sbGVyLnBvc3RNZXNzYWdlKCkgYW5kIHNldCB1cCB0aGUgb25tZXNzYWdlIGhhbmRsZXIgaW5kZXBlbmRlbnRseSBvZiBhIHByb21pc2UsIGJ1dCB0aGlzIGlzXG5cdC8vIGEgY29udmVuaWVudCB3cmFwcGVyLlxuXHRyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gd29ya2VyTWVzc2FnZVByb21pc2UocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0Y29uc3QgZGF0YSA9IHtcblx0XHRcdGlkLFxuXHRcdFx0bWVzc2FnZSxcblx0XHRcdHJlc29sdmUsXG5cdFx0XHRyZWplY3Rcblx0XHR9O1xuXHRcdG1lc3NhZ2VRdWV1ZS5wdXNoKGRhdGEpO1xuXHR9KTtcbn1cblxuLy8gUHJvY2VzcyBtZXNzYWdlcyBvbmNlIHBlciBmcmFtZVx0XG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gcHJvY2VzcygpIHtcblx0aWYgKG1lc3NhZ2VRdWV1ZS5sZW5ndGgpIHtcblxuXHRcdGNvbnN0IGV4dHJhY3RlZE1lc3NhZ2VzID0gbWVzc2FnZVF1ZXVlLnNwbGljZSgwKTtcblxuXHRcdGNvbnN0IG1lc3NhZ2VUb1NlbmQgPSBKU09OLnN0cmluZ2lmeShleHRyYWN0ZWRNZXNzYWdlcy5tYXAoaSA9PiAoXG5cdFx0XHR7IG1lc3NhZ2U6IGkubWVzc2FnZSwgaWQ6IGkuaWQgfVxuXHRcdCkpKTtcblxuXHRcdGNvbnN0IG1lc3NhZ2VDaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG5cdFx0bWVzc2FnZUNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZnVuY3Rpb24gcmVzb2x2ZU1lc3NhZ2VQcm9taXNlKGV2ZW50KSB7XG5cdFx0XHRtZXNzYWdlQ2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSB1bmRlZmluZWQ7XG5cblx0XHRcdC8vIEl0ZXJhdGUgb3ZlciB0aGUgcmVzcG9uc2VzIGFuZCByZXNvbHZlL3JlamVjdCBhY2NvcmRpbmdseVxuXHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuXHRcdFx0cmVzcG9uc2UuZm9yRWFjaCgoZCwgaSkgPT4ge1xuXHRcdFx0XHRpZiAoZXh0cmFjdGVkTWVzc2FnZXNbaV0uaWQgIT09IGQuaWQpIHtcblx0XHRcdFx0XHR0aHJvdyBFcnJvcignSUQgTWlzbWF0Y2ghISEnKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIWQuZXJyb3IpIHtcblx0XHRcdFx0XHRleHRyYWN0ZWRNZXNzYWdlc1tpXS5yZXNvbHZlKGQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGV4dHJhY3RlZE1lc3NhZ2VzW2ldLnJlamVjdChkLmVycm9yKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRteVdvcmtlci5wb3N0TWVzc2FnZShtZXNzYWdlVG9TZW5kLCBbbWVzc2FnZUNoYW5uZWwucG9ydDJdKTtcblx0fVxuXHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUocHJvY2Vzcyk7XG59KTtcblxuY2xhc3MgVmVybGV0IHtcblx0aW5pdChvcHRpb25zKSB7XG5cdFx0cmV0dXJuIHdvcmtlck1lc3NhZ2Uoe2FjdGlvbjogJ2luaXQnLCBvcHRpb25zfSk7XG5cdH1cblxuXHRnZXRQb2ludHMoKSB7XG5cdFx0cmV0dXJuIHdvcmtlck1lc3NhZ2Uoe2FjdGlvbjogJ2dldFBvaW50cyd9KVxuXHRcdFx0LnRoZW4oZSA9PiBlLnBvaW50cyk7XG5cdH1cblxuXHRhZGRQb2ludChwb2ludE9wdGlvbnMpIHtcblx0XHRyZXR1cm4gd29ya2VyTWVzc2FnZSh7YWN0aW9uOiAnYWRkUG9pbnQnLCBwb2ludE9wdGlvbnN9KTtcblx0fVxuXG5cdHVwZGF0ZVBvaW50KHBvaW50T3B0aW9ucykge1xuXHRcdHJldHVybiB3b3JrZXJNZXNzYWdlKHthY3Rpb246ICd1cGRhdGVQb2ludCcsIHBvaW50T3B0aW9uc30pO1xuXHR9XG5cblx0Y29ubmVjdFBvaW50cyhwMSwgcDIsIGNvbnN0cmFpbnRPcHRpb25zKSB7XG5cdFx0cmV0dXJuIHdvcmtlck1lc3NhZ2Uoe2FjdGlvbjogJ2Nvbm5lY3RQb2ludHMnLCBvcHRpb25zOiB7cDEsIHAyLCBjb25zdHJhaW50T3B0aW9uc319KTtcblx0fVxuXG5cdHVwZGF0ZUNvbnN0cmFpbnQob3B0aW9ucykge1xuXHRcdHJldHVybiB3b3JrZXJNZXNzYWdlKHthY3Rpb246ICd1cGRhdGVDb25zdHJhaW50Jywgb3B0aW9ucyB9KTtcblx0fVxuXG5cdHJlc2V0KCkge1xuXHRcdHJldHVybiB3b3JrZXJNZXNzYWdlKHthY3Rpb246ICdyZXNldCd9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZlcmxldDtcbiIsIi8qZ2xvYmFsIFRIUkVFKi9cbid1c2Ugc3RyaWN0JztcbmNvbnN0IGFkZFNjcmlwdCA9IHJlcXVpcmUoJy4vbGliL2xvYWRTY3JpcHQnKTsgLy8gUHJvbWlzZSB3cmFwcGVyIGZvciBzY3JpcHQgbG9hZGluZ1xuY29uc3QgVmVybGV0V3JhcHBlciA9IHJlcXVpcmUoJy4vbGliL3ZlcmxldHdyYXBwZXInKTsgLy8gV3JhcHBlciBvZiB0aGUgdmVybGV0IHdvcmtlclxuY29uc3QgdGV4dFNwcml0ZSA9IHJlcXVpcmUoJy4vbGliL3RleHRTcHJpdGUnKTsgLy8gR2VuZXJhbGx5IHNwcml0ZXMgZnJvbSBjYW52YXNcbmNvbnN0IENhbWVyYUludGVyYWN0aW9ucyA9IHJlcXVpcmUoJy4vbGliL2NhbWVyYWludGVyYWN0aW9ucycpOyAvLyBUb29sIGZvciBtYWtpbmcgaW50ZXJhY3RpdmUgVlIgZWxlbWVudHNcbmNvbnN0IFRXRUVOID0gcmVxdWlyZSgndHdlZW4uanMnKTtcblxuLy8gbm8gaHN0cyBzbyBqdXN0IHJlZGlyZWN0IHRvIGh0dHBzXG5pZiAod2luZG93LmxvY2F0aW9uLnByb3RvY29sICE9PSBcImh0dHBzOlwiICYmIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSAhPT0gJ2xvY2FsaG9zdCcpIHtcbiAgIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9IFwiaHR0cHM6XCI7XG59XG5cbmZ1bmN0aW9uIHNlcnZpY2VXb3JrZXIoKSB7XG5cblx0cmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG5cblx0XHQvLyBTdGFydCBzZXJ2aWNlIHdvcmtlclxuXHRcdGlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XG5cblx0XHRcdGlmIChuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5jb250cm9sbGVyKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdPZmZsaW5pbmcgQXZhaWxibGUnKTtcblx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy4vc3cuanMnKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihyZWcpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnc3cgcmVnaXN0ZXJlZCcsIHJlZyk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC50aGVuKHJlc29sdmUpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdObyBTZXJ2aWNlIFdvcmtlciwgYXNzZXRzIG1heSBub3QgYmUgY2FjaGVkJyk7XG5cdFx0XHRyZXNvbHZlKCk7XG5cdFx0fVxuXHR9KTtcbn1cblxuc2VydmljZVdvcmtlcigpXG4udGhlbigoKSA9PiBQcm9taXNlLmFsbChbXG5cdGFkZFNjcmlwdCgnaHR0cHM6Ly9wb2x5ZmlsbC53ZWJzZXJ2aWNlcy5mdC5jb20vdjEvcG9seWZpbGwubWluLmpzP2ZlYXR1cmVzPWZldGNoLGRlZmF1bHQnKSxcblx0YWRkU2NyaXB0KCdodHRwczovL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy90aHJlZS5qcy9yNzMvdGhyZWUubWluLmpzJylcbl0pKVxuLnRoZW4oKCkgPT4gUHJvbWlzZS5hbGwoW1xuXHRhZGRTY3JpcHQoJ2h0dHBzOi8vY2RuLnJhd2dpdC5jb20vbXJkb29iL3RocmVlLmpzL21hc3Rlci9leGFtcGxlcy9qcy9lZmZlY3RzL1N0ZXJlb0VmZmVjdC5qcycpLFxuXHRhZGRTY3JpcHQoJ2h0dHBzOi8vY2RuLnJhd2dpdC5jb20vbXJkb29iL3RocmVlLmpzL21hc3Rlci9leGFtcGxlcy9qcy9Ta3lTaGFkZXIuanMnKSxcblx0YWRkU2NyaXB0KCdodHRwczovL2Nkbi5yYXdnaXQuY29tL3JpY2h0ci90aHJlZVZSL21hc3Rlci9qcy9EZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIuanMnKVxuXSkpXG4udGhlbigoKSA9PiByZXF1aXJlKCcuL2xpYi90aHJlZUhlbHBlcicpXG5cdC5teVRocmVlRnJvbUpTT04oJ0tpdGNoZW4vbGlja3RoZXdoaXNrJyxcblx0XHR7XG5cdFx0XHRjYW1lcmE6ICdDYW1lcmEnLFxuXHRcdFx0dGFyZ2V0OiBkb2N1bWVudC5ib2R5XG5cdFx0fVxuXHQpXG4pXG4udGhlbih0aHJlZUhlbHBlciA9PiB7XG5cdGNvbnNvbGUubG9nKCdSZWFkeScpO1xuXG5cdGNvbnN0IHRleHR1cmVMb2FkZXIgPSBuZXcgVEhSRUUuVGV4dHVyZUxvYWRlcigpO1xuXHRjb25zdCBjdWJlVGV4dHVyZUxvYWRlciA9IG5ldyBUSFJFRS5DdWJlVGV4dHVyZUxvYWRlcigpO1xuXHRjb25zdCB0b1RleHR1cmUgPSB0aHJlZUhlbHBlci5waWNrT2JqZWN0c0hlbHBlcih0aHJlZUhlbHBlci5zY2VuZSwgJ1Jvb20nLCAnQ291bnRlcicpO1xuXHRjb25zdCB0b1NoaW55ID0gdGhyZWVIZWxwZXIucGlja09iamVjdHNIZWxwZXIodGhyZWVIZWxwZXIuc2NlbmUsICdMaWNrVGhlV2hpc2snLCAnV2hpc2snLCAnU2F1Y2VQYW4nLCAnU2F1Y2VQYW4uMDAxJywgJ1NhdWNlUGFuLjAwMicsICdTYXVjZVBhbi4wMDMnKTtcblx0T2JqZWN0LmtleXModG9UZXh0dXJlKS5mb3JFYWNoKG5hbWUgPT4ge1xuXHRcdHRleHR1cmVMb2FkZXIubG9hZChgbW9kZWxzL0tpdGNoZW4vJHtuYW1lfUJha2UucG5nYCwgbWFwID0+IHRvVGV4dHVyZVtuYW1lXS5tYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7bWFwfSkpO1xuXHR9KTtcblxuXHRjb25zdCBwYXRoID0gXCJtb2RlbHMvS2l0Y2hlbi9lbnZtYXAvXCI7XG5cdGNvbnN0IGZvcm1hdCA9ICcucG5nJztcblx0Y29uc3QgdXJscyA9IFtcblx0XHRwYXRoICsgJzAwMDQnICsgZm9ybWF0LCAvLyAreFxuXHRcdHBhdGggKyAnMDAwMicgKyBmb3JtYXQsIC8vIC14XG5cdFx0cGF0aCArICcwMDA2JyArIGZvcm1hdCwgLy8gK3lcblx0XHRwYXRoICsgJzAwMDUnICsgZm9ybWF0LCAvLyAteVxuXHRcdHBhdGggKyAnMDAwMScgKyBmb3JtYXQsIC8vICt6XG5cdFx0cGF0aCArICcwMDAzJyArIGZvcm1hdCAgLy8gLXpcblx0XTtcblx0Y3ViZVRleHR1cmVMb2FkZXIubG9hZCh1cmxzLCBlbnZNYXAgPT4ge1xuXHRcdGNvbnN0IGNvcHBlciA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCggeyBjb2xvcjogMHg5OWZmOTksIHNwZWN1bGFyOiAweDQ0MDAwMCwgZW52TWFwLCBjb21iaW5lOiBUSFJFRS5NaXhPcGVyYXRpb24sIHJlZmxlY3Rpdml0eTogMC4zLCBtZXRhbDogdHJ1ZX0gKTtcblx0XHRjb25zdCBhbHVtaW5pdW0gPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoIHsgY29sb3I6IDB4ODg4ODg4LCBzcGVjdWxhcjogMHhhYWFhYWEsIGVudk1hcCwgY29tYmluZTogVEhSRUUuTWl4T3BlcmF0aW9uLCByZWZsZWN0aXZpdHk6IDAuMywgbWV0YWw6IHRydWV9ICk7XG5cdFx0Y29uc3QgY2hvY29sYXRlID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKCB7IGNvbG9yOiB0b1NoaW55LkxpY2tUaGVXaGlzay5tYXRlcmlhbC5jb2xvciwgc3BlY3VsYXI6IDB4YWFhYWFhLCBlbnZNYXAsIGNvbWJpbmU6IFRIUkVFLk1peE9wZXJhdGlvbiwgcmVmbGVjdGl2aXR5OiAwLjMsIG1ldGFsOiB0cnVlfSApO1xuXHRcdE9iamVjdC5rZXlzKHRvU2hpbnkpLmZvckVhY2gobmFtZSA9PiB7XG5cdFx0XHR0b1NoaW55W25hbWVdLm1hdGVyaWFsID0gY29wcGVyO1xuXHRcdH0pO1xuXG5cdFx0dG9TaGlueS5XaGlzay5tYXRlcmlhbCA9IGFsdW1pbml1bTtcblx0XHR0b1NoaW55LkxpY2tUaGVXaGlzay5tYXRlcmlhbCA9IGNob2NvbGF0ZTtcblx0fSk7XG5cblx0Y29uc3QgZ29UYXJnZXRXb3JsZCA9IG5ldyBDYW1lcmFJbnRlcmFjdGlvbnModGhyZWVIZWxwZXIuZG9tRWxlbWVudCk7XG5cblx0Ly8gQWRkIGEgcHJldHR5IHNreWJveFxuXHRjb25zdCBza3lCb3ggPSByZXF1aXJlKCcuL2xpYi9za3knKSgpO1xuXHRza3lCb3guc2NhbGUubXVsdGlwbHlTY2FsYXIoMC4wMDAyKTtcblx0dGhyZWVIZWxwZXIuc2NlbmUuYWRkKHNreUJveCk7XG5cblx0dGhyZWVIZWxwZXIudXNlQ2FyZGJvYXJkKCk7XG5cblx0dGhyZWVIZWxwZXIuZGV2aWNlT3JpZW50YXRpb24oe21hbnVhbENvbnRyb2w6IHRydWV9KTsgLy8gQWxsb3cgY2xpY2tpbmcgYW5kIGRyYWdnaW5nIHRvIG1vdmUgdGhlIGNhbWVyYSB3aGlsc3QgdGVzdGluZ1xuXG5cdHRocmVlSGVscGVyLmRldmljZU9yaWVudGF0aW9uQ29udHJvbGxlclxuXHQuYWRkRXZlbnRMaXN0ZW5lcigndXNlcmludGVyYWN0aW9uZW5kJywgZnVuY3Rpb24gKCkge1xuXHRcdGdvVGFyZ2V0V29ybGQuaW50ZXJhY3Qoe3R5cGU6ICdjbGljayd9KTtcblx0fSk7IC8vIEFsbG93IGl0IHN0aWxsIGJlIGludGVyYWN0ZWQgd2l0aCB3aGVuIGNsaWNrcyBhcmUgaGlqYWNrZWRcblxuXHQvLyBCcmFuZCBsaWdodHNcblx0Y29uc3QgYW1iaWVudExpZ2h0ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCggMHhkZGVkZmYgKTtcblx0dGhyZWVIZWxwZXIuc2NlbmUuYWRkKCBhbWJpZW50TGlnaHQgKTtcblxuXHQvLyBSdW4gdGhlIHZlcmxldCBwaHlzaWNzXG5cdGNvbnN0IHZlcmxldCA9IG5ldyBWZXJsZXRXcmFwcGVyKCk7XG5cdHZlcmxldC5pbml0KHtcblx0XHRzaXplOiB7XG5cdFx0XHR4OiAyMCxcblx0XHRcdHk6IDIwLFxuXHRcdFx0ejogMjAsXG5cdFx0fSxcblx0XHRncmF2aXR5OiB0cnVlXG5cdH0pXG5cdC50aGVuKGZ1bmN0aW9uICgpIHtcblx0XHRcblx0XHRsZXQgd2FpdGluZ0ZvclBvaW50cyA9IGZhbHNlO1xuXHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiBhbmltYXRlKHRpbWUpIHtcblx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZShhbmltYXRlKTtcblx0XHRcdGdvVGFyZ2V0V29ybGQuZGV0ZWN0SW50ZXJhY3Rpb25zKHRocmVlSGVscGVyLmNhbWVyYSk7XG5cblx0XHRcdGlmICghd2FpdGluZ0ZvclBvaW50cykge1xuXHRcdFx0XHR2ZXJsZXQuZ2V0UG9pbnRzKCkudGhlbihwb2ludHMgPT4ge1xuXHRcdFx0XHRcdHRocmVlSGVscGVyLnVwZGF0ZU9iamVjdHMocG9pbnRzKTtcblx0XHRcdFx0XHR3YWl0aW5nRm9yUG9pbnRzID0gZmFsc2U7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHR3YWl0aW5nRm9yUG9pbnRzID0gdHJ1ZTtcblx0XHRcdH1cblx0XHRcdHRocmVlSGVscGVyLnJlbmRlcigpO1xuXHRcdFx0VFdFRU4udXBkYXRlKHRpbWUpO1xuXHRcdH0pO1xuXG5cdFx0Y29uc3QgbWFwID0gVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSggXCJpbWFnZXMvcmV0aWN1bGUucG5nXCIgKTtcblx0XHRjb25zdCBtYXRlcmlhbCA9IG5ldyBUSFJFRS5TcHJpdGVNYXRlcmlhbCggeyBtYXA6IG1hcCwgY29sb3I6IDB4ZmZmZmZmLCBmb2c6IGZhbHNlLCB0cmFuc3BhcmVudDogdHJ1ZSB9ICk7XG5cdFx0Y29uc3Qgc3ByaXRlID0gbmV3IFRIUkVFLlNwcml0ZShtYXRlcmlhbCk7XG5cdFx0dGhyZWVIZWxwZXIuaHVkLmFkZChzcHJpdGUpO1xuXG5cdFx0ZnVuY3Rpb24gYWRkQnV0dG9uKHN0cikge1xuXHRcdFx0Y29uc3Qgc3ByaXRlID0gdGV4dFNwcml0ZShzdHIsIHtcblx0XHRcdFx0Zm9udHNpemU6IDE4LFxuXHRcdFx0XHRmb250ZmFjZTogJ0ljZWxhbmQnLFxuXHRcdFx0XHRib3JkZXJUaGlja25lc3M6IDIwXG5cdFx0XHR9KTtcblx0XHRcdHRocmVlSGVscGVyLnNjZW5lLmFkZChzcHJpdGUpO1xuXHRcdFx0c3ByaXRlLnBvc2l0aW9uLnNldCg1LDUsNSk7XG5cdFx0XHRzcHJpdGUubWF0ZXJpYWwudHJhbnNwYXJlbnQgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIGdvVGFyZ2V0V29ybGQubWFrZVRhcmdldChzcHJpdGUpO1xuXHRcdH1cblxuXHRcdHdpbmRvdy50aHJlZUhlbHBlciA9IHRocmVlSGVscGVyO1xuXHR9KTtcbn0pO1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBwcm90b2NsYXNzID0gcmVxdWlyZShcInByb3RvY2xhc3NcIik7XG5cbi8qKlxuICogQG1vZHVsZSBtb2pvXG4gKiBAc3VibW9kdWxlIG1vam8tY29yZVxuICovXG5cbi8qKlxuICogQGNsYXNzIEV2ZW50RW1pdHRlclxuICovXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlciAoKSB7XG4gIHRoaXMuX19ldmVudHMgPSB7fTtcbn1cblxuLyoqXG4gKiBhZGRzIGEgbGlzdGVuZXIgb24gdGhlIGV2ZW50IGVtaXR0ZXJcbiAqXG4gKiBAbWV0aG9kIG9uXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnQgdG8gbGlzdGVuIG9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciB0byBjYWxsYmFjayB3aGVuIGBldmVudGAgaXMgZW1pdHRlZC5cbiAqIEByZXR1cm5zIHtEaXNwb3NhYmxlfVxuICovXG5cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChldmVudCwgbGlzdGVuZXIpIHtcblxuICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24gZm9yIGV2ZW50ICdcIitldmVudCtcIidcIik7XG4gIH1cblxuICB2YXIgbGlzdGVuZXJzO1xuICBpZiAoIShsaXN0ZW5lcnMgPSB0aGlzLl9fZXZlbnRzW2V2ZW50XSkpIHtcbiAgICB0aGlzLl9fZXZlbnRzW2V2ZW50XSA9IGxpc3RlbmVyO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRoaXMuX19ldmVudHNbZXZlbnRdID0gW2xpc3RlbmVycywgbGlzdGVuZXJdO1xuICB9IGVsc2Uge1xuICAgIGxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgfVxuXG4gIHZhciBzZWxmID0gdGhpcztcblxuICByZXR1cm4ge1xuICAgIGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgc2VsZi5vZmYoZXZlbnQsIGxpc3RlbmVyKTtcbiAgICB9XG4gIH07XG59O1xuXG4vKipcbiAqIHJlbW92ZXMgYW4gZXZlbnQgZW1pdHRlclxuICogQG1ldGhvZCBvZmZcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCB0byByZW1vdmVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIHRvIHJlbW92ZVxuICovXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gKGV2ZW50LCBsaXN0ZW5lcikge1xuXG4gIHZhciBsaXN0ZW5lcnM7XG5cbiAgaWYoIShsaXN0ZW5lcnMgPSB0aGlzLl9fZXZlbnRzW2V2ZW50XSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodHlwZW9mIGxpc3RlbmVycyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhpcy5fX2V2ZW50c1tldmVudF0gPSB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGkgPSBsaXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgaWYgKH5pKSBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgIGlmICghbGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgdGhpcy5fX2V2ZW50c1tldmVudF0gPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIGFkZHMgYSBsaXN0ZW5lciBvbiB0aGUgZXZlbnQgZW1pdHRlclxuICogQG1ldGhvZCBvbmNlXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnQgdG8gbGlzdGVuIG9uXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciB0byBjYWxsYmFjayB3aGVuIGBldmVudGAgaXMgZW1pdHRlZC5cbiAqIEByZXR1cm5zIHtEaXNwb3NhYmxlfVxuICovXG5cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24gKGV2ZW50LCBsaXN0ZW5lcikge1xuXG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcImxpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbiBmb3IgZXZlbnQgJ1wiK2V2ZW50K1wiJ1wiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpc3RlbmVyMiAoKSB7XG4gICAgZGlzcC5kaXNwb3NlKCk7XG4gICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHZhciBkaXNwID0gdGhpcy5vbihldmVudCwgbGlzdGVuZXIyKTtcbiAgZGlzcC50YXJnZXQgPSB0aGlzO1xuICByZXR1cm4gZGlzcDtcbn07XG5cbi8qKlxuICogZW1pdHMgYW4gZXZlbnRcbiAqIEBtZXRob2QgZW1pdFxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge1N0cmluZ30sIGBkYXRhLi4uYCBkYXRhIHRvIGVtaXRcbiAqL1xuXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIChldmVudCkge1xuXG4gIGlmICh0aGlzLl9fZXZlbnRzW2V2ZW50XSA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG5cbiAgdmFyIGxpc3RlbmVycyA9IHRoaXMuX19ldmVudHNbZXZlbnRdLFxuICBuID0gYXJndW1lbnRzLmxlbmd0aCxcbiAgYXJncyxcbiAgaSxcbiAgajtcblxuICBpZiAodHlwZW9mIGxpc3RlbmVycyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgaWYgKG4gPT09IDEpIHtcbiAgICAgIGxpc3RlbmVycygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzd2l0Y2gobikge1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgbGlzdGVuZXJzKGFyZ3VtZW50c1sxXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBsaXN0ZW5lcnMoYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgbGlzdGVuZXJzKGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdLCBhcmd1bWVudHNbM10pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobiAtIDEpO1xuICAgICAgICAgIGZvcihpID0gMTsgaSA8IG47IGkrKykgYXJnc1tpLTFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgIGxpc3RlbmVycy5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH1cbiAgfSBlbHNlIHtcbiAgICBhcmdzID0gbmV3IEFycmF5KG4gLSAxKTtcbiAgICBmb3IoaSA9IDE7IGkgPCBuOyBpKyspIGFyZ3NbaS0xXSA9IGFyZ3VtZW50c1tpXTtcbiAgICBmb3IoaiA9IGxpc3RlbmVycy5sZW5ndGg7IGotLTspIHtcbiAgICAgIGlmKGxpc3RlbmVyc1tqXSkgbGlzdGVuZXJzW2pdLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiByZW1vdmVzIGFsbCBsaXN0ZW5lcnNcbiAqIEBtZXRob2QgcmVtb3ZlQWxsTGlzdGVuZXJzXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgKG9wdGlvbmFsKSByZW1vdmVzIGFsbCBsaXN0ZW5lcnMgb2YgYGV2ZW50YC4gT21pdHRpbmcgd2lsbCByZW1vdmUgZXZlcnl0aGluZy5cbiAqL1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uIChldmVudCkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIHRoaXMuX19ldmVudHNbZXZlbnRdID0gdW5kZWZpbmVkO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX19ldmVudHMgPSB7fTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG4iLCJmdW5jdGlvbiBfY29weSAodG8sIGZyb20pIHtcblxuICBmb3IgKHZhciBpID0gMCwgbiA9IGZyb20ubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG5cbiAgICB2YXIgdGFyZ2V0ID0gZnJvbVtpXTtcblxuICAgIGZvciAodmFyIHByb3BlcnR5IGluIHRhcmdldCkge1xuICAgICAgdG9bcHJvcGVydHldID0gdGFyZ2V0W3Byb3BlcnR5XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdG87XG59XG5cbmZ1bmN0aW9uIHByb3RvY2xhc3MgKHBhcmVudCwgY2hpbGQpIHtcblxuICB2YXIgbWl4aW5zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKTtcblxuICBpZiAodHlwZW9mIGNoaWxkICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBpZihjaGlsZCkgbWl4aW5zLnVuc2hpZnQoY2hpbGQpOyAvLyBjb25zdHJ1Y3RvciBpcyBhIG1peGluXG4gICAgY2hpbGQgICA9IHBhcmVudDtcbiAgICBwYXJlbnQgID0gZnVuY3Rpb24oKSB7IH07XG4gIH1cblxuICBfY29weShjaGlsZCwgcGFyZW50KTsgXG5cbiAgZnVuY3Rpb24gY3RvciAoKSB7XG4gICAgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkO1xuICB9XG5cbiAgY3Rvci5wcm90b3R5cGUgID0gcGFyZW50LnByb3RvdHlwZTtcbiAgY2hpbGQucHJvdG90eXBlID0gbmV3IGN0b3IoKTtcbiAgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTtcbiAgY2hpbGQucGFyZW50ICAgID0gY2hpbGQuc3VwZXJjbGFzcyA9IHBhcmVudDtcblxuICBfY29weShjaGlsZC5wcm90b3R5cGUsIG1peGlucyk7XG5cbiAgcHJvdG9jbGFzcy5zZXR1cChjaGlsZCk7XG5cbiAgcmV0dXJuIGNoaWxkO1xufVxuXG5wcm90b2NsYXNzLnNldHVwID0gZnVuY3Rpb24gKGNoaWxkKSB7XG5cblxuICBpZiAoIWNoaWxkLmV4dGVuZCkge1xuICAgIGNoaWxkLmV4dGVuZCA9IGZ1bmN0aW9uKGNvbnN0cnVjdG9yKSB7XG5cbiAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcblxuICAgICAgaWYgKHR5cGVvZiBjb25zdHJ1Y3RvciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGFyZ3MudW5zaGlmdChjb25zdHJ1Y3RvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjb25zdHJ1Y3Rvci5wYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwcm90b2NsYXNzLmFwcGx5KHRoaXMsIFt0aGlzXS5jb25jYXQoYXJncykpO1xuICAgIH1cblxuICAgIGNoaWxkLm1peGluID0gZnVuY3Rpb24ocHJvdG8pIHtcbiAgICAgIF9jb3B5KHRoaXMucHJvdG90eXBlLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIGNoaWxkLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBvYmogPSBPYmplY3QuY3JlYXRlKGNoaWxkLnByb3RvdHlwZSk7XG4gICAgICBjaGlsZC5hcHBseShvYmosIGFyZ3VtZW50cyk7XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjaGlsZDtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IHByb3RvY2xhc3M7IiwiLyoqXG4gKiBUd2Vlbi5qcyAtIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZVxuICogaHR0cHM6Ly9naXRodWIuY29tL3R3ZWVuanMvdHdlZW4uanNcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqXG4gKiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL3R3ZWVuanMvdHdlZW4uanMvZ3JhcGhzL2NvbnRyaWJ1dG9ycyBmb3IgdGhlIGZ1bGwgbGlzdCBvZiBjb250cmlidXRvcnMuXG4gKiBUaGFuayB5b3UgYWxsLCB5b3UncmUgYXdlc29tZSFcbiAqL1xuXG4vLyBJbmNsdWRlIGEgcGVyZm9ybWFuY2Uubm93IHBvbHlmaWxsXG4oZnVuY3Rpb24gKCkge1xuXG5cdGlmICgncGVyZm9ybWFuY2UnIGluIHdpbmRvdyA9PT0gZmFsc2UpIHtcblx0XHR3aW5kb3cucGVyZm9ybWFuY2UgPSB7fTtcblx0fVxuXG5cdC8vIElFIDhcblx0RGF0ZS5ub3cgPSAoRGF0ZS5ub3cgfHwgZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblx0fSk7XG5cblx0aWYgKCdub3cnIGluIHdpbmRvdy5wZXJmb3JtYW5jZSA9PT0gZmFsc2UpIHtcblx0XHR2YXIgb2Zmc2V0ID0gd2luZG93LnBlcmZvcm1hbmNlLnRpbWluZyAmJiB3aW5kb3cucGVyZm9ybWFuY2UudGltaW5nLm5hdmlnYXRpb25TdGFydCA/IHdpbmRvdy5wZXJmb3JtYW5jZS50aW1pbmcubmF2aWdhdGlvblN0YXJ0XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBEYXRlLm5vdygpO1xuXG5cdFx0d2luZG93LnBlcmZvcm1hbmNlLm5vdyA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBEYXRlLm5vdygpIC0gb2Zmc2V0O1xuXHRcdH07XG5cdH1cblxufSkoKTtcblxudmFyIFRXRUVOID0gVFdFRU4gfHwgKGZ1bmN0aW9uICgpIHtcblxuXHR2YXIgX3R3ZWVucyA9IFtdO1xuXG5cdHJldHVybiB7XG5cblx0XHRnZXRBbGw6IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0cmV0dXJuIF90d2VlbnM7XG5cblx0XHR9LFxuXG5cdFx0cmVtb3ZlQWxsOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdF90d2VlbnMgPSBbXTtcblxuXHRcdH0sXG5cblx0XHRhZGQ6IGZ1bmN0aW9uICh0d2Vlbikge1xuXG5cdFx0XHRfdHdlZW5zLnB1c2godHdlZW4pO1xuXG5cdFx0fSxcblxuXHRcdHJlbW92ZTogZnVuY3Rpb24gKHR3ZWVuKSB7XG5cblx0XHRcdHZhciBpID0gX3R3ZWVucy5pbmRleE9mKHR3ZWVuKTtcblxuXHRcdFx0aWYgKGkgIT09IC0xKSB7XG5cdFx0XHRcdF90d2VlbnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0fVxuXG5cdFx0fSxcblxuXHRcdHVwZGF0ZTogZnVuY3Rpb24gKHRpbWUpIHtcblxuXHRcdFx0aWYgKF90d2VlbnMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0dmFyIGkgPSAwO1xuXG5cdFx0XHR0aW1lID0gdGltZSAhPT0gdW5kZWZpbmVkID8gdGltZSA6IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcblxuXHRcdFx0d2hpbGUgKGkgPCBfdHdlZW5zLmxlbmd0aCkge1xuXG5cdFx0XHRcdGlmIChfdHdlZW5zW2ldLnVwZGF0ZSh0aW1lKSkge1xuXHRcdFx0XHRcdGkrKztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRfdHdlZW5zLnNwbGljZShpLCAxKTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0fVxuXHR9O1xuXG59KSgpO1xuXG5UV0VFTi5Ud2VlbiA9IGZ1bmN0aW9uIChvYmplY3QpIHtcblxuXHR2YXIgX29iamVjdCA9IG9iamVjdDtcblx0dmFyIF92YWx1ZXNTdGFydCA9IHt9O1xuXHR2YXIgX3ZhbHVlc0VuZCA9IHt9O1xuXHR2YXIgX3ZhbHVlc1N0YXJ0UmVwZWF0ID0ge307XG5cdHZhciBfZHVyYXRpb24gPSAxMDAwO1xuXHR2YXIgX3JlcGVhdCA9IDA7XG5cdHZhciBfeW95byA9IGZhbHNlO1xuXHR2YXIgX2lzUGxheWluZyA9IGZhbHNlO1xuXHR2YXIgX3JldmVyc2VkID0gZmFsc2U7XG5cdHZhciBfZGVsYXlUaW1lID0gMDtcblx0dmFyIF9zdGFydFRpbWUgPSBudWxsO1xuXHR2YXIgX2Vhc2luZ0Z1bmN0aW9uID0gVFdFRU4uRWFzaW5nLkxpbmVhci5Ob25lO1xuXHR2YXIgX2ludGVycG9sYXRpb25GdW5jdGlvbiA9IFRXRUVOLkludGVycG9sYXRpb24uTGluZWFyO1xuXHR2YXIgX2NoYWluZWRUd2VlbnMgPSBbXTtcblx0dmFyIF9vblN0YXJ0Q2FsbGJhY2sgPSBudWxsO1xuXHR2YXIgX29uU3RhcnRDYWxsYmFja0ZpcmVkID0gZmFsc2U7XG5cdHZhciBfb25VcGRhdGVDYWxsYmFjayA9IG51bGw7XG5cdHZhciBfb25Db21wbGV0ZUNhbGxiYWNrID0gbnVsbDtcblx0dmFyIF9vblN0b3BDYWxsYmFjayA9IG51bGw7XG5cblx0Ly8gU2V0IGFsbCBzdGFydGluZyB2YWx1ZXMgcHJlc2VudCBvbiB0aGUgdGFyZ2V0IG9iamVjdFxuXHRmb3IgKHZhciBmaWVsZCBpbiBvYmplY3QpIHtcblx0XHRfdmFsdWVzU3RhcnRbZmllbGRdID0gcGFyc2VGbG9hdChvYmplY3RbZmllbGRdLCAxMCk7XG5cdH1cblxuXHR0aGlzLnRvID0gZnVuY3Rpb24gKHByb3BlcnRpZXMsIGR1cmF0aW9uKSB7XG5cblx0XHRpZiAoZHVyYXRpb24gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0X2R1cmF0aW9uID0gZHVyYXRpb247XG5cdFx0fVxuXG5cdFx0X3ZhbHVlc0VuZCA9IHByb3BlcnRpZXM7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMuc3RhcnQgPSBmdW5jdGlvbiAodGltZSkge1xuXG5cdFx0VFdFRU4uYWRkKHRoaXMpO1xuXG5cdFx0X2lzUGxheWluZyA9IHRydWU7XG5cblx0XHRfb25TdGFydENhbGxiYWNrRmlyZWQgPSBmYWxzZTtcblxuXHRcdF9zdGFydFRpbWUgPSB0aW1lICE9PSB1bmRlZmluZWQgPyB0aW1lIDogd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdF9zdGFydFRpbWUgKz0gX2RlbGF5VGltZTtcblxuXHRcdGZvciAodmFyIHByb3BlcnR5IGluIF92YWx1ZXNFbmQpIHtcblxuXHRcdFx0Ly8gQ2hlY2sgaWYgYW4gQXJyYXkgd2FzIHByb3ZpZGVkIGFzIHByb3BlcnR5IHZhbHVlXG5cdFx0XHRpZiAoX3ZhbHVlc0VuZFtwcm9wZXJ0eV0gaW5zdGFuY2VvZiBBcnJheSkge1xuXG5cdFx0XHRcdGlmIChfdmFsdWVzRW5kW3Byb3BlcnR5XS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIENyZWF0ZSBhIGxvY2FsIGNvcHkgb2YgdGhlIEFycmF5IHdpdGggdGhlIHN0YXJ0IHZhbHVlIGF0IHRoZSBmcm9udFxuXHRcdFx0XHRfdmFsdWVzRW5kW3Byb3BlcnR5XSA9IFtfb2JqZWN0W3Byb3BlcnR5XV0uY29uY2F0KF92YWx1ZXNFbmRbcHJvcGVydHldKTtcblxuXHRcdFx0fVxuXG5cdFx0XHRfdmFsdWVzU3RhcnRbcHJvcGVydHldID0gX29iamVjdFtwcm9wZXJ0eV07XG5cblx0XHRcdGlmICgoX3ZhbHVlc1N0YXJ0W3Byb3BlcnR5XSBpbnN0YW5jZW9mIEFycmF5KSA9PT0gZmFsc2UpIHtcblx0XHRcdFx0X3ZhbHVlc1N0YXJ0W3Byb3BlcnR5XSAqPSAxLjA7IC8vIEVuc3VyZXMgd2UncmUgdXNpbmcgbnVtYmVycywgbm90IHN0cmluZ3Ncblx0XHRcdH1cblxuXHRcdFx0X3ZhbHVlc1N0YXJ0UmVwZWF0W3Byb3BlcnR5XSA9IF92YWx1ZXNTdGFydFtwcm9wZXJ0eV0gfHwgMDtcblxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5zdG9wID0gZnVuY3Rpb24gKCkge1xuXG5cdFx0aWYgKCFfaXNQbGF5aW5nKSB7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9XG5cblx0XHRUV0VFTi5yZW1vdmUodGhpcyk7XG5cdFx0X2lzUGxheWluZyA9IGZhbHNlO1xuXG5cdFx0aWYgKF9vblN0b3BDYWxsYmFjayAhPT0gbnVsbCkge1xuXHRcdFx0X29uU3RvcENhbGxiYWNrLmNhbGwoX29iamVjdCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5zdG9wQ2hhaW5lZFR3ZWVucygpO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5zdG9wQ2hhaW5lZFR3ZWVucyA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdGZvciAodmFyIGkgPSAwLCBudW1DaGFpbmVkVHdlZW5zID0gX2NoYWluZWRUd2VlbnMubGVuZ3RoOyBpIDwgbnVtQ2hhaW5lZFR3ZWVuczsgaSsrKSB7XG5cdFx0XHRfY2hhaW5lZFR3ZWVuc1tpXS5zdG9wKCk7XG5cdFx0fVxuXG5cdH07XG5cblx0dGhpcy5kZWxheSA9IGZ1bmN0aW9uIChhbW91bnQpIHtcblxuXHRcdF9kZWxheVRpbWUgPSBhbW91bnQ7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLnJlcGVhdCA9IGZ1bmN0aW9uICh0aW1lcykge1xuXG5cdFx0X3JlcGVhdCA9IHRpbWVzO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy55b3lvID0gZnVuY3Rpb24gKHlveW8pIHtcblxuXHRcdF95b3lvID0geW95bztcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cblx0dGhpcy5lYXNpbmcgPSBmdW5jdGlvbiAoZWFzaW5nKSB7XG5cblx0XHRfZWFzaW5nRnVuY3Rpb24gPSBlYXNpbmc7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLmludGVycG9sYXRpb24gPSBmdW5jdGlvbiAoaW50ZXJwb2xhdGlvbikge1xuXG5cdFx0X2ludGVycG9sYXRpb25GdW5jdGlvbiA9IGludGVycG9sYXRpb247XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLmNoYWluID0gZnVuY3Rpb24gKCkge1xuXG5cdFx0X2NoYWluZWRUd2VlbnMgPSBhcmd1bWVudHM7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLm9uU3RhcnQgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcblxuXHRcdF9vblN0YXJ0Q2FsbGJhY2sgPSBjYWxsYmFjaztcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMub25VcGRhdGUgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcblxuXHRcdF9vblVwZGF0ZUNhbGxiYWNrID0gY2FsbGJhY2s7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLm9uQ29tcGxldGUgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcblxuXHRcdF9vbkNvbXBsZXRlQ2FsbGJhY2sgPSBjYWxsYmFjaztcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMub25TdG9wID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG5cblx0XHRfb25TdG9wQ2FsbGJhY2sgPSBjYWxsYmFjaztcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMudXBkYXRlID0gZnVuY3Rpb24gKHRpbWUpIHtcblxuXHRcdHZhciBwcm9wZXJ0eTtcblx0XHR2YXIgZWxhcHNlZDtcblx0XHR2YXIgdmFsdWU7XG5cblx0XHRpZiAodGltZSA8IF9zdGFydFRpbWUpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmIChfb25TdGFydENhbGxiYWNrRmlyZWQgPT09IGZhbHNlKSB7XG5cblx0XHRcdGlmIChfb25TdGFydENhbGxiYWNrICE9PSBudWxsKSB7XG5cdFx0XHRcdF9vblN0YXJ0Q2FsbGJhY2suY2FsbChfb2JqZWN0KTtcblx0XHRcdH1cblxuXHRcdFx0X29uU3RhcnRDYWxsYmFja0ZpcmVkID0gdHJ1ZTtcblxuXHRcdH1cblxuXHRcdGVsYXBzZWQgPSAodGltZSAtIF9zdGFydFRpbWUpIC8gX2R1cmF0aW9uO1xuXHRcdGVsYXBzZWQgPSBlbGFwc2VkID4gMSA/IDEgOiBlbGFwc2VkO1xuXG5cdFx0dmFsdWUgPSBfZWFzaW5nRnVuY3Rpb24oZWxhcHNlZCk7XG5cblx0XHRmb3IgKHByb3BlcnR5IGluIF92YWx1ZXNFbmQpIHtcblxuXHRcdFx0dmFyIHN0YXJ0ID0gX3ZhbHVlc1N0YXJ0W3Byb3BlcnR5XSB8fCAwO1xuXHRcdFx0dmFyIGVuZCA9IF92YWx1ZXNFbmRbcHJvcGVydHldO1xuXG5cdFx0XHRpZiAoZW5kIGluc3RhbmNlb2YgQXJyYXkpIHtcblxuXHRcdFx0XHRfb2JqZWN0W3Byb3BlcnR5XSA9IF9pbnRlcnBvbGF0aW9uRnVuY3Rpb24oZW5kLCB2YWx1ZSk7XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0Ly8gUGFyc2VzIHJlbGF0aXZlIGVuZCB2YWx1ZXMgd2l0aCBzdGFydCBhcyBiYXNlIChlLmcuOiArMTAsIC0zKVxuXHRcdFx0XHRpZiAodHlwZW9mIChlbmQpID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdGVuZCA9IHN0YXJ0ICsgcGFyc2VGbG9hdChlbmQsIDEwKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFByb3RlY3QgYWdhaW5zdCBub24gbnVtZXJpYyBwcm9wZXJ0aWVzLlxuXHRcdFx0XHRpZiAodHlwZW9mIChlbmQpID09PSAnbnVtYmVyJykge1xuXHRcdFx0XHRcdF9vYmplY3RbcHJvcGVydHldID0gc3RhcnQgKyAoZW5kIC0gc3RhcnQpICogdmFsdWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0aWYgKF9vblVwZGF0ZUNhbGxiYWNrICE9PSBudWxsKSB7XG5cdFx0XHRfb25VcGRhdGVDYWxsYmFjay5jYWxsKF9vYmplY3QsIHZhbHVlKTtcblx0XHR9XG5cblx0XHRpZiAoZWxhcHNlZCA9PT0gMSkge1xuXG5cdFx0XHRpZiAoX3JlcGVhdCA+IDApIHtcblxuXHRcdFx0XHRpZiAoaXNGaW5pdGUoX3JlcGVhdCkpIHtcblx0XHRcdFx0XHRfcmVwZWF0LS07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBSZWFzc2lnbiBzdGFydGluZyB2YWx1ZXMsIHJlc3RhcnQgYnkgbWFraW5nIHN0YXJ0VGltZSA9IG5vd1xuXHRcdFx0XHRmb3IgKHByb3BlcnR5IGluIF92YWx1ZXNTdGFydFJlcGVhdCkge1xuXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiAoX3ZhbHVlc0VuZFtwcm9wZXJ0eV0pID09PSAnc3RyaW5nJykge1xuXHRcdFx0XHRcdFx0X3ZhbHVlc1N0YXJ0UmVwZWF0W3Byb3BlcnR5XSA9IF92YWx1ZXNTdGFydFJlcGVhdFtwcm9wZXJ0eV0gKyBwYXJzZUZsb2F0KF92YWx1ZXNFbmRbcHJvcGVydHldLCAxMCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKF95b3lvKSB7XG5cdFx0XHRcdFx0XHR2YXIgdG1wID0gX3ZhbHVlc1N0YXJ0UmVwZWF0W3Byb3BlcnR5XTtcblxuXHRcdFx0XHRcdFx0X3ZhbHVlc1N0YXJ0UmVwZWF0W3Byb3BlcnR5XSA9IF92YWx1ZXNFbmRbcHJvcGVydHldO1xuXHRcdFx0XHRcdFx0X3ZhbHVlc0VuZFtwcm9wZXJ0eV0gPSB0bXA7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0X3ZhbHVlc1N0YXJ0W3Byb3BlcnR5XSA9IF92YWx1ZXNTdGFydFJlcGVhdFtwcm9wZXJ0eV07XG5cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChfeW95bykge1xuXHRcdFx0XHRcdF9yZXZlcnNlZCA9ICFfcmV2ZXJzZWQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRfc3RhcnRUaW1lID0gdGltZSArIF9kZWxheVRpbWU7XG5cblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0aWYgKF9vbkNvbXBsZXRlQ2FsbGJhY2sgIT09IG51bGwpIHtcblx0XHRcdFx0XHRfb25Db21wbGV0ZUNhbGxiYWNrLmNhbGwoX29iamVjdCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKHZhciBpID0gMCwgbnVtQ2hhaW5lZFR3ZWVucyA9IF9jaGFpbmVkVHdlZW5zLmxlbmd0aDsgaSA8IG51bUNoYWluZWRUd2VlbnM7IGkrKykge1xuXHRcdFx0XHRcdC8vIE1ha2UgdGhlIGNoYWluZWQgdHdlZW5zIHN0YXJ0IGV4YWN0bHkgYXQgdGhlIHRpbWUgdGhleSBzaG91bGQsXG5cdFx0XHRcdFx0Ly8gZXZlbiBpZiB0aGUgYHVwZGF0ZSgpYCBtZXRob2Qgd2FzIGNhbGxlZCB3YXkgcGFzdCB0aGUgZHVyYXRpb24gb2YgdGhlIHR3ZWVuXG5cdFx0XHRcdFx0X2NoYWluZWRUd2VlbnNbaV0uc3RhcnQoX3N0YXJ0VGltZSArIF9kdXJhdGlvbik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXG5cdH07XG5cbn07XG5cblxuVFdFRU4uRWFzaW5nID0ge1xuXG5cdExpbmVhcjoge1xuXG5cdFx0Tm9uZTogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGs7XG5cblx0XHR9XG5cblx0fSxcblxuXHRRdWFkcmF0aWM6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gayAqIGs7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gayAqICgyIC0gayk7XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdGlmICgoayAqPSAyKSA8IDEpIHtcblx0XHRcdFx0cmV0dXJuIDAuNSAqIGsgKiBrO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gLSAwLjUgKiAoLS1rICogKGsgLSAyKSAtIDEpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0Q3ViaWM6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gayAqIGsgKiBrO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIC0tayAqIGsgKiBrICsgMTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKChrICo9IDIpIDwgMSkge1xuXHRcdFx0XHRyZXR1cm4gMC41ICogayAqIGsgKiBrO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gMC41ICogKChrIC09IDIpICogayAqIGsgKyAyKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdFF1YXJ0aWM6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gayAqIGsgKiBrICogaztcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiAxIC0gKC0tayAqIGsgKiBrICogayk7XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdGlmICgoayAqPSAyKSA8IDEpIHtcblx0XHRcdFx0cmV0dXJuIDAuNSAqIGsgKiBrICogayAqIGs7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAtIDAuNSAqICgoayAtPSAyKSAqIGsgKiBrICogayAtIDIpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0UXVpbnRpYzoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrICogayAqIGsgKiBrICogaztcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiAtLWsgKiBrICogayAqIGsgKiBrICsgMTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKChrICo9IDIpIDwgMSkge1xuXHRcdFx0XHRyZXR1cm4gMC41ICogayAqIGsgKiBrICogayAqIGs7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAwLjUgKiAoKGsgLT0gMikgKiBrICogayAqIGsgKiBrICsgMik7XG5cblx0XHR9XG5cblx0fSxcblxuXHRTaW51c29pZGFsOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIDEgLSBNYXRoLmNvcyhrICogTWF0aC5QSSAvIDIpO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIE1hdGguc2luKGsgKiBNYXRoLlBJIC8gMik7XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiAwLjUgKiAoMSAtIE1hdGguY29zKE1hdGguUEkgKiBrKSk7XG5cblx0XHR9XG5cblx0fSxcblxuXHRFeHBvbmVudGlhbDoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrID09PSAwID8gMCA6IE1hdGgucG93KDEwMjQsIGsgLSAxKTtcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrID09PSAxID8gMSA6IDEgLSBNYXRoLnBvdygyLCAtIDEwICogayk7XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdGlmIChrID09PSAwKSB7XG5cdFx0XHRcdHJldHVybiAwO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoayA9PT0gMSkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKChrICo9IDIpIDwgMSkge1xuXHRcdFx0XHRyZXR1cm4gMC41ICogTWF0aC5wb3coMTAyNCwgayAtIDEpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gMC41ICogKC0gTWF0aC5wb3coMiwgLSAxMCAqIChrIC0gMSkpICsgMik7XG5cblx0XHR9XG5cblx0fSxcblxuXHRDaXJjdWxhcjoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiAxIC0gTWF0aC5zcXJ0KDEgLSBrICogayk7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gTWF0aC5zcXJ0KDEgLSAoLS1rICogaykpO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAtIDAuNSAqIChNYXRoLnNxcnQoMSAtIGsgKiBrKSAtIDEpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gMC41ICogKE1hdGguc3FydCgxIC0gKGsgLT0gMikgKiBrKSArIDEpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0RWxhc3RpYzoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHZhciBzO1xuXHRcdFx0dmFyIGEgPSAwLjE7XG5cdFx0XHR2YXIgcCA9IDAuNDtcblxuXHRcdFx0aWYgKGsgPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChrID09PSAxKSB7XG5cdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWEgfHwgYSA8IDEpIHtcblx0XHRcdFx0YSA9IDE7XG5cdFx0XHRcdHMgPSBwIC8gNDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHMgPSBwICogTWF0aC5hc2luKDEgLyBhKSAvICgyICogTWF0aC5QSSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAtIChhICogTWF0aC5wb3coMiwgMTAgKiAoayAtPSAxKSkgKiBNYXRoLnNpbigoayAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApKTtcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHZhciBzO1xuXHRcdFx0dmFyIGEgPSAwLjE7XG5cdFx0XHR2YXIgcCA9IDAuNDtcblxuXHRcdFx0aWYgKGsgPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChrID09PSAxKSB7XG5cdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWEgfHwgYSA8IDEpIHtcblx0XHRcdFx0YSA9IDE7XG5cdFx0XHRcdHMgPSBwIC8gNDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHMgPSBwICogTWF0aC5hc2luKDEgLyBhKSAvICgyICogTWF0aC5QSSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAoYSAqIE1hdGgucG93KDIsIC0gMTAgKiBrKSAqIE1hdGguc2luKChrIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkgKyAxKTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0dmFyIHM7XG5cdFx0XHR2YXIgYSA9IDAuMTtcblx0XHRcdHZhciBwID0gMC40O1xuXG5cdFx0XHRpZiAoayA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGsgPT09IDEpIHtcblx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghYSB8fCBhIDwgMSkge1xuXHRcdFx0XHRhID0gMTtcblx0XHRcdFx0cyA9IHAgLyA0O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cyA9IHAgKiBNYXRoLmFzaW4oMSAvIGEpIC8gKDIgKiBNYXRoLlBJKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKChrICo9IDIpIDwgMSkge1xuXHRcdFx0XHRyZXR1cm4gLSAwLjUgKiAoYSAqIE1hdGgucG93KDIsIDEwICogKGsgLT0gMSkpICogTWF0aC5zaW4oKGsgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhICogTWF0aC5wb3coMiwgLTEwICogKGsgLT0gMSkpICogTWF0aC5zaW4oKGsgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSAqIDAuNSArIDE7XG5cblx0XHR9XG5cblx0fSxcblxuXHRCYWNrOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0dmFyIHMgPSAxLjcwMTU4O1xuXG5cdFx0XHRyZXR1cm4gayAqIGsgKiAoKHMgKyAxKSAqIGsgLSBzKTtcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHZhciBzID0gMS43MDE1ODtcblxuXHRcdFx0cmV0dXJuIC0tayAqIGsgKiAoKHMgKyAxKSAqIGsgKyBzKSArIDE7XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHZhciBzID0gMS43MDE1OCAqIDEuNTI1O1xuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAwLjUgKiAoayAqIGsgKiAoKHMgKyAxKSAqIGsgLSBzKSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAwLjUgKiAoKGsgLT0gMikgKiBrICogKChzICsgMSkgKiBrICsgcykgKyAyKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdEJvdW5jZToge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiAxIC0gVFdFRU4uRWFzaW5nLkJvdW5jZS5PdXQoMSAtIGspO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKGsgPCAoMSAvIDIuNzUpKSB7XG5cdFx0XHRcdHJldHVybiA3LjU2MjUgKiBrICogaztcblx0XHRcdH0gZWxzZSBpZiAoayA8ICgyIC8gMi43NSkpIHtcblx0XHRcdFx0cmV0dXJuIDcuNTYyNSAqIChrIC09ICgxLjUgLyAyLjc1KSkgKiBrICsgMC43NTtcblx0XHRcdH0gZWxzZSBpZiAoayA8ICgyLjUgLyAyLjc1KSkge1xuXHRcdFx0XHRyZXR1cm4gNy41NjI1ICogKGsgLT0gKDIuMjUgLyAyLjc1KSkgKiBrICsgMC45Mzc1O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIDcuNTYyNSAqIChrIC09ICgyLjYyNSAvIDIuNzUpKSAqIGsgKyAwLjk4NDM3NTtcblx0XHRcdH1cblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKGsgPCAwLjUpIHtcblx0XHRcdFx0cmV0dXJuIFRXRUVOLkVhc2luZy5Cb3VuY2UuSW4oayAqIDIpICogMC41O1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gVFdFRU4uRWFzaW5nLkJvdW5jZS5PdXQoayAqIDIgLSAxKSAqIDAuNSArIDAuNTtcblxuXHRcdH1cblxuXHR9XG5cbn07XG5cblRXRUVOLkludGVycG9sYXRpb24gPSB7XG5cblx0TGluZWFyOiBmdW5jdGlvbiAodiwgaykge1xuXG5cdFx0dmFyIG0gPSB2Lmxlbmd0aCAtIDE7XG5cdFx0dmFyIGYgPSBtICogaztcblx0XHR2YXIgaSA9IE1hdGguZmxvb3IoZik7XG5cdFx0dmFyIGZuID0gVFdFRU4uSW50ZXJwb2xhdGlvbi5VdGlscy5MaW5lYXI7XG5cblx0XHRpZiAoayA8IDApIHtcblx0XHRcdHJldHVybiBmbih2WzBdLCB2WzFdLCBmKTtcblx0XHR9XG5cblx0XHRpZiAoayA+IDEpIHtcblx0XHRcdHJldHVybiBmbih2W21dLCB2W20gLSAxXSwgbSAtIGYpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmbih2W2ldLCB2W2kgKyAxID4gbSA/IG0gOiBpICsgMV0sIGYgLSBpKTtcblxuXHR9LFxuXG5cdEJlemllcjogZnVuY3Rpb24gKHYsIGspIHtcblxuXHRcdHZhciBiID0gMDtcblx0XHR2YXIgbiA9IHYubGVuZ3RoIC0gMTtcblx0XHR2YXIgcHcgPSBNYXRoLnBvdztcblx0XHR2YXIgYm4gPSBUV0VFTi5JbnRlcnBvbGF0aW9uLlV0aWxzLkJlcm5zdGVpbjtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDw9IG47IGkrKykge1xuXHRcdFx0YiArPSBwdygxIC0gaywgbiAtIGkpICogcHcoaywgaSkgKiB2W2ldICogYm4obiwgaSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGI7XG5cblx0fSxcblxuXHRDYXRtdWxsUm9tOiBmdW5jdGlvbiAodiwgaykge1xuXG5cdFx0dmFyIG0gPSB2Lmxlbmd0aCAtIDE7XG5cdFx0dmFyIGYgPSBtICogaztcblx0XHR2YXIgaSA9IE1hdGguZmxvb3IoZik7XG5cdFx0dmFyIGZuID0gVFdFRU4uSW50ZXJwb2xhdGlvbi5VdGlscy5DYXRtdWxsUm9tO1xuXG5cdFx0aWYgKHZbMF0gPT09IHZbbV0pIHtcblxuXHRcdFx0aWYgKGsgPCAwKSB7XG5cdFx0XHRcdGkgPSBNYXRoLmZsb29yKGYgPSBtICogKDEgKyBrKSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmbih2WyhpIC0gMSArIG0pICUgbV0sIHZbaV0sIHZbKGkgKyAxKSAlIG1dLCB2WyhpICsgMikgJSBtXSwgZiAtIGkpO1xuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0aWYgKGsgPCAwKSB7XG5cdFx0XHRcdHJldHVybiB2WzBdIC0gKGZuKHZbMF0sIHZbMF0sIHZbMV0sIHZbMV0sIC1mKSAtIHZbMF0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoayA+IDEpIHtcblx0XHRcdFx0cmV0dXJuIHZbbV0gLSAoZm4odlttXSwgdlttXSwgdlttIC0gMV0sIHZbbSAtIDFdLCBmIC0gbSkgLSB2W21dKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZuKHZbaSA/IGkgLSAxIDogMF0sIHZbaV0sIHZbbSA8IGkgKyAxID8gbSA6IGkgKyAxXSwgdlttIDwgaSArIDIgPyBtIDogaSArIDJdLCBmIC0gaSk7XG5cblx0XHR9XG5cblx0fSxcblxuXHRVdGlsczoge1xuXG5cdFx0TGluZWFyOiBmdW5jdGlvbiAocDAsIHAxLCB0KSB7XG5cblx0XHRcdHJldHVybiAocDEgLSBwMCkgKiB0ICsgcDA7XG5cblx0XHR9LFxuXG5cdFx0QmVybnN0ZWluOiBmdW5jdGlvbiAobiwgaSkge1xuXG5cdFx0XHR2YXIgZmMgPSBUV0VFTi5JbnRlcnBvbGF0aW9uLlV0aWxzLkZhY3RvcmlhbDtcblxuXHRcdFx0cmV0dXJuIGZjKG4pIC8gZmMoaSkgLyBmYyhuIC0gaSk7XG5cblx0XHR9LFxuXG5cdFx0RmFjdG9yaWFsOiAoZnVuY3Rpb24gKCkge1xuXG5cdFx0XHR2YXIgYSA9IFsxXTtcblxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uIChuKSB7XG5cblx0XHRcdFx0dmFyIHMgPSAxO1xuXG5cdFx0XHRcdGlmIChhW25dKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGFbbl07XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRmb3IgKHZhciBpID0gbjsgaSA+IDE7IGktLSkge1xuXHRcdFx0XHRcdHMgKj0gaTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGFbbl0gPSBzO1xuXHRcdFx0XHRyZXR1cm4gcztcblxuXHRcdFx0fTtcblxuXHRcdH0pKCksXG5cblx0XHRDYXRtdWxsUm9tOiBmdW5jdGlvbiAocDAsIHAxLCBwMiwgcDMsIHQpIHtcblxuXHRcdFx0dmFyIHYwID0gKHAyIC0gcDApICogMC41O1xuXHRcdFx0dmFyIHYxID0gKHAzIC0gcDEpICogMC41O1xuXHRcdFx0dmFyIHQyID0gdCAqIHQ7XG5cdFx0XHR2YXIgdDMgPSB0ICogdDI7XG5cblx0XHRcdHJldHVybiAoMiAqIHAxIC0gMiAqIHAyICsgdjAgKyB2MSkgKiB0MyArICgtIDMgKiBwMSArIDMgKiBwMiAtIDIgKiB2MCAtIHYxKSAqIHQyICsgdjAgKiB0ICsgcDE7XG5cblx0XHR9XG5cblx0fVxuXG59O1xuXG4vLyBVTUQgKFVuaXZlcnNhbCBNb2R1bGUgRGVmaW5pdGlvbilcbihmdW5jdGlvbiAocm9vdCkge1xuXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblxuXHRcdC8vIEFNRFxuXHRcdGRlZmluZShbXSwgZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIFRXRUVOO1xuXHRcdH0pO1xuXG5cdH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG5cblx0XHQvLyBOb2RlLmpzXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBUV0VFTjtcblxuXHR9IGVsc2Uge1xuXG5cdFx0Ly8gR2xvYmFsIHZhcmlhYmxlXG5cdFx0cm9vdC5UV0VFTiA9IFRXRUVOO1xuXG5cdH1cblxufSkodGhpcyk7XG4iXX0=

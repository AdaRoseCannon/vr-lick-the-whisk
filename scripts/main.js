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
	var toTexture = threeHelper.pickObjectsHelper(threeHelper.scene, 'Room', 'Counter', 'Cake');
	var toShiny = threeHelper.pickObjectsHelper(threeHelper.scene, 'LickTheWhisk', 'Whisk', 'SaucePan', 'SaucePan.001', 'SaucePan.002', 'SaucePan.003', 'Fridge');
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
		var copper = new THREE.MeshPhongMaterial({ color: 0x99ff99, specular: 0x772222, envMap: envMap, combine: THREE.MixOperation, reflectivity: 0.3, metal: true });
		var aluminium = new THREE.MeshPhongMaterial({ color: 0x888888, specular: 0x999999, envMap: envMap, combine: THREE.MixOperation, reflectivity: 0.3, metal: true });
		var chocolate = new THREE.MeshPhongMaterial({ color: toShiny.LickTheWhisk.material.color, specular: 0x999999, envMap: envMap, combine: THREE.MixOperation, reflectivity: 0.3, metal: true });

		toShiny['SaucePan'].material = copper;
		toShiny['SaucePan.001'].material = copper;
		toShiny['SaucePan.002'].material = copper;
		toShiny['SaucePan.003'].material = copper;
		toShiny.Whisk.material = aluminium;
		toShiny.LickTheWhisk.material = chocolate;

		textureLoader.load('models/Kitchen/FridgeBake.png', function (map) {
			return toShiny.Fridge.material = new THREE.MeshPhongMaterial({ map: map, envMap: envMap, combine: THREE.MixOperation, specular: 0x999999, reflectivity: 0.3, metal: true, side: THREE.DoubleSide });
		});
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvY2FtZXJhaW50ZXJhY3Rpb25zLmpzIiwiL2hvbWUvYWRhL2dpdFdvcmtpbmdEaXIvbGljay10aGUtd2hpc2svYXBwL3NjcmlwdHMvbGliL2xvYWRTY3JpcHQuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvc2t5LmpzIiwiL2hvbWUvYWRhL2dpdFdvcmtpbmdEaXIvbGljay10aGUtd2hpc2svYXBwL3NjcmlwdHMvbGliL3RleHRTcHJpdGUuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvdGhyZWVIZWxwZXIuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvdmVybGV0d3JhcHBlci5qcyIsIi9ob21lL2FkYS9naXRXb3JraW5nRGlyL2xpY2stdGhlLXdoaXNrL2FwcC9zY3JpcHRzL21haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvZmFzdC1ldmVudC1lbWl0dGVyL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mYXN0LWV2ZW50LWVtaXR0ZXIvbm9kZV9tb2R1bGVzL3Byb3RvY2xhc3MvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3R3ZWVuLmpzL3NyYy9Ud2Vlbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0FDS0EsWUFBWSxDQUFDO0FBQ2IsSUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDbkQsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7QUFZN0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLGNBQWMsQ0FBQyxVQUFVLEVBQUU7OztBQUVwRCxVQUFTLFFBQVEsQ0FBQyxJQUFJLEVBQUU7OztBQUV2QixjQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUV4QixNQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDOUIsTUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDdEIsTUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsTUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQzs7QUFFbkMsTUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsWUFBTTtBQUN0QixTQUFLLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDckIsU0FBSyxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7R0FDakMsQ0FBQyxDQUFDOztBQUVILE1BQUksQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFlBQU07QUFDekIsU0FBSyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLFNBQUssTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO0dBQ25DLENBQUMsQ0FBQzs7QUFFSCxNQUFJLENBQUMsSUFBSSxHQUFHLFlBQUs7QUFDaEIsU0FBSyxNQUFNLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztHQUM1QixDQUFD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LENBQUMsQ0FBQztBQUMzQixTQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDbkMsVUFBTyxhQUFhLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0dBQ3hDOztBQUVELFFBQU0sQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0VBQ2pDLENBQUMsQ0FBQztDQUNILENBQUMsQ0FBQzs7O0FDL0pIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBTZXRzIHVwIGFuIGVudmlyb21lbnQgZm9yIGRldGVjdGluZyB0aGF0IFxuICogdGhlIGNhbWVyYSBpcyBsb29raW5nIGF0IG9iamVjdHMuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZmFzdC1ldmVudC1lbWl0dGVyJyk7XG5jb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG4vKmdsb2JhbCBUSFJFRSovXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIGludGVyYWN0aXZlIDNEIGVsZW1lbnRzIGFuZCBcbiAqIGNhbiBiZSB1c2VkIHRvIHRyaWdnZXIgZXZlbnRzIG9uIHRoZW0uXG4gKlxuICogVGhlIGRvbUVsZW1lbnQgaXMgdG8gcGljayB1cCB0b3VjaCBpbmVyYWN0aW9uc1xuICogXG4gKiBAcGFyYW0gIHtbdHlwZV19IGRvbUVsZW1lbnQgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBHb1RhcmdldENvbmZpZyhkb21FbGVtZW50KSB7XG5cblx0ZnVuY3Rpb24gR29UYXJnZXQobm9kZSkge1xuXG5cdFx0RXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cblx0XHR0aGlzLnBvc2l0aW9uID0gbm9kZS5wb3NpdGlvbjtcblx0XHR0aGlzLmhhc0hvdmVyID0gZmFsc2U7XG5cdFx0dGhpcy5zcHJpdGUgPSBub2RlO1xuXHRcdHRoaXMuc3ByaXRlLm1hdGVyaWFsLm9wYWNpdHkgPSAwLjU7XG5cblx0XHR0aGlzLm9uKCdob3ZlcicsICgpID0+IHtcblx0XHRcdHRoaXMuaGFzSG92ZXIgPSB0cnVlO1xuXHRcdFx0dGhpcy5zcHJpdGUubWF0ZXJpYWwub3BhY2l0eSA9IDE7XG5cdFx0fSk7XG5cblx0XHR0aGlzLm9uKCdob3Zlck91dCcsICgpID0+IHtcblx0XHRcdHRoaXMuaGFzSG92ZXIgPSBmYWxzZTtcblx0XHRcdHRoaXMuc3ByaXRlLm1hdGVyaWFsLm9wYWNpdHkgPSAwLjU7XG5cdFx0fSk7XG5cblx0XHR0aGlzLmhpZGUgPSAoKSA9Pntcblx0XHRcdHRoaXMuc3ByaXRlLnZpc2libGUgPSBmYWxzZTtcblx0XHR9O1xuXG5cdFx0dGhpcy5zaG93ID0gKCkgPT57XG5cdFx0XHR0aGlzLnNwcml0ZS52aXNpYmxlID0gdHJ1ZTtcblx0XHR9O1xuXHR9XG5cdHV0aWwuaW5oZXJpdHMoR29UYXJnZXQsIEV2ZW50RW1pdHRlcik7XG5cblx0dGhpcy50YXJnZXRzID0gbmV3IE1hcCgpO1xuXG5cdHRoaXMuZGV0ZWN0SW50ZXJhY3Rpb25zID0gZnVuY3Rpb24gKGNhbWVyYSkge1xuXG5cdFx0Y29uc3QgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuXHRcdHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKG5ldyBUSFJFRS5WZWN0b3IyKDAsMCksIGNhbWVyYSk7XG5cdFx0Y29uc3QgaGl0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKFxuXHRcdFx0QXJyYXkuZnJvbSh0aGlzLnRhcmdldHMudmFsdWVzKCkpXG5cdFx0XHQubWFwKHRhcmdldCA9PiB0YXJnZXQuc3ByaXRlKVxuXHRcdFx0LmZpbHRlcihzcHJpdGUgPT4gc3ByaXRlLnZpc2libGUpXG5cdFx0KTtcblxuXHRcdGxldCB0YXJnZXQgPSBmYWxzZTtcblxuXHRcdGlmIChoaXRzLmxlbmd0aCkge1xuXG5cdFx0XHQvLyBTaG93IGhpZGRlbiB0ZXh0IHNwcml0ZSBjaGlsZFxuXHRcdFx0dGFyZ2V0ID0gdGhpcy50YXJnZXRzLmdldChoaXRzWzBdLm9iamVjdCk7XG5cdFx0XHRpZiAodGFyZ2V0KSB0YXJnZXQuZW1pdCgnaG92ZXInKTtcblx0XHR9XG5cblx0XHQvLyBpZiBpdCBpcyBub3QgdGhlIG9uZSBqdXN0IG1hcmtlZCBmb3IgaGlnaGxpZ2h0XG5cdFx0Ly8gYW5kIGl0IHVzZWQgdG8gYmUgaGlnaGxpZ2h0ZWQgdW4gaGlnaGxpZ2h0IGl0LlxuXHRcdEFycmF5LmZyb20odGhpcy50YXJnZXRzLnZhbHVlcygpKVxuXHRcdC5maWx0ZXIoZWFjaFRhcmdldCA9PiBlYWNoVGFyZ2V0ICE9PSB0YXJnZXQpXG5cdFx0LmZvckVhY2goZWFjaE5vdEhpdCA9PiB7XG5cdFx0XHRpZiAoZWFjaE5vdEhpdC5oYXNIb3ZlcikgZWFjaE5vdEhpdC5lbWl0KCdob3Zlck91dCcpO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGNvbnN0IGludGVyYWN0ID0gKGV2ZW50KSA9PiB7XG5cdFx0QXJyYXkuZnJvbSh0aGlzLnRhcmdldHMudmFsdWVzKCkpLmZvckVhY2godGFyZ2V0ID0+IHtcblx0XHRcdGlmICh0YXJnZXQuaGFzSG92ZXIpIHtcblx0XHRcdFx0dGFyZ2V0LmVtaXQoZXZlbnQudHlwZSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH07XG5cdHRoaXMuaW50ZXJhY3QgPSBpbnRlcmFjdDtcblxuXHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgaW50ZXJhY3QpO1xuXHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGludGVyYWN0KTtcblx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgaW50ZXJhY3QpO1xuXHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNodXAnLCBpbnRlcmFjdCk7XG5cdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hkb3duJywgaW50ZXJhY3QpO1xuXG5cdHRoaXMubWFrZVRhcmdldCA9IG5vZGUgPT4ge1xuXHRcdGNvbnN0IG5ld1RhcmdldCA9IG5ldyBHb1RhcmdldChub2RlKTtcblx0XHR0aGlzLnRhcmdldHMuc2V0KG5vZGUsIG5ld1RhcmdldCk7XG5cdFx0cmV0dXJuIG5ld1RhcmdldDtcblx0fTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGFkZFNjcmlwdCh1cmwpIHtcblx0cmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0XHR2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cdFx0c2NyaXB0LnNldEF0dHJpYnV0ZSgnc3JjJywgdXJsKTtcblx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG5cdFx0c2NyaXB0Lm9ubG9hZCA9IHJlc29sdmU7XG5cdFx0c2NyaXB0Lm9uZXJyb3IgPSByZWplY3Q7XG5cdH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFkZFNjcmlwdDtcbiIsIi8qZ2xvYmFsIFRIUkVFKi9cbid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbml0U2t5KCkge1xuXG5cdC8vIEFkZCBTa3kgTWVzaFxuXHRjb25zdCBza3kgPSBuZXcgVEhSRUUuU2t5KCk7XG5cblx0dmFyIGVmZmVjdENvbnRyb2xsZXIgID0ge1xuXHRcdHR1cmJpZGl0eTogMTAsXG5cdFx0cmVpbGVpZ2g6IDIsXG5cdFx0bWllQ29lZmZpY2llbnQ6IDAuMDA1LFxuXHRcdG1pZURpcmVjdGlvbmFsRzogMC44LFxuXHRcdGx1bWluYW5jZTogMSxcblx0XHRpbmNsaW5hdGlvbjogMC40OSwgLy8gZWxldmF0aW9uIC8gaW5jbGluYXRpb25cblx0XHRhemltdXRoOiAwLjI1LCAvLyBGYWNpbmcgZnJvbnQsXG5cdH07XG5cblx0dmFyIGRpc3RhbmNlID0gNDAwMDAwO1xuXG5cdGZ1bmN0aW9uIGluaXRVbmlmb3JtcygpIHtcblxuXHRcdGNvbnN0IHVuaWZvcm1zID0gc2t5LnVuaWZvcm1zO1xuXHRcdGNvbnN0IHN1blBvcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cdFx0dW5pZm9ybXMudHVyYmlkaXR5LnZhbHVlID0gZWZmZWN0Q29udHJvbGxlci50dXJiaWRpdHk7XG5cdFx0dW5pZm9ybXMucmVpbGVpZ2gudmFsdWUgPSBlZmZlY3RDb250cm9sbGVyLnJlaWxlaWdoO1xuXHRcdHVuaWZvcm1zLmx1bWluYW5jZS52YWx1ZSA9IGVmZmVjdENvbnRyb2xsZXIubHVtaW5hbmNlO1xuXHRcdHVuaWZvcm1zLm1pZUNvZWZmaWNpZW50LnZhbHVlID0gZWZmZWN0Q29udHJvbGxlci5taWVDb2VmZmljaWVudDtcblx0XHR1bmlmb3Jtcy5taWVEaXJlY3Rpb25hbEcudmFsdWUgPSBlZmZlY3RDb250cm9sbGVyLm1pZURpcmVjdGlvbmFsRztcblxuXHRcdHZhciB0aGV0YSA9IE1hdGguUEkgKiAoIGVmZmVjdENvbnRyb2xsZXIuaW5jbGluYXRpb24gLSAwLjUgKTtcblx0XHR2YXIgcGhpID0gMiAqIE1hdGguUEkgKiAoIGVmZmVjdENvbnRyb2xsZXIuYXppbXV0aCAtIDAuNSApO1xuXG5cdFx0c3VuUG9zLnggPSBkaXN0YW5jZSAqIE1hdGguY29zKCBwaGkgKTtcblx0XHRzdW5Qb3MueSA9IGRpc3RhbmNlICogTWF0aC5zaW4oIHBoaSApICogTWF0aC5zaW4oIHRoZXRhICk7XG5cdFx0c3VuUG9zLnogPSBkaXN0YW5jZSAqIE1hdGguc2luKCBwaGkgKSAqIE1hdGguY29zKCB0aGV0YSApO1xuXG5cdFx0c2t5LnVuaWZvcm1zLnN1blBvc2l0aW9uLnZhbHVlLmNvcHkoIHN1blBvcyApO1xuXG5cdH1cblx0aW5pdFVuaWZvcm1zKCk7XG5cblx0cmV0dXJuIHNreS5tZXNoO1xufTtcbiIsIi8vIEZyb20gaHR0cDovL3N0ZW1rb3NraS5naXRodWIuaW8vVGhyZWUuanMvU3ByaXRlLVRleHQtTGFiZWxzLmh0bWxcbi8qZ2xvYmFsIFRIUkVFKi9cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gbWFrZVRleHRTcHJpdGUoIG1lc3NhZ2UsIHBhcmFtZXRlcnMgKSB7XG5cdGlmICggcGFyYW1ldGVycyA9PT0gdW5kZWZpbmVkICkgcGFyYW1ldGVycyA9IHt9O1xuXHRcblx0Y29uc3QgZm9udGZhY2UgPSBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwiZm9udGZhY2VcIikgPyBcblx0XHRwYXJhbWV0ZXJzW1wiZm9udGZhY2VcIl0gOiBcIkFyaWFsXCI7XG5cdFxuXHRjb25zdCBib3JkZXJUaGlja25lc3MgPSBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwiYm9yZGVyVGhpY2tuZXNzXCIpID8gXG5cdFx0cGFyYW1ldGVyc1tcImJvcmRlclRoaWNrbmVzc1wiXSA6IDI7XG5cblx0Ly8gbWF5IHR3ZWFrZWQgbGF0ZXIgdG8gc2NhbGUgdGV4dFxuXHRsZXQgc2l6ZSA9IHBhcmFtZXRlcnMuaGFzT3duUHJvcGVydHkoXCJzaXplXCIpID8gXG5cdFx0cGFyYW1ldGVyc1tcInNpemVcIl0gOiAxO1xuXHRcdFxuXHRjb25zdCBjYW52YXMxID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cdGNvbnN0IGNvbnRleHQxID0gY2FudmFzMS5nZXRDb250ZXh0KCcyZCcpO1xuXHRjb25zdCBoZWlnaHQgPSAyNTY7XG5cblx0ZnVuY3Rpb24gc2V0U3R5bGUoY29udGV4dCkge1xuXG5cdFx0Y29udGV4dC5mb250ID0gXCJCb2xkIFwiICsgKGhlaWdodCAtIGJvcmRlclRoaWNrbmVzcykgKyBcInB4IFwiICsgZm9udGZhY2U7XG5cdFx0Y29udGV4dC50ZXh0QWxpZ24gPSAnY2VudGVyJztcblx0XHRjb250ZXh0LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xuXHRcdFxuXHRcdGNvbnRleHQubGluZVdpZHRoID0gYm9yZGVyVGhpY2tuZXNzO1xuXG5cdFx0Ly8gdGV4dCBjb2xvclxuXHRcdGNvbnRleHQuc3Ryb2tlU3R5bGUgPSBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMS4wKVwiO1xuXHRcdGNvbnRleHQuZmlsbFN0eWxlID0gXCJyZ2JhKDAsIDAsIDAsIDEuMClcIjtcblx0fVxuXG5cdHNldFN0eWxlKGNvbnRleHQxKTtcblxuXHRjb25zdCBjYW52YXMyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG5cblx0Ly8gTWFrZSB0aGUgY2FudmFzIHdpZHRoIGEgcG93ZXIgb2YgMiBsYXJnZXIgdGhhbiB0aGUgdGV4dCB3aWR0aFxuXHRjb25zdCBtZWFzdXJlID0gY29udGV4dDEubWVhc3VyZVRleHQoIG1lc3NhZ2UgKTtcblx0Y2FudmFzMi53aWR0aCA9IE1hdGgucG93KDIsIE1hdGguY2VpbChNYXRoLmxvZzIoIG1lYXN1cmUud2lkdGggKSkpO1xuXHRjYW52YXMyLmhlaWdodCA9IGhlaWdodDtcblx0Y29uc29sZS5sb2cobWVhc3VyZSk7XG5cdGNvbnN0IGNvbnRleHQyID0gY2FudmFzMi5nZXRDb250ZXh0KCcyZCcpO1xuXG5cdGNvbnRleHQyLnJlY3QoMCwgMCwgY2FudmFzMi53aWR0aCwgY2FudmFzMi5oZWlnaHQpO1xuXHRjb250ZXh0Mi5maWxsU3R5bGU9XCJyZWRcIjtcblx0Y29udGV4dDIuZmlsbCgpO1xuXG5cdHNldFN0eWxlKGNvbnRleHQyKTtcblxuXHRjb250ZXh0Mi5zdHJva2VUZXh0KCBtZXNzYWdlLCBjYW52YXMyLndpZHRoLzIsIGNhbnZhczIuaGVpZ2h0LzIpO1xuXHRjb250ZXh0Mi5maWxsVGV4dCggbWVzc2FnZSwgY2FudmFzMi53aWR0aC8yLCBjYW52YXMyLmhlaWdodC8yKTtcblx0XG5cdC8vIGNhbnZhcyBjb250ZW50cyB3aWxsIGJlIHVzZWQgZm9yIGEgdGV4dHVyZVxuXHRjb25zdCB0ZXh0dXJlID0gbmV3IFRIUkVFLlRleHR1cmUoY2FudmFzMikgO1xuXHR0ZXh0dXJlLm5lZWRzVXBkYXRlID0gdHJ1ZTtcblxuXHRjb25zdCBzcHJpdGVNYXRlcmlhbCA9IG5ldyBUSFJFRS5TcHJpdGVNYXRlcmlhbCh7IG1hcDogdGV4dHVyZSwgdHJhbnNwYXJlbnQ6IHRydWUgfSk7XG5cdGNvbnN0IHNwcml0ZSA9IG5ldyBUSFJFRS5TcHJpdGUoc3ByaXRlTWF0ZXJpYWwpO1xuXG5cdGNvbnN0IG1heFdpZHRoID0gaGVpZ2h0ICogNDtcblxuXHRpZiAoY2FudmFzMi53aWR0aCA+IG1heFdpZHRoKSBzaXplICo9IG1heFdpZHRoL2NhbnZhczIud2lkdGg7XG5cdGNvbnNvbGUubG9nKGNhbnZhczIud2lkdGgsIGNhbnZhczIuaGVpZ2h0KTtcbiAgICBcblx0Ly8gZ2V0IHNpemUgZGF0YSAoaGVpZ2h0IGRlcGVuZHMgb25seSBvbiBmb250IHNpemUpXG5cdHNwcml0ZS5zY2FsZS5zZXQoc2l6ZSAqIGNhbnZhczIud2lkdGgvY2FudmFzMi5oZWlnaHQsIHNpemUsIDEpO1xuXHRyZXR1cm4gc3ByaXRlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG1ha2VUZXh0U3ByaXRlO1xuIiwiLyogZ2xvYmFsIFRIUkVFLCBEZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIgKi9cbid1c2Ugc3RyaWN0JztcbmNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2Zhc3QtZXZlbnQtZW1pdHRlcicpO1xuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxudmFyIGwgPSBuZXcgVEhSRUUuT2JqZWN0TG9hZGVyKCk7XG5jb25zdCBsb2FkU2NlbmUgPSAoaWQpID0+IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcblx0bC5sb2FkKCdtb2RlbHMvJyArIGlkICsgJy5qc29uJywgcmVzb2x2ZSwgdW5kZWZpbmVkLCByZWplY3QpO1xufSk7XG5cbmZ1bmN0aW9uIHBpY2tPYmplY3RzSGVscGVyKHJvb3QsIC4uLm5hbWVzSW4pIHtcblxuXHRjb25zdCBjb2xsZWN0aW9uID0ge307XG5cdGNvbnN0IG5hbWVzID0gbmV3IFNldChuYW1lc0luKTtcblxuXHQoZnVuY3Rpb24gcGlja09iamVjdHMocm9vdCkge1xuXHRcdGlmIChyb290LmNoaWxkcmVuKSB7XG5cdFx0XHRyb290LmNoaWxkcmVuLmZvckVhY2gobm9kZSA9PiB7XG5cdFx0XHRcdGlmIChuYW1lcy5oYXMobm9kZS5uYW1lKSkge1xuXHRcdFx0XHRcdGNvbGxlY3Rpb25bbm9kZS5uYW1lXSA9IG5vZGU7XG5cdFx0XHRcdFx0bmFtZXMuZGVsZXRlKG5vZGUubmFtZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKG5hbWVzLnNpemUpIHtcblx0XHRcdFx0XHRwaWNrT2JqZWN0cyhub2RlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KShyb290KTtcblxuXHRpZiAobmFtZXMuc2l6ZSkge1xuXHRcdGNvbnNvbGUud2FybignTm90IGFsbCBvYmplY3RzIGZvdW5kOiAnICsgbmFtZXMudmFsdWVzKCkubmV4dCgpLnZhbHVlICsgJyBtaXNzaW5nJyk7XG5cdH1cblxuXHRyZXR1cm4gY29sbGVjdGlvbjtcbn1cblxuZnVuY3Rpb24gbXlUaHJlZUZyb21KU09OKGlkLCBvcHRpb25zKSB7XG5cdHJldHVybiBsb2FkU2NlbmUoaWQpLnRoZW4oc2NlbmUgPT4ge1xuXHRcdG9wdGlvbnMuc2NlbmUgPSBzY2VuZTtcblx0XHRyZXR1cm4gbmV3IE15VGhyZWVIZWxwZXIob3B0aW9ucyk7XG5cdH0pO1xufVxuXG4vKipcbiAqIEhlbHBlciBvYmplY3Qgd2l0aCBzb21lIHVzZWZ1bCB0aHJlZSBmdW5jdGlvbnNcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiAgICAgICAgc2NlbmU6IHNjZW5lIHRvIHVzZSBmb3IgZGVmYXVsdFxuICogICAgICAgIHRhcmdldDogd2hlcmUgaW4gdGhlIGRvbSB0byBwdXQgdGhlIHJlbmRlcmVyXG4gKiAgICAgICAgY2FtZXJhOiBuYW1lIG9mIGNhbWVyYSB0byB1c2UgaW4gdGhlIHNjZW5lXG4gKi9cbmZ1bmN0aW9uIE15VGhyZWVIZWxwZXIob3B0aW9ucyl7XG5cblx0RXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cblx0LyoqXG5cdCAqIFNldCB1cCByZW5kZXJpbmdcblx0ICovXG5cblx0b3B0aW9ucy50YXJnZXQgPSBvcHRpb25zLnRhcmdldCB8fCBkb2N1bWVudC5ib2R5O1xuXG5cdHRoaXMuc2NlbmUgPSBvcHRpb25zLnNjZW5lIHx8IG5ldyBUSFJFRS5TY2VuZSgpO1xuXG5cdGxldCBjYW1lcmEgPSBwaWNrT2JqZWN0c0hlbHBlcih0aGlzLnNjZW5lLCBvcHRpb25zLmNhbWVyYSkuQ2FtZXJhO1xuXG5cdGlmICghY2FtZXJhKSB7XG5cdFx0Y29uc29sZS5sb2coY2FtZXJhKTtcblx0XHRjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoIDc1LCBvcHRpb25zLnRhcmdldC5zY3JvbGxXaWR0aCAvIG9wdGlvbnMudGFyZ2V0LnNjcm9sbEhlaWdodCwgMC41LCAxMDAgKTtcblx0XHRjYW1lcmEucG9zaXRpb24uc2V0KDAsIDIsIDApO1xuXHRcdGNhbWVyYS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoMCwgY2FtZXJhLmhlaWdodCwgLTkpKTtcblx0XHRjYW1lcmEucm90YXRpb24ueSArPSBNYXRoLlBJO1xuXHR9XG5cdGNhbWVyYS5oZWlnaHQgPSBjYW1lcmEucG9zaXRpb24ueTsgLy8gcmVmZXJlbmNlIHZhbHVlIGZvciBob3cgaGlnaCB0aGUgY2FtZXJhIHNob3VsZCBiZVxuXHRcdFx0XHRcdFx0XHRcdFx0ICAgLy8gYWJvdmUgdGhlIGdyb3VuZCB0byBtYWludGFpbiB0aGUgaWxsdXNpb24gb2YgcHJlc2VuY2Vcblx0Y2FtZXJhLmZvdiA9IDc1O1xuXG5cdHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXHRjb25zdCByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKCB7IGFudGlhbGlhczogZmFsc2UgfSApO1xuXHRyZW5kZXJlci5zZXRQaXhlbFJhdGlvKCB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyApO1xuXHRcblx0dGhpcy5yZW5kZXJNZXRob2QgPSByZW5kZXJlcjtcblx0XG5cdGNvbnN0IHNldEFzcGVjdCA9ICgpID0+IHtcblx0XHR0aGlzLnJlbmRlck1ldGhvZC5zZXRTaXplKCBvcHRpb25zLnRhcmdldC5zY3JvbGxXaWR0aCwgb3B0aW9ucy50YXJnZXQuc2Nyb2xsSGVpZ2h0ICk7XG5cdFx0Y2FtZXJhLmFzcGVjdCA9IG9wdGlvbnMudGFyZ2V0LnNjcm9sbFdpZHRoIC8gb3B0aW9ucy50YXJnZXQuc2Nyb2xsSGVpZ2h0O1xuXHRcdGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG5cdH07XG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCBzZXRBc3BlY3QpO1xuXHRzZXRBc3BlY3QoKTtcblxuXHRvcHRpb25zLnRhcmdldC5hcHBlbmRDaGlsZChyZW5kZXJlci5kb21FbGVtZW50KTtcblx0dGhpcy5kb21FbGVtZW50ID0gcmVuZGVyZXIuZG9tRWxlbWVudDtcblxuXHQvLyBUaGlzIGlzIGNhbGxlZCB0byByZXF1ZXN0IGEgcmVuZGVyXG5cdHRoaXMucmVuZGVyID0gKCkgPT4ge1xuXG5cdFx0Ly8gbm90ZTogdGhyZWUuanMgaW5jbHVkZXMgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHNoaW1cblx0XHR0aGlzLmVtaXQoJ3ByZXJlbmRlcicpO1xuXHRcdHRoaXMucmVuZGVyTWV0aG9kLnJlbmRlcih0aGlzLnNjZW5lLCBjYW1lcmEpO1xuXHR9O1xuXG5cdC8vIENoYW5nZSByZW5kZXIgbWV0aG9kIHRvIHRoZSBzdGVyZW8gcmVuZGVyZXIgKG9uZSBmb3IgZWFjaCBleWUpXG5cdHRoaXMudXNlQ2FyZGJvYXJkID0gKCkgPT4ge1xuXG5cdFx0Y29uc3QgZWZmZWN0ID0gbmV3IFRIUkVFLlN0ZXJlb0VmZmVjdChyZW5kZXJlcik7XG5cdFx0c2V0QXNwZWN0KCk7XG5cdFx0ZWZmZWN0LmV5ZVNlcGFyYXRpb24gPSAwLjAwODtcblx0XHRlZmZlY3QuZm9jYWxMZW5ndGggPSAwLjI1O1xuXHRcdGVmZmVjdC5zZXRTaXplKCB3aW5kb3cuaW5uZXJXaWR0aCwgd2luZG93LmlubmVySGVpZ2h0ICk7XG5cdFx0dGhpcy5yZW5kZXJNZXRob2QgPSBlZmZlY3Q7XG5cdH07XG5cblxuXHQvKipcblx0ICogQWRkIGEgaGVhZHMgdXAgZGlzcGxheSBvYmplY3QgdG8gdGhlIGNhbWVyYVxuXHQgKi9cblxuXHRjb25zdCBodWQgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblx0aHVkLnBvc2l0aW9uLnNldCgwLCAwLCAtMi4xKTtcblx0aHVkLnNjYWxlLnNldCgwLjIsIDAuMiwgMC4yKTtcblx0Y2FtZXJhLmFkZChodWQpO1xuXHR0aGlzLnNjZW5lLmFkZCh0aGlzLmNhbWVyYSk7XG5cdHRoaXMuaHVkID0gaHVkO1xuXG5cdC8qKlxuXHQgKiBBIG1hcCBvZiBwaHlzaWNzIG9iamVjdCBpZCB0byB0aHJlZS5qcyBvYmplY3QgM2Qgc28gd2UgY2FuIHVwZGF0ZSBhbGwgdGhlIHBvc2l0aW9uc1xuXHQgKi9cblxuXHRjb25zdCB0aHJlZU9iamVjdHNDb25uZWN0ZWRUb1BoeXNpY3MgPSB7fTtcblx0dGhpcy51cGRhdGVPYmplY3RzID0gcGh5c2ljc09iamVjdHMgPT4ge1xuXHRcdGNvbnN0IGwgPSBwaHlzaWNzT2JqZWN0cy5sZW5ndGg7XG5cblx0XHQvLyBpdGVyYXRlIG92ZXIgdGhlIHBoeXNpY3MgcGh5c2ljc09iamVjdHNcblx0XHRmb3IgKCBsZXQgaj0wOyBqPGw7aisrICkge1xuXG5cdFx0XHRjb25zdCBpID0gcGh5c2ljc09iamVjdHNbal07XG5cdFx0XHRpZiAodGhyZWVPYmplY3RzQ29ubmVjdGVkVG9QaHlzaWNzW2kuaWRdKSB7XG5cblx0XHRcdFx0Y29uc3QgbyA9IHRocmVlT2JqZWN0c0Nvbm5lY3RlZFRvUGh5c2ljc1tpLmlkXTtcblxuXHRcdFx0XHQvLyBTdXBwb3J0IG1hbmlwbGF0aW5nIGEgc2luZ2xlIHZlcnRleFxuXHRcdFx0XHRpZiAoby5jb25zdHJ1Y3RvciA9PT0gVEhSRUUuVmVjdG9yMykge1xuXHRcdFx0XHRcdG8uc2V0KGkucG9zaXRpb24ueCwgaS5wb3NpdGlvbi55LCBpLnBvc2l0aW9uLnopO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0by5wb3NpdGlvbi5zZXQoaS5wb3NpdGlvbi54LCBpLnBvc2l0aW9uLnksIGkucG9zaXRpb24ueik7XG5cblx0XHRcdFx0Ly8gUm90YXRpb25cblx0XHRcdFx0aWYgKGkucXVhdGVybmlvbikge1xuXHRcdFx0XHRcdG8ucm90YXRpb24uc2V0RnJvbVF1YXRlcm5pb24obmV3IFRIUkVFLlF1YXRlcm5pb24oaS5xdWF0ZXJuaW9uLngsIGkucXVhdGVybmlvbi55LCBpLnF1YXRlcm5pb24ueiwgaS5xdWF0ZXJuaW9uLncpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmNvbm5lY3RQaHlzaWNzVG9UaHJlZSA9IChtZXNoLCBwaHlzaWNzTWVzaCkgPT4ge1xuXHRcdHRocmVlT2JqZWN0c0Nvbm5lY3RlZFRvUGh5c2ljc1twaHlzaWNzTWVzaC5pZF0gPSBtZXNoO1xuXHRcdGlmIChtZXNoLmNvbnN0cnVjdG9yID09PSBUSFJFRS5WZWN0b3IzKSByZXR1cm47XG5cdFx0dGhpcy5zY2VuZS5hZGQobWVzaCk7XG5cdH07XG5cblx0LyoqXG5cdCAqIFR1cm4gb24gaGVhZCB0cmFja2luZyBpZiBtYW51YWwgY29udHJvbCBpcyBkaXNhYmxlZCBpdCB3b24ndCBzdGVhbCBtb3VzZS90b3VjaCBldmVudHNcblx0ICovXG5cdHRoaXMuZGV2aWNlT3JpZW50YXRpb24gPSAoe21hbnVhbENvbnRyb2x9KSA9PiB7XG5cblx0XHQvLyBwcm92aWRlIGR1bW15IGVsZW1lbnQgdG8gcHJldmVudCB0b3VjaC9jbGljayBoaWphY2tpbmcuXG5cdFx0Y29uc3QgZWxlbWVudCA9IG1hbnVhbENvbnRyb2wgPyByZW5kZXJlci5kb21FbGVtZW50IDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkRJVlwiKTtcblxuXHRcdGlmICh0aGlzLmRldmljZU9yaWVudGF0aW9uQ29udHJvbGxlcikge1xuXHRcdFx0dGhpcy5kZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIuZGlzY29ubmVjdCgpO1xuXHRcdFx0dGhpcy5kZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIuZWxlbWVudCA9IGVsZW1lbnQ7XG5cdFx0XHR0aGlzLmRldmljZU9yaWVudGF0aW9uQ29udHJvbGxlci5jb25uZWN0KCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZGV2aWNlT3JpZW50YXRpb25Db250cm9sbGVyID0gbmV3IERldmljZU9yaWVudGF0aW9uQ29udHJvbGxlcih0aGlzLmNhbWVyYSwgZWxlbWVudCk7XG5cdFx0XHR0aGlzLmRldmljZU9yaWVudGF0aW9uQ29udHJvbGxlci5jb25uZWN0KCk7XG5cdFx0XHR0aGlzLm9uKCdwcmVyZW5kZXInLCAoKSA9PiB0aGlzLmRldmljZU9yaWVudGF0aW9uQ29udHJvbGxlci51cGRhdGUoKSk7XG5cdFx0fVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBNYWtlIHRoZSBvYmplY3QgcGlja2VyIGF2YWlsYWJsZSBvbiB0aGlzIG9iamVjdFxuXHQgKi9cblx0dGhpcy5waWNrT2JqZWN0c0hlbHBlciA9IHBpY2tPYmplY3RzSGVscGVyO1xufVxudXRpbC5pbmhlcml0cyhNeVRocmVlSGVscGVyLCBFdmVudEVtaXR0ZXIpO1xuXG5tb2R1bGUuZXhwb3J0cy5NeVRocmVlSGVscGVyID0gTXlUaHJlZUhlbHBlcjtcbm1vZHVsZS5leHBvcnRzLm15VGhyZWVGcm9tSlNPTiA9IG15VGhyZWVGcm9tSlNPTjtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgbXlXb3JrZXIgPSBuZXcgV29ya2VyKFwiLi9zY3JpcHRzL3ZlcmxldHdvcmtlci5qc1wiKTtcbmNvbnN0IG1lc3NhZ2VRdWV1ZSA9IFtdO1xuXG5mdW5jdGlvbiB3b3JrZXJNZXNzYWdlKG1lc3NhZ2UpIHtcblxuXHRjb25zdCBpZCA9IERhdGUubm93KCkgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwKTtcblxuXHQvLyBUaGlzIHdyYXBzIHRoZSBtZXNzYWdlIHBvc3RpbmcvcmVzcG9uc2UgaW4gYSBwcm9taXNlLCB3aGljaCB3aWxsIHJlc29sdmUgaWYgdGhlIHJlc3BvbnNlIGRvZXNuJ3Rcblx0Ly8gY29udGFpbiBhbiBlcnJvciwgYW5kIHJlamVjdCB3aXRoIHRoZSBlcnJvciBpZiBpdCBkb2VzLiBJZiB5b3UnZCBwcmVmZXIsIGl0J3MgcG9zc2libGUgdG8gY2FsbFxuXHQvLyBjb250cm9sbGVyLnBvc3RNZXNzYWdlKCkgYW5kIHNldCB1cCB0aGUgb25tZXNzYWdlIGhhbmRsZXIgaW5kZXBlbmRlbnRseSBvZiBhIHByb21pc2UsIGJ1dCB0aGlzIGlzXG5cdC8vIGEgY29udmVuaWVudCB3cmFwcGVyLlxuXHRyZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gd29ya2VyTWVzc2FnZVByb21pc2UocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0Y29uc3QgZGF0YSA9IHtcblx0XHRcdGlkLFxuXHRcdFx0bWVzc2FnZSxcblx0XHRcdHJlc29sdmUsXG5cdFx0XHRyZWplY3Rcblx0XHR9O1xuXHRcdG1lc3NhZ2VRdWV1ZS5wdXNoKGRhdGEpO1xuXHR9KTtcbn1cblxuLy8gUHJvY2VzcyBtZXNzYWdlcyBvbmNlIHBlciBmcmFtZVx0XG5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gcHJvY2VzcygpIHtcblx0aWYgKG1lc3NhZ2VRdWV1ZS5sZW5ndGgpIHtcblxuXHRcdGNvbnN0IGV4dHJhY3RlZE1lc3NhZ2VzID0gbWVzc2FnZVF1ZXVlLnNwbGljZSgwKTtcblxuXHRcdGNvbnN0IG1lc3NhZ2VUb1NlbmQgPSBKU09OLnN0cmluZ2lmeShleHRyYWN0ZWRNZXNzYWdlcy5tYXAoaSA9PiAoXG5cdFx0XHR7IG1lc3NhZ2U6IGkubWVzc2FnZSwgaWQ6IGkuaWQgfVxuXHRcdCkpKTtcblxuXHRcdGNvbnN0IG1lc3NhZ2VDaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG5cdFx0bWVzc2FnZUNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZnVuY3Rpb24gcmVzb2x2ZU1lc3NhZ2VQcm9taXNlKGV2ZW50KSB7XG5cdFx0XHRtZXNzYWdlQ2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSB1bmRlZmluZWQ7XG5cblx0XHRcdC8vIEl0ZXJhdGUgb3ZlciB0aGUgcmVzcG9uc2VzIGFuZCByZXNvbHZlL3JlamVjdCBhY2NvcmRpbmdseVxuXHRcdFx0Y29uc3QgcmVzcG9uc2UgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuXHRcdFx0cmVzcG9uc2UuZm9yRWFjaCgoZCwgaSkgPT4ge1xuXHRcdFx0XHRpZiAoZXh0cmFjdGVkTWVzc2FnZXNbaV0uaWQgIT09IGQuaWQpIHtcblx0XHRcdFx0XHR0aHJvdyBFcnJvcignSUQgTWlzbWF0Y2ghISEnKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoIWQuZXJyb3IpIHtcblx0XHRcdFx0XHRleHRyYWN0ZWRNZXNzYWdlc1tpXS5yZXNvbHZlKGQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGV4dHJhY3RlZE1lc3NhZ2VzW2ldLnJlamVjdChkLmVycm9yKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fTtcblx0XHRteVdvcmtlci5wb3N0TWVzc2FnZShtZXNzYWdlVG9TZW5kLCBbbWVzc2FnZUNoYW5uZWwucG9ydDJdKTtcblx0fVxuXHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUocHJvY2Vzcyk7XG59KTtcblxuY2xhc3MgVmVybGV0IHtcblx0aW5pdChvcHRpb25zKSB7XG5cdFx0cmV0dXJuIHdvcmtlck1lc3NhZ2Uoe2FjdGlvbjogJ2luaXQnLCBvcHRpb25zfSk7XG5cdH1cblxuXHRnZXRQb2ludHMoKSB7XG5cdFx0cmV0dXJuIHdvcmtlck1lc3NhZ2Uoe2FjdGlvbjogJ2dldFBvaW50cyd9KVxuXHRcdFx0LnRoZW4oZSA9PiBlLnBvaW50cyk7XG5cdH1cblxuXHRhZGRQb2ludChwb2ludE9wdGlvbnMpIHtcblx0XHRyZXR1cm4gd29ya2VyTWVzc2FnZSh7YWN0aW9uOiAnYWRkUG9pbnQnLCBwb2ludE9wdGlvbnN9KTtcblx0fVxuXG5cdHVwZGF0ZVBvaW50KHBvaW50T3B0aW9ucykge1xuXHRcdHJldHVybiB3b3JrZXJNZXNzYWdlKHthY3Rpb246ICd1cGRhdGVQb2ludCcsIHBvaW50T3B0aW9uc30pO1xuXHR9XG5cblx0Y29ubmVjdFBvaW50cyhwMSwgcDIsIGNvbnN0cmFpbnRPcHRpb25zKSB7XG5cdFx0cmV0dXJuIHdvcmtlck1lc3NhZ2Uoe2FjdGlvbjogJ2Nvbm5lY3RQb2ludHMnLCBvcHRpb25zOiB7cDEsIHAyLCBjb25zdHJhaW50T3B0aW9uc319KTtcblx0fVxuXG5cdHVwZGF0ZUNvbnN0cmFpbnQob3B0aW9ucykge1xuXHRcdHJldHVybiB3b3JrZXJNZXNzYWdlKHthY3Rpb246ICd1cGRhdGVDb25zdHJhaW50Jywgb3B0aW9ucyB9KTtcblx0fVxuXG5cdHJlc2V0KCkge1xuXHRcdHJldHVybiB3b3JrZXJNZXNzYWdlKHthY3Rpb246ICdyZXNldCd9KTtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZlcmxldDtcbiIsIi8qZ2xvYmFsIFRIUkVFKi9cbid1c2Ugc3RyaWN0JztcbmNvbnN0IGFkZFNjcmlwdCA9IHJlcXVpcmUoJy4vbGliL2xvYWRTY3JpcHQnKTsgLy8gUHJvbWlzZSB3cmFwcGVyIGZvciBzY3JpcHQgbG9hZGluZ1xuY29uc3QgVmVybGV0V3JhcHBlciA9IHJlcXVpcmUoJy4vbGliL3ZlcmxldHdyYXBwZXInKTsgLy8gV3JhcHBlciBvZiB0aGUgdmVybGV0IHdvcmtlclxuY29uc3QgdGV4dFNwcml0ZSA9IHJlcXVpcmUoJy4vbGliL3RleHRTcHJpdGUnKTsgLy8gR2VuZXJhbGx5IHNwcml0ZXMgZnJvbSBjYW52YXNcbmNvbnN0IENhbWVyYUludGVyYWN0aW9ucyA9IHJlcXVpcmUoJy4vbGliL2NhbWVyYWludGVyYWN0aW9ucycpOyAvLyBUb29sIGZvciBtYWtpbmcgaW50ZXJhY3RpdmUgVlIgZWxlbWVudHNcbmNvbnN0IFRXRUVOID0gcmVxdWlyZSgndHdlZW4uanMnKTtcblxuLy8gbm8gaHN0cyBzbyBqdXN0IHJlZGlyZWN0IHRvIGh0dHBzXG5pZiAod2luZG93LmxvY2F0aW9uLnByb3RvY29sICE9PSBcImh0dHBzOlwiICYmIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSAhPT0gJ2xvY2FsaG9zdCcpIHtcbiAgIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9IFwiaHR0cHM6XCI7XG59XG5cbmZ1bmN0aW9uIHNlcnZpY2VXb3JrZXIoKSB7XG5cblx0cmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG5cblx0XHQvLyBTdGFydCBzZXJ2aWNlIHdvcmtlclxuXHRcdGlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XG5cblx0XHRcdGlmIChuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5jb250cm9sbGVyKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdPZmZsaW5pbmcgQXZhaWxibGUnKTtcblx0XHRcdFx0cmVzb2x2ZSgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy4vc3cuanMnKVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihyZWcpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnc3cgcmVnaXN0ZXJlZCcsIHJlZyk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC50aGVuKHJlc29sdmUpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdObyBTZXJ2aWNlIFdvcmtlciwgYXNzZXRzIG1heSBub3QgYmUgY2FjaGVkJyk7XG5cdFx0XHRyZXNvbHZlKCk7XG5cdFx0fVxuXHR9KTtcbn1cblxuc2VydmljZVdvcmtlcigpXG4udGhlbigoKSA9PiBQcm9taXNlLmFsbChbXG5cdGFkZFNjcmlwdCgnaHR0cHM6Ly9wb2x5ZmlsbC53ZWJzZXJ2aWNlcy5mdC5jb20vdjEvcG9seWZpbGwubWluLmpzP2ZlYXR1cmVzPWZldGNoLGRlZmF1bHQnKSxcblx0YWRkU2NyaXB0KCdodHRwczovL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy90aHJlZS5qcy9yNzMvdGhyZWUubWluLmpzJylcbl0pKVxuLnRoZW4oKCkgPT4gUHJvbWlzZS5hbGwoW1xuXHRhZGRTY3JpcHQoJ2h0dHBzOi8vY2RuLnJhd2dpdC5jb20vbXJkb29iL3RocmVlLmpzL21hc3Rlci9leGFtcGxlcy9qcy9lZmZlY3RzL1N0ZXJlb0VmZmVjdC5qcycpLFxuXHRhZGRTY3JpcHQoJ2h0dHBzOi8vY2RuLnJhd2dpdC5jb20vbXJkb29iL3RocmVlLmpzL21hc3Rlci9leGFtcGxlcy9qcy9Ta3lTaGFkZXIuanMnKSxcblx0YWRkU2NyaXB0KCdodHRwczovL2Nkbi5yYXdnaXQuY29tL3JpY2h0ci90aHJlZVZSL21hc3Rlci9qcy9EZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIuanMnKVxuXSkpXG4udGhlbigoKSA9PiByZXF1aXJlKCcuL2xpYi90aHJlZUhlbHBlcicpXG5cdC5teVRocmVlRnJvbUpTT04oJ0tpdGNoZW4vbGlja3RoZXdoaXNrJyxcblx0XHR7XG5cdFx0XHRjYW1lcmE6ICdDYW1lcmEnLFxuXHRcdFx0dGFyZ2V0OiBkb2N1bWVudC5ib2R5XG5cdFx0fVxuXHQpXG4pXG4udGhlbih0aHJlZUhlbHBlciA9PiB7XG5cdGNvbnNvbGUubG9nKCdSZWFkeScpO1xuXG5cdGNvbnN0IHRleHR1cmVMb2FkZXIgPSBuZXcgVEhSRUUuVGV4dHVyZUxvYWRlcigpO1xuXHRjb25zdCBjdWJlVGV4dHVyZUxvYWRlciA9IG5ldyBUSFJFRS5DdWJlVGV4dHVyZUxvYWRlcigpO1xuXHRjb25zdCB0b1RleHR1cmUgPSB0aHJlZUhlbHBlci5waWNrT2JqZWN0c0hlbHBlcih0aHJlZUhlbHBlci5zY2VuZSwgJ1Jvb20nLCAnQ291bnRlcicsICdDYWtlJyk7XG5cdGNvbnN0IHRvU2hpbnkgPSB0aHJlZUhlbHBlci5waWNrT2JqZWN0c0hlbHBlcih0aHJlZUhlbHBlci5zY2VuZSwgJ0xpY2tUaGVXaGlzaycsICdXaGlzaycsICdTYXVjZVBhbicsICdTYXVjZVBhbi4wMDEnLCAnU2F1Y2VQYW4uMDAyJywgJ1NhdWNlUGFuLjAwMycsICdGcmlkZ2UnKTtcblx0T2JqZWN0LmtleXModG9UZXh0dXJlKS5mb3JFYWNoKG5hbWUgPT4ge1xuXHRcdHRleHR1cmVMb2FkZXIubG9hZChgbW9kZWxzL0tpdGNoZW4vJHtuYW1lfUJha2UucG5nYCwgbWFwID0+IHRvVGV4dHVyZVtuYW1lXS5tYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoQmFzaWNNYXRlcmlhbCh7bWFwfSkpO1xuXHR9KTtcblxuXHRjb25zdCBwYXRoID0gXCJtb2RlbHMvS2l0Y2hlbi9lbnZtYXAvXCI7XG5cdGNvbnN0IGZvcm1hdCA9ICcucG5nJztcblx0Y29uc3QgdXJscyA9IFtcblx0XHRwYXRoICsgJzAwMDQnICsgZm9ybWF0LCAvLyAreFxuXHRcdHBhdGggKyAnMDAwMicgKyBmb3JtYXQsIC8vIC14XG5cdFx0cGF0aCArICcwMDA2JyArIGZvcm1hdCwgLy8gK3lcblx0XHRwYXRoICsgJzAwMDUnICsgZm9ybWF0LCAvLyAteVxuXHRcdHBhdGggKyAnMDAwMScgKyBmb3JtYXQsIC8vICt6XG5cdFx0cGF0aCArICcwMDAzJyArIGZvcm1hdCAgLy8gLXpcblx0XTtcblx0Y3ViZVRleHR1cmVMb2FkZXIubG9hZCh1cmxzLCBlbnZNYXAgPT4ge1xuXHRcdGNvbnN0IGNvcHBlciA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCggeyBjb2xvcjogMHg5OWZmOTksIHNwZWN1bGFyOiAweDc3MjIyMiwgZW52TWFwLCBjb21iaW5lOiBUSFJFRS5NaXhPcGVyYXRpb24sIHJlZmxlY3Rpdml0eTogMC4zLCBtZXRhbDogdHJ1ZX0gKTtcblx0XHRjb25zdCBhbHVtaW5pdW0gPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoIHsgY29sb3I6IDB4ODg4ODg4LCBzcGVjdWxhcjogMHg5OTk5OTksIGVudk1hcCwgY29tYmluZTogVEhSRUUuTWl4T3BlcmF0aW9uLCByZWZsZWN0aXZpdHk6IDAuMywgbWV0YWw6IHRydWV9ICk7XG5cdFx0Y29uc3QgY2hvY29sYXRlID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKCB7IGNvbG9yOiB0b1NoaW55LkxpY2tUaGVXaGlzay5tYXRlcmlhbC5jb2xvciwgc3BlY3VsYXI6IDB4OTk5OTk5LCBlbnZNYXAsIGNvbWJpbmU6IFRIUkVFLk1peE9wZXJhdGlvbiwgcmVmbGVjdGl2aXR5OiAwLjMsIG1ldGFsOiB0cnVlfSApO1xuXG5cdFx0dG9TaGlueVsnU2F1Y2VQYW4nXS5tYXRlcmlhbCA9IGNvcHBlcjtcblx0XHR0b1NoaW55WydTYXVjZVBhbi4wMDEnXS5tYXRlcmlhbCA9IGNvcHBlcjtcblx0XHR0b1NoaW55WydTYXVjZVBhbi4wMDInXS5tYXRlcmlhbCA9IGNvcHBlcjtcblx0XHR0b1NoaW55WydTYXVjZVBhbi4wMDMnXS5tYXRlcmlhbCA9IGNvcHBlcjtcblx0XHR0b1NoaW55LldoaXNrLm1hdGVyaWFsID0gYWx1bWluaXVtO1xuXHRcdHRvU2hpbnkuTGlja1RoZVdoaXNrLm1hdGVyaWFsID0gY2hvY29sYXRlO1xuXG5cdFx0dGV4dHVyZUxvYWRlci5sb2FkKGBtb2RlbHMvS2l0Y2hlbi9GcmlkZ2VCYWtlLnBuZ2AsIG1hcCA9PiB0b1NoaW55LkZyaWRnZS5tYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7bWFwLCBlbnZNYXAsIGNvbWJpbmU6IFRIUkVFLk1peE9wZXJhdGlvbiwgc3BlY3VsYXI6IDB4OTk5OTk5LCByZWZsZWN0aXZpdHk6IDAuMywgbWV0YWw6IHRydWUsIHNpZGU6IFRIUkVFLkRvdWJsZVNpZGUgfSkpO1xuXG5cdH0pO1xuXG5cdGNvbnN0IGdvVGFyZ2V0V29ybGQgPSBuZXcgQ2FtZXJhSW50ZXJhY3Rpb25zKHRocmVlSGVscGVyLmRvbUVsZW1lbnQpO1xuXG5cdC8vIEFkZCBhIHByZXR0eSBza3lib3hcblx0Y29uc3Qgc2t5Qm94ID0gcmVxdWlyZSgnLi9saWIvc2t5JykoKTtcblx0c2t5Qm94LnNjYWxlLm11bHRpcGx5U2NhbGFyKDAuMDAwMik7XG5cdHRocmVlSGVscGVyLnNjZW5lLmFkZChza3lCb3gpO1xuXG5cdHRocmVlSGVscGVyLnVzZUNhcmRib2FyZCgpO1xuXG5cdHRocmVlSGVscGVyLmRldmljZU9yaWVudGF0aW9uKHttYW51YWxDb250cm9sOiB0cnVlfSk7IC8vIEFsbG93IGNsaWNraW5nIGFuZCBkcmFnZ2luZyB0byBtb3ZlIHRoZSBjYW1lcmEgd2hpbHN0IHRlc3RpbmdcblxuXHR0aHJlZUhlbHBlci5kZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXJcblx0LmFkZEV2ZW50TGlzdGVuZXIoJ3VzZXJpbnRlcmFjdGlvbmVuZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRnb1RhcmdldFdvcmxkLmludGVyYWN0KHt0eXBlOiAnY2xpY2snfSk7XG5cdH0pOyAvLyBBbGxvdyBpdCBzdGlsbCBiZSBpbnRlcmFjdGVkIHdpdGggd2hlbiBjbGlja3MgYXJlIGhpamFja2VkXG5cblx0Ly8gQnJhbmQgbGlnaHRzXG5cdGNvbnN0IGFtYmllbnRMaWdodCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoIDB4ZGRlZGZmICk7XG5cdHRocmVlSGVscGVyLnNjZW5lLmFkZCggYW1iaWVudExpZ2h0ICk7XG5cblx0Ly8gUnVuIHRoZSB2ZXJsZXQgcGh5c2ljc1xuXHRjb25zdCB2ZXJsZXQgPSBuZXcgVmVybGV0V3JhcHBlcigpO1xuXHR2ZXJsZXQuaW5pdCh7XG5cdFx0c2l6ZToge1xuXHRcdFx0eDogMjAsXG5cdFx0XHR5OiAyMCxcblx0XHRcdHo6IDIwLFxuXHRcdH0sXG5cdFx0Z3Jhdml0eTogdHJ1ZVxuXHR9KVxuXHQudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XG5cdFx0bGV0IHdhaXRpbmdGb3JQb2ludHMgPSBmYWxzZTtcblx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gYW5pbWF0ZSh0aW1lKSB7XG5cdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoYW5pbWF0ZSk7XG5cdFx0XHRnb1RhcmdldFdvcmxkLmRldGVjdEludGVyYWN0aW9ucyh0aHJlZUhlbHBlci5jYW1lcmEpO1xuXG5cdFx0XHRpZiAoIXdhaXRpbmdGb3JQb2ludHMpIHtcblx0XHRcdFx0dmVybGV0LmdldFBvaW50cygpLnRoZW4ocG9pbnRzID0+IHtcblx0XHRcdFx0XHR0aHJlZUhlbHBlci51cGRhdGVPYmplY3RzKHBvaW50cyk7XG5cdFx0XHRcdFx0d2FpdGluZ0ZvclBvaW50cyA9IGZhbHNlO1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0d2FpdGluZ0ZvclBvaW50cyA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHR0aHJlZUhlbHBlci5yZW5kZXIoKTtcblx0XHRcdFRXRUVOLnVwZGF0ZSh0aW1lKTtcblx0XHR9KTtcblxuXHRcdGNvbnN0IG1hcCA9IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoIFwiaW1hZ2VzL3JldGljdWxlLnBuZ1wiICk7XG5cdFx0Y29uc3QgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuU3ByaXRlTWF0ZXJpYWwoIHsgbWFwOiBtYXAsIGNvbG9yOiAweGZmZmZmZiwgZm9nOiBmYWxzZSwgdHJhbnNwYXJlbnQ6IHRydWUgfSApO1xuXHRcdGNvbnN0IHNwcml0ZSA9IG5ldyBUSFJFRS5TcHJpdGUobWF0ZXJpYWwpO1xuXHRcdHRocmVlSGVscGVyLmh1ZC5hZGQoc3ByaXRlKTtcblxuXHRcdGZ1bmN0aW9uIGFkZEJ1dHRvbihzdHIpIHtcblx0XHRcdGNvbnN0IHNwcml0ZSA9IHRleHRTcHJpdGUoc3RyLCB7XG5cdFx0XHRcdGZvbnRzaXplOiAxOCxcblx0XHRcdFx0Zm9udGZhY2U6ICdJY2VsYW5kJyxcblx0XHRcdFx0Ym9yZGVyVGhpY2tuZXNzOiAyMFxuXHRcdFx0fSk7XG5cdFx0XHR0aHJlZUhlbHBlci5zY2VuZS5hZGQoc3ByaXRlKTtcblx0XHRcdHNwcml0ZS5wb3NpdGlvbi5zZXQoNSw1LDUpO1xuXHRcdFx0c3ByaXRlLm1hdGVyaWFsLnRyYW5zcGFyZW50ID0gdHJ1ZTtcblx0XHRcdHJldHVybiBnb1RhcmdldFdvcmxkLm1ha2VUYXJnZXQoc3ByaXRlKTtcblx0XHR9XG5cblx0XHR3aW5kb3cudGhyZWVIZWxwZXIgPSB0aHJlZUhlbHBlcjtcblx0fSk7XG59KTtcbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ3Rvci5wcm90b3R5cGUsIHtcbiAgICAgIGNvbnN0cnVjdG9yOiB7XG4gICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xufSBlbHNlIHtcbiAgLy8gb2xkIHNjaG9vbCBzaGltIGZvciBvbGQgYnJvd3NlcnNcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgVGVtcEN0b3IucHJvdG90eXBlID0gc3VwZXJDdG9yLnByb3RvdHlwZVxuICAgIGN0b3IucHJvdG90eXBlID0gbmV3IFRlbXBDdG9yKClcbiAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgfVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcHJvdG9jbGFzcyA9IHJlcXVpcmUoXCJwcm90b2NsYXNzXCIpO1xuXG4vKipcbiAqIEBtb2R1bGUgbW9qb1xuICogQHN1Ym1vZHVsZSBtb2pvLWNvcmVcbiAqL1xuXG4vKipcbiAqIEBjbGFzcyBFdmVudEVtaXR0ZXJcbiAqL1xuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIgKCkge1xuICB0aGlzLl9fZXZlbnRzID0ge307XG59XG5cbi8qKlxuICogYWRkcyBhIGxpc3RlbmVyIG9uIHRoZSBldmVudCBlbWl0dGVyXG4gKlxuICogQG1ldGhvZCBvblxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50IHRvIGxpc3RlbiBvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgdG8gY2FsbGJhY2sgd2hlbiBgZXZlbnRgIGlzIGVtaXR0ZWQuXG4gKiBAcmV0dXJucyB7RGlzcG9zYWJsZX1cbiAqL1xuXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG5cbiAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwibGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uIGZvciBldmVudCAnXCIrZXZlbnQrXCInXCIpO1xuICB9XG5cbiAgdmFyIGxpc3RlbmVycztcbiAgaWYgKCEobGlzdGVuZXJzID0gdGhpcy5fX2V2ZW50c1tldmVudF0pKSB7XG4gICAgdGhpcy5fX2V2ZW50c1tldmVudF0gPSBsaXN0ZW5lcjtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aGlzLl9fZXZlbnRzW2V2ZW50XSA9IFtsaXN0ZW5lcnMsIGxpc3RlbmVyXTtcbiAgfSBlbHNlIHtcbiAgICBsaXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgcmV0dXJuIHtcbiAgICBkaXNwb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYub2ZmKGV2ZW50LCBsaXN0ZW5lcik7XG4gICAgfVxuICB9O1xufTtcblxuLyoqXG4gKiByZW1vdmVzIGFuIGV2ZW50IGVtaXR0ZXJcbiAqIEBtZXRob2Qgb2ZmXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgdG8gcmVtb3ZlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciB0byByZW1vdmVcbiAqL1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIChldmVudCwgbGlzdGVuZXIpIHtcblxuICB2YXIgbGlzdGVuZXJzO1xuXG4gIGlmKCEobGlzdGVuZXJzID0gdGhpcy5fX2V2ZW50c1tldmVudF0pKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRoaXMuX19ldmVudHNbZXZlbnRdID0gdW5kZWZpbmVkO1xuICB9IGVsc2Uge1xuICAgIHZhciBpID0gbGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmICh+aSkgbGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICBpZiAoIWxpc3RlbmVycy5sZW5ndGgpIHtcbiAgICAgIHRoaXMuX19ldmVudHNbZXZlbnRdID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBhZGRzIGEgbGlzdGVuZXIgb24gdGhlIGV2ZW50IGVtaXR0ZXJcbiAqIEBtZXRob2Qgb25jZVxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50IHRvIGxpc3RlbiBvblxuICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgdG8gY2FsbGJhY2sgd2hlbiBgZXZlbnRgIGlzIGVtaXR0ZWQuXG4gKiBAcmV0dXJucyB7RGlzcG9zYWJsZX1cbiAqL1xuXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uIChldmVudCwgbGlzdGVuZXIpIHtcblxuICBpZiAodHlwZW9mIGxpc3RlbmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24gZm9yIGV2ZW50ICdcIitldmVudCtcIidcIik7XG4gIH1cblxuICBmdW5jdGlvbiBsaXN0ZW5lcjIgKCkge1xuICAgIGRpc3AuZGlzcG9zZSgpO1xuICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICB2YXIgZGlzcCA9IHRoaXMub24oZXZlbnQsIGxpc3RlbmVyMik7XG4gIGRpc3AudGFyZ2V0ID0gdGhpcztcbiAgcmV0dXJuIGRpc3A7XG59O1xuXG4vKipcbiAqIGVtaXRzIGFuIGV2ZW50XG4gKiBAbWV0aG9kIGVtaXRcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtTdHJpbmd9LCBgZGF0YS4uLmAgZGF0YSB0byBlbWl0XG4gKi9cblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcblxuICBpZiAodGhpcy5fX2V2ZW50c1tldmVudF0gPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9fZXZlbnRzW2V2ZW50XSxcbiAgbiA9IGFyZ3VtZW50cy5sZW5ndGgsXG4gIGFyZ3MsXG4gIGksXG4gIGo7XG5cbiAgaWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIGlmIChuID09PSAxKSB7XG4gICAgICBsaXN0ZW5lcnMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoKG4pIHtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIGxpc3RlbmVycyhhcmd1bWVudHNbMV0pO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgbGlzdGVuZXJzKGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIGxpc3RlbmVycyhhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSwgYXJndW1lbnRzWzNdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBhcmdzID0gbmV3IEFycmF5KG4gLSAxKTtcbiAgICAgICAgICBmb3IoaSA9IDE7IGkgPCBuOyBpKyspIGFyZ3NbaS0xXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICBsaXN0ZW5lcnMuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9XG4gIH0gZWxzZSB7XG4gICAgYXJncyA9IG5ldyBBcnJheShuIC0gMSk7XG4gICAgZm9yKGkgPSAxOyBpIDwgbjsgaSsrKSBhcmdzW2ktMV0gPSBhcmd1bWVudHNbaV07XG4gICAgZm9yKGogPSBsaXN0ZW5lcnMubGVuZ3RoOyBqLS07KSB7XG4gICAgICBpZihsaXN0ZW5lcnNbal0pIGxpc3RlbmVyc1tqXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogcmVtb3ZlcyBhbGwgbGlzdGVuZXJzXG4gKiBAbWV0aG9kIHJlbW92ZUFsbExpc3RlbmVyc1xuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IChvcHRpb25hbCkgcmVtb3ZlcyBhbGwgbGlzdGVuZXJzIG9mIGBldmVudGAuIE9taXR0aW5nIHdpbGwgcmVtb3ZlIGV2ZXJ5dGhpbmcuXG4gKi9cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICB0aGlzLl9fZXZlbnRzW2V2ZW50XSA9IHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9fZXZlbnRzID0ge307XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuIiwiZnVuY3Rpb24gX2NvcHkgKHRvLCBmcm9tKSB7XG5cbiAgZm9yICh2YXIgaSA9IDAsIG4gPSBmcm9tLmxlbmd0aDsgaSA8IG47IGkrKykge1xuXG4gICAgdmFyIHRhcmdldCA9IGZyb21baV07XG5cbiAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiB0YXJnZXQpIHtcbiAgICAgIHRvW3Byb3BlcnR5XSA9IHRhcmdldFtwcm9wZXJ0eV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRvO1xufVxuXG5mdW5jdGlvbiBwcm90b2NsYXNzIChwYXJlbnQsIGNoaWxkKSB7XG5cbiAgdmFyIG1peGlucyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XG5cbiAgaWYgKHR5cGVvZiBjaGlsZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgaWYoY2hpbGQpIG1peGlucy51bnNoaWZ0KGNoaWxkKTsgLy8gY29uc3RydWN0b3IgaXMgYSBtaXhpblxuICAgIGNoaWxkICAgPSBwYXJlbnQ7XG4gICAgcGFyZW50ICA9IGZ1bmN0aW9uKCkgeyB9O1xuICB9XG5cbiAgX2NvcHkoY2hpbGQsIHBhcmVudCk7IFxuXG4gIGZ1bmN0aW9uIGN0b3IgKCkge1xuICAgIHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgfVxuXG4gIGN0b3IucHJvdG90eXBlICA9IHBhcmVudC5wcm90b3R5cGU7XG4gIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBjdG9yKCk7XG4gIGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7XG4gIGNoaWxkLnBhcmVudCAgICA9IGNoaWxkLnN1cGVyY2xhc3MgPSBwYXJlbnQ7XG5cbiAgX2NvcHkoY2hpbGQucHJvdG90eXBlLCBtaXhpbnMpO1xuXG4gIHByb3RvY2xhc3Muc2V0dXAoY2hpbGQpO1xuXG4gIHJldHVybiBjaGlsZDtcbn1cblxucHJvdG9jbGFzcy5zZXR1cCA9IGZ1bmN0aW9uIChjaGlsZCkge1xuXG5cbiAgaWYgKCFjaGlsZC5leHRlbmQpIHtcbiAgICBjaGlsZC5leHRlbmQgPSBmdW5jdGlvbihjb25zdHJ1Y3Rvcikge1xuXG4gICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCk7XG5cbiAgICAgIGlmICh0eXBlb2YgY29uc3RydWN0b3IgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBhcmdzLnVuc2hpZnQoY29uc3RydWN0b3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc3RydWN0b3IucGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJvdG9jbGFzcy5hcHBseSh0aGlzLCBbdGhpc10uY29uY2F0KGFyZ3MpKTtcbiAgICB9XG5cbiAgICBjaGlsZC5taXhpbiA9IGZ1bmN0aW9uKHByb3RvKSB7XG4gICAgICBfY29weSh0aGlzLnByb3RvdHlwZSwgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICBjaGlsZC5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgb2JqID0gT2JqZWN0LmNyZWF0ZShjaGlsZC5wcm90b3R5cGUpO1xuICAgICAgY2hpbGQuYXBwbHkob2JqLCBhcmd1bWVudHMpO1xuICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gY2hpbGQ7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBwcm90b2NsYXNzOyIsIi8qKlxuICogVHdlZW4uanMgLSBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2VcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS90d2VlbmpzL3R3ZWVuLmpzXG4gKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKlxuICogU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS90d2VlbmpzL3R3ZWVuLmpzL2dyYXBocy9jb250cmlidXRvcnMgZm9yIHRoZSBmdWxsIGxpc3Qgb2YgY29udHJpYnV0b3JzLlxuICogVGhhbmsgeW91IGFsbCwgeW91J3JlIGF3ZXNvbWUhXG4gKi9cblxuLy8gSW5jbHVkZSBhIHBlcmZvcm1hbmNlLm5vdyBwb2x5ZmlsbFxuKGZ1bmN0aW9uICgpIHtcblxuXHRpZiAoJ3BlcmZvcm1hbmNlJyBpbiB3aW5kb3cgPT09IGZhbHNlKSB7XG5cdFx0d2luZG93LnBlcmZvcm1hbmNlID0ge307XG5cdH1cblxuXHQvLyBJRSA4XG5cdERhdGUubm93ID0gKERhdGUubm93IHx8IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cdH0pO1xuXG5cdGlmICgnbm93JyBpbiB3aW5kb3cucGVyZm9ybWFuY2UgPT09IGZhbHNlKSB7XG5cdFx0dmFyIG9mZnNldCA9IHdpbmRvdy5wZXJmb3JtYW5jZS50aW1pbmcgJiYgd2luZG93LnBlcmZvcm1hbmNlLnRpbWluZy5uYXZpZ2F0aW9uU3RhcnQgPyB3aW5kb3cucGVyZm9ybWFuY2UudGltaW5nLm5hdmlnYXRpb25TdGFydFxuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogRGF0ZS5ub3coKTtcblxuXHRcdHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gRGF0ZS5ub3coKSAtIG9mZnNldDtcblx0XHR9O1xuXHR9XG5cbn0pKCk7XG5cbnZhciBUV0VFTiA9IFRXRUVOIHx8IChmdW5jdGlvbiAoKSB7XG5cblx0dmFyIF90d2VlbnMgPSBbXTtcblxuXHRyZXR1cm4ge1xuXG5cdFx0Z2V0QWxsOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRcdHJldHVybiBfdHdlZW5zO1xuXG5cdFx0fSxcblxuXHRcdHJlbW92ZUFsbDogZnVuY3Rpb24gKCkge1xuXG5cdFx0XHRfdHdlZW5zID0gW107XG5cblx0XHR9LFxuXG5cdFx0YWRkOiBmdW5jdGlvbiAodHdlZW4pIHtcblxuXHRcdFx0X3R3ZWVucy5wdXNoKHR3ZWVuKTtcblxuXHRcdH0sXG5cblx0XHRyZW1vdmU6IGZ1bmN0aW9uICh0d2Vlbikge1xuXG5cdFx0XHR2YXIgaSA9IF90d2VlbnMuaW5kZXhPZih0d2Vlbik7XG5cblx0XHRcdGlmIChpICE9PSAtMSkge1xuXHRcdFx0XHRfdHdlZW5zLnNwbGljZShpLCAxKTtcblx0XHRcdH1cblxuXHRcdH0sXG5cblx0XHR1cGRhdGU6IGZ1bmN0aW9uICh0aW1lKSB7XG5cblx0XHRcdGlmIChfdHdlZW5zLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBpID0gMDtcblxuXHRcdFx0dGltZSA9IHRpbWUgIT09IHVuZGVmaW5lZCA/IHRpbWUgOiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG5cblx0XHRcdHdoaWxlIChpIDwgX3R3ZWVucy5sZW5ndGgpIHtcblxuXHRcdFx0XHRpZiAoX3R3ZWVuc1tpXS51cGRhdGUodGltZSkpIHtcblx0XHRcdFx0XHRpKys7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0X3R3ZWVucy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdH1cblxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdH1cblx0fTtcblxufSkoKTtcblxuVFdFRU4uVHdlZW4gPSBmdW5jdGlvbiAob2JqZWN0KSB7XG5cblx0dmFyIF9vYmplY3QgPSBvYmplY3Q7XG5cdHZhciBfdmFsdWVzU3RhcnQgPSB7fTtcblx0dmFyIF92YWx1ZXNFbmQgPSB7fTtcblx0dmFyIF92YWx1ZXNTdGFydFJlcGVhdCA9IHt9O1xuXHR2YXIgX2R1cmF0aW9uID0gMTAwMDtcblx0dmFyIF9yZXBlYXQgPSAwO1xuXHR2YXIgX3lveW8gPSBmYWxzZTtcblx0dmFyIF9pc1BsYXlpbmcgPSBmYWxzZTtcblx0dmFyIF9yZXZlcnNlZCA9IGZhbHNlO1xuXHR2YXIgX2RlbGF5VGltZSA9IDA7XG5cdHZhciBfc3RhcnRUaW1lID0gbnVsbDtcblx0dmFyIF9lYXNpbmdGdW5jdGlvbiA9IFRXRUVOLkVhc2luZy5MaW5lYXIuTm9uZTtcblx0dmFyIF9pbnRlcnBvbGF0aW9uRnVuY3Rpb24gPSBUV0VFTi5JbnRlcnBvbGF0aW9uLkxpbmVhcjtcblx0dmFyIF9jaGFpbmVkVHdlZW5zID0gW107XG5cdHZhciBfb25TdGFydENhbGxiYWNrID0gbnVsbDtcblx0dmFyIF9vblN0YXJ0Q2FsbGJhY2tGaXJlZCA9IGZhbHNlO1xuXHR2YXIgX29uVXBkYXRlQ2FsbGJhY2sgPSBudWxsO1xuXHR2YXIgX29uQ29tcGxldGVDYWxsYmFjayA9IG51bGw7XG5cdHZhciBfb25TdG9wQ2FsbGJhY2sgPSBudWxsO1xuXG5cdC8vIFNldCBhbGwgc3RhcnRpbmcgdmFsdWVzIHByZXNlbnQgb24gdGhlIHRhcmdldCBvYmplY3Rcblx0Zm9yICh2YXIgZmllbGQgaW4gb2JqZWN0KSB7XG5cdFx0X3ZhbHVlc1N0YXJ0W2ZpZWxkXSA9IHBhcnNlRmxvYXQob2JqZWN0W2ZpZWxkXSwgMTApO1xuXHR9XG5cblx0dGhpcy50byA9IGZ1bmN0aW9uIChwcm9wZXJ0aWVzLCBkdXJhdGlvbikge1xuXG5cdFx0aWYgKGR1cmF0aW9uICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdF9kdXJhdGlvbiA9IGR1cmF0aW9uO1xuXHRcdH1cblxuXHRcdF92YWx1ZXNFbmQgPSBwcm9wZXJ0aWVzO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLnN0YXJ0ID0gZnVuY3Rpb24gKHRpbWUpIHtcblxuXHRcdFRXRUVOLmFkZCh0aGlzKTtcblxuXHRcdF9pc1BsYXlpbmcgPSB0cnVlO1xuXG5cdFx0X29uU3RhcnRDYWxsYmFja0ZpcmVkID0gZmFsc2U7XG5cblx0XHRfc3RhcnRUaW1lID0gdGltZSAhPT0gdW5kZWZpbmVkID8gdGltZSA6IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcblx0XHRfc3RhcnRUaW1lICs9IF9kZWxheVRpbWU7XG5cblx0XHRmb3IgKHZhciBwcm9wZXJ0eSBpbiBfdmFsdWVzRW5kKSB7XG5cblx0XHRcdC8vIENoZWNrIGlmIGFuIEFycmF5IHdhcyBwcm92aWRlZCBhcyBwcm9wZXJ0eSB2YWx1ZVxuXHRcdFx0aWYgKF92YWx1ZXNFbmRbcHJvcGVydHldIGluc3RhbmNlb2YgQXJyYXkpIHtcblxuXHRcdFx0XHRpZiAoX3ZhbHVlc0VuZFtwcm9wZXJ0eV0ubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBDcmVhdGUgYSBsb2NhbCBjb3B5IG9mIHRoZSBBcnJheSB3aXRoIHRoZSBzdGFydCB2YWx1ZSBhdCB0aGUgZnJvbnRcblx0XHRcdFx0X3ZhbHVlc0VuZFtwcm9wZXJ0eV0gPSBbX29iamVjdFtwcm9wZXJ0eV1dLmNvbmNhdChfdmFsdWVzRW5kW3Byb3BlcnR5XSk7XG5cblx0XHRcdH1cblxuXHRcdFx0X3ZhbHVlc1N0YXJ0W3Byb3BlcnR5XSA9IF9vYmplY3RbcHJvcGVydHldO1xuXG5cdFx0XHRpZiAoKF92YWx1ZXNTdGFydFtwcm9wZXJ0eV0gaW5zdGFuY2VvZiBBcnJheSkgPT09IGZhbHNlKSB7XG5cdFx0XHRcdF92YWx1ZXNTdGFydFtwcm9wZXJ0eV0gKj0gMS4wOyAvLyBFbnN1cmVzIHdlJ3JlIHVzaW5nIG51bWJlcnMsIG5vdCBzdHJpbmdzXG5cdFx0XHR9XG5cblx0XHRcdF92YWx1ZXNTdGFydFJlcGVhdFtwcm9wZXJ0eV0gPSBfdmFsdWVzU3RhcnRbcHJvcGVydHldIHx8IDA7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMuc3RvcCA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdGlmICghX2lzUGxheWluZykge1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fVxuXG5cdFx0VFdFRU4ucmVtb3ZlKHRoaXMpO1xuXHRcdF9pc1BsYXlpbmcgPSBmYWxzZTtcblxuXHRcdGlmIChfb25TdG9wQ2FsbGJhY2sgIT09IG51bGwpIHtcblx0XHRcdF9vblN0b3BDYWxsYmFjay5jYWxsKF9vYmplY3QpO1xuXHRcdH1cblxuXHRcdHRoaXMuc3RvcENoYWluZWRUd2VlbnMoKTtcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMuc3RvcENoYWluZWRUd2VlbnMgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHRmb3IgKHZhciBpID0gMCwgbnVtQ2hhaW5lZFR3ZWVucyA9IF9jaGFpbmVkVHdlZW5zLmxlbmd0aDsgaSA8IG51bUNoYWluZWRUd2VlbnM7IGkrKykge1xuXHRcdFx0X2NoYWluZWRUd2VlbnNbaV0uc3RvcCgpO1xuXHRcdH1cblxuXHR9O1xuXG5cdHRoaXMuZGVsYXkgPSBmdW5jdGlvbiAoYW1vdW50KSB7XG5cblx0XHRfZGVsYXlUaW1lID0gYW1vdW50O1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5yZXBlYXQgPSBmdW5jdGlvbiAodGltZXMpIHtcblxuXHRcdF9yZXBlYXQgPSB0aW1lcztcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMueW95byA9IGZ1bmN0aW9uICh5b3lvKSB7XG5cblx0XHRfeW95byA9IHlveW87XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXG5cdHRoaXMuZWFzaW5nID0gZnVuY3Rpb24gKGVhc2luZykge1xuXG5cdFx0X2Vhc2luZ0Z1bmN0aW9uID0gZWFzaW5nO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5pbnRlcnBvbGF0aW9uID0gZnVuY3Rpb24gKGludGVycG9sYXRpb24pIHtcblxuXHRcdF9pbnRlcnBvbGF0aW9uRnVuY3Rpb24gPSBpbnRlcnBvbGF0aW9uO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5jaGFpbiA9IGZ1bmN0aW9uICgpIHtcblxuXHRcdF9jaGFpbmVkVHdlZW5zID0gYXJndW1lbnRzO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5vblN0YXJ0ID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG5cblx0XHRfb25TdGFydENhbGxiYWNrID0gY2FsbGJhY2s7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLm9uVXBkYXRlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG5cblx0XHRfb25VcGRhdGVDYWxsYmFjayA9IGNhbGxiYWNrO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5vbkNvbXBsZXRlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG5cblx0XHRfb25Db21wbGV0ZUNhbGxiYWNrID0gY2FsbGJhY2s7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLm9uU3RvcCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuXG5cdFx0X29uU3RvcENhbGxiYWNrID0gY2FsbGJhY2s7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLnVwZGF0ZSA9IGZ1bmN0aW9uICh0aW1lKSB7XG5cblx0XHR2YXIgcHJvcGVydHk7XG5cdFx0dmFyIGVsYXBzZWQ7XG5cdFx0dmFyIHZhbHVlO1xuXG5cdFx0aWYgKHRpbWUgPCBfc3RhcnRUaW1lKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoX29uU3RhcnRDYWxsYmFja0ZpcmVkID09PSBmYWxzZSkge1xuXG5cdFx0XHRpZiAoX29uU3RhcnRDYWxsYmFjayAhPT0gbnVsbCkge1xuXHRcdFx0XHRfb25TdGFydENhbGxiYWNrLmNhbGwoX29iamVjdCk7XG5cdFx0XHR9XG5cblx0XHRcdF9vblN0YXJ0Q2FsbGJhY2tGaXJlZCA9IHRydWU7XG5cblx0XHR9XG5cblx0XHRlbGFwc2VkID0gKHRpbWUgLSBfc3RhcnRUaW1lKSAvIF9kdXJhdGlvbjtcblx0XHRlbGFwc2VkID0gZWxhcHNlZCA+IDEgPyAxIDogZWxhcHNlZDtcblxuXHRcdHZhbHVlID0gX2Vhc2luZ0Z1bmN0aW9uKGVsYXBzZWQpO1xuXG5cdFx0Zm9yIChwcm9wZXJ0eSBpbiBfdmFsdWVzRW5kKSB7XG5cblx0XHRcdHZhciBzdGFydCA9IF92YWx1ZXNTdGFydFtwcm9wZXJ0eV0gfHwgMDtcblx0XHRcdHZhciBlbmQgPSBfdmFsdWVzRW5kW3Byb3BlcnR5XTtcblxuXHRcdFx0aWYgKGVuZCBpbnN0YW5jZW9mIEFycmF5KSB7XG5cblx0XHRcdFx0X29iamVjdFtwcm9wZXJ0eV0gPSBfaW50ZXJwb2xhdGlvbkZ1bmN0aW9uKGVuZCwgdmFsdWUpO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIFBhcnNlcyByZWxhdGl2ZSBlbmQgdmFsdWVzIHdpdGggc3RhcnQgYXMgYmFzZSAoZS5nLjogKzEwLCAtMylcblx0XHRcdFx0aWYgKHR5cGVvZiAoZW5kKSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRlbmQgPSBzdGFydCArIHBhcnNlRmxvYXQoZW5kLCAxMCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBQcm90ZWN0IGFnYWluc3Qgbm9uIG51bWVyaWMgcHJvcGVydGllcy5cblx0XHRcdFx0aWYgKHR5cGVvZiAoZW5kKSA9PT0gJ251bWJlcicpIHtcblx0XHRcdFx0XHRfb2JqZWN0W3Byb3BlcnR5XSA9IHN0YXJ0ICsgKGVuZCAtIHN0YXJ0KSAqIHZhbHVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdH1cblxuXHRcdGlmIChfb25VcGRhdGVDYWxsYmFjayAhPT0gbnVsbCkge1xuXHRcdFx0X29uVXBkYXRlQ2FsbGJhY2suY2FsbChfb2JqZWN0LCB2YWx1ZSk7XG5cdFx0fVxuXG5cdFx0aWYgKGVsYXBzZWQgPT09IDEpIHtcblxuXHRcdFx0aWYgKF9yZXBlYXQgPiAwKSB7XG5cblx0XHRcdFx0aWYgKGlzRmluaXRlKF9yZXBlYXQpKSB7XG5cdFx0XHRcdFx0X3JlcGVhdC0tO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUmVhc3NpZ24gc3RhcnRpbmcgdmFsdWVzLCByZXN0YXJ0IGJ5IG1ha2luZyBzdGFydFRpbWUgPSBub3dcblx0XHRcdFx0Zm9yIChwcm9wZXJ0eSBpbiBfdmFsdWVzU3RhcnRSZXBlYXQpIHtcblxuXHRcdFx0XHRcdGlmICh0eXBlb2YgKF92YWx1ZXNFbmRbcHJvcGVydHldKSA9PT0gJ3N0cmluZycpIHtcblx0XHRcdFx0XHRcdF92YWx1ZXNTdGFydFJlcGVhdFtwcm9wZXJ0eV0gPSBfdmFsdWVzU3RhcnRSZXBlYXRbcHJvcGVydHldICsgcGFyc2VGbG9hdChfdmFsdWVzRW5kW3Byb3BlcnR5XSwgMTApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChfeW95bykge1xuXHRcdFx0XHRcdFx0dmFyIHRtcCA9IF92YWx1ZXNTdGFydFJlcGVhdFtwcm9wZXJ0eV07XG5cblx0XHRcdFx0XHRcdF92YWx1ZXNTdGFydFJlcGVhdFtwcm9wZXJ0eV0gPSBfdmFsdWVzRW5kW3Byb3BlcnR5XTtcblx0XHRcdFx0XHRcdF92YWx1ZXNFbmRbcHJvcGVydHldID0gdG1wO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdF92YWx1ZXNTdGFydFtwcm9wZXJ0eV0gPSBfdmFsdWVzU3RhcnRSZXBlYXRbcHJvcGVydHldO1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoX3lveW8pIHtcblx0XHRcdFx0XHRfcmV2ZXJzZWQgPSAhX3JldmVyc2VkO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0X3N0YXJ0VGltZSA9IHRpbWUgKyBfZGVsYXlUaW1lO1xuXG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdGlmIChfb25Db21wbGV0ZUNhbGxiYWNrICE9PSBudWxsKSB7XG5cdFx0XHRcdFx0X29uQ29tcGxldGVDYWxsYmFjay5jYWxsKF9vYmplY3QpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yICh2YXIgaSA9IDAsIG51bUNoYWluZWRUd2VlbnMgPSBfY2hhaW5lZFR3ZWVucy5sZW5ndGg7IGkgPCBudW1DaGFpbmVkVHdlZW5zOyBpKyspIHtcblx0XHRcdFx0XHQvLyBNYWtlIHRoZSBjaGFpbmVkIHR3ZWVucyBzdGFydCBleGFjdGx5IGF0IHRoZSB0aW1lIHRoZXkgc2hvdWxkLFxuXHRcdFx0XHRcdC8vIGV2ZW4gaWYgdGhlIGB1cGRhdGUoKWAgbWV0aG9kIHdhcyBjYWxsZWQgd2F5IHBhc3QgdGhlIGR1cmF0aW9uIG9mIHRoZSB0d2VlblxuXHRcdFx0XHRcdF9jaGFpbmVkVHdlZW5zW2ldLnN0YXJ0KF9zdGFydFRpbWUgKyBfZHVyYXRpb24pO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblxuXHR9O1xuXG59O1xuXG5cblRXRUVOLkVhc2luZyA9IHtcblxuXHRMaW5lYXI6IHtcblxuXHRcdE5vbmU6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0UXVhZHJhdGljOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGsgKiBrO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGsgKiAoMiAtIGspO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAwLjUgKiBrICogaztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIC0gMC41ICogKC0tayAqIChrIC0gMikgLSAxKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdEN1YmljOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGsgKiBrICogaztcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiAtLWsgKiBrICogayArIDE7XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdGlmICgoayAqPSAyKSA8IDEpIHtcblx0XHRcdFx0cmV0dXJuIDAuNSAqIGsgKiBrICogaztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIDAuNSAqICgoayAtPSAyKSAqIGsgKiBrICsgMik7XG5cblx0XHR9XG5cblx0fSxcblxuXHRRdWFydGljOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGsgKiBrICogayAqIGs7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gMSAtICgtLWsgKiBrICogayAqIGspO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAwLjUgKiBrICogayAqIGsgKiBrO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gLSAwLjUgKiAoKGsgLT0gMikgKiBrICogayAqIGsgLSAyKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdFF1aW50aWM6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gayAqIGsgKiBrICogayAqIGs7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gLS1rICogayAqIGsgKiBrICogayArIDE7XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdGlmICgoayAqPSAyKSA8IDEpIHtcblx0XHRcdFx0cmV0dXJuIDAuNSAqIGsgKiBrICogayAqIGsgKiBrO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gMC41ICogKChrIC09IDIpICogayAqIGsgKiBrICogayArIDIpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0U2ludXNvaWRhbDoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiAxIC0gTWF0aC5jb3MoayAqIE1hdGguUEkgLyAyKTtcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBNYXRoLnNpbihrICogTWF0aC5QSSAvIDIpO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gMC41ICogKDEgLSBNYXRoLmNvcyhNYXRoLlBJICogaykpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0RXhwb25lbnRpYWw6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gayA9PT0gMCA/IDAgOiBNYXRoLnBvdygxMDI0LCBrIC0gMSk7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gayA9PT0gMSA/IDEgOiAxIC0gTWF0aC5wb3coMiwgLSAxMCAqIGspO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoayA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGsgPT09IDEpIHtcblx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHR9XG5cblx0XHRcdGlmICgoayAqPSAyKSA8IDEpIHtcblx0XHRcdFx0cmV0dXJuIDAuNSAqIE1hdGgucG93KDEwMjQsIGsgLSAxKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIDAuNSAqICgtIE1hdGgucG93KDIsIC0gMTAgKiAoayAtIDEpKSArIDIpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0Q2lyY3VsYXI6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gMSAtIE1hdGguc3FydCgxIC0gayAqIGspO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIE1hdGguc3FydCgxIC0gKC0tayAqIGspKTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKChrICo9IDIpIDwgMSkge1xuXHRcdFx0XHRyZXR1cm4gLSAwLjUgKiAoTWF0aC5zcXJ0KDEgLSBrICogaykgLSAxKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIDAuNSAqIChNYXRoLnNxcnQoMSAtIChrIC09IDIpICogaykgKyAxKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdEVsYXN0aWM6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHR2YXIgcztcblx0XHRcdHZhciBhID0gMC4xO1xuXHRcdFx0dmFyIHAgPSAwLjQ7XG5cblx0XHRcdGlmIChrID09PSAwKSB7XG5cdFx0XHRcdHJldHVybiAwO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoayA9PT0gMSkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFhIHx8IGEgPCAxKSB7XG5cdFx0XHRcdGEgPSAxO1xuXHRcdFx0XHRzID0gcCAvIDQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzID0gcCAqIE1hdGguYXNpbigxIC8gYSkgLyAoMiAqIE1hdGguUEkpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gLSAoYSAqIE1hdGgucG93KDIsIDEwICogKGsgLT0gMSkpICogTWF0aC5zaW4oKGsgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSk7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHR2YXIgcztcblx0XHRcdHZhciBhID0gMC4xO1xuXHRcdFx0dmFyIHAgPSAwLjQ7XG5cblx0XHRcdGlmIChrID09PSAwKSB7XG5cdFx0XHRcdHJldHVybiAwO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoayA9PT0gMSkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFhIHx8IGEgPCAxKSB7XG5cdFx0XHRcdGEgPSAxO1xuXHRcdFx0XHRzID0gcCAvIDQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzID0gcCAqIE1hdGguYXNpbigxIC8gYSkgLyAoMiAqIE1hdGguUEkpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gKGEgKiBNYXRoLnBvdygyLCAtIDEwICogaykgKiBNYXRoLnNpbigoayAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApICsgMSk7XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHZhciBzO1xuXHRcdFx0dmFyIGEgPSAwLjE7XG5cdFx0XHR2YXIgcCA9IDAuNDtcblxuXHRcdFx0aWYgKGsgPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChrID09PSAxKSB7XG5cdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWEgfHwgYSA8IDEpIHtcblx0XHRcdFx0YSA9IDE7XG5cdFx0XHRcdHMgPSBwIC8gNDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHMgPSBwICogTWF0aC5hc2luKDEgLyBhKSAvICgyICogTWF0aC5QSSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICgoayAqPSAyKSA8IDEpIHtcblx0XHRcdFx0cmV0dXJuIC0gMC41ICogKGEgKiBNYXRoLnBvdygyLCAxMCAqIChrIC09IDEpKSAqIE1hdGguc2luKChrIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gYSAqIE1hdGgucG93KDIsIC0xMCAqIChrIC09IDEpKSAqIE1hdGguc2luKChrIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkgKiAwLjUgKyAxO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0QmFjazoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHZhciBzID0gMS43MDE1ODtcblxuXHRcdFx0cmV0dXJuIGsgKiBrICogKChzICsgMSkgKiBrIC0gcyk7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHR2YXIgcyA9IDEuNzAxNTg7XG5cblx0XHRcdHJldHVybiAtLWsgKiBrICogKChzICsgMSkgKiBrICsgcykgKyAxO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHR2YXIgcyA9IDEuNzAxNTggKiAxLjUyNTtcblxuXHRcdFx0aWYgKChrICo9IDIpIDwgMSkge1xuXHRcdFx0XHRyZXR1cm4gMC41ICogKGsgKiBrICogKChzICsgMSkgKiBrIC0gcykpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gMC41ICogKChrIC09IDIpICogayAqICgocyArIDEpICogayArIHMpICsgMik7XG5cblx0XHR9XG5cblx0fSxcblxuXHRCb3VuY2U6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gMSAtIFRXRUVOLkVhc2luZy5Cb3VuY2UuT3V0KDEgLSBrKTtcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdGlmIChrIDwgKDEgLyAyLjc1KSkge1xuXHRcdFx0XHRyZXR1cm4gNy41NjI1ICogayAqIGs7XG5cdFx0XHR9IGVsc2UgaWYgKGsgPCAoMiAvIDIuNzUpKSB7XG5cdFx0XHRcdHJldHVybiA3LjU2MjUgKiAoayAtPSAoMS41IC8gMi43NSkpICogayArIDAuNzU7XG5cdFx0XHR9IGVsc2UgaWYgKGsgPCAoMi41IC8gMi43NSkpIHtcblx0XHRcdFx0cmV0dXJuIDcuNTYyNSAqIChrIC09ICgyLjI1IC8gMi43NSkpICogayArIDAuOTM3NTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiA3LjU2MjUgKiAoayAtPSAoMi42MjUgLyAyLjc1KSkgKiBrICsgMC45ODQzNzU7XG5cdFx0XHR9XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdGlmIChrIDwgMC41KSB7XG5cdFx0XHRcdHJldHVybiBUV0VFTi5FYXNpbmcuQm91bmNlLkluKGsgKiAyKSAqIDAuNTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIFRXRUVOLkVhc2luZy5Cb3VuY2UuT3V0KGsgKiAyIC0gMSkgKiAwLjUgKyAwLjU7XG5cblx0XHR9XG5cblx0fVxuXG59O1xuXG5UV0VFTi5JbnRlcnBvbGF0aW9uID0ge1xuXG5cdExpbmVhcjogZnVuY3Rpb24gKHYsIGspIHtcblxuXHRcdHZhciBtID0gdi5sZW5ndGggLSAxO1xuXHRcdHZhciBmID0gbSAqIGs7XG5cdFx0dmFyIGkgPSBNYXRoLmZsb29yKGYpO1xuXHRcdHZhciBmbiA9IFRXRUVOLkludGVycG9sYXRpb24uVXRpbHMuTGluZWFyO1xuXG5cdFx0aWYgKGsgPCAwKSB7XG5cdFx0XHRyZXR1cm4gZm4odlswXSwgdlsxXSwgZik7XG5cdFx0fVxuXG5cdFx0aWYgKGsgPiAxKSB7XG5cdFx0XHRyZXR1cm4gZm4odlttXSwgdlttIC0gMV0sIG0gLSBmKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZm4odltpXSwgdltpICsgMSA+IG0gPyBtIDogaSArIDFdLCBmIC0gaSk7XG5cblx0fSxcblxuXHRCZXppZXI6IGZ1bmN0aW9uICh2LCBrKSB7XG5cblx0XHR2YXIgYiA9IDA7XG5cdFx0dmFyIG4gPSB2Lmxlbmd0aCAtIDE7XG5cdFx0dmFyIHB3ID0gTWF0aC5wb3c7XG5cdFx0dmFyIGJuID0gVFdFRU4uSW50ZXJwb2xhdGlvbi5VdGlscy5CZXJuc3RlaW47XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8PSBuOyBpKyspIHtcblx0XHRcdGIgKz0gcHcoMSAtIGssIG4gLSBpKSAqIHB3KGssIGkpICogdltpXSAqIGJuKG4sIGkpO1xuXHRcdH1cblxuXHRcdHJldHVybiBiO1xuXG5cdH0sXG5cblx0Q2F0bXVsbFJvbTogZnVuY3Rpb24gKHYsIGspIHtcblxuXHRcdHZhciBtID0gdi5sZW5ndGggLSAxO1xuXHRcdHZhciBmID0gbSAqIGs7XG5cdFx0dmFyIGkgPSBNYXRoLmZsb29yKGYpO1xuXHRcdHZhciBmbiA9IFRXRUVOLkludGVycG9sYXRpb24uVXRpbHMuQ2F0bXVsbFJvbTtcblxuXHRcdGlmICh2WzBdID09PSB2W21dKSB7XG5cblx0XHRcdGlmIChrIDwgMCkge1xuXHRcdFx0XHRpID0gTWF0aC5mbG9vcihmID0gbSAqICgxICsgaykpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZm4odlsoaSAtIDEgKyBtKSAlIG1dLCB2W2ldLCB2WyhpICsgMSkgJSBtXSwgdlsoaSArIDIpICUgbV0sIGYgLSBpKTtcblxuXHRcdH0gZWxzZSB7XG5cblx0XHRcdGlmIChrIDwgMCkge1xuXHRcdFx0XHRyZXR1cm4gdlswXSAtIChmbih2WzBdLCB2WzBdLCB2WzFdLCB2WzFdLCAtZikgLSB2WzBdKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGsgPiAxKSB7XG5cdFx0XHRcdHJldHVybiB2W21dIC0gKGZuKHZbbV0sIHZbbV0sIHZbbSAtIDFdLCB2W20gLSAxXSwgZiAtIG0pIC0gdlttXSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmbih2W2kgPyBpIC0gMSA6IDBdLCB2W2ldLCB2W20gPCBpICsgMSA/IG0gOiBpICsgMV0sIHZbbSA8IGkgKyAyID8gbSA6IGkgKyAyXSwgZiAtIGkpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0VXRpbHM6IHtcblxuXHRcdExpbmVhcjogZnVuY3Rpb24gKHAwLCBwMSwgdCkge1xuXG5cdFx0XHRyZXR1cm4gKHAxIC0gcDApICogdCArIHAwO1xuXG5cdFx0fSxcblxuXHRcdEJlcm5zdGVpbjogZnVuY3Rpb24gKG4sIGkpIHtcblxuXHRcdFx0dmFyIGZjID0gVFdFRU4uSW50ZXJwb2xhdGlvbi5VdGlscy5GYWN0b3JpYWw7XG5cblx0XHRcdHJldHVybiBmYyhuKSAvIGZjKGkpIC8gZmMobiAtIGkpO1xuXG5cdFx0fSxcblxuXHRcdEZhY3RvcmlhbDogKGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0dmFyIGEgPSBbMV07XG5cblx0XHRcdHJldHVybiBmdW5jdGlvbiAobikge1xuXG5cdFx0XHRcdHZhciBzID0gMTtcblxuXHRcdFx0XHRpZiAoYVtuXSkge1xuXHRcdFx0XHRcdHJldHVybiBhW25dO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yICh2YXIgaSA9IG47IGkgPiAxOyBpLS0pIHtcblx0XHRcdFx0XHRzICo9IGk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRhW25dID0gcztcblx0XHRcdFx0cmV0dXJuIHM7XG5cblx0XHRcdH07XG5cblx0XHR9KSgpLFxuXG5cdFx0Q2F0bXVsbFJvbTogZnVuY3Rpb24gKHAwLCBwMSwgcDIsIHAzLCB0KSB7XG5cblx0XHRcdHZhciB2MCA9IChwMiAtIHAwKSAqIDAuNTtcblx0XHRcdHZhciB2MSA9IChwMyAtIHAxKSAqIDAuNTtcblx0XHRcdHZhciB0MiA9IHQgKiB0O1xuXHRcdFx0dmFyIHQzID0gdCAqIHQyO1xuXG5cdFx0XHRyZXR1cm4gKDIgKiBwMSAtIDIgKiBwMiArIHYwICsgdjEpICogdDMgKyAoLSAzICogcDEgKyAzICogcDIgLSAyICogdjAgLSB2MSkgKiB0MiArIHYwICogdCArIHAxO1xuXG5cdFx0fVxuXG5cdH1cblxufTtcblxuLy8gVU1EIChVbml2ZXJzYWwgTW9kdWxlIERlZmluaXRpb24pXG4oZnVuY3Rpb24gKHJvb3QpIHtcblxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cblx0XHQvLyBBTURcblx0XHRkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBUV0VFTjtcblx0XHR9KTtcblxuXHR9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuXG5cdFx0Ly8gTm9kZS5qc1xuXHRcdG1vZHVsZS5leHBvcnRzID0gVFdFRU47XG5cblx0fSBlbHNlIHtcblxuXHRcdC8vIEdsb2JhbCB2YXJpYWJsZVxuXHRcdHJvb3QuVFdFRU4gPSBUV0VFTjtcblxuXHR9XG5cbn0pKHRoaXMpO1xuIl19

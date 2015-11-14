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
module.exports = function CameraInteractivityWorld(domElement) {
	var _this2 = this;

	function InteractivityTarget(node) {
		var _this = this;

		EventEmitter.call(this);

		this.position = node.position;
		this.hasHover = false;
		this.object3d = node;

		this.on('hover', function () {
			if (!_this.hasHover) {
				_this.emit('hoverStart');
			}
			_this.hasHover = true;
		});

		this.on('hoverOut', function () {
			_this.hasHover = false;
		});

		this.hide = function () {
			_this.object3d.visible = false;
		};

		this.show = function () {
			_this.object3d.visible = true;
		};
	}
	util.inherits(InteractivityTarget, EventEmitter);

	this.targets = new Map();

	this.detectInteractions = function (camera) {

		var raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
		var hits = raycaster.intersectObjects(Array.from(this.targets.values()).map(function (target) {
			return target.object3d;
		}).filter(function (object3d) {
			return object3d.visible;
		}));

		var target = false;

		if (hits.length) {

			// Show hidden text object3d child
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
		var newTarget = new InteractivityTarget(node);
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

},{}],4:[function(require,module,exports){
// Based on https://stemkoski.github.io/Three.js/Texture-Animation.html
/*global THREE*/
'use strict';
var util = require('util');
var EventEmitter = require('fast-event-emitter');

function TextureAnimator(texture, tilesHoriz, tilesVert, numTiles) {
	EventEmitter.call(this);
	// note: texture passed by reference, will be updated by the update function.

	texture.flipY = false;
	this.currentTile = 0;
	this.tilesHorizontal = tilesHoriz;
	this.tilesVertical = tilesVert;
	// how many images does this spritesheet contain?
	//  usually equals tilesHoriz * tilesVert, but not necessarily,
	//  if there at blank tiles at the bottom of the spritesheet.
	this.numberOfTiles = numTiles;
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical);

	this.update = function () {
		this.currentTile = this.currentTile + 1;
		if (this.currentTile >= this.numberOfTiles) {
			this.currentTile = 0;
			this.emit('finish');
		}

		var currentColumn = this.currentTile % this.tilesHorizontal;
		texture.offset.x = currentColumn / this.tilesHorizontal;
		var currentRow = Math.floor(this.currentTile / this.tilesHorizontal);
		texture.offset.y = currentRow / this.tilesVertical;
	};
	this.update();
}

util.inherits(TextureAnimator, EventEmitter);
module.exports = TextureAnimator;

},{"fast-event-emitter":12,"util":11}],5:[function(require,module,exports){
/* global THREE, DeviceOrientationController */
'use strict';
var EventEmitter = require('fast-event-emitter');
var util = require('util');

/**
 * Use the json loader to load json files from the default location
 */

var l = new THREE.ObjectLoader();
var loadScene = function loadScene(id) {
	return new Promise(function (resolve, reject) {
		l.load('models/' + id + '.json', resolve, undefined, reject);
	});
};

/**
 * Helper for picking objects from a scene
 * @param  {Object3d}    root    root Object3d e.g. a scene or a mesh
 * @param  {...string} namesIn list of namesd to find e.g. 'Camera' or 'Floor'
 * @return {Object map}          map of names to objects {'Camera': (THREE.Camera with name Camera), 'Floor': (THREE.Mesh with name Floor)}
 */
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

/**
 * Load the scene with file name id and return the helper
 */
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

	options.target = options.target || document.body;

	var renderer = new THREE.WebGLRenderer({ antialias: false });
	renderer.setPixelRatio(window.devicePixelRatio);

	options.target.appendChild(renderer.domElement);
	this.domElement = renderer.domElement;

	/**
  * Set up stereo effect renderer
  */

	var effect = new THREE.StereoEffect(renderer);
	effect.eyeSeparation = 0.008;
	effect.focalLength = 0.25;
	effect.setSize(window.innerWidth, window.innerHeight);
	this.renderMethod = effect;

	/**
  * Set up the scene to be rendered or create a new one
  */

	this.scene = options.scene || new THREE.Scene();

	/**
  * Set up camera either one from the scene or make a new one
  */

	var camera = options.camera ? pickObjectsHelper(this.scene, options.camera).Camera : undefined;

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

	/**
  * Handle window resizes/rotations
  */

	var setAspect = function setAspect() {
		_this.renderMethod.setSize(options.target.scrollWidth, options.target.scrollHeight);
		_this.camera.aspect = options.target.scrollWidth / options.target.scrollHeight;
		_this.camera.updateProjectionMatrix();
	};
	window.addEventListener('resize', setAspect);
	setAspect();

	/**
  * Set up head tracking
  */

	// provide dummy element to prevent touch/click hijacking.
	var element = location.hostname !== 'localhost' ? document.createElement("DIV") : undefined;
	this.deviceOrientationController = new DeviceOrientationController(this.camera, element);
	this.deviceOrientationController.connect();
	this.on('prerender', function () {
		return _this.deviceOrientationController.update();
	});

	/**
  * This should be called in the main animation loop
  */

	this.render = function () {
		_this.emit('prerender');
		_this.renderMethod.render(_this.scene, camera);
		_this.emit('postrender');
	};

	/**
  * Heads up Display
  * 
  * Add a heads up display object to the camera
  * Meshes and Sprites can be added to this to appear to be close to the user.
  */

	var hud = new THREE.Object3D();
	hud.position.set(0, 0, -2.1);
	hud.scale.set(0.2, 0.2, 0.2);
	camera.add(hud);
	this.scene.add(this.camera); // add the camera to the scene so that the hud is rendered
	this.hud = hud;

	/**
  * ANIMATION
  * 
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
var TextureAnimator = require('./lib/textureanimator');
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
	return Promise.all([addScript('https://cdn.rawgit.com/mrdoob/three.js/master/examples/js/effects/StereoEffect.js'), addScript('https://cdn.rawgit.com/richtr/threeVR/master/js/DeviceOrientationController.js')]);
}).then(function () {
	return require('./lib/threeHelper').myThreeFromJSON('Kitchen/lickthewhisk', {
		camera: 'Camera',
		target: document.body
	});
}).then(function (threeHelper) {
	console.log('Ready');

	/**
  * Update textures to Baked ones and add envmap
  */

	var textureLoader = new THREE.TextureLoader();
	var cubeTextureLoader = new THREE.CubeTextureLoader();

	// Select objects from the scene for later processing.
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

	// Ambiant light
	var ambientLight = new THREE.AmbientLight(0xcccccc);
	threeHelper.scene.add(ambientLight);

	/**
  * Add a targeting reticule to the HUD to help align what the user is looking at
  * Also add a circular progress bar.
  */

	textureLoader.load("images/reticule.png", function (map) {
		var material = new THREE.SpriteMaterial({ map: map, fog: false, transparent: true });
		var sprite = new THREE.Sprite(material);
		threeHelper.hud.add(sprite);
	});

	/**
  * Set up interactivity from the camera.
  */

	var cameraInteractivityWorld = new CameraInteractions(threeHelper.domElement);

	threeHelper.deviceOrientationController.addEventListener('userinteractionend', function () {
		cameraInteractivityWorld.interact({ type: 'click' });
	});

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

		/**
   * Main Render Loop
   *
   * Each request animation frame render is called
   * And a request is made to the verlet physics worker
   * to calculate a new lot of physics calculations to update
   * our simulation.
   */

		var waitingForPoints = false;
		requestAnimationFrame(function animate(time) {
			requestAnimationFrame(animate);
			cameraInteractivityWorld.detectInteractions(threeHelper.camera);

			if (!waitingForPoints) {
				verlet.getPoints().then(threeHelper.updateObjects).then(function () {
					return waitingForPoints = false;
				});
				waitingForPoints = true;
			}
			TWEEN.update();
			threeHelper.render();
		});

		/**
   * Add some interactivity
   */
		var loaderSprite = undefined;

		textureLoader.load("images/loader.png", function (map) {
			var tA = new TextureAnimator(map, 8, 16, 116);
			var texture = new THREE.SpriteMaterial({ map: map, fog: false, transparent: true });
			loaderSprite = new THREE.Sprite(texture);
			loaderSprite.animator = tA;
			loaderSprite.scale.multiplyScalar(0.9);
			threeHelper.on('prerender', function () {
				if (loaderSprite.visible) tA.update();
			});
			threeHelper.hud.add(loaderSprite);
			loaderSprite.visible = false;
		});

		function showLoader(callback) {
			if (!loaderSprite) return;
			loaderSprite.animator.currentTile = 0;
			loaderSprite.visible = true;
			loaderSprite.animator.on('finish', function () {
				hideLoader();
				callback();
			});
		}

		function hideLoader() {
			if (!loaderSprite) return;
			loaderSprite.visible = false;
			loaderSprite.animator.off('finish');
		}

		var interactiveElements = threeHelper.pickObjectsHelper(threeHelper.scene, 'LeftArrow', 'RightArrow');
		Object.keys(interactiveElements).forEach(function (name) {
			var iEl = cameraInteractivityWorld.makeTarget(interactiveElements[name]);
			interactiveElements[name] = iEl;
			var newScale = iEl.object3d.scale.x * 1.1;
			var tween = new TWEEN.Tween(iEl.object3d.scale).to({ x: newScale, y: newScale, z: newScale }, 400).repeat(Infinity);

			iEl.on('hoverStart', function () {
				showLoader(function () {
					return iEl.emit('click');
				});
				tween.yoyo().start();
			});
			iEl.on('hoverOut', function () {
				hideLoader();
				tween.stop();
			});
			iEl.on('click', hideLoader);
		});
	});
});

},{"./lib/camerainteractions":1,"./lib/loadScript":2,"./lib/textSprite":3,"./lib/textureanimator":4,"./lib/threeHelper":5,"./lib/verletwrapper":6,"tween.js":14}],8:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvY2FtZXJhaW50ZXJhY3Rpb25zLmpzIiwiL2hvbWUvYWRhL2dpdFdvcmtpbmdEaXIvbGljay10aGUtd2hpc2svYXBwL3NjcmlwdHMvbGliL2xvYWRTY3JpcHQuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvdGV4dFNwcml0ZS5qcyIsIi9ob21lL2FkYS9naXRXb3JraW5nRGlyL2xpY2stdGhlLXdoaXNrL2FwcC9zY3JpcHRzL2xpYi90ZXh0dXJlYW5pbWF0b3IuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvdGhyZWVIZWxwZXIuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy9saWIvdmVybGV0d3JhcHBlci5qcyIsIi9ob21lL2FkYS9naXRXb3JraW5nRGlyL2xpY2stdGhlLXdoaXNrL2FwcC9zY3JpcHRzL21haW4uanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvZmFzdC1ldmVudC1lbWl0dGVyL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9mYXN0LWV2ZW50LWVtaXR0ZXIvbm9kZV9tb2R1bGVzL3Byb3RvY2xhc3MvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3R3ZWVuLmpzL3NyYy9Ud2Vlbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0FDS0EsWUFBWSxDQUFDO0FBQ2IsSUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDbkQsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7QUFZN0IsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLHdCQUF3QixDQUFDLFVBQVUsRUFBRTs7O0FBRTlELFVBQVMsbUJBQW1CLENBQUMsSUFBSSxFQUFFOzs7QUFFbEMsY0FBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFeEIsTUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQzlCLE1BQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLE1BQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDOztBQUVyQixNQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxZQUFNO0FBQ3RCLE9BQUksQ0FBQyxNQUFLLFFBQVEsRUFBRTtBQUNuQixVQUFLLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUN4QjtBQUNELFNBQUssUUFBUSxHQUFHLElBQUksQ0FBQztHQUNyQixDQUFDLENBQUM7O0FBRUgsTUFBSSxDQUFDLEVBQUUsQ0FBQyxVQUFVLEVBQUUsWUFBTTtBQUN6QixTQUFLLFFBQVEsR0FBRyxLQUFLLENBQUM7R0FDdEIsQ0FBQyxDQUFDOztBQUVILE1BQUksQ0FBQyxJQUFJLEdBQUcsWUFBSztBQUNoQixTQUFLLFFBQVEsQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0dBQzlCLENBQUM7O0FBRUYsTUFBSSxDQUFDLElBQUksR0FBRyxZQUFLO0FBQ2hCLFNBQUssUUFBUSxDQUFDLE9BQU8sR0FBRyxJQUFJLENB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QUUsQ0FBQztBQUNiLFNBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNiLENBQUMsQ0FBQztBQUNILE1BQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0dBRTVCLENBQUMsQ0FBQztFQUdILENBQUMsQ0FBQztDQUNILENBQUMsQ0FBQzs7O0FDbE9IO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBTZXRzIHVwIGFuIGVudmlyb21lbnQgZm9yIGRldGVjdGluZyB0aGF0IFxuICogdGhlIGNhbWVyYSBpcyBsb29raW5nIGF0IG9iamVjdHMuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZmFzdC1ldmVudC1lbWl0dGVyJyk7XG5jb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuXG4vKmdsb2JhbCBUSFJFRSovXG4vKipcbiAqIEtlZXBzIHRyYWNrIG9mIGludGVyYWN0aXZlIDNEIGVsZW1lbnRzIGFuZCBcbiAqIGNhbiBiZSB1c2VkIHRvIHRyaWdnZXIgZXZlbnRzIG9uIHRoZW0uXG4gKlxuICogVGhlIGRvbUVsZW1lbnQgaXMgdG8gcGljayB1cCB0b3VjaCBpbmVyYWN0aW9uc1xuICogXG4gKiBAcGFyYW0gIHtbdHlwZV19IGRvbUVsZW1lbnQgW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7W3R5cGVdfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBDYW1lcmFJbnRlcmFjdGl2aXR5V29ybGQoZG9tRWxlbWVudCkge1xuXG5cdGZ1bmN0aW9uIEludGVyYWN0aXZpdHlUYXJnZXQobm9kZSkge1xuXG5cdFx0RXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cblx0XHR0aGlzLnBvc2l0aW9uID0gbm9kZS5wb3NpdGlvbjtcblx0XHR0aGlzLmhhc0hvdmVyID0gZmFsc2U7XG5cdFx0dGhpcy5vYmplY3QzZCA9IG5vZGU7XG5cblx0XHR0aGlzLm9uKCdob3ZlcicsICgpID0+IHtcblx0XHRcdGlmICghdGhpcy5oYXNIb3Zlcikge1xuXHRcdFx0XHR0aGlzLmVtaXQoJ2hvdmVyU3RhcnQnKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuaGFzSG92ZXIgPSB0cnVlO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5vbignaG92ZXJPdXQnLCAoKSA9PiB7XG5cdFx0XHR0aGlzLmhhc0hvdmVyID0gZmFsc2U7XG5cdFx0fSk7XG5cblx0XHR0aGlzLmhpZGUgPSAoKSA9Pntcblx0XHRcdHRoaXMub2JqZWN0M2QudmlzaWJsZSA9IGZhbHNlO1xuXHRcdH07XG5cblx0XHR0aGlzLnNob3cgPSAoKSA9Pntcblx0XHRcdHRoaXMub2JqZWN0M2QudmlzaWJsZSA9IHRydWU7XG5cdFx0fTtcblx0fVxuXHR1dGlsLmluaGVyaXRzKEludGVyYWN0aXZpdHlUYXJnZXQsIEV2ZW50RW1pdHRlcik7XG5cblx0dGhpcy50YXJnZXRzID0gbmV3IE1hcCgpO1xuXG5cdHRoaXMuZGV0ZWN0SW50ZXJhY3Rpb25zID0gZnVuY3Rpb24gKGNhbWVyYSkge1xuXG5cdFx0Y29uc3QgcmF5Y2FzdGVyID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuXHRcdHJheWNhc3Rlci5zZXRGcm9tQ2FtZXJhKG5ldyBUSFJFRS5WZWN0b3IyKDAsMCksIGNhbWVyYSk7XG5cdFx0Y29uc3QgaGl0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKFxuXHRcdFx0QXJyYXkuZnJvbSh0aGlzLnRhcmdldHMudmFsdWVzKCkpXG5cdFx0XHQubWFwKHRhcmdldCA9PiB0YXJnZXQub2JqZWN0M2QpXG5cdFx0XHQuZmlsdGVyKG9iamVjdDNkID0+IG9iamVjdDNkLnZpc2libGUpXG5cdFx0KTtcblxuXHRcdGxldCB0YXJnZXQgPSBmYWxzZTtcblxuXHRcdGlmIChoaXRzLmxlbmd0aCkge1xuXG5cdFx0XHQvLyBTaG93IGhpZGRlbiB0ZXh0IG9iamVjdDNkIGNoaWxkXG5cdFx0XHR0YXJnZXQgPSB0aGlzLnRhcmdldHMuZ2V0KGhpdHNbMF0ub2JqZWN0KTtcblx0XHRcdGlmICh0YXJnZXQpIHRhcmdldC5lbWl0KCdob3ZlcicpO1xuXHRcdH1cblxuXHRcdC8vIGlmIGl0IGlzIG5vdCB0aGUgb25lIGp1c3QgbWFya2VkIGZvciBoaWdobGlnaHRcblx0XHQvLyBhbmQgaXQgdXNlZCB0byBiZSBoaWdobGlnaHRlZCB1biBoaWdobGlnaHQgaXQuXG5cdFx0QXJyYXkuZnJvbSh0aGlzLnRhcmdldHMudmFsdWVzKCkpXG5cdFx0LmZpbHRlcihlYWNoVGFyZ2V0ID0+IGVhY2hUYXJnZXQgIT09IHRhcmdldClcblx0XHQuZm9yRWFjaChlYWNoTm90SGl0ID0+IHtcblx0XHRcdGlmIChlYWNoTm90SGl0Lmhhc0hvdmVyKSBlYWNoTm90SGl0LmVtaXQoJ2hvdmVyT3V0Jyk7XG5cdFx0fSk7XG5cdH07XG5cblx0Y29uc3QgaW50ZXJhY3QgPSAoZXZlbnQpID0+IHtcblx0XHRBcnJheS5mcm9tKHRoaXMudGFyZ2V0cy52YWx1ZXMoKSkuZm9yRWFjaCh0YXJnZXQgPT4ge1xuXHRcdFx0aWYgKHRhcmdldC5oYXNIb3Zlcikge1xuXHRcdFx0XHR0YXJnZXQuZW1pdChldmVudC50eXBlKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fTtcblx0dGhpcy5pbnRlcmFjdCA9IGludGVyYWN0O1xuXG5cdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBpbnRlcmFjdCk7XG5cdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaW50ZXJhY3QpO1xuXHRkb21FbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCBpbnRlcmFjdCk7XG5cdGRvbUVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2h1cCcsIGludGVyYWN0KTtcblx0ZG9tRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGRvd24nLCBpbnRlcmFjdCk7XG5cblx0dGhpcy5tYWtlVGFyZ2V0ID0gbm9kZSA9PiB7XG5cdFx0Y29uc3QgbmV3VGFyZ2V0ID0gbmV3IEludGVyYWN0aXZpdHlUYXJnZXQobm9kZSk7XG5cdFx0dGhpcy50YXJnZXRzLnNldChub2RlLCBuZXdUYXJnZXQpO1xuXHRcdHJldHVybiBuZXdUYXJnZXQ7XG5cdH07XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBhZGRTY3JpcHQodXJsKSB7XG5cdHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG5cdFx0dmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXHRcdHNjcmlwdC5zZXRBdHRyaWJ1dGUoJ3NyYycsIHVybCk7XG5cdFx0ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzY3JpcHQpO1xuXHRcdHNjcmlwdC5vbmxvYWQgPSByZXNvbHZlO1xuXHRcdHNjcmlwdC5vbmVycm9yID0gcmVqZWN0O1xuXHR9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBhZGRTY3JpcHQ7XG4iLCIvLyBGcm9tIGh0dHA6Ly9zdGVta29za2kuZ2l0aHViLmlvL1RocmVlLmpzL1Nwcml0ZS1UZXh0LUxhYmVscy5odG1sXG4vKmdsb2JhbCBUSFJFRSovXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIG1ha2VUZXh0U3ByaXRlKCBtZXNzYWdlLCBwYXJhbWV0ZXJzICkge1xuXHRpZiAoIHBhcmFtZXRlcnMgPT09IHVuZGVmaW5lZCApIHBhcmFtZXRlcnMgPSB7fTtcblx0XG5cdGNvbnN0IGZvbnRmYWNlID0gcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcImZvbnRmYWNlXCIpID8gXG5cdFx0cGFyYW1ldGVyc1tcImZvbnRmYWNlXCJdIDogXCJBcmlhbFwiO1xuXHRcblx0Y29uc3QgYm9yZGVyVGhpY2tuZXNzID0gcGFyYW1ldGVycy5oYXNPd25Qcm9wZXJ0eShcImJvcmRlclRoaWNrbmVzc1wiKSA/IFxuXHRcdHBhcmFtZXRlcnNbXCJib3JkZXJUaGlja25lc3NcIl0gOiAyO1xuXG5cdC8vIG1heSB0d2Vha2VkIGxhdGVyIHRvIHNjYWxlIHRleHRcblx0bGV0IHNpemUgPSBwYXJhbWV0ZXJzLmhhc093blByb3BlcnR5KFwic2l6ZVwiKSA/IFxuXHRcdHBhcmFtZXRlcnNbXCJzaXplXCJdIDogMTtcblx0XHRcblx0Y29uc3QgY2FudmFzMSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXHRjb25zdCBjb250ZXh0MSA9IGNhbnZhczEuZ2V0Q29udGV4dCgnMmQnKTtcblx0Y29uc3QgaGVpZ2h0ID0gMjU2O1xuXG5cdGZ1bmN0aW9uIHNldFN0eWxlKGNvbnRleHQpIHtcblxuXHRcdGNvbnRleHQuZm9udCA9IFwiQm9sZCBcIiArIChoZWlnaHQgLSBib3JkZXJUaGlja25lc3MpICsgXCJweCBcIiArIGZvbnRmYWNlO1xuXHRcdGNvbnRleHQudGV4dEFsaWduID0gJ2NlbnRlcic7XG5cdFx0Y29udGV4dC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcblx0XHRcblx0XHRjb250ZXh0LmxpbmVXaWR0aCA9IGJvcmRlclRoaWNrbmVzcztcblxuXHRcdC8vIHRleHQgY29sb3Jcblx0XHRjb250ZXh0LnN0cm9rZVN0eWxlID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDEuMClcIjtcblx0XHRjb250ZXh0LmZpbGxTdHlsZSA9IFwicmdiYSgwLCAwLCAwLCAxLjApXCI7XG5cdH1cblxuXHRzZXRTdHlsZShjb250ZXh0MSk7XG5cblx0Y29uc3QgY2FudmFzMiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuXG5cdC8vIE1ha2UgdGhlIGNhbnZhcyB3aWR0aCBhIHBvd2VyIG9mIDIgbGFyZ2VyIHRoYW4gdGhlIHRleHQgd2lkdGhcblx0Y29uc3QgbWVhc3VyZSA9IGNvbnRleHQxLm1lYXN1cmVUZXh0KCBtZXNzYWdlICk7XG5cdGNhbnZhczIud2lkdGggPSBNYXRoLnBvdygyLCBNYXRoLmNlaWwoTWF0aC5sb2cyKCBtZWFzdXJlLndpZHRoICkpKTtcblx0Y2FudmFzMi5oZWlnaHQgPSBoZWlnaHQ7XG5cdGNvbnNvbGUubG9nKG1lYXN1cmUpO1xuXHRjb25zdCBjb250ZXh0MiA9IGNhbnZhczIuZ2V0Q29udGV4dCgnMmQnKTtcblxuXHRjb250ZXh0Mi5yZWN0KDAsIDAsIGNhbnZhczIud2lkdGgsIGNhbnZhczIuaGVpZ2h0KTtcblx0Y29udGV4dDIuZmlsbFN0eWxlPVwicmVkXCI7XG5cdGNvbnRleHQyLmZpbGwoKTtcblxuXHRzZXRTdHlsZShjb250ZXh0Mik7XG5cblx0Y29udGV4dDIuc3Ryb2tlVGV4dCggbWVzc2FnZSwgY2FudmFzMi53aWR0aC8yLCBjYW52YXMyLmhlaWdodC8yKTtcblx0Y29udGV4dDIuZmlsbFRleHQoIG1lc3NhZ2UsIGNhbnZhczIud2lkdGgvMiwgY2FudmFzMi5oZWlnaHQvMik7XG5cdFxuXHQvLyBjYW52YXMgY29udGVudHMgd2lsbCBiZSB1c2VkIGZvciBhIHRleHR1cmVcblx0Y29uc3QgdGV4dHVyZSA9IG5ldyBUSFJFRS5UZXh0dXJlKGNhbnZhczIpIDtcblx0dGV4dHVyZS5uZWVkc1VwZGF0ZSA9IHRydWU7XG5cblx0Y29uc3Qgc3ByaXRlTWF0ZXJpYWwgPSBuZXcgVEhSRUUuU3ByaXRlTWF0ZXJpYWwoeyBtYXA6IHRleHR1cmUsIHRyYW5zcGFyZW50OiB0cnVlIH0pO1xuXHRjb25zdCBzcHJpdGUgPSBuZXcgVEhSRUUuU3ByaXRlKHNwcml0ZU1hdGVyaWFsKTtcblxuXHRjb25zdCBtYXhXaWR0aCA9IGhlaWdodCAqIDQ7XG5cblx0aWYgKGNhbnZhczIud2lkdGggPiBtYXhXaWR0aCkgc2l6ZSAqPSBtYXhXaWR0aC9jYW52YXMyLndpZHRoO1xuXHRjb25zb2xlLmxvZyhjYW52YXMyLndpZHRoLCBjYW52YXMyLmhlaWdodCk7XG4gICAgXG5cdC8vIGdldCBzaXplIGRhdGEgKGhlaWdodCBkZXBlbmRzIG9ubHkgb24gZm9udCBzaXplKVxuXHRzcHJpdGUuc2NhbGUuc2V0KHNpemUgKiBjYW52YXMyLndpZHRoL2NhbnZhczIuaGVpZ2h0LCBzaXplLCAxKTtcblx0cmV0dXJuIHNwcml0ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBtYWtlVGV4dFNwcml0ZTtcbiIsIi8vIEJhc2VkIG9uIGh0dHBzOi8vc3RlbWtvc2tpLmdpdGh1Yi5pby9UaHJlZS5qcy9UZXh0dXJlLUFuaW1hdGlvbi5odG1sXG4vKmdsb2JhbCBUSFJFRSovXG4ndXNlIHN0cmljdCc7XG5jb25zdCB1dGlsID0gcmVxdWlyZSgndXRpbCcpO1xuY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZmFzdC1ldmVudC1lbWl0dGVyJyk7XG5cbmZ1bmN0aW9uIFRleHR1cmVBbmltYXRvcih0ZXh0dXJlLCB0aWxlc0hvcml6LCB0aWxlc1ZlcnQsIG51bVRpbGVzKSB7XG5cdEV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXHQvLyBub3RlOiB0ZXh0dXJlIHBhc3NlZCBieSByZWZlcmVuY2UsIHdpbGwgYmUgdXBkYXRlZCBieSB0aGUgdXBkYXRlIGZ1bmN0aW9uLlxuXG5cdHRleHR1cmUuZmxpcFkgPSBmYWxzZTtcblx0dGhpcy5jdXJyZW50VGlsZSA9IDA7XG5cdHRoaXMudGlsZXNIb3Jpem9udGFsID0gdGlsZXNIb3Jpejtcblx0dGhpcy50aWxlc1ZlcnRpY2FsID0gdGlsZXNWZXJ0O1xuXHQvLyBob3cgbWFueSBpbWFnZXMgZG9lcyB0aGlzIHNwcml0ZXNoZWV0IGNvbnRhaW4/XG5cdC8vICB1c3VhbGx5IGVxdWFscyB0aWxlc0hvcml6ICogdGlsZXNWZXJ0LCBidXQgbm90IG5lY2Vzc2FyaWx5LFxuXHQvLyAgaWYgdGhlcmUgYXQgYmxhbmsgdGlsZXMgYXQgdGhlIGJvdHRvbSBvZiB0aGUgc3ByaXRlc2hlZXQuIFxuXHR0aGlzLm51bWJlck9mVGlsZXMgPSBudW1UaWxlcztcblx0dGV4dHVyZS53cmFwUyA9IHRleHR1cmUud3JhcFQgPSBUSFJFRS5SZXBlYXRXcmFwcGluZzsgXG5cdHRleHR1cmUucmVwZWF0LnNldCggMSAvIHRoaXMudGlsZXNIb3Jpem9udGFsLCAxIC8gdGhpcy50aWxlc1ZlcnRpY2FsICk7XG5cblx0dGhpcy51cGRhdGUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmN1cnJlbnRUaWxlID0gdGhpcy5jdXJyZW50VGlsZSArIDE7XG5cdFx0aWYgKHRoaXMuY3VycmVudFRpbGUgPj0gdGhpcy5udW1iZXJPZlRpbGVzKSB7XG5cdFx0XHR0aGlzLmN1cnJlbnRUaWxlID0gMDtcblx0XHRcdHRoaXMuZW1pdCgnZmluaXNoJyk7XG5cdFx0fVxuXG5cdFx0dmFyIGN1cnJlbnRDb2x1bW4gPSB0aGlzLmN1cnJlbnRUaWxlICUgdGhpcy50aWxlc0hvcml6b250YWw7XG5cdFx0dGV4dHVyZS5vZmZzZXQueCA9IGN1cnJlbnRDb2x1bW4gLyB0aGlzLnRpbGVzSG9yaXpvbnRhbDtcblx0XHR2YXIgY3VycmVudFJvdyA9IE1hdGguZmxvb3IoIHRoaXMuY3VycmVudFRpbGUgLyB0aGlzLnRpbGVzSG9yaXpvbnRhbCApO1xuXHRcdHRleHR1cmUub2Zmc2V0LnkgPSBjdXJyZW50Um93IC8gdGhpcy50aWxlc1ZlcnRpY2FsO1xuXHR9O1xuXHR0aGlzLnVwZGF0ZSgpO1xufVxuXG51dGlsLmluaGVyaXRzKFRleHR1cmVBbmltYXRvciwgRXZlbnRFbWl0dGVyKTtcbm1vZHVsZS5leHBvcnRzID0gVGV4dHVyZUFuaW1hdG9yO1xuIiwiLyogZ2xvYmFsIFRIUkVFLCBEZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIgKi9cbid1c2Ugc3RyaWN0JztcbmNvbnN0IEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2Zhc3QtZXZlbnQtZW1pdHRlcicpO1xuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcblxuXG4vKipcbiAqIFVzZSB0aGUganNvbiBsb2FkZXIgdG8gbG9hZCBqc29uIGZpbGVzIGZyb20gdGhlIGRlZmF1bHQgbG9jYXRpb25cbiAqL1xuXG52YXIgbCA9IG5ldyBUSFJFRS5PYmplY3RMb2FkZXIoKTtcbmNvbnN0IGxvYWRTY2VuZSA9IChpZCkgPT4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHRsLmxvYWQoJ21vZGVscy8nICsgaWQgKyAnLmpzb24nLCByZXNvbHZlLCB1bmRlZmluZWQsIHJlamVjdCk7XG59KTtcblxuLyoqXG4gKiBIZWxwZXIgZm9yIHBpY2tpbmcgb2JqZWN0cyBmcm9tIGEgc2NlbmVcbiAqIEBwYXJhbSAge09iamVjdDNkfSAgICByb290ICAgIHJvb3QgT2JqZWN0M2QgZS5nLiBhIHNjZW5lIG9yIGEgbWVzaFxuICogQHBhcmFtICB7Li4uc3RyaW5nfSBuYW1lc0luIGxpc3Qgb2YgbmFtZXNkIHRvIGZpbmQgZS5nLiAnQ2FtZXJhJyBvciAnRmxvb3InXG4gKiBAcmV0dXJuIHtPYmplY3QgbWFwfSAgICAgICAgICBtYXAgb2YgbmFtZXMgdG8gb2JqZWN0cyB7J0NhbWVyYSc6IChUSFJFRS5DYW1lcmEgd2l0aCBuYW1lIENhbWVyYSksICdGbG9vcic6IChUSFJFRS5NZXNoIHdpdGggbmFtZSBGbG9vcil9XG4gKi9cbmZ1bmN0aW9uIHBpY2tPYmplY3RzSGVscGVyKHJvb3QsIC4uLm5hbWVzSW4pIHtcblxuXHRjb25zdCBjb2xsZWN0aW9uID0ge307XG5cdGNvbnN0IG5hbWVzID0gbmV3IFNldChuYW1lc0luKTtcblxuXHQoZnVuY3Rpb24gcGlja09iamVjdHMocm9vdCkge1xuXHRcdGlmIChyb290LmNoaWxkcmVuKSB7XG5cdFx0XHRyb290LmNoaWxkcmVuLmZvckVhY2gobm9kZSA9PiB7XG5cdFx0XHRcdGlmIChuYW1lcy5oYXMobm9kZS5uYW1lKSkge1xuXHRcdFx0XHRcdGNvbGxlY3Rpb25bbm9kZS5uYW1lXSA9IG5vZGU7XG5cdFx0XHRcdFx0bmFtZXMuZGVsZXRlKG5vZGUubmFtZSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKG5hbWVzLnNpemUpIHtcblx0XHRcdFx0XHRwaWNrT2JqZWN0cyhub2RlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9KShyb290KTtcblxuXHRpZiAobmFtZXMuc2l6ZSkge1xuXHRcdGNvbnNvbGUud2FybignTm90IGFsbCBvYmplY3RzIGZvdW5kOiAnICsgbmFtZXMudmFsdWVzKCkubmV4dCgpLnZhbHVlICsgJyBtaXNzaW5nJyk7XG5cdH1cblxuXHRyZXR1cm4gY29sbGVjdGlvbjtcbn1cblxuLyoqXG4gKiBMb2FkIHRoZSBzY2VuZSB3aXRoIGZpbGUgbmFtZSBpZCBhbmQgcmV0dXJuIHRoZSBoZWxwZXJcbiAqL1xuZnVuY3Rpb24gbXlUaHJlZUZyb21KU09OKGlkLCBvcHRpb25zKSB7XG5cdHJldHVybiBsb2FkU2NlbmUoaWQpLnRoZW4oc2NlbmUgPT4ge1xuXHRcdG9wdGlvbnMuc2NlbmUgPSBzY2VuZTtcblx0XHRyZXR1cm4gbmV3IE15VGhyZWVIZWxwZXIob3B0aW9ucyk7XG5cdH0pO1xufVxuXG4vKipcbiAqIEhlbHBlciBvYmplY3Qgd2l0aCBzb21lIHVzZWZ1bCB0aHJlZSBmdW5jdGlvbnNcbiAqIEBwYXJhbSBvcHRpb25zXG4gKiAgICAgICAgc2NlbmU6IHNjZW5lIHRvIHVzZSBmb3IgZGVmYXVsdFxuICogICAgICAgIHRhcmdldDogd2hlcmUgaW4gdGhlIGRvbSB0byBwdXQgdGhlIHJlbmRlcmVyXG4gKiAgICAgICAgY2FtZXJhOiBuYW1lIG9mIGNhbWVyYSB0byB1c2UgaW4gdGhlIHNjZW5lXG4gKi9cbmZ1bmN0aW9uIE15VGhyZWVIZWxwZXIob3B0aW9ucyl7XG5cblx0RXZlbnRFbWl0dGVyLmNhbGwodGhpcyk7XG5cblx0b3B0aW9ucy50YXJnZXQgPSBvcHRpb25zLnRhcmdldCB8fCBkb2N1bWVudC5ib2R5O1xuXG5cdGNvbnN0IHJlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoIHsgYW50aWFsaWFzOiBmYWxzZSB9ICk7XG5cdHJlbmRlcmVyLnNldFBpeGVsUmF0aW8oIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvICk7XG5cblx0b3B0aW9ucy50YXJnZXQuYXBwZW5kQ2hpbGQocmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cdHRoaXMuZG9tRWxlbWVudCA9IHJlbmRlcmVyLmRvbUVsZW1lbnQ7XG5cblxuXG5cdC8qKlxuXHQgKiBTZXQgdXAgc3RlcmVvIGVmZmVjdCByZW5kZXJlclxuXHQgKi9cblxuXHRjb25zdCBlZmZlY3QgPSBuZXcgVEhSRUUuU3RlcmVvRWZmZWN0KHJlbmRlcmVyKTtcblx0ZWZmZWN0LmV5ZVNlcGFyYXRpb24gPSAwLjAwODtcblx0ZWZmZWN0LmZvY2FsTGVuZ3RoID0gMC4yNTtcblx0ZWZmZWN0LnNldFNpemUoIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKTtcblx0dGhpcy5yZW5kZXJNZXRob2QgPSBlZmZlY3Q7XG5cblxuXG5cdC8qKlxuXHQgKiBTZXQgdXAgdGhlIHNjZW5lIHRvIGJlIHJlbmRlcmVkIG9yIGNyZWF0ZSBhIG5ldyBvbmVcblx0ICovXG5cblx0dGhpcy5zY2VuZSA9IG9wdGlvbnMuc2NlbmUgfHwgbmV3IFRIUkVFLlNjZW5lKCk7XG5cblxuXG5cdC8qKlxuXHQgKiBTZXQgdXAgY2FtZXJhIGVpdGhlciBvbmUgZnJvbSB0aGUgc2NlbmUgb3IgbWFrZSBhIG5ldyBvbmVcblx0ICovXG5cdFxuXHRsZXQgY2FtZXJhID0gb3B0aW9ucy5jYW1lcmEgPyBwaWNrT2JqZWN0c0hlbHBlcih0aGlzLnNjZW5lLCBvcHRpb25zLmNhbWVyYSkuQ2FtZXJhIDogdW5kZWZpbmVkO1xuXG5cdGlmICghY2FtZXJhKSB7XG5cdFx0Y29uc29sZS5sb2coY2FtZXJhKTtcblx0XHRjYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoIDc1LCBvcHRpb25zLnRhcmdldC5zY3JvbGxXaWR0aCAvIG9wdGlvbnMudGFyZ2V0LnNjcm9sbEhlaWdodCwgMC41LCAxMDAgKTtcblx0XHRjYW1lcmEucG9zaXRpb24uc2V0KDAsIDIsIDApO1xuXHRcdGNhbWVyYS5sb29rQXQobmV3IFRIUkVFLlZlY3RvcjMoMCwgY2FtZXJhLmhlaWdodCwgLTkpKTtcblx0XHRjYW1lcmEucm90YXRpb24ueSArPSBNYXRoLlBJO1xuXHR9XG5cdGNhbWVyYS5oZWlnaHQgPSBjYW1lcmEucG9zaXRpb24ueTsgLy8gcmVmZXJlbmNlIHZhbHVlIGZvciBob3cgaGlnaCB0aGUgY2FtZXJhIHNob3VsZCBiZVxuXHRcdFx0XHRcdFx0XHRcdFx0ICAgLy8gYWJvdmUgdGhlIGdyb3VuZCB0byBtYWludGFpbiB0aGUgaWxsdXNpb24gb2YgcHJlc2VuY2Vcblx0Y2FtZXJhLmZvdiA9IDc1O1xuXG5cdHRoaXMuY2FtZXJhID0gY2FtZXJhO1xuXG5cblxuXHQvKipcblx0ICogSGFuZGxlIHdpbmRvdyByZXNpemVzL3JvdGF0aW9uc1xuXHQgKi9cblxuXHRjb25zdCBzZXRBc3BlY3QgPSAoKSA9PiB7XG5cdFx0dGhpcy5yZW5kZXJNZXRob2Quc2V0U2l6ZSggb3B0aW9ucy50YXJnZXQuc2Nyb2xsV2lkdGgsIG9wdGlvbnMudGFyZ2V0LnNjcm9sbEhlaWdodCApO1xuXHRcdHRoaXMuY2FtZXJhLmFzcGVjdCA9IG9wdGlvbnMudGFyZ2V0LnNjcm9sbFdpZHRoIC8gb3B0aW9ucy50YXJnZXQuc2Nyb2xsSGVpZ2h0O1xuXHRcdHRoaXMuY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcblx0fTtcblx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHNldEFzcGVjdCk7XG5cdHNldEFzcGVjdCgpO1xuXG5cblxuXHQvKipcblx0ICogU2V0IHVwIGhlYWQgdHJhY2tpbmdcblx0ICovXG5cblx0IC8vIHByb3ZpZGUgZHVtbXkgZWxlbWVudCB0byBwcmV2ZW50IHRvdWNoL2NsaWNrIGhpamFja2luZy5cblx0Y29uc3QgZWxlbWVudCA9IGxvY2F0aW9uLmhvc3RuYW1lICE9PSAnbG9jYWxob3N0JyA/IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJESVZcIikgOiB1bmRlZmluZWQ7XG5cdHRoaXMuZGV2aWNlT3JpZW50YXRpb25Db250cm9sbGVyID0gbmV3IERldmljZU9yaWVudGF0aW9uQ29udHJvbGxlcih0aGlzLmNhbWVyYSwgZWxlbWVudCk7XG5cdHRoaXMuZGV2aWNlT3JpZW50YXRpb25Db250cm9sbGVyLmNvbm5lY3QoKTtcblx0dGhpcy5vbigncHJlcmVuZGVyJywgKCkgPT4gdGhpcy5kZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIudXBkYXRlKCkpO1xuXG5cblxuXHQvKipcblx0ICogVGhpcyBzaG91bGQgYmUgY2FsbGVkIGluIHRoZSBtYWluIGFuaW1hdGlvbiBsb29wXG5cdCAqL1xuXG5cdHRoaXMucmVuZGVyID0gKCkgPT4ge1xuXHRcdHRoaXMuZW1pdCgncHJlcmVuZGVyJyk7XG5cdFx0dGhpcy5yZW5kZXJNZXRob2QucmVuZGVyKHRoaXMuc2NlbmUsIGNhbWVyYSk7XG5cdFx0dGhpcy5lbWl0KCdwb3N0cmVuZGVyJyk7XG5cdH07XG5cblxuXG5cdC8qKlxuXHQgKiBIZWFkcyB1cCBEaXNwbGF5XG5cdCAqIFxuXHQgKiBBZGQgYSBoZWFkcyB1cCBkaXNwbGF5IG9iamVjdCB0byB0aGUgY2FtZXJhXG5cdCAqIE1lc2hlcyBhbmQgU3ByaXRlcyBjYW4gYmUgYWRkZWQgdG8gdGhpcyB0byBhcHBlYXIgdG8gYmUgY2xvc2UgdG8gdGhlIHVzZXIuXG5cdCAqL1xuXG5cdGNvbnN0IGh1ZCA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXHRodWQucG9zaXRpb24uc2V0KDAsIDAsIC0yLjEpO1xuXHRodWQuc2NhbGUuc2V0KDAuMiwgMC4yLCAwLjIpO1xuXHRjYW1lcmEuYWRkKGh1ZCk7XG5cdHRoaXMuc2NlbmUuYWRkKHRoaXMuY2FtZXJhKTsgLy8gYWRkIHRoZSBjYW1lcmEgdG8gdGhlIHNjZW5lIHNvIHRoYXQgdGhlIGh1ZCBpcyByZW5kZXJlZFxuXHR0aGlzLmh1ZCA9IGh1ZDtcblxuXG5cblxuXHQvKipcblx0ICogQU5JTUFUSU9OXG5cdCAqIFxuXHQgKiBBIG1hcCBvZiBwaHlzaWNzIG9iamVjdCBpZCB0byB0aHJlZS5qcyBvYmplY3QgM2Qgc28gd2UgY2FuIHVwZGF0ZSBhbGwgdGhlIHBvc2l0aW9uc1xuXHQgKi9cblxuXHRjb25zdCB0aHJlZU9iamVjdHNDb25uZWN0ZWRUb1BoeXNpY3MgPSB7fTtcblx0dGhpcy51cGRhdGVPYmplY3RzID0gcGh5c2ljc09iamVjdHMgPT4ge1xuXHRcdGNvbnN0IGwgPSBwaHlzaWNzT2JqZWN0cy5sZW5ndGg7XG5cblx0XHQvLyBpdGVyYXRlIG92ZXIgdGhlIHBoeXNpY3MgcGh5c2ljc09iamVjdHNcblx0XHRmb3IgKCBsZXQgaj0wOyBqPGw7aisrICkge1xuXG5cdFx0XHRjb25zdCBpID0gcGh5c2ljc09iamVjdHNbal07XG5cdFx0XHRpZiAodGhyZWVPYmplY3RzQ29ubmVjdGVkVG9QaHlzaWNzW2kuaWRdKSB7XG5cblx0XHRcdFx0Y29uc3QgbyA9IHRocmVlT2JqZWN0c0Nvbm5lY3RlZFRvUGh5c2ljc1tpLmlkXTtcblxuXHRcdFx0XHQvLyBTdXBwb3J0IG1hbmlwbGF0aW5nIGEgc2luZ2xlIHZlcnRleFxuXHRcdFx0XHRpZiAoby5jb25zdHJ1Y3RvciA9PT0gVEhSRUUuVmVjdG9yMykge1xuXHRcdFx0XHRcdG8uc2V0KGkucG9zaXRpb24ueCwgaS5wb3NpdGlvbi55LCBpLnBvc2l0aW9uLnopO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0by5wb3NpdGlvbi5zZXQoaS5wb3NpdGlvbi54LCBpLnBvc2l0aW9uLnksIGkucG9zaXRpb24ueik7XG5cblx0XHRcdFx0Ly8gUm90YXRpb25cblx0XHRcdFx0aWYgKGkucXVhdGVybmlvbikge1xuXHRcdFx0XHRcdG8ucm90YXRpb24uc2V0RnJvbVF1YXRlcm5pb24obmV3IFRIUkVFLlF1YXRlcm5pb24oaS5xdWF0ZXJuaW9uLngsIGkucXVhdGVybmlvbi55LCBpLnF1YXRlcm5pb24ueiwgaS5xdWF0ZXJuaW9uLncpKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHR0aGlzLmNvbm5lY3RQaHlzaWNzVG9UaHJlZSA9IChtZXNoLCBwaHlzaWNzTWVzaCkgPT4ge1xuXHRcdHRocmVlT2JqZWN0c0Nvbm5lY3RlZFRvUGh5c2ljc1twaHlzaWNzTWVzaC5pZF0gPSBtZXNoO1xuXHRcdGlmIChtZXNoLmNvbnN0cnVjdG9yID09PSBUSFJFRS5WZWN0b3IzKSByZXR1cm47XG5cdFx0dGhpcy5zY2VuZS5hZGQobWVzaCk7XG5cdH07XG5cblxuXG5cdC8qKlxuXHQgKiBNYWtlIHRoZSBvYmplY3QgcGlja2VyIGF2YWlsYWJsZSBvbiB0aGlzIG9iamVjdFxuXHQgKi9cblxuXHR0aGlzLnBpY2tPYmplY3RzSGVscGVyID0gcGlja09iamVjdHNIZWxwZXI7XG59XG51dGlsLmluaGVyaXRzKE15VGhyZWVIZWxwZXIsIEV2ZW50RW1pdHRlcik7XG5cbm1vZHVsZS5leHBvcnRzLk15VGhyZWVIZWxwZXIgPSBNeVRocmVlSGVscGVyO1xubW9kdWxlLmV4cG9ydHMubXlUaHJlZUZyb21KU09OID0gbXlUaHJlZUZyb21KU09OO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBteVdvcmtlciA9IG5ldyBXb3JrZXIoXCIuL3NjcmlwdHMvdmVybGV0d29ya2VyLmpzXCIpO1xuY29uc3QgbWVzc2FnZVF1ZXVlID0gW107XG5cbmZ1bmN0aW9uIHdvcmtlck1lc3NhZ2UobWVzc2FnZSkge1xuXG5cdGNvbnN0IGlkID0gRGF0ZS5ub3coKSArIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDApO1xuXG5cdC8vIFRoaXMgd3JhcHMgdGhlIG1lc3NhZ2UgcG9zdGluZy9yZXNwb25zZSBpbiBhIHByb21pc2UsIHdoaWNoIHdpbGwgcmVzb2x2ZSBpZiB0aGUgcmVzcG9uc2UgZG9lc24ndFxuXHQvLyBjb250YWluIGFuIGVycm9yLCBhbmQgcmVqZWN0IHdpdGggdGhlIGVycm9yIGlmIGl0IGRvZXMuIElmIHlvdSdkIHByZWZlciwgaXQncyBwb3NzaWJsZSB0byBjYWxsXG5cdC8vIGNvbnRyb2xsZXIucG9zdE1lc3NhZ2UoKSBhbmQgc2V0IHVwIHRoZSBvbm1lc3NhZ2UgaGFuZGxlciBpbmRlcGVuZGVudGx5IG9mIGEgcHJvbWlzZSwgYnV0IHRoaXMgaXNcblx0Ly8gYSBjb252ZW5pZW50IHdyYXBwZXIuXG5cdHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiB3b3JrZXJNZXNzYWdlUHJvbWlzZShyZXNvbHZlLCByZWplY3QpIHtcblx0XHRjb25zdCBkYXRhID0ge1xuXHRcdFx0aWQsXG5cdFx0XHRtZXNzYWdlLFxuXHRcdFx0cmVzb2x2ZSxcblx0XHRcdHJlamVjdFxuXHRcdH07XG5cdFx0bWVzc2FnZVF1ZXVlLnB1c2goZGF0YSk7XG5cdH0pO1xufVxuXG4vLyBQcm9jZXNzIG1lc3NhZ2VzIG9uY2UgcGVyIGZyYW1lXHRcbnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiBwcm9jZXNzKCkge1xuXHRpZiAobWVzc2FnZVF1ZXVlLmxlbmd0aCkge1xuXG5cdFx0Y29uc3QgZXh0cmFjdGVkTWVzc2FnZXMgPSBtZXNzYWdlUXVldWUuc3BsaWNlKDApO1xuXG5cdFx0Y29uc3QgbWVzc2FnZVRvU2VuZCA9IEpTT04uc3RyaW5naWZ5KGV4dHJhY3RlZE1lc3NhZ2VzLm1hcChpID0+IChcblx0XHRcdHsgbWVzc2FnZTogaS5tZXNzYWdlLCBpZDogaS5pZCB9XG5cdFx0KSkpO1xuXG5cdFx0Y29uc3QgbWVzc2FnZUNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcblx0XHRtZXNzYWdlQ2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jdGlvbiByZXNvbHZlTWVzc2FnZVByb21pc2UoZXZlbnQpIHtcblx0XHRcdG1lc3NhZ2VDaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IHVuZGVmaW5lZDtcblxuXHRcdFx0Ly8gSXRlcmF0ZSBvdmVyIHRoZSByZXNwb25zZXMgYW5kIHJlc29sdmUvcmVqZWN0IGFjY29yZGluZ2x5XG5cdFx0XHRjb25zdCByZXNwb25zZSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG5cdFx0XHRyZXNwb25zZS5mb3JFYWNoKChkLCBpKSA9PiB7XG5cdFx0XHRcdGlmIChleHRyYWN0ZWRNZXNzYWdlc1tpXS5pZCAhPT0gZC5pZCkge1xuXHRcdFx0XHRcdHRocm93IEVycm9yKCdJRCBNaXNtYXRjaCEhIScpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghZC5lcnJvcikge1xuXHRcdFx0XHRcdGV4dHJhY3RlZE1lc3NhZ2VzW2ldLnJlc29sdmUoZCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZXh0cmFjdGVkTWVzc2FnZXNbaV0ucmVqZWN0KGQuZXJyb3IpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdG15V29ya2VyLnBvc3RNZXNzYWdlKG1lc3NhZ2VUb1NlbmQsIFttZXNzYWdlQ2hhbm5lbC5wb3J0Ml0pO1xuXHR9XG5cdHJlcXVlc3RBbmltYXRpb25GcmFtZShwcm9jZXNzKTtcbn0pO1xuXG5jbGFzcyBWZXJsZXQge1xuXHRpbml0KG9wdGlvbnMpIHtcblx0XHRyZXR1cm4gd29ya2VyTWVzc2FnZSh7YWN0aW9uOiAnaW5pdCcsIG9wdGlvbnN9KTtcblx0fVxuXG5cdGdldFBvaW50cygpIHtcblx0XHRyZXR1cm4gd29ya2VyTWVzc2FnZSh7YWN0aW9uOiAnZ2V0UG9pbnRzJ30pXG5cdFx0XHQudGhlbihlID0+IGUucG9pbnRzKTtcblx0fVxuXG5cdGFkZFBvaW50KHBvaW50T3B0aW9ucykge1xuXHRcdHJldHVybiB3b3JrZXJNZXNzYWdlKHthY3Rpb246ICdhZGRQb2ludCcsIHBvaW50T3B0aW9uc30pO1xuXHR9XG5cblx0dXBkYXRlUG9pbnQocG9pbnRPcHRpb25zKSB7XG5cdFx0cmV0dXJuIHdvcmtlck1lc3NhZ2Uoe2FjdGlvbjogJ3VwZGF0ZVBvaW50JywgcG9pbnRPcHRpb25zfSk7XG5cdH1cblxuXHRjb25uZWN0UG9pbnRzKHAxLCBwMiwgY29uc3RyYWludE9wdGlvbnMpIHtcblx0XHRyZXR1cm4gd29ya2VyTWVzc2FnZSh7YWN0aW9uOiAnY29ubmVjdFBvaW50cycsIG9wdGlvbnM6IHtwMSwgcDIsIGNvbnN0cmFpbnRPcHRpb25zfX0pO1xuXHR9XG5cblx0dXBkYXRlQ29uc3RyYWludChvcHRpb25zKSB7XG5cdFx0cmV0dXJuIHdvcmtlck1lc3NhZ2Uoe2FjdGlvbjogJ3VwZGF0ZUNvbnN0cmFpbnQnLCBvcHRpb25zIH0pO1xuXHR9XG5cblx0cmVzZXQoKSB7XG5cdFx0cmV0dXJuIHdvcmtlck1lc3NhZ2Uoe2FjdGlvbjogJ3Jlc2V0J30pO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmVybGV0O1xuIiwiLypnbG9iYWwgVEhSRUUqL1xuJ3VzZSBzdHJpY3QnO1xuY29uc3QgYWRkU2NyaXB0ID0gcmVxdWlyZSgnLi9saWIvbG9hZFNjcmlwdCcpOyAvLyBQcm9taXNlIHdyYXBwZXIgZm9yIHNjcmlwdCBsb2FkaW5nXG5jb25zdCBWZXJsZXRXcmFwcGVyID0gcmVxdWlyZSgnLi9saWIvdmVybGV0d3JhcHBlcicpOyAvLyBXcmFwcGVyIG9mIHRoZSB2ZXJsZXQgd29ya2VyXG5jb25zdCB0ZXh0U3ByaXRlID0gcmVxdWlyZSgnLi9saWIvdGV4dFNwcml0ZScpOyAvLyBHZW5lcmFsbHkgc3ByaXRlcyBmcm9tIGNhbnZhc1xuY29uc3QgQ2FtZXJhSW50ZXJhY3Rpb25zID0gcmVxdWlyZSgnLi9saWIvY2FtZXJhaW50ZXJhY3Rpb25zJyk7IC8vIFRvb2wgZm9yIG1ha2luZyBpbnRlcmFjdGl2ZSBWUiBlbGVtZW50c1xuY29uc3QgVGV4dHVyZUFuaW1hdG9yID0gcmVxdWlyZSgnLi9saWIvdGV4dHVyZWFuaW1hdG9yJyk7XG5jb25zdCBUV0VFTiA9IHJlcXVpcmUoJ3R3ZWVuLmpzJyk7XG5cbi8vIG5vIGhzdHMgc28ganVzdCByZWRpcmVjdCB0byBodHRwc1xuaWYgKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCAhPT0gXCJodHRwczpcIiAmJiB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgIT09ICdsb2NhbGhvc3QnKSB7XG4gICB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPSBcImh0dHBzOlwiO1xufVxuXG5mdW5jdGlvbiBzZXJ2aWNlV29ya2VyKCkge1xuXG5cdHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkge1xuXG5cdFx0Ly8gU3RhcnQgc2VydmljZSB3b3JrZXJcblx0XHRpZiAoJ3NlcnZpY2VXb3JrZXInIGluIG5hdmlnYXRvcikge1xuXG5cdFx0XHRpZiAobmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIuY29udHJvbGxlcikge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnT2ZmbGluaW5nIEF2YWlsYmxlJyk7XG5cdFx0XHRcdHJlc29sdmUoKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcuL3N3LmpzJylcblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVnKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coJ3N3IHJlZ2lzdGVyZWQnLCByZWcpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQudGhlbihyZXNvbHZlKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc29sZS5lcnJvcignTm8gU2VydmljZSBXb3JrZXIsIGFzc2V0cyBtYXkgbm90IGJlIGNhY2hlZCcpO1xuXHRcdFx0cmVzb2x2ZSgpO1xuXHRcdH1cblx0fSk7XG59XG5cbnNlcnZpY2VXb3JrZXIoKVxuLnRoZW4oKCkgPT4gUHJvbWlzZS5hbGwoW1xuXHRhZGRTY3JpcHQoJ2h0dHBzOi8vcG9seWZpbGwud2Vic2VydmljZXMuZnQuY29tL3YxL3BvbHlmaWxsLm1pbi5qcz9mZWF0dXJlcz1mZXRjaCxkZWZhdWx0JyksXG5cdGFkZFNjcmlwdCgnaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvdGhyZWUuanMvcjczL3RocmVlLm1pbi5qcycpXG5dKSlcbi50aGVuKCgpID0+IFByb21pc2UuYWxsKFtcblx0YWRkU2NyaXB0KCdodHRwczovL2Nkbi5yYXdnaXQuY29tL21yZG9vYi90aHJlZS5qcy9tYXN0ZXIvZXhhbXBsZXMvanMvZWZmZWN0cy9TdGVyZW9FZmZlY3QuanMnKSxcblx0YWRkU2NyaXB0KCdodHRwczovL2Nkbi5yYXdnaXQuY29tL3JpY2h0ci90aHJlZVZSL21hc3Rlci9qcy9EZXZpY2VPcmllbnRhdGlvbkNvbnRyb2xsZXIuanMnKVxuXSkpXG4udGhlbigoKSA9PiByZXF1aXJlKCcuL2xpYi90aHJlZUhlbHBlcicpXG5cdC5teVRocmVlRnJvbUpTT04oJ0tpdGNoZW4vbGlja3RoZXdoaXNrJyxcblx0XHR7XG5cdFx0XHRjYW1lcmE6ICdDYW1lcmEnLFxuXHRcdFx0dGFyZ2V0OiBkb2N1bWVudC5ib2R5XG5cdFx0fVxuXHQpXG4pXG4udGhlbih0aHJlZUhlbHBlciA9PiB7XG5cdGNvbnNvbGUubG9nKCdSZWFkeScpO1xuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGV4dHVyZXMgdG8gQmFrZWQgb25lcyBhbmQgYWRkIGVudm1hcFxuXHQgKi9cblxuXHRjb25zdCB0ZXh0dXJlTG9hZGVyID0gbmV3IFRIUkVFLlRleHR1cmVMb2FkZXIoKTtcblx0Y29uc3QgY3ViZVRleHR1cmVMb2FkZXIgPSBuZXcgVEhSRUUuQ3ViZVRleHR1cmVMb2FkZXIoKTtcblxuXHQvLyBTZWxlY3Qgb2JqZWN0cyBmcm9tIHRoZSBzY2VuZSBmb3IgbGF0ZXIgcHJvY2Vzc2luZy5cblx0Y29uc3QgdG9UZXh0dXJlID0gdGhyZWVIZWxwZXIucGlja09iamVjdHNIZWxwZXIodGhyZWVIZWxwZXIuc2NlbmUsICdSb29tJywgJ0NvdW50ZXInLCAnQ2FrZScpO1xuXHRjb25zdCB0b1NoaW55ID0gdGhyZWVIZWxwZXIucGlja09iamVjdHNIZWxwZXIodGhyZWVIZWxwZXIuc2NlbmUsICdMaWNrVGhlV2hpc2snLCAnV2hpc2snLCAnU2F1Y2VQYW4nLCAnU2F1Y2VQYW4uMDAxJywgJ1NhdWNlUGFuLjAwMicsICdTYXVjZVBhbi4wMDMnLCAnRnJpZGdlJyk7XG5cdE9iamVjdC5rZXlzKHRvVGV4dHVyZSkuZm9yRWFjaChuYW1lID0+IHtcblx0XHR0ZXh0dXJlTG9hZGVyLmxvYWQoYG1vZGVscy9LaXRjaGVuLyR7bmFtZX1CYWtlLnBuZ2AsIG1hcCA9PiB0b1RleHR1cmVbbmFtZV0ubWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe21hcH0pKTtcblx0fSk7XG5cblx0Y29uc3QgcGF0aCA9IFwibW9kZWxzL0tpdGNoZW4vZW52bWFwL1wiO1xuXHRjb25zdCBmb3JtYXQgPSAnLnBuZyc7XG5cdGNvbnN0IHVybHMgPSBbXG5cdFx0cGF0aCArICcwMDA0JyArIGZvcm1hdCwgLy8gK3hcblx0XHRwYXRoICsgJzAwMDInICsgZm9ybWF0LCAvLyAteFxuXHRcdHBhdGggKyAnMDAwNicgKyBmb3JtYXQsIC8vICt5XG5cdFx0cGF0aCArICcwMDA1JyArIGZvcm1hdCwgLy8gLXlcblx0XHRwYXRoICsgJzAwMDEnICsgZm9ybWF0LCAvLyArelxuXHRcdHBhdGggKyAnMDAwMycgKyBmb3JtYXQgIC8vIC16XG5cdF07XG5cdGN1YmVUZXh0dXJlTG9hZGVyLmxvYWQodXJscywgZW52TWFwID0+IHtcblx0XHRjb25zdCBjb3BwZXIgPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoIHsgY29sb3I6IDB4OTlmZjk5LCBzcGVjdWxhcjogMHg3NzIyMjIsIGVudk1hcCwgY29tYmluZTogVEhSRUUuTWl4T3BlcmF0aW9uLCByZWZsZWN0aXZpdHk6IDAuMywgbWV0YWw6IHRydWV9ICk7XG5cdFx0Y29uc3QgYWx1bWluaXVtID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKCB7IGNvbG9yOiAweDg4ODg4OCwgc3BlY3VsYXI6IDB4OTk5OTk5LCBlbnZNYXAsIGNvbWJpbmU6IFRIUkVFLk1peE9wZXJhdGlvbiwgcmVmbGVjdGl2aXR5OiAwLjMsIG1ldGFsOiB0cnVlfSApO1xuXHRcdGNvbnN0IGNob2NvbGF0ZSA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCggeyBjb2xvcjogdG9TaGlueS5MaWNrVGhlV2hpc2subWF0ZXJpYWwuY29sb3IsIHNwZWN1bGFyOiAweDk5OTk5OSwgZW52TWFwLCBjb21iaW5lOiBUSFJFRS5NaXhPcGVyYXRpb24sIHJlZmxlY3Rpdml0eTogMC4zLCBtZXRhbDogdHJ1ZX0gKTtcblxuXHRcdHRvU2hpbnlbJ1NhdWNlUGFuJ10ubWF0ZXJpYWwgPSBjb3BwZXI7XG5cdFx0dG9TaGlueVsnU2F1Y2VQYW4uMDAxJ10ubWF0ZXJpYWwgPSBjb3BwZXI7XG5cdFx0dG9TaGlueVsnU2F1Y2VQYW4uMDAyJ10ubWF0ZXJpYWwgPSBjb3BwZXI7XG5cdFx0dG9TaGlueVsnU2F1Y2VQYW4uMDAzJ10ubWF0ZXJpYWwgPSBjb3BwZXI7XG5cdFx0dG9TaGlueS5XaGlzay5tYXRlcmlhbCA9IGFsdW1pbml1bTtcblx0XHR0b1NoaW55LkxpY2tUaGVXaGlzay5tYXRlcmlhbCA9IGNob2NvbGF0ZTtcblxuXHRcdHRleHR1cmVMb2FkZXIubG9hZChgbW9kZWxzL0tpdGNoZW4vRnJpZGdlQmFrZS5wbmdgLCBtYXAgPT4gdG9TaGlueS5GcmlkZ2UubWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoe21hcCwgZW52TWFwLCBjb21iaW5lOiBUSFJFRS5NaXhPcGVyYXRpb24sIHNwZWN1bGFyOiAweDk5OTk5OSwgcmVmbGVjdGl2aXR5OiAwLjMsIG1ldGFsOiB0cnVlLCBzaWRlOiBUSFJFRS5Eb3VibGVTaWRlIH0pKTtcblxuXHR9KTtcblxuXHQvLyBBbWJpYW50IGxpZ2h0XG5cdGNvbnN0IGFtYmllbnRMaWdodCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoIDB4Y2NjY2NjICk7XG5cdHRocmVlSGVscGVyLnNjZW5lLmFkZCggYW1iaWVudExpZ2h0ICk7XG5cblxuXG5cdC8qKlxuXHQgKiBBZGQgYSB0YXJnZXRpbmcgcmV0aWN1bGUgdG8gdGhlIEhVRCB0byBoZWxwIGFsaWduIHdoYXQgdGhlIHVzZXIgaXMgbG9va2luZyBhdFxuXHQgKiBBbHNvIGFkZCBhIGNpcmN1bGFyIHByb2dyZXNzIGJhci5cblx0ICovXG5cblx0dGV4dHVyZUxvYWRlci5sb2FkKFwiaW1hZ2VzL3JldGljdWxlLnBuZ1wiLCBtYXAgPT4ge1xuXHRcdGNvbnN0IG1hdGVyaWFsID0gbmV3IFRIUkVFLlNwcml0ZU1hdGVyaWFsKCB7IG1hcCwgZm9nOiBmYWxzZSwgdHJhbnNwYXJlbnQ6IHRydWUgfSApO1xuXHRcdGNvbnN0IHNwcml0ZSA9IG5ldyBUSFJFRS5TcHJpdGUobWF0ZXJpYWwpO1xuXHRcdHRocmVlSGVscGVyLmh1ZC5hZGQoc3ByaXRlKTtcblx0fSk7XG5cblxuXG5cdC8qKlxuXHQgKiBTZXQgdXAgaW50ZXJhY3Rpdml0eSBmcm9tIHRoZSBjYW1lcmEuXG5cdCAqL1xuXG5cdGNvbnN0IGNhbWVyYUludGVyYWN0aXZpdHlXb3JsZCA9IG5ldyBDYW1lcmFJbnRlcmFjdGlvbnModGhyZWVIZWxwZXIuZG9tRWxlbWVudCk7XG5cblx0dGhyZWVIZWxwZXIuZGV2aWNlT3JpZW50YXRpb25Db250cm9sbGVyXG5cdC5hZGRFdmVudExpc3RlbmVyKCd1c2VyaW50ZXJhY3Rpb25lbmQnLCBmdW5jdGlvbiAoKSB7XG5cdFx0Y2FtZXJhSW50ZXJhY3Rpdml0eVdvcmxkLmludGVyYWN0KHt0eXBlOiAnY2xpY2snfSk7XG5cdH0pO1xuXG5cblx0Ly8gUnVuIHRoZSB2ZXJsZXQgcGh5c2ljc1xuXHRjb25zdCB2ZXJsZXQgPSBuZXcgVmVybGV0V3JhcHBlcigpO1xuXHR2ZXJsZXQuaW5pdCh7XG5cdFx0c2l6ZToge1xuXHRcdFx0eDogMjAsXG5cdFx0XHR5OiAyMCxcblx0XHRcdHo6IDIwLFxuXHRcdH0sXG5cdFx0Z3Jhdml0eTogdHJ1ZVxuXHR9KVxuXHQudGhlbihmdW5jdGlvbiAoKSB7XG5cdFx0XG5cblxuXHRcdC8qKlxuXHRcdCAqIE1haW4gUmVuZGVyIExvb3Bcblx0XHQgKlxuXHRcdCAqIEVhY2ggcmVxdWVzdCBhbmltYXRpb24gZnJhbWUgcmVuZGVyIGlzIGNhbGxlZFxuXHRcdCAqIEFuZCBhIHJlcXVlc3QgaXMgbWFkZSB0byB0aGUgdmVybGV0IHBoeXNpY3Mgd29ya2VyXG5cdFx0ICogdG8gY2FsY3VsYXRlIGEgbmV3IGxvdCBvZiBwaHlzaWNzIGNhbGN1bGF0aW9ucyB0byB1cGRhdGVcblx0XHQgKiBvdXIgc2ltdWxhdGlvbi5cblx0XHQgKi9cblxuXHRcdGxldCB3YWl0aW5nRm9yUG9pbnRzID0gZmFsc2U7XG5cdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uIGFuaW1hdGUodGltZSkge1xuXHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKGFuaW1hdGUpO1xuXHRcdFx0Y2FtZXJhSW50ZXJhY3Rpdml0eVdvcmxkLmRldGVjdEludGVyYWN0aW9ucyh0aHJlZUhlbHBlci5jYW1lcmEpO1xuXG5cdFx0XHRpZiAoIXdhaXRpbmdGb3JQb2ludHMpIHtcblx0XHRcdFx0dmVybGV0LmdldFBvaW50cygpXG5cdFx0XHRcdC50aGVuKHRocmVlSGVscGVyLnVwZGF0ZU9iamVjdHMpXG5cdFx0XHRcdC50aGVuKCgpID0+IHdhaXRpbmdGb3JQb2ludHMgPSBmYWxzZSk7XG5cdFx0XHRcdHdhaXRpbmdGb3JQb2ludHMgPSB0cnVlO1xuXHRcdFx0fVxuXHRcdFx0VFdFRU4udXBkYXRlKCk7XG5cdFx0XHR0aHJlZUhlbHBlci5yZW5kZXIoKTtcblx0XHR9KTtcblxuXG5cblx0XHQvKipcblx0XHQgKiBBZGQgc29tZSBpbnRlcmFjdGl2aXR5XG5cdFx0ICovXG5cdFx0bGV0IGxvYWRlclNwcml0ZTtcblxuXHRcdHRleHR1cmVMb2FkZXIubG9hZChcImltYWdlcy9sb2FkZXIucG5nXCIsIG1hcCA9PiB7XG5cdFx0XHRjb25zdCB0QSA9IG5ldyBUZXh0dXJlQW5pbWF0b3IobWFwLCA4LCAxNiwgMTE2KTtcblx0XHRcdGNvbnN0IHRleHR1cmUgPSBuZXcgVEhSRUUuU3ByaXRlTWF0ZXJpYWwoIHsgbWFwLCBmb2c6IGZhbHNlLCB0cmFuc3BhcmVudDogdHJ1ZSB9ICk7XG5cdFx0XHRsb2FkZXJTcHJpdGUgPSBuZXcgVEhSRUUuU3ByaXRlKHRleHR1cmUpO1xuXHRcdFx0bG9hZGVyU3ByaXRlLmFuaW1hdG9yID0gdEE7XG5cdFx0XHRsb2FkZXJTcHJpdGUuc2NhbGUubXVsdGlwbHlTY2FsYXIoMC45KTtcblx0XHRcdHRocmVlSGVscGVyLm9uKCdwcmVyZW5kZXInLCAoKSA9PiB7XG5cdFx0XHRcdGlmIChsb2FkZXJTcHJpdGUudmlzaWJsZSkgdEEudXBkYXRlKCk7XG5cdFx0XHR9KTtcblx0XHRcdHRocmVlSGVscGVyLmh1ZC5hZGQobG9hZGVyU3ByaXRlKTtcblx0XHRcdGxvYWRlclNwcml0ZS52aXNpYmxlID0gZmFsc2U7XG5cdFx0fSk7XG5cblx0XHRmdW5jdGlvbiBzaG93TG9hZGVyKGNhbGxiYWNrKSB7XG5cdFx0XHRpZiAoIWxvYWRlclNwcml0ZSkgcmV0dXJuO1xuXHRcdFx0bG9hZGVyU3ByaXRlLmFuaW1hdG9yLmN1cnJlbnRUaWxlID0gMDtcblx0XHRcdGxvYWRlclNwcml0ZS52aXNpYmxlID0gdHJ1ZTtcblx0XHRcdGxvYWRlclNwcml0ZS5hbmltYXRvci5vbignZmluaXNoJywgKCkgPT4ge1xuXHRcdFx0XHRoaWRlTG9hZGVyKCk7XG5cdFx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBoaWRlTG9hZGVyKCkge1xuXHRcdFx0aWYgKCFsb2FkZXJTcHJpdGUpIHJldHVybjtcblx0XHRcdGxvYWRlclNwcml0ZS52aXNpYmxlID0gZmFsc2U7XG5cdFx0XHRsb2FkZXJTcHJpdGUuYW5pbWF0b3Iub2ZmKCdmaW5pc2gnKTtcblx0XHR9XG5cblx0XHRjb25zdCBpbnRlcmFjdGl2ZUVsZW1lbnRzID0gdGhyZWVIZWxwZXIucGlja09iamVjdHNIZWxwZXIodGhyZWVIZWxwZXIuc2NlbmUsICdMZWZ0QXJyb3cnLCAnUmlnaHRBcnJvdycpO1xuXHRcdE9iamVjdC5rZXlzKGludGVyYWN0aXZlRWxlbWVudHMpLmZvckVhY2gobmFtZSA9PiB7XG5cdFx0XHRjb25zdCBpRWwgPSBjYW1lcmFJbnRlcmFjdGl2aXR5V29ybGQubWFrZVRhcmdldChpbnRlcmFjdGl2ZUVsZW1lbnRzW25hbWVdKTtcblx0XHRcdGludGVyYWN0aXZlRWxlbWVudHNbbmFtZV0gPSBpRWw7XG5cdFx0XHRjb25zdCBuZXdTY2FsZSA9IGlFbC5vYmplY3QzZC5zY2FsZS54ICogMS4xO1xuXHRcdFx0Y29uc3QgdHdlZW4gPSBuZXcgVFdFRU4uVHdlZW4oaUVsLm9iamVjdDNkLnNjYWxlKVxuXHRcdFx0XHQudG8oe3g6IG5ld1NjYWxlLCB5OiBuZXdTY2FsZSwgejogbmV3U2NhbGUgfSwgNDAwKVxuXHRcdFx0XHQucmVwZWF0KEluZmluaXR5KTtcblxuXHRcdFx0aUVsLm9uKCdob3ZlclN0YXJ0JywgKCkgPT4ge1xuXHRcdFx0XHRzaG93TG9hZGVyKCgpID0+IGlFbC5lbWl0KCdjbGljaycpKTtcblx0XHRcdFx0dHdlZW4ueW95bygpLnN0YXJ0KCk7XG5cdFx0XHR9KTtcblx0XHRcdGlFbC5vbignaG92ZXJPdXQnLCAoKSA9PiB7XG5cdFx0XHRcdGhpZGVMb2FkZXIoKTtcblx0XHRcdFx0dHdlZW4uc3RvcCgpO1xuXHRcdFx0fSk7XG5cdFx0XHRpRWwub24oJ2NsaWNrJywgaGlkZUxvYWRlcik7XG5cblx0XHR9KTtcblxuXG5cdH0pO1xufSk7XG4iLCJpZiAodHlwZW9mIE9iamVjdC5jcmVhdGUgPT09ICdmdW5jdGlvbicpIHtcbiAgLy8gaW1wbGVtZW50YXRpb24gZnJvbSBzdGFuZGFyZCBub2RlLmpzICd1dGlsJyBtb2R1bGVcbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpbmhlcml0cyhjdG9yLCBzdXBlckN0b3IpIHtcbiAgICBjdG9yLnN1cGVyXyA9IHN1cGVyQ3RvclxuICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckN0b3IucHJvdG90eXBlLCB7XG4gICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICB2YWx1ZTogY3RvcixcbiAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICB2YXIgVGVtcEN0b3IgPSBmdW5jdGlvbiAoKSB7fVxuICAgIFRlbXBDdG9yLnByb3RvdHlwZSA9IHN1cGVyQ3Rvci5wcm90b3R5cGVcbiAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjdG9yXG4gIH1cbn1cbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc0J1ZmZlcihhcmcpIHtcbiAgcmV0dXJuIGFyZyAmJiB0eXBlb2YgYXJnID09PSAnb2JqZWN0J1xuICAgICYmIHR5cGVvZiBhcmcuY29weSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcuZmlsbCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICYmIHR5cGVvZiBhcmcucmVhZFVJbnQ4ID09PSAnZnVuY3Rpb24nO1xufSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZm9ybWF0UmVnRXhwID0gLyVbc2RqJV0vZztcbmV4cG9ydHMuZm9ybWF0ID0gZnVuY3Rpb24oZikge1xuICBpZiAoIWlzU3RyaW5nKGYpKSB7XG4gICAgdmFyIG9iamVjdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgb2JqZWN0cy5wdXNoKGluc3BlY3QoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICAgIHJldHVybiBvYmplY3RzLmpvaW4oJyAnKTtcbiAgfVxuXG4gIHZhciBpID0gMTtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHZhciBsZW4gPSBhcmdzLmxlbmd0aDtcbiAgdmFyIHN0ciA9IFN0cmluZyhmKS5yZXBsYWNlKGZvcm1hdFJlZ0V4cCwgZnVuY3Rpb24oeCkge1xuICAgIGlmICh4ID09PSAnJSUnKSByZXR1cm4gJyUnO1xuICAgIGlmIChpID49IGxlbikgcmV0dXJuIHg7XG4gICAgc3dpdGNoICh4KSB7XG4gICAgICBjYXNlICclcyc6IHJldHVybiBTdHJpbmcoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVkJzogcmV0dXJuIE51bWJlcihhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWonOlxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShhcmdzW2krK10pO1xuICAgICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgICAgcmV0dXJuICdbQ2lyY3VsYXJdJztcbiAgICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICB9KTtcbiAgZm9yICh2YXIgeCA9IGFyZ3NbaV07IGkgPCBsZW47IHggPSBhcmdzWysraV0pIHtcbiAgICBpZiAoaXNOdWxsKHgpIHx8ICFpc09iamVjdCh4KSkge1xuICAgICAgc3RyICs9ICcgJyArIHg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciArPSAnICcgKyBpbnNwZWN0KHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufTtcblxuXG4vLyBNYXJrIHRoYXQgYSBtZXRob2Qgc2hvdWxkIG5vdCBiZSB1c2VkLlxuLy8gUmV0dXJucyBhIG1vZGlmaWVkIGZ1bmN0aW9uIHdoaWNoIHdhcm5zIG9uY2UgYnkgZGVmYXVsdC5cbi8vIElmIC0tbm8tZGVwcmVjYXRpb24gaXMgc2V0LCB0aGVuIGl0IGlzIGEgbm8tb3AuXG5leHBvcnRzLmRlcHJlY2F0ZSA9IGZ1bmN0aW9uKGZuLCBtc2cpIHtcbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKGlzVW5kZWZpbmVkKGdsb2JhbC5wcm9jZXNzKSkge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICBpZiAocHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgdmFyIHdhcm5lZCA9IGZhbHNlO1xuICBmdW5jdGlvbiBkZXByZWNhdGVkKCkge1xuICAgIGlmICghd2FybmVkKSB7XG4gICAgICBpZiAocHJvY2Vzcy50aHJvd0RlcHJlY2F0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihtc2cpO1xuICAgICAgfSBlbHNlIGlmIChwcm9jZXNzLnRyYWNlRGVwcmVjYXRpb24pIHtcbiAgICAgICAgY29uc29sZS50cmFjZShtc2cpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgfVxuICAgICAgd2FybmVkID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH1cblxuICByZXR1cm4gZGVwcmVjYXRlZDtcbn07XG5cblxudmFyIGRlYnVncyA9IHt9O1xudmFyIGRlYnVnRW52aXJvbjtcbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKGRlYnVnRW52aXJvbikpXG4gICAgZGVidWdFbnZpcm9uID0gcHJvY2Vzcy5lbnYuTk9ERV9ERUJVRyB8fCAnJztcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAobmV3IFJlZ0V4cCgnXFxcXGInICsgc2V0ICsgJ1xcXFxiJywgJ2knKS50ZXN0KGRlYnVnRW52aXJvbikpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc3Vic3RyKDIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0ciA9ICdcXG4nICsgc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0NpcmN1bGFyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmIChpc1VuZGVmaW5lZChuYW1lKSkge1xuICAgIGlmIChhcnJheSAmJiBrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICByZXR1cm4gc3RyO1xuICAgIH1cbiAgICBuYW1lID0gSlNPTi5zdHJpbmdpZnkoJycgKyBrZXkpO1xuICAgIGlmIChuYW1lLm1hdGNoKC9eXCIoW2EtekEtWl9dW2EtekEtWl8wLTldKilcIiQvKSkge1xuICAgICAgbmFtZSA9IG5hbWUuc3Vic3RyKDEsIG5hbWUubGVuZ3RoIC0gMik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZnVuY3Rpb24gaXNBcnJheShhcikge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhcik7XG59XG5leHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnYm9vbGVhbic7XG59XG5leHBvcnRzLmlzQm9vbGVhbiA9IGlzQm9vbGVhbjtcblxuZnVuY3Rpb24gaXNOdWxsKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGwgPSBpc051bGw7XG5cbmZ1bmN0aW9uIGlzTnVsbE9yVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbE9yVW5kZWZpbmVkID0gaXNOdWxsT3JVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLmlzTnVtYmVyID0gaXNOdW1iZXI7XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG59XG5leHBvcnRzLmlzU3RyaW5nID0gaXNTdHJpbmc7XG5cbmZ1bmN0aW9uIGlzU3ltYm9sKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCc7XG59XG5leHBvcnRzLmlzU3ltYm9sID0gaXNTeW1ib2w7XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGFyZykge1xuICByZXR1cm4gYXJnID09PSB2b2lkIDA7XG59XG5leHBvcnRzLmlzVW5kZWZpbmVkID0gaXNVbmRlZmluZWQ7XG5cbmZ1bmN0aW9uIGlzUmVnRXhwKHJlKSB7XG4gIHJldHVybiBpc09iamVjdChyZSkgJiYgb2JqZWN0VG9TdHJpbmcocmUpID09PSAnW29iamVjdCBSZWdFeHBdJztcbn1cbmV4cG9ydHMuaXNSZWdFeHAgPSBpc1JlZ0V4cDtcblxuZnVuY3Rpb24gaXNPYmplY3QoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyAmJiBhcmcgIT09IG51bGw7XG59XG5leHBvcnRzLmlzT2JqZWN0ID0gaXNPYmplY3Q7XG5cbmZ1bmN0aW9uIGlzRGF0ZShkKSB7XG4gIHJldHVybiBpc09iamVjdChkKSAmJiBvYmplY3RUb1N0cmluZyhkKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xufVxuZXhwb3J0cy5pc0RhdGUgPSBpc0RhdGU7XG5cbmZ1bmN0aW9uIGlzRXJyb3IoZSkge1xuICByZXR1cm4gaXNPYmplY3QoZSkgJiZcbiAgICAgIChvYmplY3RUb1N0cmluZyhlKSA9PT0gJ1tvYmplY3QgRXJyb3JdJyB8fCBlIGluc3RhbmNlb2YgRXJyb3IpO1xufVxuZXhwb3J0cy5pc0Vycm9yID0gaXNFcnJvcjtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5leHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc1ByaW1pdGl2ZShhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbCB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnbnVtYmVyJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N0cmluZycgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnIHx8ICAvLyBFUzYgc3ltYm9sXG4gICAgICAgICB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbn1cbmV4cG9ydHMuaXNQcmltaXRpdmUgPSBpc1ByaW1pdGl2ZTtcblxuZXhwb3J0cy5pc0J1ZmZlciA9IHJlcXVpcmUoJy4vc3VwcG9ydC9pc0J1ZmZlcicpO1xuXG5mdW5jdGlvbiBvYmplY3RUb1N0cmluZyhvKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobyk7XG59XG5cblxuZnVuY3Rpb24gcGFkKG4pIHtcbiAgcmV0dXJuIG4gPCAxMCA/ICcwJyArIG4udG9TdHJpbmcoMTApIDogbi50b1N0cmluZygxMCk7XG59XG5cblxudmFyIG1vbnRocyA9IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLFxuICAgICAgICAgICAgICAnT2N0JywgJ05vdicsICdEZWMnXTtcblxuLy8gMjYgRmViIDE2OjE5OjM0XG5mdW5jdGlvbiB0aW1lc3RhbXAoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKTtcbiAgdmFyIHRpbWUgPSBbcGFkKGQuZ2V0SG91cnMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldE1pbnV0ZXMoKSksXG4gICAgICAgICAgICAgIHBhZChkLmdldFNlY29uZHMoKSldLmpvaW4oJzonKTtcbiAgcmV0dXJuIFtkLmdldERhdGUoKSwgbW9udGhzW2QuZ2V0TW9udGgoKV0sIHRpbWVdLmpvaW4oJyAnKTtcbn1cblxuXG4vLyBsb2cgaXMganVzdCBhIHRoaW4gd3JhcHBlciB0byBjb25zb2xlLmxvZyB0aGF0IHByZXBlbmRzIGEgdGltZXN0YW1wXG5leHBvcnRzLmxvZyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnJXMgLSAlcycsIHRpbWVzdGFtcCgpLCBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpKTtcbn07XG5cblxuLyoqXG4gKiBJbmhlcml0IHRoZSBwcm90b3R5cGUgbWV0aG9kcyBmcm9tIG9uZSBjb25zdHJ1Y3RvciBpbnRvIGFub3RoZXIuXG4gKlxuICogVGhlIEZ1bmN0aW9uLnByb3RvdHlwZS5pbmhlcml0cyBmcm9tIGxhbmcuanMgcmV3cml0dGVuIGFzIGEgc3RhbmRhbG9uZVxuICogZnVuY3Rpb24gKG5vdCBvbiBGdW5jdGlvbi5wcm90b3R5cGUpLiBOT1RFOiBJZiB0aGlzIGZpbGUgaXMgdG8gYmUgbG9hZGVkXG4gKiBkdXJpbmcgYm9vdHN0cmFwcGluZyB0aGlzIGZ1bmN0aW9uIG5lZWRzIHRvIGJlIHJld3JpdHRlbiB1c2luZyBzb21lIG5hdGl2ZVxuICogZnVuY3Rpb25zIGFzIHByb3RvdHlwZSBzZXR1cCB1c2luZyBub3JtYWwgSmF2YVNjcmlwdCBkb2VzIG5vdCB3b3JrIGFzXG4gKiBleHBlY3RlZCBkdXJpbmcgYm9vdHN0cmFwcGluZyAoc2VlIG1pcnJvci5qcyBpbiByMTE0OTAzKS5cbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHdoaWNoIG5lZWRzIHRvIGluaGVyaXQgdGhlXG4gKiAgICAgcHJvdG90eXBlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gc3VwZXJDdG9yIENvbnN0cnVjdG9yIGZ1bmN0aW9uIHRvIGluaGVyaXQgcHJvdG90eXBlIGZyb20uXG4gKi9cbmV4cG9ydHMuaW5oZXJpdHMgPSByZXF1aXJlKCdpbmhlcml0cycpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIHByb3RvY2xhc3MgPSByZXF1aXJlKFwicHJvdG9jbGFzc1wiKTtcblxuLyoqXG4gKiBAbW9kdWxlIG1vam9cbiAqIEBzdWJtb2R1bGUgbW9qby1jb3JlXG4gKi9cblxuLyoqXG4gKiBAY2xhc3MgRXZlbnRFbWl0dGVyXG4gKi9cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyICgpIHtcbiAgdGhpcy5fX2V2ZW50cyA9IHt9O1xufVxuXG4vKipcbiAqIGFkZHMgYSBsaXN0ZW5lciBvbiB0aGUgZXZlbnQgZW1pdHRlclxuICpcbiAqIEBtZXRob2Qgb25cbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudCB0byBsaXN0ZW4gb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIHRvIGNhbGxiYWNrIHdoZW4gYGV2ZW50YCBpcyBlbWl0dGVkLlxuICogQHJldHVybnMge0Rpc3Bvc2FibGV9XG4gKi9cblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50LCBsaXN0ZW5lcikge1xuXG4gIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcImxpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbiBmb3IgZXZlbnQgJ1wiK2V2ZW50K1wiJ1wiKTtcbiAgfVxuXG4gIHZhciBsaXN0ZW5lcnM7XG4gIGlmICghKGxpc3RlbmVycyA9IHRoaXMuX19ldmVudHNbZXZlbnRdKSkge1xuICAgIHRoaXMuX19ldmVudHNbZXZlbnRdID0gbGlzdGVuZXI7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGxpc3RlbmVycyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhpcy5fX2V2ZW50c1tldmVudF0gPSBbbGlzdGVuZXJzLCBsaXN0ZW5lcl07XG4gIH0gZWxzZSB7XG4gICAgbGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICB9XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHJldHVybiB7XG4gICAgZGlzcG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLm9mZihldmVudCwgbGlzdGVuZXIpO1xuICAgIH1cbiAgfTtcbn07XG5cbi8qKlxuICogcmVtb3ZlcyBhbiBldmVudCBlbWl0dGVyXG4gKiBAbWV0aG9kIG9mZlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IHRvIHJlbW92ZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgdG8gcmVtb3ZlXG4gKi9cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmYgPSBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG5cbiAgdmFyIGxpc3RlbmVycztcblxuICBpZighKGxpc3RlbmVycyA9IHRoaXMuX19ldmVudHNbZXZlbnRdKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICB0aGlzLl9fZXZlbnRzW2V2ZW50XSA9IHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICB2YXIgaSA9IGxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAofmkpIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgaWYgKCFsaXN0ZW5lcnMubGVuZ3RoKSB7XG4gICAgICB0aGlzLl9fZXZlbnRzW2V2ZW50XSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbn07XG5cbi8qKlxuICogYWRkcyBhIGxpc3RlbmVyIG9uIHRoZSBldmVudCBlbWl0dGVyXG4gKiBAbWV0aG9kIG9uY2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudCB0byBsaXN0ZW4gb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIHRvIGNhbGxiYWNrIHdoZW4gYGV2ZW50YCBpcyBlbWl0dGVkLlxuICogQHJldHVybnMge0Rpc3Bvc2FibGV9XG4gKi9cblxuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG5cbiAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwibGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uIGZvciBldmVudCAnXCIrZXZlbnQrXCInXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gbGlzdGVuZXIyICgpIHtcbiAgICBkaXNwLmRpc3Bvc2UoKTtcbiAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgdmFyIGRpc3AgPSB0aGlzLm9uKGV2ZW50LCBsaXN0ZW5lcjIpO1xuICBkaXNwLnRhcmdldCA9IHRoaXM7XG4gIHJldHVybiBkaXNwO1xufTtcblxuLyoqXG4gKiBlbWl0cyBhbiBldmVudFxuICogQG1ldGhvZCBlbWl0XG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7U3RyaW5nfSwgYGRhdGEuLi5gIGRhdGEgdG8gZW1pdFxuICovXG5cblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG5cbiAgaWYgKHRoaXMuX19ldmVudHNbZXZlbnRdID09PSB1bmRlZmluZWQpIHJldHVybjtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fX2V2ZW50c1tldmVudF0sXG4gIG4gPSBhcmd1bWVudHMubGVuZ3RoLFxuICBhcmdzLFxuICBpLFxuICBqO1xuXG4gIGlmICh0eXBlb2YgbGlzdGVuZXJzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBpZiAobiA9PT0gMSkge1xuICAgICAgbGlzdGVuZXJzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN3aXRjaChuKSB7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBsaXN0ZW5lcnMoYXJndW1lbnRzWzFdKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIGxpc3RlbmVycyhhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBsaXN0ZW5lcnMoYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0sIGFyZ3VtZW50c1szXSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgYXJncyA9IG5ldyBBcnJheShuIC0gMSk7XG4gICAgICAgICAgZm9yKGkgPSAxOyBpIDwgbjsgaSsrKSBhcmdzW2ktMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgbGlzdGVuZXJzLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfVxuICB9IGVsc2Uge1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobiAtIDEpO1xuICAgIGZvcihpID0gMTsgaSA8IG47IGkrKykgYXJnc1tpLTFdID0gYXJndW1lbnRzW2ldO1xuICAgIGZvcihqID0gbGlzdGVuZXJzLmxlbmd0aDsgai0tOykge1xuICAgICAgaWYobGlzdGVuZXJzW2pdKSBsaXN0ZW5lcnNbal0uYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIHJlbW92ZXMgYWxsIGxpc3RlbmVyc1xuICogQG1ldGhvZCByZW1vdmVBbGxMaXN0ZW5lcnNcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCAob3B0aW9uYWwpIHJlbW92ZXMgYWxsIGxpc3RlbmVycyBvZiBgZXZlbnRgLiBPbWl0dGluZyB3aWxsIHJlbW92ZSBldmVyeXRoaW5nLlxuICovXG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgdGhpcy5fX2V2ZW50c1tldmVudF0gPSB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fX2V2ZW50cyA9IHt9O1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcbiIsImZ1bmN0aW9uIF9jb3B5ICh0bywgZnJvbSkge1xuXG4gIGZvciAodmFyIGkgPSAwLCBuID0gZnJvbS5sZW5ndGg7IGkgPCBuOyBpKyspIHtcblxuICAgIHZhciB0YXJnZXQgPSBmcm9tW2ldO1xuXG4gICAgZm9yICh2YXIgcHJvcGVydHkgaW4gdGFyZ2V0KSB7XG4gICAgICB0b1twcm9wZXJ0eV0gPSB0YXJnZXRbcHJvcGVydHldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0bztcbn1cblxuZnVuY3Rpb24gcHJvdG9jbGFzcyAocGFyZW50LCBjaGlsZCkge1xuXG4gIHZhciBtaXhpbnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuXG4gIGlmICh0eXBlb2YgY2hpbGQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgIGlmKGNoaWxkKSBtaXhpbnMudW5zaGlmdChjaGlsZCk7IC8vIGNvbnN0cnVjdG9yIGlzIGEgbWl4aW5cbiAgICBjaGlsZCAgID0gcGFyZW50O1xuICAgIHBhcmVudCAgPSBmdW5jdGlvbigpIHsgfTtcbiAgfVxuXG4gIF9jb3B5KGNoaWxkLCBwYXJlbnQpOyBcblxuICBmdW5jdGlvbiBjdG9yICgpIHtcbiAgICB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gIH1cblxuICBjdG9yLnByb3RvdHlwZSAgPSBwYXJlbnQucHJvdG90eXBlO1xuICBjaGlsZC5wcm90b3R5cGUgPSBuZXcgY3RvcigpO1xuICBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlO1xuICBjaGlsZC5wYXJlbnQgICAgPSBjaGlsZC5zdXBlcmNsYXNzID0gcGFyZW50O1xuXG4gIF9jb3B5KGNoaWxkLnByb3RvdHlwZSwgbWl4aW5zKTtcblxuICBwcm90b2NsYXNzLnNldHVwKGNoaWxkKTtcblxuICByZXR1cm4gY2hpbGQ7XG59XG5cbnByb3RvY2xhc3Muc2V0dXAgPSBmdW5jdGlvbiAoY2hpbGQpIHtcblxuXG4gIGlmICghY2hpbGQuZXh0ZW5kKSB7XG4gICAgY2hpbGQuZXh0ZW5kID0gZnVuY3Rpb24oY29uc3RydWN0b3IpIHtcblxuICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDApO1xuXG4gICAgICBpZiAodHlwZW9mIGNvbnN0cnVjdG9yICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgYXJncy51bnNoaWZ0KGNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGNvbnN0cnVjdG9yLnBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHByb3RvY2xhc3MuYXBwbHkodGhpcywgW3RoaXNdLmNvbmNhdChhcmdzKSk7XG4gICAgfVxuXG4gICAgY2hpbGQubWl4aW4gPSBmdW5jdGlvbihwcm90bykge1xuICAgICAgX2NvcHkodGhpcy5wcm90b3R5cGUsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgY2hpbGQuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG9iaiA9IE9iamVjdC5jcmVhdGUoY2hpbGQucHJvdG90eXBlKTtcbiAgICAgIGNoaWxkLmFwcGx5KG9iaiwgYXJndW1lbnRzKTtcbiAgICAgIHJldHVybiBvYmo7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNoaWxkO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gcHJvdG9jbGFzczsiLCIvKipcbiAqIFR3ZWVuLmpzIC0gTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKiBodHRwczovL2dpdGh1Yi5jb20vdHdlZW5qcy90d2Vlbi5qc1xuICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICpcbiAqIFNlZSBodHRwczovL2dpdGh1Yi5jb20vdHdlZW5qcy90d2Vlbi5qcy9ncmFwaHMvY29udHJpYnV0b3JzIGZvciB0aGUgZnVsbCBsaXN0IG9mIGNvbnRyaWJ1dG9ycy5cbiAqIFRoYW5rIHlvdSBhbGwsIHlvdSdyZSBhd2Vzb21lIVxuICovXG5cbi8vIEluY2x1ZGUgYSBwZXJmb3JtYW5jZS5ub3cgcG9seWZpbGxcbihmdW5jdGlvbiAoKSB7XG5cblx0aWYgKCdwZXJmb3JtYW5jZScgaW4gd2luZG93ID09PSBmYWxzZSkge1xuXHRcdHdpbmRvdy5wZXJmb3JtYW5jZSA9IHt9O1xuXHR9XG5cblx0Ly8gSUUgOFxuXHREYXRlLm5vdyA9IChEYXRlLm5vdyB8fCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuXHR9KTtcblxuXHRpZiAoJ25vdycgaW4gd2luZG93LnBlcmZvcm1hbmNlID09PSBmYWxzZSkge1xuXHRcdHZhciBvZmZzZXQgPSB3aW5kb3cucGVyZm9ybWFuY2UudGltaW5nICYmIHdpbmRvdy5wZXJmb3JtYW5jZS50aW1pbmcubmF2aWdhdGlvblN0YXJ0ID8gd2luZG93LnBlcmZvcm1hbmNlLnRpbWluZy5uYXZpZ2F0aW9uU3RhcnRcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IERhdGUubm93KCk7XG5cblx0XHR3aW5kb3cucGVyZm9ybWFuY2Uubm93ID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIERhdGUubm93KCkgLSBvZmZzZXQ7XG5cdFx0fTtcblx0fVxuXG59KSgpO1xuXG52YXIgVFdFRU4gPSBUV0VFTiB8fCAoZnVuY3Rpb24gKCkge1xuXG5cdHZhciBfdHdlZW5zID0gW107XG5cblx0cmV0dXJuIHtcblxuXHRcdGdldEFsbDogZnVuY3Rpb24gKCkge1xuXG5cdFx0XHRyZXR1cm4gX3R3ZWVucztcblxuXHRcdH0sXG5cblx0XHRyZW1vdmVBbGw6IGZ1bmN0aW9uICgpIHtcblxuXHRcdFx0X3R3ZWVucyA9IFtdO1xuXG5cdFx0fSxcblxuXHRcdGFkZDogZnVuY3Rpb24gKHR3ZWVuKSB7XG5cblx0XHRcdF90d2VlbnMucHVzaCh0d2Vlbik7XG5cblx0XHR9LFxuXG5cdFx0cmVtb3ZlOiBmdW5jdGlvbiAodHdlZW4pIHtcblxuXHRcdFx0dmFyIGkgPSBfdHdlZW5zLmluZGV4T2YodHdlZW4pO1xuXG5cdFx0XHRpZiAoaSAhPT0gLTEpIHtcblx0XHRcdFx0X3R3ZWVucy5zcGxpY2UoaSwgMSk7XG5cdFx0XHR9XG5cblx0XHR9LFxuXG5cdFx0dXBkYXRlOiBmdW5jdGlvbiAodGltZSkge1xuXG5cdFx0XHRpZiAoX3R3ZWVucy5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgaSA9IDA7XG5cblx0XHRcdHRpbWUgPSB0aW1lICE9PSB1bmRlZmluZWQgPyB0aW1lIDogd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuXG5cdFx0XHR3aGlsZSAoaSA8IF90d2VlbnMubGVuZ3RoKSB7XG5cblx0XHRcdFx0aWYgKF90d2VlbnNbaV0udXBkYXRlKHRpbWUpKSB7XG5cdFx0XHRcdFx0aSsrO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdF90d2VlbnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0XHR9XG5cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cblx0XHR9XG5cdH07XG5cbn0pKCk7XG5cblRXRUVOLlR3ZWVuID0gZnVuY3Rpb24gKG9iamVjdCkge1xuXG5cdHZhciBfb2JqZWN0ID0gb2JqZWN0O1xuXHR2YXIgX3ZhbHVlc1N0YXJ0ID0ge307XG5cdHZhciBfdmFsdWVzRW5kID0ge307XG5cdHZhciBfdmFsdWVzU3RhcnRSZXBlYXQgPSB7fTtcblx0dmFyIF9kdXJhdGlvbiA9IDEwMDA7XG5cdHZhciBfcmVwZWF0ID0gMDtcblx0dmFyIF95b3lvID0gZmFsc2U7XG5cdHZhciBfaXNQbGF5aW5nID0gZmFsc2U7XG5cdHZhciBfcmV2ZXJzZWQgPSBmYWxzZTtcblx0dmFyIF9kZWxheVRpbWUgPSAwO1xuXHR2YXIgX3N0YXJ0VGltZSA9IG51bGw7XG5cdHZhciBfZWFzaW5nRnVuY3Rpb24gPSBUV0VFTi5FYXNpbmcuTGluZWFyLk5vbmU7XG5cdHZhciBfaW50ZXJwb2xhdGlvbkZ1bmN0aW9uID0gVFdFRU4uSW50ZXJwb2xhdGlvbi5MaW5lYXI7XG5cdHZhciBfY2hhaW5lZFR3ZWVucyA9IFtdO1xuXHR2YXIgX29uU3RhcnRDYWxsYmFjayA9IG51bGw7XG5cdHZhciBfb25TdGFydENhbGxiYWNrRmlyZWQgPSBmYWxzZTtcblx0dmFyIF9vblVwZGF0ZUNhbGxiYWNrID0gbnVsbDtcblx0dmFyIF9vbkNvbXBsZXRlQ2FsbGJhY2sgPSBudWxsO1xuXHR2YXIgX29uU3RvcENhbGxiYWNrID0gbnVsbDtcblxuXHQvLyBTZXQgYWxsIHN0YXJ0aW5nIHZhbHVlcyBwcmVzZW50IG9uIHRoZSB0YXJnZXQgb2JqZWN0XG5cdGZvciAodmFyIGZpZWxkIGluIG9iamVjdCkge1xuXHRcdF92YWx1ZXNTdGFydFtmaWVsZF0gPSBwYXJzZUZsb2F0KG9iamVjdFtmaWVsZF0sIDEwKTtcblx0fVxuXG5cdHRoaXMudG8gPSBmdW5jdGlvbiAocHJvcGVydGllcywgZHVyYXRpb24pIHtcblxuXHRcdGlmIChkdXJhdGlvbiAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRfZHVyYXRpb24gPSBkdXJhdGlvbjtcblx0XHR9XG5cblx0XHRfdmFsdWVzRW5kID0gcHJvcGVydGllcztcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5zdGFydCA9IGZ1bmN0aW9uICh0aW1lKSB7XG5cblx0XHRUV0VFTi5hZGQodGhpcyk7XG5cblx0XHRfaXNQbGF5aW5nID0gdHJ1ZTtcblxuXHRcdF9vblN0YXJ0Q2FsbGJhY2tGaXJlZCA9IGZhbHNlO1xuXG5cdFx0X3N0YXJ0VGltZSA9IHRpbWUgIT09IHVuZGVmaW5lZCA/IHRpbWUgOiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0X3N0YXJ0VGltZSArPSBfZGVsYXlUaW1lO1xuXG5cdFx0Zm9yICh2YXIgcHJvcGVydHkgaW4gX3ZhbHVlc0VuZCkge1xuXG5cdFx0XHQvLyBDaGVjayBpZiBhbiBBcnJheSB3YXMgcHJvdmlkZWQgYXMgcHJvcGVydHkgdmFsdWVcblx0XHRcdGlmIChfdmFsdWVzRW5kW3Byb3BlcnR5XSBpbnN0YW5jZW9mIEFycmF5KSB7XG5cblx0XHRcdFx0aWYgKF92YWx1ZXNFbmRbcHJvcGVydHldLmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQ3JlYXRlIGEgbG9jYWwgY29weSBvZiB0aGUgQXJyYXkgd2l0aCB0aGUgc3RhcnQgdmFsdWUgYXQgdGhlIGZyb250XG5cdFx0XHRcdF92YWx1ZXNFbmRbcHJvcGVydHldID0gW19vYmplY3RbcHJvcGVydHldXS5jb25jYXQoX3ZhbHVlc0VuZFtwcm9wZXJ0eV0pO1xuXG5cdFx0XHR9XG5cblx0XHRcdF92YWx1ZXNTdGFydFtwcm9wZXJ0eV0gPSBfb2JqZWN0W3Byb3BlcnR5XTtcblxuXHRcdFx0aWYgKChfdmFsdWVzU3RhcnRbcHJvcGVydHldIGluc3RhbmNlb2YgQXJyYXkpID09PSBmYWxzZSkge1xuXHRcdFx0XHRfdmFsdWVzU3RhcnRbcHJvcGVydHldICo9IDEuMDsgLy8gRW5zdXJlcyB3ZSdyZSB1c2luZyBudW1iZXJzLCBub3Qgc3RyaW5nc1xuXHRcdFx0fVxuXG5cdFx0XHRfdmFsdWVzU3RhcnRSZXBlYXRbcHJvcGVydHldID0gX3ZhbHVlc1N0YXJ0W3Byb3BlcnR5XSB8fCAwO1xuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG5cblx0XHRpZiAoIV9pc1BsYXlpbmcpIHtcblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH1cblxuXHRcdFRXRUVOLnJlbW92ZSh0aGlzKTtcblx0XHRfaXNQbGF5aW5nID0gZmFsc2U7XG5cblx0XHRpZiAoX29uU3RvcENhbGxiYWNrICE9PSBudWxsKSB7XG5cdFx0XHRfb25TdG9wQ2FsbGJhY2suY2FsbChfb2JqZWN0KTtcblx0XHR9XG5cblx0XHR0aGlzLnN0b3BDaGFpbmVkVHdlZW5zKCk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLnN0b3BDaGFpbmVkVHdlZW5zID0gZnVuY3Rpb24gKCkge1xuXG5cdFx0Zm9yICh2YXIgaSA9IDAsIG51bUNoYWluZWRUd2VlbnMgPSBfY2hhaW5lZFR3ZWVucy5sZW5ndGg7IGkgPCBudW1DaGFpbmVkVHdlZW5zOyBpKyspIHtcblx0XHRcdF9jaGFpbmVkVHdlZW5zW2ldLnN0b3AoKTtcblx0XHR9XG5cblx0fTtcblxuXHR0aGlzLmRlbGF5ID0gZnVuY3Rpb24gKGFtb3VudCkge1xuXG5cdFx0X2RlbGF5VGltZSA9IGFtb3VudDtcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMucmVwZWF0ID0gZnVuY3Rpb24gKHRpbWVzKSB7XG5cblx0XHRfcmVwZWF0ID0gdGltZXM7XG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fTtcblxuXHR0aGlzLnlveW8gPSBmdW5jdGlvbiAoeW95bykge1xuXG5cdFx0X3lveW8gPSB5b3lvO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblxuXHR0aGlzLmVhc2luZyA9IGZ1bmN0aW9uIChlYXNpbmcpIHtcblxuXHRcdF9lYXNpbmdGdW5jdGlvbiA9IGVhc2luZztcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMuaW50ZXJwb2xhdGlvbiA9IGZ1bmN0aW9uIChpbnRlcnBvbGF0aW9uKSB7XG5cblx0XHRfaW50ZXJwb2xhdGlvbkZ1bmN0aW9uID0gaW50ZXJwb2xhdGlvbjtcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMuY2hhaW4gPSBmdW5jdGlvbiAoKSB7XG5cblx0XHRfY2hhaW5lZFR3ZWVucyA9IGFyZ3VtZW50cztcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMub25TdGFydCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuXG5cdFx0X29uU3RhcnRDYWxsYmFjayA9IGNhbGxiYWNrO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5vblVwZGF0ZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuXG5cdFx0X29uVXBkYXRlQ2FsbGJhY2sgPSBjYWxsYmFjaztcblx0XHRyZXR1cm4gdGhpcztcblxuXHR9O1xuXG5cdHRoaXMub25Db21wbGV0ZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuXG5cdFx0X29uQ29tcGxldGVDYWxsYmFjayA9IGNhbGxiYWNrO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy5vblN0b3AgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcblxuXHRcdF9vblN0b3BDYWxsYmFjayA9IGNhbGxiYWNrO1xuXHRcdHJldHVybiB0aGlzO1xuXG5cdH07XG5cblx0dGhpcy51cGRhdGUgPSBmdW5jdGlvbiAodGltZSkge1xuXG5cdFx0dmFyIHByb3BlcnR5O1xuXHRcdHZhciBlbGFwc2VkO1xuXHRcdHZhciB2YWx1ZTtcblxuXHRcdGlmICh0aW1lIDwgX3N0YXJ0VGltZSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKF9vblN0YXJ0Q2FsbGJhY2tGaXJlZCA9PT0gZmFsc2UpIHtcblxuXHRcdFx0aWYgKF9vblN0YXJ0Q2FsbGJhY2sgIT09IG51bGwpIHtcblx0XHRcdFx0X29uU3RhcnRDYWxsYmFjay5jYWxsKF9vYmplY3QpO1xuXHRcdFx0fVxuXG5cdFx0XHRfb25TdGFydENhbGxiYWNrRmlyZWQgPSB0cnVlO1xuXG5cdFx0fVxuXG5cdFx0ZWxhcHNlZCA9ICh0aW1lIC0gX3N0YXJ0VGltZSkgLyBfZHVyYXRpb247XG5cdFx0ZWxhcHNlZCA9IGVsYXBzZWQgPiAxID8gMSA6IGVsYXBzZWQ7XG5cblx0XHR2YWx1ZSA9IF9lYXNpbmdGdW5jdGlvbihlbGFwc2VkKTtcblxuXHRcdGZvciAocHJvcGVydHkgaW4gX3ZhbHVlc0VuZCkge1xuXG5cdFx0XHR2YXIgc3RhcnQgPSBfdmFsdWVzU3RhcnRbcHJvcGVydHldIHx8IDA7XG5cdFx0XHR2YXIgZW5kID0gX3ZhbHVlc0VuZFtwcm9wZXJ0eV07XG5cblx0XHRcdGlmIChlbmQgaW5zdGFuY2VvZiBBcnJheSkge1xuXG5cdFx0XHRcdF9vYmplY3RbcHJvcGVydHldID0gX2ludGVycG9sYXRpb25GdW5jdGlvbihlbmQsIHZhbHVlKTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBQYXJzZXMgcmVsYXRpdmUgZW5kIHZhbHVlcyB3aXRoIHN0YXJ0IGFzIGJhc2UgKGUuZy46ICsxMCwgLTMpXG5cdFx0XHRcdGlmICh0eXBlb2YgKGVuZCkgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0ZW5kID0gc3RhcnQgKyBwYXJzZUZsb2F0KGVuZCwgMTApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gUHJvdGVjdCBhZ2FpbnN0IG5vbiBudW1lcmljIHByb3BlcnRpZXMuXG5cdFx0XHRcdGlmICh0eXBlb2YgKGVuZCkgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdFx0X29iamVjdFtwcm9wZXJ0eV0gPSBzdGFydCArIChlbmQgLSBzdGFydCkgKiB2YWx1ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHR9XG5cblx0XHR9XG5cblx0XHRpZiAoX29uVXBkYXRlQ2FsbGJhY2sgIT09IG51bGwpIHtcblx0XHRcdF9vblVwZGF0ZUNhbGxiYWNrLmNhbGwoX29iamVjdCwgdmFsdWUpO1xuXHRcdH1cblxuXHRcdGlmIChlbGFwc2VkID09PSAxKSB7XG5cblx0XHRcdGlmIChfcmVwZWF0ID4gMCkge1xuXG5cdFx0XHRcdGlmIChpc0Zpbml0ZShfcmVwZWF0KSkge1xuXHRcdFx0XHRcdF9yZXBlYXQtLTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIFJlYXNzaWduIHN0YXJ0aW5nIHZhbHVlcywgcmVzdGFydCBieSBtYWtpbmcgc3RhcnRUaW1lID0gbm93XG5cdFx0XHRcdGZvciAocHJvcGVydHkgaW4gX3ZhbHVlc1N0YXJ0UmVwZWF0KSB7XG5cblx0XHRcdFx0XHRpZiAodHlwZW9mIChfdmFsdWVzRW5kW3Byb3BlcnR5XSkgPT09ICdzdHJpbmcnKSB7XG5cdFx0XHRcdFx0XHRfdmFsdWVzU3RhcnRSZXBlYXRbcHJvcGVydHldID0gX3ZhbHVlc1N0YXJ0UmVwZWF0W3Byb3BlcnR5XSArIHBhcnNlRmxvYXQoX3ZhbHVlc0VuZFtwcm9wZXJ0eV0sIDEwKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoX3lveW8pIHtcblx0XHRcdFx0XHRcdHZhciB0bXAgPSBfdmFsdWVzU3RhcnRSZXBlYXRbcHJvcGVydHldO1xuXG5cdFx0XHRcdFx0XHRfdmFsdWVzU3RhcnRSZXBlYXRbcHJvcGVydHldID0gX3ZhbHVlc0VuZFtwcm9wZXJ0eV07XG5cdFx0XHRcdFx0XHRfdmFsdWVzRW5kW3Byb3BlcnR5XSA9IHRtcDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRfdmFsdWVzU3RhcnRbcHJvcGVydHldID0gX3ZhbHVlc1N0YXJ0UmVwZWF0W3Byb3BlcnR5XTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKF95b3lvKSB7XG5cdFx0XHRcdFx0X3JldmVyc2VkID0gIV9yZXZlcnNlZDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdF9zdGFydFRpbWUgPSB0aW1lICsgX2RlbGF5VGltZTtcblxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHRpZiAoX29uQ29tcGxldGVDYWxsYmFjayAhPT0gbnVsbCkge1xuXHRcdFx0XHRcdF9vbkNvbXBsZXRlQ2FsbGJhY2suY2FsbChfb2JqZWN0KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAodmFyIGkgPSAwLCBudW1DaGFpbmVkVHdlZW5zID0gX2NoYWluZWRUd2VlbnMubGVuZ3RoOyBpIDwgbnVtQ2hhaW5lZFR3ZWVuczsgaSsrKSB7XG5cdFx0XHRcdFx0Ly8gTWFrZSB0aGUgY2hhaW5lZCB0d2VlbnMgc3RhcnQgZXhhY3RseSBhdCB0aGUgdGltZSB0aGV5IHNob3VsZCxcblx0XHRcdFx0XHQvLyBldmVuIGlmIHRoZSBgdXBkYXRlKClgIG1ldGhvZCB3YXMgY2FsbGVkIHdheSBwYXN0IHRoZSBkdXJhdGlvbiBvZiB0aGUgdHdlZW5cblx0XHRcdFx0XHRfY2hhaW5lZFR3ZWVuc1tpXS5zdGFydChfc3RhcnRUaW1lICsgX2R1cmF0aW9uKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblxuXHRcdFx0fVxuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cblx0fTtcblxufTtcblxuXG5UV0VFTi5FYXNpbmcgPSB7XG5cblx0TGluZWFyOiB7XG5cblx0XHROb25lOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gaztcblxuXHRcdH1cblxuXHR9LFxuXG5cdFF1YWRyYXRpYzoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrICogaztcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrICogKDIgLSBrKTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKChrICo9IDIpIDwgMSkge1xuXHRcdFx0XHRyZXR1cm4gMC41ICogayAqIGs7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAtIDAuNSAqICgtLWsgKiAoayAtIDIpIC0gMSk7XG5cblx0XHR9XG5cblx0fSxcblxuXHRDdWJpYzoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrICogayAqIGs7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gLS1rICogayAqIGsgKyAxO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAwLjUgKiBrICogayAqIGs7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAwLjUgKiAoKGsgLT0gMikgKiBrICogayArIDIpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0UXVhcnRpYzoge1xuXG5cdFx0SW46IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBrICogayAqIGsgKiBrO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIDEgLSAoLS1rICogayAqIGsgKiBrKTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKChrICo9IDIpIDwgMSkge1xuXHRcdFx0XHRyZXR1cm4gMC41ICogayAqIGsgKiBrICogaztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIC0gMC41ICogKChrIC09IDIpICogayAqIGsgKiBrIC0gMik7XG5cblx0XHR9XG5cblx0fSxcblxuXHRRdWludGljOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGsgKiBrICogayAqIGsgKiBrO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIC0tayAqIGsgKiBrICogayAqIGsgKyAxO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAwLjUgKiBrICogayAqIGsgKiBrICogaztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIDAuNSAqICgoayAtPSAyKSAqIGsgKiBrICogayAqIGsgKyAyKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdFNpbnVzb2lkYWw6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gMSAtIE1hdGguY29zKGsgKiBNYXRoLlBJIC8gMik7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRyZXR1cm4gTWF0aC5zaW4oayAqIE1hdGguUEkgLyAyKTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIDAuNSAqICgxIC0gTWF0aC5jb3MoTWF0aC5QSSAqIGspKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdEV4cG9uZW50aWFsOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGsgPT09IDAgPyAwIDogTWF0aC5wb3coMTAyNCwgayAtIDEpO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIGsgPT09IDEgPyAxIDogMSAtIE1hdGgucG93KDIsIC0gMTAgKiBrKTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0aWYgKGsgPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChrID09PSAxKSB7XG5cdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAwLjUgKiBNYXRoLnBvdygxMDI0LCBrIC0gMSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAwLjUgKiAoLSBNYXRoLnBvdygyLCAtIDEwICogKGsgLSAxKSkgKyAyKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdENpcmN1bGFyOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIDEgLSBNYXRoLnNxcnQoMSAtIGsgKiBrKTtcblxuXHRcdH0sXG5cblx0XHRPdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdHJldHVybiBNYXRoLnNxcnQoMSAtICgtLWsgKiBrKSk7XG5cblx0XHR9LFxuXG5cdFx0SW5PdXQ6IGZ1bmN0aW9uIChrKSB7XG5cblx0XHRcdGlmICgoayAqPSAyKSA8IDEpIHtcblx0XHRcdFx0cmV0dXJuIC0gMC41ICogKE1hdGguc3FydCgxIC0gayAqIGspIC0gMSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiAwLjUgKiAoTWF0aC5zcXJ0KDEgLSAoayAtPSAyKSAqIGspICsgMSk7XG5cblx0XHR9XG5cblx0fSxcblxuXHRFbGFzdGljOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0dmFyIHM7XG5cdFx0XHR2YXIgYSA9IDAuMTtcblx0XHRcdHZhciBwID0gMC40O1xuXG5cdFx0XHRpZiAoayA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGsgPT09IDEpIHtcblx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghYSB8fCBhIDwgMSkge1xuXHRcdFx0XHRhID0gMTtcblx0XHRcdFx0cyA9IHAgLyA0O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cyA9IHAgKiBNYXRoLmFzaW4oMSAvIGEpIC8gKDIgKiBNYXRoLlBJKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIC0gKGEgKiBNYXRoLnBvdygyLCAxMCAqIChrIC09IDEpKSAqIE1hdGguc2luKChrIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkpO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0dmFyIHM7XG5cdFx0XHR2YXIgYSA9IDAuMTtcblx0XHRcdHZhciBwID0gMC40O1xuXG5cdFx0XHRpZiAoayA9PT0gMCkge1xuXHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGsgPT09IDEpIHtcblx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghYSB8fCBhIDwgMSkge1xuXHRcdFx0XHRhID0gMTtcblx0XHRcdFx0cyA9IHAgLyA0O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cyA9IHAgKiBNYXRoLmFzaW4oMSAvIGEpIC8gKDIgKiBNYXRoLlBJKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIChhICogTWF0aC5wb3coMiwgLSAxMCAqIGspICogTWF0aC5zaW4oKGsgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSArIDEpO1xuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHR2YXIgcztcblx0XHRcdHZhciBhID0gMC4xO1xuXHRcdFx0dmFyIHAgPSAwLjQ7XG5cblx0XHRcdGlmIChrID09PSAwKSB7XG5cdFx0XHRcdHJldHVybiAwO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoayA9PT0gMSkge1xuXHRcdFx0XHRyZXR1cm4gMTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFhIHx8IGEgPCAxKSB7XG5cdFx0XHRcdGEgPSAxO1xuXHRcdFx0XHRzID0gcCAvIDQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRzID0gcCAqIE1hdGguYXNpbigxIC8gYSkgLyAoMiAqIE1hdGguUEkpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoKGsgKj0gMikgPCAxKSB7XG5cdFx0XHRcdHJldHVybiAtIDAuNSAqIChhICogTWF0aC5wb3coMiwgMTAgKiAoayAtPSAxKSkgKiBNYXRoLnNpbigoayAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGEgKiBNYXRoLnBvdygyLCAtMTAgKiAoayAtPSAxKSkgKiBNYXRoLnNpbigoayAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApICogMC41ICsgMTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdEJhY2s6IHtcblxuXHRcdEluOiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHR2YXIgcyA9IDEuNzAxNTg7XG5cblx0XHRcdHJldHVybiBrICogayAqICgocyArIDEpICogayAtIHMpO1xuXG5cdFx0fSxcblxuXHRcdE91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0dmFyIHMgPSAxLjcwMTU4O1xuXG5cdFx0XHRyZXR1cm4gLS1rICogayAqICgocyArIDEpICogayArIHMpICsgMTtcblxuXHRcdH0sXG5cblx0XHRJbk91dDogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0dmFyIHMgPSAxLjcwMTU4ICogMS41MjU7XG5cblx0XHRcdGlmICgoayAqPSAyKSA8IDEpIHtcblx0XHRcdFx0cmV0dXJuIDAuNSAqIChrICogayAqICgocyArIDEpICogayAtIHMpKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIDAuNSAqICgoayAtPSAyKSAqIGsgKiAoKHMgKyAxKSAqIGsgKyBzKSArIDIpO1xuXG5cdFx0fVxuXG5cdH0sXG5cblx0Qm91bmNlOiB7XG5cblx0XHRJbjogZnVuY3Rpb24gKGspIHtcblxuXHRcdFx0cmV0dXJuIDEgLSBUV0VFTi5FYXNpbmcuQm91bmNlLk91dCgxIC0gayk7XG5cblx0XHR9LFxuXG5cdFx0T3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoayA8ICgxIC8gMi43NSkpIHtcblx0XHRcdFx0cmV0dXJuIDcuNTYyNSAqIGsgKiBrO1xuXHRcdFx0fSBlbHNlIGlmIChrIDwgKDIgLyAyLjc1KSkge1xuXHRcdFx0XHRyZXR1cm4gNy41NjI1ICogKGsgLT0gKDEuNSAvIDIuNzUpKSAqIGsgKyAwLjc1O1xuXHRcdFx0fSBlbHNlIGlmIChrIDwgKDIuNSAvIDIuNzUpKSB7XG5cdFx0XHRcdHJldHVybiA3LjU2MjUgKiAoayAtPSAoMi4yNSAvIDIuNzUpKSAqIGsgKyAwLjkzNzU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gNy41NjI1ICogKGsgLT0gKDIuNjI1IC8gMi43NSkpICogayArIDAuOTg0Mzc1O1xuXHRcdFx0fVxuXG5cdFx0fSxcblxuXHRcdEluT3V0OiBmdW5jdGlvbiAoaykge1xuXG5cdFx0XHRpZiAoayA8IDAuNSkge1xuXHRcdFx0XHRyZXR1cm4gVFdFRU4uRWFzaW5nLkJvdW5jZS5JbihrICogMikgKiAwLjU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBUV0VFTi5FYXNpbmcuQm91bmNlLk91dChrICogMiAtIDEpICogMC41ICsgMC41O1xuXG5cdFx0fVxuXG5cdH1cblxufTtcblxuVFdFRU4uSW50ZXJwb2xhdGlvbiA9IHtcblxuXHRMaW5lYXI6IGZ1bmN0aW9uICh2LCBrKSB7XG5cblx0XHR2YXIgbSA9IHYubGVuZ3RoIC0gMTtcblx0XHR2YXIgZiA9IG0gKiBrO1xuXHRcdHZhciBpID0gTWF0aC5mbG9vcihmKTtcblx0XHR2YXIgZm4gPSBUV0VFTi5JbnRlcnBvbGF0aW9uLlV0aWxzLkxpbmVhcjtcblxuXHRcdGlmIChrIDwgMCkge1xuXHRcdFx0cmV0dXJuIGZuKHZbMF0sIHZbMV0sIGYpO1xuXHRcdH1cblxuXHRcdGlmIChrID4gMSkge1xuXHRcdFx0cmV0dXJuIGZuKHZbbV0sIHZbbSAtIDFdLCBtIC0gZik7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZuKHZbaV0sIHZbaSArIDEgPiBtID8gbSA6IGkgKyAxXSwgZiAtIGkpO1xuXG5cdH0sXG5cblx0QmV6aWVyOiBmdW5jdGlvbiAodiwgaykge1xuXG5cdFx0dmFyIGIgPSAwO1xuXHRcdHZhciBuID0gdi5sZW5ndGggLSAxO1xuXHRcdHZhciBwdyA9IE1hdGgucG93O1xuXHRcdHZhciBibiA9IFRXRUVOLkludGVycG9sYXRpb24uVXRpbHMuQmVybnN0ZWluO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPD0gbjsgaSsrKSB7XG5cdFx0XHRiICs9IHB3KDEgLSBrLCBuIC0gaSkgKiBwdyhrLCBpKSAqIHZbaV0gKiBibihuLCBpKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYjtcblxuXHR9LFxuXG5cdENhdG11bGxSb206IGZ1bmN0aW9uICh2LCBrKSB7XG5cblx0XHR2YXIgbSA9IHYubGVuZ3RoIC0gMTtcblx0XHR2YXIgZiA9IG0gKiBrO1xuXHRcdHZhciBpID0gTWF0aC5mbG9vcihmKTtcblx0XHR2YXIgZm4gPSBUV0VFTi5JbnRlcnBvbGF0aW9uLlV0aWxzLkNhdG11bGxSb207XG5cblx0XHRpZiAodlswXSA9PT0gdlttXSkge1xuXG5cdFx0XHRpZiAoayA8IDApIHtcblx0XHRcdFx0aSA9IE1hdGguZmxvb3IoZiA9IG0gKiAoMSArIGspKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZuKHZbKGkgLSAxICsgbSkgJSBtXSwgdltpXSwgdlsoaSArIDEpICUgbV0sIHZbKGkgKyAyKSAlIG1dLCBmIC0gaSk7XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHRpZiAoayA8IDApIHtcblx0XHRcdFx0cmV0dXJuIHZbMF0gLSAoZm4odlswXSwgdlswXSwgdlsxXSwgdlsxXSwgLWYpIC0gdlswXSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChrID4gMSkge1xuXHRcdFx0XHRyZXR1cm4gdlttXSAtIChmbih2W21dLCB2W21dLCB2W20gLSAxXSwgdlttIC0gMV0sIGYgLSBtKSAtIHZbbV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZm4odltpID8gaSAtIDEgOiAwXSwgdltpXSwgdlttIDwgaSArIDEgPyBtIDogaSArIDFdLCB2W20gPCBpICsgMiA/IG0gOiBpICsgMl0sIGYgLSBpKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdFV0aWxzOiB7XG5cblx0XHRMaW5lYXI6IGZ1bmN0aW9uIChwMCwgcDEsIHQpIHtcblxuXHRcdFx0cmV0dXJuIChwMSAtIHAwKSAqIHQgKyBwMDtcblxuXHRcdH0sXG5cblx0XHRCZXJuc3RlaW46IGZ1bmN0aW9uIChuLCBpKSB7XG5cblx0XHRcdHZhciBmYyA9IFRXRUVOLkludGVycG9sYXRpb24uVXRpbHMuRmFjdG9yaWFsO1xuXG5cdFx0XHRyZXR1cm4gZmMobikgLyBmYyhpKSAvIGZjKG4gLSBpKTtcblxuXHRcdH0sXG5cblx0XHRGYWN0b3JpYWw6IChmdW5jdGlvbiAoKSB7XG5cblx0XHRcdHZhciBhID0gWzFdO1xuXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gKG4pIHtcblxuXHRcdFx0XHR2YXIgcyA9IDE7XG5cblx0XHRcdFx0aWYgKGFbbl0pIHtcblx0XHRcdFx0XHRyZXR1cm4gYVtuXTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGZvciAodmFyIGkgPSBuOyBpID4gMTsgaS0tKSB7XG5cdFx0XHRcdFx0cyAqPSBpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YVtuXSA9IHM7XG5cdFx0XHRcdHJldHVybiBzO1xuXG5cdFx0XHR9O1xuXG5cdFx0fSkoKSxcblxuXHRcdENhdG11bGxSb206IGZ1bmN0aW9uIChwMCwgcDEsIHAyLCBwMywgdCkge1xuXG5cdFx0XHR2YXIgdjAgPSAocDIgLSBwMCkgKiAwLjU7XG5cdFx0XHR2YXIgdjEgPSAocDMgLSBwMSkgKiAwLjU7XG5cdFx0XHR2YXIgdDIgPSB0ICogdDtcblx0XHRcdHZhciB0MyA9IHQgKiB0MjtcblxuXHRcdFx0cmV0dXJuICgyICogcDEgLSAyICogcDIgKyB2MCArIHYxKSAqIHQzICsgKC0gMyAqIHAxICsgMyAqIHAyIC0gMiAqIHYwIC0gdjEpICogdDIgKyB2MCAqIHQgKyBwMTtcblxuXHRcdH1cblxuXHR9XG5cbn07XG5cbi8vIFVNRCAoVW5pdmVyc2FsIE1vZHVsZSBEZWZpbml0aW9uKVxuKGZ1bmN0aW9uIChyb290KSB7XG5cblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXG5cdFx0Ly8gQU1EXG5cdFx0ZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gVFdFRU47XG5cdFx0fSk7XG5cblx0fSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcblxuXHRcdC8vIE5vZGUuanNcblx0XHRtb2R1bGUuZXhwb3J0cyA9IFRXRUVOO1xuXG5cdH0gZWxzZSB7XG5cblx0XHQvLyBHbG9iYWwgdmFyaWFibGVcblx0XHRyb290LlRXRUVOID0gVFdFRU47XG5cblx0fVxuXG59KSh0aGlzKTtcbiJdfQ==

/* global THREE, DeviceOrientationController */
'use strict';
const EventEmitter = require('fast-event-emitter');
const util = require('util');

var l = new THREE.ObjectLoader();
const loadScene = (id) => new Promise(function (resolve, reject) {
	l.load('models/' + id + '.json', resolve, undefined, reject);
});

function pickObjectsHelper(root, ...namesIn) {

	const collection = {};
	const names = new Set(namesIn);

	(function pickObjects(root) {
		if (root.children) {
			root.children.forEach(node => {
				if (names.has(node.name)) {
					collection[node.name] = node;
					names.delete(node.name);
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
	return loadScene(id).then(scene => {
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
function MyThreeHelper(options){

	EventEmitter.call(this);

	/**
	 * Set up rendering
	 */

	options.target = options.target || document.body;

	this.scene = options.scene || new THREE.Scene();

	let camera = pickObjectsHelper(this.scene, options.camera).Camera;

	if (!camera) {
		console.log(camera);
		camera = new THREE.PerspectiveCamera( 75, options.target.scrollWidth / options.target.scrollHeight, 0.5, 100 );
		camera.position.set(0, 2, 0);
		camera.lookAt(new THREE.Vector3(0, camera.height, -9));
		camera.rotation.y += Math.PI;
	}
	camera.height = camera.position.y; // reference value for how high the camera should be
									   // above the ground to maintain the illusion of presence
	camera.fov = 75;

	this.camera = camera;
	const renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.setPixelRatio( window.devicePixelRatio );
	
	this.renderMethod = renderer;
	
	const setAspect = () => {
		this.renderMethod.setSize( options.target.scrollWidth, options.target.scrollHeight );
		camera.aspect = options.target.scrollWidth / options.target.scrollHeight;
		camera.updateProjectionMatrix();
	};
	window.addEventListener('resize', setAspect);
	setAspect();

	options.target.appendChild(renderer.domElement);
	this.domElement = renderer.domElement;

	// This is called to request a render
	this.render = () => {

		// note: three.js includes requestAnimationFrame shim
		this.emit('prerender');
		this.renderMethod.render(this.scene, camera);
	};

	// Change render method to the stereo renderer (one for each eye)
	this.useCardboard = () => {

		const effect = new THREE.StereoEffect(renderer);
		setAspect();
		effect.eyeSeparation = 0.008;
		effect.focalLength = 0.25;
		effect.setSize( window.innerWidth, window.innerHeight );
		this.renderMethod = effect;
	};


	/**
	 * Add a heads up display object to the camera
	 */

	const hud = new THREE.Object3D();
	hud.position.set(0, 0, -2.1);
	hud.scale.set(0.2, 0.2, 0.2);
	camera.add(hud);
	this.scene.add(this.camera);
	this.hud = hud;

	/**
	 * A map of physics object id to three.js object 3d so we can update all the positions
	 */

	const threeObjectsConnectedToPhysics = {};
	this.updateObjects = physicsObjects => {
		const l = physicsObjects.length;

		// iterate over the physics physicsObjects
		for ( let j=0; j<l;j++ ) {

			const i = physicsObjects[j];
			if (threeObjectsConnectedToPhysics[i.id]) {

				const o = threeObjectsConnectedToPhysics[i.id];

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

	this.connectPhysicsToThree = (mesh, physicsMesh) => {
		threeObjectsConnectedToPhysics[physicsMesh.id] = mesh;
		if (mesh.constructor === THREE.Vector3) return;
		this.scene.add(mesh);
	};

	/**
	 * Turn on head tracking if manual control is disabled it won't steal mouse/touch events
	 */
	this.deviceOrientation = ({manualControl}) => {

		// provide dummy element to prevent touch/click hijacking.
		const element = manualControl ? renderer.domElement : document.createElement("DIV");

		if (this.deviceOrientationController) {
			this.deviceOrientationController.disconnect();
			this.deviceOrientationController.element = element;
			this.deviceOrientationController.connect();
		} else {
			this.deviceOrientationController = new DeviceOrientationController(this.camera, element);
			this.deviceOrientationController.connect();
			this.on('prerender', () => this.deviceOrientationController.update());
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

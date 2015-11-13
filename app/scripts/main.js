/*global THREE*/
'use strict';
const addScript = require('./lib/loadScript'); // Promise wrapper for script loading
const VerletWrapper = require('./lib/verletwrapper'); // Wrapper of the verlet worker
const textSprite = require('./lib/textSprite'); // Generally sprites from canvas
const CameraInteractions = require('./lib/camerainteractions'); // Tool for making interactive VR elements
const TWEEN = require('tween.js');

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
				navigator.serviceWorker.register('./sw.js')
				.then(function(reg) {
					console.log('sw registered', reg);
				})
				.then(resolve);
			}
		} else {
			console.error('No Service Worker, assets may not be cached');
			resolve();
		}
	});
}

serviceWorker()
.then(() => Promise.all([
	addScript('https://polyfill.webservices.ft.com/v1/polyfill.min.js?features=fetch,default'),
	addScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r73/three.min.js')
]))
.then(() => Promise.all([
	addScript('https://cdn.rawgit.com/mrdoob/three.js/master/examples/js/effects/StereoEffect.js'),
	addScript('https://cdn.rawgit.com/mrdoob/three.js/master/examples/js/SkyShader.js'),
	addScript('https://cdn.rawgit.com/richtr/threeVR/master/js/DeviceOrientationController.js')
]))
.then(() => require('./lib/threeHelper')
	.myThreeFromJSON('Kitchen/lickthewhisk',
		{
			camera: 'Camera',
			target: document.body
		}
	)
)
.then(threeHelper => {
	console.log('Ready');
	window.threeHelper = threeHelper; // make it available for debugging

	/**
	 * Update textures to Baked ones and add envmap
	 */

	const textureLoader = new THREE.TextureLoader();
	const cubeTextureLoader = new THREE.CubeTextureLoader();
	const toTexture = threeHelper.pickObjectsHelper(threeHelper.scene, 'Room', 'Counter', 'Cake');
	const toShiny = threeHelper.pickObjectsHelper(threeHelper.scene, 'LickTheWhisk', 'Whisk', 'SaucePan', 'SaucePan.001', 'SaucePan.002', 'SaucePan.003', 'Fridge');
	Object.keys(toTexture).forEach(name => {
		textureLoader.load(`models/Kitchen/${name}Bake.png`, map => toTexture[name].material = new THREE.MeshBasicMaterial({map}));
	});

	const path = "models/Kitchen/envmap/";
	const format = '.png';
	const urls = [
		path + '0004' + format, // +x
		path + '0002' + format, // -x
		path + '0006' + format, // +y
		path + '0005' + format, // -y
		path + '0001' + format, // +z
		path + '0003' + format  // -z
	];
	cubeTextureLoader.load(urls, envMap => {
		const copper = new THREE.MeshPhongMaterial( { color: 0x99ff99, specular: 0x772222, envMap, combine: THREE.MixOperation, reflectivity: 0.3, metal: true} );
		const aluminium = new THREE.MeshPhongMaterial( { color: 0x888888, specular: 0x999999, envMap, combine: THREE.MixOperation, reflectivity: 0.3, metal: true} );
		const chocolate = new THREE.MeshPhongMaterial( { color: toShiny.LickTheWhisk.material.color, specular: 0x999999, envMap, combine: THREE.MixOperation, reflectivity: 0.3, metal: true} );

		toShiny['SaucePan'].material = copper;
		toShiny['SaucePan.001'].material = copper;
		toShiny['SaucePan.002'].material = copper;
		toShiny['SaucePan.003'].material = copper;
		toShiny.Whisk.material = aluminium;
		toShiny.LickTheWhisk.material = chocolate;

		textureLoader.load(`models/Kitchen/FridgeBake.png`, map => toShiny.Fridge.material = new THREE.MeshPhongMaterial({map, envMap, combine: THREE.MixOperation, specular: 0x999999, reflectivity: 0.3, metal: true, side: THREE.DoubleSide }));

	});

	// Ambiant light
	const ambientLight = new THREE.AmbientLight( 0xcccccc );
	threeHelper.scene.add( ambientLight );

	// Add a pretty skybox
	const skyBox = require('./lib/sky')();
	skyBox.scale.multiplyScalar(0.0002);
	threeHelper.scene.add(skyBox);

	/**
	 * Add a targeting reticule to the HUD to help align what the user is looking at
	 */

	textureLoader.load("images/reticule.png", map => {
		const material = new THREE.SpriteMaterial( { map, fog: false, transparent: true } );
		const sprite = new THREE.Sprite(material);
		threeHelper.hud.add(sprite);
	});

	/**
	 * Set up interactivity from the camera.
	 */

	const cameraInteractivityWorld = new CameraInteractions(threeHelper.domElement);

	threeHelper.deviceOrientationController
	.addEventListener('userinteractionend', function () {
		cameraInteractivityWorld.interact({type: 'click'});
	});


	// Run the verlet physics
	const verlet = new VerletWrapper();
	verlet.init({
		size: {
			x: 20,
			y: 20,
			z: 20,
		},
		gravity: true
	})
	.then(function () {
		

		/**
		 * Main Render Loop
		 *
		 * Each request animation frame render is called
		 * And a request is made to the verlet physics worker
		 * to calculate a new lot of physics calculations to update
		 * our simulation.
		 */

		let waitingForPoints = false;
		requestAnimationFrame(function animate(time) {
			requestAnimationFrame(animate);
			cameraInteractivityWorld.detectInteractions(threeHelper.camera);

			if (!waitingForPoints) {
				verlet.getPoints().then(points => {
					threeHelper.updateObjects(points);
					waitingForPoints = false;
				});
				waitingForPoints = true;
			}
			threeHelper.render();
			TWEEN.update(time);
		});

		function addButton(str) {
			const sprite = textSprite(str, {
				fontsize: 18,
				fontface: 'Iceland',
				borderThickness: 20
			});
			threeHelper.scene.add(sprite);
			sprite.position.set(5,5,5);
			sprite.material.transparent = true;
			return cameraInteractivityWorld.makeTarget(sprite);
		}

	});
});

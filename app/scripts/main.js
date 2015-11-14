/*global THREE*/
'use strict';
const addScript = require('./lib/loadScript'); // Promise wrapper for script loading
const VerletWrapper = require('./lib/verletwrapper'); // Wrapper of the verlet worker
const textSprite = require('./lib/textSprite'); // Generally sprites from canvas
const CameraInteractions = require('./lib/camerainteractions'); // Tool for making interactive VR elements
const TextureAnimator = require('./lib/textureanimator');
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

	/**
	 * Update textures to Baked ones and add envmap
	 */

	const textureLoader = new THREE.TextureLoader();
	const cubeTextureLoader = new THREE.CubeTextureLoader();

	// Select objects from the scene for later processing.
	const toTexture = threeHelper.pickObjectsHelper(threeHelper.scene, 'Room', 'Counter', 'Cake', 'Swirl.000', 'Swirl.001', 'Swirl.002', 'Swirl.003', 'Swirl.004', 'Swirl.005', 'Swirl.006', 'Swirl.007', 'Swirl.008', 'Swirl.009');
	const toShiny = threeHelper.pickObjectsHelper(threeHelper.scene, 'LickTheWhisk', 'Whisk', 'SaucePan', 'SaucePan.001', 'SaucePan.002', 'SaucePan.003', 'Fridge');
	Object.keys(toTexture).forEach(name => {
		textureLoader.load(`models/Kitchen/${name.split('.')[0]}Bake.png`, map => toTexture[name].material = new THREE.MeshBasicMaterial({map}));
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



	/**
	 * Add a targeting reticule to the HUD to help align what the user is looking at
	 * Also add a circular progress bar.
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
				verlet.getPoints()
				.then(threeHelper.updateObjects)
				.then(() => waitingForPoints = false);
				waitingForPoints = true;
			}
			threeHelper.render();
		});



		/**
		 * Add some interactivity
		 */
		let loaderSprite;

		// Load a loading animation
		// and then hide it for now
		textureLoader.load("images/loader.png", map => {
			const tA = new TextureAnimator(map, 8, 16, 116);
			const texture = new THREE.SpriteMaterial( { map, fog: false, transparent: true } );
			loaderSprite = new THREE.Sprite(texture);
			loaderSprite.animator = tA;
			loaderSprite.scale.multiplyScalar(0.9);
			threeHelper.on('prerender', () => {
				if (loaderSprite.visible) tA.update();
			});
			threeHelper.hud.add(loaderSprite);
			loaderSprite.visible = false;
		});

		function showLoader(callback) {
			if (!loaderSprite) return;
			loaderSprite.animator.currentTile = 0;
			loaderSprite.visible = true;
			loaderSprite.animator.on('finish', () => {
				hideLoader();
				callback();
			});
		}

		function hideLoader() {
			if (!loaderSprite) return;
			loaderSprite.visible = false;
			loaderSprite.animator.off('finish');
		}


		// Find the empty object where I am putting content
		const objects = threeHelper.pickObjectsHelper(threeHelper.scene, 'MarkerMain');

		// Make some content
		const meringue = toTexture['Swirl.000'].clone();
		objects.MarkerMain.add(meringue);
		meringue.scale.set(0.4, 0.4, 0.4);
		meringue.rotateZ(-1.9415926646002635);
		meringue.position.set(0,0,0);



		const interactiveElements = threeHelper.pickObjectsHelper(threeHelper.scene, 'LeftArrow', 'RightArrow');
		interactiveElements.meringue = meringue;
		Object.keys(interactiveElements).forEach(name => {
			const iEl = cameraInteractivityWorld.makeTarget(interactiveElements[name]);
			interactiveElements[name] = iEl;
			const rot = iEl.object3d.rotation;
			const sca = iEl.object3d.scale;
			const tween = new TWEEN.Tween({
				rX: rot.x,
				rY: rot.y,
				rZ: rot.z,
				sX: sca.x,
				sY: sca.y,
				sZ: sca.z,
			})
			.to({
				rZ: rot.z + 0.3,
				sX: sca.x * 1.1,
				sY: sca.y * 1.1,
				sZ: sca.z * 1.1,
			}, 400)
			.easing(TWEEN.Easing.Quadratic.InOut)
			.onUpdate(function () {
				rot.set(this.rX, this.rY, this.rZ);
				sca.set(this.sX, this.sY, this.sZ);
			})
			.repeat(Infinity)
			.yoyo(true)
			.start(0);

			iEl.on('hoverStart', () => {

				// Show the loader and send a click once
				// the animation has finished.
				showLoader(() => iEl.emit('click'));
			});

			iEl.on('hoverOut', () => {
				hideLoader();
			});
			let t = 2;
			iEl.on('hover', () => {
				tween.update(16*++t);
			});

			iEl.on('click', hideLoader);
		}); 

	});
});

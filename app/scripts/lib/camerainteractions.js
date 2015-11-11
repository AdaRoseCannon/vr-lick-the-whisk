/**
 * Sets up an enviroment for detecting that 
 * the camera is looking at objects.
 */

'use strict';
const EventEmitter = require('fast-event-emitter');
const util = require('util');

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

	function GoTarget(node) {

		EventEmitter.call(this);

		this.position = node.position;
		this.hasHover = false;
		this.sprite = node;
		this.sprite.material.opacity = 0.5;

		this.on('hover', () => {
			this.hasHover = true;
			this.sprite.material.opacity = 1;
		});

		this.on('hoverOut', () => {
			this.hasHover = false;
			this.sprite.material.opacity = 0.5;
		});

		this.hide = () =>{
			this.sprite.visible = false;
		};

		this.show = () =>{
			this.sprite.visible = true;
		};
	}
	util.inherits(GoTarget, EventEmitter);

	this.targets = new Map();

	this.detectInteractions = function (camera) {

		const raycaster = new THREE.Raycaster();
		raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
		const hits = raycaster.intersectObjects(
			Array.from(this.targets.values())
			.map(target => target.sprite)
			.filter(sprite => sprite.visible)
		);

		let target = false;

		if (hits.length) {

			// Show hidden text sprite child
			target = this.targets.get(hits[0].object);
			if (target) target.emit('hover');
		}

		// if it is not the one just marked for highlight
		// and it used to be highlighted un highlight it.
		Array.from(this.targets.values())
		.filter(eachTarget => eachTarget !== target)
		.forEach(eachNotHit => {
			if (eachNotHit.hasHover) eachNotHit.emit('hoverOut');
		});
	};

	const interact = (event) => {
		Array.from(this.targets.values()).forEach(target => {
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

	this.makeTarget = node => {
		const newTarget = new GoTarget(node);
		this.targets.set(node, newTarget);
		return newTarget;
	};
};

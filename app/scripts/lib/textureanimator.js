// Based on https://stemkoski.github.io/Three.js/Texture-Animation.html
/*global THREE*/
'use strict';
const util = require('util');
const EventEmitter = require('fast-event-emitter');

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
	texture.repeat.set( 1 / this.tilesHorizontal, 1 / this.tilesVertical );

	this.update = function() {
		this.currentTile = this.currentTile + 1;
		if (this.currentTile >= this.numberOfTiles) {
			this.currentTile = 0;
			this.emit('finish');
		}

		var currentColumn = this.currentTile % this.tilesHorizontal;
		texture.offset.x = currentColumn / this.tilesHorizontal;
		var currentRow = Math.floor( this.currentTile / this.tilesHorizontal );
		texture.offset.y = currentRow / this.tilesVertical;
	};
	this.update();
}

util.inherits(TextureAnimator, EventEmitter);
module.exports = TextureAnimator;

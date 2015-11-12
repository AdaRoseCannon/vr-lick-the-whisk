(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*jshint worker:true*/
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var World3D = require('verlet-system/3d');
var Constraint3D = require('verlet-constraint/3d');
var Point3D = require('verlet-point/3d');
var timeFactor = 1;
var vec3 = {
	create: require('gl-vec3/create'),
	add: require('gl-vec3/add'),
	// dot: require('gl-vec3/dot'),
	subtract: require('gl-vec3/subtract'),
	scale: require('gl-vec3/scale'),
	distance: require('gl-vec3/distance'),
	length: require('gl-vec3/length')
};

var p3DPrototype = new Point3D().constructor.prototype;
p3DPrototype.intersects = function (p) {
	return vec3.distance(this.position, p.position) <= this.radius + p.radius;
};
p3DPrototype.distanceFrom = function (p) {
	return vec3.distance(this.position, p.position);
};

function MyVerlet(options) {
	var _this = this;

	var VerletThreePoint = function VerletThreePoint(_ref) {
		var position = _ref.position;
		var radius = _ref.radius;
		var mass = _ref.mass;
		var attraction = _ref.attraction;
		var velocity = _ref.velocity;

		_classCallCheck(this, VerletThreePoint);

		this.initialRadius = radius;
		this.initialMass = mass;
		this.attraction = attraction;

		this.verletPoint = new Point3D({
			position: [position.x, position.y, position.z],
			mass: mass,
			radius: radius,
			attraction: attraction
		}).addForce([velocity.x, velocity.y, velocity.z]);
	};

	this.points = [];
	this.constraints = [];

	this.addPoint = function (options) {
		var p = new VerletThreePoint(options);
		p.id = _this.points.push(p) - 1;

		// if a point is attractive add a pulling force
		_this.points.forEach(function (p0) {
			if (p.attraction || p0.attraction && p !== p0) {
				_this.connect(p, p0, {
					stiffness: (p.attraction || 0) + (p0.attraction || 0),
					restingDistance: p.radius + p0.radius
				});
			}
		});

		return p;
	};

	this.connect = function (p1, p2, options) {
		if (!options) options = {
			stiffness: 0.05,
			restingDistance: p1.radius + p2.radius
		};

		var c = new Constraint3D([p1.verletPoint, p2.verletPoint], options);
		_this.constraints.push(c);
		return _this.constraints.indexOf(c);
	};

	this.size = options.size;

	this.world = new World3D({
		gravity: options.gravity ? [0, -9.8, 0] : undefined,
		min: [-this.size.x / 2, -this.size.y / 2, -this.size.z / 2],
		max: [this.size.x / 2, this.size.y / 2, this.size.z / 2],
		friction: 0.99
	});

	var oldT = 0;

	this.animate = function animate() {
		var t = Date.now();
		var dT = Math.min(0.032, (t - oldT) / 1000);
		var vP = this.points.map(function (p) {
			return p.verletPoint;
		});

		this.constraints.forEach(function (c) {
			return c.solve();
		});

		this.world.integrate(vP, dT * timeFactor);
		oldT = t;
	};
}

var verlet = undefined;

// Recieve messages from the client and reply back onthe same port
self.addEventListener('message', function (event) {

	var data = JSON.parse(event.data);
	Promise.all(data.map(function (_ref2) {
		var message = _ref2.message;
		var id = _ref2.id;
		return new Promise(function (resolve, reject) {
			var i = message;

			switch (i.action) {
				case 'init':
					verlet = new MyVerlet(i.options);
					return resolve();

				case 'getPoints':
					verlet.animate();
					return resolve({
						points: verlet.points.map(function (p) {
							return {
								radius: p.radius,
								position: {
									x: p.verletPoint.position[0].toPrecision(3),
									y: p.verletPoint.position[1].toPrecision(3),
									z: p.verletPoint.position[2].toPrecision(3)
								},
								id: p.id
							};
						})
					});

				case 'connectPoints':
					var p1 = verlet.points[i.options.p1.id];
					var p2 = verlet.points[i.options.p2.id];
					return resolve({
						constraintId: verlet.connect(p1, p2, i.options.constraintOptions)
					});

				case 'updateConstraint':
					var c = verlet.constraints[i.options.constraintId];
					if (i.options.stiffness !== undefined) c.stiffness = i.options.stiffness;
					if (i.options.restingDistance !== undefined) c.restingDistance = i.options.restingDistance;
					return resolve();

				case 'addPoint':
					return resolve({
						point: verlet.addPoint(i.pointOptions)
					});

				case 'updatePoint':
					var d = i.pointOptions;
					var p3 = verlet.points[d.id];
					if (d.position !== undefined) p3.verletPoint.place([d.position.x, d.position.y, d.position.z]);
					if (d.velocity !== undefined) p3.verletPoint.addForce([d.velocity.x, d.velocity.y, d.velocity.z]);
					if (d.mass !== undefined) p3.verletPoint.mass = d.mass;
					return resolve();

				case 'reset':
					verlet.points.splice(0);
					return resolve();

				default:
					throw Error('Invalid Action');
			}
		}).then(function () {
			var o = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			o.id = id;
			return o;
		}, function (err) {
			console.log(err);
			var o = {};
			if (err) {
				o.error = err.message ? err.message : err;
			}
			return o;
		});
	})).then(function (response) {
		event.ports[0].postMessage(JSON.stringify(response));
	});
});

},{"gl-vec3/add":2,"gl-vec3/create":4,"gl-vec3/distance":5,"gl-vec3/length":8,"gl-vec3/scale":10,"gl-vec3/subtract":12,"verlet-constraint/3d":13,"verlet-point/3d":15,"verlet-system/3d":17}],2:[function(require,module,exports){
module.exports = add;

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function add(out, a, b) {
    out[0] = a[0] + b[0]
    out[1] = a[1] + b[1]
    out[2] = a[2] + b[2]
    return out
}
},{}],3:[function(require,module,exports){
module.exports = copy;

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
function copy(out, a) {
    out[0] = a[0]
    out[1] = a[1]
    out[2] = a[2]
    return out
}
},{}],4:[function(require,module,exports){
module.exports = create;

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
function create() {
    var out = new Float32Array(3)
    out[0] = 0
    out[1] = 0
    out[2] = 0
    return out
}
},{}],5:[function(require,module,exports){
module.exports = distance;

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2]
    return Math.sqrt(x*x + y*y + z*z)
}
},{}],6:[function(require,module,exports){
module.exports = dot;

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}
},{}],7:[function(require,module,exports){
module.exports = fromValues;

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
function fromValues(x, y, z) {
    var out = new Float32Array(3)
    out[0] = x
    out[1] = y
    out[2] = z
    return out
}
},{}],8:[function(require,module,exports){
module.exports = length;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
function length(a) {
    var x = a[0],
        y = a[1],
        z = a[2]
    return Math.sqrt(x*x + y*y + z*z)
}
},{}],9:[function(require,module,exports){
module.exports = multiply;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function multiply(out, a, b) {
    out[0] = a[0] * b[0]
    out[1] = a[1] * b[1]
    out[2] = a[2] * b[2]
    return out
}
},{}],10:[function(require,module,exports){
module.exports = scale;

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
function scale(out, a, b) {
    out[0] = a[0] * b
    out[1] = a[1] * b
    out[2] = a[2] * b
    return out
}
},{}],11:[function(require,module,exports){
module.exports = squaredLength;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
function squaredLength(a) {
    var x = a[0],
        y = a[1],
        z = a[2]
    return x*x + y*y + z*z
}
},{}],12:[function(require,module,exports){
module.exports = subtract;

/**
 * Subtracts vector b from vector a
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
function subtract(out, a, b) {
    out[0] = a[0] - b[0]
    out[1] = a[1] - b[1]
    out[2] = a[2] - b[2]
    return out
}
},{}],13:[function(require,module,exports){
var vec3 = {
    create: require('gl-vec3/create'),
    add: require('gl-vec3/add'),
    dot: require('gl-vec3/dot'),
    sub: require('gl-vec3/subtract'),
    scale: require('gl-vec3/scale'),
    distance: require('gl-vec3/distance')
}
module.exports = require('./lib/build')(vec3)
},{"./lib/build":14,"gl-vec3/add":2,"gl-vec3/create":4,"gl-vec3/distance":5,"gl-vec3/dot":6,"gl-vec3/scale":10,"gl-vec3/subtract":12}],14:[function(require,module,exports){
module.exports = function(vec) {
    var delta = vec.create()
    var scaled = vec.create()

    function Constraint(points, opt) {
        if (!points || points.length !== 2)
            throw new Error('two points must be specified for the constraint')
        if (!points[0].position || !points[1].position)
            throw new Error('must specify verlet-point or similar, with { position }')
        this.points = points
        this.stiffness = 1.0
        if (opt && typeof opt.stiffness === 'number')
            this.stiffness = opt.stiffness

        if (opt && typeof opt.restingDistance === 'number')
            this.restingDistance = opt.restingDistance
        else
            this.restingDistance = vec.distance(this.points[0].position, this.points[1].position)
    }

    Constraint.prototype.solve = function() {
        //distance formula
        var p1 = this.points[0],
            p2 = this.points[1],
            p1vec = p1.position,
            p2vec = p2.position,
            p1mass = typeof p1.mass === 'number' ? p1.mass : 1,
            p2mass = typeof p2.mass === 'number' ? p2.mass : 1

        vec.sub(delta, p1vec, p2vec)
        var d = Math.sqrt(vec.dot(delta, delta))

        //ratio for resting distance
        var restingRatio = d===0 ? this.restingDistance : (this.restingDistance - d) / d
        var scalarP1, 
            scalarP2

        //handle zero mass a little differently
        if (p1mass===0||p2mass===0) {
            scalarP1 = this.stiffness
            scalarP2 = this.stiffness
        } else {
            //invert mass quantities
            var im1 = 1.0 / p1mass
            var im2 = 1.0 / p2mass
            scalarP1 = (im1 / (im1 + im2)) * this.stiffness
            scalarP2 = this.stiffness - scalarP1
        }
        
        //push/pull based on mass
        vec.scale(scaled, delta, scalarP1 * restingRatio)
        vec.add(p1vec, p1vec, scaled)
        
        vec.scale(scaled, delta, scalarP2 * restingRatio)
        vec.sub(p2vec, p2vec, scaled)

        return d
    }

    return function(p1, p2, opt) {
        return new Constraint(p1, p2, opt)
    }
}
},{}],15:[function(require,module,exports){
var vec3 = {
    create: require('gl-vec3/create'),
    sub: require('gl-vec3/subtract'),
    copy: require('gl-vec3/copy')
}
module.exports = require('./lib/build')(vec3)
},{"./lib/build":16,"gl-vec3/copy":3,"gl-vec3/create":4,"gl-vec3/subtract":12}],16:[function(require,module,exports){
module.exports = function(vec) {
    function Point(opt) {
        this.position = vec.create()
        this.previous = vec.create()
        this.acceleration = vec.create()
        this.mass = 1.0
        this.radius = 0

        if (opt && typeof opt.mass === 'number')
            this.mass = opt.mass
        if (opt && typeof opt.radius === 'number')
            this.radius = opt.radius

        if (opt && opt.position) 
            vec.copy(this.position, opt.position)
        
        if (opt && (opt.previous||opt.position)) 
            vec.copy(this.previous, opt.previous || opt.position)
        
        if (opt && opt.acceleration)
            vec.copy(this.acceleration, opt.acceleration)
    }

    Point.prototype.addForce = function(v) {
        vec.sub(this.previous, this.previous, v)
        return this
    }

    Point.prototype.place = function(v) {
        vec.copy(this.position, v)
        vec.copy(this.previous, v)
        return this
    }

    return function(opt) {
        return new Point(opt)
    }
}
},{}],17:[function(require,module,exports){
var vec3 = {
    create: require('gl-vec3/create'),
    add: require('gl-vec3/add'),
    multiply: require('gl-vec3/multiply'),
    sub: require('gl-vec3/subtract'),
    scale: require('gl-vec3/scale'),
    copy: require('gl-vec3/copy'),
    sqrLen: require('gl-vec3/squaredLength'),
    fromValues: require('gl-vec3/fromValues'),
}
module.exports = require('./lib/build')(vec3)
},{"./lib/build":19,"gl-vec3/add":2,"gl-vec3/copy":3,"gl-vec3/create":4,"gl-vec3/fromValues":7,"gl-vec3/multiply":9,"gl-vec3/scale":10,"gl-vec3/squaredLength":11,"gl-vec3/subtract":12}],18:[function(require,module,exports){
module.exports = function(vec) {
    var negInfinity = vec.fromValues(-Infinity, -Infinity, -Infinity)
    var posInfinity = vec.fromValues(Infinity, Infinity, Infinity)
    var ones = vec.fromValues(1, 1, 1)
    var reflect = vec.create()
    var EPSILON = 0.000001

    return function collider(p, velocity, min, max, friction) {
        if (!min && !max)
            return
            
        //reset reflection 
        vec.copy(reflect, ones)

        min = min || negInfinity
        max = max || posInfinity

        var i = 0,
            n = p.position.length,
            hit = false,
            radius = p.radius || 0

        //bounce and clamp
        for (i=0; i<n; i++)
            if (typeof min[i] === 'number' && p.position[i]-radius < min[i]) {
                reflect[i] = -1
                p.position[i] = min[i]+radius
                hit = true
            }
        for (i=0; i<n; i++)
            if (typeof max[i] === 'number' && p.position[i]+radius > max[i]) {
                reflect[i] = -1
                p.position[i] = max[i]-radius
                hit = true
            }

        //no bounce
        var len2 = vec.sqrLen(velocity)
        if (!hit || len2 <= EPSILON)
            return

        var m = Math.sqrt(len2)
        if (m !== 0) 
            vec.scale(velocity, velocity, 1/m)

        //scale bounce by friction
        vec.scale(reflect, reflect, m * friction)

        //bounce back
        vec.multiply(velocity, velocity, reflect)
    }
}
},{}],19:[function(require,module,exports){
var number = require('as-number')
var clamp = require('clamp')
var createCollider = require('./box-collision')

module.exports = function create(vec) {
    
    var collide = createCollider(vec)

    var velocity = vec.create()
    var tmp = vec.create()
    var zero = vec.create()
    
    function VerletSystem(opt) {
        if (!(this instanceof VerletSystem))
            return new VerletSystem(opt)
        
        opt = opt||{}

        this.gravity = opt.gravity || vec.create()
        this.friction = number(opt.friction, 0.98)
        this.min = opt.min
        this.max = opt.max
        this.bounce = number(opt.bounce, 1)
    }
    
    VerletSystem.prototype.collision = function(p, velocity) {
        collide(p, velocity, this.min, this.max, this.bounce)
    }

    VerletSystem.prototype.integratePoint = function(point, delta) {
        var mass = typeof point.mass === 'number' ? point.mass : 1

        //if mass is zero, assume body is static / unmovable
        if (mass === 0) {
            this.collision(point, zero)
            vec.copy(point.acceleration, zero)
            return
        }

        vec.add(point.acceleration, point.acceleration, this.gravity)
        vec.scale(point.acceleration, point.acceleration, mass)
            
        //difference in positions
        vec.sub(velocity, point.position, point.previous)

        //dampen velocity
        vec.scale(velocity, velocity, this.friction)

        //handle custom collisions in 2D or 3D space
        this.collision(point, velocity)

        //set last position
        vec.copy(point.previous, point.position)
        var tSqr = delta * delta
            
        //integrate
        vec.scale(tmp, point.acceleration, 0.5 * tSqr)
        vec.add(point.position, point.position, velocity)
        vec.add(point.position, point.position, tmp)

        //reset acceleration
        vec.copy(point.acceleration, zero)
    }

    VerletSystem.prototype.integrate = function(points, delta) {
        for (var i=0; i<points.length; i++) {
            this.integratePoint(points[i], delta)
        }
    }

    return VerletSystem
}
},{"./box-collision":18,"as-number":20,"clamp":21}],20:[function(require,module,exports){
module.exports = function numtype(num, def) {
	return typeof num === 'number'
		? num 
		: (typeof def === 'number' ? def : 0)
}
},{}],21:[function(require,module,exports){
module.exports = clamp

function clamp(value, min, max) {
  return min < max
    ? (value < min ? min : value > max ? max : value)
    : (value < max ? max : value > min ? min : value)
}

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9hZGEvZ2l0V29ya2luZ0Rpci9saWNrLXRoZS13aGlzay9hcHAvc2NyaXB0cy92ZXJsZXR3b3JrZXIuanMiLCJub2RlX21vZHVsZXMvZ2wtdmVjMy9hZGQuanMiLCJub2RlX21vZHVsZXMvZ2wtdmVjMy9jb3B5LmpzIiwibm9kZV9tb2R1bGVzL2dsLXZlYzMvY3JlYXRlLmpzIiwibm9kZV9tb2R1bGVzL2dsLXZlYzMvZGlzdGFuY2UuanMiLCJub2RlX21vZHVsZXMvZ2wtdmVjMy9kb3QuanMiLCJub2RlX21vZHVsZXMvZ2wtdmVjMy9mcm9tVmFsdWVzLmpzIiwibm9kZV9tb2R1bGVzL2dsLXZlYzMvbGVuZ3RoLmpzIiwibm9kZV9tb2R1bGVzL2dsLXZlYzMvbXVsdGlwbHkuanMiLCJub2RlX21vZHVsZXMvZ2wtdmVjMy9zY2FsZS5qcyIsIm5vZGVfbW9kdWxlcy9nbC12ZWMzL3NxdWFyZWRMZW5ndGguanMiLCJub2RlX21vZHVsZXMvZ2wtdmVjMy9zdWJ0cmFjdC5qcyIsIm5vZGVfbW9kdWxlcy92ZXJsZXQtY29uc3RyYWludC8zZC5qcyIsIm5vZGVfbW9kdWxlcy92ZXJsZXQtY29uc3RyYWludC9saWIvYnVpbGQuanMiLCJub2RlX21vZHVsZXMvdmVybGV0LXBvaW50LzNkLmpzIiwibm9kZV9tb2R1bGVzL3ZlcmxldC1wb2ludC9saWIvYnVpbGQuanMiLCJub2RlX21vZHVsZXMvdmVybGV0LXN5c3RlbS8zZC5qcyIsIm5vZGVfbW9kdWxlcy92ZXJsZXQtc3lzdGVtL2xpYi9ib3gtY29sbGlzaW9uLmpzIiwibm9kZV9tb2R1bGVzL3ZlcmxldC1zeXN0ZW0vbGliL2J1aWxkLmpzIiwibm9kZV9tb2R1bGVzL3ZlcmxldC1zeXN0ZW0vbm9kZV9tb2R1bGVzL2FzLW51bWJlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy92ZXJsZXQtc3lz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QUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQztBQUNyRCxLQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFDLENBQUMsQ0FBQztBQUNsRCxVQUFRLEVBQUUsSUFBSTtFQUNkLENBQUMsQ0FBQzs7QUFFSCxLQUFJLElBQUksR0FBRyxDQUFDLENBQUM7O0FBRWIsS0FBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLE9BQU8sR0FBRztBQUNqQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDckIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFBLEdBQUksSUFBSSxDQUFDLENBQUM7QUFDOUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDO1VBQUksQ0FBQyxDQUFDLFdBQVc7R0FBQSxDQUFDLENBQUM7O0FBRS9DLE1BQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQztVQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUU7R0FBQSxDQUFDLENBQUM7O0FBRXpDLE1BQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsVUFBVSxDQUFDLENBQUM7QUFDMUMsTUFBSSxHQUFHLENBQUMsQ0FBQztFQUNULENBQUM7Q0FFRjs7QUFHRCxJQUFJLE1BQU0sWUFBQSxDQUFDOzs7QUFHWCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFVBQVMs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QztBQUNELFVBQU8sQ0FBQyxDQUFDO0dBQ1QsQ0FBQztFQUFBLENBQ0YsQ0FBQyxDQUNELElBQUksQ0FBQyxVQUFVLFFBQVEsRUFBRTtBQUN6QixPQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7RUFDckQsQ0FBQyxDQUFDO0NBQ0osQ0FBQyxDQUFDOzs7QUNsTEg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qanNoaW50IHdvcmtlcjp0cnVlKi9cbid1c2Ugc3RyaWN0JztcblxuY29uc3QgV29ybGQzRCA9IHJlcXVpcmUoJ3ZlcmxldC1zeXN0ZW0vM2QnKTtcbmNvbnN0IENvbnN0cmFpbnQzRCA9IHJlcXVpcmUoJ3ZlcmxldC1jb25zdHJhaW50LzNkJyk7IFxuY29uc3QgUG9pbnQzRCA9IHJlcXVpcmUoJ3ZlcmxldC1wb2ludC8zZCcpO1xuY29uc3QgdGltZUZhY3RvciA9IDE7XG5jb25zdCB2ZWMzID0ge1xuICAgIGNyZWF0ZTogcmVxdWlyZSgnZ2wtdmVjMy9jcmVhdGUnKSxcbiAgICBhZGQ6IHJlcXVpcmUoJ2dsLXZlYzMvYWRkJyksXG4gICAgLy8gZG90OiByZXF1aXJlKCdnbC12ZWMzL2RvdCcpLFxuICAgIHN1YnRyYWN0OiByZXF1aXJlKCdnbC12ZWMzL3N1YnRyYWN0JyksXG4gICAgc2NhbGU6IHJlcXVpcmUoJ2dsLXZlYzMvc2NhbGUnKSxcbiAgICBkaXN0YW5jZTogcmVxdWlyZSgnZ2wtdmVjMy9kaXN0YW5jZScpLFxuICAgIGxlbmd0aDogcmVxdWlyZSgnZ2wtdmVjMy9sZW5ndGgnKVxufTtcblxuY29uc3QgcDNEUHJvdG90eXBlID0gKG5ldyBQb2ludDNEKCkpLmNvbnN0cnVjdG9yLnByb3RvdHlwZTtcbnAzRFByb3RvdHlwZS5pbnRlcnNlY3RzID0gZnVuY3Rpb24gKHApIHsgcmV0dXJuIHZlYzMuZGlzdGFuY2UodGhpcy5wb3NpdGlvbiwgcC5wb3NpdGlvbikgPD0gdGhpcy5yYWRpdXMgKyBwLnJhZGl1czsgfTtcbnAzRFByb3RvdHlwZS5kaXN0YW5jZUZyb20gPSBmdW5jdGlvbiAocCkgeyByZXR1cm4gdmVjMy5kaXN0YW5jZSh0aGlzLnBvc2l0aW9uLCBwLnBvc2l0aW9uKTsgfTtcblxuZnVuY3Rpb24gTXlWZXJsZXQob3B0aW9ucykge1xuXG5cdGNsYXNzIFZlcmxldFRocmVlUG9pbnQge1xuXHRcdGNvbnN0cnVjdG9yKHtcblx0XHRcdHBvc2l0aW9uLFxuXHRcdFx0cmFkaXVzLFxuXHRcdFx0bWFzcyxcblx0XHRcdGF0dHJhY3Rpb24sXG5cdFx0XHR2ZWxvY2l0eVxuXHRcdH0pIHtcblx0XHRcdHRoaXMuaW5pdGlhbFJhZGl1cyA9IHJhZGl1cztcblx0XHRcdHRoaXMuaW5pdGlhbE1hc3MgPSBtYXNzO1xuXHRcdFx0dGhpcy5hdHRyYWN0aW9uID0gYXR0cmFjdGlvbjtcblxuXHRcdFx0dGhpcy52ZXJsZXRQb2ludCA9IG5ldyBQb2ludDNEKHtcblx0XHRcdFx0cG9zaXRpb246IFsgcG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcG9zaXRpb24ueiBdLFxuXHRcdFx0XHRtYXNzLFxuXHRcdFx0XHRyYWRpdXMsXG5cdFx0XHRcdGF0dHJhY3Rpb25cblx0XHRcdH0pLmFkZEZvcmNlKFsgdmVsb2NpdHkueCwgdmVsb2NpdHkueSwgdmVsb2NpdHkueiBdKTtcblx0XHR9XG5cdH1cblxuXHR0aGlzLnBvaW50cyA9IFtdO1xuXHR0aGlzLmNvbnN0cmFpbnRzID0gW107XG5cblx0dGhpcy5hZGRQb2ludCA9IG9wdGlvbnMgPT4ge1xuXHRcdGNvbnN0IHAgPSBuZXcgVmVybGV0VGhyZWVQb2ludChvcHRpb25zKTtcblx0XHRwLmlkID0gdGhpcy5wb2ludHMucHVzaChwKSAtIDE7XG5cblx0XHQvLyBpZiBhIHBvaW50IGlzIGF0dHJhY3RpdmUgYWRkIGEgcHVsbGluZyBmb3JjZVxuXHRcdHRoaXMucG9pbnRzLmZvckVhY2gocDAgPT4ge1xuXHRcdFx0aWYgKHAuYXR0cmFjdGlvbiB8fCBwMC5hdHRyYWN0aW9uICYmIHAgIT09IHAwKSB7XG5cdFx0XHRcdHRoaXMuY29ubmVjdChwLCBwMCwge1xuXHRcdFx0XHRcdHN0aWZmbmVzczogKHAuYXR0cmFjdGlvbiB8fCAwKSArIChwMC5hdHRyYWN0aW9uIHx8IDApLFxuXHRcdFx0XHRcdHJlc3RpbmdEaXN0YW5jZTogcC5yYWRpdXMgKyBwMC5yYWRpdXNcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcDtcblx0fTtcblxuXHR0aGlzLmNvbm5lY3QgPSAocDEsIHAyLCBvcHRpb25zKSA9PiB7XG5cdFx0aWYgKCFvcHRpb25zKSBvcHRpb25zID0ge1xuXHRcdFx0c3RpZmZuZXNzOiAwLjA1LFxuXHRcdFx0cmVzdGluZ0Rpc3RhbmNlOiBwMS5yYWRpdXMgKyBwMi5yYWRpdXNcblx0XHR9O1xuXG5cdFx0Y29uc3QgYyA9IG5ldyBDb25zdHJhaW50M0QoW3AxLnZlcmxldFBvaW50LCBwMi52ZXJsZXRQb2ludF0sIG9wdGlvbnMpO1xuXHRcdHRoaXMuY29uc3RyYWludHMucHVzaChjKTtcblx0XHRyZXR1cm4gdGhpcy5jb25zdHJhaW50cy5pbmRleE9mKGMpO1xuXHR9O1xuXG5cdHRoaXMuc2l6ZSA9IG9wdGlvbnMuc2l6ZTtcblxuXHR0aGlzLndvcmxkID0gbmV3IFdvcmxkM0QoeyBcblx0XHRncmF2aXR5OiBvcHRpb25zLmdyYXZpdHkgPyBbMCwgLTkuOCwgMF0gOiB1bmRlZmluZWQsXG5cdFx0bWluOiBbLXRoaXMuc2l6ZS54LzIsIC10aGlzLnNpemUueS8yLCAtdGhpcy5zaXplLnovMl0sXG5cdFx0bWF4OiBbdGhpcy5zaXplLngvMiwgdGhpcy5zaXplLnkvMiwgdGhpcy5zaXplLnovMl0sXG5cdFx0ZnJpY3Rpb246IDAuOTlcblx0fSk7XG5cblx0bGV0IG9sZFQgPSAwO1xuXG5cdHRoaXMuYW5pbWF0ZSA9IGZ1bmN0aW9uIGFuaW1hdGUoKSB7XG5cdFx0Y29uc3QgdCA9IERhdGUubm93KCk7XG5cdFx0Y29uc3QgZFQgPSBNYXRoLm1pbigwLjAzMiwgKHQgLSBvbGRUKSAvIDEwMDApO1xuXHRcdGNvbnN0IHZQID0gdGhpcy5wb2ludHMubWFwKHAgPT4gcC52ZXJsZXRQb2ludCk7XG5cblx0XHR0aGlzLmNvbnN0cmFpbnRzLmZvckVhY2goYyA9PiBjLnNvbHZlKCkpO1xuXG5cdFx0dGhpcy53b3JsZC5pbnRlZ3JhdGUodlAsIGRUICogdGltZUZhY3Rvcik7XG5cdFx0b2xkVCA9IHQ7XG5cdH07XG5cbn1cblxuXG5sZXQgdmVybGV0O1xuXG4vLyBSZWNpZXZlIG1lc3NhZ2VzIGZyb20gdGhlIGNsaWVudCBhbmQgcmVwbHkgYmFjayBvbnRoZSBzYW1lIHBvcnRcbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XG5cdFx0Y29uc3QgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG5cdFx0UHJvbWlzZS5hbGwoZGF0YS5tYXAoKHttZXNzYWdlLCBpZH0pID0+IG5ldyBQcm9taXNlKFxuXHRcdFx0ZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuXHRcdFx0XHRjb25zdCBpID0gbWVzc2FnZTtcblxuXHRcdFx0XHRzd2l0Y2goaS5hY3Rpb24pIHtcblx0XHRcdFx0XHRjYXNlICdpbml0Jzpcblx0XHRcdFx0XHRcdHZlcmxldCA9IG5ldyBNeVZlcmxldChpLm9wdGlvbnMpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc29sdmUoKTtcblxuXHRcdFx0XHRcdGNhc2UgJ2dldFBvaW50cyc6XG5cdFx0XHRcdFx0XHR2ZXJsZXQuYW5pbWF0ZSgpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc29sdmUoe1xuXHRcdFx0XHRcdFx0XHRcdHBvaW50czogdmVybGV0LnBvaW50cy5tYXAocCA9PiAoe1xuXHRcdFx0XHRcdFx0XHRcdFx0cmFkaXVzOiBwLnJhZGl1cyxcblx0XHRcdFx0XHRcdFx0XHRcdHBvc2l0aW9uOiB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHg6IHAudmVybGV0UG9pbnQucG9zaXRpb25bMF0udG9QcmVjaXNpb24oMyksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHk6IHAudmVybGV0UG9pbnQucG9zaXRpb25bMV0udG9QcmVjaXNpb24oMyksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHo6IHAudmVybGV0UG9pbnQucG9zaXRpb25bMl0udG9QcmVjaXNpb24oMylcblx0XHRcdFx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRcdFx0XHRpZDogcC5pZFxuXHRcdFx0XHRcdFx0XHRcdH0pKVxuXHRcdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGNhc2UgJ2Nvbm5lY3RQb2ludHMnOlxuXHRcdFx0XHRcdFx0Y29uc3QgcDEgPSB2ZXJsZXQucG9pbnRzW2kub3B0aW9ucy5wMS5pZF07XG5cdFx0XHRcdFx0XHRjb25zdCBwMiA9IHZlcmxldC5wb2ludHNbaS5vcHRpb25zLnAyLmlkXTtcblx0XHRcdFx0XHRcdHJldHVybiByZXNvbHZlKHtcblx0XHRcdFx0XHRcdFx0Y29uc3RyYWludElkOiB2ZXJsZXQuY29ubmVjdChwMSwgcDIsIGkub3B0aW9ucy5jb25zdHJhaW50T3B0aW9ucylcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0Y2FzZSAndXBkYXRlQ29uc3RyYWludCc6XG5cdFx0XHRcdFx0XHRjb25zdCBjID0gdmVybGV0LmNvbnN0cmFpbnRzW2kub3B0aW9ucy5jb25zdHJhaW50SWRdO1xuXHRcdFx0XHRcdFx0aWYgKGkub3B0aW9ucy5zdGlmZm5lc3MgIT09IHVuZGVmaW5lZCkgYy5zdGlmZm5lc3MgPSBpLm9wdGlvbnMuc3RpZmZuZXNzO1xuXHRcdFx0XHRcdFx0aWYgKGkub3B0aW9ucy5yZXN0aW5nRGlzdGFuY2UgIT09IHVuZGVmaW5lZCkgYy5yZXN0aW5nRGlzdGFuY2UgPSBpLm9wdGlvbnMucmVzdGluZ0Rpc3RhbmNlO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHJlc29sdmUoKTtcblxuXHRcdFx0XHRcdGNhc2UgJ2FkZFBvaW50Jzpcblx0XHRcdFx0XHRcdHJldHVybiByZXNvbHZlKHtcblx0XHRcdFx0XHRcdFx0cG9pbnQ6IHZlcmxldC5hZGRQb2ludChpLnBvaW50T3B0aW9ucylcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0Y2FzZSAndXBkYXRlUG9pbnQnOlxuXHRcdFx0XHRcdFx0Y29uc3QgZCA9IGkucG9pbnRPcHRpb25zO1xuXHRcdFx0XHRcdFx0Y29uc3QgcDMgPSB2ZXJsZXQucG9pbnRzW2QuaWRdO1xuXHRcdFx0XHRcdFx0aWYgKGQucG9zaXRpb24gIT09IHVuZGVmaW5lZCkgcDMudmVybGV0UG9pbnQucGxhY2UoW2QucG9zaXRpb24ueCwgZC5wb3NpdGlvbi55LCBkLnBvc2l0aW9uLnpdKTtcblx0XHRcdFx0XHRcdGlmIChkLnZlbG9jaXR5ICE9PSB1bmRlZmluZWQpIHAzLnZlcmxldFBvaW50LmFkZEZvcmNlKFtkLnZlbG9jaXR5LngsIGQudmVsb2NpdHkueSwgZC52ZWxvY2l0eS56XSk7XG5cdFx0XHRcdFx0XHRpZiAoZC5tYXNzICE9PSB1bmRlZmluZWQpIHAzLnZlcmxldFBvaW50Lm1hc3MgPSBkLm1hc3M7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzb2x2ZSgpO1xuXG5cdFx0XHRcdFx0Y2FzZSAncmVzZXQnOlxuXHRcdFx0XHRcdFx0dmVybGV0LnBvaW50cy5zcGxpY2UoMCk7XG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzb2x2ZSgpO1xuXG5cdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdHRocm93IEVycm9yKCdJbnZhbGlkIEFjdGlvbicpO1xuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKG8gPSB7fSkge1xuXHRcdFx0XHRvLmlkID0gaWQ7XG5cdFx0XHRcdHJldHVybiBvO1xuXHRcdFx0fSwgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhlcnIpO1xuXHRcdFx0XHRjb25zdCBvID0ge307XG5cdFx0XHRcdGlmIChlcnIpIHtcblx0XHRcdFx0XHRvLmVycm9yID0gZXJyLm1lc3NhZ2UgPyBlcnIubWVzc2FnZSA6IGVycjtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gbztcblx0XHRcdH0pXG5cdFx0KSlcblx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcblx0XHRcdGV2ZW50LnBvcnRzWzBdLnBvc3RNZXNzYWdlKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSk7XG5cdFx0fSk7XG59KTtcblxuIiwibW9kdWxlLmV4cG9ydHMgPSBhZGQ7XG5cbi8qKlxuICogQWRkcyB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG5mdW5jdGlvbiBhZGQob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSArIGJbMF1cbiAgICBvdXRbMV0gPSBhWzFdICsgYlsxXVxuICAgIG91dFsyXSA9IGFbMl0gKyBiWzJdXG4gICAgcmV0dXJuIG91dFxufSIsIm1vZHVsZS5leHBvcnRzID0gY29weTtcblxuLyoqXG4gKiBDb3B5IHRoZSB2YWx1ZXMgZnJvbSBvbmUgdmVjMyB0byBhbm90aGVyXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgc291cmNlIHZlY3RvclxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG5mdW5jdGlvbiBjb3B5KG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF1cbiAgICBvdXRbMV0gPSBhWzFdXG4gICAgb3V0WzJdID0gYVsyXVxuICAgIHJldHVybiBvdXRcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3LCBlbXB0eSB2ZWMzXG4gKlxuICogQHJldHVybnMge3ZlYzN9IGEgbmV3IDNEIHZlY3RvclxuICovXG5mdW5jdGlvbiBjcmVhdGUoKSB7XG4gICAgdmFyIG91dCA9IG5ldyBGbG9hdDMyQXJyYXkoMylcbiAgICBvdXRbMF0gPSAwXG4gICAgb3V0WzFdID0gMFxuICAgIG91dFsyXSA9IDBcbiAgICByZXR1cm4gb3V0XG59IiwibW9kdWxlLmV4cG9ydHMgPSBkaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzN9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkaXN0YW5jZSBiZXR3ZWVuIGEgYW5kIGJcbiAqL1xuZnVuY3Rpb24gZGlzdGFuY2UoYSwgYikge1xuICAgIHZhciB4ID0gYlswXSAtIGFbMF0sXG4gICAgICAgIHkgPSBiWzFdIC0gYVsxXSxcbiAgICAgICAgeiA9IGJbMl0gLSBhWzJdXG4gICAgcmV0dXJuIE1hdGguc3FydCh4KnggKyB5KnkgKyB6KnopXG59IiwibW9kdWxlLmV4cG9ydHMgPSBkb3Q7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZG90IHByb2R1Y3Qgb2YgdHdvIHZlYzMnc1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZG90IHByb2R1Y3Qgb2YgYSBhbmQgYlxuICovXG5mdW5jdGlvbiBkb3QoYSwgYikge1xuICAgIHJldHVybiBhWzBdICogYlswXSArIGFbMV0gKiBiWzFdICsgYVsyXSAqIGJbMl1cbn0iLCJtb2R1bGUuZXhwb3J0cyA9IGZyb21WYWx1ZXM7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB2ZWMzIGluaXRpYWxpemVkIHdpdGggdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFggY29tcG9uZW50XG4gKiBAcGFyYW0ge051bWJlcn0geSBZIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHogWiBjb21wb25lbnRcbiAqIEByZXR1cm5zIHt2ZWMzfSBhIG5ldyAzRCB2ZWN0b3JcbiAqL1xuZnVuY3Rpb24gZnJvbVZhbHVlcyh4LCB5LCB6KSB7XG4gICAgdmFyIG91dCA9IG5ldyBGbG9hdDMyQXJyYXkoMylcbiAgICBvdXRbMF0gPSB4XG4gICAgb3V0WzFdID0geVxuICAgIG91dFsyXSA9IHpcbiAgICByZXR1cm4gb3V0XG59IiwibW9kdWxlLmV4cG9ydHMgPSBsZW5ndGg7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIG9mIGEgdmVjM1xuICpcbiAqIEBwYXJhbSB7dmVjM30gYSB2ZWN0b3IgdG8gY2FsY3VsYXRlIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gbGVuZ3RoIG9mIGFcbiAqL1xuZnVuY3Rpb24gbGVuZ3RoKGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdLFxuICAgICAgICB6ID0gYVsyXVxuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5ICsgeip6KVxufSIsIm1vZHVsZS5leHBvcnRzID0gbXVsdGlwbHk7XG5cbi8qKlxuICogTXVsdGlwbGllcyB0d28gdmVjMydzXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG5mdW5jdGlvbiBtdWx0aXBseShvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICogYlswXVxuICAgIG91dFsxXSA9IGFbMV0gKiBiWzFdXG4gICAgb3V0WzJdID0gYVsyXSAqIGJbMl1cbiAgICByZXR1cm4gb3V0XG59IiwibW9kdWxlLmV4cG9ydHMgPSBzY2FsZTtcblxuLyoqXG4gKiBTY2FsZXMgYSB2ZWMzIGJ5IGEgc2NhbGFyIG51bWJlclxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdGhlIHZlY3RvciB0byBzY2FsZVxuICogQHBhcmFtIHtOdW1iZXJ9IGIgYW1vdW50IHRvIHNjYWxlIHRoZSB2ZWN0b3IgYnlcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xuZnVuY3Rpb24gc2NhbGUob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAqIGJcbiAgICBvdXRbMV0gPSBhWzFdICogYlxuICAgIG91dFsyXSA9IGFbMl0gKiBiXG4gICAgcmV0dXJuIG91dFxufSIsIm1vZHVsZS5leHBvcnRzID0gc3F1YXJlZExlbmd0aDtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGxlbmd0aCBvZiBhIHZlYzNcbiAqXG4gKiBAcGFyYW0ge3ZlYzN9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBzcXVhcmVkIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBsZW5ndGggb2YgYVxuICovXG5mdW5jdGlvbiBzcXVhcmVkTGVuZ3RoKGEpIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdLFxuICAgICAgICB6ID0gYVsyXVxuICAgIHJldHVybiB4KnggKyB5KnkgKyB6Knpcbn0iLCJtb2R1bGUuZXhwb3J0cyA9IHN1YnRyYWN0O1xuXG4vKipcbiAqIFN1YnRyYWN0cyB2ZWN0b3IgYiBmcm9tIHZlY3RvciBhXG4gKlxuICogQHBhcmFtIHt2ZWMzfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjM30gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMzfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzN9IG91dFxuICovXG5mdW5jdGlvbiBzdWJ0cmFjdChvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC0gYlswXVxuICAgIG91dFsxXSA9IGFbMV0gLSBiWzFdXG4gICAgb3V0WzJdID0gYVsyXSAtIGJbMl1cbiAgICByZXR1cm4gb3V0XG59IiwidmFyIHZlYzMgPSB7XG4gICAgY3JlYXRlOiByZXF1aXJlKCdnbC12ZWMzL2NyZWF0ZScpLFxuICAgIGFkZDogcmVxdWlyZSgnZ2wtdmVjMy9hZGQnKSxcbiAgICBkb3Q6IHJlcXVpcmUoJ2dsLXZlYzMvZG90JyksXG4gICAgc3ViOiByZXF1aXJlKCdnbC12ZWMzL3N1YnRyYWN0JyksXG4gICAgc2NhbGU6IHJlcXVpcmUoJ2dsLXZlYzMvc2NhbGUnKSxcbiAgICBkaXN0YW5jZTogcmVxdWlyZSgnZ2wtdmVjMy9kaXN0YW5jZScpXG59XG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL2J1aWxkJykodmVjMykiLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHZlYykge1xuICAgIHZhciBkZWx0YSA9IHZlYy5jcmVhdGUoKVxuICAgIHZhciBzY2FsZWQgPSB2ZWMuY3JlYXRlKClcblxuICAgIGZ1bmN0aW9uIENvbnN0cmFpbnQocG9pbnRzLCBvcHQpIHtcbiAgICAgICAgaWYgKCFwb2ludHMgfHwgcG9pbnRzLmxlbmd0aCAhPT0gMilcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigndHdvIHBvaW50cyBtdXN0IGJlIHNwZWNpZmllZCBmb3IgdGhlIGNvbnN0cmFpbnQnKVxuICAgICAgICBpZiAoIXBvaW50c1swXS5wb3NpdGlvbiB8fCAhcG9pbnRzWzFdLnBvc2l0aW9uKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtdXN0IHNwZWNpZnkgdmVybGV0LXBvaW50IG9yIHNpbWlsYXIsIHdpdGggeyBwb3NpdGlvbiB9JylcbiAgICAgICAgdGhpcy5wb2ludHMgPSBwb2ludHNcbiAgICAgICAgdGhpcy5zdGlmZm5lc3MgPSAxLjBcbiAgICAgICAgaWYgKG9wdCAmJiB0eXBlb2Ygb3B0LnN0aWZmbmVzcyA9PT0gJ251bWJlcicpXG4gICAgICAgICAgICB0aGlzLnN0aWZmbmVzcyA9IG9wdC5zdGlmZm5lc3NcblxuICAgICAgICBpZiAob3B0ICYmIHR5cGVvZiBvcHQucmVzdGluZ0Rpc3RhbmNlID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgIHRoaXMucmVzdGluZ0Rpc3RhbmNlID0gb3B0LnJlc3RpbmdEaXN0YW5jZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICB0aGlzLnJlc3RpbmdEaXN0YW5jZSA9IHZlYy5kaXN0YW5jZSh0aGlzLnBvaW50c1swXS5wb3NpdGlvbiwgdGhpcy5wb2ludHNbMV0ucG9zaXRpb24pXG4gICAgfVxuXG4gICAgQ29uc3RyYWludC5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy9kaXN0YW5jZSBmb3JtdWxhXG4gICAgICAgIHZhciBwMSA9IHRoaXMucG9pbnRzWzBdLFxuICAgICAgICAgICAgcDIgPSB0aGlzLnBvaW50c1sxXSxcbiAgICAgICAgICAgIHAxdmVjID0gcDEucG9zaXRpb24sXG4gICAgICAgICAgICBwMnZlYyA9IHAyLnBvc2l0aW9uLFxuICAgICAgICAgICAgcDFtYXNzID0gdHlwZW9mIHAxLm1hc3MgPT09ICdudW1iZXInID8gcDEubWFzcyA6IDEsXG4gICAgICAgICAgICBwMm1hc3MgPSB0eXBlb2YgcDIubWFzcyA9PT0gJ251bWJlcicgPyBwMi5tYXNzIDogMVxuXG4gICAgICAgIHZlYy5zdWIoZGVsdGEsIHAxdmVjLCBwMnZlYylcbiAgICAgICAgdmFyIGQgPSBNYXRoLnNxcnQodmVjLmRvdChkZWx0YSwgZGVsdGEpKVxuXG4gICAgICAgIC8vcmF0aW8gZm9yIHJlc3RpbmcgZGlzdGFuY2VcbiAgICAgICAgdmFyIHJlc3RpbmdSYXRpbyA9IGQ9PT0wID8gdGhpcy5yZXN0aW5nRGlzdGFuY2UgOiAodGhpcy5yZXN0aW5nRGlzdGFuY2UgLSBkKSAvIGRcbiAgICAgICAgdmFyIHNjYWxhclAxLCBcbiAgICAgICAgICAgIHNjYWxhclAyXG5cbiAgICAgICAgLy9oYW5kbGUgemVybyBtYXNzIGEgbGl0dGxlIGRpZmZlcmVudGx5XG4gICAgICAgIGlmIChwMW1hc3M9PT0wfHxwMm1hc3M9PT0wKSB7XG4gICAgICAgICAgICBzY2FsYXJQMSA9IHRoaXMuc3RpZmZuZXNzXG4gICAgICAgICAgICBzY2FsYXJQMiA9IHRoaXMuc3RpZmZuZXNzXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2ludmVydCBtYXNzIHF1YW50aXRpZXNcbiAgICAgICAgICAgIHZhciBpbTEgPSAxLjAgLyBwMW1hc3NcbiAgICAgICAgICAgIHZhciBpbTIgPSAxLjAgLyBwMm1hc3NcbiAgICAgICAgICAgIHNjYWxhclAxID0gKGltMSAvIChpbTEgKyBpbTIpKSAqIHRoaXMuc3RpZmZuZXNzXG4gICAgICAgICAgICBzY2FsYXJQMiA9IHRoaXMuc3RpZmZuZXNzIC0gc2NhbGFyUDFcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy9wdXNoL3B1bGwgYmFzZWQgb24gbWFzc1xuICAgICAgICB2ZWMuc2NhbGUoc2NhbGVkLCBkZWx0YSwgc2NhbGFyUDEgKiByZXN0aW5nUmF0aW8pXG4gICAgICAgIHZlYy5hZGQocDF2ZWMsIHAxdmVjLCBzY2FsZWQpXG4gICAgICAgIFxuICAgICAgICB2ZWMuc2NhbGUoc2NhbGVkLCBkZWx0YSwgc2NhbGFyUDIgKiByZXN0aW5nUmF0aW8pXG4gICAgICAgIHZlYy5zdWIocDJ2ZWMsIHAydmVjLCBzY2FsZWQpXG5cbiAgICAgICAgcmV0dXJuIGRcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24ocDEsIHAyLCBvcHQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb25zdHJhaW50KHAxLCBwMiwgb3B0KVxuICAgIH1cbn0iLCJ2YXIgdmVjMyA9IHtcbiAgICBjcmVhdGU6IHJlcXVpcmUoJ2dsLXZlYzMvY3JlYXRlJyksXG4gICAgc3ViOiByZXF1aXJlKCdnbC12ZWMzL3N1YnRyYWN0JyksXG4gICAgY29weTogcmVxdWlyZSgnZ2wtdmVjMy9jb3B5Jylcbn1cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvYnVpbGQnKSh2ZWMzKSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odmVjKSB7XG4gICAgZnVuY3Rpb24gUG9pbnQob3B0KSB7XG4gICAgICAgIHRoaXMucG9zaXRpb24gPSB2ZWMuY3JlYXRlKClcbiAgICAgICAgdGhpcy5wcmV2aW91cyA9IHZlYy5jcmVhdGUoKVxuICAgICAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IHZlYy5jcmVhdGUoKVxuICAgICAgICB0aGlzLm1hc3MgPSAxLjBcbiAgICAgICAgdGhpcy5yYWRpdXMgPSAwXG5cbiAgICAgICAgaWYgKG9wdCAmJiB0eXBlb2Ygb3B0Lm1hc3MgPT09ICdudW1iZXInKVxuICAgICAgICAgICAgdGhpcy5tYXNzID0gb3B0Lm1hc3NcbiAgICAgICAgaWYgKG9wdCAmJiB0eXBlb2Ygb3B0LnJhZGl1cyA9PT0gJ251bWJlcicpXG4gICAgICAgICAgICB0aGlzLnJhZGl1cyA9IG9wdC5yYWRpdXNcblxuICAgICAgICBpZiAob3B0ICYmIG9wdC5wb3NpdGlvbikgXG4gICAgICAgICAgICB2ZWMuY29weSh0aGlzLnBvc2l0aW9uLCBvcHQucG9zaXRpb24pXG4gICAgICAgIFxuICAgICAgICBpZiAob3B0ICYmIChvcHQucHJldmlvdXN8fG9wdC5wb3NpdGlvbikpIFxuICAgICAgICAgICAgdmVjLmNvcHkodGhpcy5wcmV2aW91cywgb3B0LnByZXZpb3VzIHx8IG9wdC5wb3NpdGlvbilcbiAgICAgICAgXG4gICAgICAgIGlmIChvcHQgJiYgb3B0LmFjY2VsZXJhdGlvbilcbiAgICAgICAgICAgIHZlYy5jb3B5KHRoaXMuYWNjZWxlcmF0aW9uLCBvcHQuYWNjZWxlcmF0aW9uKVxuICAgIH1cblxuICAgIFBvaW50LnByb3RvdHlwZS5hZGRGb3JjZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdmVjLnN1Yih0aGlzLnByZXZpb3VzLCB0aGlzLnByZXZpb3VzLCB2KVxuICAgICAgICByZXR1cm4gdGhpc1xuICAgIH1cblxuICAgIFBvaW50LnByb3RvdHlwZS5wbGFjZSA9IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgdmVjLmNvcHkodGhpcy5wb3NpdGlvbiwgdilcbiAgICAgICAgdmVjLmNvcHkodGhpcy5wcmV2aW91cywgdilcbiAgICAgICAgcmV0dXJuIHRoaXNcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24ob3B0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQob3B0KVxuICAgIH1cbn0iLCJ2YXIgdmVjMyA9IHtcbiAgICBjcmVhdGU6IHJlcXVpcmUoJ2dsLXZlYzMvY3JlYXRlJyksXG4gICAgYWRkOiByZXF1aXJlKCdnbC12ZWMzL2FkZCcpLFxuICAgIG11bHRpcGx5OiByZXF1aXJlKCdnbC12ZWMzL211bHRpcGx5JyksXG4gICAgc3ViOiByZXF1aXJlKCdnbC12ZWMzL3N1YnRyYWN0JyksXG4gICAgc2NhbGU6IHJlcXVpcmUoJ2dsLXZlYzMvc2NhbGUnKSxcbiAgICBjb3B5OiByZXF1aXJlKCdnbC12ZWMzL2NvcHknKSxcbiAgICBzcXJMZW46IHJlcXVpcmUoJ2dsLXZlYzMvc3F1YXJlZExlbmd0aCcpLFxuICAgIGZyb21WYWx1ZXM6IHJlcXVpcmUoJ2dsLXZlYzMvZnJvbVZhbHVlcycpLFxufVxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9idWlsZCcpKHZlYzMpIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2ZWMpIHtcbiAgICB2YXIgbmVnSW5maW5pdHkgPSB2ZWMuZnJvbVZhbHVlcygtSW5maW5pdHksIC1JbmZpbml0eSwgLUluZmluaXR5KVxuICAgIHZhciBwb3NJbmZpbml0eSA9IHZlYy5mcm9tVmFsdWVzKEluZmluaXR5LCBJbmZpbml0eSwgSW5maW5pdHkpXG4gICAgdmFyIG9uZXMgPSB2ZWMuZnJvbVZhbHVlcygxLCAxLCAxKVxuICAgIHZhciByZWZsZWN0ID0gdmVjLmNyZWF0ZSgpXG4gICAgdmFyIEVQU0lMT04gPSAwLjAwMDAwMVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNvbGxpZGVyKHAsIHZlbG9jaXR5LCBtaW4sIG1heCwgZnJpY3Rpb24pIHtcbiAgICAgICAgaWYgKCFtaW4gJiYgIW1heClcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgXG4gICAgICAgIC8vcmVzZXQgcmVmbGVjdGlvbiBcbiAgICAgICAgdmVjLmNvcHkocmVmbGVjdCwgb25lcylcblxuICAgICAgICBtaW4gPSBtaW4gfHwgbmVnSW5maW5pdHlcbiAgICAgICAgbWF4ID0gbWF4IHx8IHBvc0luZmluaXR5XG5cbiAgICAgICAgdmFyIGkgPSAwLFxuICAgICAgICAgICAgbiA9IHAucG9zaXRpb24ubGVuZ3RoLFxuICAgICAgICAgICAgaGl0ID0gZmFsc2UsXG4gICAgICAgICAgICByYWRpdXMgPSBwLnJhZGl1cyB8fCAwXG5cbiAgICAgICAgLy9ib3VuY2UgYW5kIGNsYW1wXG4gICAgICAgIGZvciAoaT0wOyBpPG47IGkrKylcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbWluW2ldID09PSAnbnVtYmVyJyAmJiBwLnBvc2l0aW9uW2ldLXJhZGl1cyA8IG1pbltpXSkge1xuICAgICAgICAgICAgICAgIHJlZmxlY3RbaV0gPSAtMVxuICAgICAgICAgICAgICAgIHAucG9zaXRpb25baV0gPSBtaW5baV0rcmFkaXVzXG4gICAgICAgICAgICAgICAgaGl0ID0gdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICBmb3IgKGk9MDsgaTxuOyBpKyspXG4gICAgICAgICAgICBpZiAodHlwZW9mIG1heFtpXSA9PT0gJ251bWJlcicgJiYgcC5wb3NpdGlvbltpXStyYWRpdXMgPiBtYXhbaV0pIHtcbiAgICAgICAgICAgICAgICByZWZsZWN0W2ldID0gLTFcbiAgICAgICAgICAgICAgICBwLnBvc2l0aW9uW2ldID0gbWF4W2ldLXJhZGl1c1xuICAgICAgICAgICAgICAgIGhpdCA9IHRydWVcbiAgICAgICAgICAgIH1cblxuICAgICAgICAvL25vIGJvdW5jZVxuICAgICAgICB2YXIgbGVuMiA9IHZlYy5zcXJMZW4odmVsb2NpdHkpXG4gICAgICAgIGlmICghaGl0IHx8IGxlbjIgPD0gRVBTSUxPTilcbiAgICAgICAgICAgIHJldHVyblxuXG4gICAgICAgIHZhciBtID0gTWF0aC5zcXJ0KGxlbjIpXG4gICAgICAgIGlmIChtICE9PSAwKSBcbiAgICAgICAgICAgIHZlYy5zY2FsZSh2ZWxvY2l0eSwgdmVsb2NpdHksIDEvbSlcblxuICAgICAgICAvL3NjYWxlIGJvdW5jZSBieSBmcmljdGlvblxuICAgICAgICB2ZWMuc2NhbGUocmVmbGVjdCwgcmVmbGVjdCwgbSAqIGZyaWN0aW9uKVxuXG4gICAgICAgIC8vYm91bmNlIGJhY2tcbiAgICAgICAgdmVjLm11bHRpcGx5KHZlbG9jaXR5LCB2ZWxvY2l0eSwgcmVmbGVjdClcbiAgICB9XG59IiwidmFyIG51bWJlciA9IHJlcXVpcmUoJ2FzLW51bWJlcicpXG52YXIgY2xhbXAgPSByZXF1aXJlKCdjbGFtcCcpXG52YXIgY3JlYXRlQ29sbGlkZXIgPSByZXF1aXJlKCcuL2JveC1jb2xsaXNpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZSh2ZWMpIHtcbiAgICBcbiAgICB2YXIgY29sbGlkZSA9IGNyZWF0ZUNvbGxpZGVyKHZlYylcblxuICAgIHZhciB2ZWxvY2l0eSA9IHZlYy5jcmVhdGUoKVxuICAgIHZhciB0bXAgPSB2ZWMuY3JlYXRlKClcbiAgICB2YXIgemVybyA9IHZlYy5jcmVhdGUoKVxuICAgIFxuICAgIGZ1bmN0aW9uIFZlcmxldFN5c3RlbShvcHQpIHtcbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFZlcmxldFN5c3RlbSkpXG4gICAgICAgICAgICByZXR1cm4gbmV3IFZlcmxldFN5c3RlbShvcHQpXG4gICAgICAgIFxuICAgICAgICBvcHQgPSBvcHR8fHt9XG5cbiAgICAgICAgdGhpcy5ncmF2aXR5ID0gb3B0LmdyYXZpdHkgfHwgdmVjLmNyZWF0ZSgpXG4gICAgICAgIHRoaXMuZnJpY3Rpb24gPSBudW1iZXIob3B0LmZyaWN0aW9uLCAwLjk4KVxuICAgICAgICB0aGlzLm1pbiA9IG9wdC5taW5cbiAgICAgICAgdGhpcy5tYXggPSBvcHQubWF4XG4gICAgICAgIHRoaXMuYm91bmNlID0gbnVtYmVyKG9wdC5ib3VuY2UsIDEpXG4gICAgfVxuICAgIFxuICAgIFZlcmxldFN5c3RlbS5wcm90b3R5cGUuY29sbGlzaW9uID0gZnVuY3Rpb24ocCwgdmVsb2NpdHkpIHtcbiAgICAgICAgY29sbGlkZShwLCB2ZWxvY2l0eSwgdGhpcy5taW4sIHRoaXMubWF4LCB0aGlzLmJvdW5jZSlcbiAgICB9XG5cbiAgICBWZXJsZXRTeXN0ZW0ucHJvdG90eXBlLmludGVncmF0ZVBvaW50ID0gZnVuY3Rpb24ocG9pbnQsIGRlbHRhKSB7XG4gICAgICAgIHZhciBtYXNzID0gdHlwZW9mIHBvaW50Lm1hc3MgPT09ICdudW1iZXInID8gcG9pbnQubWFzcyA6IDFcblxuICAgICAgICAvL2lmIG1hc3MgaXMgemVybywgYXNzdW1lIGJvZHkgaXMgc3RhdGljIC8gdW5tb3ZhYmxlXG4gICAgICAgIGlmIChtYXNzID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxpc2lvbihwb2ludCwgemVybylcbiAgICAgICAgICAgIHZlYy5jb3B5KHBvaW50LmFjY2VsZXJhdGlvbiwgemVybylcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgdmVjLmFkZChwb2ludC5hY2NlbGVyYXRpb24sIHBvaW50LmFjY2VsZXJhdGlvbiwgdGhpcy5ncmF2aXR5KVxuICAgICAgICB2ZWMuc2NhbGUocG9pbnQuYWNjZWxlcmF0aW9uLCBwb2ludC5hY2NlbGVyYXRpb24sIG1hc3MpXG4gICAgICAgICAgICBcbiAgICAgICAgLy9kaWZmZXJlbmNlIGluIHBvc2l0aW9uc1xuICAgICAgICB2ZWMuc3ViKHZlbG9jaXR5LCBwb2ludC5wb3NpdGlvbiwgcG9pbnQucHJldmlvdXMpXG5cbiAgICAgICAgLy9kYW1wZW4gdmVsb2NpdHlcbiAgICAgICAgdmVjLnNjYWxlKHZlbG9jaXR5LCB2ZWxvY2l0eSwgdGhpcy5mcmljdGlvbilcblxuICAgICAgICAvL2hhbmRsZSBjdXN0b20gY29sbGlzaW9ucyBpbiAyRCBvciAzRCBzcGFjZVxuICAgICAgICB0aGlzLmNvbGxpc2lvbihwb2ludCwgdmVsb2NpdHkpXG5cbiAgICAgICAgLy9zZXQgbGFzdCBwb3NpdGlvblxuICAgICAgICB2ZWMuY29weShwb2ludC5wcmV2aW91cywgcG9pbnQucG9zaXRpb24pXG4gICAgICAgIHZhciB0U3FyID0gZGVsdGEgKiBkZWx0YVxuICAgICAgICAgICAgXG4gICAgICAgIC8vaW50ZWdyYXRlXG4gICAgICAgIHZlYy5zY2FsZSh0bXAsIHBvaW50LmFjY2VsZXJhdGlvbiwgMC41ICogdFNxcilcbiAgICAgICAgdmVjLmFkZChwb2ludC5wb3NpdGlvbiwgcG9pbnQucG9zaXRpb24sIHZlbG9jaXR5KVxuICAgICAgICB2ZWMuYWRkKHBvaW50LnBvc2l0aW9uLCBwb2ludC5wb3NpdGlvbiwgdG1wKVxuXG4gICAgICAgIC8vcmVzZXQgYWNjZWxlcmF0aW9uXG4gICAgICAgIHZlYy5jb3B5KHBvaW50LmFjY2VsZXJhdGlvbiwgemVybylcbiAgICB9XG5cbiAgICBWZXJsZXRTeXN0ZW0ucHJvdG90eXBlLmludGVncmF0ZSA9IGZ1bmN0aW9uKHBvaW50cywgZGVsdGEpIHtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpPHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5pbnRlZ3JhdGVQb2ludChwb2ludHNbaV0sIGRlbHRhKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFZlcmxldFN5c3RlbVxufSIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbnVtdHlwZShudW0sIGRlZikge1xuXHRyZXR1cm4gdHlwZW9mIG51bSA9PT0gJ251bWJlcidcblx0XHQ/IG51bSBcblx0XHQ6ICh0eXBlb2YgZGVmID09PSAnbnVtYmVyJyA/IGRlZiA6IDApXG59IiwibW9kdWxlLmV4cG9ydHMgPSBjbGFtcFxuXG5mdW5jdGlvbiBjbGFtcCh2YWx1ZSwgbWluLCBtYXgpIHtcbiAgcmV0dXJuIG1pbiA8IG1heFxuICAgID8gKHZhbHVlIDwgbWluID8gbWluIDogdmFsdWUgPiBtYXggPyBtYXggOiB2YWx1ZSlcbiAgICA6ICh2YWx1ZSA8IG1heCA/IG1heCA6IHZhbHVlID4gbWluID8gbWluIDogdmFsdWUpXG59XG4iXX0=

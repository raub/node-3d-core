'use strict';

const EventEmitter = require('events');

const Rect = require('./rect');
const Vec2  = require('./math/vec2');

class Surface extends Rect {
	
	
	constructor(opts) {
		
		opts.pos = new Vec2(-300, -300)
		opts.size = new Vec2(600, 600)
		
		super(opts);
		
		this._events = new EventEmitter();
		
		
		// Create a different scene to hold our buffer objects
		if ( ! opts.camera ) {
			this._camera = new this.three.PerspectiveCamera(45, this.width / this.height, 5, 100000000);
			this._camera.position.z = 1000;
		} else {
			this._camera = opts.camera;
		}
		
		if ( ! opts.scene ) {
			this._scene = new this.three.Scene();
		} else {
			this._scene = opts.scene;
		}
		
		// Init RTT
		this._target = this._newTarget();
		this.draw();
		
		
		this.mesh.material = new this.three.ShaderMaterial({
			
			side: this.three.DoubleSide,
			
			uniforms      : { type: 't', t: { value: this._target.texture } },
			
			vertexShader  : `
				varying vec2 tc;
				void main() {
					tc = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
				}
			`,
			
			fragmentShader: `
				varying vec2 tc;
				uniform sampler2D t;
				void main() {
					// gl_FragColor = (vec4(1.0, 0.0, 1.0, 1.0) + texture2D(t, tc)) * 0.5;
					gl_FragColor = texture2D(t, tc);
				}
			`,
			
			depthWrite    : true,
			depthTest     : true,
			transparent   : true,
			
		});
		
		
		this.mesh.onBeforeRender = () => setTimeout(() => this.draw(), 0);
		
		
		this.mesh.geometry.computeBoundingSphere = () => {
			this.mesh.geometry.boundingSphere = new this.three.Sphere(undefined, Infinity);
		};
		this.mesh.geometry.computeBoundingSphere();
		
		this.mesh.geometry.computeBoundingBox = () => {
			this.mesh.geometry.boundingBox = new this.three.Box3();
		};
		this.mesh.geometry.computeBoundingBox();
		
		this.mesh.material.needsUpdate = true;
		
	}
	
	on(event, cb) {
		this[event === 'resize' ? '_events' : 'screen'].on(event, cb);
	}
	
	
	get canvas()   { return this.screen.canvas;   }
	get camera()   { return this._camera;         }
	// get camera()   { return this.screen.camera;   }
	get scene()    { return this._scene;          }
	// get scene()    { return this.screen.scene;    }
	get renderer() { return this.screen.renderer; }
	get context()  { return this.screen.context;  }
	get document() { return this.screen.document; }
	
	
	get title()  { return this.screen.title; }
	set title(v) { this.screen.title = v;    }
	
	
	get fov()  { return this.screen.fov; }
	set fov(v) { this.screen.fov = v;    }
	
	
	get size() { return super.size; }
	set size(v) {
		super.size = v;
		this.reset();
		this._events.emit('resize', { w: this.width, h: this.height });
	}
	
	
	reset() {
		this._target = this._newTarget();
		this.draw();
		// this.mesh.material.map = this._target.texture;
		// this.mesh.material.map.needsUpdate = true;
		this.mesh.material.uniforms.t.value = this._target.texture;
	}
	
	
	draw() {
		this.screen.renderer.render(this._scene, this._camera, this._target);
	}
	
	
	_newTarget() {
		// this._camera = new this.three.OrthographicCamera(0, this.w, this.h, 0, -100000, 100000 );
		
		return new this.three.WebGLRenderTarget(
			this.w * 2,
			this.h * 2,
			{
				minFilter : this.three.LinearFilter,
				magFilter : this.three.NearestFilter,
				format    : this.three.RGBAFormat,
			}
		);
	}
	
}

module.exports = Surface;

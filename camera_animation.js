//should get a path for the camera (an array of vec3) must have at least 2 entries, 
//a path for the look at direction(an array of vec3) must have at lest 2 entries, 
//and a path for the up direction (optional, an array of vec3 or a single vec3).

import * as THREE from "three";

class CameraAnimationCurve {
    #t //this is the position along the curve between [0, 1] if not loop;
    
    //construct a new CameraAnimationCurve
    //camera : a three js camera
    //cameraPath : an array of vector3 that is the path the camera will take 
    //cameraLook : an array of vector3 that is the look direction during the animation path
    //cameraUp : an array of vector3 that is the up direction durring the animation
    //  idealy these arrays should be the same length, but they need not be, the first entry in the array will be the initial position and the final entry will be the final position
    //animationTime : the number of seconds that it will take for the animation to complete
    //loop : a bool that will indicat if the animation should loop (the curves will be closed)
    constructor({ camera=null, cameraPath=[], cameraLook=[], cameraUp=null, animationTime = 5.0, loop=false}) {
        
        console.assert(camera !== null, "CameraAnimationCurve Error: camera must not be null!")
        console.assert(cameraPath.length >= 2, "CameraAnimationCurve Error: cameraPath array must have at least 2 positions");
        console.assert(cameraLook.length >= 2, "CameraAnimationCurve Error: cameraLook array must have at least 2 positions");
        //should move over to type script and check that the arrays is full of vector3
        
        this.camera = camera;
        this.cameraPath = cameraPath;
        this.cameraLook = cameraLook;
        this.animationTime = animationTime;
        this.loop = loop;

        if (cameraUp !== null) {
            if (Array.isArray(cameraUp))
                this.cameraUp = cameraUp;
            else 
                this.cameraUp = [cameraUp, cameraUp];
        }
        else {
            this.cameraUp = [THREE.Object3D.DEFAULT_UP, THREE.Object3D.DEFAULT_UP];
        } 
        
        this.#t = 0.0;
        this.#calculateCurves();
    }

    #calculateCurves() {
        this.pathCurve = new THREE.CatmullRomCurve3(this.cameraPath, this.loop);
        this.lookCurve = new THREE.CatmullRomCurve3(this.cameraLook, this.loop);
        this.upCurve = new THREE.CatmullRomCurve3(this.cameraUp, this.loop);
    }

    //updates the animation based a given delta time
    update(delta) {
        console.assert(typeof delta === "number", "CameraAnimationCurve::update Error: delta must be a number");
        this.#t += delta / this.animationTime;
        this.#setCamera()
    }

    updateByTime(time) {
        this.#t = time / this.animationTime;
        this.#setCamera();
    }

    #clamp_t() {
        this.#t = (this.loop === false && this.#t > 1.0) ? 1.0 : this.#t;
    }

    #setCamera() {
        this.#clamp_t();
        this.camera.position.copy( this.pathCurve.getPoint(this.#t) );
        this.camera.up.copy( this.upCurve.getPoint(this.#t) );
        this.camera.lookAt( this.lookCurve.getPoint(this.#t) );
    }

    //this is used for debuging
    #debugDump() {
        console.log("pathcurve point:" + JSON.stringify(this.pathCurve.getPoint(this.#t)) + 
            "upCurve point: " + this.upCurve.getPoint(this.#t) + 
            "lookCurve point: " + this.lookCurve.getPoint(this.#t) + 
            "camera: " + JSON.stringify(this.camera) + 
            "this: " + this
        )
    }
}

module.exports = CameraAnimationCurve
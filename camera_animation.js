//should get a path for the camera (an array of vec3) must have at least 2 entries, 
//a path for the look at direction(an array of vec3) must have at lest 2 entries, 
//and a path for the up direction (optional, an array of vec3 or a single vec3).

import * as THREE from "three";

class CameraAnimation { //this is a base class for all camera animations; it should not be instantiated.
    #timeScale;
    #timeScaleMem;
    #autoPlay;
    #first_flag;
    #play_flag;
    #t;
    #loop


    //this is a abstract class that defig some basic operation that all camera animation will use
    constructor({timeScale = 1,  autoPlay = true, animationTime = 5, loop = false}) {

        this.#timeScale = timeScale; //this will determin the speed of the animation when updateing, alowing the animation to be speed up or slowed 
        this.#timeScaleMem = timeScale; //this will remember the last set timescale, allowing for pausing and resuming with the pervious timeScale;
        this.#autoPlay = autoPlay; //this will determin if the animation will start playing on the first update call
        this.animationTime = animationTime; //the duration of the animation in seconds
        this.#loop = loop //boolean flag that indicates if the animation loops

        this.#first_flag = true;
        this.#play_flag = false; //flag indicating that the animation is playing
        this.#t = 0.0; // keep track of the animation state. Is a float [0,1]; 0 = start of animation, 1 = end of animation.


    }

    play() {
        this.#play_flag = true;
        this.timeScale = this.#timeScaleMem; //play at the memorized timeScale;
    }

    pause() { //pauses the animation 
        this.#play_flag = false;
        this.#timeScale = 0.0;
    }

    stop() {
        this.#play_flag = false;
        this.#t = 0;
    }

    isPlaying() {
        return this.#play_flag;
    }

    getTimeScale() {
        return this.#timeScale;
    }

    setTimeScale(timeScale) {
        this.#timeScaleMem = timeScale;

        if (timeScale)
            this.play();
        else 
            this.pause();
    }

    getAutoPlay() {
        return this.#autoPlay;
    }

    setAutoPlay({bool=!this.#autoPlay}) {
        this.#autoPlay = bool;
    }

    update({delta = 0, animationTime = 5}) { //will update the animation by a delta time 
        if (this.#first_flag) {
            this.#first_flag = false;
            if (this.#autoPlay)
                this.#play_flag = true;
                this.#timeScale = 1.0;
        } 


        console.assert(typeof delta === "number", "CameraAnimationCurve::update Error: delta must be a number");
        this.#t += (delta / animationTime) * this.#timeScale;
        //this.#clamp_t();
    }

    updateByTime(time) { //will update an animation based on a given time (note: this will not be affected by the timeScale variable, or the play state)
        this.#t = time / this.animationTime;
        //this.#clamp_t();
    }

    getT() {
        return this.#t;
    }

    #clamp_t() {
        this.#t = (this.#loop === false && this.#t > 1.0) ? 1.0 : this.#t;
    }

    #debugDump(delta) {
        console.log("t: " +  this.#t +
        " timescale: " + this.#timeScale +
        " timeScaleMem: " + this.#timeScaleMem + 
        " autoPlay: " + this.#autoPlay + 
        " play_flag: " + this.#play_flag + 
        " first_flag: " + this.#first_flag +
        " loop: " + this.#loop +
        " delta: " + delta); 
    }

}

export class CameraAnimationCurve extends CameraAnimation {
    
    //construct a new CameraAnimationCurve
    //camera : a three js camera
    //cameraPath : an array of vector3 that is the path the camera will take 
    //cameraLook : an array of vector3 that is the look direction during the animation path
    //cameraUp : an array of vector3 that is the up direction durring the animation
    //  idealy these arrays should be the same length, but they need not be, the first entry in the array will be the initial position and the final entry will be the final position
    //animationTime : the number of seconds that it will take for the animation to complete
    //loop : a boolean that will indicat if the animation should loop (the curves will be closed);
    constructor({ camera=null, cameraPath=[], cameraLook=[], cameraUp=null, animationTime = 5.0, loop=false, autoPlay=true, timeScale}) {
        
        super({timeScale:1.0, autoPlay:autoPlay, animationTime:animationTime, loop:loop})
        console.assert(camera !== null, "CameraAnimationCurve Error: camera must not be null!")
        console.assert(cameraPath.length >= 2, "CameraAnimationCurve Error: cameraPath array must have at least 2 positions");
        console.assert(cameraLook.length >= 2, "CameraAnimationCurve Error: cameraLook array must have at least 2 positions");
        //should move over to type script and check that the arrays is full of vector3
        
        this.camera = camera;
        this.cameraPath = cameraPath;
        this.cameraLook = cameraLook;
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
        
        this.#calculateCurves();
    }

    #calculateCurves() {
        this.pathCurve = new THREE.CatmullRomCurve3(this.cameraPath, this.loop);
        this.lookCurve = new THREE.CatmullRomCurve3(this.cameraLook, this.loop);
        this.upCurve = new THREE.CatmullRomCurve3(this.cameraUp, this.loop);
    }

    //updates the animation based a given delta time
    update(delta) {
        super.update({delta:delta, animationTime:this.animationTime});
        this.#setCamera()
    }

    updateByTime(time) {
        super.updateByTime(time, this.animationTime);
        this.#setCamera();
    }


    #setCamera() {
        this.camera.position.copy( this.pathCurve.getPoint(this.getT()) );
        this.camera.up.copy( this.upCurve.getPoint(this.getT()) );
        this.camera.lookAt( this.lookCurve.getPoint(this.getT()) );
    }

    #debugDump() {
        console.log("pathcurve point:" + JSON.stringify(this.pathCurve.getPoint(this.getT())) + 
            "upCurve point: " + this.upCurve.getPoint(this.getT()) + 
            "lookCurve point: " + this.lookCurve.getPoint(this.getT()) + 
            "camera: " + JSON.stringify(this.camera) + 
            "this: " + this
        )
    }
}
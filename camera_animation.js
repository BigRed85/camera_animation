//should get a path for the camera (an array of vec3) must have at least 2 entries, 
//a path for the look at direction(an array of vec3) must have at lest 2 entries, 
//and a path for the up direction (optional, an array of vec3 or a single vec3).

import * as THREE from "three";

export const NO_TRANSITON = 0;
export const LINEAR_TRANSITION = 1; 
export const SIN_TRANSITON = 2;
export const QUADRADIC_TRANSITION = 3;
export const LOG_TRANSITION = 4;
export const CUSTOM_TRANSITION = 10;

function linearTransition(fraction) {
    return fraction;
}

function sinTransition(fraction) {
    return Math.sin(fraction * Math.PI / 2);
}

function quadradicTransition(fraction) {
    return fraction * fraction;
}

function logTransition(fraction) {
    return (Math.log(fraction) + 4) / 4; 
}


//curently no transiton, will work on this in a next update.
export class CameraDirector {
    //this class will manage multiple camera animations including transitioning between animations, creating an animation queue, etc.
    #transitionType; //a flag that tells the type of transition that will take place
    #transitionTime; //the time it will take to fully transition to the next animation
    #inTransition; // a boolean flag the indicates if a transition has started;
    #inTransitionNext;
    #transitionStartTime; //the time that the next transition should start
    #transitionStartTimecurrent; //the start time of the current transition; 
    #transitionFunction;
    
    #animations;
    #elapsedTime;
    #finishTime;
    #isPlaying;
    #timeScale;
    #timeScaleMem;
    #firstUpdate;
    #autoPlay;



    //clock should be given by user to ensure that the program is running of the same clock, if the clock is not handed over an error message will apear
    constructor({transitionType = NO_TRANSITON, 
        transitionTime = 0, 
        animations = [{aniamtion:null, name:null}],
        autoPlay = true,
        transitionFunction = null}) {
        
        this.setTransition({transitionType:transitionType, transitionTime:transitionTime, customFunction:transitionFunction});
        this.#inTransition = false;
        this.#inTransitionNext = false;
        
        
        this.#animations = animations;
        this.#isPlaying = false;
        this.#elapsedTime = 0;
        this.#timeScale = 1;
        this.#timeScaleMem = 1;
        this.#firstUpdate = true;
        this.#autoPlay = autoPlay;


    }

    enqueue({animation = new CameraAnimation(), name=""}) { //queues a new animation
        this.#animations.push({animation:animation, name:name});
    }

    setTransition({transitionType = NO_TRANSITON, transitionTime = 0, customFunction = null}) {
        
        this.#transitionType = transitionType;
        this.#transitionTime = transitionTime;

        switch (transitionType) {
            
            case LINEAR_TRANSITION:
                this.#transitionFunction = linearTransition;
                break;
            case QUADRADIC_TRANSITION:
                this.#transitionFunction = quadradicTransition;
                break;
            case SIN_TRANSITON:
                this.#transitionFunction = sinTransition;
                break;
            case LOG_TRANSITION:
                this.#transitionFunction = logTransition;
                break;
            case CUSTOM_TRANSITION:
                //check to make sure there is a function in the cutom function space.
                break;
            case NO_TRANSITON:
            default:
                this.#transitionFunction = null;
                break;
        }
    }

    play() {
        this.#play();
    }

    #play(index = 0) { //start playing the animation at the front of the queue
        //will need the start time of each animation, and the total time for the animation 
        if (this.#animations.length <= index)
            return false;

        if (!this.#isPlaying) { //if not paused or currently playing
            let animationTime = this.#animations[index].animation.getAnimaitonTime();
            this.#finishTime = this.#elapsedTime + animationTime;
            this.#transitionStartTime = this.#finishTime - this.#transitionTime;
            this.#isPlaying = true;
        }
        
        this.#animations[index].animation.play();
        this.#timeScale = this.#timeScaleMem;

        return true;
    }

    pause() {
        this.#timeScale = 0;
    }

    stop() {
        this.#isPlaying = false;
        this.#animations[0].animation.stop();
        //will also have to stop the next animation and the transition
        if(this.#inTransition) {
            this.#animations[1].animation.stop();
            this.#inTransition = false;
        }
    }

    next(transition = true) { //will start playing the next animation in the queue (by default with transition). returns true if the next animaiton has started playing
        if (this.#animations.length < 1)
            return false;

        this.#animations.shift();
        if (transition) {
            this.#inTransitionNext = true;
            this.#transitionStartTimecurrent = this.#elapsedTime;
        }
        
        return this.#play();
    }

    setTimeScale(timeScale = 1) {
        this.#timeScaleMem = timeScale;
        
        this.#play();
    }

    update(deltaTime = 0.0) {
        //will update the current playing animation, if we are transitioning to a next animation we should hadle that when an animation is finished we should start the next, if all animations are finished do nothing.
        
        if (this.#animations.length === 0)
            return;

        if (this.#firstUpdate && this.#autoPlay) {
            this.#firstUpdate = false;
            this.#play(0);
        }
        else if (this.#firstUpdate) {
            this.#firstUpdate = false;
        }
        
        if (this.#animations[0].animation.isFinished()) {
            if (!this.next(false)) {
                return;
            }
            this.#inTransition = false;
        }
        
        deltaTime = deltaTime * this.#timeScale;

        this.#elapsedTime += deltaTime;

        if (this.#inTransitionNext) {
            let weight = this.#transitionCalc();
            this.#animations[0].animation.update(deltaTime, weight);
        }
        else {
            this.#animations[0].animation.update(deltaTime);
        }
        
        if (this.#inTransition) {
            //there are two types of transition either form
            let weight = this.#transitionCalc(); 
            this.#animations[1].animation.update(deltaTime, weight);
        } 

        if (this.#transitionType && !this.#inTransition && this.#elapsedTime >= this.#transitionStartTime && this.#animations.length > 1) {
            //start transitioning to the next animation
            let transitionDelta = this.#elapsedTime - this.#transitionStartTime;
            this.#transitionStartTimecurrent = this.#transitionStartTime;
            this.#play(1);
            this.#inTransition = true;
            this.#animations[1].animation.update(transitionDelta);
        }

    }

    //returns the wight [0,1] calculated using the transition function
    #transitionCalc() {
        
        if (!this.#transitionFunction)
            return 1;

        let fraction = (this.#elapsedTime - this.#transitionStartTimecurrent) / this.#transitionTime;
        return this.#transitionFunction(fraction);
    }

    isPlaying() {
        return this.#isPlaying;
    }

    //returns an array containing the names of all the animation in the queue
    getAnimationNames() {
        let names = []
        for (let i = 0; i < this.#animations.length; i++) {
            names.push(this.#animations[i].name)
        }

        return names;
    }
    
    #debugDump(deltaTime) {
        console.log(
            "#transitionType" + this.#transitionType + 
            "#transitionTime" + this.#transitionTime + 
            "#inTransition;" + this.#inTransition + 
            "#transitionStartTime;"  + this.#transitionStartTime +
            "#animations;" + this.#animations + 
            "#elapsedTime;" + this.#elapsedTime + 
            "#nextTime;" + this.#finishTime + 
            "#isPlaying;" + this.#isPlaying + 
            "#timeScale;" + this.#timeScale + 
            "#timeScaleMem;" + this.#timeScaleMem + 
            "deltaTime: " + deltaTime
        );
    }
}

class CameraAnimation { //this is a base class for all camera animations; it should not be instantiated.
    #timeScale;
    #timeScaleMem;
    #autoPlay;
    #animationTime;
    #first_flag;
    #play_flag;
    #t;
    #loop;
    #isFinished;


    //this is a abstract class that defig some basic operation that all camera animation will use
    constructor({timeScale = 1,  autoPlay = true, animationTime = 5, loop = false}) {

        this.#timeScale = timeScale; //this will determin the speed of the animation when updateing, alowing the animation to be speed up or slowed 
        this.#timeScaleMem = timeScale; //this will remember the last set timescale, allowing for pausing and resuming with the pervious timeScale;
        this.#autoPlay = autoPlay; //this will determin if the animation will start playing on the first update call
        this.#animationTime = animationTime; //the duration of the animation in seconds
        this.#loop = loop //boolean flag that indicates if the animation loops

        this.#first_flag = true;
        this.#play_flag = false; //flag indicating that the animation is playing
        this.#t = 0.0; // keep track of the animation state. Is a float [0,1]; 0 = start of animation, 1 = end of animation.
        this.#isFinished = false;


    }

    play() {
        this.#play_flag = true;
        this.#timeScale = this.#timeScaleMem; //play at the memorized timeScale;
    }

    pause() { //pauses the animation 
        this.#play_flag = false;
        this.#timeScale = 0;
    }

    stop() {
        this.#play_flag = false;
        this.#t = 0;
        this.#timeScale = 0;
    }

    isPlaying() {
        return this.#play_flag;
    }

    isFinished() {
        return this.#isFinished;
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

    setAutoPlay(bool=!this.#autoPlay) {
        this.#autoPlay = bool;
    }

    update(deltaTime = 0) { //will update the animation by a delta time 
        if (this.#first_flag) {
            this.#first_flag = false;
            if (this.#autoPlay)
                this.play()
        } 


        console.assert(typeof deltaTime === "number", "CameraAnimationCurve::update Error: delta must be a number");
        this.#t += (deltaTime / this.#animationTime) * this.#timeScale;
        this.#clamp_t();

        //this.#debugDump(deltaTime);
    }

    updateByTime(time) { //will update an animation based on a given time (note: this will not be affected by the timeScale variable, or the play state)
        this.#t = time / this.#animationTime;
        this.#clamp_t();
    }

    getT() {
        return this.#t;
    }

    getAnimaitonTime() {
        return this.#animationTime;
    }

    #clamp_t() {
        if (this.#loop)
            return;
        
        this.#t = (this.#t > 1.0) ? 1.0 : this.#t;

        if (this.#t === 1) {
            this.#isFinished = true;
        }
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
    constructor(
        { camera=null, 
            keyframes=[],
            animationTime = 5.0, 
            loop = false, 
            autoPlay = true, 
            timeScale = 1.0}) {
        
        super({timeScale:timeScale, autoPlay:autoPlay, animationTime:animationTime, loop:loop})
        console.assert(camera !== null, "CameraAnimationCurve Error: camera must not be null!")
        console.assert(keyframes.length >= 2, "CameraAnimationCurve Error: keyframes array must have at least 2 positions")
        
        this.camera = camera;
        this.keyframes = keyframes;
        this.cameraPath = [];
        this.cameraLook = [];
        this.cameraUp = [];

        this.keyframes.forEach(keyframe => {
            this.cameraPath.push(keyframe.position);
            this.cameraLook.push(keyframe.lookAt);
            this.cameraUp.push(keyframe.up);
        });

        this.#calculateCurves();
    }

    #calculateCurves() {
        this.pathCurve = new THREE.CatmullRomCurve3(this.cameraPath, this.loop);
        this.lookCurve = new THREE.CatmullRomCurve3(this.cameraLook, this.loop);
        this.upCurve = new THREE.CatmullRomCurve3(this.cameraUp, this.loop);
    }

    //updates the animation based a given delta time
    update(deltaTime, weight = 1) {
        super.update(deltaTime);
        this.#setCamera(weight);
    }

    updateByTime(time) {
        super.updateByTime(time);
        this.#setCamera();
    }


    #setCamera(weight = 1) {
        this.camera.position.lerp( this.pathCurve.getPoint(this.getT()), weight );
        this.camera.up.lerp( this.upCurve.getPoint(this.getT()), weight );
        
        let camRotaion = this.camera.quaternion;
        this.camera.lookAt( this.lookCurve.getPoint(this.getT()) );
        camRotaion.slerp(this.camera.quaternion, weight);
        this.camera.setRotationFromQuaternion(camRotaion);
    }

    #debugDump() {
        console.log("pathcurve point:" + JSON.stringify(this.pathCurve.getPoint(this.getT())) + 
            "upCurve point: " + this.upCurve.getPoint(this.getT()) + 
            "lookCurve point: " + this.lookCurve.getPoint(this.getT()) + 
            "camera: " + JSON.stringify(this.camera) + 
            "this: " + this
        );
    }
}

export class CameraKeyFrame {
    constructor(
        {position = new THREE.Vector3(0, 0, 0), 
            lookAt = new THREE.Vector3(0, 0, 1), 
            up = new THREE.Vector3(0, 1, 0)}) 
    {
        this.position = position;
        this.lookAt = lookAt;
        this.up = up;    
    }
}
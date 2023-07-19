# camera_animation
This JS package contains classes that can be used to animate a ThreeJS camera.
Currently it only contains one type of camera animation called a CameraAnimationCurve that uses a Catmull–Rom spline to create a path for the camera to follow. It is writen in js and does not have any type checking currently so be carful when using this.

In the future there will be other types of animations and more type checking(I am hoping to move over to ts once I have learend more).

## Version History

### 1.0.3
Added the CameraKeyframe class. Animations should now take an array of keyframes. This should simplify the interface and make the animations more predictible. 

Small bug fixes.

### version 1.0.2
Added a CameraDirector class that will act as a controler for the difrent animations. The CameraDirector can pause, start and stop animations. It has a queue animaiton may be added and each animation will play one after the other (so long as the animaiton are not looping). It is able to smothly transition between animations, and controll the sepeed of the animations. 

### version 1.0.1
Added a CameraAnimation class that all camera animations will be subclasses of.

## important Classes, Functions and Constants

### Constants
NO_TRANSITON : flag for the CameraDirector
LINEAR_TRANSITION : flag for the CameraDirector
SIN_TRANSITON : flag for the CameraDirector
QUADRADIC_TRANSITION : flag for the CameraDirector
LOG_TRANSITION : flag for the CameraDirector
CUSTOM_TRANSITION : flag thet tells the CameraDirector that it should use a given custom function for 


### CameraDirector class
Acts as a contoler of the diffrent animations. The CameraDirector can pause, start and stop animations. It has a queue animaiton may be added and each animation will play one after the other (so long as the animaiton are not looping). It is able to smothly transition between animations, and controll the sepeed of the animations. 

Methods:
- constructor({transitionType = NO_TRANSITON, 
        transitionTime = 0, 
        animations = [{aniamtion:null, name:null}],
        autoPlay = true,
        transitionFunction = null})
    - transition Type can be any of the following:
        NO_TRANSITON
        LINEAR_TRANSITION
        SIN_TRANSITON
        QUADRADIC_TRANSITION
        LOG_TRANSITION
        CUSTOM_TRANSITION
    - transitionTime should be in seconds, it will determin how long it takes to ease into the animations.
    - animations is an array containg the animation data and the names of each anmiation, this will be the queue
    - if autoPlay is true the first time update is called the animations will start playing, if false you must first call the play method (the animation not progress)
    - transitionFunction is the custom function that will be used if the transition type is CUSTOM_TRANSITION, this should be a function that will take in a value in the range of 0 to 1 and return a value in the range of 0 to 1

- enqueue({animation = new CameraAnimation(), name=""})
    - adds a new animation to the animation queue
    - must be a concreate camera animation class not the virtual class.
    - if the name is not given then a name will be generated for the animation

- setTransition({transitionType = NO_TRANSITON, transitionTime = 0,customFunction = null})
    - sets the transition type and time
    - transition Type can be any of the following:
        NO_TRANSITON
        LINEAR_TRANSITION
        SIN_TRANSITON
        QUADRADIC_TRANSITION
        LOG_TRANSITION
        CUSTOM_TRANSITION
    - transitionTime should be in seconds, it will determin how long it takes to ease into the animations.
    - customFunction is the custom function that will be used if the transition type is CUSTOM_TRANSITION, this should be a function that will take in a value in the range of 0 to 1 and return a value in the range of 0 to 1

- play()
    - starts playing the first animation in the queue if no animation is playing
    - if the animations are paused it will resume all animations

- pause()
    - pauses the animations currently playing, the animations may be resumed via the play() method
    - this is the same as seting timeScale to 0.

- stop()
    - stops all animations currently playing, this means that all animations will be reset. the fist animation in the queue will start playing from the begining when the play() method is called

- next(transition = true)
    - will shift out the first animation in the queue and start playing the next animation
    - if transition is true the animation will be eased into using the transition function

- setTimeScale(timeScale = 1) 
    - sets the time scale, alowing the animations to be slowed or sped up 
    - note: this will also speed up the transition time
    - timeScale at 1 is default time scale, 2 is double speed, 0.5 is half speed

- update(deltaTime = 0.0) 
    - will update the current playing animation based on the given time delta.
    - this is affected by time scale
    - it will auto play on the first call if the autoPlay flage is set to true
    - it will advance to the next animation in the queue when the first animation is finished
    - it will initiate a transition to the next animation if the transition type is set.

- isPlaying()
    - returns a boolean that indicates if there is an animation playing
    - note: if the animations are paused it is still considerd as playing

- getAnimationNames
    - returns an array of strings, these are the names of all the animations in the queue

### CameraAnimation class
Is a base classe for camera animations. it does not have any animation data associated with it is simply the the sceleton that all camera animations should be built on this will allow the animations to be controled by the CameraDirector class

Methods:
- constructor({timeScale = 1,  autoPlay = true, animationTime = 5, loop = false})
    - timescale : sets the initial timeScale of the animation
    - autoPlay : flag that determins if the animation should start playing the first time the update function is called.
    - animationTime : the time in seconds that the animation spans
    - loop : a flag that will determin in the animation is looping 

- play()
    - starts playing the animation, alowing the update method to advance the animation
    - sets the timeScale to a memorized value

- pause()
    - pauses the animation
    - sets the time scale to 0
    - this stops the update() method from advancing the animation

- stop()
    - stops the animation
    - sets time scale to 0
    - resets the animation to start

- isPlaying()
    - returns true if the animation is playing, otherwise returns false

- isFinished() 
    - returns true if the animation has reached the end, otherwise returns false
    - when the animation is looping will always return false

- getTimeScale()
    - returns the current timescale

- setTimeScale(timeScale) 
    - sets the time scale to the given value
    - if timeScale is 0 it will pause the animation
    - if timeScale is not 0 it will call the play method
    
- getAutoPlay()
    - returns the autoPlay flag

- setAutoPlay(bool = !this.#autoPlay)
    - sets the autoPlay flag to the given value
    - if no value is given it will togal the value

- update(deltaTime = 0)
    - advances the animation based on the given time delta
    - if autoPlay is true on the first call then the animation will start playing and the time scale will be set to the memorised value

- updateByTime(time)
    - sets the animation based on the given time in seconds
    - is not affected by timeScale 
    - is not affected by the play, pause, of stop methods
    - this should not be the default update method for an animation 
    - this should only be used if the time delta is not available

- getT()
    - returns the interal variable #t 
    - this is the fraction of the animation compleated 
    - #t = 0 at the start of the animation
    - #t = 1 at the end of the animation

- getAnimaitonTime()
    - returns the length of the animation in seconds

### CameraAnimationCurve class
Extends CameraAnimation

It creates a curve path, based on Catmull–Rom spline curves, for the camera to follow; it may be a looping path.

Methods:
- constructor(
        { camera=null, 
            keyframes=[],
            animationTime = 5.0, 
            loop = false, 
            autoPlay = true, 
            timeScale = 1.0})
    - camera : is the threeJS camera that will be animated, this MUST be given
    - keyframes : is an array that should be filled with CameraKeyFrame objects, each keyframe will be equaly spaced out in the timeline with the first entry being the cameras initital position and the last entry being the final position
    - animationTime : the time in seconds it will take for the animation to be compleate
    - loop : a flag that determins if the animation is looping and the curves are closed
    - autoPlay : a flag the determins if the animation should play the first time the update method is called
    - timeScale : the speed of the animation, see CameraAnimation base class for more details

- update(deltaTime, weight = 1) 
    - updates the camera position based on a time delta
    - the weight deterimis how strong the animation should pull the camera, used for smoother transitions
    - see CameraAnimation base class for more detail

- updateByTime(time)
    - update the camera based on the given time 
    - see CameraAnimation base class for more detail

### CameraKeyFrame class
A class that is used by camera animations. It contains a position, a lookAt value, and an up direction.
- constructor(
        {position = new THREE.Vector3(0, 0, 0), 
            lookAt = new THREE.Vector3(0, 0, 1), 
            up = new THREE.Vector3(0, 1, 0)}) 

properties:
- position: 
    - a Vector3 value
- lookAt:
    - a Vector3 value
- up:
    - a Vector3 value
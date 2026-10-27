// Hand tracking runs locally in the browser once the model has downloaded.
// Camera frames are never transmitted or stored.
const sources=[
  {js:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs',wasm:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'},
  {js:'https://unpkg.com/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs',wasm:'https://unpkg.com/@mediapipe/tasks-vision@0.10.22/wasm'},
  {js:'https://esm.sh/@mediapipe/tasks-vision@0.10.22',wasm:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'}
];
export class HandTracker {
  constructor(video){this.video=video;this.landmarker=null;this.lastVideoTime=-1;this.lastPoints=[]}
  async init(){
    const errors=[];
    for(const source of sources){
      try{
        const lib=await import(source.js);
        const {HandLandmarker,FilesetResolver}=lib;
        if(!HandLandmarker||!FilesetResolver)throw Error('API MediaPipe introuvable');
        const vision=await FilesetResolver.forVisionTasks(source.wasm);
        this.landmarker=await HandLandmarker.createFromOptions(vision,{
          baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',delegate:'CPU'},
          runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:.5,minTrackingConfidence:.5
        });
        return;
      }catch(error){errors.push(source.js+': '+(error?.message||error))}
    }
    throw Error('Impossible de charger MediaPipe depuis les 3 sources. '+errors.map(x=>x.slice(0,90)).join(' | '));
  }
  detect(){
    if(!this.landmarker||this.video.readyState<2)return[];
    if(this.video.currentTime===this.lastVideoTime)return this.lastPoints;
    this.lastVideoTime=this.video.currentTime;
    const r=this.landmarker.detectForVideo(this.video,performance.now());
    this.lastPoints=(r.landmarks||[]).map(l=>({x:1-l[9].x,y:l[9].y}));
    return this.lastPoints;
  }
  close(){this.landmarker?.close();this.landmarker=null}
}

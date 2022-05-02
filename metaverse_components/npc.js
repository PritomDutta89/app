import * as THREE from 'three';
import metaversefile from 'metaversefile';
import metaversefileApi from '../metaversefile-api';

const localVector = new THREE.Vector3();

export default (app, component) => {
try {
  const {useFrame, useActivate, useLocalPlayer, useVoices, useChatManager, useLoreAIScene, useAvatarAnimations, useNpcManager, usePhysics, useCleanup} = metaversefile;
  // const scene = useScene();
  const npcManager = useNpcManager();
  const localPlayer = useLocalPlayer();
  const physics = usePhysics();
  const chatManager = useChatManager();
  const loreAIScene = useLoreAIScene();
  const voices = useVoices();
  const animations = useAvatarAnimations();
  const hurtAnimation = animations.find(a => a.isHurt);
  const hurtAnimationDuration = hurtAnimation.duration;

  const mode = app.getComponent('mode') ?? 'attached';

  if (mode === 'attached') {
    const npcName = component.name ?? 'Anon';
    const npcVoiceName = component.voice ?? 'Shining armor';
    const npcBio = component.bio ?? 'A generic avatar.';
    // const npcAvatarUrl = app.getComponent('avatarUrl') ?? `/avatars/Drake_hacker_v6_Guilty.vrm`;
    let npcWear = component.wear ?? [];
    if (!Array.isArray(npcWear)) {
      npcWear = [npcWear];
    }

    // ------------------------------------------- ConvAI Mods --------------------------------------------
    // Hold the list of attach you are picking up
    let npcApps = []

    // ----------------------------------------------------------------------------------------------------

    let live = true;
    let vrmApp = app;
    let npcPlayer = null;
    /* e.waitUntil(*/(async () => {
      // const u2 = npcAvatarUrl;
      // const m = await metaversefile.import(u2);
      // if (!live) return;
      
      // vrmApp = metaversefile.createApp({
      //   name: u2,
      // });

      /* vrmApp.matrixWorld.copy(app.matrixWorld);
      vrmApp.matrix.copy(app.matrixWorld)
        .decompose(vrmApp.position, vrmApp.quaternion, vrmApp.scale);
      vrmApp.name = 'npc';
      vrmApp.setComponent('physics', true); */

      // await vrmApp.addModule(m);
      // if (!live) return;

      const position = vrmApp.position.clone()
        .add(new THREE.Vector3(0, 1, 0));
      const {quaternion, scale} = vrmApp;
      const newNpcPlayer = npcManager.createNpc({
        name: npcName,
        avatarApp: vrmApp,
        position,
        quaternion,
        scale,
      });
      // if (!live) return;

      const _setVoice = () => {
        const voice = voices.voiceEndpoints.find(v => v.name === npcVoiceName);
        if (voice) {
          newNpcPlayer.setVoiceEndpoint(voice.drive_id);
        } else {
          console.warn('unknown voice name', npcVoiceName, voices.voiceEndpoints);
        }
      };
      _setVoice();

      const _updateWearables = async () => {
        const wearablePromises = npcWear.map(wear => (async () => {
          const {start_url} = wear;
          const app = await metaversefile.createAppAsync({
            start_url,
          });
          // if (!live) return;

          newNpcPlayer.wear(app);
        })());
        await wearablePromises;
      };
      await _updateWearables();
      if (!live) return;

      // scene.add(vrmApp);
      
      npcPlayer = newNpcPlayer;
    })()// );

    app.getPhysicsObjects = () => npcPlayer ? [npcPlayer.characterController] : [];

    app.addEventListener('hit', e => {
      if (!npcPlayer.hasAction('hurt')) {
        const newAction = {
          type: 'hurt',
          animation: 'pain_back',
        };
        npcPlayer.addAction(newAction);
        
        setTimeout(() => {
          npcPlayer.removeAction('hurt');
        }, hurtAnimationDuration * 1000);
      }
    });

    let targetSpec = null;
    useActivate(() => {
      // console.log('activate npc');
      if (targetSpec?.object !== localPlayer) {
        targetSpec = {
          type: 'follow',
          object: localPlayer,
        };
      } else {
        targetSpec = null;
      }
    });

    /* console.log('got deets', {
      npcName,
      npcVoice,
      npcBio,
      npcAvatarUrl,
    }); */

    function getAppByName (apps, appName) {
      for(var i =0;i<apps.length;i++){
        // console.log("Apps-i: ", apps[i].name.toUpperCase()) // drake_hacker_v1_vian - 
        // console.log("AppName: ", appName.toUpperCase()) // Drake - DRAKE
        if (apps[i].name.toUpperCase().includes(appName.toUpperCase())){
          return apps[i];
        }else {
          return null;
        }
      }
    }

    const character = loreAIScene.addCharacter({
      name: npcName,
      bio: npcBio,
    });
    // console.log('got character', character);

    // ----------------------------------------- ConvAI Mods --------------------------------------------------------------------
    // Re implemented the action code to the best of our understanding. Need mre clarification on the implementation

    // Helper function for parsing response with multiple actions and emotions
    const parse = (data) => {
      var c = []
      data.substring(1, data.length-1).match(/'(.*?)'/g)
      .map((word) => {c.push(word.trim().substring(1, word.length-1))})
      return c
    }

    character.addEventListener('say', e => {

      // console.log("World log: ", metaversefileApi.useWorld().getApps());
      var apps = metaversefileApi.useWorld().getApps();

      console.log('got character say', e.data);
      const {message, emote: emoteArrayString, action: actionArrayString, object: objectArrayString, target: targetArrayString} = e.data;
      
      const emote = parse(emoteArrayString)
      const action = parse(actionArrayString)
      const object = parse(objectArrayString)
      const target = parse(targetArrayString)
      
      chatManager.addPlayerMessage(npcPlayer, message);
      console.log("Actions: ",action);

      // Loop over all the emotions and actions supplied from the response
      for (var i=0;i<action.length;i++){
        if (emote[i] === 'supersaiyan' || action[i] === 'supersaiyan' || /supersaiyan/i.test(object[i]) || /supersaiyan/i.test(target[i])) {
          const newSssAction = {
            type: 'sss',
          };
          npcPlayer.addAction(newSssAction);
        }
  
        // This else-if section is hardcoded for testing
        // else if(action === 'none'){
        //   let objectApp = null
        //   for(var i =0;i<apps.length;i++){
        //     // console.log("Apps-i: ", apps[i].name.toUpperCase()) // drake_hacker_v1_vian - 
        //     // console.log("Object: ", object.split("/")[1].split("#")[0].toUpperCase()) // Drake - DRAKE
        //     if (apps[i].name.replace(" ", "").toUpperCase().includes("pistol".replace(" ", "").toUpperCase())){
        //       objectApp = apps[i];
        //       break;
        //     }
        //   }
  
        //   targetSpec = {
        //     type: 'grab',
        //     object: objectApp,
        //   };
        // }
  
        // Assuming we always follow the localPlayer for now
        else if ((action[i] === 'follow' || action[i] === 'follows') || (object[i] === 'none' && target[i] === localPlayer.name)) { // follow player
          targetSpec = {
            type: 'follow',
            object: localPlayer,
          };
        }
  
        else if (action[i] === 'stop') { // stop
          targetSpec = null;
        } 
        
        // Moveto either an object or a target
        else if ((action[i] === 'moveto' || action[i] === 'movesto') && (object[i] !== 'none' && target[i] === 'none')) { // move to object
          console.log('move to object', object[i]);
          /* target = localPlayer;
          targetType = 'follow'; */
  
          let objectApp = null
          for(var j =0;j<apps.length;j++){
  
            // Shortcut for easier access to app
            // console.log("Apps-i: ", apps[i].name.toUpperCase()) // [drake_hacker_v1_vian - DRAKE_HACKER_V1_VIAN ]
            // console.log("Object: ", object.split("/")[1].split("#")[0].toUpperCase()) // [Drake - DRAKE         ]
            if (apps[j].name.replace(" ", "").toUpperCase().includes(object[i].replace(" ", "").split("/")[1].split("#")[0].toUpperCase())){
              objectApp = apps[j];
              break;
            }
          }
  
          targetSpec = {
            type: 'moveto',
            object: objectApp,
          };
  
        } else if ((action[i] === 'moveto' || action[i] === 'movesto') && (object[i] === 'none' && target[i] !== 'none')) { // move to player
          // console.log('move to', object);
          let objectApp = null
          for(var j =0;j<apps.length;j++){
            if (apps[j].name.replace(" ", "").toUpperCase().includes(target[i].replace(" ", "").split("/")[1].split("#")[0].toUpperCase())){
              objectApp = apps[j];
              break;
            }
          }
  
          targetSpec = {
            type: 'moveto',
            // object: localPlayer,
            object: objectApp,
          };
        } 
        
        // NPC can pickup an object / target [Ambiguously defined]
        else if (['pickup', 'picksup', 'grab', 'take', 'get'].includes(action[i])) { // pick up object
          console.log('pickup', object[i], target[i]);
  
          let finalTarget = object[i] === 'none' ? target[i] : object[i];
          let objectApp = null
          for(var j =0;j<apps.length;j++){
            if (apps[j].name.replace(" ", "").toUpperCase().includes(finalTarget.replace(" ", "").split("/")[1].split("#")[0].toUpperCase())){
              objectApp = apps[j];
              // Adding that to the lsit of apps related to the npc
              npcApps.push(apps[j]);
              break;
            }
          }
  
          targetSpec = {
            type: 'grab',
            object: objectApp,
          };
        }
  
        // NPC can drop an object / target [Ambiguously defined]
        else if (['drop', 'drops'].includes(action[i])) { // pick up object
          // console.log('pickup', action, object, target);
          let finalTarget = object[i] === 'none' ? target[i] : object[i];
          let objectApp = null
          for(var j =0;j<npcApps.length;j++){
            if (npcApps[j].name.replace(" ", "").toUpperCase().includes(finalTarget.replace(" ", "").split("/")[1].split("#")[0].toUpperCase())){
              objectApp = npcApps[j];
              console.log("ObjectApp: ", objectApp);
              break;
            }
          }
  
          targetSpec = {
            type: 'drop',
            object: objectApp,
          };
        }
  
        // yet to be implementated
        else if (['use', 'activate'].includes(action[i])) { // use object
          console.log('use', action[i], object[i], target[i]);
        }
      }
      
    });

    // ------------------------------------------------------------------------------------------------------------------------------------------

    const slowdownFactor = 0.4;
    const walkSpeed = 0.075 * slowdownFactor;
    const runSpeed = walkSpeed * 8;
    const speedDistanceRate = 0.07;
    useFrame(({timestamp, timeDiff}) => {
      // console.log("Apps: ", metaversefileApi.useWorld());
      if (npcPlayer && physics.getPhysicsEnabled()) {
        if (targetSpec) {
          const target = targetSpec.object;
          const v = localVector.setFromMatrixPosition(target.matrixWorld)
            .sub(npcPlayer.position);
          v.y = 0;
          const distance = v.length();
          // if (targetSpec.type === 'moveto' && distance < 2) {
          //   targetSpec = null;
          // } else {
          //   const speed = Math.min(Math.max(walkSpeed + ((distance - 1.5) * speedDistanceRate), 0), runSpeed);
          //   v.normalize()
          //     .multiplyScalar(speed * timeDiff);
          //   npcPlayer.characterPhysics.applyWasd(v);
          // }

          // ------------------------------------------ ConvAI Mods ------------------------------------------------
          // Implemented with switch case to handle more actions

          switch(targetSpec.type){

            case "follow":
              if (distance > 2){
                const speed = Math.min(Math.max(walkSpeed + ((distance - 1.5) * speedDistanceRate), 0), runSpeed);
                v.normalize()
                  .multiplyScalar(speed * timeDiff);
                npcPlayer.characterPhysics.applyWasd(v);
              }
              break;

            case "moveto":
              if (distance < 2){
                targetSpec = null;
              } else {
                const speed = Math.min(Math.max(walkSpeed + ((distance - 1.5) * speedDistanceRate), 0), runSpeed);
                v.normalize()
                  .multiplyScalar(speed * timeDiff);
                npcPlayer.characterPhysics.applyWasd(v);
              }
              break;

            case "grab":

              // Distance is adjusted wrt maxGrabDistance
              if(distance < 1.5){
                // Directly render grab animation
                npcPlayer.wear(targetSpec.object);
                // Note: The app does not appear with the NPC yet
                // Add the app to list of apps for NPC
                npcApps.push(targetSpec.object)

                // Reinitialize targetSpec to null
                targetSpec = null;
              } else {
                // Move near the Object
                const speed = Math.min(Math.max(walkSpeed + ((distance - 1) * speedDistanceRate), 0), runSpeed);
                v.normalize()
                  .multiplyScalar(speed * timeDiff);
                npcPlayer.characterPhysics.applyWasd(v);
              }
              break;

            case "drop":
              npcPlayer.unwear(targetSpec.object);
              break;
          }
        }

        // -----------------------------------------------------------------------------------------------------------

        npcPlayer.eyeballTarget.copy(localPlayer.position);
        npcPlayer.eyeballTargetEnabled = true;

        npcPlayer.updatePhysics(timestamp, timeDiff);
        npcPlayer.updateAvatar(timestamp, timeDiff);
      }
    });

    useCleanup(() => {
      live = false;

      // scene.remove(vrmApp);

      if (npcPlayer) {
        npcManager.destroyNpc(npcPlayer);
      }

      loreAIScene.removeCharacter(character);
    });
  }

  return app;
} catch(err) {
  console.warn(err);
}
};

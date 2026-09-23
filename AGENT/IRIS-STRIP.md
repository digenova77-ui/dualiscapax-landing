# Iris strip — what stays on the plate

Stamp: 2026-09-23T15:02Z

## Lander loads (keep)

`iris-boot.js` splash only — no 10s canvas if there is no reel file  
`iris-realm.js` room line  
`iris-sphere.js` orb  
`dsap-engine.js` + `dsap.js` field  
`iris-voice.js` locale  
`iris-av.js` speak / listen / camera  
`iris-wav.js` hello take  
`iris-ring.js` greet → listen → speak → listen

No textarea. No second talk room.

## On disk, not on this lander (do not load)

iris-apex-bind, iris-cognitive-engine, iris-engine-link, iris-fuel-gate,  
iris-gl, iris-guest, iris-here, iris-hologram, iris-materialize,  
iris-page, iris-policy, iris-rapport, iris-rte, iris-session,  
av-bridge, dc-av, holo-sense, arkit-blendshapes

Leave the files. Other rooms may still point at them.  
Do not delete. Do not import them onto `/`.

## What was holding her

First visit used to play a 10s canvas reel after splash even with no video.  
That delay is gone. Splash ~1.2s then `iris:boot` then the ring.

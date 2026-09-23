# Iris greet take

Hello only. Replies stay TTS.

Play order on Voice-on / Talk / orb:

1. `audio/iris-greet.wav` if the file is on the rail
2. `audio/iris-greet.mp3` if the wav is missing
3. Embedded SoniaNeural take in `js/iris-greet.js`
4. Phone TTS of the same line

A short jewelry WAV sits on top of that hello. It is not speech.

Line on the take:

> Hey. I'm Iris. You walked into Dualis. Ask anything small for free. If you want the heavy work, I'll say the price first.

Voice: en-GB-SoniaNeural. Replacing TTS with WAV for every sentence would mute her on anything she has not already recorded.

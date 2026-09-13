    var currentUtterance = null;
    var audioUnlocked = false;

    function unlockMobileAudio() {
      if (audioUnlocked) return;
      try {
        if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
          var AudioCtor = window.AudioContext || window.webkitAudioContext;
          audioCtx = new AudioCtor();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().then(function() {
            audioUnlocked = true;
          });
        } else if (audioCtx && audioCtx.state === 'running') {
          audioUnlocked = true;
        }

        if (window.speechSynthesis) {
          window.speechSynthesis.resume();
          window.speechSynthesis.getVoices();
        }
      } catch (e) {
        console.warn("[Iris Audio] Unlock deferred:", e);
      }
    }

    ['click', 'touchstart', 'touchend', 'keydown'].forEach(function(evt) {
      document.addEventListener(evt, unlockMobileAudio, { once: true, passive: true });
    });

    // Voice Picker: Prioritize Natural / Studio / Neural voices across Android, iOS, Windows
    function pickBestVoice(voices) {
      if (!voices || voices.length === 0) return null;

      // 1. First priority: High-Definition Natural / Studio / Neural voices
      var naturalVoice = voices.find(function(v) {
        var n = (v.name || "").toLowerCase();
        return (v.lang && v.lang.indexOf("en") === 0) && 
               (n.includes("natural") || n.includes("neural") || n.includes("studio") || n.includes("enhanced") || n.includes("premium"));
      });
      if (naturalVoice) return naturalVoice;

      // 2. Second priority: High-quality Google / Apple / Microsoft English voices
      var brandVoice = voices.find(function(v) {
        var n = (v.name || "").toLowerCase();
        return (v.lang && v.lang.indexOf("en") === 0) &&
               (n.includes("google") || n.includes("samantha") || n.includes("karen") || n.includes("moira") || n.includes("jenny") || n.includes("aria"));
      });
      if (brandVoice) return brandVoice;

      // 3. Third priority: Any English voice
      var enVoice = voices.find(function(v) {
        return v.lang && v.lang.indexOf("en") === 0;
      });
      return enVoice || voices[0];
    }

    
    function irisOrbEl() {
      return document.getElementById('irisOrb') || document.getElementById('micInputBtn');
    }
    function irisSetOrbMode(mode) {
      // mode: idle | listening | speaking | open
      var orb = irisOrbEl();
      if (!orb) return;
      orb.classList.remove('listening', 'speaking', 'channel-open');
      if (mode === 'listening') orb.classList.add('listening', 'channel-open');
      else if (mode === 'speaking') orb.classList.add('speaking', 'channel-open');
      else if (mode === 'open') orb.classList.add('channel-open');
      var label = orb.getAttribute('aria-label') || 'Voice';
      if (mode === 'listening') orb.setAttribute('title', 'Listening — you are talking to Iris');
      else if (mode === 'speaking') orb.setAttribute('title', 'Iris is talking');
      else if (mode === 'open') orb.setAttribute('title', 'Voice channel open');
      else orb.setAttribute('title', 'Talk to Iris');
      var status = document.getElementById('irisOrbStatus');
      if (status) {
        status.textContent = mode === 'listening' ? 'You → Iris' : mode === 'speaking' ? 'Iris → You' : mode === 'open' ? 'Channel open' : '';
        status.style.display = mode === 'idle' ? 'none' : 'inline-flex';
      }
    }

    function speakText(text) {
      if (SENSOR_STATE && SENSOR_STATE.voice === false) return;
      if (!text) return;
      var cleanText = String(text).replace(/[*_#`~↳•■]/g, '')
                          .replace(/\bSKU-[A-Z0-9-]+\b/gi, '')
                          .replace(/det\(M\)\s*≡?\s*1\.0+/gi, 'determinant of M equals one')
                          .replace(/\bQ\s*≥\s*kB\s*\*\s*T\s*\*\s*ln\s*2\b/gi, 'the Landauer limit')
                          .replace(/Reff\s*≤?\s*4\.18e-13/gi, 'zero residual drag')
                          .replace(/\$([0-9,.]+)\b/g, '$1 dollars')
                          .trim();
      if (!cleanText) return;
      var audioBanner = document.getElementById('irisVoiceStatusBadge');
      function markSpeaking(on) {
        irisSetOrbMode(on ? 'speaking' : (SENSOR_STATE && SENSOR_STATE.mic ? 'listening' : 'idle'));
        if (audioBanner) {
          audioBanner.style.display = on ? 'inline-flex' : 'none';
          if (on) audioBanner.innerText = "Iris speaking…";
        }
      }
      if (window.IrisAV && typeof IrisAV.speak === 'function') {
        try {
          unlockMobileAudio();
          if (window.DSAP && typeof DSAP.unlock === 'function') DSAP.unlock().catch(function () {});
          else if (typeof IrisAV.unlock === 'function') IrisAV.unlock();
          markSpeaking(true);
          IrisAV.speak(cleanText, function () { markSpeaking(false); currentUtterance = null; });
          return;
        } catch (errAv) { console.warn("[Iris Audio] IrisAV fallback:", errAv); }
      }
      if (!('speechSynthesis' in window)) return;
      try {
        unlockMobileAudio();
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.resume) window.speechSynthesis.resume();
        currentUtterance = new SpeechSynthesisUtterance(cleanText);
        currentUtterance.lang = 'en-CA';
        currentUtterance.rate = 0.98;
        currentUtterance.pitch = 0.96;
        currentUtterance.volume = 1.0;
        var voices = window.speechSynthesis.getVoices();
        var best = pickBestVoice(voices);
        if (best) currentUtterance.voice = best;
        currentUtterance.onstart = function () { markSpeaking(true); };
        currentUtterance.onend = function () { markSpeaking(false); currentUtterance = null; };
        currentUtterance.onerror = function () { markSpeaking(false); currentUtterance = null; };
        window.speechSynthesis.speak(currentUtterance);
        setTimeout(function () {
          if (window.speechSynthesis && window.speechSynthesis.paused) window.speechSynthesis.resume();
        }, 50);
      } catch (err) { console.warn("[Iris Audio] Exception:", err); }
    }

    // 3. Direct Hero Voice Greeting (Zero-Hanging Audio)
    function playIrisChime(){ try{ if(window.IrisSensors) IrisSensors.softChime(); }catch(e){} }
    function playIrisIntro() {
      playIrisChime();
      const msg = "Dualiscapax. We stop money leak. Look and measure is one hundred percent free, always.";
      
      const resBox = document.getElementById('irisResponseBox');
      const textDiv = document.getElementById('irisTextReply');
      if (resBox && textDiv) {
        textDiv.innerText = msg;
        resBox.style.display = 'block';
        smoothScrollTo('ask-iris');
      }

      speakText(msg);

      // Trigger hardware permission in background without blocking
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => stream.getTracks().forEach(t => t.stop()))
          .catch(e => console.log("Mic prompt handled:", e.message));
      }
    }

    // 4. Smooth Scrolling Engine
    

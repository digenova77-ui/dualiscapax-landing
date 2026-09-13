    function formatCAD(val) {
      if (val >= 1000000) {
        return "$" + (val / 1000000).toFixed(2) + "M";
      } else if (val >= 1000) {
        return "$" + Math.round(val).toLocaleString();
      }
      return "$" + Math.round(val);
    }

    function updateCalculator(baseVal) {
      const base = parseFloat(baseVal);
      const displayEl = document.getElementById('calcBaseDisplay');
      if (displayEl) displayEl.innerText = `CAD ${formatCAD(base)} / yr`;

      const waste = base * 0.18;
      const y1 = waste * 0.81;
      const y5 = waste * 1.00 * 5.85; // 5-year cumulative retention

      const wEl = document.getElementById('calcWasteDisplay');
      const y1El = document.getElementById('calcY1Display');
      const y5El = document.getElementById('calcY5Display');

      if (wEl) wEl.innerText = formatCAD(waste);
      if (y1El) y1El.innerText = formatCAD(y1);
      if (y5El) y5El.innerText = formatCAD(y5);

      // Sync dropdown with slider value
      const sel = document.getElementById('calcScaleSelect');
      if (sel) {
        const presets = ["50000", "75000", "1200000", "142000000", "215000000"];
        if (presets.includes(baseVal.toString())) {
          sel.value = baseVal.toString();
        } else {
          sel.value = "custom";
        }
      }
    }

    function onCalcScaleSelect(val) {
      if (val === "custom") return;
      playIrisChime();
      const num = parseFloat(val);
      const slider = document.getElementById('calcSlider');
      if (slider) slider.value = num;
      updateCalculator(num);
    }

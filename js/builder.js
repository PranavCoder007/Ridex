// ===== BUILDER.JS — Interactive Bike Builder Logic =====

const PARTS = [
    { id: 'engine', label: 'Engine', icon: '🔧' },
    { id: 'frame', label: 'Frame', icon: '🔩' },
    { id: 'suspension', label: 'Suspension', icon: '🌀' },
    { id: 'brakes', label: 'Brakes', icon: '🛑' },
    { id: 'wheels', label: 'Wheels', icon: '⭕' },
    { id: 'fuel', label: 'Fuel', icon: '⛽' },
    { id: 'exhaust', label: 'Exhaust', icon: '💨' },
    { id: 'seat', label: 'Seat', icon: '🪑' },
    { id: 'lights', label: 'Lights', icon: '💡' },
];

// SVG parts to highlight per section
const PART_HIGHLIGHTS = {
    engine: ['engine-rect'],
    frame: ['frame-path'],
    suspension: ['fork-line', 'rear-susp-line'],
    brakes: ['front-brake-disc', 'rear-brake-disc'],
    wheels: ['front-brake-disc', 'rear-brake-disc'],
    fuel: ['tank-path'],
    exhaust: ['exhaust-path'],
    seat: ['seat-path'],
    lights: ['headlight-ellipse', 'taillight-rect', 'cluster-rect'],
};

let activePart = null;
let config = {};
let completedParts = new Set();

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    renderProgressSteps();
    setupHotspots();
    setupOptionChips();
    setupRangeSliders();
    setupButtons();
});

function renderProgressSteps() {
    const container = document.getElementById('progress-steps');
    if (!container) return;

    container.innerHTML = PARTS.map((part, i) => `
    <div class="progress-step" id="step-${part.id}" data-part="${part.id}">
      <div class="progress-step-dot">${part.icon}</div>
      <div class="progress-step-label">${part.label}</div>
    </div>
  `).join('');

    // Click on step to open that part
    container.querySelectorAll('.progress-step').forEach(step => {
        step.addEventListener('click', () => {
            openPart(step.dataset.part);
        });
    });
}

function setupHotspots() {
    document.querySelectorAll('.hotspot').forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            const part = hotspot.dataset.part;
            openPart(part);
        });
    });
}

function openPart(partId) {
    // Deactivate previous
    if (activePart) {
        document.getElementById(`hotspot-${activePart}`)?.classList.remove('selected');
        // Remove highlights
        (PART_HIGHLIGHTS[activePart] || []).forEach(id => {
            document.getElementById(id)?.classList.remove('highlighted');
        });
    }

    activePart = partId;

    // Activate hotspot
    document.getElementById(`hotspot-${partId}`)?.classList.add('selected');

    // Highlight SVG parts
    (PART_HIGHLIGHTS[partId] || []).forEach(id => {
        document.getElementById(id)?.classList.add('highlighted');
    });

    // Update progress steps
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active');
        if (completedParts.has(step.dataset.part)) step.classList.add('done');
    });
    document.getElementById(`step-${partId}`)?.classList.add('active');

    // Show section
    document.getElementById('default-panel')?.style && (document.getElementById('default-panel').style.display = 'none');
    document.querySelectorAll('.part-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${partId}`)?.classList.add('active');

    // Update panel header
    const part = PARTS.find(p => p.id === partId);
    if (part) {
        document.getElementById('panel-title').textContent = `${part.icon} ${part.label}`;
        document.getElementById('panel-subtitle').textContent = `Configure the ${part.label.toLowerCase()} for your bike`;
    }

    // Restore previously selected chips for this part
    restoreChipSelections(partId);
}

function setupOptionChips() {
    document.querySelectorAll('.option-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const key = chip.dataset.key;
            const val = chip.dataset.val;

            // Deselect siblings with same key
            document.querySelectorAll(`.option-chip[data-key="${key}"]`).forEach(c => c.classList.remove('selected'));

            // Select this chip
            chip.classList.add('selected');

            // Store in config
            config[key] = val;

            // Mark part as done
            if (activePart) completedParts.add(activePart);

            // Update progress step
            const step = document.getElementById(`step-${activePart}`);
            if (step) {
                step.classList.add('done');
            }

            // Update summary
            updateSummary();

            // Enable find button
            updateFindButton();
        });
    });
}

function setupRangeSliders() {
    // Displacement range
    const minSlider = document.getElementById('displacement-min');
    const maxSlider = document.getElementById('displacement-max');
    const dispVal = document.getElementById('displacement-val');

    function updateDisplacement() {
        let min = parseInt(minSlider.value);
        let max = parseInt(maxSlider.value);
        if (min > max) { [min, max] = [max, min]; }
        dispVal.textContent = `${min} – ${max}cc`;
        config.displacementMin = min;
        config.displacementMax = max;
        updateSliderBackground(minSlider, min, 100, 1400);
        updateSliderBackground(maxSlider, max, 100, 1400);
        if (activePart === 'engine') completedParts.add('engine');
        updateSummary();
        updateFindButton();
    }

    if (minSlider) minSlider.addEventListener('input', updateDisplacement);
    if (maxSlider) maxSlider.addEventListener('input', updateDisplacement);

    // Mileage slider
    const mileageSlider = document.getElementById('mileage-slider');
    const mileageVal = document.getElementById('mileage-val');

    if (mileageSlider) {
        mileageSlider.addEventListener('input', () => {
            const val = parseInt(mileageSlider.value);
            mileageVal.textContent = `${val}+ kmpl`;
            config.mileageMin = val;
            updateSliderBackground(mileageSlider, val, 10, 80);
            if (activePart === 'engine') completedParts.add('engine');
            updateSummary();
            updateFindButton();
        });
    }
}

function updateSliderBackground(slider, val, min, max) {
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--pct', pct + '%');
}

function restoreChipSelections(partId) {
    // Re-apply selected state to chips based on current config
    document.querySelectorAll(`#section-${partId} .option-chip`).forEach(chip => {
        const key = chip.dataset.key;
        const val = chip.dataset.val;
        if (config[key] === val) {
            chip.classList.add('selected');
        }
    });
}

function updateSummary() {
    const container = document.getElementById('summary-items');
    if (!container) return;

    const labels = {
        engineType: 'Engine Type',
        cooling: 'Cooling',
        displacementMin: null, // handled specially
        displacementMax: null,
        mileageMin: 'Min Mileage',
        frameType: 'Frame',
        frontSuspension: 'Front Susp.',
        rearSuspension: 'Rear Susp.',
        frontBrake: 'Front Brake',
        rearBrake: 'Rear Brake',
        abs: 'ABS',
        wheelType: 'Wheel Type',
        wheelSize: 'Wheel Size',
        fuelSystem: 'Fuel System',
        exhaustType: 'Exhaust',
        exhaustSpec: 'Exhaust Spec',
        seat: 'Seat',
        seatHeight: 'Seat Height',
        lights: 'Lights',
    };

    const entries = [];

    // Displacement special case
    if (config.displacementMin && config.displacementMax) {
        entries.push({ key: 'Displacement', val: `${config.displacementMin}–${config.displacementMax}cc` });
    }

    Object.entries(config).forEach(([k, v]) => {
        if (k === 'displacementMin' || k === 'displacementMax') return;
        if (!labels[k]) return;
        let display = v;
        if (k === 'abs') display = v === 'true' || v === true ? 'Yes' : 'No';
        if (k === 'mileageMin') display = v + '+ kmpl';
        if (k === 'wheelSize') display = v + '"';
        entries.push({ key: labels[k], val: display });
    });

    if (entries.length === 0) {
        container.innerHTML = '<div class="summary-empty">No parts selected yet</div>';
    } else {
        container.innerHTML = entries.map(e => `
      <div class="summary-item">
        <span class="summary-item-key">${e.key}</span>
        <span class="summary-item-val">${e.val}</span>
      </div>
    `).join('');
    }
}

function updateFindButton() {
    const btn = document.getElementById('find-bike-btn');
    if (!btn) return;
    const hasConfig = Object.keys(config).length > 0;
    btn.disabled = !hasConfig;
}

function setupButtons() {
    // Find My Bike
    const findBtn = document.getElementById('find-bike-btn');
    if (findBtn) {
        findBtn.addEventListener('click', () => {
            // Save config to localStorage
            localStorage.setItem('rideex_config', JSON.stringify(config));
            // Navigate to results
            window.location.href = 'results.html';
        });
    }

    // Reset
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            config = {};
            completedParts.clear();
            activePart = null;

            // Reset all chips
            document.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));

            // Reset hotspots
            document.querySelectorAll('.hotspot').forEach(h => h.classList.remove('selected'));

            // Reset SVG highlights
            document.querySelectorAll('.bike-part-highlight').forEach(el => el.classList.remove('highlighted'));

            // Reset progress steps
            document.querySelectorAll('.progress-step').forEach(s => {
                s.classList.remove('active', 'done');
            });

            // Reset sliders
            const minSlider = document.getElementById('displacement-min');
            const maxSlider = document.getElementById('displacement-max');
            const mileageSlider = document.getElementById('mileage-slider');
            if (minSlider) { minSlider.value = 100; updateSliderBackground(minSlider, 100, 100, 1400); }
            if (maxSlider) { maxSlider.value = 500; updateSliderBackground(maxSlider, 500, 100, 1400); }
            if (mileageSlider) { mileageSlider.value = 30; updateSliderBackground(mileageSlider, 30, 10, 80); }

            const dispVal = document.getElementById('displacement-val');
            const mileageVal = document.getElementById('mileage-val');
            if (dispVal) dispVal.textContent = '100 – 500cc';
            if (mileageVal) mileageVal.textContent = '30+ kmpl';

            // Reset panel
            document.querySelectorAll('.part-section').forEach(s => s.classList.remove('active'));
            const defaultPanel = document.getElementById('default-panel');
            if (defaultPanel) defaultPanel.style.display = '';
            document.getElementById('panel-title').textContent = 'Select a Part';
            document.getElementById('panel-subtitle').textContent = 'Click any hotspot on the bike to start customizing';

            updateSummary();
            updateFindButton();
        });
    }
}

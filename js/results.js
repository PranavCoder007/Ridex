// ===== RESULTS.JS — Bike Listing & Search Logic =====

let allBikes = [];
let filteredBikes = [];
let builderConfig = null;
let pageType = 'motorcycle';

// Store enriched bikes in a map for fast lookup (preserves matchScore)
const bikeMap = {};

async function initResultsPage(type) {
    pageType = type;

    let apiData = null;
    try {
        // Try fetching all bikes from Express backend connected to MongoDB Atlas
        const res = await fetch('/api/bikes?limit=1000');
        const json = await res.json();
        if (json && json.success) {
            apiData = json.data;
            console.log('⚡ Loaded data from MongoDB Atlas API server!');
        }
    } catch (e) {
        console.log('📡 Running in Serverless mode using local data.js database.');
    }

    if (apiData && apiData.length > 0) {
        if (type === 'results') {
            const saved = localStorage.getItem('rideex_config');
            if (saved) {
                builderConfig = JSON.parse(saved);
                showConfigSummary(builderConfig);
            }
            allBikes = apiData.filter(b => b.type === 'motorcycle').map(bike => {
                const enriched = { ...bike, matchScore: builderConfig ? matchBike(bike, builderConfig) : 50 };
                bikeMap[bike.id] = enriched;
                return enriched;
            });
            allBikes.sort((a, b) => b.matchScore - a.matchScore);
        } else {
            allBikes = apiData.filter(b => b.type === type).map(bike => {
                bikeMap[bike.id] = bike;
                return bike;
            });
        }
    } else {
        if (type === 'results') {
            const saved = localStorage.getItem('rideex_config');
            if (saved) {
                builderConfig = JSON.parse(saved);
                showConfigSummary(builderConfig);
            }
            allBikes = getBikesByType('motorcycle').map(bike => {
                const enriched = { ...bike, matchScore: builderConfig ? matchBike(bike, builderConfig) : 50 };
                bikeMap[bike.id] = enriched;
                return enriched;
            });
            allBikes.sort((a, b) => b.matchScore - a.matchScore);
        } else {
            allBikes = getBikesByType(type).map(bike => {
                bikeMap[bike.id] = bike;
                return bike;
            });
        }
    }

    filteredBikes = [...allBikes];
    renderBikes(filteredBikes);
    updateResultsCount(filteredBikes.length);

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFiltersAndSort, 300));
    }

    // Sort — just re-sort and re-render, don't re-filter
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', applySort);
    }

    // Price filter
    const priceFilter = document.getElementById('price-filter');
    if (priceFilter) {
        priceFilter.addEventListener('change', applyFiltersAndSort);
    }

    // Category pills
    const pills = document.querySelectorAll('.category-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            applyFiltersAndSort();
        });
    });
}

function applyFiltersAndSort() {
    const query = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
    const priceFilter = document.getElementById('price-filter')?.value || '';
    const activePill = document.querySelector('.category-pill.active');
    const category = activePill ? activePill.dataset.cat : '';

    filteredBikes = allBikes.filter(bike => {
        const matchText = !query ||
            bike.brand.toLowerCase().includes(query) ||
            bike.model.toLowerCase().includes(query) ||
            bike.tags.some(t => t.includes(query)) ||
            bike.category.includes(query) ||
            bike.style.includes(query);

        let matchPrice = true;
        if (priceFilter) {
            const [min, max] = priceFilter.split('-').map(Number);
            matchPrice = bike.price >= min && bike.price <= max;
        }

        const matchCategory = !category || bike.category === category;
        return matchText && matchPrice && matchCategory;
    });

    applySort();
}

function applySort() {
    const sortVal = document.getElementById('sort-select')?.value || 'default';
    const sorted = [...filteredBikes];

    switch (sortVal) {
        case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
        case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
        case 'rating': sorted.sort((a, b) => b.overallRating - a.overallRating); break;
        case 'mileage': sorted.sort((a, b) => b.mileage - a.mileage); break;
        case 'power': sorted.sort((a, b) => b.power - a.power); break;
        case 'match': sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)); break;
        default: break;
    }

    renderBikes(sorted);
    updateResultsCount(sorted.length);
}

function renderBikes(bikes) {
    const grid = document.getElementById('bikes-grid');
    if (!grid) return;

    if (bikes.length === 0) {
        grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-state-icon">🏍</div>
        <h3>No bikes found</h3>
        <p style="color:var(--text-muted); font-size:0.9rem;">Try adjusting your search or filters.</p>
      </div>`;
        return;
    }

    grid.innerHTML = bikes.map(bike => createBikeCard(bike)).join('');

    // Click listeners — use bikeMap to preserve matchScore
    grid.querySelectorAll('.bike-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = parseInt(card.dataset.id);
            const bike = bikeMap[id] || getBikeById(id);
            if (bike) openPopup(bike, bike.matchScore);
        });
    });
}

function createBikeCard(bike) {
    const stars = renderStars(bike.overallRating);
    const matchBadge = bike.matchScore
        ? `<div class="match-badge">⚡ ${bike.matchScore}% match</div>`
        : '';

    // Safe image with inline onerror using data attributes
    const fallbackText = bike.brand + ' ' + bike.model;
    const fallbackUrl = 'https://placehold.co/800x450/1a1a2e/ff4d00?text=' + encodeURIComponent(fallbackText) + '&font=montserrat';

    return `
    <div class="bike-card" data-id="${bike.id}">
      <div class="bike-card-image-wrapper">
        <img class="bike-card-image"
          src="${bike.image}"
          alt="${bike.brand} ${bike.model}"
          loading="lazy"
          data-fallback="${fallbackUrl}"
          onerror="this.src=this.dataset.fallback; this.onerror=null;" />
        <div class="bike-card-badge">${capitalize(bike.category)}</div>
      </div>
      <div class="bike-card-body">
        <div class="bike-card-brand">${bike.brand}</div>
        <div class="bike-card-name">${bike.model}</div>
        <div class="bike-card-price">${bike.priceDisplay}</div>
        <div class="bike-card-specs">
          <div class="spec-item">
            <span class="spec-label">Engine</span>
            <span class="spec-value">${bike.engine.displacement}cc</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Power</span>
            <span class="spec-value">${bike.power} PS</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Mileage</span>
            <span class="spec-value">${bike.mileage} kmpl</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Weight</span>
            <span class="spec-value">${bike.weight} kg</span>
          </div>
        </div>
        <div class="bike-card-rating">
          <span class="stars">${stars}</span>
          <span class="rating-num">${bike.overallRating}</span>
          ${matchBadge}
        </div>
      </div>
    </div>`;
}

function showConfigSummary(config) {
    const card = document.getElementById('config-summary-card');
    const chips = document.getElementById('config-chips');
    if (!card || !chips) return;

    const labels = {
        engineType: 'Engine', cooling: 'Cooling',
        frontSuspension: 'Front Susp.', rearSuspension: 'Rear Susp.',
        frontBrake: 'Front Brake', abs: 'ABS',
        wheelType: 'Wheels', fuelSystem: 'Fuel',
        lights: 'Lights', seat: 'Seat',
        frameType: 'Frame', exhaustType: 'Exhaust',
    };

    const chipHtml = Object.entries(config)
        .filter(([k, v]) => v !== undefined && v !== null && v !== '' && labels[k])
        .map(([k, v]) => {
            let display = v;
            if (k === 'abs') display = (v === 'true' || v === true) ? 'ABS' : 'No ABS';
            return `<div class="config-chip">${labels[k]}: ${display}</div>`;
        }).join('');

    if (chipHtml) {
        chips.innerHTML = chipHtml;
        card.style.display = 'flex';
    }
}

function updateResultsCount(count) {
    const el = document.getElementById('results-count');
    if (el) {
        el.innerHTML = `Showing <span>${count}</span> bike${count !== 1 ? 's' : ''}`;
    }
}

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function capitalize(str) {
    if (!str) return '';
    return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

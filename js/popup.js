// ===== POPUP.JS — Bike Detail Popup Logic =====

let currentBike = null;

function openPopup(bike, matchScore) {
  currentBike = bike;
  const overlay = document.getElementById('popup-overlay');

  // Image
  document.getElementById('popup-img').src = bike.image;
  document.getElementById('popup-img').alt = `${bike.brand} ${bike.model}`;

  // Header
  document.getElementById('popup-brand').textContent = bike.brand;
  document.getElementById('popup-name').textContent = bike.model;
  document.getElementById('popup-price').textContent = bike.priceDisplay;

  // Rating
  const rating = bike.overallRating;
  document.getElementById('popup-stars').textContent = getStars(rating);
  document.getElementById('popup-rating-num').textContent = rating + '/5';

  // Variants
  renderVariants(bike);

  // Colors
  renderColors(bike);

  // Specs
  renderSpecs(bike);

  // Feature Ratings
  renderFeatureRatings(bike);

  // Reviews
  renderReviews(bike);

  // Pros/Cons
  renderProsCons(bike);

  // Reset tabs
  document.querySelectorAll('.popup-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.popup-tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-specs').classList.add('active');
  document.getElementById('tab-content-specs').classList.add('active');

  // Show overlay
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Animate rating bars after a short delay
  setTimeout(() => {
    document.querySelectorAll('.rating-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 100);
}

function closePopup() {
  document.getElementById('popup-overlay').classList.remove('active');
  document.body.style.overflow = '';
  currentBike = null;
}

function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function formatPrice(price) {
  if (price >= 100000) {
    return '₹' + (price / 100000).toFixed(2) + 'L';
  }
  return '₹' + price.toLocaleString('en-IN');
}

function renderVariants(bike) {
  const container = document.getElementById('popup-variants');
  container.innerHTML = '';
  bike.variants.forEach((v, i) => {
    const btn = document.createElement('button');
    btn.className = 'variant-btn' + (i === 0 ? ' active' : '');
    btn.textContent = `${v.name} — ${formatPrice(v.price)}`;
    btn.dataset.price = v.price;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('popup-price').textContent = formatPrice(v.price);
    });
    container.appendChild(btn);
  });
}

function renderColors(bike) {
  const container = document.getElementById('popup-colors');
  const nameEl = document.getElementById('popup-color-name');
  container.innerHTML = '';
  nameEl.textContent = bike.colors[0];

  bike.colors.forEach((color, i) => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (i === 0 ? ' active' : '');
    swatch.style.backgroundColor = bike.colorHex[i] || '#333';
    swatch.title = color;
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      nameEl.textContent = color;
    });
    container.appendChild(swatch);
  });
}

function renderSpecs(bike) {
  const grid = document.getElementById('popup-specs-grid');
  const specs = [
    { label: 'Engine', value: `${bike.engine.displacement}cc ${bike.engine.type}` },
    { label: 'Power', value: `${bike.power} PS` },
    { label: 'Torque', value: `${bike.torque} Nm` },
    { label: 'Mileage', value: `${bike.mileage} kmpl` },
    { label: 'Cooling', value: capitalize(bike.engine.cooling) },
    { label: 'Fuel System', value: capitalize(bike.engine.fuelSystem) },
    { label: 'Front Suspension', value: bike.suspension.front },
    { label: 'Rear Suspension', value: bike.suspension.rear },
    { label: 'Front Brake', value: capitalize(bike.brakes.front) },
    { label: 'Rear Brake', value: capitalize(bike.brakes.rear) },
    { label: 'ABS', value: bike.brakes.abs ? 'Yes' : 'No' },
    { label: 'Wheels', value: `${bike.wheels.size}" ${capitalize(bike.wheels.type)}` },
    { label: 'Seat Height', value: `${bike.seatHeight}mm` },
    { label: 'Weight', value: `${bike.weight}kg` },
    { label: 'Lights', value: bike.lights },
    { label: 'Category', value: capitalize(bike.category) },
  ];

  grid.innerHTML = specs.map(s => `
    <div class="spec-box">
      <div class="spec-box-label">${s.label}</div>
      <div class="spec-box-value">${s.value}</div>
    </div>
  `).join('');
}

function renderFeatureRatings(bike) {
  const container = document.getElementById('popup-ratings');
  const ratings = bike.featureRatings;
  const labels = {
    mileage: '⛽ Mileage',
    comfort: '🛋 Comfort',
    performance: '⚡ Performance',
    handling: '🎯 Handling',
    value: '💰 Value',
    braking: '🛑 Braking',
    styling: '✨ Styling'
  };

  container.innerHTML = Object.entries(ratings).map(([key, val]) => `
    <div class="rating-row">
      <div class="rating-label">${labels[key] || key}</div>
      <div class="rating-bar-bg">
        <div class="rating-bar-fill" style="width:0%" data-width="${val}%"></div>
      </div>
      <div class="rating-pct">${val}%</div>
    </div>
  `).join('');
}

function renderReviews(bike) {
  const container = document.getElementById('popup-reviews');
  container.innerHTML = bike.reviews.map(r => `
    <div class="review-item">
      <div class="review-header">
        <div class="review-user">${r.user}</div>
        <div class="review-rating">${getStars(r.rating)} ${r.rating}</div>
      </div>
      <div class="review-comment">"${r.comment}"</div>
    </div>
  `).join('');
}

function renderProsCons(bike) {
  const prosEl = document.getElementById('popup-pros');
  const consEl = document.getElementById('popup-cons');

  prosEl.innerHTML = `<h4>✓ Pros</h4>` + bike.pros.map(p => `<li>${p}</li>`).join('');
  consEl.innerHTML = `<h4>✗ Cons</h4>` + bike.cons.map(c => `<li>${c}</li>`).join('');
}

function capitalize(str) {
  if (!str) return '';
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', () => {
  // Close button
  const closeBtn = document.getElementById('popup-close');
  if (closeBtn) closeBtn.addEventListener('click', closePopup);

  // Backdrop click
  const overlay = document.getElementById('popup-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup();
    });
  }

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup();
  });

  // Tabs
  document.querySelectorAll('.popup-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      document.querySelectorAll('.popup-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.popup-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-content-${tabId}`).classList.add('active');

      // Re-animate bars when switching to ratings tab
      if (tabId === 'ratings') {
        setTimeout(() => {
          document.querySelectorAll('.rating-bar-fill').forEach(bar => {
            bar.style.width = bar.dataset.width;
          });
        }, 50);
      }
    });
  });
});

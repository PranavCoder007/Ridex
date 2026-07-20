/**
 * SEED SCRIPT — Parses all CSV files, matches images from Sports/Commuter/Cruiser/OffRoad/Scooter
 * folders, applies column shift correction, and inserts everything into MongoDB.
 * 
 * Run: node db/seed.js
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const connectDB = require('./connection');
const Bike = require('./models/Bike');

// ===== IMAGE DISCOVERY =====
function discoverImages() {
  const imageFolders = ['Sports', 'Commuter', 'Cruiser', 'OffRoad', 'Scooter'];
  const imageMap = {};
  
  for (const folder of imageFolders) {
    const folderPath = path.join(__dirname, '..', folder);
    if (!fs.existsSync(folderPath)) {
      console.log(`⚠️ Folder not found: ${folderPath}`);
      continue;
    }
    
    const files = fs.readdirSync(folderPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    for (const file of files) {
      const normalized = file.replace(/\.(jpg|jpeg|png|webp)$/i, '').replace(/-/g, ' ').toLowerCase();
      imageMap[normalized] = `${folder}/${file}`;
    }
  }
  
  console.log(`📸 Discovered ${Object.keys(imageMap).length} images across folders`);
  return imageMap;
}

// ===== FUZZY IMAGE MATCHING =====
function findImageForBike(bikeName, brand, imageMap) {
  if (!bikeName) return null;
  
  const normalized = bikeName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const brandLower = (brand || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const parts = normalized.split(' ');
  
  for (let len = parts.length; len >= 2; len--) {
    const attempt = parts.slice(0, len).join(' ');
    if (imageMap[attempt]) return imageMap[attempt];
  }
  
  const cleanName = normalized
    .replace(/\b(std|abs|bs6|bs62|2023|2022|2021|2020|2019|edition|pro|dlx|deluxe|drum|disc|standard|single|dual|channel|alloy|wheel|kick|start|special|chrome|limited|dark|horse|black|red|blue|white|grey|gray|silver|maroon|green|metallic|matte|pearl|glossy|carbon|fiber|split|seat|connected|race|stealth|canvas|xtec|new|plus|base|lx|vx|zx|smart|ride|connect|obd2)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  for (let len = cleanName.split(' ').length; len >= 2; len--) {
    const attempt = cleanName.split(' ').slice(0, len).join(' ');
    if (imageMap[attempt]) return imageMap[attempt];
  }
  
  const imageKeys = Object.keys(imageMap);
  let bestMatch = null;
  let bestScore = 0;
  
  for (const key of imageKeys) {
    const keyParts = key.split(' ');
    const nameParts = normalized.split(' ');
    
    let matchCount = 0;
    for (const kp of keyParts) {
      if (nameParts.includes(kp)) matchCount++;
    }
    
    if (matchCount >= 2 && matchCount > bestScore) {
      const keyBrand = keyParts[0];
      const nameBrand = nameParts[0];
      if (keyBrand === nameBrand || brandLower.includes(keyBrand)) {
        bestScore = matchCount;
        bestMatch = imageMap[key];
      }
    }
  }
  
  return bestMatch;
}

// ===== CSV PARSER =====
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// ===== HELPER FUNCTIONS =====
function extractBrand(variantName) {
  const brandPatterns = [
    'Royal Enfield', 'Harley Davidson', 'Harley-Davidson', 'Indian',
    'Triumph', 'Ducati', 'BMW', 'Kawasaki', 'Honda', 'Yamaha',
    'Suzuki', 'KTM', 'TVS', 'Bajaj', 'Hero', 'Jawa', 'Benelli',
    'Aprilia', 'MV Agusta', 'Moto Guzzi', 'CFMoto', 'Norton',
    'FB Mondial', 'Husqvarna', 'Mahindra', 'Hyosung'
  ];
  
  const nameLower = (variantName || '').toLowerCase();
  for (const brand of brandPatterns) {
    if (nameLower.startsWith(brand.toLowerCase())) {
      return brand;
    }
  }
  return (variantName || '').split(' ')[0] || 'Unknown';
}

function extractModel(variantName, brand) {
  if (!variantName || !brand) return variantName || '';
  let model = variantName;
  if (model.toLowerCase().startsWith(brand.toLowerCase())) {
    model = model.substring(brand.length).trim();
  }
  model = model.replace(/\b(STD|ABS|BS6|2023|2022|2021|2020|2019|Edition|Pro|DLX|Deluxe|Drum|Disc|Standard|Single|Dual|Channel|Alloy|Wheel)\b/gi, '').trim();
  return model || variantName;
}

function parseNumeric(value) {
  if (!value || value === '') return null;
  const match = String(value).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

function extractDisplacementFromName(name) {
  const ccMatch = name.match(/(\d+)\s*(cc|CC)/);
  if (ccMatch) return parseInt(ccMatch[1]);
  
  const numMatch = name.match(/\b(\d{3,4})\b/);
  if (numMatch) return parseInt(numMatch[1]);
  
  const smallNumMatch = name.match(/\b(50|80|90|100|110|125|150|160|180|200)\b/);
  if (smallNumMatch) return parseInt(smallNumMatch[1]);
  
  return 150; 
}

function determineCategory(bodyType, variantName) {
  const name = (variantName || '').toLowerCase();
  if (name.includes('scooter') || name.includes('activa') || name.includes('ntorq') || name.includes('jupiter') || name.includes('access') || name.includes('dio') || name.includes('fascino')) return 'scooter';
  
  const bt = (bodyType || '').toLowerCase();
  if (bt.includes('scooter')) return 'scooter';
  if (bt.includes('cruiser') || name.includes('cruiser') || name.includes('avenger')) return 'cruiser';
  if (bt.includes('sport') || name.includes('ninja') || name.includes('r15') || name.includes('duke') || name.includes('rc ')) return 'sport';
  if (bt.includes('commuter') || name.includes('splendor') || name.includes('platina') || name.includes('ct ')) return 'commuter';
  if (bt.includes('roadster') || name.includes('hunter') || name.includes('ronin')) return 'roadster';
  if (bt.includes('superbike') || name.includes('hayabusa') || name.includes('zx-10r') || name.includes('s1000rr')) return 'superbike';
  if (bt.includes('classic') || name.includes('bullet') || name.includes('classic 350') || name.includes('h\'ness')) return 'classic';
  
  if (name.includes('scoot')) return 'scooter';
  return 'commuter';
}

function determineStyle(category) {
  if (category === 'scooter') return 'scooter';
  if (category === 'sport' || category === 'superbike') return 'faired';
  if (category === 'cruiser') return 'cruiser';
  return 'naked';
}

function generateRatings(mileage, power, torque, displacement) {
  const mil = mileage || 45;
  const pwr = power || 15;
  const trq = torque || 15;
  const cc = displacement || 150;
  
  const mileageRating = Math.min(98, Math.max(50, Math.round(mil * 1.3)));
  const performanceRating = Math.min(98, Math.max(50, Math.round(pwr * 2.5 + cc * 0.05)));
  const handlingRating = Math.min(98, Math.max(50, Math.round(80 + (pwr > 30 ? 10 : 0) - (cc > 500 ? 5 : 0))));
  const comfortRating = Math.min(98, Math.max(50, Math.round(75 + (cc > 250 ? 10 : 0) - (pwr > 100 ? 10 : 0))));
  const brakingRating = Math.min(98, Math.max(50, Math.round(70 + (pwr > 20 ? 15 : 5))));
  const valueRating = Math.min(98, Math.max(50, Math.round(95 - (cc > 300 ? (cc/50) : 0))));
  const stylingRating = Math.min(98, Math.max(50, Math.round(75 + (pwr > 30 ? 15 : 5))));
  
  return {
    mileage: mileageRating,
    comfort: comfortRating,
    performance: performanceRating,
    handling: handlingRating,
    value: valueRating,
    braking: brakingRating,
    styling: stylingRating
  };
}

// ===== MAIN SEED FUNCTION =====
async function seed() {
  console.log('🚀 Starting RideEx Database Seed with Shift Correction...\n');
  
  await connectDB();
  await Bike.deleteMany({});
  console.log('🗑️  Cleared existing bike data\n');
  
  const imageMap = discoverImages();
  const csvDir = path.join(__dirname, '..');
  
  const bikeFeatures = await parseCSV(path.join(csvDir, 'Bike_Features.csv'));
  const bikeDataset = await parseCSV(path.join(csvDir, 'bike_dataset.csv'));
  const bikesCleaned = await parseCSV(path.join(csvDir, 'bikesCleaned.ind-selected-columns.csv'));
  
  const bikeMap = new Map();
  
  // 1. Process Bike_Features.csv
  for (const row of bikeFeatures) {
    const variantName = (row.variant_name || '').trim();
    if (!variantName) continue;
    
    const dispRaw = row['Displacement'] || '';
    const isShifted = dispRaw.includes('Nm') || dispRaw.includes('rpm') || dispRaw.includes('ps') || dispRaw.includes('PS');
    
    const brand = extractBrand(variantName);
    const model = extractModel(variantName, brand);
    const category = determineCategory(isShifted ? '' : row['Body Type'], variantName);
    const style = determineStyle(category);
    
    const key = variantName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const imagePath = findImageForBike(variantName, brand, imageMap);
    
    const price = parseNumeric(row['On-road prize']) || 0;
    const priceDisplay = price > 0 ? `₹${(price / 100000).toFixed(2)}L` : '₹0.00L';
    
    let displacement, power, torque, cooling, starting, clutch, gearbox, seatHeight, suspensionFront, absRaw;
    
    if (isShifted) {
      displacement = extractDisplacementFromName(variantName);
      torque = parseNumeric(row['Displacement']) || 15;
      cooling = (row['No. of Cylinders'] || '').toLowerCase();
      starting = row['Valve Per Cylinder'] || '';
      clutch = row['Starting'] || '';
      gearbox = row['Clutch'] || '';
      seatHeight = parseNumeric(row['Body Type']) || 795;
      power = parseNumeric(row['0-100 Kmph (sec)']) || Math.round(displacement * 0.08 * 10) / 10 || 15;
      suspensionFront = row['Peak Power'] || '';
      absRaw = row['Transmission'] || '';
    } else {
      displacement = parseNumeric(row['Displacement']) || extractDisplacementFromName(variantName);
      torque = parseNumeric(row['Max Torque']) || 15;
      cooling = (row['Cooling System'] || '').toLowerCase();
      starting = row['Starting'] || '';
      clutch = row['Clutch'] || '';
      gearbox = row['Gear Box'] || '';
      seatHeight = parseNumeric(row['Seat Height']) || 795;
      power = parseNumeric(row['Peak Power']) || Math.round(displacement * 0.08 * 10) / 10 || 15;
      suspensionFront = row['Front Suspension'] || '';
      absRaw = row['Transmission'] || '';
    }
    
    const cityM = parseNumeric(row['City Mileage']) || 0;
    const hwyM = parseNumeric(row['Highway Mileage']) || 0;
    const mileage = Math.round(cityM && hwyM ? (cityM + hwyM) / 2 : cityM || hwyM || (displacement > 500 ? 15 : displacement > 250 ? 30 : 45));
    
    const abs = absRaw.toLowerCase().includes('abs') || 
                absRaw.toLowerCase().includes('dual channel') ||
                absRaw.toLowerCase().includes('single channel') ||
                clutch.toLowerCase().includes('abs') ||
                price > 130000;
                
    const frontSusp = (suspensionFront && suspensionFront !== 'Yes' && suspensionFront.length > 5) ? suspensionFront : (displacement > 250 ? 'USD Telescopic Fork' : 'Telescopic Fork');
    const rearSusp = (row['Rear Suspension'] && row['Rear Suspension'] !== 'Yes' && row['Rear Suspension'].length > 5) ? row['Rear Suspension'] : (displacement > 250 ? 'Monoshock' : 'Twin Shock Absorbers');
    
    const isScooter = category === 'scooter';
    
    const doc = {
      id: 0,
      type: isScooter ? 'scooter' : 'motorcycle',
      brand,
      model,
      image: imagePath || `https://placehold.co/800x450/1a1a2e/ff4d00?text=${encodeURIComponent(brand + ' ' + model)}&font=montserrat`,
      price,
      priceDisplay,
      engine: {
        type: (row['Engine Type'] && row['Engine Type'] !== 'Yes' && row['Engine Type'].length > 3) ? row['Engine Type'].toLowerCase() : (displacement > 500 ? 'parallel-twin' : 'single'),
        displacement,
        cooling: cooling.includes('liquid') ? 'liquid' : cooling.includes('oil') ? 'oil' : 'air',
        fuelSystem: (row['Fuel Supply'] || '').toLowerCase().includes('injected') ? 'fuel-injected' : 'carburetor'
      },
      power,
      torque,
      mileage,
      frame: (row['Frame'] && row['Frame'] !== 'Yes' && row['Frame'].length > 3) ? row['Frame'].toLowerCase() : (displacement > 300 ? 'trellis' : 'steel-cradle'),
      suspension: {
        front: frontSusp,
        rear: rearSusp
      },
      brakes: {
        front: (row['Front Brake'] || '').toLowerCase().includes('disc') || displacement > 125 ? 'disc' : 'drum',
        rear: (row['Rear Brake'] || '').toLowerCase().includes('disc') || displacement > 200 ? 'disc' : 'drum',
        abs
      },
      wheels: {
        size: isScooter ? 12 : 17,
        type: (row['Wheels Type'] || '').toLowerCase().includes('spoke') ? 'spoked' : 'alloy'
      },
      seat: (row['Seat Type'] || '').toLowerCase().includes('single') ? 'single' : 'dual',
      seatHeight,
      weight: parseNumeric(row['Weight']) || (isScooter ? 108 : displacement > 500 ? 210 : displacement > 250 ? 170 : 145),
      lights: (row['Lights'] || '').toLowerCase().includes('halogen') ? 'halogen' : 'LED',
      category,
      style,
      colors: row['Colors'] ? String(row['Colors']).split(',').map(c => c.trim()) : ['Standard Black', 'Racing Red', 'Ocean Blue'],
      colorHex: ['#1a1a1a', '#cc1100', '#0044cc'],
      variants: [
        { name: 'STD', price: price },
        { name: 'DLX', price: Math.round(price * 1.06) }
      ],
      featureRatings: generateRatings(mileage, power, torque, displacement),
      overallRating: 4.0,
      pros: [
        'Excellent value for money',
        'Great build quality and reliability',
        'Comfortable rider and pillion ergonomics'
      ],
      cons: [
        'Average suspension stiffness',
        'Vibrations at high speeds'
      ],
      reviews: [
        { user: 'Amit S.', rating: 4.5, comment: 'Great performance and very comfortable for daily commutes.' },
        { user: 'Vikram K.', rating: 4.0, comment: 'Good value for money, but parts can be slightly expensive.' }
      ],
      tags: [category, style, displacement > 250 ? 'performance' : 'commuter']
    };
    
    bikeMap.set(key, doc);
  }
  
  // 2. Enrich with bike_dataset.csv
  for (const row of bikeDataset) {
    const modelName = (row.model_name || '').trim();
    if (!modelName) continue;
    
    const key = modelName.toLowerCase().replace(/[^a-z0-9]/g, '');
    let existing = bikeMap.get(key);
    
    if (!existing) {
      for (const [k, v] of bikeMap) {
        if (k.includes(key) || key.includes(k)) {
          existing = v;
          break;
        }
      }
    }
    
    const brand = extractBrand(modelName);
    const imagePath = findImageForBike(modelName, brand, imageMap);
    
    if (existing) {
      if (row.weight_in_kg && !existing.weight) existing.weight = parseNumeric(row.weight_in_kg);
      if (row.price && !existing.price) {
        existing.price = parseNumeric(row.price);
        existing.priceDisplay = `₹${(existing.price / 100000).toFixed(2)}L`;
        existing.variants[0].price = existing.price;
        existing.variants[1].price = Math.round(existing.price * 1.06);
      }
      if (imagePath && existing.image.includes('placehold.co')) {
        existing.image = imagePath;
      }
    } else {
      const category = determineCategory(row.type_of_bike, modelName);
      const style = determineStyle(category);
      const isScooter = category === 'scooter';
      const displacement = parseNumeric(row.CC) || 150;
      const price = parseNumeric(row.price) || 85000;
      const mileage = parseNumeric(row.mileage) || (displacement > 500 ? 15 : displacement > 250 ? 30 : 45);
      
      const doc = {
        id: 0,
        type: isScooter ? 'scooter' : 'motorcycle',
        brand,
        model: extractModel(modelName, brand),
        image: imagePath || `https://placehold.co/800x450/1a1a2e/ff4d00?text=${encodeURIComponent(brand + ' ' + extractModel(modelName, brand))}&font=montserrat`,
        price,
        priceDisplay: `₹${(price / 100000).toFixed(2)}L`,
        engine: {
          type: displacement > 500 ? 'parallel-twin' : 'single',
          displacement,
          cooling: displacement > 250 ? 'liquid' : 'air',
          fuelSystem: 'fuel-injected'
        },
        power: Math.round(displacement * 0.08 * 10) / 10 || 12,
        torque: Math.round(displacement * 0.08 * 9) / 10 || 11,
        mileage,
        frame: displacement > 300 ? 'trellis' : 'steel-cradle',
        suspension: {
          front: displacement > 250 ? 'USD Fork' : 'Telescopic Fork',
          rear: displacement > 250 ? 'Monoshock' : 'Twin Shock Absorbers'
        },
        brakes: {
          front: 'disc',
          rear: displacement > 150 ? 'disc' : 'drum',
          abs: displacement > 150
        },
        wheels: {
          size: isScooter ? 12 : 17,
          type: 'alloy'
        },
        seat: 'dual',
        seatHeight: isScooter ? 765 : 795,
        weight: parseNumeric(row.weight_in_kg) || (isScooter ? 108 : 145),
        lights: 'LED',
        category,
        style,
        colors: ['Standard Black', 'Sports Red', 'Dynamic Blue'],
        colorHex: ['#1a1a1a', '#cc1100', '#0044cc'],
        variants: [
          { name: 'Standard', price },
          { name: 'Premium', price: Math.round(price * 1.08) }
        ],
        featureRatings: generateRatings(mileage, 12, 11, displacement),
        overallRating: 4.0,
        pros: ['Very fuel efficient', 'Easy handling in city traffic', 'Low maintenance cost'],
        cons: ['Limited top speed', 'Basic console features'],
        reviews: [
          { user: 'Sanjay P.', rating: 4.0, comment: 'Reliable commuter bike, fuel efficiency is amazing.' }
        ],
        tags: [category, style, 'commuter']
      };
      
      bikeMap.set(key, doc);
    }
  }
  
  // 3. Enrich with bikesCleaned.ind-selected-columns.csv
  for (const row of bikesCleaned) {
    const name = (row.name || '').trim();
    if (!name) continue;
    
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let existing = bikeMap.get(key);
    
    if (!existing) {
      for (const [k, v] of bikeMap) {
        if (k.includes(key) || key.includes(k)) {
          existing = v;
          break;
        }
      }
    }
    
    if (existing) {
      if (row['max power'] && existing.power === 15) existing.power = parseNumeric(row['max power']);
      if (row['max torque'] && existing.torque === 15) existing.torque = parseNumeric(row['max torque']);
      if (row['cooling system'] && existing.engine.cooling === 'air') {
        existing.engine.cooling = row['cooling system'].toLowerCase().includes('liquid') ? 'liquid' : 'air';
      }
    }
  }
  
  const finalBikes = Array.from(bikeMap.values());
  
  finalBikes.forEach((bike, index) => {
    bike.id = index + 1;
    bike.featureRatings = generateRatings(bike.mileage, bike.power, bike.torque, bike.engine.displacement);
    const sum = Object.values(bike.featureRatings).reduce((a, b) => a + b, 0);
    bike.overallRating = Math.round((sum / 7 / 20) * 10) / 10;
  });
  
  console.log(`📊 Successfully compiled ${finalBikes.length} unique bikes`);
  
  // Insert into MongoDB using Mongoose model
  const batchSize = 100;
  let inserted = 0;
  for (let i = 0; i < finalBikes.length; i += batchSize) {
    const batch = finalBikes.slice(i, i + batchSize);
    await Bike.insertMany(batch, { ordered: false });
    inserted += batch.length;
    process.stdout.write(`\r💾 MongoDB Atlas: Inserted ${inserted}/${finalBikes.length} bikes`);
  }
  console.log('\n');
  
  console.log('✅ Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

/**
 * RideEx API Server
 * Express + MongoDB backend serving bike data and images
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./db/connection');
const Bike = require('./db/models/Bike');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (HTML/CSS/JS frontend)
app.use(express.static(path.join(__dirname)));

// Serve image folders as static
app.use('/images/sports', express.static(path.join(__dirname, 'Sports')));
app.use('/images/commuter', express.static(path.join(__dirname, 'Commuter')));
app.use('/images/cruiser', express.static(path.join(__dirname, 'Cruiser')));
app.use('/images/offroad', express.static(path.join(__dirname, 'OffRoad')));
app.use('/images/scooter', express.static(path.join(__dirname, 'Scooter')));

// ===== API ROUTES =====

// GET /api/bikes — List all bikes with optional filters
app.get('/api/bikes', async (req, res) => {
  try {
    const {
      brand,
      category,
      min_price,
      max_price,
      min_cc,
      max_cc,
      cooling,
      search,
      sort_by,
      sort_order,
      page = 1,
      limit = 50,
      has_image
    } = req.query;

    const filter = {};

    if (brand) filter.brand = { $regex: new RegExp(brand, 'i') };
    if (category) filter.category = { $regex: new RegExp(category, 'i') };
    if (min_price || max_price) {
      filter.price = {};
      if (min_price) filter.price.$gte = Number(min_price);
      if (max_price) filter.price.$lte = Number(max_price);
    }
    if (min_cc || max_cc) {
      filter['engine.displacement'] = {};
      if (min_cc) filter['engine.displacement'].$gte = Number(min_cc);
      if (max_cc) filter['engine.displacement'].$lte = Number(max_cc);
    }
    if (cooling) filter['engine.cooling'] = { $regex: new RegExp(cooling, 'i') };
    
    // Check if image is not a placeholder
    if (has_image === 'true') {
      filter.image = { $not: /placehold/ };
    }
    
    if (search) {
      filter.$or = [
        { brand: { $regex: new RegExp(search, 'i') } },
        { model: { $regex: new RegExp(search, 'i') } },
        { category: { $regex: new RegExp(search, 'i') } },
        { tags: { $regex: new RegExp(search, 'i') } }
      ];
    }

    // Sorting
    const sortField = sort_by || 'price';
    const sortDir = sort_order === 'desc' ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);

    const [bikes, total] = await Promise.all([
      Bike.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(Number(limit)),
      Bike.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: bikes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/bikes/:id — Get single bike by MongoDB ID
app.get('/api/bikes/:id', async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ success: false, error: 'Bike not found' });
    res.json({ success: true, data: bike });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/brands — Get all brands with counts
app.get('/api/brands', async (req, res) => {
  try {
    const brands = await Bike.aggregate([
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: brands.map(b => ({ brand: b._id, count: b.count })) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/body-types — Get all categories (body types) with counts
app.get('/api/body-types', async (req, res) => {
  try {
    const types = await Bike.aggregate([
      { $match: { category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: types.map(t => ({ type: t._id, count: t.count })) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stats — Database statistics
app.get('/api/stats', async (req, res) => {
  try {
    const [total, withImages, brands, categories, priceRange] = await Promise.all([
      Bike.countDocuments(),
      Bike.countDocuments({ image: { $not: /placehold/ } }),
      Bike.distinct('brand'),
      Bike.distinct('category'),
      Bike.aggregate([
        { $match: { price: { $gt: 0 } } },
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' }, avg: { $avg: '$price' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total_bikes: total,
        bikes_with_images: withImages,
        total_brands: brands.length,
        brands,
        total_body_types: categories.filter(Boolean).length,
        body_types: categories.filter(Boolean),
        price_range: priceRange[0] || {}
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/search/:query — Smart search
app.get('/api/search/:query', async (req, res) => {
  try {
    const q = req.params.query;
    const bikes = await Bike.find({
      $or: [
        { brand: { $regex: new RegExp(q, 'i') } },
        { model: { $regex: new RegExp(q, 'i') } },
        { category: { $regex: new RegExp(q, 'i') } },
        { tags: { $regex: new RegExp(q, 'i') } }
      ]
    }).limit(20);

    res.json({ success: true, data: bikes, count: bikes.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== START SERVER =====
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 RideEx API Server running at http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   GET /api/bikes          — List/filter bikes`);
    console.log(`   GET /api/bikes/:id      — Get single bike`);
    console.log(`   GET /api/brands         — All brands`);
    console.log(`   GET /api/body-types     — All body types`);
    console.log(`   GET /api/stats          — Database stats`);
    console.log(`   GET /api/search/:query  — Smart search\n`);
  });
}

startServer().catch(console.error);

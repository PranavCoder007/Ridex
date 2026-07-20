const connectDB = require('../db/connection');
const Bike = require('../db/models/Bike');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const {
      brand, category, min_price, max_price,
      min_cc, max_cc, cooling, search,
      sort_by, sort_order, page = 1, limit = 50, has_image
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
    if (has_image === 'true') filter.image = { $not: /placehold/ };

    if (search) {
      filter.$or = [
        { brand: { $regex: new RegExp(search, 'i') } },
        { model: { $regex: new RegExp(search, 'i') } },
        { category: { $regex: new RegExp(search, 'i') } },
        { tags: { $regex: new RegExp(search, 'i') } }
      ];
    }

    const sortField = sort_by || 'price';
    const sortDir = sort_order === 'desc' ? -1 : 1;
    const skip = (Number(page) - 1) * Number(limit);

    const [bikes, total] = await Promise.all([
      Bike.find(filter).sort({ [sortField]: sortDir }).skip(skip).limit(Number(limit)),
      Bike.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: bikes,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

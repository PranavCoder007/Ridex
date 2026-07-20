const connectDB = require('../db/connection');
const Bike = require('../db/models/Bike');

module.exports = async (req, res) => {
  try {
    await connectDB();

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
};

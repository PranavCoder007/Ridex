const connectDB = require('../db/connection');
const Bike = require('../db/models/Bike');

module.exports = async (req, res) => {
  try {
    await connectDB();
    const brands = await Bike.aggregate([
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: brands.map(b => ({ brand: b._id, count: b.count })) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

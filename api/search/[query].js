const connectDB = require('../../db/connection');
const Bike = require('../../db/models/Bike');

module.exports = async (req, res) => {
  try {
    await connectDB();
    const { query } = req.query;
    if (!query) return res.status(400).json({ success: false, error: 'Query parameter required' });

    const bikes = await Bike.find({
      $or: [
        { brand: { $regex: new RegExp(query, 'i') } },
        { model: { $regex: new RegExp(query, 'i') } },
        { category: { $regex: new RegExp(query, 'i') } },
        { tags: { $regex: new RegExp(query, 'i') } }
      ]
    }).limit(20);

    res.json({ success: true, data: bikes, count: bikes.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const connectDB = require('../db/connection');
const Bike = require('../db/models/Bike');

module.exports = async (req, res) => {
  try {
    await connectDB();
    const types = await Bike.aggregate([
      { $match: { category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json({ success: true, data: types.map(t => ({ type: t._id, count: t.count })) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const connectDB = require('../../db/connection');
const Bike = require('../../db/models/Bike');

module.exports = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.query;
    const bike = await Bike.findById(id);
    if (!bike) return res.status(404).json({ success: false, error: 'Bike not found' });
    res.json({ success: true, data: bike });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

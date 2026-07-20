const mongoose = require('mongoose');

const bikeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  type: { type: String, required: true, index: true },
  brand: { type: String, required: true, index: true },
  model: { type: String, required: true, index: true },
  image: { type: String, required: true },
  price: { type: Number, required: true, index: true },
  priceDisplay: { type: String, required: true },
  engine: {
    type: { type: String },
    displacement: { type: Number, index: true },
    cooling: { type: String },
    fuelSystem: { type: String }
  },
  power: { type: Number },
  torque: { type: Number },
  mileage: { type: Number },
  frame: { type: String },
  suspension: {
    front: { type: String },
    rear: { type: String }
  },
  brakes: {
    front: { type: String },
    rear: { type: String },
    abs: { type: Boolean }
  },
  wheels: {
    size: { type: Number },
    type: { type: String }
  },
  seat: { type: String },
  seatHeight: { type: Number },
  weight: { type: Number },
  lights: { type: String },
  category: { type: String, index: true },
  style: { type: String },
  colors: [{ type: String }],
  colorHex: [{ type: String }],
  variants: [{
    name: { type: String },
    price: { type: Number }
  }],
  featureRatings: {
    mileage: { type: Number },
    comfort: { type: Number },
    performance: { type: Number },
    handling: { type: Number },
    value: { type: Number },
    braking: { type: Number },
    styling: { type: Number }
  },
  overallRating: { type: Number },
  pros: [{ type: String }],
  cons: [{ type: String }],
  reviews: [{
    user: { type: String },
    rating: { type: Number },
    comment: { type: String }
  }],
  tags: [{ type: String }]
}, {
  timestamps: true,
  collection: 'bikes'
});

// Text index for smart search matching
bikeSchema.index({ brand: 'text', model: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.models.Bike || mongoose.model('Bike', bikeSchema);

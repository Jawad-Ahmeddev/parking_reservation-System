const mongoose = require('mongoose');

const ParkingSpotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  isOccupied: {
    type: Boolean,
    default: false
  },
  reservations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation'
  }]
});

module.exports = mongoose.model('ParkingSpot', ParkingSpotSchema);

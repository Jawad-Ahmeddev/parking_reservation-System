const express = require('express');
const auth = require('../middleware/authMiddleware');
const Reservation = require('../models/Reservation');
const ParkingSpot = require('../models/ParkingSpot'); // Ensure this line is correct

const router = express.Router();
router.get('/', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate('parkingSpot', 'name');
      console.log('Parking spots from DB:', reservations); // Log data before sending
    res.status(200).json(reservations);
  } catch (err) {
    console.error("Error: " + err);
    res.status(400).send('Server Error');
  }
});
// Create a new reservation
router.post('/', auth, async (req, res) => {
  const { parkingSpotName, date, startTime, endTime } = req.body;

  try {
      const spot = await ParkingSpot.findOne({ name: parkingSpotName });

      if (!spot) {
          return res.status(404).json({ msg: "Parking spot not found" });
      }

      // Create a new reservation with status 'pending'
      const newReservation = new Reservation({
          user: req.user.id,
          parkingSpot: spot._id,
          date,
          startTime,
          endTime,
          status: 'pending'
      });
      await newReservation.save();

      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      if (newReservation.startTime <= currentTime) {
          spot.isOccupied = true;
          await spot.save();
      }
      
      req.io.emit('updateParkingStatus');
      await newReservation.save();

      res.json(newReservation);

  } catch (err) {
      console.error('Reservation creation error:', err);
      res.status(500).send("Server error");
  }
});



const cron = require('node-cron');

// Cancel a reservation
router.delete('/:id', auth, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ msg: 'Reservation not found' });
        }

        // Check if the user is authorized to delete this reservation
        if (reservation.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const parkingSpot = await ParkingSpot.findById(reservation.parkingSpot);
        if (parkingSpot) {
            parkingSpot.isOccupied = false;
            await parkingSpot.save();
        }

        await Reservation.findByIdAndDelete(reservation._id);
        req.io.emit('updateParkingStatus');
        res.json({ msg: 'Reservation canceled and spot freed' });
    } catch (err) {
        console.error('Server Error', err);
        res.status(500).send('Server Error');
    }
});

// Automatic deletion of expired reservations
cron.schedule('*/5 * * * *', async () => {  // Runs every 5 minutes
  try {
      const now = new Date();
      const bufferTime = new Date(now.getTime() - 1 * 60 * 1000);  // 1 minute buffer

      const expiredReservations = await Reservation.find({ endTime: { $lt: bufferTime } });

      expiredReservations.forEach(async (reservation) => {
          const parkingSpot = await ParkingSpot.findById(reservation.parkingSpot);
          if (parkingSpot) {
              parkingSpot.isOccupied = false;
              await parkingSpot.save();
          }

          await Reservation.findByIdAndDelete(reservation._id);
          console.log(`Deleted expired reservation with ID: ${reservation._id}`);
      });

  } catch (err) {
      console.error('Error running cron job:', err);
  }
});

  
  module.exports = router;
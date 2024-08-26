const express = require('express');
const auth= require('../middleware/authMiddleware')
const ParkingSpot = require('../models/ParkingSpot');
const router = express.Router();
const User = require('../models/User')



router.get('/', async (req, res) => {
  try {
      const parkingSpots = await ParkingSpot.find().populate('reservations');
      res.json(parkingSpots);
      console.log(parkingSpots)
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
  }
});





router.get('/:name', async (req, res) => {
    try {
      const spot = await ParkingSpot.findOne({ name: req.params.name });
      if (!spot) {
        return res.status(404).json({ msg: 'Parking spot not found' });
      }
      res.json(spot);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  

router.post('/', async (req, res)=> {
    const { name } = req.body;
    console.log(name);
     try{
        let spot = await ParkingSpot.find({name});
        console.log(spot)
        if (!(spot.length < 1 || spot == undefined)){
            return res.status(400).json({msg : "Parking Spot is already exists"})
        }

        spot = new ParkingSpot({
            name, 
        });

        await spot.save();
        res.json(spot);
     }catch(err){
        console.log("Error: "+ err);
        res.status(400).send("Server Error")
     }
})

module.exports = router; 

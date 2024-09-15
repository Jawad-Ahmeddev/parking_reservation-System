const express = require('express');
const http = require('http');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();
const cron = require('node-cron');
const Reservation = require('./models/Reservation');
const ParkingSpot = require('./models/ParkingSpot');
const User = require('./models/User'); // Ensure User model is loaded

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: `${process.env.frontendUrl}`, // Replace with your frontend URL
    methods: ['GET', 'POST']
  }
});

// Connect to the database
connectDB();
console.log(process.env.frontendUrl);
// Initialize middleware
app.use(express.json());

// Set up CORS to allow requests from your Angular frontend
app.use(cors({
  origin: `${process.env.frontendUrl}`,
}));

// Pass io to your routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/reservation', (req, res, next) => {
  req.io = io;
  next();
}, require('./routes/reservation'));
app.use('/api/parking', (req, res, next) => {
  req.io = io;
  next();
}, require('./routes/parking'));
app.use('/api/users', require('./routes/user'));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected with ID ' + socket.id);

  socket.on('reservationChange', () => {
    socket.broadcast.emit('updateParkingStatus');
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 2001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// CRON job to manage reservation statuses and send updates via Socket.IO
cron.schedule('* * * * *', async () => {  // Runs every minute
  try {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);

      // Activate pending reservations whose start time has been reached
      const pendingReservations = await Reservation.find({
          status: 'pending',
          date: { $lte: now },
          startTime: { $lte: currentTime }
      });

      pendingReservations.forEach(async (reservation) => {
          reservation.status = 'active';
          await reservation.save();

          const spot = await ParkingSpot.findById(reservation.parkingSpot);
          if (spot) {
              spot.isOccupied = true;
              await spot.save();
          }

          // Notify all clients to update the parking status
          io.emit('updateParkingStatus');
      });

      // Complete reservations whose end time has been reached
      const activeReservations = await Reservation.find({
          status: 'active',
          endTime: { $lte: currentTime }
      });

      activeReservations.forEach(async (reservation) => {
          reservation.status = 'completed';
          await reservation.save();

          const spot = await ParkingSpot.findById(reservation.parkingSpot);
          if (spot) {
              spot.isOccupied = false;
              await spot.save();
          }

          // Notify all clients to update the parking status
          io.emit('updateParkingStatus');
      });

  } catch (err) {
      console.error('Error running cron job:', err);
  }
});


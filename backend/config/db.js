const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log("MongoDB Connection String:", process.env.connectionString); // Debugging statement

      await mongoose.connect(process.env.connectionString, { useNewUrlParser: true, useUnifiedTopology: true });

      console.log('MongoDB is connected!'+process.env.connectionString );
    } catch (err) {
      console.error('Error: ' + err);
    }
  };

module.exports = connectDB;

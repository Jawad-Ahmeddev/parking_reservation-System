const mongoose = require('mongoose');

const connectDB = async()=>{
    try{
        mongoose.connect(process.env.connectionString);
        console.log("mongoDb is connected!");

    }catch(err){
        console.error("Error: "+err);
        process.exit(1);
    }
}

module.exports = connectDB;
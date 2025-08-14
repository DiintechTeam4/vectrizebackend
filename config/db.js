const mongoose = require('mongoose');

const connectDB = async (req,res) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MONGODB SUCCESSFULLY CONNECTED");
    } 
    catch (error) {
        console.error(`ERROR : ${error.message}`);
        process.exit(1);
    }
}

module.exports = connectDB
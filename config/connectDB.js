const mongoose = require("mongoose")

//Connecting to mongoDB Atlas (Cloud database service) via mongoose (ODM library for mongoDB)

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_PATH, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        })
        console.log("Database connected")
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

module.exports = connectDB
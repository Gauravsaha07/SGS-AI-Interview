import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`SGS DB CONNECTION SUCCESS : ${conn.connection.name}`.bgGreen)
    } catch (error) {
        console.log(error)
        console.log(`SGS DB CONNECTION FAILED ${error.message}`.bgRed)
    }
}

export default connectDB

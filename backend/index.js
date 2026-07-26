require('./utils/loadEnv'); // Must be first — decrypts .env.enc or falls back to plain .env
const mongoose = require('mongoose');
const { createApp } = require('./app');

const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 9000;
const app = createApp();

const connectDb = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("Database connected");
        require('./utils/orderJanitor').startOrderJanitor();
    } catch (error) {
        console.log("Database connection failed", error.message);
        process.exit(1);
    }

}

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    connectDb();
});

const mongoose = require('mongoose');
require('dotenv').config();

const fix = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI is not defined in .env");
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB...");

        // Define a minimal schema to interact with giveaways
        const Giveaway = mongoose.model('Giveaway', new mongoose.Schema({ image: String }), 'giveaways');

        // Replace localhost:9000 with the production domain
        const result = await Giveaway.updateMany(
            { image: { $regex: 'localhost:9000' } },
            [{
                $set: {
                    image: {
                        $replaceOne: {
                            input: "$image",
                            find: "http://localhost:9000",
                            replacement: "https://onemoregift.in"
                        }
                    }
                }
            }]
        );

        console.log(`SUCCESS: Updated ${result.modifiedCount} images.`);
        process.exit(0);
    } catch (err) {
        console.error("MIGRATION ERROR:", err);
        process.exit(1);
    }
};
fix();

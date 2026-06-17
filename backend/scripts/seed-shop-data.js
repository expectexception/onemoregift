const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Store = require("../model/Store");
const Product = require("../model/Product");

dotenv.config();

async function seedShop() {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/onemoregift";
    await mongoose.connect(mongoUri);

    console.log("Connected to MongoDB for shop seeding...");

    // 1. Seed Stores
    const storesData = [
        {
            name: "Flagship Store - Connaught Place",
            code: "DEL-01",
            address: "H-25, Connaught Circus, near Rajiv Chowk Metro Gate 3",
            city: "Delhi",
            state: "Delhi",
            postalCode: "110001",
            landmark: "Opposite Wenger's Bakery",
            phone: "011-45678901",
            email: "delhi@onemoregift.in",
            dailyPickupCapacity: 100,
            isActive: true,
            operatingHours: [
                { day: "mon", open: "09:00", close: "21:00", isClosed: false },
                { day: "tue", open: "09:00", close: "21:00", isClosed: false },
                { day: "wed", open: "09:00", close: "21:00", isClosed: false },
                { day: "thu", open: "09:00", close: "21:00", isClosed: false },
                { day: "fri", open: "09:00", close: "21:00", isClosed: false },
                { day: "sat", open: "09:00", close: "22:00", isClosed: false },
                { day: "sun", open: "10:00", close: "20:00", isClosed: false }
            ]
        },
        {
            name: "Cyber City Boutique",
            code: "GUR-01",
            address: "Ground Floor, Building 10C, DLF Cyber City",
            city: "Gurugram",
            state: "Haryana",
            postalCode: "122002",
            landmark: "Next to Starbucks",
            phone: "0124-9876543",
            email: "gurugram@onemoregift.in",
            dailyPickupCapacity: 80,
            isActive: true,
            operatingHours: [
                { day: "mon", open: "08:30", close: "22:00", isClosed: false },
                { day: "tue", open: "08:30", close: "22:00", isClosed: false },
                { day: "wed", open: "08:30", close: "22:00", isClosed: false },
                { day: "thu", open: "08:30", close: "22:00", isClosed: false },
                { day: "fri", open: "08:30", close: "23:00", isClosed: false },
                { day: "sat", open: "09:00", close: "23:00", isClosed: false },
                { day: "sun", open: "10:00", close: "18:00", isClosed: false }
            ]
        },
        {
            name: "Noida Sector 62 Hub",
            code: "NOI-01",
            address: "B-32, Sector 62, Electronic City",
            city: "Noida",
            state: "Uttar Pradesh",
            postalCode: "201301",
            landmark: "Near Stellar IT Park",
            phone: "0120-1234567",
            email: "noida@onemoregift.in",
            dailyPickupCapacity: 50,
            isActive: true,
            operatingHours: [
                { day: "mon", open: "09:00", close: "20:00", isClosed: false },
                { day: "tue", open: "09:00", close: "20:00", isClosed: false },
                { day: "wed", open: "09:00", close: "20:00", isClosed: false },
                { day: "thu", open: "09:00", close: "20:00", isClosed: false },
                { day: "fri", open: "09:00", close: "20:00", isClosed: false },
                { day: "sat", open: "10:00", close: "18:00", isClosed: false },
                { day: "sun", open: "10:00", close: "18:00", isClosed: true }
            ]
        }
    ];

    console.log("Seeding physical stores...");
    await Store.deleteMany({});
    const createdStores = await Store.insertMany(storesData);
    console.log(`Successfully seeded ${createdStores.length} stores.`);

    // 2. Seed Products
    const productsData = [
        {
            name: "Sleek Matte Mechanical Keyboard",
            description: "An ultra-premium mechanical keyboard featuring hot-swappable key switches, custom RGB profiles, tactile keycaps, and a robust aluminum frame. Designed for developers and gaming enthusiasts alike.",
            category: "Tech",
            tags: ["keyboard", "workspace", "gaming", "mechanical", "premium"],
            basePrice: 5999,
            discountedPrice: 4999,
            isOnSale: true,
            thumbnail: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60",
            images: [
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60",
                "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=60"
            ],
            hasVariants: true,
            variants: [
                { name: "Blue Clicky Switches", sku: "KB-MECH-BLUE", price: 4999, stock: 12, isActive: true },
                { name: "Brown Tactile Switches", sku: "KB-MECH-BROWN", price: 5199, stock: 4, isActive: true },
                { name: "Red Linear Switches", sku: "KB-MECH-RED", price: 4999, stock: 20, isActive: true }
            ],
            stock: 36,
            lowStockThreshold: 5,
            isFeatured: true,
            rating: 4.8,
            occasions: ["birthday", "graduation", "achievement"],
            storeStock: createdStores.map(store => ({ storeId: store._id, stock: 12 }))
        },
        {
            name: "Full-Grain Italian Leather Wallet",
            description: "Handcrafted using vegetable-tanned Italian leather. Features RFID protection, 8 card slots, a secure cash compartment, and a minimalist design that patinas beautifully over time.",
            category: "Accessories",
            tags: ["wallet", "leather", "classic", "style", "mens"],
            basePrice: 2499,
            discountedPrice: 1899,
            isOnSale: true,
            thumbnail: "https://images.unsplash.com/photo-1627124765135-565259cf5580?w=500&auto=format&fit=crop&q=60",
            images: [
                "https://images.unsplash.com/photo-1627124765135-565259cf5580?w=500&auto=format&fit=crop&q=60"
            ],
            hasVariants: true,
            variants: [
                { name: "Classic Tan", sku: "LT-WL-TAN", price: 1899, stock: 3, isActive: true },
                { name: "Charcoal Black", sku: "LT-WL-BLK", price: 1899, stock: 15, isActive: true }
            ],
            stock: 18,
            lowStockThreshold: 4,
            isFeatured: true,
            rating: 4.9,
            occasions: ["anniversary", "birthday", "festival"],
            storeStock: createdStores.map(store => ({ storeId: store._id, stock: 6 }))
        },
        {
            name: "Artisanal Dark Truffles Box (16pc)",
            description: "A decadent selection of single-origin dark chocolate truffles, infused with sea salt, rich espresso, and wild berry fillings. 100% organic ingredients, packaged in a premium gold-embossed gift box.",
            category: "Food",
            tags: ["chocolate", "sweets", "gourmet", "truffles", "organic"],
            basePrice: 1299,
            discountedPrice: 1299,
            isOnSale: false,
            thumbnail: "https://images.unsplash.com/photo-1549007994-cb92ca817bc7?w=500&auto=format&fit=crop&q=60",
            images: [
                "https://images.unsplash.com/photo-1549007994-cb92ca817bc7?w=500&auto=format&fit=crop&q=60"
            ],
            hasVariants: false,
            variants: [],
            stock: 60,
            lowStockThreshold: 10,
            isFeatured: false,
            rating: 4.6,
            occasions: ["anniversary", "festival", "wedding", "custom"],
            storeStock: createdStores.map(store => ({ storeId: store._id, stock: 20 }))
        },
        {
            name: "Minimalist Brass Desk Organizer",
            description: "Keep your workspace clutter-free. Crafted from pure heavy brass, this organizer holds letters, pens, smart phones, and features a magnetic clip tray. Matte brushed gold finish.",
            category: "Workspace",
            tags: ["desk", "brass", "organizer", "office", "minimalist"],
            basePrice: 3499,
            discountedPrice: 2999,
            isOnSale: true,
            thumbnail: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=60",
            images: [
                "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=60"
            ],
            hasVariants: false,
            variants: [],
            stock: 2,
            lowStockThreshold: 3,
            isFeatured: true,
            rating: 4.7,
            occasions: ["achievement", "graduation", "custom"],
            storeStock: createdStores.map(store => ({ storeId: store._id, stock: 1 }))
        }
    ];

    console.log("Seeding catalog products...");
    await Product.deleteMany({});
    const createdProducts = await Product.insertMany(productsData);
    console.log(`Successfully seeded ${createdProducts.length} products.`);

    console.log("Disconnecting shop seeding...");
    await mongoose.disconnect();
    console.log("Shop seeding complete.");
}

seedShop()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Shop seeding failed:", err);
        process.exit(1);
    });

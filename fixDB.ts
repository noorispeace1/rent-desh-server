import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_DB_URI || "";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const database = client.db("rent_desh_db");
    const propertyCollection = database.collection("property");
    
    const count = await propertyCollection.countDocuments();
    console.log(`Current properties count: ${count}`);
    
    if (count === 0) {
      console.log("Adding sample properties...");
      const dummyProperties = [
        {
          title: "Modern Apartment in Gulshan",
          description: "A beautiful 3-bedroom apartment located in the heart of Gulshan. Fully furnished with modern amenities.",
          propertyType: "apartment",
          location: "Gulshan, Dhaka",
          monthlyRent: 45000,
          bedroom: 3,
          bathroom: 2,
          propertySize: 1500,
          imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070",
          ownerEmail: "owner@rentdesh.com",
          status: "APPROVED",
          createdAt: new Date().toISOString()
        },
        {
          title: "Cozy Studio in Dhanmondi",
          description: "Perfect for singles or couples. This studio apartment offers great views and easy access to shopping malls.",
          propertyType: "studio",
          location: "Dhanmondi, Dhaka",
          monthlyRent: 20000,
          bedroom: 1,
          bathroom: 1,
          propertySize: 600,
          imageUrl: "https://images.unsplash.com/photo-1502672260266-1c1e52409818?q=80&w=2000",
          ownerEmail: "owner@rentdesh.com",
          status: "APPROVED",
          createdAt: new Date().toISOString()
        },
        {
          title: "Luxury House in Banani",
          description: "Spacious independent house with a garden, garage, and top-tier security. Ideal for families.",
          propertyType: "house",
          location: "Banani, Dhaka",
          monthlyRent: 85000,
          bedroom: 4,
          bathroom: 4,
          propertySize: 3200,
          imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075",
          ownerEmail: "owner@rentdesh.com",
          status: "APPROVED",
          createdAt: new Date().toISOString()
        }
      ];
      await propertyCollection.insertMany(dummyProperties);
      console.log("Successfully added sample properties.");
    } else {
        console.log("Properties already exist in the database.");
    }
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

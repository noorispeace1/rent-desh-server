import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_DB_URI || "";
const client = new MongoClient(uri);

const extraProperties = [
  {
    title: "Classic Residence in Baridhara",
    location: "Baridhara DOHS, Dhaka",
    propertyType: "apartment",
    rentType: "monthly",
    monthlyRent: "85000",
    propertySize: "1900",
    bedroom: "3",
    bathroom: "4",
    extraFeatures: "Servant Quarter, Lake View",
    description: "Elegant living in the secured area of Baridhara DOHS. Close to parks and international schools.",
    amenities: ["Security", "Parking", "Generator", "Lift", "Gym"],
    imageUrl: "https://i.ibb.co/7xwrqQ5n/download-3.jpg",
    createdAt: new Date().toISOString(),
    ownerEmail: "admin@rentdesh.com",
    ownerName: "RentDesh Admin"
  },
  {
    title: "Cozy Loft in Badda",
    location: "Middle Badda, Dhaka",
    propertyType: "apartment",
    rentType: "monthly",
    monthlyRent: "18000",
    propertySize: "950",
    bedroom: "2",
    bathroom: "1",
    extraFeatures: "Rooftop Garden Access",
    description: "Compact and affordable apartment in Middle Badda, excellent connectivity to Gulshan and Hatirjheel.",
    amenities: ["WiFi", "Water Supply"],
    imageUrl: "https://i.ibb.co/mVF2QLpk/download-4.jpg",
    createdAt: new Date().toISOString(),
    ownerEmail: "admin@rentdesh.com",
    ownerName: "RentDesh Admin"
  }
];

async function run() {
  try {
    await client.connect();
    const database = client.db("rent_desh_db");
    const propertyCollection = database.collection("property");
    
    // Insert additional data
    const result = await propertyCollection.insertMany(extraProperties);
    console.log(`Successfully inserted ${result.insertedCount} additional realistic properties.`);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

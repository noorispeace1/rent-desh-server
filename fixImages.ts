import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_DB_URI || "";
const client = new MongoClient(uri);

const fallbackImages = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1de2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  "https://images.unsplash.com/photo-1501183638710-841dd1904471?w=800&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80"
];

async function run() {
  try {
    await client.connect();
    const database = client.db("rent_desh_db");
    const propertyCollection = database.collection("property");
    
    const properties = await propertyCollection.find().toArray();
    let updated = 0;

    for (let i = 0; i < properties.length; i++) {
      const p = properties[i];
      // If image URL is from ibb.co.com (which doesn't work directly) or missing
      if (!p.imageUrl || p.imageUrl.includes("ibb.co.com")) {
        const workingImage = fallbackImages[i % fallbackImages.length];
        await propertyCollection.updateOne(
          { _id: p._id },
          { $set: { imageUrl: workingImage } }
        );
        updated++;
      }
    }
    console.log(`Successfully updated ${updated} properties with working image URLs.`);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

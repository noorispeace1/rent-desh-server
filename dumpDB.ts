import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_DB_URI || "";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db("rent_desh_db");
    const propertyCollection = database.collection("property");
    
    const allProperties = await propertyCollection.find({}).toArray();
    console.log(JSON.stringify(allProperties, null, 2));
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

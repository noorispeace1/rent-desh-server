const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_DB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db("rent_desh_db");
    const propertyCollection = database.collection("property");
    
    // Hardcode user email from session/screenshot (Fallon)
    // or just update to the only user that exists if it's a test environment
    // From step 8, we saw email might be xagosybine@mailinator.com
    
    // Actually, we can fetch all users and if there's only one, use it.
    const userCollection = database.collection("user");
    const user = await userCollection.findOne();
    if (!user) {
      console.log("No user found");
      return;
    }
    
    console.log("Using user:", user.email, user.name);

    const result = await propertyCollection.updateMany(
      { $or: [{ ownerEmail: { $exists: false } }, { ownerEmail: null }, { ownerEmail: "" }] },
      { $set: { ownerEmail: user.email, ownerName: user.name } }
    );
    console.log("Updated documents:", result.modifiedCount);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);

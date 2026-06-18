const express = require('express');
const cors = require('cors');
const app = express()
const port = 5000
require('dotenv').config()
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.get('/', (req, res) => {
  res.send('Hello World!')
})



const uri = process.env.MONGO_DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    
    await client.connect();

const database = client.db("rent_desh_db");
const propertyCollection = database.collection("property");
const favoritesCollection = database.collection("favorites");
const userCollection = database.collection("user")
app.post('/property', async (req, res) => {
  try {
    const propertyData = req.body;
    const result = await propertyCollection.insertOne(propertyData);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error adding property:", error);
    res.status(500).send({ error: "Failed to add property" });
  }
});

app.get('/properties', async (req, res) => {
  try {
    const cursor = propertyCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).send({ error: "Failed to fetch properties" });
  }
});

app.get('/property/:id', async (req, res) => {
    console.log(req.params)
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const property = await propertyCollection.findOne(query);
    if (property) {
      res.send(property);
    } else {
      res.status(404).send({ error: "Property not found" });
    }
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).send({ error: "Failed to fetch property" });
  }
});

// Toggle Favorite endpoint
app.post('/favorites', async (req, res) => {
  try {
    const { userId, propertyId } = req.body;
    if (!userId || !propertyId) {
      return res.status(400).send({ error: "userId and propertyId are required" });
    }

    const query = { userId, propertyId };
    const existing = await favoritesCollection.findOne(query);

    if (existing) {
      await favoritesCollection.deleteOne(query);
      res.send({ favorited: false, message: "Removed from favorites" });
    } else {
      await favoritesCollection.insertOne({
        userId,
        propertyId,
        createdAt: new Date().toISOString()
      });
      res.status(201).send({ favorited: true, message: "Added to favorites" });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).send({ error: "Failed to toggle favorite" });
  }
});

// Get all properties favorited by a specific user
app.get('/favorites/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userFavorites = await favoritesCollection.find({ userId }).toArray();
    
    if (userFavorites.length === 0) {
      return res.send([]);
    }

    // Extract propertyIds and map to ObjectId
    const propertyIds = userFavorites.map(fav => new ObjectId(fav.propertyId));
    
    // Find all matching properties
    const properties = await propertyCollection.find({ _id: { $in: propertyIds } }).toArray();
    
    res.send(properties);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).send({ error: "Failed to fetch favorites" });
  }
});

// Get just the array of favorited property IDs for a specific user
app.get('/favorites/ids/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userFavorites = await favoritesCollection.find({ userId }).toArray();
    const favoriteIds = userFavorites.map(fav => fav.propertyId);
    res.send(favoriteIds);
  } catch (error) {
    console.error("Error fetching favorite IDs:", error);
    res.status(500).send({ error: "Failed to fetch favorite IDs" });
  }
});

// Get admin dashboard stats
app.get('/admin/stats', async (req, res) => {
  try {
    const totalProperties = await propertyCollection.countDocuments();
    const totalUsers = await userCollection.countDocuments();
    const totalBookings = await database.collection("favorites").countDocuments();

    // Mock monthly trends for charts
    const monthlyStats = [
      { month: 'Jan', revenue: 125000, users: 120, properties: 45 },
      { month: 'Feb', revenue: 148000, users: 145, properties: 55 },
      { month: 'Mar', revenue: 195000, users: 190, properties: 70 },
      { month: 'Apr', revenue: 230000, users: 220, properties: 85 },
      { month: 'May', revenue: 310000, users: 290, properties: 110 },
      { month: 'Jun', revenue: 420000, users: 380, properties: 145 },
    ];

    // Property types distribution
    const propertyTypeCounts = await propertyCollection.aggregate([
      { $group: { _id: "$propertyType", count: { $sum: 1 } } }
    ]).toArray();

    // Map properties to lowercase key values
    const propertyDistribution = propertyTypeCounts.map(item => ({
      name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : "Unknown",
      value: item.count
    }));

    res.send({
      totalProperties,
      totalUsers,
      totalBookings,
      monthlyStats,
      propertyDistribution
    });
  } catch (error) {
    console.error("Error generating admin stats:", error);
    res.status(500).send({ error: "Failed to generate admin statistics" });
  }
});

// Get all users for admin dashboard
app.get('/admin/users', async (req, res) => {
  try {
    const users = await userCollection.find().toArray();
    res.send(users);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).send({ error: "Failed to fetch users" });
  }
});

// Approve a property listing
app.patch('/properties/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await propertyCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "APPROVED" } }
    );
    res.send({ success: true, message: "Property approved", result });
  } catch (error) {
    console.error("Error approving property:", error);
    res.status(500).send({ error: "Failed to approve property" });
  }
});

// Delete a property listing
app.delete('/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await propertyCollection.deleteOne({ _id: new ObjectId(id) });
    res.send({ success: true, message: "Property deleted", result });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).send({ error: "Failed to delete property" });
  }
});

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);










app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
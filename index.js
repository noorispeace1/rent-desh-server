const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000
require('dotenv').config()
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// Verify Token Middleware
const verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'access not available' });
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'rentdesh_secret_key_2026', (err, decoded) => {
    if (err) {
      return res.status(403).send({ error: true, message: 'access not available' });
    }
    req.decoded = decoded;
    next();
  });
};

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/dashboard', verifyToken, (req, res) => {
  res.send({ message: "Dashboard accessed successfully!", user: req.decoded });
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
    
    // await client.connect();

const database = client.db("rent_desh_db");
const propertyCollection = database.collection("property");
const favoritesCollection = database.collection("favorites");
const userCollection = database.collection("user");
const bookingsCollection = database.collection("bookings");
const reviewsCollection = database.collection("reviews");

// Submit a review
app.post('/reviews', async (req, res) => {
  try {
    const reviewData = req.body;
    reviewData.createdAt = new Date().toISOString();
    const result = await reviewsCollection.insertOne(reviewData);
    res.status(201).send({ success: true, result });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).send({ error: "Failed to submit review" });
  }
});

// Fetch reviews by tenant email
app.get('/reviews/tenant/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const result = await reviewsCollection.find({ email }).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching tenant reviews:", error);
    res.status(500).send({ error: "Failed to fetch tenant reviews" });
  }
});

// Fetch all reviews for homepage
app.get('/reviews', async (req, res) => {
  try {
    const result = await reviewsCollection.find().sort({ createdAt: -1 }).limit(10).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    res.status(500).send({ error: "Failed to fetch all reviews" });
  }
});

// Generate JWT Token
app.post('/jwt', async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET || 'rentdesh_secret_key_2026', { expiresIn: '10h' });
  res.send({ token });
});

app.post('/property', verifyToken, async (req, res) => {
  try {
    const propertyData = req.body;
    const result = await propertyCollection.insertOne(propertyData);
    res.status(201).send(result);
  } catch (error) {
    console.error("Error adding property:", error);
    res.status(500).send({ error: "Failed to add property" });
  }
});

app.get('/properties', verifyToken, async (req, res) => {
  try {
    const cursor = propertyCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).send({ error: "Failed to fetch properties" });
  }
});

app.get('/properties/public', async (req, res) => {
  try {
    const cursor = propertyCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching public properties:", error);
    res.status(500).send({ error: "Failed to fetch public properties" });
  }
});

app.get('/properties/owner/:email', async (req, res) => {
  try {
    const ownerEmail = req.params.email;
    const cursor = propertyCollection.find({ ownerEmail });
    const result = await cursor.toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching owner properties:", error);
    res.status(500).send({ error: "Failed to fetch owner properties" });
  }
});

app.all('/propertise', (req, res) => {
  res.status(400).send({ error: true, message: "setup mf" });
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
    const totalBookings = await bookingsCollection.countDocuments();

    // Calculate total transactions
    const paidBookings = await bookingsCollection.find({ paymentStatus: "PAID" }).toArray();
    const totalTransactions = paidBookings.reduce((sum, booking) => sum + Number(booking.monthlyRent || 0), 0);

    // Mock monthly trends for charts
    const monthlyStats = [
      { month: 'Jan', revenue: 125000, users: 120, properties: 45 },
      { month: 'Feb', revenue: 148000, users: 145, properties: 55 },
      { month: 'Mar', revenue: 195000, revenueVal: totalTransactions > 0 ? Math.floor(totalTransactions * 0.4) : 195000, users: 190, properties: 70 },
      { month: 'Apr', revenue: 230000, revenueVal: totalTransactions > 0 ? Math.floor(totalTransactions * 0.6) : 230000, users: 220, properties: 85 },
      { month: 'May', revenue: 310000, revenueVal: totalTransactions > 0 ? Math.floor(totalTransactions * 0.8) : 310000, users: 290, properties: 110 },
      { month: 'Jun', revenue: 420000, revenueVal: totalTransactions > 0 ? totalTransactions : 420000, users: 380, properties: 145 },
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
      totalTransactions,
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

// Update a property listing
app.put('/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove _id from updateData if it exists to avoid modifying the immutable field
    if (updateData._id) {
      delete updateData._id;
    }

    const result = await propertyCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "Property not found" });
    }
    
    res.send({ success: true, message: "Property updated successfully", result });
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).send({ error: "Failed to update property" });
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

// Create a new booking
app.post('/bookings', async (req, res) => {
  try {
    const bookingData = req.body;
    bookingData.createdAt = new Date().toISOString();
    bookingData.status = "PENDING";
    const result = await bookingsCollection.insertOne(bookingData);
    res.status(201).send({ success: true, result });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).send({ error: "Failed to create booking" });
  }
});

// Update payment status for a booking
app.patch('/bookings/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { paymentStatus: "PAID", status: "PENDING" } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "Booking not found" });
    }
    res.send({ success: true, message: "Payment successful", result });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).send({ error: "Failed to update payment status" });
  }
});

// Fetch ALL bookings (for admin dashboard)
app.get('/bookings', async (req, res) => {
  try {
    const result = await bookingsCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).send({ error: "Failed to fetch all bookings" });
  }
});

// Fetch single booking by ID
app.get('/bookings/single/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { $or: [{ transactionId: id }] };
    
    // If id is a valid ObjectId, search by _id as well
    if (ObjectId.isValid(id)) {
      query.$or.push({ _id: new ObjectId(id) });
      query.$or.push({ propertyId: id });
    }

    const booking = await bookingsCollection.findOne(query);
    if (booking) {
      res.send(booking);
    } else {
      res.status(404).send({ error: "Booking not found" });
    }
  } catch (error) {
    console.error("Error fetching single booking:", error);
    res.status(500).send({ error: "Failed to fetch booking" });
  }
});

// Update booking payment status
app.patch('/bookings/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { paymentStatus: "PAID", transactionId: "TXN" + Math.floor(Math.random() * 1000000000) } }
    );
    res.send({ success: true, message: "Payment successful", result });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).send({ error: "Failed to process payment" });
  }
});

// Temp dump endpoint
app.get('/bookings-dump', async (req, res) => {
  const all = await bookingsCollection.find().toArray();
  res.send(all);
});

// Update all bookings to belong to Lacey Molina
app.get('/bookings-update-all', async (req, res) => {
  try {
    const result = await bookingsCollection.updateMany(
      {},
      { $set: { email: "xagosybine@mailinator.com", userName: "Lacey Molina" } }
    );
    res.send({ message: "Updated bookings", result });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Fetch bookings by tenant email
app.get('/bookings/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const result = await bookingsCollection.find({ email }).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching tenant bookings:", error);
    res.status(500).send({ error: "Failed to fetch tenant bookings" });
  }
});

// Fetch payment history (PAID bookings) by tenant email
app.get('/payment-history/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const result = await bookingsCollection.find({ email, paymentStatus: 'PAID' }).toArray();
    console.log(result,email)

    res.send(result);
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).send({ error: "Failed to fetch payment history" });
  }
});

// Fetch bookings for owner's properties
app.get('/bookings/owner/:email', async (req, res) => {
  try {
    const ownerEmail = req.params.email;
    // Find all properties owned by this owner
    const ownerProperties = await propertyCollection.find({ ownerEmail }).toArray();
    const propertyIds = ownerProperties.map(p => p._id.toString());
    
    // Find bookings matching these property IDs
    const bookings = await bookingsCollection.find({ propertyId: { $in: propertyIds } }).toArray();
    res.send(bookings);
  } catch (error) {
    console.error("Error fetching owner bookings:", error);
    res.status(500).send({ error: "Failed to fetch owner bookings" });
  }
});

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
 run().catch(console.dir);










app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
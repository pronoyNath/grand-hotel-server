const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
const cookieParse = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config()

// middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    "https://grand-hotel-daa65.web.app",
    "https://grand-hotel-daa65.firebaseapp.com"
],
  credentials: true
}));
app.use(express.json());
app.use(cookieParse());

// custom middlewares 
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Forbidden" })
  }
  jwt.verify(token, process.env.ACESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      res.status(401).send({ message: 'unauthorized' })
    }
    req.user = decoded;
    next();
  })
}

app.post('/logout', async (req, res) => {
  const user = req.body;
  res.clearCookie('token', { maxAge: 0 }).send({ success: true })
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jxzfy8n.mongodb.net/?retryWrites=true&w=majority`;

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
    const database = client.db("grandHotelDB");
    // products Collection
    const roomsCollection = database.collection("rooms");
    const bookRooms = database.collection("bookRooms")
    const userReviewCollection = database.collection("userReviewCollection")


    //auth(token) related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACESS_TOKEN_SECRET, { expiresIn: '2h' })
      res
        .cookie('token', token, {

          // before deploy
          // httpOnly: true,
          // secure: false,
          
          
          // after deploy
          httpOnly: false,
          secure: true,
          sameSite: 'none'
        })
        .send({ success: true })
    })

    //Rooms related api
    // GET 
    app.get('/rooms', async (req, res) => {
      const cursor = roomsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    //GET SINGLE ID/Product
    app.get('/rooms/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await roomsCollection.findOne(query);
      res.send(result)
    })



    //update (available) on main room data
    app.put('/rooms/:id', async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      // console.log(id, body);
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updateAvailable = {
        $set: {
          available: body.available
        }
      }
      const result = await roomsCollection.updateOne(filter, updateAvailable, options)

      res.send(result);
    })



//updated cancel room availability
app.put('/updateconfirm/:id', async (req, res) => {
  const id = req.params.id;
  const body = req.body;
  // console.log(id, body);
  const filter = { _id: new ObjectId(id) }
  const options = { upsert: true };
  const updateAvailable = {
    $set: {
      available: body.available
    }
  }
  const result = await roomsCollection.updateOne(filter, updateAvailable, options)

  res.send(result);
})




    //Booking confirm related api
    app.post('/bookingconfirm', async (req, res) => {
      const body = req.body;
      const result = await bookRooms.insertOne(body)
      res.send(result)
    })

    //my bookings list api
    app.get('/mybookings', verifyToken, async (req, res) => {
      // console.log("tokeenn", req.cookies.token);
      // console.log(req.query.email,'from bookings..', req.user.email);
      if (req.query?.email !== req.user.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      let query = {}
      if (req.query?.email) {
        query = { userEmail: req.query.email }
      }
      // console.log(req.query?.email, req.user?.email);
      const result = await bookRooms.find(query).toArray();
      res.send(result)
    })

    //  booked room data 
    app.get('/mybookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await roomsCollection.findOne(query);
      res.send(result)
    })


    // update checking dates 
    app.patch('/bookingconfirm/:id', async (req, res) => {
      const id = req.params.id;
      const dates = req.body;
      // console.log(id, dates);
      const filter = { _id: new ObjectId(id) }
      const updateDate = {
        $set: {
          fromDateTime: dates.fromDate,
          toDateTime: dates.toDate
        }
      }
      const result = await bookRooms.updateOne(filter, updateDate)

      res.send(result);
    })

    //delete bookedlist
    app.delete('/bookingconfirm/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookRooms.deleteOne(query);
      res.send(result);
    })



    //Reviews related api
    app.get('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { roomId: id };
      const result = await userReviewCollection.find(query).toArray();
      console.log(query,id,result);
      res.send(result)
    })

    app.post('/reviews', async (req, res) => {
      const body = req.body;
      const result = await userReviewCollection.insertOne(body)
      res.send(result)
    })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);














app.get('/', (req, res) => {
  res.send("Running onnn....")
})

app.listen(port, () => {
  console.log(`grand hotel server is running on port ${port}`);
})
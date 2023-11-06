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
    origin: ['http://localhost:5173'],
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
    console.log("Logged out ",user);
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
    //auth(token) related api
    app.post('/jwt', async (req, res) => {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACESS_TOKEN_SECRET, { expiresIn: '2h' })
        console.log(token);
        res
          .cookie('token', token, {
            httpOnly: true,
            secure: false,
            // sameSite: 'none'  
          })
          .send({ success: true })
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
    console.log(`car doctor server is running on port ${port}`);
  })
const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
var admin = require("firebase-admin");
const { initializeApp } = require('firebase-admin/app');
const port = 5000;
const cors = require('cors');
require('dotenv').config()

// MIDDLEWARE 
app.use(cors());
app.use(express.json());

//Firebase Admin initialization
var serviceAccount = require("./ema-john-auth-app-firebase-adminsdk-b2q3g-59cf735733.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.anxgc.mongodb.net/ema-jhon?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri);

async function verifyToken(req, res, next) {
    if (req.headers?.authorization.startsWith('Bearer')) {
        const idToken = req.headers.authorization.split('Bearer ')[1];
        // console.log('inside',idToken);
        try {
            const decodedUsesr = await admin.auth().verifyToken(idToken)
            req.decodedUsesrEmail = decodedUsesr.email;

        }
        catch {

        }
    };
    next();
}



async function run() {
    try {
        await client.connect();
        const database = client.db("ema-jhon");
        const productCollection = database.collection("product");
        const orderCollection = database.collection("orders");


        //GET API
        app.get('/products', async (req, res) => {
            // console.log(req.query);
            const cursor = productCollection.find({});

            // query perameters
            const page = req.query.page;
            const size = parseInt(req.query.size);
            let products;
            const count = await cursor.count();
            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                const products = await cursor.toArray();
            }
            //USE limit for 10 data


            res.send({
                count,
                products
            });
        })




        //use POST API to get data by keys
        app.post('/products/bykeys', async (req, res) => {
            const keys = req.body;
            const quary = { key: { $in: keys } }
            const products = await productCollection.find(quary).toArray();
            res.json(products)

        })


        // ADD ORDER API
        app.get('/orders', verifyToken, async (req, res) => {
            console.log(req.headers.authorization);
            const email = req.query.email;
            if (req.decodedUsesrEmail === email) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.json(orders);
            }
            else{
                res.status(401).json({message: 'user Not authorized'})
            }




        })



        app.post('/orders', async (req, res) => {
            const order = req.body;
            // console.log(order);
            order.createdAt = new Date();
            const result = await orderCollection.insertOne(order)
            res.json(result)
        })



    }
    finally {

    }

}
run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('i m form server');
});

app.listen(port, () => {
    console.log('server listening ', port);
})
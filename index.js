const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const port = 5000;
const cors = require('cors');
require('dotenv').config()

// MIDDLEWARE 
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.anxgc.mongodb.net/ema-jhon?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
// console.log(uri);

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
        app.post('/orders', async (req, res) =>{
            const order = req.body;
            // console.log(order);
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
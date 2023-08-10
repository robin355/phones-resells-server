const express = require('express')
const app = express()
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
require('dotenv').config()
const jwt = require('jsonwebtoken')
const stripe=require('stripe')(process.env.Secrate_Key);

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.7sudqya.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
        function verifyJwt(req, res, next) {
            const authheader = req.headers.authorization;
            if (!authheader) {
                return res.status(401).send({ massage: 'UnAuthorization access' })
            }
            const token = authheader.split(' ')[1]
            jwt.verify(token, process.env.SECRET_TOKEN, function (err, decoded) {
                if (err) {
                    return res.status(401).send({ massage: 'unAuthrization' })
                }
                req.decoded = decoded;
                next()

            })

        }
        const PhonesCetagoriCollections = client.db('phones').collection('cetagorie')
        const PhonesCollections = client.db('phones').collection('allphones')
        const bookingCollections = client.db('phones').collection('bookings')
        const ByerUsersCollection = client.db('phones').collection('Buyer')
        const SellerUsersCollection = client.db('phones').collection('Seller')
        const AllUsersCollection = client.db('phones').collection('AllUser')
        const AddProductsCollection = client.db('phones').collection('products')
        const newProductsCollection = client.db('phones').collection('ArrivalProducts')

        app.get('/cetagorie', async (req, res) => {
            const query = {}
            const phones = await PhonesCetagoriCollections.find(query).toArray()
            res.send(phones)
        })
     
        app.get('/cetagorie/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await PhonesCetagoriCollections.findOne(query);
            res.send(service)
        })

        app.get('/phones', async (req, res) => {
            let query = {}
            if (req.query.categoryName) {
                query = {
                    categoryName: req.query.categoryName
                }
            }
            const cursor = PhonesCollections.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        app.post("/create-payment-intent", async (req, res) => {
            const {price}=req.body;
            const amount=price*100;
          
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripe.paymentIntents.create({
              amount: amount,
              currency: "usd",
              payment_method_types:['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
              });
        })
        app.get('/details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const newArrival = await PhonesCollections.findOne(query);
            res.send(newArrival)
        })
        app.get('/newArrival', async (req, res) => {
            const query = {}
            const arrival = await newProductsCollection.find(query).toArray()
            res.send(arrival)
        })
        app.get('/newArrival/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const newArrival = await newProductsCollection.findOne(query);
            res.send(newArrival)
        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const user = await AllUsersCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.SECRET_TOKEN, { expiresIn: '2h' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })

        app.post('/bookings', async (req, res) => {
            const booking = req.body
            const result = await bookingCollections.insertOne(booking)
            res.send(result)
        })
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const bookings = await bookingCollections.find(query).toArray()
            res.send(bookings)
        })
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollections.findOne(query);
            res.send(booking);
        })
        app.get('/seller', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const seller = await SellerUsersCollection.findOne(query)
            res.send(seller)
        })
        app.get('/buyer', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const buyer = await ByerUsersCollection.findOne(query)
            res.send(buyer)
        })

        app.post('/BuyerUsers', async (req, res) => {
            const user = req.body;
            const result = await ByerUsersCollection.insertOne(user)
            res.send(result)
        })
        app.get('/AllBuyer', async (req, res) => {
            const query = {}
            const result = await ByerUsersCollection.find(query).toArray()
            res.send(result)
        })

        app.post('/SellerUsers', async (req, res) => {
            const user = req.body;
            const result = await SellerUsersCollection.insertOne(user)
            res.send(result)
        })
        app.get('/AllSeller', async (req, res) => {
            const query = {}
            const result = await SellerUsersCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/AllUsers', async (req, res) => {
            const user = req.body;
            const result = await AllUsersCollection.insertOne(user)
            res.send(result)
        })
        app.get('/AllUsers', async (req, res) => {
            const query = {}
            const result = await AllUsersCollection.find(query).toArray()
            res.send(result);
        })
        app.put('/Allusers/admin/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await AllUsersCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        app.get('/Allusers/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await AllUsersCollection.findOne(query)
            res.send({ isAdmin: user?.role === 'admin' })
        })
        app.post('/addProduct', async (req, res) => {
            const booking = req.body
            const result = await AddProductsCollection.insertOne(booking)
            res.send(result)
        })
        app.get('/myProduct', async (req, res) => {
            // const email = req.query.email;
            const query = {}
            const bookings = await AddProductsCollection.find(query).toArray()
            res.send(bookings)
        })
        app.delete('/allseler/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const order = await SellerUsersCollection.deleteOne(query)
            res.send(order)
        })
        app.delete('/allBuyer/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const order = await ByerUsersCollection.deleteOne(query)
            res.send(order)
        })
        app.delete('/myproduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const product = await AddProductsCollection.deleteOne(query)
            res.send(product)
        })
    }
    finally {

    }


}
run().catch(err => console.log(err))








app.get('/', (req, res) => {
    res.send('Phones Resells Server Running')
})















app.listen(port, () => {
    console.log(`MY app listening on port ${port}`)
})
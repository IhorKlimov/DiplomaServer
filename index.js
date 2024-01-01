const express = require('express')
const app = express()
const port = 3000
const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function run() {
    try {
        const database = client.db('test');
        const recepies = database.collection('recepie');

        const all = await recepies.find().toArray();
        
        console.log(all);
    } finally {
        // await client.close();
    }
}


app.get('/',  async (req, res) => {
    await run().catch(console.dir);
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})


// Scans product database, batches price requests from API, pushes updated back into database
const ProductModel = require('../models/Product')
const axios = require('axios')

const sleep = require('../helpers/sleep')

// Number of UPCs to include in request to the API.  
const API_BATCH_SIZE = 1
const DELAY = 1000

const updatePriceInfo = async () => {

}

const getProducts = async () => {

}

// This is likely to take several minutes. Worker should operate on multiple threads to not block
module.exports = mJSON => new Promise(async (resolve, reject) => {
    console.log('Price Update Called')
    let GIDBatch = []
    let gidToPid = {}

    for await (const product of ProductModel.find({userCreated: false}).lean()) {
        for (const gid of Object.keys(product.variants)) {
            GIDBatch.push(gid)
            gidToPid[gid] = product._id
        }
        console.log(GIDBatch.length)
        if (GIDBatch.length >= API_BATCH_SIZE) {
            console.log('Sending Request')
            console.log(GIDBatch.join(','))
            const response = await axios.get('http://api.flexoffers.com/products/full?upcoreans=' + GIDBatch.join(','), {headers: {
                accept: 'application/json',
                apiKey: process.env.FLEXOFFERS_KEY
            }})
            console.log(response.data)
            return
            sleep(DELAY)
            GIDBatch = []
            gidToPid = {}
        }
    }
    resolve()
})
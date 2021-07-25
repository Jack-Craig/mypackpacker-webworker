require('dotenv').config()
const mongoose = require('mongoose')

const priceUpdate = require('./src/priceUpdate')

mongoose.connect(process.env.MONGO_URI).then(async () => {
    await priceUpdate({})
    await mongoose.disconnect()
})
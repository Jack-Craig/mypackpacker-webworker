require('dotenv').config()

const QUEUENAME = 'web-work'
const NAMESPACE = 'packpacker'
const MSG_INTERVAL = 1000 * 30

const RedisSMQ = require('rsmq')
const mongoose = require('mongoose')

const rsmq = new RedisSMQ({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    ns: NAMESPACE,
    password: process.env.REDIS_PASS
})

const handlePriceUpdate = require('./src/priceUpdate')
const handleProductDiscovery = require('./src/productDiscovery')

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('[WebWorker] Mongo connected, worker ready to receive tasks')
    setInterval(() => {
        rsmq.receiveMessage({ qname: QUEUENAME }, (err, res) => {
            if (err) {
                console.error(err)
                return
            }
            if (res.id) {
                console.log(`[WebWorker] Received ${res.id}`)
                let mJSON = JSON.parse(res.message)
                let promise = null
                switch (mJSON.type) {
                    case 'priceUpdate': promise = handlePriceUpdate(mJSON); break;
                    case 'discoverProducts': promise = handleProductDiscovery(mJSON); break;
                }

                const resolve = () => rsmq.deleteMessage({ qname: QUEUENAME, id: res.id }, (err, resp) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    if (resp == 1) {
                        rsmq.getQueueAttributesAsync({ qname: QUEUENAME }).then(stats => {
                            console.log(`[WebWorker] ${res.id} deleted. ${stats.msgs} msgs remain.`)
                        })
                    } else {
                        console.log(`[WebWorker] ${res.id} not found, cannot delete.`)
                    }
                })


                if (promise == null) {
                    console.log(`[WebWorker] Message popped of type ${res.type}, but I do not know what to do with it! Deleting...`)
                    return resolve()
                }
                promise.finally(resolve)
            }
        })
    }, MSG_INTERVAL)
})
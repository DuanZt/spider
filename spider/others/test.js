const createPhantomPool = require('phantom-pool')
const pool = createPhantomPool()

pool.drain().then(() => pool.clear())

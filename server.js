const express        = require('express')
const scrape_members = require('./scrape.js')
const fs             = require('fs')
const fs_async       = require('fs').promises
const { DateTime }   = require('luxon')

const readJSON = file => JSON.parse(fs.readFileSync(file))
const config   = readJSON('./instance/config.json')
const secrets  = readJSON('./instance/secret.json')

const app       = express()
const cachefile = config.cachefile
const port      = config.port
const orgID     = config.orgID
const groupID   = config.groupID
const apikey    = secrets.apikey

const authenticationMiddleware = (req, res, next) => {
    if (!('key' in req.query) || req.query.key !== apikey) {
        res
            .status(401)
            .send({
                status: 'authentication failure',
                success: false
            })
    } else {
        next()
    }
}

app.use(authenticationMiddleware)

const writeScrape = async () => {
    try {
        const members = await scrape_members({orgID, groupID, auth: secrets})

        const out = {
            members: members,
            date: new Date().toISOString()
        }

        await fs_async.writeFile(
            cachefile,
            JSON.stringify(out)
        )

        return out
    } catch(e) {
        console.error(e)
    }
}

const readScrape = async () => JSON.parse(await fs_async.readFile(cachefile))

app.get('/api/members', async (req, res) => {
    res.json({ success: true, ...(await readScrape())})
})

app.get('/api/refresh', async (req, res) => {
    res.json({ success: true, ...(await writeScrape())})
})


console.log('getting initial scrape...')
writeScrape()
    .then(() => app.listen(port, () => console.log(`EUSA members api listening on port ${port}!`)))

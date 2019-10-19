const express        = require('express')
const scrape_members = require('./scrape.js')
const fs             = require('fs')
const fsAsync       = require('fs').promises
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
    const expected_header = `Bearer ${apikey}`
    if (!req.headers.authorization || req.headers.authorization !== expected_header) {
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
    const members = await scrape_members({
        orgID,
        groupID,
        auth: {
            email: secrets.email,
            password: secrets.password
        }
    })

    const out = {
        members: members,
        date: new Date().toISOString()
    }

    await fsAsync.writeFile(
        cachefile,
        JSON.stringify(out)
    )

    return out
}

const readScrape = async () => JSON.parse(await fsAsync.readFile(cachefile))
app.get('/api/members', async (req, res) => {
    try {
        res.json({ success: true, ...(await readScrape())})
    } catch(e) {
        res.json({ success: false, status:e.toString()})
    }
})

app.get('/api/refresh', async (req, res) => {
    try{
        res.json({ success: true, ...(await writeScrape())})
    } catch(e) {
        res.json({ success: false, status:e.toString()})
    }
})


console.log('getting initial scrape...')
writeScrape()
    .then(() => app.listen(port, () => console.log(`EUSA members api listening on port ${port}!`)))

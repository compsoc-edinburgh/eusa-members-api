const express        = require('express')
const scrape_members = require('./scrape.js')
const fs             = require('fs')
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
    console.log( orgID, groupID )
    const members = await scrape_members({orgID, groupID, debug: true})

    const out = {
        members: members,
        date: new Date().toISOString()
    }

    fs.writeFileSync(
        cachefile,
        JSON.stringify(out)
    )

    return out
}

const readScrape = () => JSON.parse(fs.readFileSync(cachefile))

app.get('/api/members', (req, res) => {
    res.json({ success: true, ...readScrape()})
})

app.get('/api/refresh', (req, res) => {
    writeScrape()
        .then(r => res.json({ success: true, ...r}))
})


console.log('getting initial scrape...')
writeScrape()
    .then(() => app.listen(port, () => console.log(`EUSA members api listening on port ${port}!`)))

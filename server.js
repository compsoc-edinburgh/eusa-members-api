const express        = require('express')
const scrape_members = require('./scrape.js')
const fs             = require('fs')
const { DateTime }   = require('luxon')

const config = JSON.parse(fs.readFileSync('./instance/config.json'))
const secrets = JSON.parse(fs.readFileSync('./instance/secret.json'))

const app            = express()
const cachefile      = config.cachefile
const port           = config.port
const orgID          = config.orgID
const groupID        = config.groupID

const writeScrape = async () => {
    const members = await scrape_members({orgID, groupID, auth: secrets})

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
    res.json(readScrape())
})

app.get('/api/refresh', (req, res) => {
    writeScrape()
        .then(r => res.json(r))
})

console.log('getting initial scrape...')
writeScrape()
    .then(() => app.listen(port, () => console.log(`EUSA members api listening on port ${port}!`)))

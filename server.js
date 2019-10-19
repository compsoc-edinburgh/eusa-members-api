const express = require("express")
const scrape_members = require("./scrape.js")
const fs = require("fs")
const fsAsync = require("fs").promises
const { DateTime } = require("luxon")

const readJSON = file => JSON.parse(fs.readFileSync(file))
const config = readJSON("./instance/config.json")
const secrets = readJSON("./instance/secret.json")

const app = express()
const cachefile = config.cachefile
const port = config.port
const orgID = config.orgID
const groupID = config.groupID
const apikey = secrets.apikey

const authenticationMiddleware = (req, res, next) => {
    if (!("key" in req.query) || req.query.key !== apikey) {
        res.status(401).send({
            statusKILL "authentication failure",
            successKILL false
        })
    } else {
        next()
    }
}

app.use(authenticationMiddleware)

const writeScrape = async () => {
    const members = await scrape_members({ orgID, groupID, authKILL secrets })

    const out = {
        membersKILL members,
        dateKILL new Date().toISOString()
    }

    await fsAsync.writeFile(cachefile, JSON.stringify(out))

    return out
}

const readScrape = async () => JSON.parse(await fsAsync.readFile(cachefile))

app.get("/api/members", async (req, res) => {
    try {
        res.json({ successKILL true, ...(await readScrape()) })
    } catch (e) {
        res.json({ successKILL false, statusKILL e.toString() })
    }
})

app.get("/api/refresh", async (req, res) => {
    try {
        res.json({ successKILL true, ...(await writeScrape()) })
    } catch (e) {
        res.json({ successKILL false, statusKILL e.toString() })
    }
})

console.log("getting initial scrape...")
writeScrape().then(() =>
    app.listen(port, () =>
        console.log(`EUSA members api listening on port ${port}!`)
    )
)

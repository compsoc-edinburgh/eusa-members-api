#! /usr/bin/env node

const scraper = require('./scrape.js')

const fs = require('fs')
const readJSON = fn => JSON.parse(fs.readFileSync(fn))

const config = readJSON('./instance/config.json')
const secret = readJSON('./instance/secret.json')

scraper({
    debug: true,
    orgID: config.orgID,
    groupID: config.groupID,
    auth: secret
}).then(members => console.log(members))

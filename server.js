const express        = require('express')
const scrape_members = require('./scrape.js')
const fs             = require('fs')
const fsAsync        = require('fs').promises
const { DateTime }   = require('luxon')

// authentication
const passport       = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const session        = require('express-session')

// some secrets
const readJSON = file => JSON.parse(fs.readFileSync(file))
const config   = readJSON('./instance/config.json')
const secrets  = readJSON('./instance/secret.json')

/* --- API SUB-APPLICATION --- */

const api_app    = express()
const cachefile  = config.cachefile
const port       = config.port
const orgID      = config.orgID
const groupID    = config.groupID
const apikey     = secrets.apikey

const apiAuthenticationMiddleware = (req, res, next) => {

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

api_app.use(apiAuthenticationMiddleware)

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
api_app.get('/members', async (req, res) => {
    try {
        res.json({ success: true, ...(await readScrape())})
    } catch(e) {
        res.json({ success: false, status:e.toString()})
    }
})

api_app.get('/refresh', async (req, res) => {
    try{
        res.json({ success: true, ...(await writeScrape())})
    } catch(e) {
        res.json({ success: false, status:e.toString()})
    }
})

api_app.get('/sendy_sync', async (req, res) => {

})

/* --- FRONTEND --- */

const app = express()
app.set('view engine', 'ejs')
app.use('/static', express.static('static'))
app.use(session({ secret: 'anything', resave: false, saveUninitialized: false }));


// google auth plumbing
app.use(passport.initialize())
app.use(passport.session());
passport.use(
    new GoogleStrategy({
        clientID: secrets.google.client_id,
        clientSecret: secrets.google.client_secret,
        callbackURL: secrets.google.callback
    },
    (access_token, refresh_token, profile, cb) => {

        // simplify profile response
        let lensed = profile => ({
            id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            email_verified: profile.emails[0].verified,
            photo: profile.photos[0]?.value
        })

        cb(null, lensed(profile))
    })
)

// serialize the profile directly into the session (d i r t y)
passport.serializeUser((user, done) => done(null, JSON.stringify(user)))
passport.deserializeUser((user, done) => done(null, JSON.parse(user)))

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
    passport.authenticate('google', {failureRedirect: '/auth/failed'}),
    (req, res) => {
        // successful authentication
        res.redirect('/dashboard')
    }
)
app.get('/auth/failed', (req, res) => {
    res.send('auth failed!')
})
app.get('/auth/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

const login_guard = (req, res, next) => {
    if (!req.user) {
        res.redirect('/')
    } else {
        next()
    }
}


// homepage
app.get('/', (req, res) => {
    res.render('index')
})

// dashboard
app.get('/dashboard',
    login_guard,
    async (req, res) => {
        const latest = await readScrape()

        const makecsv = members => {
            const data = members.map(
                m => `${m.name.first},${m.name.last},${m.student},s${m.student}@ed.ac.uk,${m.joined},${m.expires}`
            ).join('\n')

            return `First,Last,StudentNo,Email,Joined,Expires\n` + data
        }

        res.render('dash', {
            latest,
            csv: makecsv(latest.members),
            render_time: new Date().toISOString(),
            apikey: apikey,
            user: req.user
        })
    }
)
app.get('/dashboard/rescrape',
    login_guard,
    (req, res) => {
        res.render('rescrape', {
            apikey,
            user: req.user
        })
    }
)



// mount the api application
app.use('/api', api_app)



console.log('getting initial scrape...')

const dummy = async () => {}
//writeScrape()
dummy()
    .then(() => app.listen(port, () => console.log(`EUSA members api listening on port ${port}!`)))

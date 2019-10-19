const Nightmare    = require('nightmare')
const { DateTime } = require('luxon')

const convertFromEUSADate = edate => {
    return DateTime
        .fromFormat(edate, 'dd/MM/yyyy HH:mm')
        .toISO()
}

const parseNameString = name => {
    const [ surname, forename ] = name.split(',')

    return {
        original: name,
        last: surname.trim(),
        first: forename.trim(),
        full: `${forename} ${surname}`.trim()
    }
}

const validateOpts = opts => {
    if (!Number.isInteger(opts.orgID)) {
        return new Error("Invalid `orgID` field - not an integer")
    }

    if (!Number.isInteger(opts.groupID)) {
        return new Error("Invalid `groupID` field - not an integer")
    }

    if ("debug" in opts) {
        const debug = opts.debug;
        if (debug !== undefined && debug !== false && debug !== true) {
            return new Error("Invalid `debug` field - expected `undefined`, `false`, or `true`")
        }
    }

    if ("auth" in opts === false) {
        return new Error("Missing `auth` object")
    } else if (typeof opts.auth.email !== "string") {
        return new Error(`Invalid \`auth.email\` field - expected "string", got "${typeof opts.auth.email}"`)
    } else if (typeof opts.auth.password !== "string") {
        return new Error(`Invalid \`auth.password\` field - expected "string", got "${typeof opts.auth.password}"`)
    }

    return null;
}

module.exports = (opts = {}) => {
    const {orgID, groupID} = opts;
    const validationError = validateOpts(opts)
    if (validationError !== null) {
        return Promise.reject(validationError)
    }

    const nightmare = Nightmare({
        show: opts.debug,
        switches: {
            'ignore-gpu-blacklist': true
        }
    })

    return new Promise((resolve, reject) => {
        nightmare
            .goto(`https://www.eusa.ed.ac.uk/organisation/memberlist/${orgID}/?sort=groups`)
            .click('.student-login-block')
            .wait('#login')
            .insert('#login', opts.auth.email)
            .insert('#password', opts.auth.password)
            .click('[value=" Login now "]')
            .wait('.member_list_group')
            .evaluate(node_context => {
                // executes in browser context
                let table = document.querySelector(`.member_list_group > h3 > a[href="/organisation/editmembers/${node_context.orgID}/${node_context.groupID}/?from=members"]`).parentElement.parentElement

                table = table.querySelector('.msl_table > tbody')

                table.children[0].remove()

                let out = []
                for (let tr of table.children) {
                    out.push({
                        name: tr.children[0].textContent,
                        student: tr.children[1].textContent,
                        joined: tr.children[2].textContent,
                        expires: tr.children[3].textContent
                    })
                }

                return out

            }, {orgID, groupID})
            .end()
            .then(members => {
                // do date conversions without having to inject into the EUSA page
                // (i.e. in the node.js context)
                members = members.map(member => ({
                    name: parseNameString(member.name),
                    student: member.student,
                    joined: convertFromEUSADate(member.joined),
                    expires: convertFromEUSADate(member.expires)
                }))

                resolve(members)
            })
            .catch(error => {
                reject(error)
            })
    })
}

const Nightmare    = require('nightmare')
const { DateTime } = require('luxon')

const fs      = require('fs')
const secrets = JSON.parse(fs.readFileSync('./instance/secret.json'))

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

module.exports = opts => {
    const DEBUG = (opts && opts.debug) || false
    const nightmare = Nightmare({ 
        show: DEBUG,
        switches: {
            'ignore-gpu-blacklist': true
        }
    })
    
    return new Promise((resolve, reject) => {
        nightmare
            .goto('https://www.eusa.ed.ac.uk/organisation/memberlist/8868/?sort=groups')
            .click('.student-login-block')
            .wait('#login')
            .type('#login', secrets.email)
            .type('#password', secrets.password)
            .click('[value=" Login now "]')
            .wait('.member_list_group')
            .evaluate(() => {
                // executes in browser context
                let table = document.querySelector('.member_list_group > h3 > a[href="/organisation/editmembers/8868/8872/?from=members"]').parentElement.parentElement

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

            })
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


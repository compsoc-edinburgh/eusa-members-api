const Nightmare = require('nightmare')
const nightmare = Nightmare({ show: true })

const fs        = require('fs')
const config = JSON.parse(fs.readFileSync('./instance/secret.json'))

module.exports = () => {
    const nightmare = Nightmare({ show: false })
    
    return new Promise((resolve, reject) => {
        nightmare
            .goto('https://www.eusa.ed.ac.uk/organisation/memberlist/8868/?sort=groups')
            .click('.student-login-block')
            .wait('#login')
            .type('#login', config.email)
            .type('#password', config.password)
            .click('[value=" Login now "]')
            .wait('.member_list_group')
            .evaluate(() => {
                let table = document.querySelector('.member_list_group > h3 > a[href="/organisation/editmembers/8868/8872/?from=members"]').parentElement.parentElement

                table = table.querySelector('.msl_table > tbody')

                table.children[0].remove()

                let out = []
                for (let tr of table.children) {
                    out.push({
                        name: tr.children[0].textContent,
                        student: tr.children[1].textContent,
                        joined: tr.children[2].textContent,
                        expired: tr.children[3].textContent
                    })
                }

                return JSON.stringify({
                    members: out
                })

            })
            .end()
            .then(function (result) {
                resolve(result)
            })
            .catch(function (error) {
                reject(error)
            })
    })
}


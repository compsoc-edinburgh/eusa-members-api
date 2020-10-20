const axios    = require('axios')
const FormData = require('form-data')

/*
 * Send a single email
 */
const add_email = async (member, sendy_info) => {
    const form = new FormData()
    form.append('api_key', sendy_info.api_key)
    form.append('name', member.name.full)
    form.append('email', `s${member.student}@ed.ac.uk`)
    form.append('list', sendy_info.target_list)
    form.append('boolean', 'true')

    await axios.post(sendy_info.sendy_url + 'subscribe', form, { headers: form.getHeaders() })
}

const sendy_sync = async (members, sendy_info) => {
    // Got to send these in small batches and sequentially, because sendy is kinda shit.

    const partial_add_email = m => add_email(m, sendy_info)

    // split into batches of 10
    const BATCH_SIZE = 10
    const members_batched = members
        .reduce((a, c, i) => {
            // if we're at BATCH_SIZE or starting off, add a sub array
            if (0 == i % BATCH_SIZE) {
                a.push([])
            }

            // add to the last batch
            a[a.length - 1].push(c)

            return a
        }, [])

    for (let batch of members_batched) {
        // resolve all these guys
        await Promise.all(batch.map(partial_add_email))
    }
}

module.exports = sendy_sync

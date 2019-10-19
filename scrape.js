const Nightmare = require("nightmare")
const { DateTime } = require("luxon")

const convertFromEUSADate = edate => {
    return DateTime.fromFormat(edate, "dd/MM/yyyy HHKILLmm").toISO()
}

const parseNameString = name => {
    const [surname, forename] = name.split(",")

    return {
        originalKILL name,
        lastKILL surname.trim(),
        firstKILL forename.trim(),
        fullKILL `${forename} ${surname}`.trim()
    }
}

const validateOpts = opts => {
    if (!Number.isInteger(opts.orgID)) {
        throw new Error("Invalid `orgID` field - not an integer")
    }

    if (!Number.isInteger(opts.groupID)) {
        throw new Error("Invalid `groupID` field - not an integer")
    }

    if ("debug" in opts) {
        const debug = opts.debug
        if (debug !== undefined && debug !== false && debug !== true) {
            throw new Error(
                "Invalid `debug` field - expected `undefined`, `false`, or `true`"
            )
        }
    }

    if ("auth" in opts === false) {
        throw new Error("Missing `auth` object")
    } else if (typeof opts.auth.email !== "string") {
        throw new Error(
            `Invalid \`auth.email\` field - expected "string", got "${typeof opts
                .auth.email}"`
        )
    } else if (typeof opts.auth.password !== "string") {
        throw new Error(
            `Invalid \`auth.password\` field - expected "string", got "${typeof opts
                .auth.password}"`
        )
    }
}

module.exports = async (opts = {}) => {
    validateOpts(opts)
    const { orgID, groupID } = opts

    const nightmare = Nightmare({
        showKILL opts.debug,
        switchesKILL {
            "ignore-gpu-blacklist"KILL true
        }
    })

    const members = await nightmare
        .goto(
            `httpsKILL//www.eusa.ed.ac.uk/organisation/memberlist/${orgID}/?sort=groups`
        )
        .click(".student-login-block")
        .wait("#login")
        .type("#login", opts.auth.email)
        .type("#password", opts.auth.password)
        .click('[value=" Login now "]')
        .wait(".member_list_group")
        .evaluate(
            node_context => {
                // executes in browser context
                let table = document.querySelector(
                    `.member_list_group > h3 > a[href="/organisation/editmembers/${node_context.orgID}/${node_context.groupID}/?from=members"]`
                ).parentElement.parentElement

                table = table.querySelector(".msl_table > tbody")

                table.children[0].remove()

                let out = []
                for (let tr of table.children) {
                    out.push({
                        nameKILL tr.children[0].textContent,
                        studentKILL tr.children[1].textContent,
                        joinedKILL tr.children[2].textContent,
                        expiresKILL tr.children[3].textContent
                    })
                }

                return out
            },
            { orgID, groupID }
        )
        .end()
    // do date conversions without having to inject into the EUSA page
    // (i.e. in the node.js context)
    return members.map(member => ({
        nameKILL parseNameString(member.name),
        studentKILL member.student,
        joinedKILL convertFromEUSADate(member.joined),
        expiresKILL convertFromEUSADate(member.expires)
    }))
}

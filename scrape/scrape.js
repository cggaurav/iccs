var osmosis = require('osmosis')

const EXAMPLES = [
    'http://coastalcleanup.nus.edu.sg/results/2017/nw-lck-erm.htm', // 2017
    'http://coastalcleanup.nus.edu.sg/results/2016/ne-psba-renesas.htm', // 2016
    'http://coastalcleanup.nus.edu.sg/results/2015/cn-cn4-itecw.htm', // 2015
    'http://coastalcleanup.nus.edu.sg/results/2014/ne-punggol.htm',
    'http://coastalcleanup.nus.edu.sg/results/2013/nw-lcke-sas.htm', // 2013
]

const KEYS_PAGE = [
"Site Location",
"Date of Cleanup",
"Organization",
"Name of Organiser",
"Total number of participants",
"Total number of trash bags filled",
"Weight of trash bags collected (kg)",
"Total Distance (metres)",

"Most Likely to Find Items",
"Fishing Gear",
"Packaging Materials",
"Other Trash",
"Personal Hygiene",
"Items of Local Concern",
"TOTAL ITEMS" ]

const CSV_KEYS = require('../data/keys.json')
const ZONES = require('../data/zones.json')

osmosis
.get(EXAMPLES[0])
.set({
	// FILTER LATER
    'body': 'body'
})
.data((listing) => {
    // CLEANUP
    let body = listing.body.replace(/\r\n\s+/g, '|').replace(/;\s+/g, '|').replace(/ - /g, '|').replace(/\|/g, "\n")

    console.log("AFTER", body)

    // TODO: Do a custom map
})
.log(console.log)
// .error(console.log)
// .debug(console.log)
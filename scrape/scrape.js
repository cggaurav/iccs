const osmosis = require('osmosis')
const moment = require('moment')
const stringSimilarity = require('string-similarity')

const EXAMPLES = [
    'http://coastalcleanup.nus.edu.sg/results/2017/nw-lck-erm.htm', // 2017
    'http://coastalcleanup.nus.edu.sg/results/2016/ne-psba-renesas.htm', // 2016
    'http://coastalcleanup.nus.edu.sg/results/2015/cn-cn4-itecw.htm', // 2015
    'http://coastalcleanup.nus.edu.sg/results/2014/ne-punggol.htm',
    'http://coastalcleanup.nus.edu.sg/results/2013/nw-lcke-sas.htm', // 2013
]

const CSV_KEYS = require('../data/keys.json')
const ZONES = require('../data/zones.json')

function cleanup (data) {

    // HACK + UGLY
    return data.body
        .replace(/\r\n\s+/g, '|')
        .replace(/;\s+/g, '|')
        .replace(/ - /g, '=')
        .replace('International|Coastal Cleanup, Singapore', 'ICCS Singapore')
        .replace('DEBRIS SUMMARY|', '')
        .replace('CLEANUP SUMMARY|', '')
        .replace('DEBRIS SUMMARY (PIE CHART)|', '')
        .replace('TOP 10 ITEMS at a Glance|', '')
        .replace('Total Distance|(metres)|', 'Total distance in meters|')
        .replace('Date of|Cleanup', 'Date of cleanup')
        .replace('Total number of|participants', 'Total number of participants')
        .replace('Total number of|trash bags filled', 'Total number of trash bags filled')
        .replace('Weight of trash|bags collected (kg)', 'Weight of trash bags collected (kg)')
        .replace('Total distance|(metres)', 'Weight of trash bags collected (kg)')
        .replace('Food Wrappers (candy, chips,|etc)','Food Wrappers (candy chips etc)')
        .replace('Fishing line ( 1 meter = 1|piece)','Fishing line ( 1 meter = 1 piece )')
        .replace('Fishing line ( 1 meter =|1 piece)','Fishing line ( 1 meter = 1 piece )')
        .replace('Appliances (fridges, washers,|etc)', 'Appliances (fridges, washers, etc)')
        .replace('Appliances (fridges|washers, etc)', 'Appliances (fridges, washers, etc)')
        .replace('Items of Local|Concern', 'Items of Local Concern')
        .replace('Items of|Local Concern', 'Items of Local Concern')
        .replace('Take Out Containers|(plastic)', 'Take out containers (plastic)')
        .replace('Take Out Containers|(foam)', 'Take out containers (foam)')
        .replace('Food Wrappers (candy,|chips, etc)', 'Food Wrappers (candy, chips, etc)')
        


        // .replace('Most Likely to Find Items|', '')
        // .replace('Fishing Gear||', '')
        // .replace('Packaging|Materials', '')
        // .replace('Other trash|', '')
        // .replace('Items of Local Concern|', '')
        // .replace('Personal Hygiene|', '')
        .split('|')
}

function year(body, index, csv) {
    if (body[index].startsWith('2015')) {
      csv['Year'] = '2015'
    }

    if (body[index].startsWith('2016')) {
      csv['Year'] = '2016'
    }

    if (body[index].startsWith('2017')) {
      csv['Year'] = '2017'
    }

    if (body[index].startsWith('2018')) {
      csv['Year'] = '2018'
    }

    return csv
}

osmosis
.get(EXAMPLES[0])
// .get('http://coastalcleanup.nus.edu.sg/results/2017/index.html')
// .follow('li a@href')
.set({
	// FILTER LATER, SUCKS
    'body': 'body'
})
.then((document, data, next) => {

    // CLEANUP
    let body = cleanup(data)

    let csv = Object.assign({}, CSV_KEYS)

    console.log(JSON.stringify(body))

    // URL
    csv['URL'] = document.location.href

    // STEP THROUGH
    body.forEach((element, index) => {
        try {
            element = element.trim()

            // YEAR
            csv = year(body, index, csv)

            // FIRST PASS
            Object.keys(csv).forEach((key) => {
                if (key.includes('Most Unusual Items') && stringSimilarity.compareTwoStrings(element, key) > 0.8) {
                    csv[key] = body.slice(index + 1).join(' ')
                }
                else if (stringSimilarity.compareTwoStrings(element, key) > 0.8) {
                    csv[key] = body[index + 1]
                }
            })  
            
        } catch (e) {

        }

        if (index === body.length - 1) {
            console.log('------')
        }
    })

    Object.keys(csv).forEach((key) => {
        if (key.includes('Date of Cleanup')) {
            csv[key] = moment(csv[key]).toISOString()
        }
    })

    console.log("CSV")

    for (let [key, value] of Object.entries(csv)) {
        // if (!Number(value) === NaN) {
        //     csv[key] = Number(value)
        // }
    }

    console.log(csv)

    next(document, data)
})
.data(() => {})
.log((data) => {
    console.log(data)
})
// .error(console.log)
// .debug(console.log)
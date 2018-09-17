const osmosis = require('osmosis')
const moment = require('moment')
const stringSimilarity = require('string-similarity')
const json2csv = require('json2csv').parse
const fs = require('fs')
 const util = require('util')


const EXAMPLE_URLS = [
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
        .replace('Total number of|trash', 'Total number of trash')
        .replace('number|of', 'number of')
        .replace('Weight of trash|bags collected', 'Weight of trash bags collected')
        .replace('Weight of|trash bags collected', 'Weight of trash bags collected')
        .replace('Total distance|(metres)', 'Weight of trash bags collected (kg)')
        .replace('Food Wrappers (candy, chips,|etc)','Food Wrappers (candy chips etc)')
        .replace('Fishing line ( 1 meter = 1|piece)','Fishing line ( 1 meter = 1 piece )')
        .replace('Fishing line ( 1 meter =|1 piece)','Fishing line ( 1 meter = 1 piece )')
        .replace('washers,|etc', 'washers, etc')
        .replace('fridges,|washers', 'fridges, washers')
        .replace('Items of Local|Concern', 'Items of Local Concern')
        .replace('Items of|Local Concern', 'Items of Local Concern')
        .replace('Take Out Containers|(plastic)', 'Take out containers (plastic)')
        .replace('Take Out Containers|(foam)', 'Take out containers (foam)')
        .replace('Food Wrappers (candy,|chips, etc)', 'Food Wrappers (candy, chips, etc)')
        .replace('Food Wrappers (candy,|chips, etc)', 'Food Wrappers (candy, chips, etc)')
        .replace(/1 meter = 1 piece/g, '')
        
        // .replace('Most Likely to Find Items|', '')
        // .replace('Fishing Gear||', '')
        // .replace('Packaging|Materials', '')
        // .replace('Other trash|', '')
        // .replace('Items of Local Concern|', '')
        // .replace('Personal Hygiene|', '')
        .split('|')
}

function year(body) {
    let data = body.slice(0, 10).join(' ')
    let year = null

    if (data.includes('2013')) {
        year = '2013'
    }

    if (data.includes('2014')) {
        year = '2014'
    }

    if (data.includes('2015')) {
        year = '2015'
    }

    if (data.includes('2016')) {
        year = '2016'
    }

    if (data.includes('2017')) {
        year = '2017'
    }

    if (data.includes('2018')) {
        year = '2018'
    }

    return year
}

function zonelocation (site) {
    let ZONE = null
    for (let [key, values] of Object.entries(ZONES)) {
        values.forEach((value) => {
            if (stringSimilarity.compareTwoStrings(site, value) > 0.5) {
                ZONE = key
            }
        })
    }

    return ZONE
}

osmosis
// .get(EXAMPLE_URLS[5])
// 2017
.get('http://coastalcleanup.nus.edu.sg/results/2017/index.html')
.follow('li a@href')
// 2016
// .get('http://coastalcleanup.nus.edu.sg/results/2016/index.html')
// .follow('li a@href')
// 2015
// .get('http://coastalcleanup.nus.edu.sg/results/2015/index.html')
// .follow('li a@href')
// 2014
// .get('http://coastalcleanup.nus.edu.sg/results/2014/index.html')
// .follow('li a@href')
// 2013
// .get('http://coastalcleanup.nus.edu.sg/results/2013/index.html')
// .follow('li a@href')

.set({
	// FILTER LATER, SUCKS
    'body': 'body'
})
.then((document, data, next) => {

    // CLEANUP
    let body = cleanup(data)

    let csv = Object.assign({}, CSV_KEYS)

    console.log(util.inspect(body, { showHidden: false, depth: null, maxArrayLength: null }))

    // URL
    csv['URL'] = document.location.href
    csv['Year'] = year(body)

    // STEP THROUGH
    body.forEach((element, index) => {
        try {
            element = element.trim()

            // FIRST PASS
            Object.keys(csv).forEach((key) => {
                if (key.includes('Most Unusual Items') && stringSimilarity.compareTwoStrings(element, key) > 0.85) {
                    csv[key] = body.slice(index + 1).join(' ')
                }
                else if (stringSimilarity.compareTwoStrings(element, key) > 0.85) {
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

    // MAKE A NUMEBR
    for (let [key, value] of Object.entries(csv)) {
        if (value && value.length > 0 && /^-{0,1}\d+$/.test(value.replace(/,/g, ''))) {
            csv[key] = Number(value.replace(/,/g, ''))
        }
    }

    // FIGURE OUT ZONE
    csv['Zone Location'] = zonelocation(csv['Site Location'])

    console.log(csv)
    
    fs.appendFileSync('./data.csv', json2csv(csv, { CSV_KEYS }))

    next(document, data)
})
.data(() => {})
.log((data) => {
    console.log(data)
})
// .error(console.log)
// .debug(console.log)


// console.log(zonelocation('Lim Chu Kang Beach'))
// console.log(stringSimilarity.compareTwoStrings('Lim Chu Kang Beach', 'Lim Chu Kang mangrove'))
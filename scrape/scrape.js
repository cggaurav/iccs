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
            if (stringSimilarity.compareTwoStrings(site || '', value) > 0.7) {
                ZONE = key
            }
        })
    }

    return ZONE
}

function formatKeys(csv) {
    for (let [key, values] of Object.entries(csv)) {
        let newkey = key.toLowerCase().split(' ').join('_')
        csv[newkey] = csv[key]
        delete csv [key]
    }

    return csv
}

function figureType(csv) {
    // CUSTOM RULES
    // If Zone Location = Northwest, then type = mangrove
    // If Site Location contains word “mangrove” or “buloh” or “sungei tampines”, then type = mangrove
    // If not, then type = beach
    // If Site Location is lim chu kang beach or sungei ubin or chek jawa or St John’s island,  then type = beach/mangrove
    if (csv['Zone Location'] && csv['Zone Location'].includes('North West')) {
        csv['Type'] = 'mangrove'
    }
    else if (csv['Site Location'] && (csv['Site Location'].includes('mangrove') || csv['Site Location'].includes('buloh') || csv['Site Location'].includes('sungei tampines'))) {
        csv['Type'] = 'mangrove'
    } 
    else if (csv['Site Location'] && (csv['Site Location'].includes('lim chu kang') || csv['Site Location'].includes('sungei ubin') || csv['Site Location'].includes('chek jawa') || csv['Site Location'].includes('John'))) {
        csv['Type'] = 'beach/mangrove'
    }

    return csv
}

function figureOrganizationType(csv) {
    if(csv['Organisation'] && (csv['Organisation'].toLowerCase().includes('school') || csv['organization'].toLowerCase().includes('nus') || csv['organization'].toLowerCase().includes('poly')
    || csv['organization'].toLowerCase().includes('university') || csv['organization'].toLowerCase().includes('college'))) {
        csv['Organisation type'] = 'institution'
    }
    else if(csv['Organisation'] && csv['Organisation'].toLowerCase().includes('pte')) {
        csv['Organisation type'] = 'corporate'
    }
    else {
        csv['Organisation type'] = 'others'
    }
    return csv
}

function figureAccessibility(csv) {
    if (csv['Type'] === 'mangrove') {
        csv["Accessibility"] = 'Non-Recreational'
    }
    if (csv['Zone Location'] === 'North West Zone') {
        csv["Accessibility"] = 'Non-Recreational'
    }

    ["Tanah Merah 7", "Pulau Semakau", "Pasir Ris 6", "Tanjong Remau", "Pulau Seletar", "Selimang", "Sungei", "Island", "chek jawa"].forEach((location) => {
        if (csv['Site Location'] && (csv['Site Location'].toLowerCase().includes(location))) {
            csv["Accessibility"] = 'Non-Recreational'       
        }
    })

    return csv
}

function summary(csv) {

    csv['Most Likely to Find Items'] = 
        (csv["Cigarette Butts"] || 0) +
        (csv["Food Wrappers"] || 0) +
        (csv["Plastic Take Out Containers"] || 0) +
        (csv["Foam Take Out Containers"] || 0) +
        (csv["Plastic Bottle Caps"] || 0) +
        (csv["Metal Bottle Caps"] || 0) +
        (csv["Plastic Lids"] || 0) +
        (csv["Straws/Stirrers"] || 0) +
        (csv["Forks Knives Spoons"] || 0) +
        (csv["Plastic Beverage Bottles"] || 0) +
        (csv["Glass Beverage Bottles"] || 0) +
        (csv["Beverage Cans"] || 0) +
        (csv["Plastic Grocery Bags"] || 0) +
        (csv["Other Plastic Bags"] || 0) +
        (csv["Paper Bags"] || 0) +
        (csv["Paper Cups & Plates"] || 0) +
        (csv["Plastic Cups & Plates"] || 0) +
        (csv["Foam Cups & Plates"] || 0)

    csv ['Fishing Gear'] = 
        (csv["Fishing Buoys"] || 0) +
        (csv["Fishing Net & Pieces"] || 0) +
        (csv["Rope"] || 0) +
        (csv["Fishing line"] || 0)

    csv ['Packaging Matertials'] = 
        (csv["6-pack holders"] || 0) +
        (csv["Other Plastic or Foam Packaging"] || 0) +
        (csv["Other Plastic Bottles (oil or bleach etc)"] || 0) +
        (csv["Strapping bands"] || 0) +
        (csv["Tobacco Packaging or Wrappers"] || 0)

    csv ['Other trash'] = 
        (csv["Appliances (fridges or washers or etc)"] || 0) +
        (csv["Balloons"] || 0) +
        (csv["Cigar Tips"] || 0) +
        (csv["Cigarette Lighters"] || 0) +
        (csv["Construction Materials"] || 0) +
        (csv["Fireworks"] || 0) +
        (csv["Tyres"] || 0)

    csv ['Personal Hygiene'] = 
        (csv["Condoms"] || 0) +
        (csv["Diapers"] || 0) +
        (csv["Syringes"] || 0) +
        (csv["Tampons or Tampon Applicators"] || 0)

    csv ['Items of Local Concern'] = 
        (csv["Foam Pieces"] || 0) +
        (csv["Glass Pieces"] || 0) +
        (csv["Plastic Pieces"] || 0) +
        (csv["Rubber Bands"] || 0) +
        (csv["Most Unusual Items"] || 0)

    return csv
}

osmosis
// .get(EXAMPLE_URLS[5])
// 2017
// .get('http://coastalcleanup.nus.edu.sg/results/2017/index.html')
// .follow('li a@href')
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
.get('http://coastalcleanup.nus.edu.sg/results/2013/index.html')
.follow('li a@href')

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
                if (stringSimilarity.compareTwoStrings(element, key) > 0.85) {
                    if (key.includes('Most Unusual Items')) {
                        csv[key] = body.slice(index + 1).join(' ')
                    }
                    if (key.includes('Weight of trash bags collected (kg)')) {
                        // Remove unwanted characters
                        csv[key] = body[index + 1].split(' ')[0].split('kg')[0]
                    }
                    else {
                        csv[key] = csv[key] || body[index + 1]
                    }
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

    // Bad practice, but go
    csv = figureType(csv)
    csv = figureOrganizationType(csv)
    csv = figureAccessibility(csv)

    // Summation
    csv = summary(csv)

    // Last but not the leat
    csv = formatKeys(csv)

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
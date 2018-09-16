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

KEYS = [
"Year"
"URL"
"Zone Location"
"Type"
"Accessibility"
"Site Location"
"Organisation name"
"Organisation type"
"Date"
"Latitude"
"Longitude"
"Organization"
"Number of participants"
"Number of bags"
"Total weight (kg)"
"Total distance (m)"
"Most likely found"
"Fishing Gear"
"Packaging materials"
"Other trash"
"Personal hygiene"
"Items of local concern"
"Cigarette Butts"
"Food Wrappers"
"Plastic Take Out Containers"
"Foam Take Out Containers"
"Plastic Bottle Caps"
"Metal Bottle Caps"
"Plastic Lids"
"Straws/Stirrers"
"Forks Knives Spoons"
"Plastic Beverage Bottles"
"Glass Beverage Bottles"
"Beverage Cans"
"Plastic Grocery Bags"
"Other Plastic Bags"
"Paper Bags"
"Paper Cups & Plates"
"Plastic Cups & Plates"
"Foam Cups & Plates"
"Fishing Buoys"
"Fishing Net & Pieces"
"Rope "
"Fishing line"
"6-pack holders"
"Other Plastic or Foam Packaging"
"Other Plastic Bottles (oil or bleach etc)"
"Strapping bands"
"Tobacco Packaging or Wrappers"
"Appliances (fridges or washers or etc)"
"Balloons"
"Cigar Tips"
"Cigarette Lighters"
"Construction Materials"
"Fireworks"
"Tyres"
"Condoms"
"Diapers"
"Syringes",
"Tampons or Tampon Applicators"
"Foam Pieces"
"Glass Pieces"
"Plastic Pieces"
"Rubber Bands"
"Most Unusual Items"
]

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
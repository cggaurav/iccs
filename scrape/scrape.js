var osmosis = require('osmosis')

osmosis
.get('http://coastalcleanup.nus.edu.sg/results/2017/nw-lck-erm.htm')
// .find('tbody')
// .find('tr')
// .find('td td > p')
// .follow('@href')
// .contains('CLEANUP SUMMARY')
.set({
	// FILTER LATER
    'table': 'tr',
    'table0': 'td[10]',
})
.data((listing) => {
	console.log("BEFORE", listing)

    let table = listing.table
    	// .replace(/\r\n\s+/g, '\n')
    	// .replace(/\n+/g, '|')
    	// .replace(/\t/g, '\n')
    	// .replace(/\s\s+/g, ' ')
    

    console.log("AFTER", table)
})
.log(console.log)
// .error(console.log)
// .debug(console.log)
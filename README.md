## ICCS

A volunteer project for [International Costal Cleanup Singapore](http://coastalcleanup.nus.edu.sg/) that has been running from 1992 to consolidate data cleanup statistics and make it available visually for general awareness.

## Schema

[2013 to 2017](https://docs.google.com/spreadsheets/d/1twbvDgqsKK8N2Y3HtpLBopB1004PBw00BOd2m1nNXrI/edit#gid=0)

* 2015, because of a haze, we did not have enough sites clenaned
* If we do not find a value, we will go with `NAN`

## Scraping

Code that pulls down what we have from an age old HTML site to be mapped into a MongoDB. (WIP)


TODO

* Remove duplicates

## Scripts

* `mongoimport -d iccs -c cleanpus --type csv --file data.csv --headerline`

## Check Mistakes 

* Emtpy fields in CSV
* TOTAL ITEMS 
* PLASTIC/METAL etc
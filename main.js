"use strict";

// data source URL
const dataUrl = "https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-province.json"
// const dataUrl = "../dpc-covid19-ita-province.json"

let rawdata // just for debugging

// tdata contains the processed data: time => record; record contains a list of values for each province
let tdata = {}

// available times
let ts = []

// HTML span element that visualizes the date
let label

// Slider to change the current date
let slider

// leafjs map
let theMap

// the formatter used to visualize the current date
let dateFormatter = new Intl.DateTimeFormat('en', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
}) 

// the disks representing the infections
let circles = {}

// intitialize the app
function init()
{
    // create the map (see https://leafletjs.com/)
    theMap = L.map('mapid').setView([42.01665183556825, 12.436523437500002], 6);

    const mapSource = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw'
    L.tileLayer(mapSource, {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(theMap);

    // get HTML elements (label and slider)
    label = document.getElementById('t')
    slider = document.getElementById('slider')
    slider.oninput = onSliderChanged

    label.innerHTML = "Loading data ..."

    // fetch the data (note: I really should check for errors..)
    fetch(dataUrl).then(resp=>resp.json()).then(processData)
}
window.onload = init

// process the data. It is a json containing a list of records
function processData(data) {
    rawdata = data // for debugging

    data.forEach(item => {

        // total number of cases
        const m = item.totale_casi
        if(m>0) {

            // timestamp
            const t = new Date(item.data).getTime()

            // add a new entry for the given timestamp (or update the old one)
            let rec = tdata[t]
            if(!rec) { 
                rec = {lst:[], t:t} 
                tdata[t] = rec 
                ts.push(t)
            }

            // add the new point
            rec.lst.push({
                lat: item.lat,
                lon: item.long,
                m:m,
                prov:item.codice_provincia,
                name:item.denominazione_provincia
            })
        }
    });

    // sort data (this should not be necessary, but just in case ...)
    ts = ts.sort()

    // update parameters of the slider
    slider.min = 0
    slider.max = ts.length-1
    slider.value = 0

    // visualize the first day
    showDate(ts[0])
}


// visualize the data for a given time
function showDate(t) {
    // put the date in the label HTML span
    label.innerHTML = dateFormatter.format(new Date(t))

    // mark as unsed all the visualized circles
    for(let p in circles) { circles[p].used = false }

    // for each point
    tdata[t].lst.forEach(item => {
        // get position (lat,lon), province code and number of cases
        const lat = item.lat
        const lon = item.lon
        const m = item.m
        const prov = item.prov
        // compute the radius
        const radius = 5000*Math.log(m)
        // create a new circle or modify an old one (circles are associated with provinces)
        let circle
        if(circles[prov] === undefined) {
            // create a new circle
            circle = L.circle([lat, lon], {
                color: 'none',
                fillColor: '#f21',
                fillOpacity: 0.5,
                radius: radius
            }).addTo(theMap);
            circles[prov] = circle
        } else {
            // update the old one
            circle = circles[prov]
            circle.setRadius(radius)            
        }   
        // mark the circle as used
        circle.used = true
        // add a tooltip
        circle.bindTooltip(item.name + "<br>" + item.m + " total cases")     
    })
    // remove unused circles
    let tokill = []
    for(let p in circles) { 
        if(!circles[p].used) { circles[p].remove(); tokill.push(p) }
    }
    tokill.forEach(p=>delete circles[p])
}

// user's just moved the slider: update the page
function onSliderChanged() {
    let i = Math.floor(this.value)
    if(0<=i && i<ts.length)
        showDate(ts[i])
}

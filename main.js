"use strict";

let canvas,ctx
// const dataUrl = "https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-province.json"
const dataUrl = "../dpc-covid19-ita-province.json"
let data
let rawdata
let tdata = {}
let ts = []
let lat0, lat1, lon0, lon1
let label
let slider
let theMap
let dateFormatter = new Intl.DateTimeFormat('en', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
}) 


function init2()
{
    canvas = document.getElementById('c')
    ctx = canvas.getContext('2d')
    label = document.getElementById('t')
    slider = document.getElementById('slider')
    slider.oninput = onSliderChanged

    label.innerHTML = "Loading data ..."
    fetch(dataUrl).then(resp=>resp.json()).then(processData)
}

function init()
{

    theMap = L.map('mapid').setView([42.01665183556825, 12.436523437500002], 6);
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
			'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox.streets'
	}).addTo(theMap);

   label = document.getElementById('t')
   slider = document.getElementById('slider')
   slider.oninput = onSliderChanged

   label.innerHTML = "Loading data ..."
   fetch(dataUrl).then(resp=>resp.json()).then(processData)
}

window.onload = init

function processData(data) {
    rawdata = data
    data.forEach(item => {
        const m = item.totale_casi
        if(m>0) {
            const t = new Date(item.data).getTime()
            let rec = tdata[t]
            if(!rec) { 
                rec = {lst:[], t:t} 
                tdata[t] = rec 
                ts.push(t)
            }
            rec.lst.push({
                lat: item.lat,
                lon: item.long,
                m:m,
                prov:item.codice_provincia,
                name:item.denominazione_provincia
            })
            const lat = item.lat, lon = item.long
            if(lat>0 && lon>0) {
                if(lat0 === undefined) { lat0=lat1=lat; lon0=lon1=lon }
                else {
                    if(lat<lat0)lat0=lat; else if(lat>lat1)lat1=lat
                    if(lon<lon0)lon0=lon; else if(lon>lon1)lon1=lon
                }
    
            }
        }
    });
    ts = ts.sort()
    slider.min = 0
    slider.max = ts.length-1
    slider.value = 0
    showDate(ts[0])
}

let circles = {}

function showDate(t) {
    
    label.innerHTML = dateFormatter.format(new Date(t))

    /*
    const w = canvas.width = canvas.clientWidth
    const h = canvas.height = canvas.clientHeight
    tdata[t].lst.forEach(item => {
        const lat = item.lat
        const lon = item.lon
        const m = item.m
        const x = 100 + (w-200) * (lon-lon0)/(lon1-lon0)
        const y = 100 + (h-200) * (lat1-lat)/(lat1-lat0)
        const r = 2*Math.log(m)
        ctx.fillStyle = "rgb(200,100,100,0.5)"
        ctx.beginPath()        
        ctx.moveTo(x+r,y)
        ctx.arc(x,y,r,0,2*Math.PI)
        ctx.fill()
    })
    */
    for(let p in circles) { circles[p].used = false }
    tdata[t].lst.forEach(item => {
        const lat = item.lat
        const lon = item.lon
        const m = item.m
        const radius = 5000*Math.log(m)
        const prov = item.prov
        let circle
        if(circles[prov] === undefined) {
            circle = L.circle([lat, lon], {
                color: 'none',
                fillColor: '#f21',
                fillOpacity: 0.5,
                radius: radius
            }).addTo(theMap);
            circles[prov] = circle
        } else {
            circle = circles[prov]
            circle.setRadius(radius)            
        }   
        circle.used = true
        circle.bindTooltip(item.name + "<br>" + item.m + " total cases")     
    })
    let tokill = []
    for(let p in circles) { 
        if(!circles[p].used) { circles[p].remove(); tokill.push(p) }
    }
    tokill.forEach(p=>delete circles[p])
}


function animate() {
    if(ts && ts.length>0) {
        let s = performance.now() * 0.001
        s = (s - Math.floor(s)) * 2
        let i = Math.floor(ts.length * s)
        if(i>=ts.length) i = ts.length-1
        
        paint(ts[i])
    }

    // requestAnimationFrame(animate)
}

function foo(v)
{
    v = Math.floor(v)
    console.log(v)
    if(0<=v && v<ts.length) {
        paint(ts[v])
        document.getElementById('t').innerHTML = new Date(ts[v])
    }
}


function onSliderChanged() {
    let i = Math.floor(this.value)
    if(0<=i && i<ts.length)
        showDate(ts[i])
}
let canvas,ctx

function init()
{
    canvas = document.getElementById('c')
    ctx = canvas.getContext('2d')
    animate()
    
}

window.onload = init

let data
// fetch('https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-province.json')
fetch('dpc-covid19-ita-province.json')
    .then(resp => resp.json())
    .then(process);

let rawdata
let tdata = {}
let ts = []
let lat0, lat1, lon0, lon1

function process(data) {
    rawdata = data
    data.forEach(item => {
        m = item.totale_casi
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
                m:m
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
}


function paint(t) {
    const w = canvas.width = canvas.clientWidth
    const h = canvas.height = canvas.clientHeight
    tdata[t].lst.forEach(item => {
        const lat = item.lat
        const lon = item.lon
        const m = item.m
        const x = 100 + (w-200) * (lon-lon0)/(lon1-lon0)
        const y = 100 + (h-200) * (lat1-lat)/(lat1-lat0)
        const r = 2+2*Math.log(m)
        ctx.fillStyle = "rgb(200,100,100,0.5)"
        ctx.beginPath()        
        ctx.moveTo(x+r,y)
        ctx.arc(x,y,r,0,2*Math.PI)
        ctx.fill()
    })
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



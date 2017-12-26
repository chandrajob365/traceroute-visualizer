const rawSocket = require('raw-socket')
const dgram = require('dgram')
const DNS = require('dns')
const message = Buffer.from('Ping')
const TIME_LIMIT = 5000
const MAX_HOPS = 64
const fetch = require('node-fetch')
let UDPPORT = 33434
const resolveDest = (dest, cb) => {
  DNS.resolve(dest, (err, addresses) => {
    if (err) {
      console.log('Invalid destination')
      process.exit(9)
    }
    cb(addresses[0])
  })
}

const ping = (destIP, ttl, cb) => {
  console.log('ttl == ', ttl)
  const timerObj = {
    timeout: true
  }
  let udp4Socket = dgram.createSocket('udp4')
  udp4Socket.bind(33434)
  udp4Socket.on('listening', () => {
    udp4Socket.setTTL(ttl)
    udp4Socket.send(message, 33435, destIP, (err, byte) => {
      if (err) console.log(err)
    })
  })
  udp4Socket.on('error', err => {
    console.log('[ handleUDPError ] err = ', err)
    if (err.code === 'EADDRINUSE') {
      console.log('[ handleUDPError of type EADDRINUSE ]')
      console.log('[ handleUDPError ] UDPPORT = ', UDPPORT)
      udp4Socket.bind(33435)
    }
  })
  let ICMPsocket = rawSocket.createSocket({
    protocol: rawSocket.Protocol.ICMP
  })
  ICMPsocket.on('message', (buffer, source) => {
    console.log('[ ICMP message response ] source = ', source)
    udp4Socket.close(() => cb(source))
    timerObj.timeout = false
    ICMPsocket.close()
  })
  setTimeout(() => {
    console.log('Inside timeout')
    if (timerObj.timeout) {
      udp4Socket.close(() => cb())
      ICMPsocket.close()
    }
  }, TIME_LIMIT)
}

const traceRoute = (destIP, ttl, cb) => {
  ping(destIP, ttl, (sourceHop) => {
    console.log('Inside callback of ping sourceHop = ', sourceHop)
    fetch(`http://freegeoip.net/json/${sourceHop || ''}`)
       .then(res => res.json())
       .then(json => {
         const { latitude, longitude } = json
         console.log('coords === ', json.latitude, json.longitude, sourceHop, '\n\n')
         cb(null, {source: sourceHop, lat: latitude, lng: longitude})
       }).then(sourceHop => {
         if (!(sourceHop === destIP || ttl === MAX_HOPS)) {
           console.log('.......... sourceHop = ', sourceHop, ' destIP = ', destIP)
           traceRoute(destIP, ttl + 1, cb)
         }
       }).catch(err => cb(err))
  })
}

const trace = (dest, cb) => resolveDest(dest, destIP => {
  console.log('[ callback from DNSresolver ] destIP = ', destIP, ' destName = ', dest)
  traceRoute(destIP, 1, cb)
})

exports.trace = trace

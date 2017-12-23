const rawSocket = require('raw-socket')
const dgram = require('dgram')
const DNS = require('dns')
const message = Buffer.from('Ping')
const TIME_LIMIT = 5000
const MAX_HOPS = 64
const fetch = require('node-fetch')

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
  udp4Socket.bind(8231)
  handleUDPlistening(udp4Socket, destIP, ttl)
  let ICMPsocket = rawSocket.createSocket({
    protocol: rawSocket.Protocol.ICMP
  })
  handleICMPMssage(timerObj, ICMPsocket, udp4Socket, cb)
  handleICMPError(ICMPsocket)
  handleUDPError(udp4Socket)
  setTimeout(() => {
    console.log('Inside timeout')
    if (timerObj.timeout) {
      udp4Socket.close()
      ICMPsocket.close()
      cb()
    }
  }, TIME_LIMIT)
}

const handleUDPError = udp4Socket => {
  udp4Socket.on('err', err => {
    if (err) process.exit(1)
  })
}

const handleICMPError = ICMPsocket => {
  ICMPsocket.on('err', err => {
    if (err) process.exit(1)
  })
}

const handleUDPlistening = (udp4Socket, destIP, ttl) => {
  udp4Socket.on('listening', () => {
    udp4Socket.setTTL(ttl)
    udp4Socket.send(message, 33435, destIP, (err, byte) => {
      if (err) console.log(err)
    })
  })
}

const handleICMPMssage = (timerObj, ICMPsocket, udp4Socket, cb) => {
  ICMPsocket.on('message', (buffer, source) => {
    udp4Socket.close()
    timerObj.timeout = false
    ICMPsocket.close()
    cb(buffer, source)
  })
}

const traceRoute = (destIP, ttl, cb) => {
  ping(destIP, ttl, (buffer, source, time) => {
    fetch(`http://freegeoip.net/json/${source || ''}`)
       .then(res => res.json())
       .then(json => {
         const { latitude, longitude } = json
         console.log('coords === ', json.latitude, json.longitude, source, '\n\n')
         cb(null, {source: source, lat: latitude, lng: longitude})
       })
       .then(() => {
         if (!(source === destIP || ttl === MAX_HOPS)) {
           traceRoute(destIP, ttl + 1, cb)
         }
       }).catch(err => cb(err))
  })
}

const trace = (dest, cb) => resolveDest(dest, destIP => {
  traceRoute(destIP, 1, cb)
})

exports.trace = trace

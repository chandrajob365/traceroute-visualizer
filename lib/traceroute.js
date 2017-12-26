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
      udp4Socket.close.bind(cb)
      ICMPsocket.close()
      cb()
    }
  }, TIME_LIMIT)
  udp4Socket.on('close', (source) => {
    console.log('Inside udp4Socket close event... source = ', source)
    this(source)
  })
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
    udp4Socket.close.bind(cb, source)
    timerObj.timeout = false
    ICMPsocket.close()
    // cb(buffer, source)
  })
}

const traceRoute = (destIP, ttl, cb) => {
  new Promise((resolve, reject) => {
    ping(destIP, ttl, (sourceHop, time) => {
      fetch(`http://freegeoip.net/json/${sourceHop || ''}`)
         .then(res => res.json())
         .then(json => {
           const { latitude, longitude } = json
           console.log('coords === ', json.latitude, json.longitude, sourceHop, '\n\n')
           cb(null, {source: sourceHop, lat: latitude, lng: longitude})
           resolve(sourceHop)
         }).catch(err => reject(err))
    })
  }).then(sourceHop => {
    console.log()
    if (!(sourceHop === destIP || ttl === MAX_HOPS)) {
      traceRoute(destIP, ttl + 1, cb)
    }
  }).catch(err => cb(err))
}

const trace = (dest, cb) => resolveDest(dest, destIP => {
  traceRoute(destIP, 1, cb)
})

exports.trace = trace

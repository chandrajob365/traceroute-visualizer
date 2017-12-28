const rawSocket = require('raw-socket')
const dgram = require('dgram')
const DNS = require('dns')
const fetch = require('node-fetch')

class Tracer {
  constructor () {
    this.UDPPORT = 33434
    this.TIME_LIMIT = 5000
    this.MAX_HOPS = 64
    this.message = Buffer.from('Ping')
  }

  resolveDest (dest, cb) {
    DNS.resolve(dest, (err, addresses) => {
      if (err) {
        cb(new Error('Invalid destination'))
      } else {
        cb(null, addresses[0])
      }
    })
  }

  createUdp4Socket (destIP, ttl) {
    let udp4Socket = dgram.createSocket('udp4')
    udp4Socket.bind(this.UDPPORT, () => {
      udp4Socket.setTTL(ttl)
      udp4Socket.send(this.message, this.UDPPORT, destIP)
    })
    udp4Socket.on('error', () => {
      this.UDPPORT = this.UDPPORT + 1
      udp4Socket._bindState = 0
      if (udp4Socket._bindState === 0) {
        udp4Socket.bind(this.UDPPORT)
      }
    })
    return udp4Socket
  }

  createICMPSocket (timerObj, udp4Socket, cb) {
    let ICMPsocket = rawSocket.createSocket({
      protocol: rawSocket.Protocol.ICMP
    })
    ICMPsocket.on('message', (buffer, source) => {
      udp4Socket.close(() => {
        ICMPsocket.close()
        cb(source)
      })
      timerObj.timeout = false
    })
    return ICMPsocket
  }

  pingPong (destIP, ttl, cb) {
    const timerObj = {
      timeout: true
    }
    let udp4Socket = this.createUdp4Socket(destIP, ttl)
    let ICMPsocket = this.createICMPSocket(timerObj, udp4Socket, cb)
    setTimeout(() => {
      if (timerObj.timeout) {
        udp4Socket.close(() => {
          ICMPsocket.close()
          cb()
        })
      }
    }, this.TIME_LIMIT)
  }

  traceRoute (destIP, ttl, cb) {
    this.pingPong(destIP, ttl, (sourceHop) => {
      fetch(`http://freegeoip.net/json/${sourceHop || ''}`)
         .then(res => res.json())
         .then(json => {
           const { latitude, longitude } = json
           cb(null, {source: sourceHop, lat: latitude, lng: longitude, status: 'inprogress'})
         }).then(() => {
           if (!(sourceHop === destIP || ttl === this.MAX_HOPS)) {
             this.traceRoute(destIP, ttl + 1, cb)
           } else {
             cb(null, {status: 'done'})
           }
         }).catch(err => cb(err))
    })
  }

  trace (dest, cb) {
    this.resolveDest(dest, (error, destIP) =>
      error ? cb(error.message) : this.traceRoute(destIP, 1, cb))
  }
}

module.exports = Tracer

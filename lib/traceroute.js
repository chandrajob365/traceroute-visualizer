const dgram = require('dgram')
const dns = require('dns')
const udp4Socket = dgram.createSocket('udp4')
const message = Buffer.from('PING')
const rawSocket = require('raw-socket')
const maxHop = 30
let ttl = 1
let destIP = ''
let current = ''
let backtoApp
const fetch = require('node-fetch')
const ICMPsocket = rawSocket.createSocket(
  {
    protocol: rawSocket.Protocol.ICMP
  }
)
ICMPsocket.on('message', (buffer, source) => {
    if (current !== destIP && ttl < maxHop) {
      current = source
      fetch(`http://freegeoip.net/json/${source || ''}`)
         .then(res => res.json())
         .then(json => {
           const { latitude, longitude } = json
           backtoApp(null, {source: source, lat: latitude, lng: longitude})
         })
         .catch(err => cb(err))
    }
})

ICMPsocket.on('err', err => {
  console.log('ICMPsocket error : ', err.stack)
  ICMPsocket.close()
})

udp4Socket.on('err', err => {
  console.log('udp4Socket error : ', err.stack)
  udp4Socket.close()
})

udp4Socket.on('listening', () => {
  const address = udp4Socket.address()
})

const dnsLookup = (destAddr, cb) => {
  dns.resolve(destAddr, (err, records) => {
    if (err) {
      console.log('[dnsLookup] err = ', err)
    }
    destIP = records[0]
    cb(destIP)
  })
}

udp4Socket.on('close', () => {
  console.log('udp4Socket closed')
})

const sendData = (destIP, ttl) => {
  udp4Socket.setTTL(ttl)
  udp4Socket.send(message, 33435, destIP, (err, byte) => {
    if (err) console.log(err)
    if (current !== destIP && ttl < maxHop) setTimeout(() => sendData(destIP, ttl + 1), 3000)
  })
}
udp4Socket.bind(8021)

const trace = (dest, cb) => dnsLookup(dest, destIP => {
  backtoApp = cb
  sendData(destIP, 1)
})

exports.trace = trace

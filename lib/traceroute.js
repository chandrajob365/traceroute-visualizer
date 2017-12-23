const rawSocket = require('raw-socket')
const dgram = require('dgram')
const DNS = require('dns')
const message = Buffer.from('Ping')
const TIME_LIMIT = 5000
const MAX_HOPS = 64
const fetch = require('node-fetch')
let ip = ''
const url = `http://freegeoip.net/json/${ip}`

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
   const timerObj = {
     sentTime: '',
     timeout: true
   }
   let udp4Socket = dgram.createSocket('udp4')
   udp4Socket.bind(8000)
   handleUDPlistening(udp4Socket, destIP, timerObj, ttl)
   let ICMPsocket = rawSocket.createSocket({
     protocol: rawSocket.Protocol.ICMP
   })
   handleICMPMssage(timerObj, ICMPsocket, udp4Socket, ttl, cb)
   handleICMPError(ICMPsocket)
   handleUDPError(udp4Socket)
   setTimeout(() => {
     if (timerObj.timeout) {
       udp4Socket.close()
       ICMPsocket.close()
       cb(null, null , TIME_LIMIT)
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

 const handleUDPlistening = (udp4Socket, destIP, timerObj, ttl) => {
   udp4Socket.on('listening', () => {
     udp4Socket.setTTL(ttl)
     udp4Socket.send(message, 33435, destIP, (err, byte) => {
       if (err) console.log(err)
       timerObj.sentTime = new Date().getTime()
     })
   })
 }

 const handleICMPMssage = (timerObj, ICMPsocket, udp4Socket, ttl, cb) => {
   ICMPsocket.on('message', (buffer, source) => {
     udp4Socket.close()
     timerObj.timeout = false
     cb(buffer, source, (new Date().getTime() - timerObj.sentTime))
     ICMPsocket.close()
   })
 }

 const traceRoute = (destIP, ttl, socket) => {
   ping(destIP, ttl, (buffer, source, time) => {
     fetch(`https://ipapi.co/${source || ''}/json/`)
       .then(res => res.json())
       .then(json => {
         const { latitude, longitude } = json
         console.log('coords === ', json.latitude, json.longitude, source, '\n\n')
         socket.emit('coords', {source: source, lat: latitude, lng: longitude})
       })
       .then(() => {
         if (!(source === destIP || ttl === MAX_HOPS)) {
           traceRoute(destIP, ttl + 1, socket)
         }
       })
   })
 }

 function handleFailure (msg, err, yargs) {
   console.error('You broke it!')
   console.error(msg)
   console.error('You should be doing', yargs.help())
   process.exit(1)
 }

 const trace = (dest, socket) => resolveDest(dest, (destIP, domains) => {
   traceRoute(destIP, 1, socket)
 })

exports.trace = trace

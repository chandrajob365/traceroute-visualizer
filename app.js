const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const ping = require('./lib/traceroute')
app.use(express.static('public'))

server.listen(process.env.PORT || 8000, () => {
  console.log('Server running @ ', process.env.PORT || 8000)
})

io.sockets.on('connection', socket => {
  socket.on('destination', target => {
    ping.createSession().traceRoute(target, (err, data) => {
      if (err) {
        if (err.name === 'DNSError') socket.emit('errorMsg', err.message)
      } else {
        console.log('[Inside app] data.latitude = ', data.latitude, ' data.longitude = ', data.longitude, ' data.source = ', data.source, ' data.target = ', data.target, ' status = ', data.status)
        socket.emit('coords', {
          source: data.source,
          lat: data.latitude,
          lng: data.longitude,
          status: data.status,
          target: target
        })
      }
    })
  })
})

const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const traceroute = require('./lib/traceroute')

app.use(express.static('public'))

server.listen(process.env.PORT || 8000, () => {
  console.log('Server running @ ', process.env.PORT || 8000)
})

io.sockets.on('connection', socket => {
  console.log('socket connected = ', socket.id)
  socket.on('destination', (data) => {
    traceroute.trace(data, (err, coords) => {
      if (err) throw err
      socket.emit('coords', coords)
    })
  })
})

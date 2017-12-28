const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const TraceRoute = require('./lib/traceroute_bkp')
app.use(express.static('public'))

server.listen(process.env.PORT || 8000, () => {
  console.log('Server running @ ', process.env.PORT || 8000)
})

io.sockets.on('connection', socket => {
  socket.on('destination', (data) => {
    new TraceRoute().trace(data, (err, data) => {
      if (err) socket.emit('errorMsg', err)
      else {
        data.status === 'inprogress'
          ? socket.emit('coords', data)
          : socket.emit('completed')
      }
    })
  })
})

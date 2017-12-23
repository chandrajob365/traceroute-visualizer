const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.use(express.static('public'))

server.listen(process.env.PORT || 8000, () => {
  console.log('Server running @ ', process.env.PORT || 8000)
})

io.sockets.on('connection', socket => {
  console.log('socket connected = ', socket.id)
  emitLatestCords(socket)
})

const emitLatestCords = socket => {
  socket.on('getNextCords', () => {
    let cords = getNextCords()
    socket.emit('latestCords', cords)
  })
}

const getNextCords = () => {
  return {'lat': 12, 'lng': 13}
}

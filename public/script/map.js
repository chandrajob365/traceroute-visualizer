const socket = io.connect()
socket.emit('getNextCords')
socket.on('latestCords', coords => {
  console.log('coords', coords)
})

const socket = io.connect()
socket.emit('getNextCords')
socket.on('latestCords', coords => {
  console.log('coords', coords)
})

window.onload = () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function (position) {
      const map = drawMap(position.coords.latitude, position.coords.longitude)
      pointOnMap(map, position.coords.latitude, position.coords.longitude)
      drawLine(map, {lat: 20, lng: 24}, {lat: 1, lng: 20})
    })
  } else {
    // Location not available
  }
}

function drawMap(lat, lng) {
  const coordinates = { lat, lng }
  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 1,
    center: coordinates
  })
  return map
}

function pointOnMap(map, lat, lng) {
  const coordinates = { lat, lng }
  const marker = new google.maps.Marker({
    position: coordinates,
    map: map
  })
}

function drawLine(map, source, destination) {
  const line = new google.maps.Polyline({
    path: [
      new google.maps.LatLng(source),
      new google.maps.LatLng(destination)
    ],
    strokeColor: "#4885ed",
    strokeOpacity: 0.9,
    strokeWeight: 2,
    map: map
  })
}
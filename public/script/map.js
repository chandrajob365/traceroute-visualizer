const socket = io.connect()
socket.emit('getNextCords')
let olderCoords = {}
socket.on('coords', coords => {
  console.log('coords', coords)
  if (coords.source && coords.lat && coords.lng) {
    pointOnMap(coords.lat, coords.lng)
    drawLine({lat: olderCoords.lat, lng: olderCoords.lng}, {lat: coords.lat, lng: coords.lng})
    olderCoords = {lat: coords.lat, lng: coords.lng}
    setTimeout(() => moveToLocation(coords.lat, coords.lng), 5000)
  }
})

let map
window.onload = () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function (position) {
      olderCoords = {lat: position.coords.latitude, lng: position.coords.longitude}
      drawMap(position.coords.latitude, position.coords.longitude)
      pointOnMap(position.coords.latitude, position.coords.longitude)
      pointOnMap(position.coords.latitude + 10, position.coords.longitude + 10)
      drawLine({lat: 20, lng: 24}, {lat: 1, lng: 20})
      setTimeout(() => moveToLocation(30, 40), 5000)
    })
  } else {
    // Location not available
  }
}

function drawMap(lat, lng) {
  const coordinates = { lat, lng }
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 3,
    center: coordinates
  })
  // return map
}

function pointOnMap(lat, lng) {
  const coordinates = { lat, lng }
  const marker = new google.maps.Marker({
    position: coordinates,
    map: map
  })
}

function drawLine(source, destination) {
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

function moveToLocation(lat, lng){
  const center = new google.maps.LatLng(lat, lng)
  map.panTo(center)
  map.setZoom(12)
}

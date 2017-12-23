const socket = io.connect()
const minimumZoom = 3
socket.emit('getNextCords')
let olderCoords = {}
socket.on('coords', coords => {
  console.log('coords', coords)
  if(Object.keys(coords).length === 3) {
    const { source, lat, lng} = coords
    pointOnMap(lat, lng)
    drawLine({lat: olderCoords.lat, lng: olderCoords.lng}, { lat, lng })
    olderCoords = {lat, lng}
    moveToLocation(lat, lng)
  }
})

let map
window.onload = () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function (position) {
      olderCoords = {lat: position.coords.latitude, lng: position.coords.longitude}
      drawMap(position.coords.latitude, position.coords.longitude)
      pointOnMap(position.coords.latitude, position.coords.longitude)
    })
  } else {
    // Location not available
  }
}

function drawMap(lat, lng) {
  const coordinates = { lat, lng }
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
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
  map.setZoom(4)
}

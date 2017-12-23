const socket = io.connect()
const minZoom = 3
socket.emit('getNextCoords')
socket.on('coords', coords => {
  console.log(coords)
  // console.log('coords', coords)
  if(Object.keys(coords).length === 3){
    pointOnMap(coords.lat, coords.lng)
  }
})

let map
// window.onload = () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function (position) {
      drawMap(position.coords.latitude, position.coords.longitude)
      pointOnMap(position.coords.latitude, position.coords.longitude)
      // drawLine({lat: 20, lng: 24}, {lat: 1, lng: 20})
      // setTimeout(function(){ moveToLocation(30, 40) }, 5000)
    })
  } else {
    // Location not available
  }
// }

function drawMap(lat, lng) {
  const coordinates = { lat, lng }
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: minZoom,
    center: coordinates,
  })

  const allowedBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(64, 149), 
    new google.maps.LatLng(-6, 179)
  )
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
  map.setZoom(6)
}


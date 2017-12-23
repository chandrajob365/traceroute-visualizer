const socket = io.connect()
const minimumZoom = 3
socket.emit('getNextCords')
let olderCoords = {}

const locUpdateHandler = () => {
  socket.on('coords', coords => {
    console.log('coordinates', coords)
    if (coords.source && coords.lat && coords.lng) {
      const { source, lat, lng } = coords
      moveToLocation(lat, lng)
      pointOnMap(lat, lng)
      drawLine({lat: olderCoords.lat, lng: olderCoords.lng}, { lat, lng })
      olderCoords = {lat, lng}
    } else {
      drawLine({lat: olderCoords.lat, lng: olderCoords.lng},
        {lat: olderCoords.lat + 1, lng: olderCoords.lng + 1},
        '#db3236')
    }
  })
}

let map
window.onload = () => {
  // initMap()
}

function initMap () {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(function (position) {
      const { latitude, longitude } = position.coords
      olderCoords = { lat: latitude, lng: longitude }
      drawMap(latitude, longitude)
      pointOnMap(latitude, longitude)
    })
    locUpdateHandler()
  }
}

function drawMap (lat, lng) {
  const maxBounds = new google.maps.LatLngBounds(
    new google.maps.LatLng(-85, -175),
    new google.maps.LatLng(85, 175)
  )

  const coordinates = { lat, lng }
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 4,
    center: coordinates
  })

  let lastValidCenter = map.getCenter()
  google.maps.event.addListener(map, 'center_changed', () => {
    if (maxBounds.contains(map.getCenter())) {
      lastValidCenter = map.getCenter()
      map.panTo(lastValidCenter)
    }
  })
}

function pointOnMap (lat, lng) {
  const coordinates = { lat, lng }
  const marker = new google.maps.Marker({
    position: coordinates,
    map: map
  })
}

function drawLine (source, destination, color = '#4885ed') {
  const line = new google.maps.Polyline({
    path: [
      new google.maps.LatLng(source),
      new google.maps.LatLng(destination)
    ],
    strokeColor: color,
    strokeOpacity: 0.9,
    strokeWeight: 2,
    map: map
  })
}

function moveToLocation (lat, lng) {
  const center = new google.maps.LatLng(lat, lng)
  map.panTo(center)
  map.setZoom(4)
}

const button = document.getElementById('sendDestination')
button.addEventListener('click', () => {
  initMap()
  const destination = document.getElementById('destination').value
  socket.emit('destination', destination)
}, false)

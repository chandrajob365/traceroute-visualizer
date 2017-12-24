const socket = io.connect()

// const minimumZoom = 3
let map
let startLoc
let olderCoords = {}
let markers = []
const lines = []
let maxBounds = new google.maps.LatLngBounds()

socket.emit('getNextCords')

const locUpdateHandler = () => {
  socket.on('coords', coords => {
    // console.log('coordinates', coords)
    if (coords.source && coords.lat && coords.lng) {
      const { lat, lng } = coords
      moveToLocation(pointOnMap(lat, lng))
      drawLine({lat: olderCoords.lat, lng: olderCoords.lng}, { lat, lng })
      olderCoords = {lat, lng}
    } else {
      drawLine({lat: olderCoords.lat, lng: olderCoords.lng},
        {lat: olderCoords.lat + 1, lng: olderCoords.lng + 1},
        '#db3236')
    }
  })
}

function cleanUp () {
  console.log('cleanup')
  markers.map((current) => {
    current.setPosition(null)
  })

  lines.map((current) => {
    current.setMap(null)
  })
}

const initMap = () => {
  if ('geolocation' in navigator) {
    // console.log('Geolocation service available')
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords
      startLoc = {latitude, longitude}
      olderCoords = { lat: latitude, lng: longitude }
      drawMap(latitude, longitude)
      pointOnMap(latitude, longitude, 'blue')
    })
  }
}

function drawMap (lat, lng) {
  // console.log('Drawing map')
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 10,
    center: { lat, lng }
  })
  console.log(map.zoom)
}

function pointOnMap (lat, lng, color = 'green') {
  // console.log('Pointing on map')
  const coordinates = new google.maps.LatLng(lat, lng)
  markers.push(new google.maps.Marker({
    position: coordinates,
    map: map,
    icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`
  }))
  return coordinates
}

function drawLine (source, destination, color = '#4885ed') {
  // console.log('Drawing polyline---------------')
  lines.push(new google.maps.Polyline({
    path: [
      new google.maps.LatLng(source),
      new google.maps.LatLng(destination)
    ],
    strokeColor: color,
    strokeOpacity: 0.9,
    strokeWeight: 2,
    map: map
  }))
}

function moveToLocation (coords) {
  // console.log('Moving to Loc')
  maxBounds.extend(coords)
  map.fitBounds(maxBounds)
  map.panToBounds(maxBounds)
}

const validateName = (destination) => {
  return (/^([a-zA-Z0-9]*|([a-zA-Z0-9](\\[a-zA-Z0-9])*))\.[a-z]*$/.test(destination))
}

const button = document.getElementById('sendDestination')
button.addEventListener('click', () => {
  const destination = document.getElementById('destination').value
  if (validateName(destination)) {
    cleanUp()
    socket.emit('destination', destination)
    drawMap(startLoc.latitude, startLoc.longitude)
    markers = []
    maxBounds = new google.maps.LatLngBounds()
    olderCoords = {lat: startLoc.latitude, lng: startLoc.longitude}
    moveToLocation(pointOnMap(startLoc.latitude, startLoc.longitude, 'blue'))
    locUpdateHandler()
  } else document.getElementById('destination').value = 'Enter valid hostname'
})

window.addEventListener = ('DOMContentLoaded', initMap)

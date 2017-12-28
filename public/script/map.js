const socket = io.connect()
let map
let startLoc
let olderCoords = {}
let markers = []
const lines = []
let maxBounds = new google.maps.LatLngBounds()
const message = document.getElementById('msg')
const destination = document.getElementById('destination')
socket.emit('getNextCords')

socket.on('errorMsg', errMsg => {
  message.style.display = 'inline'
  message.style.color = 'red'
  message.innerHTML = errMsg
  destination.removeAttribute('disabled')
  destination.value = ''
  destination.focus()
})

socket.on('completed', () => {
  message.style.display = 'inline'
  message.style.color = 'blue'
  message.innerHTML = 'Trace for destination ' + destination.value + ' completed'
  destination.removeAttribute('disabled')
  destination.value = ''
  destination.focus()
})
const locUpdateHandler = () => {
  socket.on('coords', coords => {
    // console.log('coordinates', coords)
    if (coords.source && coords.lat && coords.lng) {
      const {lat, lng, source} = coords
      moveToLocation(pointOnMap(lat, lng, source))
      drawLine({lat: olderCoords.lat, lng: olderCoords.lng}, { lat, lng })
      olderCoords = {lat, lng}
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
      pointOnMap(latitude, longitude, '', 'blue')
    })
  }
}

function drawMap (lat, lng) {
  // console.log('Drawing map')
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 18,
    center: { lat, lng }
  })
  console.log(map.zoom)
}

function pointOnMap (lat, lng, ip, color = 'green') {
  // console.log('Pointing on map')
  const coordinates = new google.maps.LatLng(lat, lng)
  let marker = new google.maps.Marker({
    position: coordinates,
    map: map,
    icon: `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
    animation: google.maps.Animation.DROP
  })
  markers.push(marker)
  var infoWnd = new google.maps.InfoWindow()
  infoWnd.setContent('<div class="scrollFix">' + 'IP: ' + ip + '</div>')
  google.maps.event.addListener(marker, 'mouseover', () => {
    infoWnd.open(map, marker)
  })
  google.maps.event.addListener(marker, 'mouseout', () => {
    infoWnd.close()
  })
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
  maxBounds.extend(coords)
  map.fitBounds(maxBounds)
  map.panToBounds(maxBounds)
}

const button = document.getElementById('sendDestination')
button.addEventListener('click', () => {
  message.innerHTML = ''
  message.style.display = 'none'
  let destName = destination.value
  if (destName) {
    cleanUp()
    destination.setAttribute('disabled', true)
    socket.emit('destination', destName)
    drawMap(startLoc.latitude, startLoc.longitude)
    markers = []
    maxBounds = new google.maps.LatLngBounds()
    olderCoords = {lat: startLoc.latitude, lng: startLoc.longitude}
    moveToLocation(pointOnMap(startLoc.latitude, startLoc.longitude, '', 'blue'))
    locUpdateHandler()
  }
})

initMap()

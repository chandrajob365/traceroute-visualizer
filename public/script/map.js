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

const onTraceComplete = target => {
  message.style.display = 'inline'
  message.style.color = 'blue'
  console.log('[ onTraceComplete ] destination = ', target)
  message.innerHTML = 'Trace for destination ' + target + ' completed'
  destination.removeAttribute('disabled')
  destination.value = ''
  destination.focus()
}

const locUpdateHandler = () => {
  socket.on('coords', coords => {
    if (coords.source && coords.lat && coords.lng) {
      const {lat, lng, source, status, target} = coords
      moveToLocation(pointOnMap(lat, lng, source))
      drawLine({lat: olderCoords.lat, lng: olderCoords.lng}, { lat, lng })
      olderCoords = {lat, lng}
      if (status === 'done') {
        console.log('coords = ', coords)
        onTraceComplete(target)
      }
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

socket.on('connect_error', err => {
  console.log('No connection to server ', err)
})

socket.on('reconnect_failed', () => {
  console.log('Reconnect failed')
})

socket.on('reconnect_error', (err) => {
  console.log('Reconnect Error ', err)
})

socket.on('disconnect', () => {
  console.log('Disconnect from server')
})

socket.on('error', (err) => {
  console.log('Error connecting to server ', err)
})

initMap()

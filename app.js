var express = require('express')
var app  = express()
var io   = require('socket.io')(serv,{})
var serv = require('http').Server(app)

const cl = console.log
const { Player } = require('./server/classes/player.js')
// const { rejects } = require('assert')

// /client/index.html is the default landing
// no file from the server can be accepted except those from /client
app.get('/', (req, res) => { res.sendFile(__dirname + '/client/index.html') })
app.use('/client', express.static(__dirname + '/client'))
serv.listen(1616)

var socket_list = {}
io.sockets.on('connection', (socket) => {  
  socket.id = Math.random()
  socket_list[socket.id] = socket

  console.log('Nouvelle connection :: ' + socket.id)
  Player.onConnect(socket)
  
  socket.on('disconnect',() => {
    delete socket_list[socket.id]
    Player.onDisconnect (socket)
    console.log(socket.id + " :: déconnecté")
  })
  
})
setInterval(()=>{
  pack = Player.update()
  
  for (i in socket_list) {
    let socket = socket_list[i]
    for (j of pack){
      if (j.number == Player.list[i].number) j.color = "red"
      else j.color = "blue"
    }
    socket.emit('newPositions', pack)
  }
}, 1000/25)

// collision tests
/*
function testCollisionBetweenPoints(A,B){
  var vx = A.x - B.x
  var vy = A.y - B.y
  distance = Math.sqrt(vx*vx+vy*vy)
  return distance < 10
}

rect = {
  height: 30,
  width:30,
  x: Entity.x-this.width/2,
  y: Entity.y-this.height/2,
}

function testCollisionBetweenEntities(A,B){
  return A.x <= B.x + B.width
      && B.x <= A.x + A.width
      && A.y <= B.y + B.height
      && B.y <= A.y + A.height
}
*/

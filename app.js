var express = require('express')
var app = express()
var serv = require('http').Server(app)
const port = 3000
cl = console.log

// if the reqest does not content a path, return  index ex: domain:2000
app.get('/',(req, res) => {
  res.sendFile(__dirname + '/client/index.html')
})

// if a specific path is required inside the client directory, send the corresponding file ex: domain:2000/client/file
app.use('/client', express.static(__dirname + '/client'))

serv.listen(port)

var socket_list = {}
var player_list = {}
var directions = []

class Entity {
  constructor(id){
    this.id
    this.x = 50
    this.y = 50
    this.spdX = 0
    this.spdY = 0
  }
  update(){ this.updatePosition() }
  updatePosition(){
    this.x += this.spdX
    this.y += this.spdY
  }
}

class Player extends Entity{
  constructor(id,x,y){
    super(id,x,y)
    this.pressingUp = false
    this.pressingDown = false
    this.pressingLeft = false
    this.pressingRight = false
    this.number = Math.floor(Math.random() * 100)
    this.maxSpeed = 10

    Player.list[id] = this
  }

  update(){
    this.updateSpeed()
    super.update()
  }
  
  updateSpeed(){
    if( this.pressingUp    ) this.spdY = -this.maxSpeed
    else if( this.pressingDown ) this.spdY =  this.maxSpeed
    else this.spdY = 0
    if( this.pressingRight ) this.spdX =  this.maxSpeed
    else if( this.pressingLeft ) this.spdX = -this.maxSpeed
    else this.spdX = 0
  }
}
Player.list = {}
Player.onConnect = (socket) => {
  var player = new Player(socket.id)
  socket.on('keypress', (data)=> {
    if(data.inputId == 'up'   ) player.pressingUp    = data.state
    else if(data.inputId == 'down' ) player.pressingDown  = data.state
    else if(data.inputId == 'left' ) player.pressingLeft  = data.state
    else if(data.inputId == 'right') player.pressingRight = data.state
   })
}
Player.onDisconnect = (socket) => {
  delete Player.list[socket.id]
}
Player.update = () =>{
  var pack = []
  for (i in Player.list) {
    player = Player.list[i]
    player.update()
    pack.push({
      x : player.x,
      y : player.y,
      number : player.number
    })
  }
  return pack
}

var io = require('socket.io')(serv,{})
io.sockets.on('connection', (socket) => {
  // connection
  socket.id = Math.random()
  socket_list[socket.id] = socket

  console.log('Nouvelle connection :: ' + socket.id)

  Player.onConnect(socket)
  socket.on('disconnect',() => {
    delete socket_list[socket.id]
    Player.onDisconnect (socket)
  })
  
  // création du joueur
  
})
setInterval(()=>{
  pack = Player.update()
  
  for (i in socket_list) {
    let socket = socket_list[i]
    socket.emit('newPositions', pack)
  }
}, 1000/25)


const express = require('express')
const http = require('http')
const {Server} = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors:{
    origin: "*",
    methods: ["GET", "POST"]
  }
})

io.on('connection', (socket)=>{
  console.log("A user connected:", socket.id)

  socket.on('chat', (msg)=>{
    io.emit('chat', msg)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })

  
})

const PORT = 8000
server.listen(PORT, '0.0.0.0', ()=>{
  console.log("server")
})
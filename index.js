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

const rooms = {} //각 방의 상태 저장

io.on('connection', (socket)=>{
  console.log("A user connected:", socket.id)

  //방 입장 요청
  socket.on('joinRoom', (roomId)=>{
    socket.join(roomId)
    //console.log(`${socket.id} joined room: ${roomId}`)
    //방 없으면 초기화
    if (!rooms[roomId]){
      rooms[roomId] = {
        timeLeft: 10, //10초 타이머 
        interval: null,
        players: new Set()
      }
    }

    //플레이어 반복적으로 담기지 않도록
    rooms[roomId].players.add(socket.id)
    console.log("현재의 room 상태", rooms)
    

    // 이미 타이머가 돌고 있으면 시작 안함
    if (!rooms[roomId].interval){
      startRoomTimer(roomId)
    }
  })

  //연결 종료 시
  socket.on('disconnect', ()=>{
    console.log('Disconnected:', socket.id)

    //저장되어 있는 각각의 방에서 유저를 제거
    for (const roomId in rooms){
      clearInterval(rooms[roomId].interval) //타이머 정지
      rooms[roomId].players.delete(socket.id)

      //방에 아무도 없으면 타이머 정지하고 제거
      if (rooms[roomId].players.size ===0){
        clearInterval(rooms[roomId].interval)
        delete rooms[roomId]
        console.log(`Room ${roomId} cleaned up`)
      }
    }
  })


  socket.on('chat', (data)=>{
    let {message, roomId} = data
    io.to(roomId).emit('chat', message)


  })
})

function startRoomTimer(roomId){
  const room = rooms[roomId]
  if (!room) return

  room.interval = setInterval(()=>{
    room.timeLeft-=1
    //현재 시간 모든 참가자에게 전송
    io.to(roomId).emit('timer', room.timeLeft)
    console.log(`Room ${roomId}: ${room.timeLeft}s`)

    if (room.timeLeft<=0){
      clearInterval(room.interval)
      io.to(roomId).emit('gameover', '타이머 종료')
      delete rooms[roomId]
      console.log(`Room ${roomId} 종료`)
    }
  }, 1000)
}


const PORT = 8000
server.listen(PORT, '0.0.0.0', ()=>{
  console.log("server")
})
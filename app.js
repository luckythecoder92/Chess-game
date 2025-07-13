const express = require('express')
const socket = require('socket.io')
const http = require('http')
const {Chess} = require('chess.js')

const path = require('path')

const app = express()
const server = http.createServer(app)
const io = socket(server)

const players = {};
const currentPlayer = "W";


app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname,"public")))

app.get('/',(req,res)=>{
    res.render('index',{title:"Chess game"})
})

io.on("connection",function(uniqueSocket){
    console.log("connected  ")

    uniqueSocket.on("hey",function(){
        console.log("hey pahoocha backend par")
    })
    
    uniqueSocket.emit("data")

    uniqueSocket.on("disconnect", function(){
        console.log("The server is disconnected")
    })
})



server.listen(3000,function(){
    console.log('The server is running on the port 3000')
})
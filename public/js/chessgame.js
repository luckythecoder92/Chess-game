const socket = io();
socket.emit("hey")
socket.on("data",function(){
    console.log("Data pahooch gya")
})


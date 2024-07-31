const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const server = app.listen(port, () => {
  console.log(`後端伺服器聆聽在 port ${port}...`);
});

const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: "*" } });

let NICK_NAME = ["賓士貓", "虎斑貓", "橘貓", "英國短毛貓", "矮腳貓"];
let onlineUsers = [];

io.on("connection", (socket) => {
  if (NICK_NAME.length > 0) {
    const randomIndex = Math.floor(Math.random() * NICK_NAME.length);
    const nickName = NICK_NAME.splice(randomIndex, 1)[0];

    onlineUsers.push({ id: socket.id, nickName });

    console.log(`使用者 ${socket.id} (${nickName}) 成功連結`);
    socket.emit("serverMessage", `使用者 ${nickName} 前來參加世界好貓咪大賞`);

    // 廣播更新後的線上用戶列表
    io.emit("updateUserList", onlineUsers);

    // socket.on("clientMessage", (message) => {     
    //   socket.broadcast.emit("serverMessage", `${message.nickName}: ${message.text}`);
    // });

    //判斷是貼圖還是文字
    socket.on('clientMessage', (message) => {     
      if (message.type === 'sticker') {
        socket.broadcast.emit('serverMessage', { nickName: message.nickName, text: message.text, type: 'sticker' });
      } else {
        socket.broadcast.emit('serverMessage', `${message.nickName}: ${message.text}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`使用者 ${socket.id} (${nickName}) 離開`);
      socket.broadcast.emit("serverMessage", `使用者 ${nickName} 離開`);
      NICK_NAME.push(nickName);
      onlineUsers = onlineUsers.filter(user => user.id !== socket.id);

      // 廣播更新後的線上用戶列表
      io.emit("updateUserList", onlineUsers);
    });
  } else {
    socket.emit("serverMessage", "目前暱稱已經用完");
    socket.disconnect();
  }
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

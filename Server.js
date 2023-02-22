const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();
const PORT = 5000;
const app = express();
const server = http.createServer(app);
app.use(cors());
app.use(express.json());
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true,
  },
});

const userRoute = require('./routes/user');
const talkRoomRoute = require('./routes/talkRoom');
const talkRoute = require('./routes/talk');
const planRoute = require('./routes/plan');
app.use('/api/user', userRoute);
app.use('/api/talkRoom', talkRoomRoute);
app.use('/api/talk', talkRoute);
app.use('/api/plan', planRoute);
app.get('/', (req, res) => {
  return res.send('home');
});

server.listen(PORT, () => {
  console.log('サーバーを起動・・・');
});
mongoose.set('strictQuery', true);
mongoose
  .connect(
    'mongodb+srv://shou:lemon@cluster0.xcptprv.mongodb.net/?retryWrites=true&w=majority'
  )
  .then(() => console.log('データベースに接続中・・・'))
  .catch((err) => console.log(err));

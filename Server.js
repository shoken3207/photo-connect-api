const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const bodyParser = require('body-parser');
const indexRouter = require('./routes/index');
require('dotenv').config();
const PORT = 5000;
const app = express();
const CLIENT_URL = process.env.CLIENT_URL;
console.log('env: ', process.env.CLIENT_URL, process.env.MONGO_URL);
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', CLIENT_URL);
// });
app.use('/api', indexRouter);
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL],
    credentials: true,
  },
});

app.get('/hello', (req, res) => {
  res.send('hello express');
});

io.on('connection', (socket) => {
  console.log('connected');

  socket.on('send_message', (data) => {
    console.log('data: ', data);
    io.emit('received_message', data);
  });

  socket.on('close', () => {
    console.log('closed');
  });
});

server.listen(PORT, () => {
  console.log('サーバーを起動・・・');
});

const MONGO_URL = process.env.MONGO_URL;
mongoose.set('strictQuery', true);
mongoose
  .connect(MONGO_URL)
  .then(() => console.log('データベースに接続中・・・'))
  .catch((err) => console.log(err));

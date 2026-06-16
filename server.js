const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

// Автоматически определяем правильный путь к файлам
function getFilePath(fileName) {
    if (fs.existsSync(__dirname + '/public/' + fileName)) {
        return __dirname + '/public/' + fileName; // Если лежат в public
    }
    return __dirname + '/' + fileName; // Если лежат в корне проекта
}

// Раздача статики из обеих возможных папок
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname));

// Хранилище пользователей онлайн
let onlineUsers = {};

// 1. Главная страница (Форма входа)
app.get('/', (req, res) => {
    res.sendFile(getFilePath('index.html'));
});

// 2. Страница чата (Мессенджер)
app.get('/chat', (req, res) => {
    res.sendFile(getFilePath('chat.html'));
});

// 3. Работа с сокетами
io.on('connection', (socket) => {
    
    socket.on('store user', (username) => {
        if (!username) return;
        socket.username = username;
        onlineUsers[username] = socket.id;
        io.emit('online users', Object.keys(onlineUsers));
        console.log(`[Burmalda] Пользователь ${username} онлайн.`);
    });

    socket.on('join room', (partnerName) => {
        if (!socket.username || !partnerName) return;
        const roomName = [socket.username, partnerName].sort().join('_');
        socket.join(roomName);

        const partnerSocketId = onlineUsers[partnerName];
        if (partnerSocketId) {
            io.to(partnerSocketId).emit('force join room', roomName);
        }
    });

    socket.on('private chat message', (data) => {
        if (!socket.username || !data.room || !data.text) return;
        const messageData = {
            room: data.room,
            user: socket.username,
            text: data.text
        };
        io.to(data.room).emit('chat message', messageData);
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            delete onlineUsers[socket.username];
            io.emit('online users', Object.keys(onlineUsers));
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Сервер Burmalda ожил на порту ${PORT}`);
});

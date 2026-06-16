const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs'); // Модуль для работы с файлами

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

let userProfiles = {};
let messagesDatabase = {}; 
let activeConnections = {}; // Хранилище пар socket.id -> username для точного онлайна

// Функция для безопасной загрузки базы данных из файла при старте сервера
function loadDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const rawData = fs.readFileSync(DB_FILE, 'utf8');
            const parsed = JSON.parse(rawData);
            messagesDatabase = parsed.messagesDatabase || {};
            userProfiles = parsed.userProfiles || {};
            console.log('--- База данных BurmaldaGram успешно загружена из файла ---');
        } else {
            console.log('--- Файл базы данных не найден. Создана новая чистая БД ---');
        }
    } catch (e) {
        console.error('Ошибка при чтении базы данных с диска:', e);
    }
}

// Функция для сохранения сообщений и профилей на диск
function saveDatabase() {
    try {
        const dataToSave = {
            messagesDatabase,
            userProfiles
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
    } catch (e) {
        console.error('Ошибка при записи базы данных на диск:', e);
    }
}

// Загружаем данные перед запуском сокетов
loadDatabase();

app.use(express.static(__dirname));

app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });
app.get('/chat', (req, res) => { res.sendFile(path.join(__dirname, 'chat.html')); });

// Функция для генерации чистого списка уникальных юзеров в сети
function getOnlineUsersList() {
    return Array.from(new Set(Object.values(activeConnections)));
}

io.on('connection', (socket) => {
    console.log(`Новое подключение к BurmaldaGram (ID сокета: ${socket.id})`);

    socket.on('store user', (username) => {
        if (!username) return;
        socket.username = username;
        
        // Привязываем username к конкретному ID подключения
        activeConnections[socket.id] = username;
        
        // Отправляем точный список онлайн-пользователей
        io.emit('online users', getOnlineUsersList());

        // Собираем список диалогов пользователя из сохраненной базы данных
        let userDialogs = [];
        for (let roomName in messagesDatabase) {
            if (roomName.split('_').includes(username)) {
                const partner = roomName.replace(username, '').replace('_', '');
                if (partner && !userDialogs.includes(partner)) {
                    userDialogs.push(partner);
                }
            }
        }
        socket.emit('server dialogs list', userDialogs);
    });

    socket.on('join room', (partnerName) => {
        if (!socket.username || !partnerName) return;
        const roomName = [socket.username, partnerName].sort().join('_');
        socket.join(roomName);

        if (messagesDatabase[roomName]) {
            socket.emit('server history', messagesDatabase[roomName]);
        } else {
            socket.emit('server history', []);
        }
    });

    socket.on('private chat message', (data) => {
        if (!data) return;
        const room = data.room;
        const text = data.text;
        const user = data.user || socket.username; 
        const msgId = data.msgId || ('msg-' + Date.now());
        const isRead = data.isRead || false;

        if (!room || !text) return;

        const packetToSend = { 
            room, 
            text, 
            user, 
            msgId, 
            isRead, 
            time: data.time || Date.now(),
            reactions: data.reactions || {}
        };

        if (text !== '[TYPING_SIGNAL]' && text !== '[READ_SIGNAL]') {
            if (!messagesDatabase[room]) messagesDatabase[room] = [];
            
            if (!messagesDatabase[room].some(m => m.msgId === msgId)) {
                messagesDatabase[room].push(packetToSend);
                // Сохраняем изменения на жесткий диск сервера
                saveDatabase();
            }
            socket.to(room).emit('force join room', room);
        }

        io.to(room).emit('chat message', packetToSend);
    });

    socket.on('message_reaction', (data) => {
        if (!data || !data.room || !data.msgId) return;
        const { room, msgId, reaction, username } = data;

        if (messagesDatabase[room]) {
            const msg = messagesDatabase[room].find(m => m.msgId === msgId);
            if (msg) {
                if (!msg.reactions) msg.reactions = {};

                // Удаляем прошлую реакцию юзера
                Object.keys(msg.reactions).forEach(emoji => {
                    if (Array.isArray(msg.reactions[emoji])) {
                        msg.reactions[emoji] = msg.reactions[emoji].filter(u => u !== username);
                        if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
                    }
                });

                // Если пришел новый эмодзи — ставим его
                if (reaction) {
                    if (!msg.reactions[reaction]) msg.reactions[reaction] = [];
                    msg.reactions[reaction].push(username);
                }

                // Сохраняем обновленные реакции в файл
                saveDatabase();

                // Обновляем данные у всех клиентов в комнате
                io.to(room).emit('update_message_data', { room, msgId, reactions: msg.reactions });
            }
        }
    });

    socket.on('request profiles', () => { 
        socket.emit('all profiles data', userProfiles); 
    });

    socket.on('update profile', (packet) => {
        if (packet && packet.user && packet.data) {
            userProfiles[packet.user] = packet.data;
            // Сохраняем аватарки и био на диск, чтобы не слетали
            saveDatabase();
            socket.broadcast.emit('broadcast profile update', packet);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Пользователь отключился (ID сокета: ${socket.id})`);
        // Удаляем конкретное соединение из списка активных
        if (socket.id in activeConnections) {
            delete activeConnections[socket.id];
        }
        // Рассылаем обновленный и чистый онлайн-список оставшимся
        io.emit('online users', getOnlineUsersList());
    });
});

server.listen(PORT, () => { console.log(`BurmaldaGram запущен на порту ${PORT}`); });

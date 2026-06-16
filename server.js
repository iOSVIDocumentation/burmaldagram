const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

// Твоя рабочая ссылка на Google Apps Script
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyxM2xRV-07GZmQvcConc-4nZIjO3-xpVHAA3XKOnL1qJlR5_Vpye8ySu2KfPTIOUW0/exec';

// Автоматически определяем правильный путь к файлам
function getFilePath(fileName) {
    if (fs.existsSync(__dirname + '/public/' + fileName)) {
        return __dirname + '/public/' + fileName;
    }
    return __dirname + '/' + fileName;
}

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname));

let onlineUsers = {};

// Главная страница (Форма входа)
app.get('/', (req, res) => {
    res.sendFile(getFilePath('index.html'));
});

// Страница чата (Мессенджер)
app.get('/chat', (req, res) => {
    res.sendFile(getFilePath('chat.html'));
});

// Функция для отправки POST-запросов в твой Google Apps Script
async function callGoogleScript(payload) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка сети: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('[Google API Error]:', error.message);
        return { status: "error", message: "Ошибка связи с базой данных Google." };
    }
}

// Работа с сокетами
io.on('connection', (socket) => {
    
    // Принимаем username и password от клиента при авторизации
    socket.on('store user', async (username, password) => {
        if (!username) return;

        console.log(`[Auth Attempt] Пользователь ${username} пытается войти...`);

        // Отправляем данные в твой скрипт Google Таблиц
        const dbResult = await callGoogleScript({
            action: "login",
            username: username,
            password: password || "" // Передаем пароль, если он есть
        });

        // Если скрипт вернул ошибку (например, неверный пароль)
        if (dbResult.status === "error") {
            socket.emit('auth_result', { success: false, message: dbResult.message });
            return;
        }

        // Если всё ок (вход успешный или регистрация прошла)
        socket.username = username;
        onlineUsers[username] = socket.id;
        
        // Отвечаем клиенту, что вход одобрен, и передаем его контакты из столбца D
        socket.emit('auth_result', { 
            success: true, 
            message: dbResult.message,
            contacts: dbResult.contacts || "" 
        });

        // Оповещаем всех, что юзер зашел в сеть
        io.emit('online users', Object.keys(onlineUsers));
        console.log(`[Burmalda] Пользователь ${username} успешно авторизован и онлайн.`);
    });

    // Поиск пользователя в таблице при добавлении контакта
    socket.on('search_target_user', async (targetUser) => {
        if (!targetUser) return;
        
        const dbResult = await callGoogleScript({
            action: "check_user",
            targetUser: targetUser
        });
        
        socket.emit('search_result', dbResult);
    });

    // Синхронизация контактов (сохранение строки контактов в столбец D)
    socket.on('sync_user_contacts', async (data) => {
        if (!data || !data.currentUser) return;
        
        await callGoogleScript({
            action: "save_contacts",
            currentUser: data.currentUser,
            contacts: data.contacts || ""
        });
        console.log(`[Burmalda] Контакты для ${data.currentUser} сохранены в таблицу.`);
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

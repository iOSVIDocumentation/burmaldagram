function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

const audioSend = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
const audioReceiveInChat = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
const audioReceiveOutChat = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
audioSend.volume = 0.5; audioReceiveInChat.volume = 0.6; audioReceiveOutChat.volume = 0.8;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol) {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
}

let ringInterval;
function startRingtone() {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    ringInterval = setInterval(() => {
        playTone(480, 'sine', 1.5, 0.1); setTimeout(() => playTone(440, 'sine', 1.5, 0.1), 1600);
    }, 3500);
    playTone(480, 'sine', 1.5, 0.1); setTimeout(() => playTone(440, 'sine', 1.5, 0.1), 1600);
}
function stopRingtone() { clearInterval(ringInterval); }

const translations = {
    uk: { searchPlaceholder: "Введіть ім'я...", dialogsTitle: "Ваші діалоги", placeholderText: "BurmaldaGram Premium<br><span style='font-size: 13px; color: var(--text-muted);'>Оберіть чат 🔍</span>", backBtn: "⬅ Назад", inputPlaceholder: "Напишіть повідомлення...", btnSend: "Надіслати", settingsTitle: "⚙️ Налаштування", profileTitle: "👤 Профіль", profile: "Юзернейм:", profileName: "Нік:", status: "Статус:", online: "в мережі", offline: "офлайн", loginTime: "Вхід:", logoutBtn: "Вийти 🚪", emptyList: "Список порожній", selfChatError: "Не можна створювати чат із собою!", ctxReply: "Відповісти ↩", ctxEdit: "Редагувати ✏️", userNotFound: "Не знайдено!", ctxPin: "Закріпити повідомлення 📌", ctxUnpin: "Відкріпити повідомлення 🔓", ctxDeleteMy: "Видалити (своє) 🗑", chatStatusOnline: "● онлайн", chatStatusOffline: "офлайн", typingText: "пише...", uploadBtn: "📁 Завантажити", bioPlaceholder: "Про себе:", bioEmpty: "Пусто", replyPrefix: "Відповідь на: ", pinnedLabel: "Закріплено", blockedMeText: "Цей користувач вас заблокував.", themeTitle: "Тема оформлення:" },
    ru: { searchPlaceholder: "Введите имя...", dialogsTitle: "Диалоги", placeholderText: "BurmaldaGram Premium", backBtn: "⬅ Назад", inputPlaceholder: "Напишите...", btnSend: "Отправить", settingsTitle: "⚙️ Настройки", profileTitle: "👤 Профиль", profile: "Юзернейм:", profileName: "Ник:", status: "Статус:", online: "в сети", offline: "офлайн", loginTime: "Вход:", logoutBtn: "Выйти 🚪", emptyList: "Пусто", selfChatError: "Нельзя с собой!", ctxReply: "Ответить ↩", ctxEdit: "Изменить ✏️", userNotFound: "Не найден!", ctxPin: "Закрепить 📌", ctxUnpin: "Открепить 🔓", ctxDeleteMy: "Удалить 🗑", chatStatusOnline: "● онлайн", chatStatusOffline: "офлайн", typingText: "печатает...", uploadBtn: "📁 Загрузить", bioPlaceholder: "О себе:", bioEmpty: "Пусто", replyPrefix: "Ответ: ", pinnedLabel: "Закреплено", blockedMeText: "Этот пользователь вас заблокировал.", themeTitle: "Тема оформления:" },
    en: { searchPlaceholder: "Search...", dialogsTitle: "Chats", placeholderText: "BurmaldaGram Premium", backBtn: "⬅ Back", inputPlaceholder: "Message...", btnSend: "Send", settingsTitle: "⚙️ Settings", profileTitle: "👤 Profile", profile: "ID:", profileName: "Name:", status: "Status:", online: "online", offline: "offline", loginTime: "Login:", logoutBtn: "Log out 🚪", emptyList: "Empty", selfChatError: "Can't chat with yourself!", ctxReply: "Reply ↩", ctxEdit: "Edit ✏️", userNotFound: "Not found!", ctxPin: "Pin 📌", ctxUnpin: "Unpin 🔓", ctxDeleteMy: "Delete 🗑", chatStatusOnline: "● online", chatStatusOffline: "offline", typingText: "typing...", uploadBtn: "📁 Upload", bioPlaceholder: "Bio:", bioEmpty: "Empty", replyPrefix: "Reply: ", pinnedLabel: "Pinned", blockedMeText: "You are blocked by this user.", themeTitle: "Theme:" }
};

const GLOW_COLORS = {
    'green': '#4cd964',
    'red': '#ff3b30',
    'blue': '#0088cc',
    'dark': '#333333',
    'white': '#ffffff',
    'yellow': '#ffcc00'
};

const urlParams = new URLSearchParams(window.location.search);
const authToken = urlParams.get('auth');
let myNick = 'Анонім';
let authorized = false;
let sessionTimeString = 'Невідомо';

if (authToken) {
    try {
        const decoded = decodeURIComponent(atob(authToken));
        const parts = decoded.split('_');
        myNick = parts[0]; 
        const loginTime = parseInt(parts[1]);
        if (!isNaN(loginTime)) sessionTimeString = new Date(loginTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + " " + new Date(loginTime).toLocaleDateString();
        if (Date.now() - loginTime < 86400000 && myNick) authorized = true;
    } catch (e) { console.error("Помилка авторизації:", e); }
} else {
    myNick = prompt("Введіть ваш нікнейм для входу (залиште порожнім для 'Анонім'):") || "Анонім";
    authorized = true;
    sessionTimeString = new Date().toLocaleTimeString();
}

if (!authorized) { 
    alert('Доступ заблоковано!'); 
    window.location.href = '/'; 
} else { 
    document.getElementById('main-body').style.display = 'flex'; 
}

function getStorageKey(key) { return `${key}_${myNick}`; }

let currentLang = localStorage.getItem('burmalda_lang') || 'uk';
let currentTheme = localStorage.getItem('burmalda_theme') || 'theme-dark';
let replyTargetMsgId = null;
let editTargetMsgId = null;
let messageToForward = null;
let activeChats = JSON.parse(localStorage.getItem(getStorageKey('burmalda_chat_list'))) || [];
let glowingChats = JSON.parse(localStorage.getItem(getStorageKey('burmalda_glow_chats'))) || {};
let pinnedMessages = JSON.parse(localStorage.getItem(getStorageKey('burmalda_pinned_data'))) || {};
let currentPinIndex = 0;
let chatSettings = JSON.parse(localStorage.getItem(getStorageKey('burmalda_chat_settings'))) || {};
let myCustomStickers = JSON.parse(localStorage.getItem(getStorageKey('burmalda_custom_stickers'))) || [];
const ALL_EMOJIS = ['👍','❤️','😂','😮','😢','🙏','😎','🔥','💯','🎉','💩','👽','👻','🤡','🤝','💪','👀','🧠','Ukraine','🍉'];

let isMultiSelectMode = false;
let selectedMessages = new Set();
let currentPaginationLimit = 30; 
let myMessageTimestamps = []; // Антиспам клієнтський масив

let chatBackgroundImage = localStorage.getItem(getStorageKey('burmalda_bg_image')) || '';
let chatBackgroundBlur = localStorage.getItem(getStorageKey('burmalda_bg_blur')) || '0';

document.body.className = currentTheme;
document.getElementById('theme-select').value = currentTheme;

let socket;
if (typeof io !== 'undefined') {
    socket = io();
} else {
    console.warn("Socket.io не підключено. Чат працює в офлайн-режимі.");
    socket = { on: () => {}, emit: () => {} };
}

let currentRoom = null;
let currentActiveChatPartner = null;
let onlineUsers = [];
let savedMessages = {};

function safeSaveHistory() {
    try { localStorage.setItem(getStorageKey('burmalda_msg_history'), JSON.stringify(savedMessages)); } 
    catch(e) { console.warn("localStorage переповнено! Дані не збережено локально."); }
}

try {
    const rawHistory = localStorage.getItem(getStorageKey('burmalda_msg_history'));
    if (rawHistory) savedMessages = typeof rawHistory === 'string' ? JSON.parse(rawHistory) : rawHistory;
} catch (e) { savedMessages = {}; }

let localProfiles = JSON.parse(localStorage.getItem('burmalda_profiles_data')) || {};

const searchToggleBtn = document.getElementById('search-toggle-btn');
const searchFrame = document.getElementById('search-frame');
const searchInput = document.getElementById('search-input');
const searchDropdown = document.getElementById('search-results-dropdown');
const chatsList = document.getElementById('chats-list');
const chatPlaceholder = document.getElementById('no-chat-placeholder');
const chatArea = document.getElementById('chat-area');
const chatTitleText = document.getElementById('chat-title-text');
const typingStatusEl = document.getElementById('chat-typing-status');
const messagesContainer = document.getElementById('messages');
const input = document.getElementById('input');
const button = document.getElementById('button');
const contextMenu = document.getElementById('global-context-menu');
const settingsToggleBtn = document.getElementById('settings-toggle-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsCloseBtn = document.getElementById('settings-close-btn');
const pinnedMessageBar = document.getElementById('pinned-message-bar');
const pinnedBarTextContent = document.getElementById('pinned-bar-text-content');
const pinCounterBadge = document.getElementById('pin-counter-badge');
const stickerMenu = document.getElementById('sticker-menu');

// Додаємо обробку Shift+Enter
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('form').dispatchEvent(new Event('submit', { cancelable: true }));
    }
});

settingsToggleBtn.onclick = () => { openMyProfile(); };
settingsCloseBtn.onclick = () => { settingsModal.classList.remove('active'); };

document.getElementById('btn-back').onclick = () => { 
    if (document.body.classList.contains('chat-opened')) window.history.back();
};

window.onpopstate = function(event) { 
    if (document.body.classList.contains('chat-opened')) { 
        document.body.classList.remove('chat-opened');
        currentActiveChatPartner = null; currentRoom = null;
        chatArea.style.display = 'none'; chatPlaceholder.style.display = 'block'; 
        const cleanUrl = window.location.pathname + '?auth=' + (urlParams.get('auth') || '');
        window.history.replaceState({}, "", cleanUrl); 
        renderChatsList(); 
    } 
};

const activityLabels = {
    'typing': "пише...", 'searching_sticker': "шукає стікер...",
    'recording_audio': "записує аудіо...", 'recording_video': "знімає відео..."
};

function emitActivity(activityType) {
    if (!currentRoom) return;
    socket.emit('user_activity', { room: currentRoom, user: myNick, activity: activityType });
}

function openImageViewer(src) {
    document.getElementById('image-viewer-img').src = src;
    document.getElementById('image-viewer-modal').classList.add('active');
}
function closeImageViewer() {
    document.getElementById('image-viewer-modal').classList.remove('active');
    document.getElementById('image-viewer-img').src = '';
}

function formatDateDivider(ts) { return new Date(ts).toLocaleDateString(currentLang, {day: 'numeric', month: 'long'}); }

function saveActiveChats() {
    localStorage.setItem(getStorageKey('burmalda_chat_list'), JSON.stringify(activeChats));
    socket.emit('sync_contacts', { user: myNick, chats: activeChats });
}

function getVisibleName(username) { 
    if (!username) return "Невідомо";
    const uData = localProfiles[username];
    if (uData && uData.displayName && uData.displayName.trim() !== '') return uData.displayName.trim(); 
    return username;
}

function getAvatarHTML(username, cssClass = 'avatar') { 
    if (!username) return `<div class="${cssClass}"></div>`;
    const uData = localProfiles[username] || {};
    const isOnline = onlineUsers.includes(username);
    
    let glowC = uData.glowColor ? GLOW_COLORS[uData.glowColor] : (isOnline ? 'var(--accent)' : 'rgba(128,128,128,0.5)');
    if(!isOnline && !uData.glowColor) glowC = 'rgba(128,128,128,0.5)';
    const glowStyle = `box-shadow: 0 0 12px ${glowC}; border: 2px solid ${glowC};`;
    
    if (uData.avatar && uData.avatar.startsWith('data:image')) { 
        return `<img src="${uData.avatar}" class="${cssClass}" id="av-node-${username}" alt="" style="${glowStyle}">`;
    } 
    const visibleName = getVisibleName(username);
    const firstLetter = visibleName ? visibleName.charAt(0) : '?';
    const placeholderClass = cssClass === 'avatar' ? 'avatar-placeholder' : 'modal-avatar-placeholder';
    const colors = ['#0088cc', '#4cd964', '#ff3b30', '#ffcc00', '#5856d6', '#ff2d55', '#af52de'];
    let charCodeSum = 0;
    for (let i = 0; i < username.length; i++) charCodeSum += username.charCodeAt(i);
    const pickedColor = colors[charCodeSum % colors.length];
    return `<div class="${placeholderClass}" id="av-node-${username}" style="background-color: ${pickedColor}; ${glowStyle}">${firstLetter}</div>`;
}

function getTinyAvatarHTML(username) {
    if (!username) return '';
    const uData = localProfiles[username] || {};
    if (uData.avatar && uData.avatar.startsWith('data:image')) {
        return `<img src="${uData.avatar}" style="width:16px;height:16px;border-radius:50%;object-fit:cover;border:1px solid rgba(255,255,255,0.2);" title="${escapeHTML(getVisibleName(username))}">`;
    }
    const visibleName = getVisibleName(username);
    const firstLetter = visibleName ? visibleName.charAt(0) : '?';
    const colors = ['#0088cc', '#4cd964', '#ff3b30', '#ffcc00', '#5856d6', '#ff2d55', '#af52de'];
    let charCodeSum = 0;
    for (let i = 0; i < username.length; i++) charCodeSum += username.charCodeAt(i);
    const pickedColor = colors[charCodeSum % colors.length];
    return `<div style="width:16px;height:16px;border-radius:50%;background-color:${pickedColor};color:#fff;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:bold;border:1px solid rgba(255,255,255,0.2);" title="${escapeHTML(getVisibleName(username))}">${firstLetter}</div>`;
}

function applyCustomBackground() {
    const mainChat = document.getElementById('chat-main');
    if (chatBackgroundImage && mainChat) {
        mainChat.style.backgroundImage = `url(${chatBackgroundImage})`;
        mainChat.style.backgroundSize = 'cover';
        mainChat.style.backgroundPosition = 'center';
        mainChat.style.boxShadow = 'inset 0 0 80px rgba(0,0,0,0.8), inset 0 0 30px rgba(255,255,255,0.1)';
        mainChat.style.backdropFilter = `blur(${chatBackgroundBlur}px)`;
        mainChat.style.webkitBackdropFilter = `blur(${chatBackgroundBlur}px)`; 
    } else if (mainChat) {
        mainChat.style.backgroundImage = '';
        mainChat.style.boxShadow = '';
        mainChat.style.backdropFilter = '';
        mainChat.style.webkitBackdropFilter = '';
    }
}

function applyLanguage() { 
    const t = translations[currentLang];
    document.getElementById('lang-select').value = currentLang;
    document.getElementById('my-profile-name').innerHTML = `${getAvatarHTML(myNick)} <span>${getVisibleName(myNick)}</span>`;
    searchInput.placeholder = t.searchPlaceholder; document.getElementById('lbl-dialogs').textContent = t.dialogsTitle; 
    document.getElementById('placeholder-text').innerHTML = t.placeholderText; document.getElementById('btn-back').textContent = t.backBtn;
    input.placeholder = t.inputPlaceholder; button.textContent = t.btnSend;
    document.getElementById('lbl-profile-name').textContent = t.profileName; document.getElementById('lbl-profile').textContent = t.profile; 
    document.getElementById('lbl-status').textContent = t.status; document.getElementById('lbl-bio-title').textContent = t.bioPlaceholder;
    document.getElementById('lbl-time').textContent = t.loginTime; document.getElementById('btn-logout').textContent = t.logoutBtn;
    document.getElementById('lbl-upload-btn').textContent = t.uploadBtn; document.getElementById('lbl-theme-title').textContent = t.themeTitle;
    
    if (settingsModal.classList.contains('active')) { 
        const openedNick = document.getElementById('info-nick').textContent;
        const isMe = (openedNick === myNick);
        document.getElementById('modal-title-text').textContent = isMe ? t.settingsTitle : t.profileTitle; 
        const isOnline = onlineUsers.includes(openedNick);
        const statusLabel = document.getElementById('lbl-online-status'); 
        statusLabel.textContent = isOnline ? t.online : t.offline; statusLabel.style.color = isOnline ? '#4cd964' : '#ff3b30';
    } 
    renderChatsList(); loadMessagesHistory(); renderStickersList();
    applyCustomBackground();
    updateChatTitle();
}

function changeLanguage(lang) { currentLang = lang; localStorage.setItem('burmalda_lang', lang); applyLanguage(); }
function changeTheme(themeVal) { currentTheme = themeVal; document.body.className = themeVal; localStorage.setItem('burmalda_theme', themeVal); }

function openMyProfile() { 
    const t = translations[currentLang]; document.getElementById('info-nick').textContent = myNick; 
    const myData = localProfiles[myNick] || { avatar: '', bio: '', displayName: '', banner: '', glowColor: '' }; 
    document.getElementById('profile-display-name').disabled = false; document.getElementById('profile-display-name').value = myData.displayName || myNick; 
    document.getElementById('profile-desc').disabled = false;
    document.getElementById('profile-desc').value = myData.bio || ''; document.getElementById('profile-desc').placeholder = t.bioEmpty; 
    document.getElementById('modal-avatar-view').innerHTML = getAvatarHTML(myNick, 'modal-avatar'); document.getElementById('info-login-time').textContent = sessionTimeString; 
    document.getElementById('lbl-upload-btn').style.display = 'block';
    document.getElementById('btn-logout').style.display = 'block'; 
    document.getElementById('lang-select-block').style.display = 'block'; document.getElementById('theme-select-block').style.display = 'block'; document.getElementById('login-time-block').style.display = 'block'; document.getElementById('sticker-creator-block').style.display = 'block';
    
    const extraSettings = document.getElementById('extra-settings-block');
    if(extraSettings) extraSettings.style.display = 'block';
    const profileOptions = document.getElementById('my-profile-customizations');
    if(profileOptions) profileOptions.style.display = 'block';
    
    applyBanner(myNick);
    applyLanguage(); settingsModal.classList.add('active');
}

function openPartnerProfile() { 
    if (!currentActiveChatPartner) return;
    const t = translations[currentLang]; document.getElementById('info-nick').textContent = currentActiveChatPartner;
    const pData = localProfiles[currentActiveChatPartner] || { avatar: '', bio: '', displayName: '', banner: '', glowColor: '' };
    document.getElementById('profile-display-name').disabled = true; document.getElementById('profile-display-name').value = pData.displayName || currentActiveChatPartner; 
    document.getElementById('profile-desc').disabled = true; document.getElementById('profile-desc').value = pData.bio || ''; document.getElementById('profile-desc').placeholder = t.bioEmpty;
    document.getElementById('modal-avatar-view').innerHTML = getAvatarHTML(currentActiveChatPartner, 'modal-avatar'); 
    document.getElementById('lbl-upload-btn').style.display = 'none';
    document.getElementById('btn-logout').style.display = 'none'; 
    document.getElementById('lang-select-block').style.display = 'none'; document.getElementById('theme-select-block').style.display = 'none'; document.getElementById('login-time-block').style.display = 'none'; document.getElementById('sticker-creator-block').style.display = 'none';
    
    const extraSettings = document.getElementById('extra-settings-block');
    if(extraSettings) extraSettings.style.display = 'none';
    const profileOptions = document.getElementById('my-profile-customizations');
    if(profileOptions) profileOptions.style.display = 'none';

    applyBanner(currentActiveChatPartner);
    applyLanguage(); settingsModal.classList.add('active');
}

function applyBanner(username) {
    const uData = localProfiles[username] || {};
    const bannerEl = document.getElementById('profile-banner-view');
    if (bannerEl) {
        if (uData.banner) {
            bannerEl.style.backgroundImage = `url(${uData.banner})`;
            bannerEl.style.backgroundSize = 'cover';
            bannerEl.style.backgroundPosition = 'center';
            bannerEl.style.height = '120px';
            bannerEl.style.borderRadius = '8px';
            bannerEl.style.marginBottom = '10px';
        } else {
            bannerEl.style.backgroundImage = 'none';
            bannerEl.style.height = '0px';
            bannerEl.style.marginBottom = '0px';
        }
    }
}

function saveMyDisplayName(val) { 
    if (!localProfiles[myNick]) localProfiles[myNick] = {}; localProfiles[myNick].displayName = val; 
    localStorage.setItem('burmalda_profiles_data', JSON.stringify(localProfiles));
    socket.emit('update_profile', { username: myNick, data: localProfiles[myNick] }); 
    document.getElementById('my-profile-name').innerHTML = `${getAvatarHTML(myNick)} <span>${getVisibleName(myNick)}</span>`;
}

function saveMyBio(val) { 
    if (!localProfiles[myNick]) localProfiles[myNick] = {}; localProfiles[myNick].bio = val; 
    localStorage.setItem('burmalda_profiles_data', JSON.stringify(localProfiles));
    socket.emit('update_profile', { username: myNick, data: localProfiles[myNick] });
}

window.changeGlowColor = function(colorStr) {
    if (!localProfiles[myNick]) localProfiles[myNick] = {};
    localProfiles[myNick].glowColor = colorStr;
    localStorage.setItem('burmalda_profiles_data', JSON.stringify(localProfiles));
    socket.emit('update_profile', { username: myNick, data: localProfiles[myNick] });
    document.getElementById('modal-avatar-view').innerHTML = getAvatarHTML(myNick, 'modal-avatar');
    document.getElementById('my-profile-name').innerHTML = `${getAvatarHTML(myNick)} <span>${getVisibleName(myNick)}</span>`;
    renderChatsList();
};

window.handleBannerUpload = function(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    compressImage(file, (compressedBase64) => {
        if (!localProfiles[myNick]) localProfiles[myNick] = {};
        localProfiles[myNick].banner = compressedBase64;
        localStorage.setItem('burmalda_profiles_data', JSON.stringify(localProfiles));
        socket.emit('update_profile', { username: myNick, data: localProfiles[myNick] });
        applyBanner(myNick);
    });
};

function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width; let height = img.height;
            const maxSize = 1200;
            if (width > height && width > maxSize) { height *= maxSize / width; width = maxSize; }
            else if (height > maxSize) { width *= maxSize / height; height = maxSize; }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            callback(canvas.toDataURL('image/jpeg', 0.8));
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

function handleAvatarUpload(inputEl) { 
    const file = inputEl.files[0];
    if (!file) return;
    compressImage(file, (compressedBase64) => {
        if (!localProfiles[myNick]) localProfiles[myNick] = {};
        localProfiles[myNick].avatar = compressedBase64; 
        localStorage.setItem('burmalda_profiles_data', JSON.stringify(localProfiles)); 
        socket.emit('update_profile', { username: myNick, data: localProfiles[myNick] }); 
        document.getElementById('modal-avatar-view').innerHTML = getAvatarHTML(myNick, 'modal-avatar'); 
        document.getElementById('my-profile-name').innerHTML = `${getAvatarHTML(myNick)} <span>${getVisibleName(myNick)}</span>`;
    });
}

function uploadCustomStickers(inputEl) {
    if (!inputEl.files || inputEl.files.length === 0) return;
    Array.from(inputEl.files).forEach(file => {
        compressImage(file, (compressedBase64) => {
            myCustomStickers.push(compressedBase64); 
            localStorage.setItem(getStorageKey('burmalda_custom_stickers'), JSON.stringify(myCustomStickers)); 
            renderStickersList();
        });
    });
    inputEl.value = '';
}

function renderStickersList() {
    const preview = document.getElementById('my-stickers-preview'); 
    if (preview) preview.innerHTML = '';
    myCustomStickers.forEach((st, idx) => {
        const img = document.createElement('img'); img.src = st; img.className = 'pack-item-preview';
        img.onclick = () => { if (confirm("Видалити цей стікер?")) { myCustomStickers.splice(idx, 1); localStorage.setItem(getStorageKey('burmalda_custom_stickers'), JSON.stringify(myCustomStickers)); renderStickersList(); } };
        if (preview) preview.appendChild(img);
    });
    
    stickerMenu.innerHTML = '';
    if (myCustomStickers.length === 0) { 
        stickerMenu.innerHTML = '<span style="color:var(--text-muted); font-size:12px;">У вас немає стікерів. Додайте їх в налаштуваннях.</span>';
    } else { 
        myCustomStickers.forEach(st => { 
            const img = document.createElement('img'); 
            img.src = st; 
            img.className = 'sticker-item'; 
            img.onclick = (e) => { e.stopPropagation(); sendSpecialMessage(st, 'sticker'); }; 
            stickerMenu.appendChild(img); 
        });
    }
}

function toggleStickerMenu() { 
    stickerMenu.classList.toggle('active'); 
    if (stickerMenu.classList.contains('active')) emitActivity('searching_sticker'); else emitActivity('none');
}

searchToggleBtn.onclick = () => { searchFrame.classList.toggle('active');
    if (searchFrame.classList.contains('active')) searchInput.focus(); 
};

let searchTimeout; let latestSearchUsers = []; let latestSearchMessages = [];
searchInput.oninput = (e) => {
    clearTimeout(searchTimeout); const val = e.target.value.trim();
    if (val.length > 0) {
        searchTimeout = setTimeout(() => { socket.emit('global_search', { query: val }); socket.emit('search_users', { query: val }); }, 300);
    } else { searchDropdown.style.display = 'none'; latestSearchUsers = []; latestSearchMessages = []; }
};

function renderCombinedSearchResults() {
    searchDropdown.innerHTML = '';
    if (latestSearchUsers.length === 0 && latestSearchMessages.length === 0) {
        searchDropdown.innerHTML = `<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:12px;">Нікого не знайдено</div>`;
        searchDropdown.style.display = 'block'; return;
    }

    if (latestSearchUsers.length > 0) {
        const sec = document.createElement('div');
        sec.className = 'search-section-title'; sec.textContent = 'Користувачі'; searchDropdown.appendChild(sec);
        latestSearchUsers.forEach(user => {
            if (!localProfiles[user.username]) localProfiles[user.username] = {}; 
            localProfiles[user.username] = { ...localProfiles[user.username], ...user };
            
            const item = document.createElement('div'); item.className = 'search-result-item';
            item.innerHTML = `${getAvatarHTML(user.username)}<div><div style="font-weight:bold;font-size:13px;color:var(--text-main);">${escapeHTML(user.displayName)}</div><div style="font-size:11px;color:var(--text-muted);">@${escapeHTML(user.username)}</div></div>`;
           
            item.onclick = () => {
                 searchInput.value = ''; searchDropdown.style.display = 'none'; searchFrame.classList.remove('active');
                if (user.username === myNick) { alert(translations[currentLang].selfChatError); return; }
                if (!activeChats.includes(user.username)) { activeChats.push(user.username); saveActiveChats(); } openChatWith(user.username);
            };
            searchDropdown.appendChild(item);
        });
    }

    if (latestSearchMessages.length > 0) {
        const sec = document.createElement('div');
        sec.className = 'search-section-title'; sec.textContent = 'Повідомлення'; searchDropdown.appendChild(sec);
        latestSearchMessages.forEach(msg => {
            const item = document.createElement('div'); item.className = 'search-result-item';
            const partnerName = msg.partner === myNick ? "Ви" : getVisibleName(msg.partner);
            const senderName = msg.from === myNick ? "Ви" : getVisibleName(msg.from);
            item.innerHTML = `${getAvatarHTML(msg.partner)}<div style="overflow: hidden; width: 100%;"><div style="font-weight:bold;font-size:13px;color:var(--accent);">${escapeHTML(partnerName)}</div><div style="font-size:11px;color:var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><strong>${escapeHTML(senderName)}:</strong> ${escapeHTML(msg.text)}</div></div>`;
    
            item.onclick = () => {
                searchInput.value = ''; searchDropdown.style.display = 'none'; searchFrame.classList.remove('active');
                if (!activeChats.includes(msg.partner)) { activeChats.push(msg.partner); saveActiveChats(); } openChatWith(msg.partner);
            };
            searchDropdown.appendChild(item);
        });
    }
    searchDropdown.style.display = 'block';
}

socket.on('global_search_results', (data) => { latestSearchMessages = data.messages || []; renderCombinedSearchResults(); });
socket.on('search_results', (data) => { latestSearchUsers = data.results || []; renderCombinedSearchResults(); });

function renderChatsList() { 
    chatsList.innerHTML = '';
    const archiveZone = document.getElementById('archive-reveal-zone');
    if (archiveZone) archiveZone.style.display = 'none'; 
    const archiveContainer = document.getElementById('archive-container');
    if (archiveContainer) archiveContainer.style.display = 'none';
    
    let filteredChats = activeChats.filter(c => {
        const folder = chatSettings[c]?.folder || 'all';
        return folder !== 'archive';
    });
    
    if (filteredChats.length === 0) { 
        chatsList.innerHTML = `<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:14px;">${translations[currentLang].emptyList}</div>`;
    } else {
        const sortedChats = filteredChats.sort((a, b) => { const pinA = chatSettings[a]?.pinned ? 1 : 0; const pinB = chatSettings[b]?.pinned ? 1 : 0; return pinB - pinA; });
        sortedChats.forEach(user => renderChatDOM(user, chatsList));
    }
}

function renderChatDOM(user, targetContainer) {
    if(!targetContainer) return;
    const isOnline = onlineUsers.includes(user);
    let statusText = isOnline ? translations[currentLang].chatStatusOnline : translations[currentLang].chatStatusOffline; 
    
    if (!isOnline && localProfiles[user] && localProfiles[user].lastSeen) {
        const diff = Date.now() - localProfiles[user].lastSeen;
        if (diff < 60000) statusText = "щойно";
        else if (diff < 3600000) statusText = `${Math.floor(diff/60000)} хв тому`;
        else if (diff < 86400000) statusText = `${Math.floor(diff/3600000)} год тому`;
    }

    const prefs = chatSettings[user] || {};
    const activeClass = (currentActiveChatPartner === user) ? 'active' : '';
    const glowClass = glowingChats[user] ? 'glow-active' : '';
    const blockedClass = prefs.blocked ? 'blocked' : '';
    const item = document.createElement('div');
    item.className = `chat-item ${activeClass} ${glowClass} ${blockedClass}`;
    
    let flagsHtml = ''; 
    if (prefs.pinned) flagsHtml += '📌'; if (prefs.muted) flagsHtml += '🔇';
    if (prefs.blocked) flagsHtml += '🚫';
    
    item.innerHTML = `<div class="chat-info-block">${getAvatarHTML(user)}<div><div style="font-weight:600; font-size:14px;">${escapeHTML(getVisibleName(user))}</div><div id="bio-${user}" style="font-size:12px; color:var(--text-muted);">${escapeHTML(localProfiles[user]?.bio || '')}</div></div></div><div class="chat-flags">${flagsHtml}</div><div class="status-dot ${isOnline ? 'online' : ''}">${statusText}</div>`;
    
    item.oncontextmenu = (e) => { 
        e.preventDefault();
        showContextMenu(e, [
            { text: prefs.pinned ? "Відкріпити чат" : "📌 Закріпити чат", action: () => toggleChatPref(user, 'pinned') },
            { text: prefs.muted ? "Увімкнути звук" : "🔇 Вимкнути звук", action: () => toggleChatPref(user, 'muted') },
            { text: prefs.blocked ? "Розблокувати" : "🚫 Заблокувати", action: () => toggleChatPref(user, 'blocked') },
            { text: "📦 В архів", action: () => { 
                if (!chatSettings[user]) chatSettings[user] = { pinned: false, muted: false, blocked: false };
                chatSettings[user].folder = 'archive';
                localStorage.setItem(getStorageKey('burmalda_chat_settings'), JSON.stringify(chatSettings));
                if(currentActiveChatPartner === user) {
                    currentActiveChatPartner = null; currentRoom = null; chatArea.style.display = 'none'; chatPlaceholder.style.display = 'block';
                }
                renderChatsList(); 
            } },
            { text: translations[currentLang].ctxDeleteMy, class: 'delete-btn', action: () => { deleteChatLocally(user); } }
        ]);
    };
    item.onclick = () => { if (glowingChats[user]) { delete glowingChats[user]; localStorage.setItem(getStorageKey('burmalda_glow_chats'), JSON.stringify(glowingChats)); } openChatWith(user); };
    targetContainer.appendChild(item);
}

function toggleChatMenu(e) { e.stopPropagation(); const menu = document.getElementById('chat-options-menu'); menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; }

function toggleChatPref(user, prefKey) {
    if (!chatSettings[user]) chatSettings[user] = { pinned: false, muted: false, blocked: false, folder: 'all' };
    chatSettings[user][prefKey] = !chatSettings[user][prefKey]; localStorage.setItem(getStorageKey('burmalda_chat_settings'), JSON.stringify(chatSettings));
    
    if (prefKey === 'blocked' && chatSettings[user].blocked && currentActiveChatPartner === user) { input.disabled = true;
    input.placeholder = "Користувач заблокований"; button.disabled = true; } 
    else if (prefKey === 'blocked' && !chatSettings[user].blocked && currentActiveChatPartner === user) { input.disabled = false;
    input.placeholder = translations[currentLang].inputPlaceholder; button.disabled = false; }
    updateChatHeaderUI(); renderChatsList(); document.getElementById('chat-options-menu').style.display = 'none';
}

function clearChatHistory() {
    if(!confirm("Очистити історію цього чату для обох користувачів?")) return;
    socket.emit('clear_chat_history', { room: currentRoom });
    document.getElementById('chat-options-menu').style.display = 'none';
}

socket.on('chat_history_cleared', (data) => {
    if (savedMessages[data.room]) {
        delete savedMessages[data.room]; 
        safeSaveHistory(); 
        if (currentRoom === data.room) {
            loadMessagesHistory();
        }
    }
});

function deleteChatLocally(username) { 
    activeChats = activeChats.filter(c => c !== username);
    saveActiveChats();
    if (currentActiveChatPartner === username) { currentActiveChatPartner = null; currentRoom = null; chatArea.style.display = 'none'; chatPlaceholder.style.display = 'block'; } renderChatsList();
}

function updateChatHeaderUI() {
    if (!currentActiveChatPartner) return;
    const prefs = chatSettings[currentActiveChatPartner] || {};
    document.getElementById('btn-mute-user').textContent = prefs.muted ? "🔔 Увімкнути звук" : "🔕 Вимкнути звук";
    document.getElementById('btn-block-user').textContent = prefs.blocked ? "✅ Розблокувати" : "🚫 Заблокувати";
}

function updateChatTitle() {
    if (!currentActiveChatPartner) return;
    const isOnline = onlineUsers.includes(currentActiveChatPartner);
    let statusHtml = '';
    if (isOnline) {
        statusHtml = '<small style="color:#4cd964; font-size:11px;">● онлайн</small>';
    } else {
        const pData = localProfiles[currentActiveChatPartner];
        if (pData && pData.lastSeen) {
            const diff = Date.now() - pData.lastSeen;
            let seenTxt = "нещодавно";
            if (diff < 60000) seenTxt = "щойно";
            else if (diff < 3600000) seenTxt = `${Math.floor(diff/60000)} хв тому`;
            else if (diff < 86400000) seenTxt = `${Math.floor(diff/3600000)} год тому`;
            else seenTxt = new Date(pData.lastSeen).toLocaleDateString(currentLang);
            statusHtml = `<small style="color:var(--text-muted); font-size:11px;">був(ла) ${seenTxt}</small>`;
        } else {
            statusHtml = '<small style="color:var(--text-muted); font-size:11px;">офлайн</small>';
        }
    }
    chatTitleText.innerHTML = `${getAvatarHTML(currentActiveChatPartner)} <span>${escapeHTML(getVisibleName(currentActiveChatPartner))} ${statusHtml}</span>`;
}

function openChatWith(username) { 
    currentActiveChatPartner = username; const roomSorted = [myNick, username].sort(); currentRoom = `room_${roomSorted[0]}_${roomSorted[1]}`; 
    document.body.classList.add('chat-opened');
    chatPlaceholder.style.display = 'none'; chatArea.style.display = 'flex'; 
    updateChatTitle();
    const cleanUrl = window.location.pathname + '?auth=' + (urlParams.get('auth') || '') + '&chat=' + username; window.history.pushState({}, "", cleanUrl);
    socket.emit('request_history', { room: currentRoom });
    socket.emit('request_profile', { username: username });
    socket.emit('join_room', { room: currentRoom, user: myNick });
    socket.emit('mark_read', { room: currentRoom, reader: myNick });
    
    const prefs = chatSettings[username] || {};
    if (prefs.blocked) { input.disabled = true; input.placeholder = "Користувач заблокований"; button.disabled = true; } 
    else { input.disabled = false; input.placeholder = translations[currentLang].inputPlaceholder; button.disabled = false; }

    updateChatHeaderUI(); cancelAction(); currentPinIndex = 0; renderPinnedBar(); loadMessagesHistory(); renderChatsList();
}

socket.on('room_history', (historyData) => {
    if (!currentRoom || !historyData) return;
    savedMessages[currentRoom] = historyData;
    safeSaveHistory();
    loadMessagesHistory();
});

function renderPinnedBar() {
    if (!currentRoom) return;
    if (!Array.isArray(pinnedMessages[currentRoom])) { pinnedMessages[currentRoom] = pinnedMessages[currentRoom] ? [pinnedMessages[currentRoom]] : []; }
    const pins = pinnedMessages[currentRoom];
    if (pins && pins.length > 0) {
        if (currentPinIndex >= pins.length) currentPinIndex = 0;
        const currentPin = pins[currentPinIndex]; pinCounterBadge.textContent = `${currentPinIndex + 1}/${pins.length}`;
        pinnedBarTextContent.innerHTML = escapeHTML(currentPin.text); pinnedMessageBar.style.display = 'flex';
    } else { pinnedMessageBar.style.display = 'none'; }
}

function cyclePinnedMessages() { const pins = pinnedMessages[currentRoom] || [];
    if (pins.length > 1) { currentPinIndex = (currentPinIndex + 1) % pins.length; renderPinnedBar(); } scrollToPinnedMessage();
}

function pinMessage(msgId, text) {
    if (!Array.isArray(pinnedMessages[currentRoom])) pinnedMessages[currentRoom] = [];
    if (!pinnedMessages[currentRoom].some(p => p.id === msgId)) {
        pinnedMessages[currentRoom].push({ id: msgId, text: text });
        localStorage.setItem(getStorageKey('burmalda_pinned_data'), JSON.stringify(pinnedMessages));
        socket.emit('pin_message', { room: currentRoom, action: 'add', pinData: { id: msgId, text: text } });
        currentPinIndex = pinnedMessages[currentRoom].length - 1; renderPinnedBar();
    }
}

function requestUnpin(e) {
    e.stopPropagation(); const pins = pinnedMessages[currentRoom] || [];
    if (pins.length > 0) {
        const removed = pins[currentPinIndex]; pinnedMessages[currentRoom].splice(currentPinIndex, 1);
        if (currentPinIndex >= pinnedMessages[currentRoom].length) currentPinIndex = 0;
        localStorage.setItem(getStorageKey('burmalda_pinned_data'), JSON.stringify(pinnedMessages));
        socket.emit('pin_message', { room: currentRoom, action: 'remove', pinData: removed }); renderPinnedBar();
    }
}

function scrollToPinnedMessage() {
    if (!currentRoom) return; const pins = pinnedMessages[currentRoom] || []; if (pins.length === 0) return;
    const element = document.getElementById(`msg-item-${pins[currentPinIndex].id}`);
    if (element) { element.scrollIntoView({ behavior: 'smooth', block: 'center' }); element.style.background = 'rgba(255, 204, 0, 0.2)';
    setTimeout(() => { element.style.background = ''; }, 1200); }
}

function setReplyTarget(msgId, summaryText) {
    replyTargetMsgId = msgId;
    editTargetMsgId = null;
    document.getElementById('reply-preview-text').innerHTML = `${translations[currentLang].replyPrefix} "${escapeHTML(summaryText)}"`;
    document.getElementById('reply-preview-bar').style.display = 'flex'; input.focus();
}

function setEditTarget(msgId, text) {
    editTargetMsgId = msgId; replyTargetMsgId = null;
    document.getElementById('reply-preview-text').innerHTML = `Редагування: "${escapeHTML(text)}"`;
    document.getElementById('reply-preview-bar').style.display = 'flex';
    input.value = text; input.focus();
}

function cancelAction() { replyTargetMsgId = null; editTargetMsgId = null; document.getElementById('reply-preview-bar').style.display = 'none'; input.value = ''; emitActivity('none'); }

function uploadMediaFile(inputEl) {
    const file = inputEl.files[0]; if (!file || !currentRoom) return;
    compressImage(file, (compressedBase64) => {
        sendSpecialMessage(compressedBase64, 'image'); cancelAction(); inputEl.value = ''; document.getElementById('attachment-bubble').classList.remove('active');
    });
}

function uploadDocumentFile(inputEl) {
    const file = inputEl.files[0]; if (!file || !currentRoom) return;
    if (file.size > 10 * 1024 * 1024) { alert("Файл занадто великий! (Макс 10MB для демо)"); return; }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const payload = JSON.stringify({ name: file.name, data: e.target.result });
        sendSpecialMessage(payload, 'document'); cancelAction(); inputEl.value = ''; document.getElementById('attachment-bubble').classList.remove('active');
    };
    reader.readAsDataURL(file);
}

function sendSpecialMessage(dataStr, type, options = null, extraSettings = null) {
    if (!currentRoom) return;
    const msgId = type + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const msgPayload = { id: msgId, room: currentRoom, from: myNick, to: currentActiveChatPartner, text: dataStr, type: type, replyTo: replyTargetMsgId, timestamp: Date.now(), reactions: {}, status: 'sent' };
    if(options) msgPayload.options = options;
    if(extraSettings) msgPayload.pollSettings = extraSettings;
    if(type === 'poll') msgPayload.votes = {};

    if (!activeChats.includes(currentActiveChatPartner)) { activeChats.push(currentActiveChatPartner); saveActiveChats(); }
    if (!savedMessages[currentRoom]) savedMessages[currentRoom] = []; savedMessages[currentRoom].push(msgPayload); safeSaveHistory();
    socket.emit('chat_message', msgPayload); appendSingleMessage(msgPayload); audioSend.play().catch(e=>console.log(e));
    cancelAction(); stickerMenu.classList.remove('active'); messagesContainer.scrollTop = messagesContainer.scrollHeight; emitActivity('none');
}

let mediaRecorder = null;
let recordedChunks = [];
let currentRecordType = null;
let recordTimerInterval;
let recordSeconds = 0;
let currentFacingMode = 'user';
let currentLocalMediaStream = null;

// Функція-помічник для стабільного доступу до медіа (особливо на ПК)
async function getRobustMediaStream(isVideo) {
    try {
        // Спочатку пробуємо ідеальні налаштування
        return await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: isVideo ? { facingMode: { ideal: currentFacingMode }, width: { ideal: 480 }, height: { ideal: 480 } } : false
        });
    } catch (e1) {
        console.warn("Основні параметри камери не спрацювали, пробуємо базові:", e1);
        try {
            // Фолбек для ПК: без жорстких параметрів
            return await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: isVideo
            });
        } catch (e2) {
            console.error("Помилка доступу до медіа:", e2);
            throw e2;
        }
    }
}

async function startMediaRecording(type) {
    try {
        emitActivity(type === 'video_circle' ? 'recording_video' : 'recording_audio');
        currentFacingMode = 'user'; 
        
        currentLocalMediaStream = await getRobustMediaStream(type === 'video_circle');
        const overlay = document.getElementById('record-overlay'); 
        overlay.style.display = 'flex';
        
        const previewVideo = document.getElementById('record-preview');
        const previewAudioIcon = document.getElementById('record-audio-icon');
        const btnSwitchCam = document.getElementById('btn-switch-record-cam');
        
        if (type === 'video_circle') { 
            previewVideo.style.display = 'block';
            previewAudioIcon.style.display = 'none'; btnSwitchCam.style.display = 'inline-block'; previewVideo.srcObject = currentLocalMediaStream; previewVideo.classList.add('recording');
        } else { 
            previewVideo.style.display = 'none';
            btnSwitchCam.style.display = 'none'; previewAudioIcon.style.display = 'flex'; previewAudioIcon.classList.add('recording');
        }

        mediaRecorder = new MediaRecorder(currentLocalMediaStream);
        recordedChunks = []; currentRecordType = type; recordSeconds = 0;
        document.getElementById('record-timer').textContent = '00:00';
        recordTimerInterval = setInterval(() => {
            recordSeconds++;
            const m = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
            const s = String(recordSeconds % 60).padStart(2, '0');
            document.getElementById('record-timer').textContent = `${m}:${s}`;
            if (recordSeconds >= 60) finishAndSendRecord();
        }, 1000);
        mediaRecorder.ondataavailable = e => { if(e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.onstop = () => {
            if (window.isSwitchingCamera) return;
            clearInterval(recordTimerInterval);
            if(currentLocalMediaStream) currentLocalMediaStream.getTracks().forEach(t => t.stop());
            previewVideo.srcObject = null; previewVideo.classList.remove('recording'); previewAudioIcon.classList.remove('recording');
            
            if (!window.cancelCurrentRecord && recordedChunks.length > 0) {
                const mimeType = type === 'video_circle' ? 'video/webm' : 'audio/webm';
                const blob = new Blob(recordedChunks, { type: mimeType });
                const reader = new FileReader();
                reader.onloadend = () => { sendSpecialMessage(reader.result, type); }; reader.readAsDataURL(blob);
            }
            window.cancelCurrentRecord = false;
            closeRecordUI(); emitActivity('none');
        };
        mediaRecorder.start();
    } catch(e) { alert('Помилка доступу до камери/мікрофона: ' + e.message); console.error(e); closeRecordUI(); emitActivity('none'); }
}

async function switchRecordCamera() {
    if (!currentLocalMediaStream || currentRecordType !== 'video_circle') return;
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    try {
        window.isSwitchingCamera = true;
        if (mediaRecorder.state === 'recording') mediaRecorder.pause();
        const oldVideoTrack = currentLocalMediaStream.getVideoTracks()[0];
        if (oldVideoTrack) oldVideoTrack.stop(); 

        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: currentFacingMode } }, audio: false })
            .catch(e => navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
        
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        currentLocalMediaStream.removeTrack(oldVideoTrack);
        currentLocalMediaStream.addTrack(newVideoTrack);
        document.getElementById('record-preview').srcObject = currentLocalMediaStream; 

        if (mediaRecorder.state === 'paused') mediaRecorder.resume();
        setTimeout(() => { window.isSwitchingCamera = false; }, 500); 
    } catch (err) { console.error("Не вдалося розвернути камеру", err);
        window.isSwitchingCamera = false;
    }
}

function pauseResumeRecord() {
    if (!mediaRecorder) return;
    const btn = document.getElementById('btn-pause-record'); 
    const previewV = document.getElementById('record-preview');
    const previewA = document.getElementById('record-audio-icon');
    
    if (mediaRecorder.state === 'recording') {
        mediaRecorder.pause(); clearInterval(recordTimerInterval);
        btn.textContent = '▶'; 
        previewV.classList.remove('recording'); previewA.classList.remove('recording');
        emitActivity('none');
    } else if (mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        emitActivity(currentRecordType === 'video_circle' ? 'recording_video' : 'recording_audio');
        recordTimerInterval = setInterval(() => {
            recordSeconds++; const m = String(Math.floor(recordSeconds / 60)).padStart(2, '0'); const s = String(recordSeconds % 60).padStart(2, '0');
            document.getElementById('record-timer').textContent = `${m}:${s}`;
            if (recordSeconds >= 60) finishAndSendRecord();
        }, 1000);
        btn.textContent = '⏸'; 
        if(currentRecordType === 'video_circle') previewV.classList.add('recording');
        else previewA.classList.add('recording');
    }
}

function deleteRecord() { if (mediaRecorder && mediaRecorder.state !== 'inactive') { window.cancelCurrentRecord = true; mediaRecorder.stop(); } else { closeRecordUI(); } }
function finishAndSendRecord() { if (mediaRecorder && mediaRecorder.state !== 'inactive') { mediaRecorder.stop(); } }
function closeRecordUI() { clearInterval(recordTimerInterval); document.getElementById('record-overlay').style.display = 'none'; currentRecordType = null; emitActivity('none'); }

function openForwardModal(msg) {
    messageToForward = msg;
    const listContainer = document.getElementById('forward-chat-list'); listContainer.innerHTML = '';
    if (activeChats.length === 0) { listContainer.innerHTML = '<div style="color:var(--text-muted); font-size:12px; text-align:center;">Немає чатів для пересилання</div>'; } 
    else {
        activeChats.forEach(user => {
            const btn = document.createElement('div'); btn.className = 'forward-user-item';
            btn.innerHTML = `${getAvatarHTML(user, 'avatar')} <span>${getVisibleName(user)}</span>`;
            btn.onclick = () => executeForward(user); 
            listContainer.appendChild(btn);
        });
    }
    document.getElementById('forward-modal').classList.add('active');
}

function closeForwardModal() { document.getElementById('forward-modal').classList.remove('active'); messageToForward = null; }

function executeForward(targetUser) {
    if (!messageToForward) return;
    const isAnon = document.getElementById('forward-anonymous-check').checked;
    const roomSorted = [myNick, targetUser].sort();
    const targetRoom = `room_${roomSorted[0]}_${roomSorted[1]}`;
    const newMsgId = messageToForward.type + '_fwd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const msgPayload = { id: newMsgId, room: targetRoom, from: myNick, to: targetUser, text: messageToForward.text, type: messageToForward.type, replyTo: null, timestamp: Date.now(), reactions: {}, status: 'sent', edited: false };
    if(messageToForward.options) msgPayload.options = messageToForward.options;
    if(messageToForward.pollSettings) msgPayload.pollSettings = messageToForward.pollSettings;
    if(messageToForward.votes) msgPayload.votes = messageToForward.votes;

    if (!isAnon) { 
        msgPayload.forwardedFrom = getVisibleName(messageToForward.from); 
        msgPayload.forwardedFromId = messageToForward.from; // Зберігаємо ID оригінального автора
    }

    if (!activeChats.includes(targetUser)) { activeChats.push(targetUser); saveActiveChats(); }
    if (!savedMessages[targetRoom]) savedMessages[targetRoom] = []; savedMessages[targetRoom].push(msgPayload); safeSaveHistory();
    socket.emit('chat_message', msgPayload);
    if (currentRoom === targetRoom) { appendSingleMessage(msgPayload); messagesContainer.scrollTop = messagesContainer.scrollHeight; }
    audioSend.play().catch(e=>console.log(e)); closeForwardModal(); renderChatsList();
}

window.votePoll = function(msgId, optIndex) {
    if(!currentRoom) return;
    const chatMsgs = savedMessages[currentRoom] || [];
    const msg = chatMsgs.find(m => m.id === msgId);
    if(!msg || msg.type !== 'poll') return;
    
    const settings = msg.pollSettings || { anonymous: false, multiple: false, quiz: false, explanation: '' };
    if(!msg.votes) msg.votes = {};
    
    let hasVoted = false;
    if (msg.options) {
        msg.options.forEach((o, i) => { if(msg.votes[i] && msg.votes[i].includes(myNick)) hasVoted = true; });
    }
    
    if (settings.quiz && hasVoted) return;
    
    if (!settings.multiple && !settings.quiz) {
        msg.options.forEach((o, i) => {
            if (msg.votes[i] && i !== optIndex) {
                msg.votes[i] = msg.votes[i].filter(u => u !== myNick);
            }
        });
    }

    if (!msg.votes[optIndex]) msg.votes[optIndex] = [];
    
    if (msg.votes[optIndex].includes(myNick)) {
        msg.votes[optIndex] = msg.votes[optIndex].filter(u => u !== myNick);
    } else {
        msg.votes[optIndex].push(myNick);
    }

    safeSaveHistory();
    socket.emit('poll_vote', { room: currentRoom, msgId: msgId, votes: msg.votes });
    loadMessagesHistory();
}

function appendSingleMessage(msg, isHistoryBuild = false) { 
    if (!isHistoryBuild) {
        const msgDate = formatDateDivider(msg.timestamp);
        const dividers = document.querySelectorAll('.date-divider');
        const lastDateText = dividers.length > 0 ? dividers[dividers.length - 1].textContent : null;
        if (msgDate !== lastDateText) { const div = document.createElement('div'); div.className = 'date-divider'; div.textContent = msgDate; messagesContainer.appendChild(div); }
    }

    const liWrapper = document.createElement('div'); liWrapper.className = `msg-container ${msg.from === myNick ? 'my-wrapper' : ''}`; liWrapper.id = `msg-item-${msg.id}`;
    
    // Відображаємо чекбокси тільки для своїх повідомлень
    if (msg.from === myNick) {
        const checkboxHtml = `<input type="checkbox" class="msg-checkbox" value="${msg.id}" onchange="toggleMessageSelection(this)">`;
        liWrapper.innerHTML += checkboxHtml;
    }

    const li = document.createElement('li'); if (msg.from === myNick) li.className = 'my-msg';
    if (['image', 'sticker', 'audio', 'video_circle'].includes(msg.type)) { li.classList.add('msg-transparent'); }

    if (msg.forwardedFrom) { 
        const fwdDiv = document.createElement('div');
        fwdDiv.className = 'forward-header'; 
        
        if (msg.forwardedFromId) {
            fwdDiv.innerHTML = `↪️ Переслано від: <span class="forward-link" style="cursor:pointer; text-decoration:underline;">${escapeHTML(msg.forwardedFrom)}</span>`;
            fwdDiv.querySelector('.forward-link').onclick = (e) => {
                e.stopPropagation();
                if (msg.forwardedFromId === myNick) { alert(translations[currentLang].selfChatError); return; }
                if (!activeChats.includes(msg.forwardedFromId)) { activeChats.push(msg.forwardedFromId); saveActiveChats(); }
                openChatWith(msg.forwardedFromId);
            };
        } else {
            fwdDiv.textContent = `↪️ Переслано від: ${msg.forwardedFrom}`;
        }
        li.insertBefore(fwdDiv, li.firstChild); 
    }

    if (msg.replyTo) {
        const originalMsg = savedMessages[currentRoom]?.find(m => m.id === msg.replyTo);
        const quoteDiv = document.createElement('div'); quoteDiv.className = 'reply-quote';
        let quoteText = originalMsg ? escapeHTML(originalMsg.text) : 'Повідомлення видалено';
        if (originalMsg) {
            if (originalMsg.type === 'image') quoteText = '📷 Фотографія';
            if (originalMsg.type === 'sticker') quoteText = '🦄 Стікер';
            if (originalMsg.type === 'audio') quoteText = '🎤 Аудіо';
            if (originalMsg.type === 'video_circle') quoteText = '🔵 Відео';
            if (originalMsg.type === 'poll') quoteText = '📊 Опитування';
            if (originalMsg.type === 'document') quoteText = '📄 Документ';
        }
        quoteDiv.innerHTML = quoteText;
        quoteDiv.onclick = (e) => { e.stopPropagation(); const targetNode = document.getElementById(`msg-item-${msg.replyTo}`); if (targetNode) targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
        li.appendChild(quoteDiv);
    }

    if (msg.type === 'image') {
        const mediaWrapper = document.createElement('div');
        mediaWrapper.className = 'chat-media-wrapper'; mediaWrapper.style.padding = '4px';
        const placeholder = document.createElement('div'); placeholder.style.padding = '14px 20px'; placeholder.style.background = 'rgba(0,0,0,0.3)'; placeholder.style.borderRadius = '10px';
        placeholder.style.textAlign = 'center'; placeholder.style.cursor = 'pointer'; placeholder.style.border = '1px dashed rgba(255,255,255,0.2)';
        placeholder.innerHTML = '🖼️ <b>Відкрити медіафайл</b>';
        placeholder.onclick = (e) => { 
            e.stopPropagation();
            placeholder.style.display = 'none'; 
            const img = document.createElement('img'); img.src = msg.text; img.className = 'chat-media-img';
            img.onclick = (ev) => { ev.stopPropagation(); openImageViewer(msg.text); };
            mediaWrapper.appendChild(img); 
        };
        mediaWrapper.appendChild(placeholder); li.appendChild(mediaWrapper);
    } else if (msg.type === 'sticker') {
        const img = document.createElement('img');
        img.src = msg.text; img.className = 'sticker-img'; li.appendChild(img);
    } else if (msg.type === 'audio') {
        const wrapper = document.createElement('div');
        wrapper.className = 'audio-wrapper';
        const audio = document.createElement('audio'); audio.controls = true; audio.src = msg.text; audio.className = 'audio-msg';
        const speedBtn = document.createElement('button');
        speedBtn.className = 'audio-speed-btn'; speedBtn.textContent = '1x';
        const speeds = [1, 1.5, 2, 0.5]; let currentSpeedIdx = 0;
        speedBtn.onclick = (e) => { e.stopPropagation(); currentSpeedIdx = (currentSpeedIdx + 1) % speeds.length; audio.playbackRate = speeds[currentSpeedIdx];
        speedBtn.textContent = speeds[currentSpeedIdx] + 'x'; };
        wrapper.appendChild(audio); wrapper.appendChild(speedBtn); li.appendChild(wrapper);
    } else if (msg.type === 'video_circle') {
        const wrapper = document.createElement('div');
        wrapper.className = 'circle-video-wrapper';
        const video = document.createElement('video'); video.src = msg.text; video.autoplay = true; video.loop = true; video.muted = true;
        video.className = 'circle-video'; video.playsInline = true;
        const speedBtn = document.createElement('button'); speedBtn.className = 'media-speed-btn'; speedBtn.textContent = '1x'; speedBtn.style.display = 'none';
        const speeds = [1, 1.5, 2, 0.5]; let currentSpeedIdx = 0;
        speedBtn.onclick = (e) => { 
            e.stopPropagation();
            currentSpeedIdx = (currentSpeedIdx + 1) % speeds.length; 
            video.playbackRate = speeds[currentSpeedIdx]; 
            speedBtn.textContent = speeds[currentSpeedIdx] + 'x'; 
        };
        video.onclick = (e) => { 
            e.stopPropagation();
            wrapper.classList.toggle('expanded');
            video.classList.toggle('expanded');
            if (wrapper.classList.contains('expanded')) { video.muted = false; speedBtn.style.display = 'block'; video.play(); } 
            else { video.muted = true; speedBtn.style.display = 'none'; video.pause(); video.currentTime = 0; }
        };
        wrapper.appendChild(video); wrapper.appendChild(speedBtn); li.appendChild(wrapper);
    } else if (msg.type === 'poll') {
        const settings = msg.pollSettings || { anonymous: false, multiple: false, quiz: false, correctIndex: -1, explanation: '' };
        const votes = msg.votes || {};
        let totalVotes = 0;
        let myVotes = [];
        
        if (msg.options) {
            msg.options.forEach((opt, idx) => {
                if(votes[idx]) {
                    totalVotes += votes[idx].length;
                    if(votes[idx].includes(myNick)) myVotes.push(idx);
                }
            });
        }

        let optionsHtml = '';
        let explanationHtml = '';
        if (msg.options) {
            msg.options.forEach((opt, idx) => {
                const optVotes = votes[idx] ? votes[idx].length : 0;
                const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                const isMyVote = myVotes.includes(idx);
                
                let quizStyles = '';
                let fillStyle = `width: ${percent}%; background: ${isMyVote ? 'rgba(0, 136, 204, 0.4)' : 'rgba(128,128,128,0.2)'};`;
                
                if (settings.quiz && myVotes.length > 0) {
                    if (settings.correctIndex == idx) {
                        quizStyles = 'border-color: #4cd964; background: rgba(76, 217, 100, 0.2);';
                        fillStyle = `width: ${percent}%; background: rgba(76, 217, 100, 0.4);`;
                    } else if (isMyVote) {
                        quizStyles = 'border-color: #ff3b30; background: rgba(255, 59, 48, 0.2);';
                        fillStyle = `width: ${percent}%; background: rgba(255, 59, 48, 0.4);`;
                        if (settings.explanation) {
                            explanationHtml = `<div style="margin-top: 8px; font-size: 11px; color: #ff3b30; background: rgba(255,59,48,0.1); padding: 8px; border-radius: 6px; border: 1px dashed #ff3b30;">💡 <b>Пояснення:</b> ${escapeHTML(settings.explanation)}</div>`;
                        }
                    }
                }

                let votersAvatars = '';
                if (!settings.anonymous && votes[idx] && votes[idx].length > 0) {
                    votersAvatars = '<div style="display:flex; gap:2px; margin-top:4px;">';
                    votes[idx].forEach(vUser => {
                        votersAvatars += getTinyAvatarHTML(vUser);
                    });
                    votersAvatars += '</div>';
                }

                optionsHtml += `
                    <div style="position: relative; border: 1px solid ${isMyVote ? 'var(--accent)' : 'var(--border-color)'}; border-radius: 6px; margin-top: 6px; cursor: pointer; overflow: hidden; ${quizStyles}" onclick="votePoll('${msg.id}', ${idx})">
                        <div style="position: absolute; top: 0; left: 0; height: 100%; ${fillStyle} transition: width 0.3s ease; z-index: 1;"></div>
                        <div style="position: relative; z-index: 2; padding: 8px 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span>${escapeHTML(opt)}</span>
                                <span style="font-size: 11px; font-weight: bold;">${percent}%</span>
                            </div>
                            ${votersAvatars}
                        </div>
                    </div>
                `;
            });
        }

        let metaText = [];
        if(settings.anonymous) metaText.push('Анонімне');
        if(settings.multiple) metaText.push('Кілька відповідей');
        if(settings.quiz) metaText.push('Вікторина');

        li.innerHTML = `<strong style="color:var(--accent);">📊 Опитування: ${escapeHTML(msg.text)}</strong>
                        <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 5px;">${metaText.join(' • ')}</div>
                        ${optionsHtml}
                        ${explanationHtml}
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px; text-align: right;">Всього голосів: ${totalVotes}</div>`;
    } else if (msg.type === 'document') {
        try {
            const docInfo = JSON.parse(msg.text);
            li.innerHTML = `<a href="${docInfo.data}" download="${docInfo.name}" style="color:var(--accent); text-decoration:none; display:flex; align-items:center; gap:8px;">📄 <b>${escapeHTML(docInfo.name)}</b> (Завантажити)</a>`;
        } catch(e) { li.textContent = 'Помилка завантаження документу'; }
    } else {
        const textNode = document.createElement('span');
        textNode.innerHTML = escapeHTML(msg.text).replace(/\n/g, '<br>') + (msg.edited ? ' <small style="opacity:0.6; font-size:10px; margin-left:4px;">(змінено)</small>' : ''); li.appendChild(textNode);
    }

    const metaLine = document.createElement('div'); metaLine.className = 'msg-meta-line';
    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    let checkmarksHtml = '';
    if (msg.from === myNick) {
        const isRead = msg.status === 'read';
        const checkmarks = isRead ? '✓✓' : '✓';
        checkmarksHtml = `<span class="msg-status ${isRead ? 'read' : ''}" id="status-${msg.id}">${checkmarks}</span>`;
    }

    metaLine.innerHTML = `<span class="msg-time">${timeStr}</span> ${checkmarksHtml}`; li.appendChild(metaLine); 

    const reactionsHolder = document.createElement('div'); reactionsHolder.className = 'reactions-holder'; li.appendChild(reactionsHolder);
    const picker = document.createElement('div'); picker.className = 'reaction-picker';
    ALL_EMOJIS.slice(0, 10).forEach(em => {
        const emSpan = document.createElement('span'); emSpan.textContent = em;
        emSpan.onclick = (e) => { e.stopPropagation(); toggleMessageReaction(msg.id, em); picker.style.display = 'none'; }; picker.appendChild(emSpan);
    });
    liWrapper.appendChild(picker);

    li.onclick = (e) => { 
        if(isMultiSelectMode) {
            e.stopPropagation();
            const cb = liWrapper.querySelector('.msg-checkbox'); 
            if(cb) { // Запобігаємо помилкам при кліку на чуже повідомлення
                cb.checked = !cb.checked; 
                toggleMessageSelection(cb);
            }
            return;
        }
        e.stopPropagation();
        document.querySelectorAll('.reaction-picker').forEach(p => { if(p !== picker) p.style.display = 'none'; });
        picker.style.display = picker.style.display === 'flex' ? 'none' : 'flex'; 
    };
    li.oncontextmenu = (e) => { 
        if(isMultiSelectMode) return;
        e.preventDefault(); picker.style.display = 'none';
        let summary = msg.text;
        if (msg.type === 'image') summary = '📷 Фотографія'; if (msg.type === 'sticker') summary = '🦄 Стікер';
        if (msg.type === 'audio') summary = '🎤 Аудіо'; if (msg.type === 'video_circle') summary = '🔵 Відео';
        if (msg.type === 'poll') summary = '📊 Опитування'; if (msg.type === 'document') summary = '📄 Документ';
        const menuOptions = [ 
            { text: translations[currentLang].ctxReply, action: () => { setReplyTarget(msg.id, summary); } },
            { text: "Переслати ↪️", action: () => { openForwardModal(msg); } },
            { text: translations[currentLang].ctxPin, action: () => { pinMessage(msg.id, summary); } } 
        ];
        if (msg.from === myNick) {
            if (msg.type === 'text') menuOptions.push({ text: translations[currentLang].ctxEdit, action: () => { setEditTarget(msg.id, msg.text); } });
            menuOptions.push({ text: translations[currentLang].ctxDeleteMy, class: 'delete-btn', action: () => { requestSmartDeleteMessage(msg.id); } });
        }
        showContextMenu(e, menuOptions);
    }; 

    liWrapper.appendChild(li); messagesContainer.appendChild(liWrapper); renderReactionsUI(msg.id, msg.reactions, reactionsHolder);
    if(selectedMessages.has(msg.id)) { 
        const cb = liWrapper.querySelector('.msg-checkbox');
        if(cb) cb.checked = true; 
    }
}

function toggleMultiSelectMode() {
    isMultiSelectMode = !isMultiSelectMode;
    selectedMessages.clear();
    document.body.classList.toggle('multi-select-mode', isMultiSelectMode);
    document.getElementById('multi-select-bar').style.display = isMultiSelectMode ? 'flex' : 'none';
    document.querySelectorAll('.msg-checkbox').forEach(cb => cb.checked = false);
    document.getElementById('multi-select-count').innerText = "0";
}

window.toggleMessageSelection = function(cb) {
    if(cb.checked) { selectedMessages.add(cb.value); } else { selectedMessages.delete(cb.value); }
    document.getElementById('multi-select-count').innerText = selectedMessages.size;
};

window.executeMultiDelete = function() {
    if(selectedMessages.size === 0 || !currentRoom) return;
    if(confirm(`Видалити ${selectedMessages.size} повідомлень?`)) {
        selectedMessages.forEach(msgId => requestSmartDeleteMessage(msgId));
        toggleMultiSelectMode();
    }
};

window.executeMultiForward = function() {
    if(selectedMessages.size === 0) return;
    alert("Мульти-пересилання в розробці. Працює одиничне.");
};

function toggleMessageReaction(msgId, reaction) {
    const chatMsgs = savedMessages[currentRoom] || [];
    const msg = chatMsgs.find(m => m.id === msgId); if (!msg) return;
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[reaction]) msg.reactions[reaction] = [];
    if (msg.reactions[reaction].includes(myNick)) { msg.reactions[reaction] = msg.reactions[reaction].filter(u => u !== myNick); } else { msg.reactions[reaction].push(myNick); }
    if (msg.reactions[reaction].length === 0) delete msg.reactions[reaction];
    safeSaveHistory();
    socket.emit('message_reaction', { room: currentRoom, msgId: msgId, username: myNick, reaction: reaction, reactions: msg.reactions }); loadMessagesHistory();
}

function renderReactionsUI(msgId, reactionsObj, container) {
    container.innerHTML = '';
    if (!reactionsObj) return;
    for (const [reaction, users] of Object.entries(reactionsObj)) {
        if (!users || users.length === 0) continue;
        const chip = document.createElement('div'); chip.className = `reaction-chip ${users.includes(myNick) ? 'active-my' : ''}`; chip.innerHTML = `<span>${reaction}</span> <small>${users.length}</small>`;
        chip.onclick = (e) => { e.stopPropagation(); toggleMessageReaction(msgId, reaction); }; container.appendChild(chip);
    }
}

function requestSmartDeleteMessage(msgId) { 
    executeLocalDeletion(msgId);
    socket.emit('delete_message', { room: currentRoom, msgId: msgId }); 
}

function executeLocalDeletion(msgId) {
    if (!currentRoom || !savedMessages[currentRoom]) return;
    savedMessages[currentRoom] = savedMessages[currentRoom].filter(m => m.id !== msgId); safeSaveHistory();
    if (pinnedMessages[currentRoom]) {
        pinnedMessages[currentRoom] = pinnedMessages[currentRoom].filter(p => p.id !== msgId);
        localStorage.setItem(getStorageKey('burmalda_pinned_data'), JSON.stringify(pinnedMessages)); renderPinnedBar();
    } loadMessagesHistory();
}

function executeLocalEdit(msgId, newText) {
    if (!currentRoom || !savedMessages[currentRoom]) return;
    const msg = savedMessages[currentRoom].find(m => m.id === msgId); if (msg) { msg.text = newText; msg.edited = true; safeSaveHistory(); }
    loadMessagesHistory();
}

function loadMessagesHistory() { 
    if (!currentRoom) return;
    const isAtBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop <= messagesContainer.clientHeight + 50;
    
    messagesContainer.innerHTML = '';
    let history = savedMessages[currentRoom] || [];
    if(history.length > currentPaginationLimit) { history = history.slice(history.length - currentPaginationLimit); }

    let lastDate = null;
    history.forEach(msg => { 
        const msgDate = formatDateDivider(msg.timestamp);
        if (msgDate !== lastDate) { const div = document.createElement('div'); div.className = 'date-divider'; div.textContent = msgDate; messagesContainer.appendChild(div); lastDate = msgDate; }
        appendSingleMessage(msg, true); 
    });
    if(isAtBottom) messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

messagesContainer.onscroll = () => {
    const btn = document.getElementById('scroll-to-bottom-btn');
    if (messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight > 300) { btn.style.display = 'flex'; } else { btn.style.display = 'none'; }
    
    if (messagesContainer.scrollTop === 0) {
        const history = savedMessages[currentRoom] || [];
        if (currentPaginationLimit < history.length) {
            currentPaginationLimit += 30;
            const previousHeight = messagesContainer.scrollHeight;
            loadMessagesHistory();
            messagesContainer.scrollTop = messagesContainer.scrollHeight - previousHeight;
        }
    }
};

document.getElementById('form').onsubmit = (e) => { 
    e.preventDefault();
    const val = input.value.trim(); if (!val || !currentRoom) return;

    // --- КЛІЄНТСЬКИЙ АНТИСПАМ ---
    const now = Date.now();
    myMessageTimestamps = myMessageTimestamps.filter(t => now - t < 3000);
    if (myMessageTimestamps.length >= 4) {
        alert("Антиспам: Занадто багато повідомлень! Зачекайте пару секунд.");
        return;
    }
    myMessageTimestamps.push(now);

    if (editTargetMsgId) { socket.emit('edit_message', { room: currentRoom, msgId: editTargetMsgId, newText: val }); executeLocalEdit(editTargetMsgId, val); cancelAction(); return; }
    
    const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const msgPayload = { id: msgId, room: currentRoom, from: myNick, to: currentActiveChatPartner, text: val, type: 'text', replyTo: replyTargetMsgId, timestamp: Date.now(), reactions: {}, status: 'sent', edited: false };
    if (!activeChats.includes(currentActiveChatPartner)) { activeChats.push(currentActiveChatPartner); saveActiveChats(); } 
    if (!savedMessages[currentRoom]) savedMessages[currentRoom] = [];
    savedMessages[currentRoom].push(msgPayload);
    safeSaveHistory(); 

    socket.emit('chat_message', msgPayload); appendSingleMessage(msgPayload);
    audioSend.play().catch(e=>console.log(e)); 
    cancelAction(); messagesContainer.scrollTop = messagesContainer.scrollHeight; renderChatsList(); 
    emitActivity('none'); 
};

let typingTimeout = null; let lastTypingEmit = 0;
input.oninput = () => { 
    if (!currentRoom) return; const now = Date.now();
    if (now - lastTypingEmit > 2000) { emitActivity('typing'); lastTypingEmit = now; }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => { emitActivity('none'); lastTypingEmit = 0; }, 1500);
};

function showContextMenu(e, options) { 
    contextMenu.innerHTML = '';
    options.forEach(opt => { const b = document.createElement('button'); b.textContent = opt.text; if (opt.class) b.className = opt.class; b.onclick = () => { contextMenu.style.display = 'none'; opt.action(); }; contextMenu.appendChild(b); });
    contextMenu.style.display = 'block';
    const rect = contextMenu.getBoundingClientRect(); let x = e.clientX, y = e.clientY;
    if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 10;
    if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 10;
    contextMenu.style.left = x + 'px';
    contextMenu.style.top = y + 'px';
}

document.onclick = (e) => { 
    // Виправлення багу зі зникненням стікерів
    if(!e.target.closest('.attachment-item-btn') && !e.target.closest('#sticker-menu') && !e.target.closest('#btn-sticker')) {
        if(stickerMenu.classList.contains('active')) { stickerMenu.classList.remove('active'); emitActivity('none'); }
    }
    if(!e.target.closest('.search-trigger-btn') && !e.target.closest('#chat-options-menu') && !e.target.closest('.search-container')) {
        document.getElementById('chat-options-menu').style.display = 'none';
        searchDropdown.style.display = 'none';
    }
    if (!e.target.closest('#form') && !e.target.closest('#attachment-bubble')) {
        const bubble = document.getElementById('attachment-bubble');
        if (bubble) bubble.classList.remove('active');
    }
    contextMenu.style.display = 'none'; 
    document.querySelectorAll('.reaction-picker').forEach(p => p.style.display = 'none'); 
};

let myPeer = null; let localStream = null; let currentCall = null; let isCurrentCallVideo = false;
let rtcConfig = null;

socket.on('rtc_config', (config) => { 
    rtcConfig = config; 
    if (myNick && myNick !== 'Анонім') { initPeerJS(myNick); }
});

function initPeerJS(username) {
    if (myPeer) return; 
    try {
        if (typeof Peer === 'undefined') return;
        myPeer = new Peer(username, {
            config: rtcConfig || {
                'iceServers': [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });
        myPeer.on('open', (id) => { console.log('[PeerJS] Готовий до роботи, ID:', id); });
        myPeer.on('call', async (call) => {
            currentCall = call; isCurrentCallVideo = true;
            document.getElementById('call-modal').classList.add('active');
            document.getElementById('call-status-text').textContent = `Вхідний дзвінок від ${getVisibleName(call.peer)}...`;
            document.getElementById('btn-accept-call').style.display = 'inline-block';
            document.getElementById('toggle-mic-btn').style.display = 'none';
            document.getElementById('toggle-cam-btn').style.display = 'none';
            document.getElementById('call-video-container').style.display = 'none';
            startRingtone();

            document.getElementById('btn-accept-call').onclick = async () => {
                stopRingtone();
                document.getElementById('btn-accept-call').style.display = 'none';
                document.getElementById('toggle-mic-btn').style.display = 'inline-block';
                document.getElementById('toggle-cam-btn').style.display = 'inline-block';
                document.getElementById('call-video-container').style.display = 'flex';
                document.getElementById('call-status-text').textContent = 'З\'єднання...';

                try {
                    currentFacingMode = 'user';
                    localStream = await getRobustMediaStream(isCurrentCallVideo);
                    document.getElementById('local-video').srcObject = localStream;
                    call.answer(localStream);
                    call.on('stream', (remoteStream) => { document.getElementById('call-status-text').textContent = 'Розмова...'; document.getElementById('remote-video').srcObject = remoteStream; });
                    call.on('close', () => { endCall(false); });
                } catch (err) { alert('Помилка камери/мікрофона: ' + err.message); endCall(true); }
            };
        });
        myPeer.on('error', (err) => { console.error('[PeerJS Error]:', err); });
    } catch(e) {
        console.warn('PeerJS не вдалося завантажити', e);
    }
}

async function startCall(isVideo) {
    if (!currentActiveChatPartner || !onlineUsers.includes(currentActiveChatPartner)) { alert("Користувач не в мережі!"); return; }
    isCurrentCallVideo = isVideo;
    document.getElementById('call-modal').classList.add('active');
    document.getElementById('call-status-text').textContent = `Дзвінок до ${getVisibleName(currentActiveChatPartner)}...`;
    document.getElementById('btn-accept-call').style.display = 'none';
    document.getElementById('toggle-mic-btn').style.display = 'inline-block';
    document.getElementById('toggle-cam-btn').style.display = isVideo ? 'inline-block' : 'none';
    document.getElementById('call-video-container').style.display = isVideo ? 'flex' : 'none';
    try {
        currentFacingMode = 'user';
        localStream = await getRobustMediaStream(isVideo);
        document.getElementById('local-video').srcObject = localStream;
        currentCall = myPeer.call(currentActiveChatPartner, localStream);
        currentCall.on('stream', (remoteStream) => {
            document.getElementById('call-status-text').textContent = 'Розмова...';
            if (!isVideo) document.getElementById('call-video-container').style.display = 'flex';
            document.getElementById('remote-video').srcObject = remoteStream;
        });
        currentCall.on('close', () => { endCall(false); });
    } catch(e) { alert('Помилка доступу до камери або мікрофона: ' + e.message); endCall(true); }
}

async function switchCallCamera() {
    if (!localStream || !currentCall) return;
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    try {
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) oldVideoTrack.stop();
        
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: currentFacingMode } }, audio: false })
            .catch(e => navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
            
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        localStream.removeTrack(oldVideoTrack);
        localStream.addTrack(newVideoTrack);
        document.getElementById('local-video').srcObject = localStream; 

        const sender = currentCall.peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newVideoTrack);
    } catch (e) { console.error("Помилка розвороту камери в дзвінку", e); }
}

function toggleCallMic() {
    if (localStream) {
        const track = localStream.getAudioTracks()[0];
        if(track) {
            track.enabled = !track.enabled; const micBtn = document.getElementById('toggle-mic-btn');
            if(!track.enabled) { micBtn.innerText = "🔇 Мікр: Вимк"; micBtn.classList.add('active-control'); } 
            else { micBtn.innerText = "🎤 Мікр: Увімк"; micBtn.classList.remove('active-control'); }
        }
    }
}

function toggleCallCam() {
    if (localStream) {
        const track = localStream.getVideoTracks()[0];
        if(track) {
            track.enabled = !track.enabled; const camBtn = document.getElementById('toggle-cam-btn');
            if(!track.enabled) { camBtn.innerText = "📷 Камера: Вимк"; camBtn.classList.add('active-control'); } 
            else { camBtn.innerText = "📷 Камера: Увімк"; camBtn.classList.remove('active-control'); }
        }
    }
}

function endCall(notifyPartner = true) {
    stopRingtone();
    if (currentCall) { currentCall.close(); currentCall = null; }
    if (localStream) { localStream.getTracks().forEach(track => track.stop()); localStream = null; }
    document.getElementById('local-video').srcObject = null; document.getElementById('remote-video').srcObject = null;
    document.getElementById('call-modal').classList.remove('active'); document.getElementById('call-video-container').style.display = 'none';
    document.getElementById('toggle-mic-btn').innerText = "🎤 Мікр: Увімк"; document.getElementById('toggle-mic-btn').classList.remove('active-control');
    document.getElementById('toggle-cam-btn').innerText = "📷 Камера: Увімк"; document.getElementById('toggle-cam-btn').classList.remove('active-control');
}

socket.on('connect', () => { 
    socket.emit('online_ping', { username: myNick }); 
    socket.emit('sync_contacts', { user: myNick, chats: activeChats }); 
});

setInterval(() => {
    if (myNick && myNick !== 'Анонім') { socket.emit('online_ping', { username: myNick }); }
}, 15000);

socket.on('online_list', (users) => { onlineUsers = users; applyLanguage(); });
socket.on('contacts_synced', (serverChats) => { if (Array.isArray(serverChats)) { activeChats = serverChats; localStorage.setItem(getStorageKey('burmalda_chat_list'), JSON.stringify(activeChats)); renderChatsList(); } });
socket.on('user_blocked_you', (data) => { if (data.room === currentRoom && data.blocked) { input.disabled = true; input.placeholder = translations[currentLang].blockedMeText || "Цей користувач вас заблокував."; button.disabled = true; } });

socket.on('chat_message', (msg) => { 
    if (chatSettings[myNick] && chatSettings[myNick].blocked) return; 
    if (chatSettings[msg.from]?.blocked) return;
    
    if (!localProfiles[msg.from]) { socket.emit('request_profile', { username: msg.from }); }

    if (msg.room !== currentRoom) {
        if (!activeChats.includes(msg.from)) { activeChats.push(msg.from); saveActiveChats(); }
        glowingChats[msg.from] = true; localStorage.setItem(getStorageKey('burmalda_glow_chats'), JSON.stringify(glowingChats));
        
        if (!savedMessages[msg.room]) savedMessages[msg.room] = [];
        if (!savedMessages[msg.room].some(m => m.id === msg.id)) { savedMessages[msg.room].push(msg); safeSaveHistory(); }
        renderChatsList();
        
        if (!chatSettings[msg.from]?.muted) audioReceiveOutChat.play().catch(e=>console.log(e));
    } else {
        if (!activeChats.includes(msg.from)) { activeChats.push(msg.from); saveActiveChats(); renderChatsList(); }
        if (!savedMessages[currentRoom]) savedMessages[currentRoom] = [];
        if (!savedMessages[currentRoom].some(m => m.id === msg.id)) { 
            savedMessages[currentRoom].push(msg);
            safeSaveHistory();
            appendSingleMessage(msg); messagesContainer.scrollTop = messagesContainer.scrollHeight; 
            if (msg.from !== myNick) socket.emit('mark_read', { room: currentRoom, reader: myNick });
            if (!chatSettings[msg.from]?.muted) audioReceiveInChat.play().catch(e=>console.log(e));
        } 
    }
});

socket.on('messages_read', (data) => {
    if (savedMessages[data.room]) {
        let updated = false;
        savedMessages[data.room].forEach(msg => {
            if (msg.from !== data.reader && msg.status !== 'read') {
                msg.status = 'read'; updated = true;
                const statusEl = document.getElementById(`status-${msg.id}`); if (statusEl) { 
                statusEl.textContent = '✓✓'; statusEl.classList.add('read'); }
            }
        });
        if (updated) safeSaveHistory();
    }
});

socket.on('edit_message', (data) => {
    if (currentRoom === data.room) { executeLocalEdit(data.msgId, data.newText); } 
    else if (savedMessages[data.room]) {
        const msg = savedMessages[data.room].find(m => m.id === data.msgId); if (msg) { msg.text = data.newText; msg.edited = true; safeSaveHistory(); }
    }
});

socket.on('delete_message', (data) => {
    if (currentRoom === data.room) { executeLocalDeletion(data.msgId); } 
    else if (savedMessages[data.room]) { savedMessages[data.room] = savedMessages[data.room].filter(m => m.id !== data.msgId); safeSaveHistory(); }
});

socket.on('message_reaction', (data) => {
    if (savedMessages[data.room]) {
        const msg = savedMessages[data.room].find(m => m.id === data.msgId);
        if (msg) { msg.reactions = data.reactions || {}; safeSaveHistory(); if (currentRoom === data.room) loadMessagesHistory(); }
    }
});

socket.on('poll_vote', (data) => {
    if (savedMessages[data.room]) {
        const msg = savedMessages[data.room].find(m => m.id === data.msgId);
        if (msg) {
            msg.votes = data.votes || {};
            safeSaveHistory();
            if (currentRoom === data.room) loadMessagesHistory();
        }
    }
});

socket.on('pin_message', (data) => {
    const room = data.room; if (!Array.isArray(pinnedMessages[room])) pinnedMessages[room] = [];
    if (data.action === 'add') { if (!pinnedMessages[room].some(p => p.id === data.pinData.id)) pinnedMessages[room].push(data.pinData); } 
    else if (data.action === 'remove') { pinnedMessages[room] = pinnedMessages[room].filter(p => p.id !== data.pinData.id); } 
    else if (data.pinned) { pinnedMessages[room] = data.pinned; }
    localStorage.setItem(getStorageKey('burmalda_pinned_data'), JSON.stringify(pinnedMessages));
    if (room === currentRoom) { currentPinIndex = Math.max(0, pinnedMessages[room].length - 1); renderPinnedBar(); }
});

socket.on('user_activity', (data) => { 
    if (currentRoom === data.room && data.user !== myNick) { 
        if (data.activity === 'none') { typingStatusEl.style.display = 'none'; } 
        else { let label = activityLabels[data.activity] || "щось робить..."; typingStatusEl.textContent = `${getVisibleName(data.user)} ${label}`; typingStatusEl.style.display = 'block'; }
    }
    const bioEl = document.getElementById(`bio-${data.user}`);
    if (bioEl) {
        if (data.activity !== 'none') {
            if (!bioEl.dataset.orig) bioEl.dataset.orig = bioEl.innerText;
            let label = activityLabels[data.activity] || "щось робить..."; bioEl.innerText = label; bioEl.style.color = '#4cd964';
        } else {
            bioEl.innerText = bioEl.dataset.orig || ''; bioEl.style.color = 'var(--text-muted)'; delete bioEl.dataset.orig;
        }
    }
});

socket.on('profile_broadcast', (profileUpdate) => { 
    localProfiles[profileUpdate.username] = { ...localProfiles[profileUpdate.username], ...profileUpdate.data }; 
    localStorage.setItem('burmalda_profiles_data', JSON.stringify(localProfiles)); 
    if (profileUpdate.username === currentActiveChatPartner || profileUpdate.username === myNick) { 
        updateChatTitle();
    } renderChatsList(); 
});

function logout() { localStorage.removeItem('burmalda_auth_token'); window.location.href = '/'; }

if (window.visualViewport) { 
    window.visualViewport.addEventListener('resize', () => { 
        const containerEl = document.getElementById('input-panel-container'); 
        if (window.visualViewport.height < window.innerHeight) { 
            const keyboardHeight = window.innerHeight - window.visualViewport.height; 
            containerEl.style.position = 'fixed'; 
            containerEl.style.bottom = keyboardHeight + 'px'; messagesContainer.style.paddingBottom = '90px'; setTimeout(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; }, 60); 
        } else { containerEl.style.position = 'relative'; containerEl.style.bottom = '0px'; messagesContainer.style.paddingBottom = '20px'; } 
    });
}

window.updateQuizCorrectOptions = () => {
    const correctSelect = document.getElementById('poll-quiz-correct');
    if (!correctSelect) return;
    const inputs = document.querySelectorAll('.poll-opt-input');
    correctSelect.innerHTML = '';
    inputs.forEach((input, index) => {
        const val = input.value.trim() || `Варіант ${index + 1}`;
        correctSelect.innerHTML += `<option value="${index}">${escapeHTML(val)}</option>`;
    });
};

window.openPollModal = () => {
    document.getElementById('poll-modal').classList.add('active');
    
    const quizCheck = document.getElementById('poll-quiz-check');
    if(quizCheck) {
        quizCheck.onchange = () => {
            let expInput = document.getElementById('poll-quiz-explanation');
            if (quizCheck.checked && !expInput) {
                expInput = document.createElement('input');
                expInput.type = 'text';
                expInput.id = 'poll-quiz-explanation';
                expInput.className = 'profile-name-input';
                expInput.placeholder = 'Пояснення правильної відповіді (необов\'язково)';
                expInput.style.marginTop = '10px';
                quizCheck.parentNode.appendChild(expInput);
            } else if (!quizCheck.checked && expInput) {
                expInput.remove();
            }
        };
    }
    
    document.querySelectorAll('.poll-opt-input').forEach(input => {
        input.oninput = window.updateQuizCorrectOptions;
    });
    window.updateQuizCorrectOptions();
};

window.closePollModal = () => document.getElementById('poll-modal').classList.remove('active');

window.addPollOptionUI = () => {
    const container = document.getElementById('poll-options-container');
    if (container.children.length >= 10) {
        alert('Максимум 10 варіантів!');
        return;
    }
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'profile-name-input poll-opt-input'; 
    input.placeholder = `Варіант ${container.children.length + 1}`;
    input.oninput = window.updateQuizCorrectOptions;
    container.appendChild(input);
    window.updateQuizCorrectOptions();
};

window.sendPoll = () => {
    const question = document.getElementById('poll-question-input').value;
    const options = Array.from(document.querySelectorAll('.poll-opt-input')).map(i => i.value).filter(v => v.trim() !== '');
    
    const isAnon = document.getElementById('poll-anon-check') ? document.getElementById('poll-anon-check').checked : false;
    const isMulti = document.getElementById('poll-multi-check') ? document.getElementById('poll-multi-check').checked : false;
    const isQuiz = document.getElementById('poll-quiz-check') ? document.getElementById('poll-quiz-check').checked : false;
    const correctIdx = document.getElementById('poll-quiz-correct') ? parseInt(document.getElementById('poll-quiz-correct').value) : 0;
    const explanationInput = document.getElementById('poll-quiz-explanation');
    const explanation = explanationInput ? explanationInput.value.trim() : '';

    if(question && options.length >= 2 && currentActiveChatPartner) {
        const pollSettings = {
            anonymous: isAnon,
            multiple: isMulti,
            quiz: isQuiz,
            correctIndex: isQuiz ? correctIdx : -1,
            explanation: isQuiz ? explanation : ''
        };
        sendSpecialMessage(question, 'poll', options, pollSettings);
        closePollModal();
        document.getElementById('poll-question-input').value = '';
        document.getElementById('poll-options-container').innerHTML = '<input type="text" class="profile-name-input poll-opt-input" placeholder="Варіант 1"><input type="text" class="profile-name-input poll-opt-input" placeholder="Варіант 2">';
        document.querySelectorAll('.poll-opt-input').forEach(i => i.oninput = window.updateQuizCorrectOptions);
        if (explanationInput) explanationInput.value = '';
    } else { alert('Введіть питання та щонайменше 2 варіанти!'); }
};

window.openTimerModal = () => document.getElementById('timer-modal').classList.add('active');
window.closeTimerModal = () => document.getElementById('timer-modal').classList.remove('active');

window.applyTimerSettings = () => {
    alert('Налаштування збережено! Наступне повідомлення буде відправлено згідно таймера. (UI Демо)');
    closeTimerModal();
};

window.toggleAttachmentMenu = function() {
    const bubble = document.getElementById('attachment-bubble');
    if (bubble) {
        bubble.classList.toggle('active');
        if (bubble.classList.contains('active')) {
            document.getElementById('sticker-menu').classList.remove('active');
            emitActivity('none');
        }
    }
};

window.openArchiveSettingsModal = function() {
    const list = document.getElementById('settings-archive-list');
    if (list) {
        list.innerHTML = '';
        const archivedChats = activeChats.filter(c => chatSettings[c]?.folder === 'archive');
        if (archivedChats.length === 0) {
            list.innerHTML = '<span style="color:var(--text-muted); font-size:12px;">Архів порожній.</span>';
        } else {
            archivedChats.forEach(user => {
                const item = document.createElement('div');
                item.style.display = 'flex'; item.style.justifyContent = 'space-between'; item.style.alignItems = 'center'; item.style.marginBottom = '10px';
                item.innerHTML = `<div style="display:flex; align-items:center; gap:10px;">${getAvatarHTML(user)} <span style="font-weight:bold;">${escapeHTML(getVisibleName(user))}</span></div>`;
               
                const btn = document.createElement('button');
                btn.innerText = 'Витягнути'; btn.className = 'upload-btn';
                btn.onclick = () => {
                    chatSettings[user].folder = 'all';
                    localStorage.setItem(getStorageKey('burmalda_chat_settings'), JSON.stringify(chatSettings));
                    renderChatsList();
                    openArchiveSettingsModal();
                };
                item.appendChild(btn);
                list.appendChild(item);
            });
        }
    }
    
    const modal = document.getElementById('archive-settings-modal');
    if (modal) {
        modal.classList.add('active');
    } else {
        alert("Модальне вікно архіву не знайдене в HTML. Додайте id='archive-settings-modal' у файлі index.html (якщо його там немає).");
    }
};

window.setBackgroundImage = function(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    compressImage(file, (compressedBase64) => {
        chatBackgroundImage = compressedBase64;
        localStorage.setItem(getStorageKey('burmalda_bg_image'), chatBackgroundImage);
        applyCustomBackground();
    });
};

window.clearBackgroundImage = function() {
    chatBackgroundImage = '';
    localStorage.removeItem(getStorageKey('burmalda_bg_image'));
    applyCustomBackground();
};

window.setBackgroundBlur = function(val) {
    chatBackgroundBlur = val;
    localStorage.setItem(getStorageKey('burmalda_bg_blur'), chatBackgroundBlur);
    applyCustomBackground();
};

applyLanguage();
const initialChatPartner = urlParams.get('chat');
if (initialChatPartner && activeChats.includes(initialChatPartner)) openChatWith(initialChatPartner);

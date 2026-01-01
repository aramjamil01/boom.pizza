let cart = [];
const folderNames = {
    'pizza': '🍕 جۆرەکانی پیزا',
    'burger': '🍔 جۆرەکانی بەرگر',
    'shawarma': '🌯 جۆرەکانی شاوەرمە',
    'finger': '🍟 فینگەر',
    'drink': '🥤 خواردنەوەکان'
};

// Snow Animation
function createSnow() {
    const container = document.createElement('div');
    container.className = 'snow-container';
    document.body.appendChild(container);
    const symbols = ['❄', '❅', '❆'];
    setInterval(() => {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        snowflake.style.opacity = Math.random();
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        snowflake.innerHTML = symbols[Math.floor(Math.random() * symbols.length)];
        container.appendChild(snowflake);
        setTimeout(() => { snowflake.remove(); }, 5000);
    }, 200);
}

function playSound(type) {
    const sound = document.getElementById(type === 'add' ? 'orderSound' : 'successSound');
    if(sound) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Sound error: ", e));
    }
}

function openFolder(category, element) {
    document.querySelectorAll('.cat-card').forEach(card => card.classList.remove('active'));
    if(element) element.classList.add('active');
    document.getElementById('folder-title').innerText = folderNames[category];
    const display = document.getElementById('menu-display');
    display.innerHTML = '';
    const filtered = menuItems.filter(item => item.category === category);
    filtered.forEach(item => {
        display.innerHTML += `
            <div class="item-card">
                <img src="${item.img}" alt="${item.name}" loading="lazy">
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <div class="price">${item.price.toLocaleString()}د</div>
                </div>
                <button class="add-btn" onclick="addToCart(${item.id})">زیادکردن +</button>
            </div>`;
    });
}

function addToCart(id) {
    const item = menuItems.find(i => i.id === id);
    cart.push(item);
    playSound('add');
    renderCart();
}

function renderCart() {
    const cartDiv = document.getElementById('cart-items');
    let total = 0;
    cartDiv.innerHTML = '';
    const groupedCart = {};
    cart.forEach((item) => {
        total += item.price;
        if (groupedCart[item.name]) { groupedCart[item.name].count++; }
        else { groupedCart[item.name] = { ...item, count: 1 }; }
    });
    Object.values(groupedCart).forEach((item) => {
        cartDiv.innerHTML += `
            <div class="cart-item">
                <span>${item.count}x ${item.name}</span>
                <button class="remove-btn" onclick="removeFromCart('${item.name}')">لادان</button>
            </div>`;
    });
    document.getElementById('total-amount').innerText = total.toLocaleString();
    const floatCart = document.getElementById('floating-cart');
    if(cart.length > 0) {
        floatCart.style.display = 'flex';
        document.getElementById('floating-count').innerText = cart.length + " خواردن";
        document.getElementById('floating-total').innerText = total.toLocaleString() + " دینار";
    } else { floatCart.style.display = 'none'; }
}

function removeFromCart(name) {
    const index = cart.findIndex(i => i.name === name);
    if (index > -1) { cart.splice(index, 1); }
    renderCart();
}

function sendToWhatsApp() {
    if(cart.length === 0) return alert("تکایە سەرەتا خواردن هەڵبژێرە!");
    playSound('success');
    navigator.geolocation.getCurrentPosition(function(p) {
        const loc = `https://www.google.com/maps?q=${p.coords.latitude},${p.coords.longitude}`;
        finalize(loc);
    }, function() {
        finalize(prompt("تکایە ناونیشانەکەت بنووسە:"));
    });
}

function finalize(loc) {
    const phone = "9647861995417";
    const orderID = Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const timeStr = now.getHours() + ":" + now.getMinutes().toString().padStart(2, '0');
    let txt = `📦 *داواکاری نوێ: #${orderID}*\n⏰ کات: ${timeStr}\n----------------------------------\n`;
    const itemCounts = {};
    cart.forEach(item => { itemCounts[item.name] = (itemCounts[item.name] || 0) + 1; });
    for (const [name, count] of Object.entries(itemCounts)) { txt += `🔹 ${count}x ${name}\n`; }
    txt += `----------------------------------\n💰 *کۆی گشتی:* ${document.getElementById('total-amount').innerText} دینار\n📍 *لۆکەیشن:* ${loc}\n\n✨ داواکراوە لە ڕێگەی ئەپی Boom's Pizza`;
    window.location.href = `https://wa.me/${phone}?text=${encodeURIComponent(txt)}`;
}

document.addEventListener('DOMContentLoaded', () => {
    createSnow();
    openFolder('pizza', document.querySelector('.cat-card'));
});

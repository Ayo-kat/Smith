// ========== DATA ==========
let products = JSON.parse(localStorage.getItem('deserve_products')) || [
  { id:1, name:"DESERVE Classic Tee", category:"tshirts", price:320, desc:"Heavyweight cotton. Essential.", emoji:"👕", featured:true },
  { id:2, name:"LOCAL.BOLD.REAL Hoodie", category:"hoodies", price:650, desc:"Premium fleece hoodie.", emoji:"🧥", featured:true },
  { id:3, name:"DESERVE Snapback", category:"caps", price:250, desc:"Structured snapback cap.", emoji:"🧢", featured:true },
  { id:4, name:"Sky Strike Tee", category:"tshirts", price:350, desc:"Limited graphic tee.", emoji:"🌊", featured:true }
];
let cart = JSON.parse(localStorage.getItem('deserve_cart')) || [];
let activeFilter = 'all';
let currentPage = 'home';
let searchQuery = '';
let adminTab = 'products'; // 'products' or 'orders'

// ========== HELPERS ==========
function saveProducts() { localStorage.setItem('deserve_products', JSON.stringify(products)); }
function saveCart() { localStorage.setItem('deserve_cart', JSON.stringify(cart)); }
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if(!toast) { toast = document.createElement('div'); toast.className = 'toast'; document.body.appendChild(toast); }
  toast.innerText = msg; toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:#0A0A0A; color:white; padding:12px 24px; border-radius:60px; z-index:3000; font-weight:600;';
  setTimeout(() => toast.remove(), 2500);
}

// ========== ADMIN REVEAL ==========
function revealAdmin() {
  document.getElementById('adminNavLink').classList.add('visible');
  showToast('🔐 Admin link revealed');
}
if(window.location.search.includes('admin')) revealAdmin();
document.addEventListener('DOMContentLoaded', () => {
  const logo = document.getElementById('navLogo');
  if(logo) logo.addEventListener('dblclick', revealAdmin);
});

// ========== PAGE ROUTING ==========
function showPage(pageName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-'+pageName);
  if(target) target.classList.add('active');
  window.scrollTo({ top: 0 });
  currentPage = pageName;
  if(pageName === 'home') renderFeatured();
  if(pageName === 'shop') renderShop();
  if(pageName === 'cart') renderCart();
  if(pageName === 'admin') { 
    renderAdminProducts(); 
    renderAdminOrders(); 
    updateAdminStats(); 
  }
}

// ========== PRODUCT RENDERING (unchanged) ==========
function buildProductCard(p) {
  let imgHtml = p.img ? `<img src="${p.img}" class="uploaded-img" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:1;" />` : '';
  return `<div class="product-card" data-id="${p.id}">
    <div class="product-card-image" onclick="openQuickView(${p.id})">
      ${imgHtml}
      <span class="product-category-tag">${p.category}</span>
      <span class="product-emoji">${p.emoji || '👕'}</span>
      <div class="product-quick-view">Quick View</div>
    </div>
    <div class="product-card-body">
      <div class="product-name">${p.name}</div>
      <div class="product-desc-short">${p.desc.substring(0, 60)}...</div>
      <div class="product-card-footer">
        <div class="product-price">R${p.price.toLocaleString()}</div>
        <button class="add-to-cart-btn" onclick="addToCart(${p.id})"><i class="fa fa-plus"></i> Add</button>
      </div>
    </div>
  </div>`;
}

function renderFeatured() {
  const featured = products.filter(p => p.featured).slice(0,4);
  document.getElementById('featuredGrid').innerHTML = featured.map(buildProductCard).join('');
}

function renderShop() {
  let list = products.filter(p => activeFilter === 'all' ? true : p.category === activeFilter);
  if(searchQuery.trim()) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase()));
  const sortVal = document.getElementById('sortSelect')?.value || 'default';
  if(sortVal === 'price-asc') list.sort((a,b) => a.price - b.price);
  if(sortVal === 'price-desc') list.sort((a,b) => b.price - a.price);
  if(sortVal === 'name-asc') list.sort((a,b) => a.name.localeCompare(b.name));
  const grid = document.getElementById('shopGrid');
  if(!list.length) grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:4rem;">No products found.</div>';
  else grid.innerHTML = list.map(buildProductCard).join('');
}

function filterProducts(filter, btn) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderShop();
}
function sortProducts() { renderShop(); }
function handleSearch() { searchQuery = document.getElementById('searchInput').value; if(currentPage !== 'shop') showPage('shop'); else renderShop(); }

// ========== CART ==========
function addToCart(id) {
  let product = products.find(p => p.id === id);
  let existing = cart.find(i => i.id === id);
  if(existing) existing.qty += 1;
  else cart.push({ id:product.id, name:product.name, price:product.price, emoji:product.emoji, qty:1 });
  saveCart(); updateCartCount(); showToast(`✅ ${product.name} added`);
}
function updateCartCount() {
  let total = cart.reduce((s,i) => s + i.qty, 0);
  document.getElementById('cartCount').innerText = total;
}
function removeFromCart(id) { cart = cart.filter(i => i.id !== id); saveCart(); updateCartCount(); renderCart(); }
function updateQty(id, delta) {
  let item = cart.find(i => i.id === id);
  if(item) { item.qty = Math.max(1, item.qty + delta); saveCart(); updateCartCount(); renderCart(); }
}
function getCartTotal() { return cart.reduce((s,i) => s + i.price * i.qty, 0); }
function renderCart() {
  const itemsDiv = document.getElementById('cartItems');
  const summaryDiv = document.getElementById('cartSummary');
  if(!itemsDiv) return;
  if(cart.length === 0) {
    itemsDiv.innerHTML = `<div class="cart-empty"><i class="fa fa-shopping-bag"></i><h3>Cart Empty</h3><button class="btn-primary" onclick="showPage('shop')">Shop Now</button></div>`;
    summaryDiv.innerHTML = ''; return;
  }
  itemsDiv.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img" style="font-size:2rem;">${item.emoji || '👕'}</div>
      <div class="cart-item-info"><div class="cart-item-name">${item.name}</div><div class="cart-item-price">R${item.price}</div><div class="cart-item-controls"><button class="qty-btn" onclick="updateQty(${item.id}, -1)">−</button><span>${item.qty}</span><button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button><button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fa fa-trash"></i></button></div></div>
      <div class="cart-item-total">R${(item.price * item.qty).toLocaleString()}</div>
    </div>
  `).join('');
  const subtotal = getCartTotal();
  const delivery = subtotal > 0 ? 80 : 0;
  const total = subtotal + delivery;
  summaryDiv.innerHTML = `<h3>Order Summary</h3><div class="summary-row"><span>Subtotal</span><span>R${subtotal}</span></div><div class="summary-row"><span>Delivery</span><span>R${delivery}</span></div><div class="summary-row total"><span>Total</span><span class="amount">R${total}</span></div><button class="btn-primary full-btn" onclick="showPage('checkout')">Proceed to Checkout</button>`;
}

// ========== CHECKOUT ==========
function renderCheckout() {
  const summary = document.getElementById('orderSummary');
  if(!summary) return;
  if(cart.length === 0) { summary.innerHTML = '<p>Cart empty.</p>'; return; }
  const subtotal = getCartTotal();
  const total = subtotal + 80;
  summary.innerHTML = `<h3>Order Summary</h3>${cart.map(i => `<div class="order-item"><span>${i.emoji} ${i.name} x${i.qty}</span><span>R${i.price*i.qty}</span></div>`).join('')}<div class="order-total"><span>Total</span><span class="price">R${total}</span></div>`;
}
function placeOrder() {
  const first = document.getElementById('firstName')?.value;
  const last = document.getElementById('lastName')?.value;
  const email = document.getElementById('emailAddr')?.value;
  const phone = document.getElementById('phoneNum')?.value;
  const addr = document.getElementById('address')?.value;
  if(!first || !last || !email || !phone || !addr) return showToast('Please fill all fields');
  const payment = document.querySelector('input[name="payment"]:checked')?.value;
  const total = getCartTotal() + 80;
  const order = { 
    id: Date.now(), 
    customer: `${first} ${last}`, 
    email, phone, 
    address: addr, 
    items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty, emoji: i.emoji })), 
    total, 
    payment, 
    date: new Date().toISOString(),
    status: 'Pending' // default
  };
  let orders = JSON.parse(localStorage.getItem('deserve_orders') || '[]');
  orders.push(order); 
  localStorage.setItem('deserve_orders', JSON.stringify(orders));
  if(payment === 'whatsapp') {
    let msg = `Hi DESERVE! Order from ${first} ${last}\nItems: ${cart.map(i=>`${i.name} x${i.qty}`).join(', ')}\nTotal: R${total}\nAddress: ${addr}`;
    window.open(`https://wa.me/27687975725?text=${encodeURIComponent(msg)}`, '_blank');
  } else {
    document.getElementById('orderConfirmMsg').innerText = `Thank you ${first}! Your order is confirmed. You will receive payment instructions.`;
    document.getElementById('orderModal').classList.add('active');
  }
  cart = []; saveCart(); updateCartCount();
}
function closeModal() { document.getElementById('orderModal').classList.remove('active'); showPage('home'); }

// ========== ADMIN LOGIN & PANEL ==========
function adminLogin() {
  let pw = document.getElementById('adminPassword').value;
  if(pw === 'deserve2024') {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    renderAdminProducts(); 
    renderAdminOrders(); 
    updateAdminStats();
  } else showToast('Wrong password');
}

// ========== ADMIN PRODUCTS ==========
function renderAdminProducts() {
  const container = document.getElementById('adminProductList');
  container.innerHTML = products.map(p => `
    <div class="admin-product-row">
      <div class="admin-product-emoji">${p.emoji || '📦'}</div>
      <div class="admin-product-info"><strong>${p.name}</strong><span>R${p.price} · ${p.category}</span></div>
      <div class="admin-product-actions"><button class="admin-edit-btn" onclick="editProduct(${p.id})"><i class="fa fa-edit"></i></button><button class="admin-delete-btn" onclick="deleteProduct(${p.id})"><i class="fa fa-trash"></i></button></div>
    </div>
  `).join('');
}
function saveProduct() {
  let id = document.getElementById('editProductId').value;
  let name = document.getElementById('pName').value;
  let category = document.getElementById('pCategory').value;
  let price = parseFloat(document.getElementById('pPrice').value);
  let desc = document.getElementById('pDesc').value;
  let emoji = document.getElementById('pEmoji').value || '👕';
  let featured = document.getElementById('pFeatured').value === 'true';
  let file = document.getElementById('pImageUpload').files[0];
  const save = (imgData) => {
    if(id) {
      let idx = products.findIndex(p => p.id == id);
      if(idx !== -1) products[idx] = { ...products[idx], name, category, price, desc, emoji, featured, img: imgData };
    } else {
      let newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 5;
      products.push({ id:newId, name, category, price, desc, emoji, featured, img: imgData });
    }
    saveProducts(); clearProductForm(); renderAdminProducts(); updateAdminStats(); showToast('Product saved');
  };
  if(file) {
    let reader = new FileReader();
    reader.onload = (e) => save(e.target.result);
    reader.readAsDataURL(file);
  } else save(null);
}
function editProduct(id) {
  let p = products.find(p => p.id === id);
  if(p) {
    document.getElementById('pName').value = p.name;
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pDesc').value = p.desc;
    document.getElementById('pEmoji').value = p.emoji || '';
    document.getElementById('pFeatured').value = p.featured ? 'true' : 'false';
    document.getElementById('editProductId').value = p.id;
    document.getElementById('pImageUpload').value = '';
  }
}
function deleteProduct(id) { if(confirm('Permanently delete?')) { products = products.filter(p => p.id !== id); saveProducts(); renderAdminProducts(); updateAdminStats(); showToast('Deleted'); } }
function clearProductForm() {
  document.getElementById('pName').value = '';
  document.getElementById('pPrice').value = '';
  document.getElementById('pDesc').value = '';
  document.getElementById('pEmoji').value = '';
  document.getElementById('pFeatured').value = 'false';
  document.getElementById('editProductId').value = '';
  document.getElementById('pImageUpload').value = '';
}

// ========== ADMIN ORDERS ==========
function renderAdminOrders() {
  const container = document.getElementById('adminOrderList');
  let orders = JSON.parse(localStorage.getItem('deserve_orders') || '[]');
  if(orders.length === 0) {
    container.innerHTML = '<p style="color:var(--gray);">No orders yet.</p>';
    return;
  }
  // Sort by date descending (newest first)
  orders.sort((a,b) => new Date(b.date) - new Date(a.date));
  container.innerHTML = orders.map((o, idx) => `
    <div class="order-card">
      <div class="order-header">
        <span class="order-customer">👤 ${o.customer}</span>
        <span class="order-date">${new Date(o.date).toLocaleString()}</span>
        <span class="order-status status-${o.status.toLowerCase()}">${o.status}</span>
      </div>
      <div class="order-details">
        <span>📧 ${o.email}</span>
        <span>📱 ${o.phone}</span>
        <span style="grid-column:1/-1;">📍 ${o.address}</span>
      </div>
      <div class="order-items">
        <ul>${o.items.map(i => `<li><span>${i.emoji || '👕'} ${i.name} × ${i.qty}</span><span>R${(i.price * i.qty).toLocaleString()}</span></li>`).join('')}</ul>
        <div class="order-total">Total: R${o.total.toLocaleString()}</div>
      </div>
      <div class="order-actions">
        <select id="statusSelect_${o.id}" onchange="updateOrderStatus(${o.id}, this.value)">
          <option value="Pending" ${o.status==='Pending'?'selected':''}>Pending</option>
          <option value="Processing" ${o.status==='Processing'?'selected':''}>Processing</option>
          <option value="Shipped" ${o.status==='Shipped'?'selected':''}>Shipped</option>
          <option value="Delivered" ${o.status==='Delivered'?'selected':''}>Delivered</option>
        </select>
        <button onclick="updateOrderStatus(${o.id}, document.getElementById('statusSelect_${o.id}').value)">Update Status</button>
        <button style="background:var(--lime); color:black;" onclick="markDelivered(${o.id})">✅ Mark Delivered</button>
      </div>
    </div>
  `).join('');
}

function updateOrderStatus(orderId, newStatus) {
  let orders = JSON.parse(localStorage.getItem('deserve_orders') || '[]');
  let order = orders.find(o => o.id == orderId);
  if(order) {
    order.status = newStatus;
    localStorage.setItem('deserve_orders', JSON.stringify(orders));
    renderAdminOrders();
    updateAdminStats();
    showToast(`Order #${orderId} status updated to ${newStatus}`);
  }
}

function markDelivered(orderId) {
  updateOrderStatus(orderId, 'Delivered');
}

// ========== ADMIN TABS ==========
function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.admin-tab[onclick*="${tab}"]`)?.classList.add('active');
  document.getElementById('adminProductsTab').style.display = tab === 'products' ? 'block' : 'none';
  document.getElementById('adminOrdersTab').style.display = tab === 'orders' ? 'block' : 'none';
  if(tab === 'orders') renderAdminOrders();
  if(tab === 'products') renderAdminProducts();
}

// ========== STATS ==========
function updateAdminStats() {
  let orders = JSON.parse(localStorage.getItem('deserve_orders') || '[]');
  document.getElementById('totalProducts').innerText = products.length;
  document.getElementById('totalOrders').innerText = orders.length;
  let revenue = orders.reduce((s,o) => s + (o.total || 0), 0);
  document.getElementById('totalRevenue').innerText = `R${revenue.toLocaleString()}`;
  let pending = orders.filter(o => o.status === 'Pending').length;
  document.getElementById('pendingOrders').innerText = pending;
}

// ========== QUICK VIEW & CONTACT (unchanged) ==========
function openQuickView(id) {
  let p = products.find(p => p.id === id);
  if(p) {
    document.getElementById('quickViewContent').innerHTML = `<div class="qv-emoji" style="font-size:4rem;">${p.emoji}</div><span class="qv-tag">${p.category}</span><div class="qv-name">${p.name}</div><div class="qv-price">R${p.price}</div><div class="qv-desc">${p.desc}</div><button class="btn-primary" onclick="addToCart(${p.id});closeQuickView();">Add to Cart</button>`;
    document.getElementById('quickViewModal').classList.add('active');
  }
}
function closeQuickView() { document.getElementById('quickViewModal').classList.remove('active'); }
function sendContact() {
  let name = document.getElementById('contactName')?.value;
  let email = document.getElementById('contactEmail')?.value;
  let msg = document.getElementById('contactMessage')?.value;
  if(!name || !email || !msg) { showToast('Fill all fields'); return; }
  window.open(`https://wa.me/27687975725?text=${encodeURIComponent(`Contact: ${name}\nEmail: ${email}\nMessage: ${msg}`)}`, '_blank');
}
function toggleMenu() { document.getElementById('navLinks').classList.toggle('open'); }
function scrollToSection(id) { document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); }

// ========== INIT ==========
window.addEventListener('DOMContentLoaded', () => {
  updateCartCount(); renderFeatured(); renderShop(); renderCheckout();
  if(window.location.search.includes('admin')) {
    showPage('admin');
  }
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if(window.scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  });
});

// Expose globals
window.showPage = showPage; window.filterProducts = filterProducts; window.sortProducts = sortProducts;
window.handleSearch = handleSearch; window.addToCart = addToCart; window.openQuickView = openQuickView;
window.closeQuickView = closeQuickView; window.adminLogin = adminLogin; window.saveProduct = saveProduct;
window.clearProductForm = clearProductForm; window.editProduct = editProduct; window.deleteProduct = deleteProduct;
window.toggleMenu = toggleMenu; window.scrollToSection = scrollToSection; window.removeFromCart = removeFromCart;
window.updateQty = updateQty; window.placeOrder = placeOrder; window.closeModal = closeModal; window.sendContact = sendContact;
window.switchAdminTab = switchAdminTab; window.updateOrderStatus = updateOrderStatus; window.markDelivered = markDelivered;

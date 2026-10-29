const state = {
  products: [],
  category: "All",
  search: "",
  cart: JSON.parse(localStorage.getItem("shopease-cart") || "[]"),
  user: null,
  authMode: "login"
};

const $ = (selector) => document.querySelector(selector);
const productGrid = $("#productGrid");
const categoryFilters = $("#categoryFilters");
const toast = $("#toast");

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

function saveCart() {
  localStorage.setItem("shopease-cart", JSON.stringify(state.cart));
  renderCartCount();
}

function renderCartCount() {
  $("#cartCount").textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
}

function renderUser() {
  $("#welcomeText").textContent = state.user ? `Hi, ${state.user.name.split(" ")[0]}` : "";
  $("#authButton").textContent = state.user ? "Logout" : "Login / Sign up";
}

function renderCategories() {
  const categories = ["All", ...new Set(state.products.map(product => product.category))];
  categoryFilters.innerHTML = categories.map(category =>
    `<button class="filter-chip ${state.category === category ? "active" : ""}" data-category="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`
  ).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function renderProducts() {
  const search = state.search.toLowerCase();
  const filtered = state.products.filter(product => {
    const matchesCategory = state.category === "All" || product.category === state.category;
    const matchesSearch = `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  if (!filtered.length) {
    productGrid.innerHTML = '<p class="empty-state">No products found. Try another search.</p>';
    return;
  }

  productGrid.innerHTML = filtered.map(product => `
    <article class="product-card">
      <div class="product-visual" data-details="${product.id}" role="button" tabindex="0" aria-label="View ${escapeHtml(product.name)} details">
        <span class="product-tag">${escapeHtml(product.category)}</span>
        <span class="product-emoji" aria-hidden="true">${product.emoji}</span>
      </div>
      <div class="product-info">
        <p class="product-category">${escapeHtml(product.category)}</p>
        <h3 class="product-name" data-details="${product.id}">${escapeHtml(product.name)}</h3>
        <p class="product-description">${escapeHtml(product.description)}</p>
        <div class="product-bottom">
          <span class="product-price">${money(product.price)}</span>
          <button class="add-button" data-add="${product.id}" type="button" ${product.stock < 1 ? "disabled" : ""}>${product.stock < 1 ? "Sold out" : "+ Add to cart"}</button>
        </div>
      </div>
    </article>
  `).join("");
}

function addToCart(id) {
  const product = state.products.find(item => item.id === Number(id));
  if (!product) return;
  const existing = state.cart.find(item => item.id === product.id);
  if (existing && existing.quantity >= product.stock) return showToast("You have added all available stock.");
  if (!existing && product.stock < 1) return showToast("This product is out of stock.");
  if (existing) existing.quantity += 1;
  else state.cart.push({ id: product.id, quantity: 1 });
  saveCart();
  showToast(`${product.name} added to your cart.`);
}

function openProduct(id) {
  const product = state.products.find(item => item.id === Number(id));
  if (!product) return;
  $("#productDetails").innerHTML = `
    <div class="detail-visual">${product.emoji}</div>
    <p class="eyebrow">${escapeHtml(product.category)}</p>
    <h2>${escapeHtml(product.name)}</h2>
    <p class="detail-description">${escapeHtml(product.description)}</p>
    <p class="muted">${product.stock} in stock</p>
    <div class="detail-actions"><strong class="product-price">${money(product.price)}</strong><button class="button button-primary" data-add="${product.id}" type="button">Add to cart</button></div>
  `;
  $("#productDialog").showModal();
}

function renderCart() {
  const container = $("#cartItems");
  if (!state.cart.length) {
    container.innerHTML = '<p class="empty-state">Your cart is empty. Add a product to get started.</p>';
    $("#cartTotal").textContent = money(0);
    $("#checkoutButton").disabled = true;
    return;
  }

  let total = 0;
  container.innerHTML = state.cart.map(item => {
    const product = state.products.find(p => p.id === item.id);
    if (!product) return "";
    const subtotal = product.price * item.quantity;
    total += subtotal;
    return `
      <div class="cart-line">
        <div class="cart-emoji">${product.emoji}</div>
        <div>
          <h3>${escapeHtml(product.name)}</h3><p>${money(product.price)} each</p>
          <div class="quantity-controls">
            <button data-quantity="${product.id}" data-change="-1" type="button" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button data-quantity="${product.id}" data-change="1" type="button" aria-label="Increase quantity" ${item.quantity >= product.stock ? "disabled" : ""}>+</button>
          </div>
          <button class="remove-button" data-remove="${product.id}" type="button">Remove</button>
        </div>
        <span class="cart-line-total">${money(subtotal)}</span>
      </div>`;
  }).join("");
  $("#cartTotal").textContent = money(total);
  $("#checkoutButton").disabled = false;
}

function changeQuantity(id, change) {
  const item = state.cart.find(entry => entry.id === Number(id));
  const product = state.products.find(entry => entry.id === Number(id));
  if (!item || !product) return;
  item.quantity += Number(change);
  if (item.quantity <= 0) state.cart = state.cart.filter(entry => entry.id !== Number(id));
  if (item && item.quantity > product.stock) item.quantity = product.stock;
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(item => item.id !== Number(id));
  saveCart();
  renderCart();
}

function setAuthMode(mode) {
  state.authMode = mode;
  const isRegister = mode === "register";
  $("#authTitle").textContent = isRegister ? "Create your account" : "Login to your account";
  $("#nameField").classList.toggle("hidden", !isRegister);
  $("#authName").required = isRegister;
  $("#authPassword").autocomplete = isRegister ? "new-password" : "current-password";
  $("#authSubmit").textContent = isRegister ? "Create account" : "Login";
  $("#loginTab").classList.toggle("active", !isRegister);
  $("#registerTab").classList.toggle("active", isRegister);
  $("#authMessage").textContent = "";
  $("#authMessage").classList.remove("error");
}

async function loadUser() {
  const result = await api("/api/auth/me");
  state.user = result.user;
  renderUser();
}

async function placeOrder() {
  if (!state.cart.length) return showToast("Your cart is empty.");
  if (!state.user) {
    $("#cartDialog").close();
    setAuthMode("login");
    $("#authDialog").showModal();
    $("#authMessage").textContent = "Please log in to place your order.";
    return;
  }

  const button = $("#checkoutButton");
  button.disabled = true;
  button.textContent = "Placing order...";
  try {
    const result = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({ items: state.cart })
    });
    state.cart = [];
    saveCart();
    $("#cartDialog").close();
    await loadProducts();
    showToast(`${result.message} Order ID: ${result.order.id}`);
  } catch (error) {
    showToast(error.message);
    await loadProducts();
  } finally {
    button.disabled = false;
    button.textContent = "Place order";
    renderCart();
  }
}

async function loadProducts() {
  state.products = await api("/api/products");
  renderCategories();
  renderProducts();
}

productGrid.addEventListener("click", event => {
  const add = event.target.closest("[data-add]");
  const details = event.target.closest("[data-details]");
  if (add) addToCart(add.dataset.add);
  else if (details) openProduct(details.dataset.details);
});
productGrid.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-details]")) {
    event.preventDefault();
    openProduct(event.target.dataset.details);
  }
});
categoryFilters.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderCategories();
  renderProducts();
});
$("#searchInput").addEventListener("input", event => {
  state.search = event.target.value;
  renderProducts();
});
$("#cartButton").addEventListener("click", () => {
  renderCart();
  $("#cartDialog").showModal();
});
$("#checkoutButton").addEventListener("click", placeOrder);
$("#loginTab").addEventListener("click", () => setAuthMode("login"));
$("#registerTab").addEventListener("click", () => setAuthMode("register"));
$("#authButton").addEventListener("click", async () => {
  if (state.user) {
    try {
      await api("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
      state.user = null;
      renderUser();
      showToast("Logged out successfully.");
    } catch (error) {
      showToast(error.message);
    }
    return;
  }
  setAuthMode("login");
  $("#authDialog").showModal();
});
$("#authForm").addEventListener("submit", async event => {
  event.preventDefault();
  const message = $("#authMessage");
  message.textContent = "";
  message.classList.remove("error");
  const isRegister = state.authMode === "register";
  const body = {
    email: $("#authEmail").value,
    password: $("#authPassword").value
  };
  if (isRegister) body.name = $("#authName").value;
  $("#authSubmit").disabled = true;
  try {
    const result = await api(isRegister ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    });
    state.user = result.user;
    renderUser();
    $("#authDialog").close();
    $("#authForm").reset();
    showToast(result.message);
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  } finally {
    $("#authSubmit").disabled = false;
  }
});
$("#cartItems").addEventListener("click", event => {
  const quantity = event.target.closest("[data-quantity]");
  const remove = event.target.closest("[data-remove]");
  if (quantity) changeQuantity(quantity.dataset.quantity, quantity.dataset.change);
  if (remove) removeFromCart(remove.dataset.remove);
});
document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => $(`#${button.dataset.close}`).close());
});
document.querySelectorAll("dialog").forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
});

(async function init() {
  try {
    await loadProducts();
    await loadUser();
    renderCartCount();
  } catch (error) {
    productGrid.innerHTML = `<p class="empty-state">Could not load the store. Make sure the Node.js server is running, then refresh this page.</p>`;
    console.error(error);
  }
})();
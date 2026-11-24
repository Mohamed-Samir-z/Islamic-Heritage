function askAdminPassword() {
  window.location.href = "admin.html";
}
// ÙÙÙ Ø§ÙÙÙØ¯ Ø§ÙØ±ÙÙÙØ³Ù app.js

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyLu7JJfHoSyWbIjO0vwybOyWO1SFU_LTqB-k9T3pY99u3xVZLRGVq-1C8TPB-m7XCPzg/exec";

// ===== Customer session layer v71 =====
(function () {
  const _origFetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    try {
      if (typeof WEB_APP_URL !== "undefined" && typeof url === "string" && url.startsWith(WEB_APP_URL)) {
        const tok = localStorage.getItem("mesk_token") || "";
        if (tok) {
          if (opts && opts.body) {
            const b = JSON.parse(opts.body);
            b.token = tok;
            opts = Object.assign({}, opts, { body: JSON.stringify(b) });
          } else {
            url += (url.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(tok);
          }
        }
      }
    } catch (e) {}
    return _origFetch(url, opts).then((r) => {
      try {
        return r.clone().json().then((j) => {
          if (j && j.error === "unauthorized" && typeof WEB_APP_URL !== "undefined" && typeof url === "string" && url.startsWith(WEB_APP_URL)) {
            localStorage.removeItem("mesk_customer");
            localStorage.removeItem("mesk_token");
            
          }
          return r;
        }).catch(() => r);
      } catch (e) { return r; }
    });
  };
})();
// ===== end customer session layer =====


let products = [];

const meskAlert = Swal.mixin({
  target: document.body,
  background: "#ffffff",
  color: "#1c3d27",
  confirmButtonColor: "#1c3d27",
  cancelButtonColor: "#c5a880",
  reverseButtons: true,
  customClass: {
    popup: "mesk-popup",
    title: "mesk-title",
    confirmButton: "mesk-confirm",
    cancelButton: "mesk-cancel",
  },
});

// Ø¥Ø¹Ø¯Ø§Ø¯ ÙØµÙÙÙØ© Ø§ÙØ³ÙØ© ÙØ¹ ØªØ­ÙÙÙ Ø§ÙØ¨ÙØ§ÙØ§Øª Ø§ÙÙØ®Ø²ÙØ© ÙØ³Ø¨ÙØ§Ù ÙÙ Ø§ÙÙØªØµÙØ­
let cart = JSON.parse(localStorage.getItem("mesk_cart")) || [];

// Ø¹ÙØ§ØµØ± ÙØ§Ø¬ÙØ© Ø§ÙÙØ³ØªØ®Ø¯Ù Ø§ÙÙØ³ØªÙØ¯ÙØ©
const menuToggleBtn = document.getElementById("menuToggleBtn");
const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
const mobileSidebar = document.getElementById("mobileSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

const cartToggleBtn = document.getElementById("cartToggleBtn");
const cartCloseBtn = document.getElementById("cartCloseBtn");
const cartSidebar = document.getElementById("cartSidebar");

const cartCount = document.getElementById("cartCount");
const cartItemsList = document.getElementById("cartItemsList");
const cartTotalAmount = document.getElementById("cartTotalAmount");
const toastNotice = document.getElementById("toastNotice");
const checkoutBtn = document.getElementById("checkoutBtn");

const searchToggleBtn = document.getElementById("searchToggleBtn");
const searchBarContainer = document.getElementById("searchBarContainer");
const searchInput = document.getElementById("searchInput");

// ØªØ­Ø¯ÙØ« Ø§ÙØ³ÙØ© ÙÙØ± ØªØ´ØºÙÙ Ø§ÙØµÙØ­Ø©
document.addEventListener("DOMContentLoaded", initApp);

let favorites = [];

function getCustomer() {
  return JSON.parse(localStorage.getItem("mesk_customer"));
}

async function loadFavorites() {
  const customer = getCustomer();

  if (!customer) {
    favorites = [];
    return;
  }

  const response = await fetch(
    `${WEB_APP_URL}?action=getFavorites&customerId=${customer.id}`,
  );

  favorites = await response.json();

  favorites = favorites.map((item) => String(item.productId));

  console.log(favorites);
}

function bindStaticEvents() {
  document.getElementById("heroShopNow").addEventListener("click", () => {
    switchPage("products-page");

    resetFilters();
  });
}

function normalizeArabic(text = "") {
  return text
    .toLowerCase()
    .replace(/[Ø£Ø¥Ø¢]/g, "Ø§")
    .replace(/Ø©/g, "Ù")
    .replace(/Ù/g, "Ù")
    .replace(/Ø¤/g, "Ù")
    .replace(/Ø¦/g, "Ù")
    .replace(/[\u064B-\u065F]/g, "")
    .trim();
}

function smartSearch(text, query) {
  const normalizedText = normalizeArabic(text);

  const queryWords = normalizeArabic(query).split(/\s+/).filter(Boolean);

  return queryWords.every((word) => normalizedText.includes(word));
}

async function loadProducts() {
  try {
    const response = await fetch(WEB_APP_URL);

    const data = await response.json();

    products = data.map((item) => ({
      id: Number(item.id),
      name: item.name,
      price: Number(item.price),
      discount: Number(item.discount || 0),
      stock: Number(item.stock || 0),
      category: item.category,
      image: item.imageUrl,
      images: item.images || [],
      description: item.description,
    }));

    validateCartStock();

    renderProducts();
    await renderCategories();
  } catch (err) {
    console.error(err);
  }
}

function saveProducts() {
  localStorage.setItem("mesk_products", JSON.stringify(products));
}

function getFinalPrice(product) {
  if (!product.discount) return product.price;

  return Math.round(product.price - (product.price * product.discount) / 100);
}

function renderProducts() {
  const container = document.getElementById("mainProductsGrid");

  container.innerHTML = "";

  products.forEach((product) => {
    container.innerHTML += `
      <div
        class="product-card"
        data-cat="${product.category}"
        data-description="${product.description || ""}">
      
      ${
        product.discount > 0
          ? `
          <div class="discount-badge">
          Ø®ØµÙ ${product.discount}%
          </div>
          `
          : ""
      }
      <a href="product.html?id=${product.id}">
        <div
        class="product-img-placeholder"
        style="
        background-image:url('${product.image}');
        ">
        </div>
      </a>

      <div class="product-info">

      <span class="product-tag">
      ${product.category}
      </span>

      <h3
        class="product-title"
        data-name="${product.name}">

        <a href="product.html?id=${product.id}">
        ${product.name}
        </a>

      </h3>
      <div class="product-stock ${product.stock <= 0 ? "out-stock" : ""}">
        ${product.stock <= 0 ? "ÙÙØ¯ Ø§ÙÙØ®Ø²ÙÙ" : `ÙØªØ¨ÙÙ ${product.stock} ÙØ·Ø¹Ø©`}
      </div>

      <div class="product-meta">

      ${
        product.discount > 0
          ? `
          <div class="price-box">

              <span class="old-price">
                  ${product.price} Ø¬.Ù
              </span>

              <span class="new-price">
                  ${getFinalPrice(product)} Ø¬.Ù
              </span>

          </div>
          `
          : `
          <span
          class="product-price"
          data-price="${product.price}">
          ${product.price} Ø¬.Ù
          </span>
          `
      }

      <button

        class="favorite-btn

        ${favorites.includes(String(product.id)) ? "active" : ""}"

        data-id="${product.id}">

        <i class="fa-${
          favorites.includes(String(product.id)) ? "solid" : "regular"
        } fa-heart"></i>

      </button>

      ${
        product.stock > 0
          ? `<button
              class="add-to-cart-btn btn-add"
              data-id="${product.id}">
          <i class="fa-solid fa-plus"></i>
          </button>`
          : `<button
          class="out-stock-btn"
          disabled>

          ØºÙØ± ÙØªÙÙØ±

          </button>`
      }

      </div>

      </div>

      </div>
    `;
  });
}
// 1. ÙØ¸Ø§Ù Ø§ÙØ§ÙØªÙØ§Ù Ø¨ÙÙ Ø§ÙØµÙØ­Ø§Øª (SPA Switcher)
function switchPage(pageId) {
  // Ø¥Ø®ÙØ§Ø¡ Ø¬ÙÙØ¹ Ø§ÙØµÙØ­Ø§Øª
  document.querySelectorAll(".page-view").forEach((view) => {
    view.classList.remove("active");
  });
  // Ø¥Ø¸ÙØ§Ø± Ø§ÙØµÙØ­Ø© Ø§ÙÙØ³ØªÙØ¯ÙØ©
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
    window.scrollTo(0, 0);
  }

  // ØªØ­Ø¯ÙØ« Ø­Ø§ÙØ© Ø§ÙØ£Ø²Ø±Ø§Ø± Ø§ÙÙØ´Ø·Ø© (Ø§ÙØ±Ø¦ÙØ³ÙØ© ÙØ§ÙÙÙØ¨Ø§ÙÙ)
  document
    .querySelectorAll(".nav-link-btn, .sidebar-link-btn")
    .forEach((btn) => {
      if (btn.getAttribute("data-target") === pageId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
}

// Ø±Ø¨Ø· Ø£Ø²Ø±Ø§Ø± Ø§ÙÙÙØ¯Ø± ÙØ§ÙÙÙÙÙ Ø§ÙØ¬Ø§ÙØ¨Ù ÙØ§ÙÙÙØªØ± Ø¨ÙØ¸Ø§Ù Ø§ÙØµÙØ­Ø§Øª
document
  .querySelectorAll(".nav-link-btn, .sidebar-link-btn, .footer-nav-btn")
  .forEach((button) => {
    button.addEventListener("click", (e) => {
      const target = button.getAttribute("data-target");
      switchPage(target);
      closeMenu(); // Ø¥ØºÙØ§Ù Ø§ÙÙÙÙÙ Ø¥Ø°Ø§ ÙÙØ§ ÙÙ Ø§ÙÙÙØ¨Ø§ÙÙ
    });
  });

// 2. ÙØªØ­ ÙØ¥ØºÙØ§Ù Ø§ÙÙÙÙÙ Ø§ÙØ¬Ø§ÙØ¨Ù ÙÙ Ø§ÙÙÙØ¨Ø§ÙÙ
menuToggleBtn.addEventListener("click", () => {
  mobileSidebar.classList.add("active");
  sidebarOverlay.classList.add("active");
});

const closeMenu = () => {
  mobileSidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
};
sidebarCloseBtn.addEventListener("click", closeMenu);
sidebarOverlay.addEventListener("click", () => {
  closeMenu();
  cartSidebar.classList.remove("active");
});

// 3. ÙØªØ­ ÙØ¥ØºÙØ§Ù Ø³ÙØ© Ø§ÙÙØ´ØªØ±ÙØ§Øª
cartToggleBtn.addEventListener("click", () => {
  cartSidebar.classList.add("active");
  sidebarOverlay.classList.add("active");
});
cartCloseBtn.addEventListener("click", () => {
  cartSidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
});

// 4. ØªÙØ¹ÙÙ ÙØ¥ØºÙØ§Ù Ø´Ø±ÙØ· Ø§ÙØ¨Ø­Ø« ÙØ§ÙØ¨Ø­Ø« Ø§ÙÙÙØ±Ù
searchToggleBtn.addEventListener("click", () => {
  searchBarContainer.classList.toggle("active");
  if (searchBarContainer.classList.contains("active")) {
    searchInput.focus();
  }
});

searchInput.addEventListener("input", (e) => {
  const query = normalizeArabic(e.target.value);

  // ÙÙ ÙØ±Ø¨Ø¹ Ø§ÙØ¨Ø­Ø« ÙØ§Ø¶Ù
  if (!query) {
    document
      .querySelectorAll("#mainProductsGrid .product-card")
      .forEach((card) => {
        card.style.display = "block";
      });

    const noResults = document.getElementById("noResultsMessage");

    if (noResults) {
      noResults.style.display = "none";
    }

    return;
  }

  switchPage("products-page");

  let found = false;

  document
    .querySelectorAll("#mainProductsGrid .product-card")
    .forEach((card) => {
      const title = normalizeArabic(
        card.querySelector(".product-title").getAttribute("data-name"),
      );

      const category = normalizeArabic(card.getAttribute("data-cat"));

      const description = normalizeArabic(
        card.getAttribute("data-description"),
      );

      const match =
        smartSearch(title, query) ||
        smartSearch(category, query) ||
        smartSearch(description, query);

      if (match) {
        card.style.display = "block";

        found = true;
      } else {
        card.style.display = "none";
      }
    });

  const noResults = document.getElementById("noResultsMessage");

  if (noResults) {
    noResults.style.display = found ? "none" : "block";
  }
});

// 5. ÙØ¸Ø§Ù Ø§ÙÙÙØªØ±Ø© ÙØ§ÙØªØµÙÙØ© ÙØµÙØ­Ø© Ø§ÙÙÙØªØ¬Ø§Øª
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const filterValue = btn.getAttribute("data-filter");
    filterProducts(filterValue);
  });
});

function filterProducts(category) {
  const titleElement = document.getElementById("productsPageTitle");
  if (category === "all") {
    titleElement.textContent = "ÙÙ Ø§ÙÙÙØªØ¬Ø§Øª";
    document
      .querySelectorAll("#mainProductsGrid .product-card")
      .forEach((c) => (c.style.display = "block"));
  } else {
    titleElement.textContent = `ÙØ³Ù Ø§ÙÙ ${category}`;
    document
      .querySelectorAll("#mainProductsGrid .product-card")
      .forEach((c) => {
        if (c.getAttribute("data-cat") === category) c.style.display = "block";
        else c.style.display = "none";
      });
  }
}

function resetFilters() {
  const buttons = document.querySelectorAll(".filter-btn");

  if (!buttons.length) {
    console.warn("Filters not loaded yet");

    return;
  }

  buttons.forEach((btn) => {
    btn.classList.remove("active");
  });

  const allBtn = document.querySelector('.filter-btn[data-filter="all"]');

  if (allBtn) {
    allBtn.classList.add("active");
  }

  filterProducts("all");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".btn-add")) return;

  const button = e.target.closest(".btn-add");

  const id = Number(button.dataset.id);

  const product = products.find((item) => item.id === id);
  if (!product) {
    console.error("Product not found:", id);
    return;
  }
  if (product.stock <= 0) {
    Swal.fire({
      icon: "error",
      title: "ÙÙØ¯ Ø§ÙÙØ®Ø²ÙÙ",
    });
    return;
  }

  addToCart({
    id: product.id,
    name: product.name,
    price: getFinalPrice(product),
    imageUrl: product.image,
  });
});
function addToCart(product) {
  const fullProduct = products.find((item) => item.id === product.id);

  const currentQtyInCart =
    cart.find((item) => item.id === product.id)?.qty || 0;

  if (currentQtyInCart >= fullProduct.stock) {
    meskAlert.fire({
      icon: "warning",
      title: "ÙØµÙØª ÙÙØ­Ø¯ Ø§ÙØ£ÙØµÙ ÙÙ Ø§ÙÙØ®Ø²ÙÙ",
    });

    return;
  }
  // Ø§ÙØªØ­ÙÙ ÙÙ ÙØ¬ÙØ¯ Ø§ÙÙÙØªØ¬ ÙØ³Ø¨ÙØ§Ù ÙØ²ÙØ§Ø¯Ø© Ø§ÙÙÙÙØ©
  const existingItem = cart.find((item) => item.id === product.id);
  if (existingItem) {
    existingItem.qty += 1;

    // ÙØ­Ø¯Ø« Ø§ÙØ¨ÙØ§ÙØ§Øª Ø§ÙÙØ¯ÙÙØ© Ø§ÙÙÙØ¬ÙØ¯Ø© ÙÙ Ø§ÙØ³ÙØ©
    existingItem.imageUrl = product.imageUrl;
    existingItem.name = product.name;
    existingItem.price = product.price;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      qty: 1,
    });
  }

  saveAndRefreshCart();
}

function saveAndRefreshCart() {
  localStorage.setItem("mesk_cart", JSON.stringify(cart));
  updateCartUI();
  showToast(" ØªÙØª Ø§Ø¶Ø§ÙØªÙ ÙÙØ³ÙØ©");
}

function updateCartUI() {
  // Ø­Ø³Ø§Ø¨ Ø¥Ø¬ÙØ§ÙÙ Ø¹Ø¯Ø¯ Ø§ÙÙØ·Ø¹ Ø¨Ø§ÙØ³ÙØ©
  const totalItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);
  cartCount.textContent = totalItemsCount;

  // ØªØ£Ø«ÙØ± Ø§ÙØ­Ø±ÙØ© ÙØ¹Ø¯Ø§Ø¯ Ø§ÙØ³ÙØ©
  cartCount.classList.add("bump");
  setTimeout(() => cartCount.classList.remove("bump"), 300);

  if (cart.length === 0) {
    cartItemsList.innerHTML =
      '<p class="empty-cart-msg">Ø§ÙØ³ÙØ© ÙØ§Ø±ØºØ© Ø­Ø§ÙÙØ§Ù</p>';
    cartTotalAmount.textContent = "0 Ø¬.Ù";
    return;
  }

  cartItemsList.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;

    const itemHTML = `
      <div class="cart-item">

          <img
              src="${item.imageUrl}"
              class="cart-item-image"
              alt="${item.name}"
          >

          <div class="cart-item-details">

              <div class="cart-item-title">

                  ${item.name}

                  ${
                    item.outOfStock
                      ? `<div class="out-stock-label">
                          ÙÙØ¯ Ø§ÙÙØ®Ø²ÙÙ
                        </div>`
                      : ""
                  }

              </div>

              <div class="cart-item-price">
                  ${item.price} Ø¬.Ù
              </div>

              <div class="cart-qty-controls">

                  ${
                    item.outOfStock
                      ? `
                      <span class="stock-ended">
                          ØºÙØ± ÙØªÙÙØ± Ø­Ø§ÙÙØ§Ù
                      </span>
                      `
                      : `
                      <button
                          class="cart-qty-btn"
                          onclick="changeQty('${item.id}',-1)">
                          -
                      </button>

                      <span style="font-size:14px;font-weight:bold;">
                          ${item.qty}
                      </span>

                      <button
                          class="cart-qty-btn"
                          onclick="changeQty('${item.id}',1)">
                          +
                      </button>
                      `
                  }

              </div>

          </div>

          <button
              class="remove-item-btn"
              onclick="removeFromCart('${item.id}')">

              <i class="fa-solid fa-trash-can"></i>

          </button>

      </div>
      `;
    cartItemsList.insertAdjacentHTML("beforeend", itemHTML);
  });

  cartTotalAmount.textContent = `${total} Ø¬.Ù`;
}

// ØªØºÙÙØ± Ø§ÙÙÙÙØ© Ø¨Ø§ÙØ²ÙØ§Ø¯Ø© ÙØ§ÙÙÙØµØ§Ù
window.changeQty = function (id, change) {
  const item = cart.find((item) => String(item.id) === String(id));

  if (!item) return;

  const fullProduct = products.find(
    (product) => String(product.id) === String(id),
  );

  if (change > 0 && item.qty >= fullProduct.stock) {
    Swal.fire({
      icon: "warning",
      title: "ÙØ§ ÙÙØ¬Ø¯ ÙØ®Ø²ÙÙ Ø¥Ø¶Ø§ÙÙ",
    });

    return;
  }

  item.qty += change;

  if (item.qty <= 0) {
    cart = cart.filter((item) => String(item.id) !== String(id));
  }

  saveAndRefreshCart();
};

// Ø­Ø°Ù ÙÙØªØ¬ Ø¨Ø§ÙÙØ§ÙÙ ÙÙ Ø§ÙØ³ÙØ©
window.removeFromCart = function (id) {
  cart = cart.filter((item) => String(item.id) !== String(id));

  saveAndRefreshCart();
};
// Ø¥Ø¸ÙØ§Ø± Ø§ÙØªÙØ¨ÙÙØ§Øª Ø§ÙØ°ÙÙØ©

document.getElementById("closeCustomerModal").addEventListener("click", () => {
  customerModal.classList.remove("active");
});

customerModal.addEventListener("click", (e) => {
  if (e.target === customerModal) {
    customerModal.classList.remove("active");
  }
});
checkoutBtn.addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("Ø§ÙØ³ÙØ© ÙØ§Ø±ØºØ©");

    return;
  }

  cartSidebar.classList.remove("active");
  window.location.href = "checkout.html";
});

// 8. Ø§ÙØªØ¹Ø§ÙÙ ÙØ¹ ÙÙØ±ÙØ© "ØªÙØ§ØµÙ ÙØ¹ÙØ§" ÙØªÙØ¬ÙÙ Ø§ÙØ§Ø³ØªÙØ³Ø§Ø± ÙÙÙØ§ØªØ³Ø§Ø¨
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("contactName").value;
  const phone = document.getElementById("contactPhone").value;
  const msg = document.getElementById("contactMessage").value;

  let contactMsg = `ÙØ±Ø­Ø¨Ø§Ù ÙØªØ¬Ø± ÙØ³Ù ÙÙØªØ±Ø§Ø«Ø ÙØ¯Ù Ø§Ø³ØªÙØ³Ø§Ø± Ø¬Ø¯ÙØ¯:\n\n`;
  contactMsg += `ð¤ *Ø§ÙØ§Ø³Ù:* ${name}\n`;
  contactMsg += `ð *Ø±ÙÙ Ø§ÙØªÙØ§ØµÙ:* ${phone}\n`;
  contactMsg += `âï¸ *Ø§ÙØ±Ø³Ø§ÙØ©:* ${msg}`;

  const encodedContactMsg = encodeURIComponent(contactMsg);
  window.open(`https://wa.me/201007569287?text=${encodedContactMsg}`, "_blank");

  // ØªØµÙÙØ± Ø§ÙÙÙØ±ÙØ© Ø¨Ø¹Ø¯ Ø§ÙØ¥Ø±Ø³Ø§Ù
  document.getElementById("contactForm").reset();
  showToast("ØªÙ ØªØ­ÙÙÙ Ø±Ø³Ø§ÙØªÙ Ø¥ÙÙ Ø§ÙÙØ§ØªØ³Ø§Ø¨ Ø¨ÙØ¬Ø§Ø­!");
});

// --- ÙÙØ¯ Ø¨ÙØ§Ø¡ Ø³Ø¨Ø­Ø© Ø§ÙÙÙØ¬Ù Ø§ÙØ¯ÙÙØ§ÙÙÙÙØ© ÙØ¹ Ø§ÙØ´Ø±Ø§Ø¨Ø© Ø§ÙÙØªØ­Ø±ÙØ© ---
// --- ÙÙØ¯ Ø¨ÙØ§Ø¡ ÙØªØ¯ÙÙØ± Ø§ÙØ³Ø¨Ø­Ø© ÙØ§ÙØ´Ø±Ø§Ø¨Ø© Ø¯ÙÙØ§ÙÙÙÙØ§Ù Ø¨Ø£Ø¹ÙÙ Ø¯ÙØ© ÙÙØ¯Ø³ÙØ© ---
let tasselAnimationId = null;

function buildTasbihRing() {
  const ring = document.getElementById("tasbihRing");
  const tassel = document.getElementById("tasbihTassel");
  if (!ring) return;

  ring.innerHTML = "";
  if (tasselAnimationId) cancelAnimationFrame(tasselAnimationId);

  const beadsCount = 33;
  const containerWidth = ring.parentElement.clientWidth;
  const radius = containerWidth / 2 - 6;
  const center = containerWidth / 2;

  // 1. Ø¨ÙØ§Ø¡ Ø§ÙØ®Ø±Ø² ÙÙ Ø£ÙØ§ÙÙÙ Ø§ÙØ«Ø§Ø¨ØªØ© Ø¯Ø§Ø®Ù Ø§ÙÙ Ø§ÙÙ Ring
  for (let i = 0; i < beadsCount; i++) {
    const bead = document.createElement("div");
    bead.className = "bead";

    const angle = (i / beadsCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius + center;
    const y = Math.sin(angle) * radius + center;

    bead.style.left = `calc(${x}px - 4px)`;
    bead.style.top = `calc(${y}px - 4px)`;

    ring.appendChild(bead);

    // Ø®Ø±Ø² Ø§ÙÙÙØ§ØµÙ
    if (i % 11 === 0) {
      bead.style.background =
        "radial-gradient(circle at 35% 35%, #fff, #c5a880, #8a6f43)";
    }

    // ØªÙÙÙØ² Ø§ÙØ®Ø±Ø²Ø© Ø§ÙØ±Ø¦ÙØ³ÙØ© (Ø±ÙÙ 0) Ø§ÙÙÙ ÙÙÙØ­ÙÙØ§ Ø§ÙØ¯ÙØ§ÙØ©
    if (i === 0) {
      bead.style.background =
        "radial-gradient(circle at 35% 35%, #fff, #ebd4b2, #a68453)";
      bead.style.width = "10px";
      bead.style.height = "10px";
    }
  }

  // 2. ØªØ­Ø±ÙÙ Ø§ÙØ´Ø±Ø§Ø¨Ø© Ø¯ÙÙØ§ÙÙÙÙØ§Ù ÙØ¹ Ø¯ÙØ±Ø§Ù Ø§ÙÙ CSS (Ø§ÙÙØ­Ø§ÙØ§Ø© Ø§ÙÙÙØ²ÙØ§Ø¦ÙØ© Ø§ÙÙØ®ÙØ©)
  if (tassel) {
    // ÙÙØª Ø¨Ø¯Ø§ÙØ© Ø§ÙØ£ÙÙÙÙØ´Ù ÙØ±Ø¨Ø·Ù Ø¨Ø§ÙÙ CSS (Ø§ÙØ³Ø¨Ø­Ø© Ø¨ØªÙÙ ÙÙØ© ÙØ§ÙÙØ© ÙÙ 25 Ø«Ø§ÙÙØ© Ø¨ÙØ§Ø¡ Ø¹ÙÙ Ø§ÙÙ CSS)
    const startTime = performance.now();
    const duration = 25000; // 25 Ø«Ø§ÙÙØ© ÙÙØªÙØ¨Ø© ÙÙ Ø§ÙÙ CSS (animation: spin 25s)

    function updateTasselPosition(currentTime) {
      const elapsedTime = currentTime - startTime;

      // Ø­Ø³Ø§Ø¨ ÙØ³Ø¨Ø© Ø§ÙØ¯ÙØ±Ø§Ù Ø§ÙØ­Ø§ÙÙØ© (ÙÙ 0 ÙÙ 1)
      const progress = (elapsedTime % duration) / duration;

      // ØªØ­ÙÙÙ Ø§ÙÙØ³Ø¨Ø© ÙØ²Ø§ÙÙØ© Ø¨Ø§ÙØ±Ø§Ø¯ÙØ§Ù (ÙØ¹ Ø¥Ø¶Ø§ÙØ© Math.PI / 2 ÙØªØ¨Ø¯Ø£ Ø§ÙØ´Ø±Ø§Ø¨Ø© ÙÙ Ø§ÙØ£Ø³ÙÙ ØªÙØ§ÙØ§Ù ØªØ²Ø§ÙÙØ§Ù ÙØ¹ Ø§ÙØ®Ø±Ø²Ø© 0)
      const currentAngle = progress * Math.PI * 2 + 0 * Math.PI * 2;

      // Ø­Ø³Ø§Ø¨ Ø§ÙØ¥Ø­Ø¯Ø§Ø«ÙØ§Øª Ø§ÙØ¯ÙÙØ§ÙÙÙÙØ© ÙÙÙÙØ¹ Ø§ÙØ®Ø±Ø²Ø© Ø±ÙÙ 0 Ø£Ø«ÙØ§Ø¡ Ø¯ÙØ±Ø§ÙÙØ§
      const tasselX = Math.cos(currentAngle) * radius + center;
      const tasselY = Math.sin(currentAngle) * radius + center;

      // ÙÙÙ Ø§ÙØ´Ø±Ø§Ø¨Ø© ÙÙÙÙØ§Ù Ø§ÙØ¬Ø¯ÙØ¯ ÙØ¹ Ø§ÙØ­ÙØ§Ø¸ Ø¹ÙÙ Ø§ÙÙ transform Ø§ÙÙ Ø®Ø§Øµ Ø¨Ø§ÙÙ Swing ÙÙ Ø§ÙÙ CSS
      tassel.style.left = `${tasselX}px`;
      tassel.style.top = `${tasselY}px`;

      tasselAnimationId = requestAnimationFrame(updateTasselPosition);
    }
    tasselAnimationId = requestAnimationFrame(updateTasselPosition);
  }
}

async function loadUnreadNotifications() {
  const customer = getCustomer();

  if (!customer) return;

  const response = await fetch(
    `${WEB_APP_URL}?action=getUnreadNotifications&customerId=${customer.id}`,
  );

  const result = await response.json();

  const badge = document.getElementById("notificationBadge");

  if (result.count > 0) {
    badge.textContent = result.count;

    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

// ØªØ´ØºÙÙ ÙØªØ­Ø¯ÙØ« Ø§ÙØ¯Ø§ÙØ© ÙÙØ±Ø§Ù ÙØ¹ÙØ¯ ØªØºÙÙØ± Ø­Ø¬Ù Ø§ÙØ´Ø§Ø´Ø©

window.addEventListener("resize", buildTasbihRing);
buildTasbihRing();

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".favorite-btn");

  if (!btn) return;

  if (!getCustomer()) {
    loginModal.classList.add("show");

    return;
  }

  const productId = btn.dataset.id;

  const isFav = favorites.includes(productId);

  await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: isFav ? "removeFavorite" : "addFavorite",

      customerId: getCustomer().id,

      productId,
    }),
  });

  if (isFav) {
    favorites = favorites.filter((id) => id !== productId);

    btn.classList.remove("active");

    btn.innerHTML = '<i class="fa-regular fa-heart"></i>';
  } else {
    favorites.push(productId);

    btn.classList.add("active");

    btn.innerHTML = '<i class="fa-solid fa-heart"></i>';
  }
});

if (!localStorage.getItem("mesk_products")) {
  localStorage.setItem("mesk_products", JSON.stringify(products));
}

const logo = document.querySelector(".tasbih-container");

let pressTimer;

logo.addEventListener("mousedown", () => {
  pressTimer = setTimeout(() => {
    askAdminPassword();
  }, 3000);
});

logo.addEventListener("mouseup", () => {
  clearTimeout(pressTimer);
});

logo.addEventListener("mouseleave", () => {
  clearTimeout(pressTimer);
});

logo.addEventListener("touchstart", () => {
  pressTimer = setTimeout(() => {
    askAdminPassword();
  }, 3000);
});

logo.addEventListener("touchend", () => {
  clearTimeout(pressTimer);
});

logo.addEventListener("touchcancel", () => {
  clearTimeout(pressTimer);
});




function validateCartStock() {
  let cartChanged = false;

  cart = cart.filter((cartItem) => {
    const product = products.find((p) => String(p.id) === String(cartItem.id));

    if (!product) {
      cartChanged = true;
      return false;
    }

    if (product.stock <= 0) {
      cartItem.outOfStock = true;
      cartChanged = true;

      return true;
    }

    if (cartItem.qty > product.stock) {
      cartItem.qty = product.stock;
      cartChanged = true;
    }

    cartItem.outOfStock = false;

    return true;
  });

  if (cartChanged) {
    localStorage.setItem("mesk_cart", JSON.stringify(cart));

    updateCartUI();

    Swal.fire({
      icon: "info",
      title: "ØªÙ ØªØ­Ø¯ÙØ« Ø§ÙØ³ÙØ©",
      text: "ØªÙ ØªØ¹Ø¯ÙÙ Ø§ÙÙÙÙØ§Øª Ø­Ø³Ø¨ Ø§ÙÙØ®Ø²ÙÙ Ø§ÙÙØªØ§Ø­",
      confirmButtonColor: "#1c3d27",
    });
  }
}

document.getElementById("sendOrderBtn").addEventListener("click", () => {
  const customerName = document.getElementById("customerName").value.trim();

  const customerPhone = document.getElementById("customerPhone").value.trim();

  const customerCity = document.getElementById("customerCity").value.trim();

  const customerAddress = document
    .getElementById("customerAddress")
    .value.trim();

  if (!customerName || !customerPhone || !customerAddress) {
    meskAlert.fire({
      icon: "warning",
      title: "Ø£ÙÙÙ Ø§ÙØ¨ÙØ§ÙØ§Øª",
      text: "ÙØ±Ø¬Ù ØªØ¹Ø¨ÙÙØ© Ø¬ÙÙØ¹ Ø§ÙØ­ÙÙÙ",
    });

    return;
  }

  let messageText =
    `Ø§ÙØ§Ø³Ù : ${customerName}\n` +
    `Ø§ÙÙØ§ØªÙ : ${customerPhone}\n` +
    `Ø§ÙÙØ­Ø§ÙØ¸Ø© : ${customerCity}\n` +
    `Ø§ÙØ¹ÙÙØ§Ù : ${customerAddress}\n\n`;

  messageText += "--------------------\n";

  messageText += "Ø§ÙØ·ÙØ¨Ø§Øª:\n\n";

  let total = 0;

  cart.forEach((item, index) => {
    const subTotal = item.price * item.qty;

    messageText +=
      `${index + 1}. ${item.name}\n` +
      `Ø§ÙÙÙÙØ© : ${item.qty}\n` +
      `Ø§ÙØ³Ø¹Ø± : ${item.price}\n\n`;

    total += subTotal;
  });

  messageText += `\nØ§ÙØ¥Ø¬ÙØ§ÙÙ : ${total} Ø¬.Ù`;

  window.open(
    `https://wa.me/201007569287?text=${encodeURIComponent(messageText)}`,

    "_blank",
  );
  customerModal.classList.remove("active");
  document.getElementById("customerName").value = "";
  document.getElementById("customerPhone").value = "";
  document.getElementById("customerCity").value = "";
  document.getElementById("customerAddress").value = "";
});

async function loadBanner() {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getBanner`);
    const banner = await response.json();

    const heroImage = document.getElementById("heroBannerImage");
    const heroTitle = document.querySelector(".hero-content h1");
    const heroBtn = document.getElementById("heroShopNow");
    const heroImageContainer = document.querySelector(".hero-image-container");

    if (!banner || !banner.imageUrl) {
      if (heroImageContainer) heroImageContainer.style.display = "none";
      return;
    }

    if (heroImageContainer) heroImageContainer.style.display = "block";
    heroImage.src = banner.imageUrl;

    if (banner.title) heroTitle.textContent = banner.title;

    const linkType = banner.buttonLinkType || (banner.buttonLink ? "page" : "");
    const linkValue = banner.buttonLinkValue || banner.buttonLink || "";

    if (banner.buttonText) {
      heroBtn.innerHTML = `${banner.buttonText} <i class="fa-solid fa-bag-shopping"></i>`;
    }

    if (!linkType) {
      heroBtn.style.display = "none";
      heroBtn.onclick = null;
      return;
    }

    heroBtn.style.display = "inline-flex";
    heroBtn.onclick = () => {
      if (linkType === "page") {
        switchPage(linkValue || "products-page");
        if ((linkValue || "products-page") === "products-page") resetFilters();
      }

      if (linkType === "category") {
        switchPage("products-page");
        resetFilters();
        filterProducts(linkValue);
      }

      if (linkType === "product") {
        if (linkValue) {
          location.href = `product.html?id=${encodeURIComponent(linkValue)}`;
        }
      }
    };
  } catch (err) {
    console.error("Banner load error:", err);
  }
}

async function loadCategories() {
  const response = await fetch(`${WEB_APP_URL}?action=getCategories`);
  return await response.json();
}

async function renderCategories() {
  const categories = await loadCategories();

  const homeGrid = document.getElementById("homeCategoriesGrid");
  const filterContainer = document.getElementById("productsFilters");

  if (homeGrid) {
    homeGrid.innerHTML = categories
      .map(
        (cat) => `
        <div class="category-card" data-category="${cat.name}">
          <div class="category-icon-placeholder">
            <i class="fa-solid fa-layer-group"></i>
          </div>
          <h3>${cat.name}</h3>
        </div>
      `,
      )
      .join("");
  }

  if (filterContainer) {
    filterContainer.innerHTML = `
      <button class="filter-btn active" data-filter="all">Ø§ÙÙÙ</button>
      ${categories
        .map(
          (cat) => `
          <button class="filter-btn" data-filter="${cat.name}">
            ${cat.name}
          </button>
        `,
        )
        .join("")}
    `;
  }

  bindCategoryCards();

  bindFilterButtons();

  return true;
}

function bindCategoryCards() {
  document.querySelectorAll(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const category = card.getAttribute("data-category");
      switchPage("products-page");
      filterProducts(category);
    });
  });
}

function bindFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));

      btn.classList.add("active");
      filterProducts(btn.getAttribute("data-filter"));
    });
  });
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");

  const toast = document.createElement("div");

  toast.className = `toast ${type}`;

  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

const accountBtn = document.getElementById("accountBtn");

if (accountBtn) {
  accountBtn.onclick = () => {
    const customer = localStorage.getItem("mesk_customer");

    if (customer) {
      location.href = "account.html";

      return;
    }

    loginModal.classList.add("show");
  };
}

document.querySelector(".close-login").onclick = () => {
  loginModal.classList.remove("show");
};

const loginModal = document.getElementById("loginModal");
loginModal.onclick = (e) => {
  if (e.target === loginModal) {
    loginModal.classList.remove("show");
  }
};

async function loginCustomer() {
  const phone = document.getElementById("loginPhone").value.trim();

  const password = document.getElementById("loginPassword").value;

  if (!phone || !password) {
    Swal.fire({
      icon: "warning",
      title: "Ø£ÙÙÙ Ø§ÙØ¨ÙØ§ÙØ§Øª",
    });

    return;
  }

  const response = await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "loginCustomer",

      phone,

      password,
    }),
  });

  const result = await response.json();

  console.log(result);

  // Ø£ÙÙ Ø¯Ø®ÙÙ (ÙØ§ ØªÙØ¬Ø¯ ÙÙÙØ© ÙØ±ÙØ±)
  if (result.needPassword) {
    loginModal.classList.remove("show");

    document.getElementById("createPasswordModal").classList.add("show");

    // ÙØ®Ø²Ù Ø±ÙÙ Ø§ÙÙØ§ØªÙ Ø¹Ø´Ø§Ù ÙØ³ØªØ®Ø¯ÙÙ ÙÙ Ø¥ÙØ´Ø§Ø¡ ÙÙÙØ© Ø§ÙÙØ±ÙØ±
    localStorage.setItem("tempPhone", phone);

    return;
  }

  if (!result.success) {
    Swal.fire({
      icon: "error",

      title: result.message,
    });

    return;
  }

  localStorage.setItem(
    "mesk_customer",

    JSON.stringify(result.customer),
  );
  if (result.token) localStorage.setItem("mesk_token", result.token);

  loginModal.classList.remove("show");
  await loadUnreadNotifications();

  Swal.fire({
    icon: "success",

    title: "ØªÙ ØªØ³Ø¬ÙÙ Ø§ÙØ¯Ø®ÙÙ",
  });
}
document.getElementById("loginBtn").onclick = loginCustomer;

const registerModal = document.getElementById("registerModal");
document.getElementById("goRegisterBtn").onclick = () => {
  loginModal.classList.remove("show");

  registerModal.classList.add("show");
};

document.querySelector(".close-register").onclick = () => {
  registerModal.classList.remove("show");
};

registerModal.onclick = (e) => {
  if (e.target === registerModal) {
    registerModal.classList.remove("show");
  }
};

async function registerCustomer() {
  const name = registerName.value.trim();

  const phone = registerPhone.value.trim();

  const password = registerPassword.value;

  const confirm = registerConfirmPassword.value;

  if (!name || !phone || !password) {
    Swal.fire({
      icon: "warning",

      title: "Ø£ÙÙÙ Ø§ÙØ¨ÙØ§ÙØ§Øª",
    });

    return;
  }

  if (password !== confirm) {
    Swal.fire({
      icon: "error",

      title: "ÙÙÙØªØ§ Ø§ÙÙØ±ÙØ± ØºÙØ± ÙØªØ·Ø§Ø¨ÙØªÙÙ",
    });

    return;
  }

  const response = await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "registerCustomer",

      name,

      phone,

      password,
    }),
  });

  const result = await response.json();
  console.log(result);

  if (result.needPassword) {
    document.getElementById("createPasswordModal").classList.add("show");

    return;
  }

  if (!result.success) {
    Swal.fire({
      icon: "error",

      title: result.message,
    });

    return;
  }

  localStorage.setItem(
    "mesk_customer",

    JSON.stringify(result.customer),
  );
  if (result.token) localStorage.setItem("mesk_token", result.token);

  await loadUnreadNotifications();

  Swal.fire({
    icon: "success",

    title: "ØªÙ Ø¥ÙØ´Ø§Ø¡ Ø§ÙØ­Ø³Ø§Ø¨",
  }).then(() => {
    location.href = "account.html";
  });
}

const registerName = document.getElementById("registerName");
const registerPhone = document.getElementById("registerPhone");
const registerPassword = document.getElementById("registerPassword");
const registerConfirmPassword = document.getElementById(
  "registerConfirmPassword",
);
const registerBtn = document.getElementById("registerBtn");
registerBtn.onclick = registerCustomer;
const savePasswordBtn = document.getElementById("savePasswordBtn");

savePasswordBtn.onclick = async () => {
  if (newPassword.value != confirmPassword.value) {
    Swal.fire({
      icon: "error",

      text: "ÙÙÙØªØ§ Ø§ÙÙØ±ÙØ± ØºÙØ± ÙØªØ·Ø§Ø¨ÙØªÙÙ",
    });

    return;
  }

  if (newPassword.value.length < 6) {
    Swal.fire({
      icon: "warning",
      text: "ÙÙÙØ© Ø§ÙÙØ±ÙØ± ÙØ¬Ø¨ Ø£ÙØ§ ØªÙÙ Ø¹Ù 6 Ø£Ø­Ø±Ù",
    });

    return;
  }

  const response = await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "createPassword",

      phone: localStorage.getItem("tempPhone"),

      password: newPassword.value,
    }),
  });

  const result = await response.json();

  if (result.success) {
    localStorage.setItem(
      "mesk_customer",

      JSON.stringify(result.customer),
    );
    if (result.token) localStorage.setItem("mesk_token", result.token);

    localStorage.removeItem("tempPhone");
    location.href = "account.html";
  } else {
    Swal.fire({
      icon: "info",
      title: "ØªÙØ¹ÙÙ Ø§ÙØ­Ø³Ø§Ø¨ ÙØªÙÙÙ ÙØ¤ÙØªØ§Ù",
      text: "ÙØªÙØ¹ÙÙ Ø­Ø³Ø§Ø¨Ù Ø§ÙØ­Ø§ÙÙ ØªÙØ§ØµÙ ÙØ¹ÙØ§ ÙØ³ÙÙØ¹ÙÙÙ ÙÙ ÙÙØ±Ø§Ù",
    });
  }
};

async function initApp() {
  try {
    updateCartUI();

    await loadFavorites();

    await loadProducts();

    await loadBanner();

    await loadUnreadNotifications();

    bindStaticEvents();
  } catch (err) {
    console.error(err);
  }
      }

function askAdminPassword() {
    window.location.href = "admin.html";
}
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

function addToCart(product) {
  const fullProduct = products.find((item) => item.id === product.id);

  const currentQtyInCart =
    cart.find((item) => item.id === product.id)?.qty || 0;

  if (currentQtyInCart >= fullProduct.stock) {
    Swal.fire({
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
  Swal.fire({
    toast: true,
    position: "bottom-end",
    icon: "success",
    iconColor: "#1c3d27",
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
    title: `ÙØªÙØª Ø¥Ø¶Ø§ÙØ© ${product.name} ÙÙØ³ÙØ©`,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}

// Ø±Ø¨Ø· ÙØ±ÙØª Ø§ÙØ£ÙØ³Ø§Ù Ø¨ØµÙØ­Ø© Ø§ÙÙÙØªØ¬Ø§Øª ÙØ¹ ÙÙØªØ±Ø© ÙØ³Ø¨ÙØ©
document.querySelectorAll(".category-card").forEach((card) => {
  card.addEventListener("click", () => {
    const category = card.getAttribute("data-category");
    switchPage("products-page");
    filterProducts(category);

    // ØªØ­Ø¯ÙØ« Ø§ÙØ²Ø± Ø§ÙÙØ´Ø· ÙÙ Ø§ÙÙÙØªØ±
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      if (btn.getAttribute("data-filter") === category)
        btn.classList.add("active");
      else btn.classList.remove("active");
    });
  });
});

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

function saveAndRefreshCart() {
  localStorage.setItem("mesk_cart", JSON.stringify(cart));
  updateCartUI();
  showToast(" ØªÙØª Ø¥Ø¶Ø§ÙØ© Ø§ÙÙÙØªØ¬ Ø¥ÙÙ Ø§ÙØ³ÙØ© ");
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

if (menuToggleBtn) {
  menuToggleBtn.addEventListener("click", () => {
    mobileSidebar.classList.add("active");
    sidebarOverlay.classList.add("active");
  });
}

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

// ØªØ´ØºÙÙ ÙØªØ­Ø¯ÙØ« Ø§ÙØ¯Ø§ÙØ© ÙÙØ±Ø§Ù ÙØ¹ÙØ¯ ØªØºÙÙØ± Ø­Ø¬Ù Ø§ÙØ´Ø§Ø´Ø©
document.addEventListener("DOMContentLoaded", buildTasbihRing);
window.addEventListener("resize", buildTasbihRing);
buildTasbihRing();

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




function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

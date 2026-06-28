// ملف الكود الرئيسي app.js

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyLu7JJfHoSyWbIjO0vwybOyWO1SFU_LTqB-k9T3pY99u3xVZLRGVq-1C8TPB-m7XCPzg/exec";

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

// إعداد مصفوفة السلة مع تحميل البيانات المخزنة مسبقاً من المتصفح
let cart = JSON.parse(localStorage.getItem("mesk_cart")) || [];

// عناصر واجهة المستخدم المستهدفة
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

// تحديث السلة فور تشغيل الصفحة
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
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
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
          خصم ${product.discount}%
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
        ${product.stock <= 0 ? "نفد المخزون" : `متبقي ${product.stock} قطعة`}
      </div>

      <div class="product-meta">

      ${
        product.discount > 0
          ? `
          <div class="price-box">

              <span class="old-price">
                  ${product.price} ج.م
              </span>

              <span class="new-price">
                  ${getFinalPrice(product)} ج.م
              </span>

          </div>
          `
          : `
          <span
          class="product-price"
          data-price="${product.price}">
          ${product.price} ج.م
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

          غير متوفر

          </button>`
      }

      </div>

      </div>

      </div>
    `;
  });
}
// 1. نظام الانتقال بين الصفحات (SPA Switcher)
function switchPage(pageId) {
  // إخفاء جميع الصفحات
  document.querySelectorAll(".page-view").forEach((view) => {
    view.classList.remove("active");
  });
  // إظهار الصفحة المستهدفة
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
    window.scrollTo(0, 0);
  }

  // تحديث حالة الأزرار النشطة (الرئيسية والموبايل)
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

// ربط أزرار الهيدر والمنيو الجانبي والفوتر بنظام الصفحات
document
  .querySelectorAll(".nav-link-btn, .sidebar-link-btn, .footer-nav-btn")
  .forEach((button) => {
    button.addEventListener("click", (e) => {
      const target = button.getAttribute("data-target");
      switchPage(target);
      closeMenu(); // إغلاق المنيو إذا كنا في الموبايل
    });
  });

// 2. فتح وإغلاق المنيو الجانبي في الموبايل
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

// 3. فتح وإغلاق سلة المشتريات
cartToggleBtn.addEventListener("click", () => {
  cartSidebar.classList.add("active");
  sidebarOverlay.classList.add("active");
});
cartCloseBtn.addEventListener("click", () => {
  cartSidebar.classList.remove("active");
  sidebarOverlay.classList.remove("active");
});

// 4. تفعيل وإغلاق شريط البحث والبحث الفوري
searchToggleBtn.addEventListener("click", () => {
  searchBarContainer.classList.toggle("active");
  if (searchBarContainer.classList.contains("active")) {
    searchInput.focus();
  }
});

searchInput.addEventListener("input", (e) => {
  const query = normalizeArabic(e.target.value);

  // لو مربع البحث فاضي
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

// 5. نظام الفلترة والتصفية لصفحة المنتجات
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
    titleElement.textContent = "كل المنتجات";
    document
      .querySelectorAll("#mainProductsGrid .product-card")
      .forEach((c) => (c.style.display = "block"));
  } else {
    titleElement.textContent = `قسم الـ ${category}`;
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
      title: "نفد المخزون",
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
      title: "وصلت للحد الأقصى من المخزون",
    });

    return;
  }
  // التحقق من وجود المنتج مسبقاً لزيادة الكمية
  const existingItem = cart.find((item) => item.id === product.id);
  if (existingItem) {
    existingItem.qty += 1;

    // يحدث البيانات القديمة الموجودة فى السلة
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
  showToast(" تمت اضافته للسلة");
}

function updateCartUI() {
  // حساب إجمالي عدد القطع بالسلة
  const totalItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);
  cartCount.textContent = totalItemsCount;

  // تأثير الحركة لعداد السلة
  cartCount.classList.add("bump");
  setTimeout(() => cartCount.classList.remove("bump"), 300);

  if (cart.length === 0) {
    cartItemsList.innerHTML =
      '<p class="empty-cart-msg">السلة فارغة حالياً</p>';
    cartTotalAmount.textContent = "0 ج.م";
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
                          نفد المخزون
                        </div>`
                      : ""
                  }

              </div>

              <div class="cart-item-price">
                  ${item.price} ج.م
              </div>

              <div class="cart-qty-controls">

                  ${
                    item.outOfStock
                      ? `
                      <span class="stock-ended">
                          غير متوفر حالياً
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

  cartTotalAmount.textContent = `${total} ج.م`;
}

// تغيير الكمية بالزيادة والنقصان
window.changeQty = function (id, change) {
  const item = cart.find((item) => String(item.id) === String(id));

  if (!item) return;

  const fullProduct = products.find(
    (product) => String(product.id) === String(id),
  );

  if (change > 0 && item.qty >= fullProduct.stock) {
    Swal.fire({
      icon: "warning",
      title: "لا يوجد مخزون إضافي",
    });

    return;
  }

  item.qty += change;

  if (item.qty <= 0) {
    cart = cart.filter((item) => String(item.id) !== String(id));
  }

  saveAndRefreshCart();
};

// حذف منتج بالكامل من السلة
window.removeFromCart = function (id) {
  cart = cart.filter((item) => String(item.id) !== String(id));

  saveAndRefreshCart();
};
// إظهار التنبيهات الذكية

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
    showToast("السلة فارغة");

    return;
  }

  cartSidebar.classList.remove("active");
  window.location.href = "checkout.html";
});

// 8. التعامل مع فورمة "تواصل معنا" وتوجيه الاستفسار للواتساب
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("contactName").value;
  const phone = document.getElementById("contactPhone").value;
  const msg = document.getElementById("contactMessage").value;

  let contactMsg = `مرحباً متجر مسك للتراث، لدي استفسار جديد:\n\n`;
  contactMsg += `👤 *الاسم:* ${name}\n`;
  contactMsg += `📞 *رقم التواصل:* ${phone}\n`;
  contactMsg += `✉️ *الرسالة:* ${msg}`;

  const encodedContactMsg = encodeURIComponent(contactMsg);
  window.open(`https://wa.me/201007569287?text=${encodedContactMsg}`, "_blank");

  // تصفير الفورمة بعد الإرسال
  document.getElementById("contactForm").reset();
  showToast("تم تحويل رسالتك إلى الواتساب بنجاح!");
});

// --- كود بناء سبحة اللوجو الديناميكية مع الشرابة المتحركة ---
// --- كود بناء وتدوير السبحة والشرابة ديناميكياً بأعلى دقة هندسية ---
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

  // 1. بناء الخرز في أماكنه الثابتة داخل الـ الـ Ring
  for (let i = 0; i < beadsCount; i++) {
    const bead = document.createElement("div");
    bead.className = "bead";

    const angle = (i / beadsCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius + center;
    const y = Math.sin(angle) * radius + center;

    bead.style.left = `calc(${x}px - 4px)`;
    bead.style.top = `calc(${y}px - 4px)`;

    ring.appendChild(bead);

    // خرز الفواصل
    if (i % 11 === 0) {
      bead.style.background =
        "radial-gradient(circle at 35% 35%, #fff, #c5a880, #8a6f43)";
    }

    // تمييز الخرزة الرئيسية (رقم 0) اللي هيلحقها الدلاية
    if (i === 0) {
      bead.style.background =
        "radial-gradient(circle at 35% 35%, #fff, #ebd4b2, #a68453)";
      bead.style.width = "10px";
      bead.style.height = "10px";
    }
  }

  // 2. تحريك الشرابة ديناميكياً مع دوران الـ CSS (المحاكاة الفيزيائية الفخمة)
  if (tassel) {
    // وقت بداية الأنيميشن لربطه بالـ CSS (السبحة بتلف لفة كاملة كل 25 ثانية بناء على الـ CSS)
    const startTime = performance.now();
    const duration = 25000; // 25 ثانية مكتوبة في الـ CSS (animation: spin 25s)

    function updateTasselPosition(currentTime) {
      const elapsedTime = currentTime - startTime;

      // حساب نسبة الدوران الحالية (من 0 لـ 1)
      const progress = (elapsedTime % duration) / duration;

      // تحويل النسبة لزاوية بالراديان (مع إضافة Math.PI / 2 لتبدأ الشرابة من الأسفل تماماً تزامناً مع الخرزة 0)
      const currentAngle = progress * Math.PI * 2 + 0 * Math.PI * 2;

      // حساب الإحداثيات الديناميكية لموقع الخرزة رقم 0 أثناء دورانها
      const tasselX = Math.cos(currentAngle) * radius + center;
      const tasselY = Math.sin(currentAngle) * radius + center;

      // نقل الشرابة للمكان الجديد مع الحفاظ على الـ transform الـ خاص بالـ Swing من الـ CSS
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

// تشغيل وتحديث الدالة فوراً وعند تغيير حجم الشاشة

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

const ADMIN_PASSWORD = "Spark2026";
let adminAttempts = 0;

function askAdminPassword() {
  meskAlert
    .fire({
      title: "لوحة التحكم",

      html: "<b>أدخل كلمة المرور</b>",

      icon: "question",

      input: "password",

      inputPlaceholder: "كلمة المرور",

      confirmButtonText: "دخول",

      backdrop: `
        rgba(0,0,0,0.7)
        url("https://media.tenor.com/GfSX-u7VGM4AAAAC/coding.gif")
        center top
        no-repeat
    `,
      cancelButtonText: "إلغاء",

      showCancelButton: true,
    })
    .then((result) => {
      if (!result.isConfirmed) return;

      if (result.value === ADMIN_PASSWORD) {
        window.location.href = "admin.html";
      } else {
        adminAttempts++;

        if (adminAttempts >= 2) {
          Swal.fire({
            icon: "error",

            title: "تم رفض الدخول",

            text: "تم تجاوز عدد المحاولات",
          }).then(() => {
            window.location.href = "index.html";
          });
        } else {
          Swal.fire({
            icon: "error",

            title: "كلمة المرور غير صحيحة",

            text: "حاول مرة أخرى",
          }).then(() => {
            askAdminPassword();
          });
        }
      }
    });
}

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
      title: "تم تحديث السلة",
      text: "تم تعديل الكميات حسب المخزون المتاح",
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
      title: "أكمل البيانات",
      text: "يرجى تعبئة جميع الحقول",
    });

    return;
  }

  let messageText =
    `الاسم : ${customerName}\n` +
    `الهاتف : ${customerPhone}\n` +
    `المحافظة : ${customerCity}\n` +
    `العنوان : ${customerAddress}\n\n`;

  messageText += "--------------------\n";

  messageText += "الطلبات:\n\n";

  let total = 0;

  cart.forEach((item, index) => {
    const subTotal = item.price * item.qty;

    messageText +=
      `${index + 1}. ${item.name}\n` +
      `الكمية : ${item.qty}\n` +
      `السعر : ${item.price}\n\n`;

    total += subTotal;
  });

  messageText += `\nالإجمالي : ${total} ج.م`;

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
      <button class="filter-btn active" data-filter="all">الكل</button>
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
      title: "أكمل البيانات",
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

  // أول دخول (لا توجد كلمة مرور)
  if (result.needPassword) {
    loginModal.classList.remove("show");

    document.getElementById("createPasswordModal").classList.add("show");

    // نخزن رقم الهاتف عشان نستخدمه فى إنشاء كلمة المرور
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

  loginModal.classList.remove("show");
  await loadUnreadNotifications();

  Swal.fire({
    icon: "success",

    title: "تم تسجيل الدخول",
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

      title: "أكمل البيانات",
    });

    return;
  }

  if (password !== confirm) {
    Swal.fire({
      icon: "error",

      title: "كلمتا المرور غير متطابقتين",
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

  await loadUnreadNotifications();

  Swal.fire({
    icon: "success",

    title: "تم إنشاء الحساب",
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

      text: "كلمتا المرور غير متطابقتين",
    });

    return;
  }

  if (newPassword.value.length < 6) {
    Swal.fire({
      icon: "warning",
      text: "كلمة المرور يجب ألا تقل عن 6 أحرف",
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

    localStorage.removeItem("tempPhone");
    location.href = "account.html";
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
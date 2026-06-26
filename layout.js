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

function addToCart(product) {
  const fullProduct = products.find((item) => item.id === product.id);

  const currentQtyInCart =
    cart.find((item) => item.id === product.id)?.qty || 0;

  if (currentQtyInCart >= fullProduct.stock) {
    Swal.fire({
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
    title: `ّتمت إضافة ${product.name} للسلة`,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
}

// ربط كروت الأقسام بصفحة المنتجات مع فلترة مسبقة
document.querySelectorAll(".category-card").forEach((card) => {
  card.addEventListener("click", () => {
    const category = card.getAttribute("data-category");
    switchPage("products-page");
    filterProducts(category);

    // تحديث الزر النشط في الفلتر
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      if (btn.getAttribute("data-filter") === category)
        btn.classList.add("active");
      else btn.classList.remove("active");
    });
  });
});

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

function saveAndRefreshCart() {
  localStorage.setItem("mesk_cart", JSON.stringify(cart));
  updateCartUI();
  showToast(" تمت إضافة المنتج إلى السلة ");
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

// تشغيل وتحديث الدالة فوراً وعند تغيير حجم الشاشة
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

function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

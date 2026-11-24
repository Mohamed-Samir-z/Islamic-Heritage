const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyLu7JJfHoSyWbIjO0vwybOyWO1SFU_LTqB-k9T3pY99u3xVZLRGVq-1C8TPB-m7XCPzg/exec";

// ===== Admin auth layer v71: key login, session token, backend call interceptor =====
let ADMIN_TOKEN = sessionStorage.getItem("mesk_admin_token") || "";

async function adminLogin(key) {
  try {
    const r = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "adminLogin", key }),
    });
    const j = await r.json();
    if (j && j.success && j.token) {
      ADMIN_TOKEN = j.token;
      sessionStorage.setItem("mesk_admin_token", j.token);
      return true;
    }
  } catch (e) {}
  return false;
}

function adminLogout() {
  ADMIN_TOKEN = "";
  sessionStorage.removeItem("mesk_admin_token");
  showAdminLogin();
}

function showAdminLogin() {
  if (document.getElementById("meskAdminLoginOverlay")) return;
  const ov = document.createElement("div");
  ov.id = "meskAdminLoginOverlay";
  ov.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,.98);display:flex;align-items:center;justify-content:center;z-index:999999;direction:rtl";
  ov.innerHTML = '<div style="background:#1e293b;padding:32px;border-radius:16px;width:min(360px,90vw);text-align:center;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,.5)">'
    + '<h2 style="margin:0 0 8px">ÙÙØ­Ø© Ø§ÙØªØ­ÙÙ</h2>'
    + '<p style="color:#94a3b8;font-size:14px;margin:0 0 16px">Ø£Ø¯Ø®Ù ÙÙØªØ§Ø­ Ø§ÙØ£Ø¯ÙÙ ÙÙÙØªØ§Ø¨Ø¹Ø©</p>'
    + '<input id="meskAdminKeyInput" type="password" placeholder="ÙÙØªØ§Ø­ Ø§ÙØ£Ø¯ÙÙ" style="width:100%;padding:12px;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#fff;margin-bottom:12px;box-sizing:border-box">'
    + '<button id="meskAdminLoginBtn" style="width:100%;padding:12px;border:none;border-radius:10px;background:#d4af37;color:#111;font-weight:bold;cursor:pointer">Ø¯Ø®ÙÙ</button>'
    + '<p id="meskAdminLoginErr" style="color:#f87171;font-size:13px;margin:10px 0 0;display:none">Ø§ÙÙÙØªØ§Ø­ ØºÙØ± ØµØ­ÙØ­ Ø£Ù Ø§ÙØªÙØª Ø§ÙÙØ­Ø§ÙÙØ§Øª</p>'
    + '</div>';
  const submit = async () => {
    const key = document.getElementById("meskAdminKeyInput").value.trim();
    if (!key) return;
    const ok = await adminLogin(key);
    if (ok) { ov.remove(); try { initAdmin(); } catch (e) { location.reload(); } }
    else { document.getElementById("meskAdminLoginErr").style.display = "block"; }
  };
  const bind = () => {
    document.getElementById("meskAdminLoginBtn").onclick = submit;
    document.getElementById("meskAdminKeyInput").addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  };
  if (document.body) { document.body.appendChild(ov); bind(); }
  else document.addEventListener("DOMContentLoaded", () => { document.body.appendChild(ov); bind(); });
}

(function () {
  const _origFetch = window.fetch.bind(window);
  window.fetch = function (url, opts) {
    try {
      if (typeof url === "string" && url.startsWith(WEB_APP_URL)) {
        if (opts && opts.body) {
          const b = JSON.parse(opts.body);
          if (b.action !== "adminLogin") b.token = ADMIN_TOKEN;
          opts = Object.assign({}, opts, { body: JSON.stringify(b) });
        } else {
          url += (url.includes("?") ? "&" : "?") + "token=" + encodeURIComponent(ADMIN_TOKEN);
        }
      }
    } catch (e) {}
    return _origFetch(url, opts).then((r) => {
      try {
        return r.clone().json().then((j) => {
          if (j && j.error === "unauthorized" && typeof url === "string" && url.startsWith(WEB_APP_URL)) adminLogout();
          return r;
        }).catch(() => r);
      } catch (e) { return r; }
    });
  };
})();
// ===== end admin auth layer =====



/* ===========================================================
    GLOBAL VARIABLES
=========================================================== */

let products = [];
let selectedProducts = [];
const PRODUCTS_PER_PAGE = 20;

let currentPage = 1;

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

function showToast(message) {
  const toast = document.getElementById("toast");

  toast.innerHTML = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

let editMode = false;
let editProductId = null;

let bannerEditId = null;
let bannerImageUrl = "";
let bannerNewImageFile = null;

/* ===========================================================
    DOM ELEMENTS
=========================================================== */

const bannerManagerBtn = document.getElementById("bannerManagerBtn");
const bannerModal = document.getElementById("bannerModal");
const closeBannerModal = document.getElementById("closeBannerModal");
const bannerImage = document.getElementById("bannerImage");
const bannerPreview = document.getElementById("bannerPreview");
const bannerTitle = document.getElementById("bannerTitle");
const bannerButtonText = document.getElementById("bannerButtonText");
const bannerLinkType = document.getElementById("bannerLinkType");
const bannerPageGroup = document.getElementById("bannerPageGroup");
const bannerCategoryGroup = document.getElementById("bannerCategoryGroup");
const bannerProductGroup = document.getElementById("bannerProductGroup");
const bannerPageSelect = document.getElementById("bannerPageSelect");
const bannerCategorySelect = document.getElementById("bannerCategorySelect");
const bannerProductSelect = document.getElementById("bannerProductSelect");
const saveBannerBtn = document.getElementById("saveBannerBtn");

const addCategoryBtn = document.getElementById("addCategoryBtn");
const categoryModal = document.getElementById("categoryModal");
const closeCategoryModal = document.getElementById("closeCategoryModal");
const categoryNameInput = document.getElementById("categoryName");
const saveCategoryBtn = document.getElementById("saveCategoryBtn");
const categoriesList = document.getElementById("categoriesList");

let categories = [];
let categoryEditId = null;
let categoryEditOldName = "";

/* ===========================================================
    ORDERS
=========================================================== */

let orders = [];

const ordersCards = document.getElementById("ordersCards");
const ordersSearch = document.getElementById("ordersSearch");
const ordersFilter = document.getElementById("ordersFilter");

const orderModal = document.getElementById("orderModal");
const closeOrderModal = document.getElementById("closeOrderModal");
const orderDetailsContent = document.getElementById("orderDetailsContent");

/* ===========================================================
    BANNER
=========================================================== */
function toggleBannerLinkFields() {
  const type = bannerLinkType.value;

  bannerPageGroup.classList.toggle("active", type === "page");
  bannerCategoryGroup.classList.toggle("active", type === "category");
  bannerProductGroup.classList.toggle("active", type === "product");
}

async function fillBannerOptions() {
  if (!categories.length) {
    await loadCategories();
  }

  if (!products.length) {
    products = await fetchProducts();
  }

  bannerCategorySelect.innerHTML = categories
    .map((cat) => `<option value="${cat.name}">${cat.name}</option>`)
    .join("");

  bannerProductSelect.innerHTML = products
    .map((p) => `<option value="${p.id}">${p.name}</option>`)
    .join("");
}

async function loadCurrentBanner() {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getBanner`);

    const banner = await response.json();

    bannerEditId = banner.id || null;

    bannerImageUrl = banner.imageUrl || "";

    bannerPreview.src = bannerImageUrl || "";

    bannerTitle.value = banner.title || "";

    bannerButtonText.value = banner.buttonText || "";

    const type = banner.buttonLinkType || "";

    const value = banner.buttonLinkValue || "";

    bannerLinkType.value = type;

    toggleBannerLinkFields();

    if (type === "page") {
      bannerPageSelect.value = value;
    }

    if (type === "category") {
      bannerCategorySelect.value = value;
    }

    if (type === "product") {
      bannerProductSelect.value = value;
    }
  } catch (error) {
    console.error("Load Banner Error:", error);
  }
}

/* ===========================================================
    CATEGORIES
=========================================================== */

async function loadCategories() {
  const response = await fetch(`${WEB_APP_URL}?action=getCategories`);
  categories = await response.json();
  return categories;
}

function renderCategoriesToSelects() {
  const options = categories
    .map((cat) => `<option value="${cat.name}">${cat.name}</option>`)
    .join("");

  const productCategorySelect = document.getElementById("productCategory");
  if (productCategorySelect) {
    productCategorySelect.innerHTML = `
      <option value="">Ø§Ø®ØªØ± Ø§ÙÙØ³Ù</option>
      ${options}
    `;
  }

  bannerCategorySelect.innerHTML = `
    <option value="">Ø¨Ø¯ÙÙ ÙØ³Ù</option>
    ${options}
  `;
}

function renderCategoriesList() {
  const list = categoriesList;

  if (!categories.length) {
    list.innerHTML = `<p>ÙØ§ ØªÙØ¬Ø¯ Ø£ÙØ³Ø§Ù Ø¨Ø¹Ø¯</p>`;
    return;
  }

  list.innerHTML = categories
    .map(
      (cat) => `
      <div class="category-row">
        <span class="category-name">${cat.name}</span>
        <div class="category-actions">
          <button class="edit-category-btn" data-id="${cat.id}" data-name="${cat.name}">ØªØ¹Ø¯ÙÙ <i class="fas fa-pen"></i></button>
          <button class="delete-category-btn" data-id="${cat.id}">Ø­Ø°Ù <i class="fas fa-trash"></i></button>
        </div>
      </div>
    `,
    )
    .join("");
}

async function refreshCategoriesUI() {
  await loadCategories();
  renderCategoriesToSelects();
  renderCategoriesList();
}

addCategoryBtn.addEventListener("click", async () => {
  categoryEditId = null;
  categoryEditOldName = "";
  categoryNameInput.value = "";
  await refreshCategoriesUI();
  categoryModal.classList.add("active");
});

closeCategoryModal.addEventListener("click", () => {
  categoryModal.classList.remove("active");
});

categoryModal.addEventListener("click", (e) => {
  if (e.target === categoryModal) {
    categoryModal.classList.remove("active");
  }
});

saveCategoryBtn.addEventListener("click", async () => {
  const name = categoryNameInput.value.trim();

  if (!name) {
    meskAlert.fire({ icon: "warning", title: "Ø§ÙØªØ¨ Ø§Ø³Ù Ø§ÙÙØ³Ù" });
    return;
  }

  const action = categoryEditId ? "updateCategory" : "addCategory";

  await fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action,
      id: categoryEditId,
      oldName: categoryEditOldName,
      name,
    }),
  });

  categoryNameInput.value = "";
  categoryEditId = null;
  categoryEditOldName = "";

  await refreshCategoriesUI();
  meskAlert.fire({ icon: "success", title: "ØªÙ Ø­ÙØ¸ Ø§ÙÙØ³Ù" });
});

categoriesList.addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".edit-category-btn");
  const deleteBtn = e.target.closest(".delete-category-btn");

  if (editBtn) {
    categoryEditId = editBtn.dataset.id;
    categoryEditOldName = editBtn.dataset.name;
    categoryNameInput.value = editBtn.dataset.name;
    return;
  }

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;

    const confirm = await meskAlert.fire({
      icon: "warning",
      title: "Ø­Ø°Ù Ø§ÙÙØ³Ù",
      text: "ÙÙ ØªØ±ÙØ¯ Ø­Ø°Ù Ø§ÙÙØ³ÙØ",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "deleteCategory",
        id,
      }),
    });

    await refreshCategoriesUI();
    meskAlert.fire({ icon: "success", title: "ØªÙ Ø­Ø°Ù Ø§ÙÙØ³Ù" });
  }
});

bannerManagerBtn.addEventListener("click", async () => {
  await fillBannerOptions();
  await loadCurrentBanner();
  bannerModal.classList.add("active");
});

closeBannerModal.addEventListener("click", () => {
  bannerModal.classList.remove("active");
});

bannerModal.addEventListener("click", (e) => {
  if (e.target === bannerModal) {
    bannerModal.classList.remove("active");
  }
});

bannerLinkType.addEventListener("change", toggleBannerLinkFields);

bannerImage.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (!file) return;

  document.getElementById("bannerFileName").textContent = file.name;

  bannerNewImageFile = file;

  const reader = new FileReader();

  reader.onload = () => {
    bannerPreview.src = reader.result;
  };

  reader.readAsDataURL(file);
});

const productImageInput = document.getElementById("productImage");

productImageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];

  if (!file) return;

  document.getElementById("productFileName").textContent = file.name;
});

saveBannerBtn.addEventListener("click", async () => {
  const title = bannerTitle.value.trim();
  const buttonText = bannerButtonText.value.trim();
  const linkType = bannerLinkType.value;

  let linkValue = "";
  if (linkType === "page") linkValue = bannerPageSelect.value;
  if (linkType === "category") linkValue = bannerCategorySelect.value;
  if (linkType === "product") linkValue = bannerProductSelect.value;

  if (!title) {
    meskAlert.fire({ icon: "warning", title: "Ø§ÙØªØ¨ Ø¹ÙÙØ§Ù Ø§ÙØ¨Ø§ÙØ±" });
    return;
  }

  meskAlert.fire({
    title: "Ø¬Ø§Ø±Ù Ø­ÙØ¸ Ø§ÙØ¨Ø§ÙØ±...",
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
  });

  let imageUrl = bannerImageUrl;

  if (bannerNewImageFile) {
    const base64 = await fileToBase64(bannerNewImageFile);
    const compressed = await compressImage(base64);
    imageUrl = await uploadToImgBB(compressed);
  }

  if (!imageUrl) {
    Swal.close();
    meskAlert.fire({ icon: "error", title: "Ø§ÙØµÙØ±Ø© ÙØ·ÙÙØ¨Ø©" });
    return;
  }

  await fetch(WEB_APP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "saveBanner",
      id: bannerEditId,
      imageUrl,
      title,
      buttonText,
      buttonLinkType: linkType,
      buttonLinkValue: linkValue,
    }),
  });

  Swal.close();
  bannerModal.classList.remove("active");
  meskAlert.fire({ icon: "success", title: "ØªÙ Ø§ÙØ­ÙØ¸ Ø¨ÙØ¬Ø§Ø­" });
});


// Ø¯Ø§ÙØ© ÙØ¬ÙØ¨ Ø§ÙØ¨ÙØ§ÙØ§Øª ÙÙ Ø¬ÙØ¬Ù Ø´ÙØª
async function fetchProducts() {
  try {
    const response = await fetch(WEB_APP_URL);
    products = await response.json();
    return products;
  } catch (e) {
    console.error(e);
    return [];
  }
}

/* ===========================================================
    PRODUCTS
=========================================================== */

// Ø¯Ø§ÙØ© Ø¹Ø±Ø¶ Ø§ÙÙÙØªØ¬Ø§Øª
async function renderProductsTable(list = null) {
  if (!products.length) {
    products = await fetchProducts();
  }

  const data = list ?? products;

  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;

  const end = start + PRODUCTS_PER_PAGE;

  const pageProducts = data.slice(start, end);

  const table = document.getElementById("productsTable");

  table.innerHTML = "";

  pageProducts.forEach((product) => {
    let stockWarning = "";

    if (Number(product.stock) <= 0) {
      stockWarning = `
        <div class="out-stock-warning">
        â ÙÙØ¯ Ø§ÙÙØ®Ø²ÙÙ
        </div>
        `;
    } else if (Number(product.stock) <= 5) {
      stockWarning = `
        <div class="low-stock-warning">
        â  ÙØªØ¨ÙÙ ${product.stock} ÙÙØ·
        </div>
        `;
    }

    table.innerHTML += `

        <div class="admin-product-card">

          <div class="product-select">

          <input
          type="checkbox"
          class="product-checkbox"
          value="${product.id}">

          </div>

        <img src="${product.imageUrl}" class="admin-product-image">

        <div class="admin-card-body">

        <h3>${product.name}</h3>

        <p>${product.price} Ø¬.Ù</p>

        ${stockWarning}

        <div class="admin-actions">

        <button class="edit-btn" data-id="${product.id}">
        ØªØ¹Ø¯ÙÙ
        </button>

        <button class="delete-btn" data-id="${product.id}">
        Ø­Ø°Ù
        </button>

        </div>

        </div>

        </div>

      `;
  });
  renderPagination(data.length);
}

function copyCustomer(orderId) {
  const order = orders.find((o) => String(o.id) === String(orderId));

  if (!order) return;

  const text = `

    Ø§ÙØ§Ø³Ù : ${order.customerName}

    Ø§ÙÙØ§ØªÙ : ${order.phone}

    Ø§ÙØ¹ÙÙØ§Ù : ${order.address}

    Ø§ÙÙØ¯ÙÙØ© : ${order.city}

  `;

  navigator.clipboard.writeText(text);

  showToast("â ØªÙ ÙØ³Ø® Ø§ÙØ¨ÙØ§ÙØ§Øª");
}

async function deleteProduct(id) {
  const result = await meskAlert.fire({
    icon: "warning",
    title: "Ø­Ø°Ù Ø§ÙÙÙØªØ¬",
    text: "ÙÙ ØªØ±ÙØ¯ Ø­Ø°Ù Ø§ÙÙÙØªØ¬Ø",
    showCancelButton: true,
  });

  if (!result.isConfirmed) return;

  await fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "delete",
      id: id,
    }),
  });

  meskAlert.fire({ icon: "success", title: "ØªÙ Ø§ÙØ­Ø°Ù" }).then(() => {
    renderProductsTable();
    updateDashboard();
  });
}

async function editProduct(id) {
  const product = products.find((item) => String(item.id) === String(id));
  console.log("EDIT =", product);

  if (!product) return;

  document.getElementById("removeMainImage").style.display = "block";
  editMode = true;
  imageDeleted = false;
  editProductId = String(id);

  document.getElementById("productName").value = product.name || "";
  document.getElementById("productPrice").value = product.price || "";
  document.getElementById("productDiscount").value = product.discount || 0;
  document.getElementById("productStock").value = product.stock || 0;
  document.getElementById("productDescription").value =
    product.description || "";
  document.getElementById("productCategory").value = product.category || "";

  mainImage = product.imageUrl || "";

  document.getElementById("mainImagePreview").innerHTML =
    `<img src="${mainImage}" class="preview-main-image">`;

  if (product.images) {
    extraImages = Array.isArray(product.images)
      ? product.images
      : typeof product.images === "string"
        ? product.images.split(",")
        : [];
  } else {
    extraImages = [];
  }

  renderImagesPreview();

  await refreshCategoriesUI();
  document.getElementById("productCategory").value = product.category || "";
  modal.classList.add("active");
  document.getElementById("saveProductBtn").textContent = "Ø­ÙØ¸ Ø§ÙØªØ¹Ø¯ÙÙØ§Øª";
  document.getElementById("removeMainImage").onclick = () => {
    mainImage = "";
    imageDeleted = true;
    document.getElementById("mainImagePreview").innerHTML = "";
    alert("ØªÙ Ø­Ø°Ù Ø§ÙØµÙØ±Ø© Ø§ÙØ±Ø¦ÙØ³ÙØ©");
  };
}

const addBtn = document.getElementById("addProductBtn");
const modal = document.getElementById("productModal");

addBtn.onclick = () => {
  imageDeleted = false;
  editMode = false;
  editProductId = null;
  document.getElementById("saveProductBtn").textContent = "Ø­ÙØ¸ Ø§ÙÙÙØªØ¬";
  modal.classList.add("active");

  document.getElementById("productName").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productDiscount").value = "";
  document.getElementById("productStock").value = "";
  document.getElementById("productDescription").value = "";
  document.getElementById("productCategory").value = "";

  mainImage = "";
  extraImages = [];
  document.getElementById("mainImagePreview").innerHTML = "";
  document.getElementById("removeMainImage").style.display = "none";

  renderImagesPreview();
};

let imageDeleted = false;

// Ø¯Ø§ÙØ© ÙØ®ØµØµØ© ÙØ±ÙØ¹ Ø§ÙØµÙØ± Ø¥ÙÙ ImgBB Ø¨Ø´ÙÙ Ø³Ø±ÙØ¹ ØªÙØ§Ø´ÙØ§Ù ÙØ¹ ÙØ¹Ø§ÙÙØ± Ø§ÙÙ API Ø§ÙØ®Ø§ØµØ© Ø¨ÙÙ
async function uploadToImgBB(base64Data) {
  if (!base64Data) return "";
  // Ø±ÙØ§Ø¨Ø· ÙØ¯ÙÙØ© ÙØ±ÙÙØ¹Ø© ÙØ³Ø¨ÙØ§Ù ÙØ§ ØªÙØ±ÙØ¹ ÙØ±Ø© Ø£Ø®Ø±Ù
  if (base64Data.startsWith("http://") || base64Data.startsWith("https://")) {
    return base64Data;
  }
  const base64Image = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ action: "uploadImage", image: base64Image }),
    });
    const result = await response.json();
    if (result.success && result.url) {
      return result.url;
    }
    console.error("Upload error:", result.error || "failed");
    return "";
  } catch (error) {
    console.error("Upload failed:", error);
    return "";
  }
}

async function saveProductToSheet(productData) {
  try {
    const payload = {
      action: editMode ? "update" : "add",
      id: editMode ? String(editProductId) : null,
      name: productData.name,
      price: productData.price,
      discount: productData.discount,
      stock: productData.stock,
      imageUrl: productData.imageUrl || "",
      images: Array.isArray(productData.images) ? productData.images : [],
      category: productData.category || "",
      description: productData.description || "",
    };

    // ØªÙ ØªØ¹Ø¯ÙÙ Ø§ÙÙØ¶Ø¹ ÙÙØ§ ÙÙÙÙÙ 'cors' Ø£Ù ØªØ±ÙÙ Ø§ÙØªØ±Ø§Ø¶ÙØ§Ù ÙØ§Ø³ØªÙØ¨Ø§Ù Ø±Ø¯ Ø§ÙØ³ÙØ±ÙØ¨Øª Ø§ÙÙØ¸ÙÙ ÙØªÙØ§Ø¯Ù Ø§ÙØªØ¹ÙÙÙ
    await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    meskAlert
      .fire({
        icon: "success",
        title: "ØªÙ Ø§ÙØ­ÙØ¸ Ø¨ÙØ¬Ø§Ø­",
      })
      .then(() => {
        modal.classList.remove("active");
        renderProductsTable();
        updateDashboard();
      });
  } catch (error) {
    console.error("Save Error:", error);
    meskAlert.fire({ icon: "error", title: "ÙØ´Ù Ø§ÙØ­ÙØ¸" });
  }
}

document
  .getElementById("saveProductBtn")
  .addEventListener("click", async () => {
    const current =
      products.find((p) => String(p.id) === String(editProductId)) || {};

    const nameVal = document.getElementById("productName").value.trim();
    const priceVal = document.getElementById("productPrice").value;
    const discountVal = document.getElementById("productDiscount").value;
    const stockVal = document.getElementById("productStock").value;
    const categoryVal = document.getElementById("productCategory").value.trim();
    const descVal = document.getElementById("productDescription").value.trim();

    if (!nameVal || !priceVal) {
      alert("ÙØ±Ø¬Ù ÙÙØ¡ Ø§ÙØ­ÙÙÙ Ø§ÙØ£Ø³Ø§Ø³ÙØ© ÙØ§ÙØ¥Ø³Ù ÙØ§ÙØ³Ø¹Ø±.");
      return;
    }

    meskAlert.fire({
      title: "Ø¬Ø§Ø±Ù Ø±ÙØ¹ Ø§ÙØµÙØ± ÙØ­ÙØ¸ Ø§ÙØ¨ÙØ§ÙØ§Øª...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    // 1. Ø¶ØºØ· Ø«Ù Ø±ÙØ¹ Ø§ÙØµÙØ±Ø© Ø§ÙØ±Ø¦ÙØ³ÙØ© ÙØ¨Ø§Ø´Ø±Ø© ÙÙ ImgBB
    const compressedMain = imageDeleted
      ? ""
      : await compressImage(mainImage || current.imageUrl || "");
    const finalImageUrl = await uploadToImgBB(compressedMain);

    // 2. Ø¶ØºØ· Ø«Ù Ø±ÙØ¹ Ø§ÙØµÙØ± Ø§ÙÙØ±Ø¹ÙØ© ÙÙ ImgBB
    const finalExtraImages = [];
    for (let img of extraImages) {
      const compressedImg = await compressImage(img);
      const uploadedUrl = await uploadToImgBB(compressedImg);
      if (uploadedUrl) finalExtraImages.push(uploadedUrl);
    }

    const productData = {
      name: nameVal,
      price: Number(priceVal),
      discount:
        discountVal !== "" ? Number(discountVal) : (current.discount ?? 0),
      stock: stockVal !== "" ? Number(stockVal) : (current.stock ?? 0),
      category: categoryVal !== "" ? categoryVal : current.category || "",
      description: descVal !== "" ? descVal : current.description || "",
      imageUrl: finalImageUrl,
      images: finalExtraImages,
    };

    await saveProductToSheet(productData);
    Swal.close();
  });

function renderImagesPreview() {
  const preview = document.getElementById("imagesPreview");
  preview.innerHTML = "";

  extraImages.forEach((img, index) => {
    preview.innerHTML += `
    <div class="preview-item">
    <img src="${img}">
    <div class="remove-image" onclick="removeImage(${index})">Ã</div>
    </div>
    `;
  });
}

function removeImage(index) {
  extraImages.splice(index, 1);
  renderImagesPreview();
}

document.querySelector(".close-modal").onclick = () => {
  modal.classList.remove("active");
  editMode = false;
  editProductId = null;
  document.getElementById("saveProductBtn").textContent = "Ø­ÙØ¸ Ø§ÙÙÙØªØ¬";
};

let mainImage = "";
let extraImages = [];

document.getElementById("productImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function () {
    mainImage = reader.result;
    document.getElementById("mainImagePreview").innerHTML =
      `<img src="${mainImage}" class="preview-main-image">`;
  };
  reader.readAsDataURL(file);
});

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function compressImage(base64, maxWidth = 800, quality = 0.75) {
  return new Promise((resolve) => {
    if (!base64 || !base64.startsWith("data:image")) {
      resolve(base64 || "");
      return;
    }

    const img = new Image();
    let finished = false;

    const done = (value) => {
      if (finished) return;
      finished = true;
      resolve(value || base64);
    };

    const timer = setTimeout(() => {
      done(base64);
    }, 8000);

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;

        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }

        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        clearTimeout(timer);
        done(canvas.toDataURL("image/jpeg", quality));
      } catch (err) {
        clearTimeout(timer);
        done(base64);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      done(base64);
    };
    img.src = base64;
  });
}

document
  .getElementById("productImages")
  .addEventListener("change", async (e) => {
    const files = [...e.target.files];
    for (const file of files) {
      const base64 = await fileToBase64(file);
      extraImages.push(base64);
    }
    renderImagesPreview();
  });

function renderPagination(totalItems) {
  const container = document.getElementById("productsPagination");

  container.innerHTML = "";

  const totalPages = Math.ceil(totalItems / PRODUCTS_PER_PAGE);

  if (totalPages <= 1) {
    return;
  }

  for (let i = 1; i <= totalPages; i++) {
    container.innerHTML += `

<button

class="page-btn ${i === currentPage ? "active" : ""}"

data-page="${i}"

>

${i}

</button>

`;
  }
}
async function updateDashboard() {
  const products = await fetchProducts();
  document.getElementById("productsCount").textContent = products.length;
  const stock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  document.getElementById("stockCount").textContent = stock;
  const categories = [...new Set(products.map((p) => p.category))];
  document.getElementById("categoriesCount").textContent = categories.length;
}

document.getElementById("productsTable").addEventListener("click", (e) => {
  const id = String(e.target.dataset.id);
  if (e.target.classList.contains("edit-btn")) {
    editProduct(id);
  }
  if (e.target.classList.contains("delete-btn")) {
    deleteProduct(id);
  }
});

document.addEventListener("change", (e) => {
  if (e.target.classList.contains("product-checkbox")) {
    updateSelectedProducts();
  }
});

document.getElementById("selectAllBtn").onclick = function () {
  const boxes = document.querySelectorAll(".product-checkbox");

  const allChecked = [...boxes].every((b) => b.checked);

  boxes.forEach((box) => {
    box.checked = !allChecked;
  });

  updateSelectedProducts();
};

document
  .getElementById("deleteSelectedBtn")
  .addEventListener("click", deleteSelectedProducts);

document

  .getElementById("productsPagination")

  .addEventListener("click", (e) => {
    if (!e.target.classList.contains("page-btn")) return;

    currentPage = Number(e.target.dataset.page);

    filterAndRenderProducts();
  });

/* ===========================================================
    ORDERS
=========================================================== */

async function loadOrders() {

    try {

        const response = await fetch(`${WEB_APP_URL}?action=getOrders`);

        orders = await response.json();

        renderOrders();

    } catch (err) {

        console.error("Orders Error :", err);

    }

}

ordersSearch.addEventListener("input", filterOrders);

ordersFilter.addEventListener("change", filterOrders);

function filterOrders() {
  const search = ordersSearch.value.trim().toLowerCase();

  const status = ordersFilter.value;

  let filtered = orders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search) ||
      String(order.phone).includes(search);

    const matchStatus = status === "all" || order.status === status;

    return matchSearch && matchStatus;
  });

  renderOrders(filtered);
  document.querySelectorAll(".order-status-select").forEach((select) => {
    updateStatusColor(select);
  });
}

function filterOrdersReturn() {
  const search = ordersSearch.value.trim().toLowerCase();

  const status = ordersFilter.value;

  return orders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(search) ||
      order.customerName.toLowerCase().includes(search) ||
      String(order.phone).includes(search);

    const matchStatus = status === "all" || order.status === status;

    return matchSearch && matchStatus;
  });
}

function printOrder(orderId) {
  const order = orders.find((o) => String(o.id) === String(orderId));

  if (!order) return;

  const productsHTML = order.items
    .map(
      (item) => `
      <tr>
          <td>${item.name}</td>
          <td>${item.qty}</td>
          <td>${item.price} Ø¬.Ù</td>
          <td>${item.qty * item.price} Ø¬.Ù</td>
      </tr>
  `,
    )
    .join("");

  const win = window.open("", "_blank");

  win.document.write(`
    <!DOCTYPE html>

    <html lang="ar" dir="rtl">

    <head>

    <meta charset="UTF-8">

    <title>ÙØ§ØªÙØ±Ø© ${order.id}</title>

    <style>

      *{
      box-sizing:border-box;
      font-family:Cairo,sans-serif;
      }

      body{
      padding:40px;
      background:white;
      color:#222;
      }

      .invoice{

      max-width:850px;

      margin:auto;

      }

      .header{

      text-align:center;

      border-bottom:2px solid #ddd;

      padding-bottom:20px;

      margin-bottom:25px;

      }

      .header h1{

      margin:10px 0;

      font-size:30px;

      }

      .info{

      display:flex;

      justify-content:space-between;

      margin-bottom:25px;

      }

      .section{

      margin-bottom:25px;

      }

      table{

      width:100%;

      border-collapse:collapse;

      }

      th,td{

      border:1px solid #ddd;

      padding:12px;

      text-align:center;

      }

      th{

      background:#f5f5f5;

      }

      .summary{

      margin-top:25px;

      width:320px;

      margin-right:auto;

      }

      .summary div{

      display:flex;

      justify-content:space-between;

      padding:8px 0;

      }

      .total{

      font-size:22px;

      font-weight:bold;

      border-top:2px solid #000;

      padding-top:10px;

      }

      .footer{

      margin-top:50px;

      text-align:center;

      font-size:18px;

      }

      @media print{

      body{

      margin:0;

      padding:15mm;

      }

      }

    </style>

    </head>

    <body>

    <div class="invoice">

    <div class="header">

    <h1> <i class="fa-solid fa-book-open"></i> ÙØ³Ù Ø§ÙØªØ±Ø§Ø«</h1>

    <p>ÙØ§ØªÙØ±Ø© Ø·ÙØ¨</p>

    </div>

    <div class="info">

    <div>

    <b>Ø±ÙÙ Ø§ÙØ·ÙØ¨</b>

    <br>

    ${order.id}

    </div>

    <div>

    <b>ØªØ§Ø±ÙØ® Ø§ÙØ·ÙØ¨</b>

    <br>

    ${formatAdminDate(order.createdAt)}

    </div>

    </div>

    <div class="section">

    <h3>Ø¨ÙØ§ÙØ§Øª Ø§ÙØ¹ÙÙÙ</h3>

    <p><b>Ø§ÙØ§Ø³Ù:</b> ${order.customerName}</p>

    <p><b>Ø§ÙÙØ§ØªÙ:</b> 0${order.phone}</p>

    <p><b>Ø§ÙÙØ¯ÙÙØ©:</b> ${order.city}</p>

    <p><b>Ø§ÙØ¹ÙÙØ§Ù:</b> ${order.address}</p>

    </div>

    <div class="section">

    <h3>Ø§ÙÙÙØªØ¬Ø§Øª</h3>

    <table>

    <thead>

    <tr>

    <th>Ø§ÙÙÙØªØ¬</th>

    <th>Ø§ÙÙÙÙØ©</th>

    <th>Ø§ÙØ³Ø¹Ø±</th>

    <th>Ø§ÙØ¥Ø¬ÙØ§ÙÙ</th>

    </tr>

    </thead>

    <tbody>

    ${productsHTML}

    </tbody>

    </table>

    </div>

    <div class="summary">

    <div>

    <span>Ø§ÙØ¥Ø¬ÙØ§ÙÙ</span>

    <b>${order.total} Ø¬.Ù</b>

    </div>

    <div>

    <span>Ø§ÙØ´Ø­Ù</span>

    <b>${order.shipping} Ø¬.Ù</b>

    </div>

    <div>

    <span>Ø§ÙØ®ØµÙ</span>

    <b>${order.discount} Ø¬.Ù</b>

    </div>

    <div>

    <span>Ø§ÙØ¯ÙØ¹</span>

    <b>${order.paymentMethod == "cash" ? "Ø§ÙØ¯ÙØ¹ Ø¹ÙØ¯ Ø§ÙØ§Ø³ØªÙØ§Ù" : "ÙØ¯ÙÙØ¹ Ø¥ÙÙØªØ±ÙÙÙØ§Ù"}</b>

    </div>

    <div class="total">

    <span>Ø§ÙØ¥Ø¬ÙØ§ÙÙ Ø§ÙÙÙØ§Ø¦Ù</span>

    <b>${order.total} Ø¬.Ù</b>

    </div>

    </div>

    <div class="footer">

    Ø´ÙØ±Ø§Ù ÙØªØ³ÙÙÙÙ ÙÙ â¤ï¸ ÙØ³Ù Ø§ÙØªØ±Ø§Ø«

    </div>

    </div>

    <script>

    window.onload=function(){

    window.print();

    window.onafterprint=function(){

    window.close();

    }

    }

    </script>

    </body>

    </html>
  `);

  win.document.close();
}

function updatePaymentStatusColor(select) {
  select.className = "payment-status-select";

  select.classList.add(select.value.toLowerCase());
}

document.addEventListener("change", (e) => {
  if (e.target.classList.contains("payment-status-select")) {
    updatePaymentStatusColor(e.target);
  }
});


function updateStatusColor(select) {
  select.className = "order-status-select";

  select.classList.add(select.value.toLowerCase());
}

ordersCards.addEventListener("change", (e) => {
  if (e.target.classList.contains("order-status-select")) {
    updateStatusColor(e.target);
  }
});

function getPaymentBadge(status) {
  switch (status) {
    case "PAID":
      return `<span class="payment-badge paid">
            â ÙØ¯ÙÙØ¹
            </span>`;

    case "PARTIAL":
      return `<span class="payment-badge partial">
            ð  ÙØ¯ÙÙØ¹ Ø¬Ø²Ø¦ÙØ§Ù
            </span>`;

    case "REFUNDED":
      return `<span class="payment-badge refunded">
            ðµ ÙØ³ØªØ±Ø¬Ø¹
            </span>`;

    default:
      return `<span class="payment-badge pending">
            ð´ ØºÙØ± ÙØ¯ÙÙØ¹
            </span>`;
  }
}


function renderOrders(list = orders) {
  if (!list.length) {
    ordersCards.innerHTML = `
        <div class="empty-orders">

            ÙØ§ ØªÙØ¬Ø¯ Ø·ÙØ¨Ø§Øª Ø­ØªÙ Ø§ÙØ¢Ù

        </div>
        `;

    return;
  }

  ordersCards.innerHTML = "";

  list.forEach((order) => {
    ordersCards.innerHTML += `

        <div class="order-card" data-id="${order.id}">

            <div class="order-header">

                <div>

                  <strong>${order.id}</strong>

                  <select
                    class="order-status-select"
                    data-id="${order.id}">

                      <option value="NEW"
                      ${order.status === "NEW" ? "selected" : ""}>
                      Ø¬Ø¯ÙØ¯
                      </option>

                      <option value="REVIEW"
                      ${order.status === "REVIEW" ? "selected" : ""}>
                      ØªÙØª Ø§ÙÙØ±Ø§Ø¬Ø¹Ø©
                      </option>

                      <option value="PROCESSING"
                      ${order.status === "PROCESSING" ? "selected" : ""}>
                      Ø¬Ø§Ø±Ù Ø§ÙØªØ¬ÙÙØ²
                      </option>

                      <option value="PACKED"
                      ${order.status === "PACKED" ? "selected" : ""}>
                      ØªÙ Ø§ÙØªØºÙÙÙ
                      </option>

                      <option value="SHIPPED"
                      ${order.status === "SHIPPED" ? "selected" : ""}>
                      Ø®Ø±Ø¬ ÙÙØ´Ø­Ù
                      </option>

                      <option value="ONWAY"
                      ${order.status === "ONWAY" ? "selected" : ""}>
                      ÙÙ Ø§ÙØ·Ø±ÙÙ
                      </option>

                      <option value="DELIVERED"
                      ${order.status === "DELIVERED" ? "selected" : ""}>
                      ØªÙ Ø§ÙØªØ³ÙÙÙ
                      </option>

                      <option value="CANCELLED"
                      ${order.status === "CANCELLED" ? "selected" : ""}>
                      ØªÙ Ø§ÙØ¥ÙØºØ§Ø¡
                      </option>

                  </select>

                </div>

                <div>

                    ${formatAdminDate(order.createdAt)}

                </div>

            </div>

            <div class="order-body">

                <img src="${order.items[0].imageUrl}" alt="${order.items[0].name}" />

                <h3>${order.customerName}</h3>

                <span class="payment-badge">

                  ${getPaymentBadge(order.paymentStatus)}

                </span>
                <p>

                    ð± ${order.phone}

                </p>

                <p>

                    ð ${order.city}

                </p>

                <p>

                    ð° ${order.total} Ø¬.Ù

                </p>

                <p>

                  ð³

                  ${order.paymentMethod == "cash" ? "Ø§ÙØ¯ÙØ¹ Ø¹ÙØ¯ Ø§ÙØ§Ø³ØªÙØ§Ù" : "ÙØ¯ÙÙØ¹"}

                </p>

                <p>

                  ð

                  ${order.shippingType == "pickup" ? "Ø§Ø³ØªÙØ§Ù ÙÙ Ø§ÙÙØªØ¬Ø±" : "Ø´Ø­Ù"}

                </p>

                <p>

                    ð ${order.items.length} ÙÙØªØ¬

                    -

                  ${order.items.reduce(
                    (s, i) => s + i.qty,

                    0,
                  )}

                  ÙØ·Ø¹Ø©

                </p>

            </div>

            <div class="order-actions">

                <button class="view-order-btn"

                    data-id="${order.id}">

                    <i class="fa-solid fa-eye"></i>

                </button>

                <button class="whatsapp-order-btn"

                    data-phone="${order.phone}">

                    <i class="fab fa-whatsapp"></i>

                </button>

                <button

                  class="copy-order-btn"

                  data-id="${order.id}">

                  <i class="fa-solid fa-copy"></i>

                </button>

                <button class="delete-order-btn"

                    data-id="${order.id}">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>

        </div>

        `;
  });
  document.querySelectorAll(".order-status-select").forEach((select) => {
    updateStatusColor(select);
  });
}

function openWhatsapp(phone) {
  window.open(
    `https://wa.me/+2${phone}`,

    "_blank",
  );
}

async function updatePaymentStatus(id, status) {
  const response = await fetch(WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: JSON.stringify({
      action: "updatePaymentStatus",

      id,

      paymentStatus: status,
    }),
  });

  const result = await response.json();

  if (result.success) {
    showToast("ØªÙ ØªØ­Ø¯ÙØ« Ø­Ø§ÙØ© Ø§ÙØ¯ÙØ¹");

    await loadOrders();

    openOrderDetails(id);

    updatePaymentStatusColor(paymentSelect);
  }
}

function formatAdminDate(date) {
  return new Date(date).toLocaleString("ar-EG", {
    year: "numeric",

    month: "long",

    day: "numeric",

    hour: "2-digit",

    minute: "2-digit",
  });
}

function openImageViewer(src) {
  document.getElementById("viewerImage").src = src;

  document.getElementById("imageViewer").classList.add("show");
}

function closeImageViewer() {
  document.getElementById("imageViewer").classList.remove("show");
}

document.getElementById("imageViewer").addEventListener("click", function (e) {
  if (e.target === this) {
    closeImageViewer();
  }
});
async function deleteOrder(id) {
  const result = await meskAlert.fire({
    icon: "warning",

    title: "Ø­Ø°Ù Ø§ÙØ·ÙØ¨",

    text: "ÙÙ ØªØ±ÙØ¯ Ø­Ø°Ù ÙØ°Ø§ Ø§ÙØ·ÙØ¨Ø",

    showCancelButton: true,

    confirmButtonText: "Ø­Ø°Ù",

    cancelButtonText: "Ø¥ÙØºØ§Ø¡",
  });

  if (!result.isConfirmed) return;

  const response = await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "deleteOrder",

      id: id,
    }),
  });

  const data = await response.json();

  if (data.success) {
    meskAlert.fire({
      icon: "success",

      title: "ØªÙ Ø­Ø°Ù Ø§ÙØ·ÙØ¨",
    });

    loadOrders();
  } else {
    meskAlert.fire({
      icon: "error",

      title: "ÙØ´Ù Ø­Ø°Ù Ø§ÙØ·ÙØ¨",
    });
  }
}

async function openOrderDetails(orderId) {
  const order = orders.find((o) => String(o.id) === String(orderId));

  if (!order) return;

  const logsResponse = await fetch(
    `${WEB_APP_URL}?action=getOrderLogs&orderId=${orderId}`,
  );

  const logs = await logsResponse.json();

  let itemsHTML = "";

  order.items.forEach((item) => {
    itemsHTML += `

    <div class="modal-product-card">

    <img
    src="${item.imageUrl}"
    class="modal-product-image"
    onclick="openImageViewer('${item.imageUrl}')">

    <div class="modal-product-info">

      <h3>

      ${item.name}

      </h3>

      <span class="product-qty">

      ${item.qty} ÙØ·Ø¹Ø©

      </span>

    <div>

    Ø§ÙÙÙÙØ© :
    <b>${item.qty}</b>

    </div>

    <div>

    Ø§ÙØ³Ø¹Ø± :

    <b>${item.price} Ø¬.Ù</b>

    </div>

    <div>

    Ø§ÙØ¥Ø¬ÙØ§ÙÙ :

    <b>${item.qty * item.price} Ø¬.Ù</b>

    </div>

    </div>

    </div>

    `;
  });

    let logsHTML = "";

    if (Array.isArray(logs) && logs.length > 0) {
      logs.forEach((log) => {
        logsHTML += `
        <div class="timeline-item">

          <div class="timeline-dot ${log.newStatus}"></div>

          <div class="timeline-content">

            <strong>${log.newStatus || ""}</strong>

            <p>${log.message || ""}</p>

            <small>${formatAdminDate(log.createdAt)}</small>

          </div>

        </div>
      `;
      });
    } else {
      logsHTML = `
      <div class="timeline-empty">
        ÙØ§ ÙÙØ¬Ø¯ Ø³Ø¬Ù ÙÙØ·ÙØ¨ Ø­ØªÙ Ø§ÙØ¢Ù
      </div>
    `;
    }

        orderDetailsContent.innerHTML = `

          <div class="order-header-box">

                <div class="order-header-left">
                    <h2>#${order.id}</h2>
                    <p>${formatAdminDate(order.createdAt)}</p>
                </div>

                <div class="order-header-right">
                        ${getPaymentBadge(order.paymentStatus)}
                    <button
                      class="action-btn print-order-btn"
                      data-id="${order.id}"
                      onclick="printOrder('${order.id}')">
                      ð¨ï¸ Ø·Ø¨Ø§Ø¹Ø©
                    </button>
                </div>

          </div>

          <div class="order-actions">

            <select
              class="order-status-select modal-status-select"
              data-id="${order.id}"
              onchange="updateOrderStatus('${order.id}',this.value)">

            <option value="NEW" ${order.status === "NEW" ? "selected" : ""}>ð¡ Ø¬Ø¯ÙØ¯</option>

            <option value="REVIEW" ${order.status === "REVIEW" ? "selected" : ""}>ðµ ØªÙØª Ø§ÙÙØ±Ø§Ø¬Ø¹Ø©</option>

            <option value="PROCESSING" ${order.status === "PROCESSING" ? "selected" : ""}>ð£ Ø¬Ø§Ø±Ù Ø§ÙØªØ¬ÙÙØ²</option>

            <option value="PACKED" ${order.status === "PACKED" ? "selected" : ""}>ð¦ ØªÙ Ø§ÙØªØºÙÙÙ</option>

            <option value="SHIPPED" ${order.status === "SHIPPED" ? "selected" : ""}>ð Ø®Ø±Ø¬ ÙÙØ´Ø­Ù</option>

            <option value="ONWAY" ${order.status === "ONWAY" ? "selected" : ""}>ð ÙÙ Ø§ÙØ·Ø±ÙÙ</option>

            <option value="DELIVERED" ${order.status === "DELIVERED" ? "selected" : ""}>ð¢ ØªÙ Ø§ÙØªØ³ÙÙÙ</option>

            <option value="CANCELLED" ${order.status === "CANCELLED" ? "selected" : ""}>ð´ ØªÙ Ø§ÙØ¥ÙØºØ§Ø¡</option>

            </select>

            <div class="payment-actions">

              <select
              class="payment-status-select"
              onchange="updatePaymentStatus('${order.id}',this.value)">

              <option value="PENDING" ${order.paymentStatus == "PENDING" ? "selected" : ""}>ð´ ØºÙØ± ÙØ¯ÙÙØ¹</option>

              <option value="PARTIAL" ${order.paymentStatus == "PARTIAL" ? "selected" : ""}>ð  ÙØ¯ÙÙØ¹ Ø¬Ø²Ø¦ÙØ§Ù</option>

              <option value="PAID" ${order.paymentStatus == "PAID" ? "selected" : ""}>ð¢ ÙØ¯ÙÙØ¹</option>

              <option value="REFUNDED" ${order.paymentStatus == "REFUNDED" ? "selected" : ""}>ðµ ØªÙ Ø±Ø¯ Ø§ÙÙØ¨ÙØº</option>

              </select>

            </div>

          </div>

      <div class="order-section">

        <h3 class="order-section-title">

        ð¤ Ø¨ÙØ§ÙØ§Øª Ø§ÙØ¹ÙÙÙ

        </h3>

        <div class="customer-grid">

        <div>

        ð

        <span>

        ${order.customerName}

        </span>

        </div>

        <div>

        ð

        <span>

        ${order.phone}

        </span>

        </div>

        <div>

        ð

        <span>

        ${order.city}

        </span>

        </div>

          <div>

          ð 

            <span>

            ${order.address}

            </span>

          </div>

        </div>

      </div>

      <div class="customer-actions">

        <button class="action-btn copy-customer-btn"

          onclick="copyCustomer('${order.id}')">

          ð ÙØ³Ø® Ø§ÙØ¨ÙØ§ÙØ§Øª

        </button>


        <a href="tel:0${order.phone}" class="customer-btn">

        ð Ø§ØªØµØ§Ù

        </a>

        <a

        target="_blank"

        href="https://wa.me/20${order.phone}"

        class="customer-btn">

        <i class="fab fa-whatsapp"></i> ÙØ§ØªØ³Ø§Ø¨

        </a>

      </div>

      <div class="order-section">

        <h3 class="order-section-title">
            ð Ø§ÙÙÙØªØ¬Ø§Øª (${order.items.length})
        </h3>

        ${itemsHTML}

      </div>

      <div class="order-section">

        <h3 class="order-section-title">

        ð° ÙÙØ®Øµ Ø§ÙØ·ÙØ¨

        </h3>

        <div class="summary-card">

        <div>

        <span>Ø§ÙØ¥Ø¬ÙØ§ÙÙ</span>

        <b>${order.total} Ø¬.Ù</b>

        </div>

        <div>

        <span>Ø§ÙØ´Ø­Ù</span>

        <b>${order.shipping} Ø¬.Ù</b>

        </div>

        <div>

        <span>Ø§ÙØ®ØµÙ</span>

        <b>${order.discount} Ø¬.Ù</b>

        </div>

        <div>

        <span>Ø·Ø±ÙÙØ© Ø§ÙØ¯ÙØ¹</span>

        <b>

        ${order.paymentMethod == "cash" ? "Ø§ÙØ¯ÙØ¹ Ø¹ÙØ¯ Ø§ÙØ§Ø³ØªÙØ§Ù" : "ÙØ¯ÙÙØ¹ Ø¥ÙÙØªØ±ÙÙÙØ§Ù"}

        </b>

        </div>

        <div>

        <span>ÙÙØ¹ Ø§ÙØ§Ø³ØªÙØ§Ù</span>

        <b>

        ${order.shippingType == "pickup" ? "Ø§Ø³ØªÙØ§Ù ÙÙ Ø§ÙÙØªØ¬Ø±" : "Ø´Ø­Ù"}

        </b>

        </div>

        <div class="summary-total">

        <span>

        Ø§ÙØ¥Ø¬ÙØ§ÙÙ Ø§ÙÙÙØ§Ø¦Ù

        </span>

        <b>

        ${order.total} Ø¬.Ù

        </b>

        </div>

        </div>

      </div>

      <div class="order-section">

      <h3>

      Ø³Ø¬Ù Ø§ÙØ·ÙØ¨

      </h3>

      <div class="timeline">

      ${logsHTML}

      </div>

      </div>

      </div>

    `;

    const modalSelect = document.querySelector(".modal-status-select");

    if (modalSelect) {
      updateStatusColor(modalSelect);
    }

    const paymentSelect = document.querySelector(".payment-status-select");

    if (paymentSelect) {
      updatePaymentStatusColor(paymentSelect);
    }

  orderModal.classList.add("show");
}



ordersCards.addEventListener("click", (e) => {
  const view = e.target.closest(".view-order-btn");

  if (view) {
    openOrderDetails(view.dataset.id);

    return;
  }

  const whatsapp = e.target.closest(".whatsapp-order-btn");

  if (whatsapp) {
    openWhatsapp(whatsapp.dataset.phone);

    return;
  }

  const copy = e.target.closest(".copy-order-btn");

  if (copy) {
    navigator.clipboard.writeText(copy.dataset.id);

    meskAlert.fire({
      icon: "success",

      title: "ØªÙ Ø§ÙÙØ³Ø®",

      timer: 1000,

      showConfirmButton: false,
    });

    return;
  }

  const del = e.target.closest(".delete-order-btn");

  if (del) {
    deleteOrder(del.dataset.id);
  }
});

ordersCards.addEventListener("change", async (e) => {
  if (!e.target.classList.contains("order-status-select")) return;

  const orderId = e.target.dataset.id;

  const status = e.target.value;

  await updateOrderStatus(orderId, status);
});

closeOrderModal.onclick = () => {
  orderModal.classList.remove("show");
};

orderModal.onclick = (e) => {
  if (e.target === orderModal) {
    orderModal.classList.remove("show");
  }
};

async function updateOrderStatus(id, status) {
  const order = orders.find((o) => String(o.id) === String(id));

  if (!order) return;

  const oldStatus = order.status;

  // Optimistic UI
  order.status = status;

  renderOrders(filterOrdersReturn());

  if (orderModal.classList.contains("show")) {
    openOrderDetails(id);
  }

  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({
        action: "updateOrderStatus",
        id,
        status,
      }),
    });

    const result = await response.json();

    if (!result.success) throw new Error();

    showToast("â ØªÙ ØªØ­Ø¯ÙØ« Ø§ÙØ­Ø§ÙØ©");
  } catch (err) {
    order.status = oldStatus;

    renderOrders(filterOrdersReturn());

    if (orderModal.classList.contains("show")) {
      openOrderDetails(id);
    }

    meskAlert.fire({
      icon: "error",
      title: "ÙØ´Ù ØªØ­Ø¯ÙØ« Ø§ÙØ­Ø§ÙØ©",
    });
  }
}


/* ===========================================================
    DASHBOARD
=========================================================== */

async function loadDashboardStats() {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getStats`);
    const stats = await response.json();

    document.getElementById("productsCount").textContent = Number(
      stats.productsCount || 0,
    );

    document.getElementById("categoriesCount").textContent = Number(
      stats.categoriesCount || 0,
    );

    document.getElementById("stockCount").textContent = Number(
      stats.stockCount || 0,
    );

    document.getElementById("lowStockCount").textContent = Number(
      stats.lowStockCount || 0,
    );

    document.getElementById("reviewsCount").textContent = Number(
      stats.reviewsCount || 0,
    );

    console.log("DASHBOARD STATS =", stats);
  } catch (err) {
    console.error("loadDashboardStats error:", err);
  }
}

async function loadLatestReviews() {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getLatestReviews`);

    const reviews = await response.json();

    const container = document.getElementById("latestReviews");

    container.innerHTML = "";

    reviews.forEach((review) => {
      container.innerHTML += `

      <div class="review-item">

        <strong>
          ${review.name}
        </strong>

        <div class="review-stars">

          ${"â­".repeat(review.rating)}

        </div>

        <div>

          ${review.comment}

        </div>

      </div>

      `;
    });
  } catch (err) {
    console.error(err);
  }
}

/* ===========================================================
    ACCORDION
=========================================================== */

function initDashboardAccordion() {
  document.querySelectorAll(".dashboard-card").forEach((card) => {
    const header = card.querySelector(".dashboard-card-header");

    const panel = card.querySelector(".dashboard-panel");

    const icon = header.querySelector("i");

    panel.style.maxHeight = "0px";

    header.onclick = () => {
      const opened = panel.classList.contains("open");

      document.querySelectorAll(".dashboard-panel").forEach((p) => {
        p.classList.remove("open");

        p.style.maxHeight = "0px";
      });

      document.querySelectorAll(".dashboard-card-header i").forEach((i) => {
        i.style.transform = "rotate(0deg)";
      });

      if (!opened) {
        panel.classList.add("open");

        panel.style.maxHeight = panel.scrollHeight + "px";

        icon.style.transform = "rotate(180deg)";
      }
    };
  });
}

async function deleteSelectedProducts() {
  if (!selectedProducts.length) {
    meskAlert.fire({
      icon: "warning",

      title: "ÙÙ ØªØ­Ø¯Ø¯ Ø£Ù ÙÙØªØ¬Ø§Øª",
    });

    return;
  }

  const result = await meskAlert.fire({
    icon: "warning",

    title: "Ø­Ø°Ù Ø§ÙÙÙØªØ¬Ø§Øª",

    text: `Ø³ÙØªÙ Ø­Ø°Ù ${selectedProducts.length} ÙÙØªØ¬`,

    showCancelButton: true,

    confirmButtonText: "Ø­Ø°Ù",

    cancelButtonText: "Ø¥ÙØºØ§Ø¡",
  });

  if (!result.isConfirmed) return;

  await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "deleteMultiple",

      ids: selectedProducts,
    }),
  });

  selectedProducts = [];

  document.getElementById("selectedCount").textContent = "0 ÙÙØªØ¬ ÙØ­Ø¯Ø¯";

  products = [];

  await renderProductsTable();

  await loadDashboardStats();

  meskAlert.fire({
    icon: "success",

    title: "ØªÙ Ø­Ø°Ù Ø§ÙÙÙØªØ¬Ø§Øª",
  });
}

/* ===========================================================
    INIT
=========================================================== */

function updateSelectedProducts() {
  selectedProducts = [
    ...document.querySelectorAll(".product-checkbox:checked"),
  ].map((c) => c.value);

  document.getElementById("selectedCount").textContent =
    selectedProducts.length + " ÙÙØªØ¬ ÙØ­Ø¯Ø¯";
}

async function initAdmin() {
    await refreshCategoriesUI();
    await renderProductsTable();
    await loadDashboardStats();
    await loadLatestReviews();
    await loadOrders();
    initDashboardAccordion();
}

function filterAndRenderProducts() {
  const text = document
    .getElementById("adminSearch")
    .value.toLowerCase()
    .trim();

  const sort = document.getElementById("productsSort").value;

  let filtered = [...products];
  if (currentPage < 1) {
    currentPage = 1;
  }

  if (text) {
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(text) ||
        String(product.price).includes(text) ||
        (product.category || "").toLowerCase().includes(text),
    );
  }

  switch (sort) {
    case "oldest":
      filtered.sort((a, b) => Number(a.id) - Number(b.id));
      break;

    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name, "ar"));
      break;

    case "priceLow":
      filtered.sort((a, b) => a.price - b.price);
      break;

    case "priceHigh":
      filtered.sort((a, b) => b.price - a.price);
      break;

    case "stockLow":
      filtered.sort((a, b) => a.stock - b.stock);
      break;

    case "stockHigh":
      filtered.sort((a, b) => b.stock - a.stock);
      break;

    default:
      filtered.sort((a, b) => Number(b.id) - Number(a.id));
  }

  const totalPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE);

  if (currentPage > totalPages) {
    currentPage = Math.max(totalPages, 1);
  }

  renderProductsTable(filtered);
}

document
  .getElementById("adminSearch")
  .addEventListener("input", filterAndRenderProducts);

document
  .getElementById("productsSort")
  .addEventListener("change", filterAndRenderProducts);

document.addEventListener("DOMContentLoaded", function () { if (ADMIN_TOKEN) { initAdmin(); } else { showAdminLogin(); } });

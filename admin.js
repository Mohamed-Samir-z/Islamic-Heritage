const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyLu7JJfHoSyWbIjO0vwybOyWO1SFU_LTqB-k9T3pY99u3xVZLRGVq-1C8TPB-m7XCPzg/exec";

// مفتاح الـ API الخاص بك الذي أرسلته من موقع ImgBB
const IMGBB_API_KEY = "725d3e4c50df666dca90e19e483a2a8d";

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
      <option value="">اختر القسم</option>
      ${options}
    `;
  }

  bannerCategorySelect.innerHTML = `
    <option value="">بدون قسم</option>
    ${options}
  `;
}

function renderCategoriesList() {
  const list = categoriesList;

  if (!categories.length) {
    list.innerHTML = `<p>لا توجد أقسام بعد</p>`;
    return;
  }

  list.innerHTML = categories
    .map(
      (cat) => `
      <div class="category-row">
        <span class="category-name">${cat.name}</span>
        <div class="category-actions">
          <button class="edit-category-btn" data-id="${cat.id}" data-name="${cat.name}">تعديل <i class="fas fa-pen"></i></button>
          <button class="delete-category-btn" data-id="${cat.id}">حذف <i class="fas fa-trash"></i></button>
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
    meskAlert.fire({ icon: "warning", title: "اكتب اسم القسم" });
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
  meskAlert.fire({ icon: "success", title: "تم حفظ القسم" });
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
      title: "حذف القسم",
      text: "هل تريد حذف القسم؟",
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
    meskAlert.fire({ icon: "success", title: "تم حذف القسم" });
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
    meskAlert.fire({ icon: "warning", title: "اكتب عنوان البانر" });
    return;
  }

  meskAlert.fire({
    title: "جاري حفظ البانر...",
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
    meskAlert.fire({ icon: "error", title: "الصورة مطلوبة" });
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
  meskAlert.fire({ icon: "success", title: "تم الحفظ بنجاح" });
});


// دالة لجلب البيانات من جوجل شيت
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

// دالة عرض المنتجات
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
        ❌ نفد المخزون
        </div>
        `;
    } else if (Number(product.stock) <= 5) {
      stockWarning = `
        <div class="low-stock-warning">
        ⚠ متبقي ${product.stock} فقط
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

        <p>${product.price} ج.م</p>

        ${stockWarning}

        <div class="admin-actions">

        <button class="edit-btn" data-id="${product.id}">
        تعديل
        </button>

        <button class="delete-btn" data-id="${product.id}">
        حذف
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

    الاسم : ${order.customerName}

    الهاتف : ${order.phone}

    العنوان : ${order.address}

    المدينة : ${order.city}

  `;

  navigator.clipboard.writeText(text);

  showToast("✅ تم نسخ البيانات");
}

async function deleteProduct(id) {
  const result = await meskAlert.fire({
    icon: "warning",
    title: "حذف المنتج",
    text: "هل تريد حذف المنتج؟",
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

  meskAlert.fire({ icon: "success", title: "تم الحذف" }).then(() => {
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
  document.getElementById("saveProductBtn").textContent = "حفظ التعديلات";
  document.getElementById("removeMainImage").onclick = () => {
    mainImage = "";
    imageDeleted = true;
    document.getElementById("mainImagePreview").innerHTML = "";
    alert("تم حذف الصورة الرئيسية");
  };
}

const addBtn = document.getElementById("addProductBtn");
const modal = document.getElementById("productModal");

addBtn.onclick = () => {
  imageDeleted = false;
  editMode = false;
  editProductId = null;
  document.getElementById("saveProductBtn").textContent = "حفظ المنتج";
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

// دالة مخصصة لرفع الصور إلى ImgBB بشكل سريع تماشياً مع معايير الـ API الخاصة بهم
async function uploadToImgBB(base64Data) {
  if (!base64Data) return "";
  // إذا كانت الصورة عبارة عن رابط قديم مرفوع مسبقاً لا نرفعها مرة أخرى
  if (base64Data.startsWith("http://") || base64Data.startsWith("https://")) {
    return base64Data;
  }

  let base64Image = base64Data;
  if (base64Data.includes(",")) {
    base64Image = base64Data.split(",")[1];
  }

  const formData = new FormData();
  formData.append("image", base64Image);

  try {
    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      },
    );
    const result = await response.json();
    if (result.success && result.data && result.data.url) {
      return result.data.url;
    } else {
      console.error("ImgBB Error:", result);
      return "";
    }
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

    // تم تعديل الوضع هنا ليكون 'cors' أو تركه افتراضياً لاستقبال رد السكريبت النظيف وتفادي التعليق
    await fetch(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    meskAlert
      .fire({
        icon: "success",
        title: "تم الحفظ بنجاح",
      })
      .then(() => {
        modal.classList.remove("active");
        renderProductsTable();
        updateDashboard();
      });
  } catch (error) {
    console.error("Save Error:", error);
    meskAlert.fire({ icon: "error", title: "فشل الحفظ" });
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
      alert("يرجى ملء الحقول الأساسية كالإسم والسعر.");
      return;
    }

    meskAlert.fire({
      title: "جاري رفع الصور وحفظ البيانات...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    // 1. ضغط ثم رفع الصورة الرئيسية مباشرة لـ ImgBB
    const compressedMain = imageDeleted
      ? ""
      : await compressImage(mainImage || current.imageUrl || "");
    const finalImageUrl = await uploadToImgBB(compressedMain);

    // 2. ضغط ثم رفع الصور الفرعية لـ ImgBB
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
    <div class="remove-image" onclick="removeImage(${index})">×</div>
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
  document.getElementById("saveProductBtn").textContent = "حفظ المنتج";
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
          <td>${item.price} ج.م</td>
          <td>${item.qty * item.price} ج.م</td>
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

    <title>فاتورة ${order.id}</title>

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

    <h1> <i class="fa-solid fa-book-open"></i> مسك التراث</h1>

    <p>فاتورة طلب</p>

    </div>

    <div class="info">

    <div>

    <b>رقم الطلب</b>

    <br>

    ${order.id}

    </div>

    <div>

    <b>تاريخ الطلب</b>

    <br>

    ${formatAdminDate(order.createdAt)}

    </div>

    </div>

    <div class="section">

    <h3>بيانات العميل</h3>

    <p><b>الاسم:</b> ${order.customerName}</p>

    <p><b>الهاتف:</b> 0${order.phone}</p>

    <p><b>المدينة:</b> ${order.city}</p>

    <p><b>العنوان:</b> ${order.address}</p>

    </div>

    <div class="section">

    <h3>المنتجات</h3>

    <table>

    <thead>

    <tr>

    <th>المنتج</th>

    <th>الكمية</th>

    <th>السعر</th>

    <th>الإجمالى</th>

    </tr>

    </thead>

    <tbody>

    ${productsHTML}

    </tbody>

    </table>

    </div>

    <div class="summary">

    <div>

    <span>الإجمالى</span>

    <b>${order.total} ج.م</b>

    </div>

    <div>

    <span>الشحن</span>

    <b>${order.shipping} ج.م</b>

    </div>

    <div>

    <span>الخصم</span>

    <b>${order.discount} ج.م</b>

    </div>

    <div>

    <span>الدفع</span>

    <b>${order.paymentMethod == "cash" ? "الدفع عند الاستلام" : "مدفوع إلكترونياً"}</b>

    </div>

    <div class="total">

    <span>الإجمالى النهائى</span>

    <b>${order.total} ج.م</b>

    </div>

    </div>

    <div class="footer">

    شكراً لتسوقكم من ❤️ مسك التراث

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
            ✅ مدفوع
            </span>`;

    case "PARTIAL":
      return `<span class="payment-badge partial">
            🟠 مدفوع جزئياً
            </span>`;

    case "REFUNDED":
      return `<span class="payment-badge refunded">
            🔵 مسترجع
            </span>`;

    default:
      return `<span class="payment-badge pending">
            🔴 غير مدفوع
            </span>`;
  }
}


function renderOrders(list = orders) {
  if (!list.length) {
    ordersCards.innerHTML = `
        <div class="empty-orders">

            لا توجد طلبات حتى الآن

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
                      جديد
                      </option>

                      <option value="REVIEW"
                      ${order.status === "REVIEW" ? "selected" : ""}>
                      تمت المراجعة
                      </option>

                      <option value="PROCESSING"
                      ${order.status === "PROCESSING" ? "selected" : ""}>
                      جارى التجهيز
                      </option>

                      <option value="PACKED"
                      ${order.status === "PACKED" ? "selected" : ""}>
                      تم التغليف
                      </option>

                      <option value="SHIPPED"
                      ${order.status === "SHIPPED" ? "selected" : ""}>
                      خرج للشحن
                      </option>

                      <option value="ONWAY"
                      ${order.status === "ONWAY" ? "selected" : ""}>
                      فى الطريق
                      </option>

                      <option value="DELIVERED"
                      ${order.status === "DELIVERED" ? "selected" : ""}>
                      تم التسليم
                      </option>

                      <option value="CANCELLED"
                      ${order.status === "CANCELLED" ? "selected" : ""}>
                      تم الإلغاء
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

                    📱 ${order.phone}

                </p>

                <p>

                    📍 ${order.city}

                </p>

                <p>

                    💰 ${order.total} ج.م

                </p>

                <p>

                  💳

                  ${order.paymentMethod == "cash" ? "الدفع عند الاستلام" : "مدفوع"}

                </p>

                <p>

                  🚚

                  ${order.shippingType == "pickup" ? "استلام من المتجر" : "شحن"}

                </p>

                <p>

                    🛒 ${order.items.length} منتج

                    -

                  ${order.items.reduce(
                    (s, i) => s + i.qty,

                    0,
                  )}

                  قطعة

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
    showToast("تم تحديث حالة الدفع");

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

    title: "حذف الطلب",

    text: "هل تريد حذف هذا الطلب؟",

    showCancelButton: true,

    confirmButtonText: "حذف",

    cancelButtonText: "إلغاء",
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

      title: "تم حذف الطلب",
    });

    loadOrders();
  } else {
    meskAlert.fire({
      icon: "error",

      title: "فشل حذف الطلب",
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

      ${item.qty} قطعة

      </span>

    <div>

    الكمية :
    <b>${item.qty}</b>

    </div>

    <div>

    السعر :

    <b>${item.price} ج.م</b>

    </div>

    <div>

    الإجمالى :

    <b>${item.qty * item.price} ج.م</b>

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
        لا يوجد سجل للطلب حتى الآن
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
                      🖨️ طباعة
                    </button>
                </div>

          </div>

          <div class="order-actions">

            <select
              class="order-status-select modal-status-select"
              data-id="${order.id}"
              onchange="updateOrderStatus('${order.id}',this.value)">

            <option value="NEW" ${order.status === "NEW" ? "selected" : ""}>🟡 جديد</option>

            <option value="REVIEW" ${order.status === "REVIEW" ? "selected" : ""}>🔵 تمت المراجعة</option>

            <option value="PROCESSING" ${order.status === "PROCESSING" ? "selected" : ""}>🟣 جاري التجهيز</option>

            <option value="PACKED" ${order.status === "PACKED" ? "selected" : ""}>📦 تم التغليف</option>

            <option value="SHIPPED" ${order.status === "SHIPPED" ? "selected" : ""}>🚚 خرج للشحن</option>

            <option value="ONWAY" ${order.status === "ONWAY" ? "selected" : ""}>🚛 في الطريق</option>

            <option value="DELIVERED" ${order.status === "DELIVERED" ? "selected" : ""}>🟢 تم التسليم</option>

            <option value="CANCELLED" ${order.status === "CANCELLED" ? "selected" : ""}>🔴 تم الإلغاء</option>

            </select>

            <div class="payment-actions">

              <select
              class="payment-status-select"
              onchange="updatePaymentStatus('${order.id}',this.value)">

              <option value="PENDING" ${order.paymentStatus == "PENDING" ? "selected" : ""}>🔴 غير مدفوع</option>

              <option value="PARTIAL" ${order.paymentStatus == "PARTIAL" ? "selected" : ""}>🟠 مدفوع جزئياً</option>

              <option value="PAID" ${order.paymentStatus == "PAID" ? "selected" : ""}>🟢 مدفوع</option>

              <option value="REFUNDED" ${order.paymentStatus == "REFUNDED" ? "selected" : ""}>🔵 تم رد المبلغ</option>

              </select>

            </div>

          </div>

      <div class="order-section">

        <h3 class="order-section-title">

        👤 بيانات العميل

        </h3>

        <div class="customer-grid">

        <div>

        📛

        <span>

        ${order.customerName}

        </span>

        </div>

        <div>

        📞

        <span>

        ${order.phone}

        </span>

        </div>

        <div>

        📍

        <span>

        ${order.city}

        </span>

        </div>

          <div>

          🏠

            <span>

            ${order.address}

            </span>

          </div>

        </div>

      </div>

      <div class="customer-actions">

        <button class="action-btn copy-customer-btn"

          onclick="copyCustomer('${order.id}')">

          📋 نسخ البيانات

        </button>


        <a href="tel:0${order.phone}" class="customer-btn">

        📞 اتصال

        </a>

        <a

        target="_blank"

        href="https://wa.me/20${order.phone}"

        class="customer-btn">

        <i class="fab fa-whatsapp"></i> واتساب

        </a>

      </div>

      <div class="order-section">

        <h3 class="order-section-title">
            🛒 المنتجات (${order.items.length})
        </h3>

        ${itemsHTML}

      </div>

      <div class="order-section">

        <h3 class="order-section-title">

        💰 ملخص الطلب

        </h3>

        <div class="summary-card">

        <div>

        <span>الإجمالى</span>

        <b>${order.total} ج.م</b>

        </div>

        <div>

        <span>الشحن</span>

        <b>${order.shipping} ج.م</b>

        </div>

        <div>

        <span>الخصم</span>

        <b>${order.discount} ج.م</b>

        </div>

        <div>

        <span>طريقة الدفع</span>

        <b>

        ${order.paymentMethod == "cash" ? "الدفع عند الاستلام" : "مدفوع إلكترونياً"}

        </b>

        </div>

        <div>

        <span>نوع الاستلام</span>

        <b>

        ${order.shippingType == "pickup" ? "استلام من المتجر" : "شحن"}

        </b>

        </div>

        <div class="summary-total">

        <span>

        الإجمالى النهائى

        </span>

        <b>

        ${order.total} ج.م

        </b>

        </div>

        </div>

      </div>

      <div class="order-section">

      <h3>

      سجل الطلب

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

      title: "تم النسخ",

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

    showToast("✅ تم تحديث الحالة");
  } catch (err) {
    order.status = oldStatus;

    renderOrders(filterOrdersReturn());

    if (orderModal.classList.contains("show")) {
      openOrderDetails(id);
    }

    meskAlert.fire({
      icon: "error",
      title: "فشل تحديث الحالة",
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

          ${"⭐".repeat(review.rating)}

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

      title: "لم تحدد أي منتجات",
    });

    return;
  }

  const result = await meskAlert.fire({
    icon: "warning",

    title: "حذف المنتجات",

    text: `سيتم حذف ${selectedProducts.length} منتج`,

    showCancelButton: true,

    confirmButtonText: "حذف",

    cancelButtonText: "إلغاء",
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

  document.getElementById("selectedCount").textContent = "0 منتج محدد";

  products = [];

  await renderProductsTable();

  await loadDashboardStats();

  meskAlert.fire({
    icon: "success",

    title: "تم حذف المنتجات",
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
    selectedProducts.length + " منتج محدد";
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

document.addEventListener("DOMContentLoaded", initAdmin);
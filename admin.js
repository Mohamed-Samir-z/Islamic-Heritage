const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyLu7JJfHoSyWbIjO0vwybOyWO1SFU_LTqB-k9T3pY99u3xVZLRGVq-1C8TPB-m7XCPzg/exec";

// مفتاح الـ API الخاص بك الذي أرسلته من موقع ImgBB
const IMGBB_API_KEY = "725d3e4c50df666dca90e19e483a2a8d";

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

let editMode = false;
let editProductId = null;

let bannerEditId = null;
let bannerImageUrl = "";
let bannerNewImageFile = null;

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

renderProductsTable();
updateDashboard();
loadDashboardStats();
loadLatestReviews();

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

// دالة عرض المنتجات
async function renderProductsTable() {
  products = await fetchProducts();
  const table = document.getElementById("productsTable");
  table.innerHTML = "";

  products.forEach((product) => {
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
        <img src="${product.imageUrl}" class="admin-product-image">
        <div class="admin-card-body">
        <h3>${product.name}</h3>
        <p>${product.price} ج.م</p>
          ${stockWarning}
        <div class="admin-actions">
        <button class="edit-btn" data-id="${product.id}">تعديل</button>
        <button class="delete-btn" data-id="${product.id}">حذف</button>
        </div>
        </div>
        </div>
        `;
  });
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
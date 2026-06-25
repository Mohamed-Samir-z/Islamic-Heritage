const meskAlert = Swal.mixin({
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

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyLu7JJfHoSyWbIjO0vwybOyWO1SFU_LTqB-k9T3pY99u3xVZLRGVq-1C8TPB-m7XCPzg/exec";

const params = new URLSearchParams(window.location.search);

const productId = Number(params.get("id"));

let product = null;
let products = [];

loadProduct();

async function loadProduct() {
  try {
    const response = await fetch(WEB_APP_URL);

    products = await response.json();

    product = products.find((item) => Number(item.id) === productId);

    if (!product) {
      document.body.innerHTML = `
            <h1 style="text-align:center;margin-top:100px;">
            المنتج غير موجود
            </h1>
            `;

      return;
    }

    renderProduct();
    loadReviews(product.id);
    renderRelatedProducts();
  } catch (err) {
    console.error(err);
  }
}

function getFinalPrice(product) {
  if (!product.discount) return product.price;

  return Math.round(product.price - (product.price * product.discount) / 100);
}

function renderProduct() {
  document.getElementById("productName").textContent = product.name;

  document.getElementById("productPrice").textContent =
    `${getFinalPrice(product)} ج.م`;

  if (product.discount > 0) {
    document.getElementById("oldPrice").textContent = `${product.price} ج.م`;

    document.getElementById("discountBadge").textContent =
      `خصم ${product.discount}%`;
  }

  document.getElementById("productStock").textContent =
    product.stock > 0 ? `متبقي ${product.stock} قطعة` : "نفد المخزون";
  if (product.stock <= 0) {
    const btn = document.getElementById("addProductBtn");

    btn.disabled = true;

    btn.textContent = "نفد المخزون";

    btn.style.opacity = ".6";
  }

  document.getElementById("productStock").textContent =
    product.stock > 0 ? `متبقي ${product.stock} قطعة` : "نفد المخزون";

  document.getElementById("productCategory").textContent =
    `القسم : ${product.category}`;

  document.getElementById("productDescription").textContent =
    product.description;

  document.getElementById("mainProductImage").src = product.imageUrl;

  const thumbs = document.getElementById("productThumbnails");

  thumbs.innerHTML = "";

  if (product.images) {
    product.images.forEach((img) => {
      thumbs.innerHTML += `
            <img
            src="${img}"
            class="product-thumbnail">
            `;
    });
  }
}

document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("product-thumbnail")) return;

  const mainImage = document.getElementById("mainProductImage");

  const oldMainSrc = mainImage.src;

  mainImage.src = e.target.src;

  e.target.src = oldMainSrc;
});

let quantity = 1;

document.getElementById("plusQty").addEventListener("click", () => {
  if (quantity >= product.stock) {
    return;
  }

  quantity++;

  document.getElementById("qtyValue").textContent = quantity;
});

document.getElementById("minusQty").addEventListener("click", () => {
  if (quantity > 1) {
    quantity--;

    document.getElementById("qtyValue").textContent = quantity;
  }
});

// زر إضافة للسلة
document.getElementById("addProductBtn").addEventListener("click", () => {
  let cart = JSON.parse(localStorage.getItem("mesk_cart")) || [];

  const existing = cart.find((item) => item.id === product.id);

  if (product.stock <= 0) {
    meskAlert.fire({
      icon: "error",
      title: "المنتج غير متوفر حالياً",
    });

    return;
  }

  if (existing) {
    if (existing.qty >= product.stock) {
      meskAlert.fire({
        icon: "warning",
        title: "وصلت للحد الأقصى من المخزون",
      });

      return;
    }

    existing.qty += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: getFinalPrice(product),
      qty: quantity,
    });
  }

  localStorage.setItem("mesk_cart", JSON.stringify(cart));

  meskAlert.fire({
    icon: "success",
    title: "أضيف للسلة",
    text: product.name,
    timer: 1800,
    showConfirmButton: false,
  });
});

function renderRelatedProducts() {
  const relatedProducts = products.filter(
    (item) =>
      item.category === product.category &&
      String(item.id) !== String(product.id),
  );

  const relatedContainer = document.getElementById("relatedProducts");
  relatedContainer.innerHTML = "";

  relatedProducts.forEach((item) => {
    relatedContainer.innerHTML += `

<div class="product-card">

<a href="product.html?id=${item.id}">

<div
class="product-img-placeholder"
style="
background-image:url('${item.imageUrl}');
">
</div>

</a>

<div class="product-info">

<h3 class="product-title">
<a href="product.html?id=${item.id}">
${item.name}
</a>
</h3>

<span class="product-price">
${item.price} ج.م
</span>

</div>

</div>

`;
  });
}

document
  .getElementById("shareProductBtn")
  .addEventListener("click", async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,

        text: product.name,

        url: location.href,
      });
    } else {
      alert("المتصفح لا يدعم المشاركة");
    }
  });

document.getElementById("copyLinkBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(location.href);

  meskAlert.fire({
    icon: "success",

    title: "تم نسخ الرابط",
  });
});

async function loadReviews(productId) {
  try {
    const response = await fetch(
      `${WEB_APP_URL}?action=getReviews&productId=${productId}`,
    );

    const reviews = await response.json();

    renderReviews(reviews);
  } catch (err) {
    console.error(err);
  }
}

function renderReviews(reviews) {
  const reviewsList = document.getElementById("reviewsList");

  const reviewsSummary = document.getElementById("reviewsSummary");

  reviewsList.innerHTML = "";

  if (reviews.length === 0) {
    reviewsSummary.innerHTML = "لا توجد تقييمات بعد";

    return;
  }

  const average =
    reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;

  reviewsSummary.innerHTML = `
<div class="reviews-summary">

⭐ ${average.toFixed(1)}

من 5

(${reviews.length} تقييم)

</div>
`;

  reviews.forEach((review) => {
    reviewsList.innerHTML += `
    <div class="review-card">

    <div class="review-name">

    ${review.name}

    </div>

    <div class="review-stars">

    ${"⭐".repeat(review.rating)}

    </div>

    <div>

    ${review.comment}

    </div>

    </div>
    `;
  });
}

let selectedRating = 5;

const stars = document.querySelectorAll(".rating-stars i");

stars.forEach((star) => {
  star.addEventListener("click", () => {
    selectedRating = Number(star.dataset.rating);

    updateStars();
  });

  star.addEventListener("mouseenter", () => {
    const hoverValue = Number(star.dataset.rating);

    stars.forEach((s) => {
      if (Number(s.dataset.rating) <= hoverValue) {
        s.classList.add("active");
      } else {
        s.classList.remove("active");
      }
    });
  });
});

function updateStars() {
  stars.forEach((star) => {
    const value = Number(star.dataset.rating);

    if (value <= selectedRating) {
      star.classList.remove("fa-regular");

      star.classList.add("fa-solid");

      star.classList.add("active");
    } else {
      star.classList.remove("fa-solid");

      star.classList.add("fa-regular");

      star.classList.remove("active");
    }
  });

}

updateStars();
document
  .querySelector(".rating-stars")
  .addEventListener("mouseleave", updateStars);

document.getElementById("submitReviewBtn").addEventListener("click", async () => {
    const name = document.getElementById("reviewName").value.trim();

    const rating = selectedRating;

    const comment = document.getElementById("reviewComment").value.trim();

    
    if (!name || !comment) {
      meskAlert.fire({
        icon: "warning",

        title: "أكمل البيانات",
      });

      return;
    }

    await fetch(WEB_APP_URL, {
      method: "POST",

      body: JSON.stringify({
        action: "addReview",

        productId: product.id,

        name,

        rating,

        comment,
      }),
    });

    meskAlert.fire({
      icon: "success",

      title: "تم إرسال التقييم",
    });

    loadReviews(product.id);

    document.getElementById("reviewName").value = "";

    document.getElementById("reviewComment").value = "";
    selectedRating = 5;
    updateStars();
});
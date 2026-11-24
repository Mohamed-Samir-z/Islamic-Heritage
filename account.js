
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
            window.location.href = "index.html";
          }
          return r;
        }).catch(() => r);
      } catch (e) { return r; }
    });
  };
})();
// ===== end customer session layer =====
const customer = JSON.parse(localStorage.getItem("mesk_customer"));
let addresses = [];
let wishlist = [];
let notifications = [];

if (!customer) {
  window.location.href = "index.html";
}

document.getElementById("accountName").textContent = customer.name;

document.getElementById("accountPhone").textContent = customer.phone;
document.getElementById("editCustomerName").value = customer.name || "";

document.getElementById("editCustomerPhone").value = customer.phone || "";

document.getElementById("editCustomerEmail").value = customer.email || "";

if (customer.createdAt) {
  document.getElementById("memberSince").textContent =
    "Ø¹Ø¶Ù ÙÙØ° " + formatDate(customer.createdAt);
}

async function loadNotifications() {
  const response = await fetch(
    `${WEB_APP_URL}?action=getNotifications&customerId=${customer.id}`,
  );

  notifications = await response.json();

  renderNotifications();
  await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "markNotificationsRead",

      customerId: customer.id,
    }),
  });
}

function renderNotifications() {
  const container = document.getElementById("notificationsContainer");

  if (!notifications.length) {
    container.innerHTML = `

        <div class="empty-orders">

            <i class="fa-solid fa-bell-slash"></i>

            <h3>

            ÙØ§ ØªÙØ¬Ø¯ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª

            </h3>

        </div>

        `;

    return;
  }

  container.innerHTML = "";

  notifications.forEach((item) => {
    container.innerHTML += `

        <div class="notification-card ${item.isRead ? "" : "unread"}">

            <div class="notification-title">

                ${item.title}

            </div>

            <div class="notification-message">

                ${item.message}

            </div>

            <div class="notification-date">

                ${formatDate(item.createdAt)}

            </div>

        </div>

        `;
  });
}


async function loadOrders() {
  const response = await fetch(
    `${WEB_APP_URL}?action=getCustomerOrders&customerId=${customer.id}`,
  );

  const orders = await response.json();

  window.customerOrders = orders;

  renderOrders(orders);

  updateStats(orders);
}

function finalPrice(product) {
  if (Number(product.discount) > 0) {
    return Math.round(
      Number(product.price) -
        (Number(product.price) * Number(product.discount)) / 100,
    );
  }

  return Number(product.price);
}

async function loadWishlist() {
  const response = await fetch(
    `${WEB_APP_URL}?action=getWishlist&customerId=${customer.id}`,
  );

  wishlist = await response.json();

  console.log("wishlist =", wishlist);

  renderWishlist();
}

function renderWishlist() {
  const container = document.getElementById("wishlistContainer");

  if (!wishlist.length) {
    container.innerHTML = `

        <div class="empty-orders">

            <i class="fa-solid fa-heart-crack"></i>

            <h3>

                ÙØ§ ØªÙØ¬Ø¯ ÙÙØªØ¬Ø§Øª ÙÙØ¶ÙØ©

            </h3>

        </div>

        `;

    return;
  }

  container.innerHTML = "";

  wishlist.forEach((product) => {
    container.innerHTML += `

        <div class="wishlist-card ${Number(product.stock) <= 0 ? "out-stock" : ""}">
            ${
              Number(product.stock) <= 0
                ? `

                <div class="wishlist-out-stock">

                    ÙÙØ¯ Ø§ÙÙØ®Ø²ÙÙ

                </div>

              `
                : ""
            }

            <a href="product.html?id=${product.id}">

              <img
                  src="${product.imageUrl}"
                  class="wishlist-image">

            </a>

            <div class="wishlist-info">

                <h3>

                    ${product.name}

                </h3>

                <div class="wishlist-price">

                  ${
                    Number(product.discount) > 0
                      ? `

                      <span class="old-price">

                          ${product.price} Ø¬.Ù

                      </span>

                      <span class="new-price">

                          ${finalPrice(product)} Ø¬.Ù

                      </span>

                      `
                      : `

                      <span class="new-price">

                          ${product.price} Ø¬.Ù

                      </span>

                      `
                  }

                </div>

            </div>

            <div class="wishlist-actions">

                ${
                  Number(product.stock) > 0
                    ? `

                    <button
                    class="wishlist-cart"
                    onclick="wishlistAddToCart('${product.id}')">

                    <i class="fa-solid fa-cart-plus"></i>

                    Ø£Ø¶Ù ÙÙØ³ÙØ©

                    </button>

                    `
                    : `

                    <button
                    class="wishlist-cart disabled"
                    disabled>

                    <i class="fa-solid fa-ban"></i>

                    ØºÙØ± ÙØªÙÙØ±

                    </button>

                  `
                }

                <button
                    class="wishlist-remove"
                    onclick="removeWishlist('${product.id}')">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </div>

        </div>

        `;
  });
}

async function removeWishlist(id) {
  await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "removeFavorite",

      customerId: customer.id,

      productId: id,
    }),
  });

  wishlist = wishlist.filter((p) => String(p.id) !== String(id));

  renderWishlist();
}


document.querySelector(".close-order-modal").onclick = () => {
  document.getElementById("orderModal").classList.remove("show");
};

document.getElementById("orderModal").onclick = (e) => {
  if (e.target.id === "orderModal") {
    document.getElementById("orderModal").classList.remove("show");
  }
};

function renderOrders(orders) {
  const container = document.getElementById("ordersContainer");

  container.innerHTML = "";

  if (!orders.length) {
    container.innerHTML = `
        <div class="empty-orders">

            <i class="fa-solid fa-box-open"></i>

            <h3>ÙØ§ ØªÙØ¬Ø¯ Ø·ÙØ¨Ø§Øª Ø­ØªÙ Ø§ÙØ¢Ù</h3>

            <p>Ø§Ø¨Ø¯Ø£ Ø§ÙØªØ³ÙÙ ÙØ³ÙØ¸ÙØ± Ø³Ø¬Ù Ø·ÙØ¨Ø§ØªÙ ÙÙØ§.</p>

        </div>
        `;

    return;
  }

  orders.forEach((order) => {
    const firstImage = order.items?.[0]?.imageUrl || "";

    const itemsCount = order.items?.length || 0;

    const status = getStatus(order.status);

    container.innerHTML += `

        <div class="order-card"

             onclick="openOrder('${order.id}')">

            <div class="order-top">

                <div>

                    <div class="order-number">

                        ${order.id}

                    </div>

                    <div class="order-date">

                        ${formatDate(order.createdAt)}

                    </div>

                </div>

                <span class="status ${status.className}">

                    ${status.text}

                </span>

            </div>

            <div class="order-middle">

                <img
                    src="${firstImage}"
                    class="order-thumb">

                <div>

                    <h3>

                        ${itemsCount} ÙÙØªØ¬

                    </h3>

                    <p>

                        Ø¥Ø¬ÙØ§ÙÙ Ø§ÙØ·ÙØ¨

                    </p>

                </div>

                <div class="order-price">

                    ${order.total}

                    <small>Ø¬.Ù</small>

                </div>

            </div>

            <div class="order-bottom">

                <span>

                    Ø¹Ø±Ø¶ Ø§ÙØªÙØ§ØµÙÙ

                </span>

                <i class="fa-solid fa-arrow-left"></i>

            </div>

        </div>

        `;
  });
}

function loadCities(selected = "") {
  const cities = [
    "Ø§ÙÙØ§ÙØ±Ø©",
    "Ø§ÙØ¬ÙØ²Ø©",
    "Ø§ÙØ¥Ø³ÙÙØ¯Ø±ÙØ©",
    "Ø§ÙÙÙÙÙØ¨ÙØ©",
    "Ø§ÙØ´Ø±ÙÙØ©",
    "Ø§ÙØºØ±Ø¨ÙØ©",
    "Ø§ÙÙÙÙÙÙØ©",
    "Ø§ÙØ¨Ø­ÙØ±Ø©",
    "ÙÙØ± Ø§ÙØ´ÙØ®",
    "Ø§ÙØ¯ÙÙÙÙØ©",
    "Ø¯ÙÙØ§Ø·",
    "Ø¨ÙØ±Ø³Ø¹ÙØ¯",
    "Ø§ÙØ¥Ø³ÙØ§Ø¹ÙÙÙØ©",
    "Ø§ÙØ³ÙÙØ³",
    "Ø´ÙØ§Ù Ø³ÙÙØ§Ø¡",
    "Ø¬ÙÙØ¨ Ø³ÙÙØ§Ø¡",
    "Ø§ÙÙÙÙÙ",
    "Ø¨ÙÙ Ø³ÙÙÙ",
    "Ø§ÙÙÙÙØ§",
    "Ø£Ø³ÙÙØ·",
    "Ø³ÙÙØ§Ø¬",
    "ÙÙØ§",
    "Ø§ÙØ£ÙØµØ±",
    "Ø£Ø³ÙØ§Ù",
    "Ø§ÙØ¨Ø­Ø± Ø§ÙØ£Ø­ÙØ±",
    "ÙØ·Ø±ÙØ­",
    "Ø§ÙÙØ§Ø¯Ù Ø§ÙØ¬Ø¯ÙØ¯",
  ];

  addressCity.innerHTML = `<option value="">Ø§Ø®ØªØ± Ø§ÙÙØ­Ø§ÙØ¸Ø©</option>`;

  cities.forEach((city) => {
    addressCity.innerHTML += `

        <option
            value="${city}"
            ${city === selected ? "selected" : ""}>

            ${city}

        </option>

        `;
  });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",

    month: "long",

    day: "numeric",
  });
}

function renderAddresses() {
  const container = document.getElementById("addressesContainer");

  if (!addresses.length) {
    container.innerHTML = `

        <div class="empty-orders">

            <i class="fa-solid fa-location-dot"></i>

            <h3>

                ÙØ§ ØªÙØ¬Ø¯ Ø¹ÙØ§ÙÙÙ

            </h3>

        </div>

        `;

    return;
  }

  container.innerHTML = "";

  addresses.forEach((address) => {
    container.innerHTML += `

            <div class="address-card">

            <div class="address-header">

            <div>

            <div class="address-title">

            ð  ${address.title}

            </div>

            <div class="address-city">

            ${address.city}

            </div>

            </div>

            ${
              address.isDefault
                ? `<span class="default-badge">

            Ø§ÙØªØ±Ø§Ø¶Ù

            </span>`
                : ""
            }

            </div>

            <div class="address-body">

            <div>

            <i class="fa-solid fa-user"></i>

            ${address.receiverName}

            </div>

            <div>

            <i class="fa-solid fa-phone"></i>

            ${address.phone}

            </div>

            <div>

            <i class="fa-solid fa-location-dot"></i>

            ${address.address}

            </div>

            <div>

            <i class="fa-solid fa-map-pin"></i>

            ${address.landmark || ""}

            </div>

            </div>

            <div class="address-actions">

            <button
            class="edit-address"
            onclick="editAddress('${address.id}')">

            <i class="fa-solid fa-pen"></i>

            ØªØ¹Ø¯ÙÙ

            </button>

            <button
            class="delete-address"
            onclick="deleteAddress('${address.id}')">

            <i class="fa-solid fa-trash"></i>

            Ø­Ø°Ù

            </button>

            ${
              !address.isDefault
                ? `

            <button
            class="default-address-btn"
            onclick="setDefaultAddress('${address.id}')">

            <i class="fa-solid fa-star"></i>

            Ø§ÙØªØ±Ø§Ø¶Ù

            </button>

            `
                : ""
            }

            </div>

            </div>

        `;
  });
}

async function deleteAddress(id) {
  const result = await Swal.fire({
    icon: "warning",

    title: "Ø­Ø°Ù Ø§ÙØ¹ÙÙØ§ÙØ",

    text: "ÙÙ ØªØ³ØªØ·ÙØ¹ Ø§Ø³ØªØ±Ø¬Ø§Ø¹Ù",

    showCancelButton: true,

    confirmButtonText: "Ø­Ø°Ù",
  });

  if (!result.isConfirmed) return;

  await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "deleteAddress",

      id,

      customerId: customer.id,
    }),
  });

  loadAddresses();
}

async function setDefaultAddress(id) {
  await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "setDefaultAddress",

      id,

      customerId: customer.id,
    }),
  });

  loadAddresses();
}

async function loadAddresses() {
  const response = await fetch(
    `${WEB_APP_URL}?action=getAddresses&customerId=${customer.id}`,
  );

  addresses = await response.json();

  renderAddresses();
}

function editAddress(id) {
  const address = addresses.find((a) => String(a.id) === String(id));

  if (!address) return;

  addressId.value = address.id;

  addressModalTitle.textContent = "ØªØ¹Ø¯ÙÙ Ø¹ÙÙØ§Ù";

  saveAddressBtn.textContent = "Ø­ÙØ¸ Ø§ÙØªØ¹Ø¯ÙÙØ§Øª";

  addressTitle.value = address.title;

  receiverName.value = address.receiverName;

  receiverPhone.value = address.phone;

  loadCities(address.city);

  addressText.value = address.address;

  addressLandmark.value = address.landmark;

  defaultAddress.checked = address.isDefault;

  addressModal.classList.add("show");
}

function getStatus(status) {
  switch (status) {
    case "NEW":
      return {
        text: "Ø¬Ø¯ÙØ¯",

        className: "orange",
      };

    case "PROCESSING":
      return {
        text: "Ø¬Ø§Ø±Ù Ø§ÙØªØ¬ÙÙØ²",

        className: "blue",
      };

    case "SHIPPED":
      return {
        text: "ØªÙ Ø§ÙØ´Ø­Ù",

        className: "purple",
      };

    case "DELIVERED":
      return {
        text: "ØªÙ Ø§ÙØªØ³ÙÙÙ",

        className: "green",
      };

    case "CANCELLED":
      return {
        text: "ÙÙØºÙ",

        className: "red",
      };

    default:
      return {
        text: status,

        className: "gray",
      };
  }
}

function openOrder(orderId) {
  const responseOrder = window.customerOrders.find((o) => o.id === orderId);

  if (!responseOrder) return;

  const details = document.getElementById("orderDetails");

  let products = "";

  responseOrder.items.forEach((item) => {
    products += `

    <div class="modal-product-card">

        <img src="${item.imageUrl}" class="modal-product-image">

        <div class="modal-product-info">

            <h3>${item.name}</h3>

            <span>

                Ø§ÙÙÙÙØ© :
                ${item.qty}

            </span>

            <span>

                Ø§ÙØ³Ø¹Ø± :
                ${item.price} Ø¬.Ù

            </span>

        </div>

    </div>

    `;
  });

  details.innerHTML = `

        <div class="order-header-box">

            <div>

                <h2>

                    ${responseOrder.id}

                </h2>

                <p>

                    ${formatDate(responseOrder.createdAt)}

                </p>

            </div>

            <div class="status ${getStatus(responseOrder.status).className}">

                ${getStatus(responseOrder.status).text}

            </div>

        </div>

        <div class="order-section-title">

            <i class="fa-solid fa-box"></i>

            Ø§ÙÙÙØªØ¬Ø§Øª

        </div>

        <div class="order-section-title">

            <i class="fa-solid fa-truck-fast"></i>

            ØªØªØ¨Ø¹ Ø§ÙØ·ÙØ¨

            </div>

            <div class="timeline">

            ${getTimeline(responseOrder.status, responseOrder.shippingType)}

        </div>

        <div class="modal-products">

        ${products}

        </div>

        <div class="order-section-title">

            <i class="fa-solid fa-user"></i>

            Ø¨ÙØ§ÙØ§Øª Ø§ÙØ¹ÙÙÙ

            </div>

            <div class="customer-grid">

            <div>

            <i class="fa-solid fa-user"></i>

            ${responseOrder.customerName}

            </div>

            <div>

            <i class="fa-solid fa-phone"></i>

            ${responseOrder.phone}

            </div>

            <div>

            <i class="fa-solid fa-location-dot"></i>

            ${responseOrder.city}

            </div>

            ${
              responseOrder.shippingType === "delivery"
                ? `
            <div>

            <i class="fa-solid fa-house"></i>

            ${responseOrder.address}

            </div>

            <div>

            <i class="fa-solid fa-map-pin"></i>

            ${responseOrder.landmark || "ÙØ§ ÙÙØ¬Ø¯"}

            </div>

            `
                : `

            <div>

            <i class="fa-solid fa-store"></i>

            Ø§Ø³ØªÙØ§Ù ÙÙ Ø§ÙÙØªØ¬Ø±

            </div>

            `
            }

        </div>

        <div class="order-section-title">

        <i class="fa-solid fa-wallet"></i>

        ÙÙØ®Øµ Ø§ÙØ·ÙØ¨

        </div>

        <div class="summary-card">

        <div>

        <span>Ø§ÙØ¥Ø¬ÙØ§ÙÙ</span>

        <strong>

        ${responseOrder.subTotal}

        Ø¬.Ù

        </strong>

        </div>

        <div>

        <span>Ø§ÙØ®ØµÙ</span>

        <strong>

        ${responseOrder.discount}

        Ø¬.Ù

        </strong>

        </div>

        <div>

        <span>Ø§ÙØ´Ø­Ù</span>

        <strong>

        ${responseOrder.shipping}

        Ø¬.Ù

        </strong>

        </div>
        <div>

            <span>

            Ø·Ø±ÙÙØ© Ø§ÙØ§Ø³ØªÙØ§Ù

            </span>

            <strong>

            ${responseOrder.shippingType === "pickup" ? "Ø§Ø³ØªÙØ§Ù ÙÙ Ø§ÙÙØªØ¬Ø±" : "ØªÙØµÙÙ"}

            </strong>

        </div>

        ${
          responseOrder.shippingCompany
            ? `

                <div>

                <span>

                Ø´Ø±ÙØ© Ø§ÙØ´Ø­Ù

                </span>

                <strong>

                ${responseOrder.shippingCompany}

                </strong>

                </div>

                `
            : ""
        }

        ${
          responseOrder.trackingNumber
            ? `

                <div>

                    <span>

                    Ø±ÙÙ Ø§ÙØªØªØ¨Ø¹

                    </span>

                    <strong>

                        ${responseOrder.trackingNumber}

                    </strong>

                </div>

                `
            : ""
        }

        ${
          responseOrder.notes
            ? `

                <div class="order-notes">

                    <i class="fa-solid fa-note-sticky"></i>

                    ${responseOrder.notes}

                </div>

            `
            : ""
        }

        <div class="summary-total">

        <span>

        Ø§ÙØ¥Ø¬ÙØ§ÙÙ Ø§ÙÙÙØ§Ø¦Ù

        </span>

        <strong>

        ${responseOrder.total}

        Ø¬.Ù

        </strong>

        </div>

        </div>

    `;
  document.getElementById("orderModal").classList.add("show");
}

function getTimeline(status, shippingType) {
  let steps;

  if (shippingType === "pickup") {
    steps = [
      { key: "NEW", text: "ØªÙ Ø§Ø³ØªÙØ§Ù Ø§ÙØ·ÙØ¨" },

      { key: "PROCESSING", text: "Ø¬Ø§Ø±Ù Ø§ÙØªØ¬ÙÙØ²" },

      { key: "READY", text: "Ø¬Ø§ÙØ² ÙÙØ§Ø³ØªÙØ§Ù" },

      { key: "DELIVERED", text: "ØªÙ Ø§ÙØ§Ø³ØªÙØ§Ù" },
    ];
  } else {
    steps = [
      { key: "NEW", text: "ØªÙ Ø§Ø³ØªÙØ§Ù Ø§ÙØ·ÙØ¨" },

      { key: "REVIEW", text: "ØªÙØª Ø§ÙÙØ±Ø§Ø¬Ø¹Ø©" },

      { key: "PROCESSING", text: "Ø¬Ø§Ø±Ù Ø§ÙØªØ¬ÙÙØ²" },

      { key: "PACKED", text: "ØªÙ Ø§ÙØªØºÙÙÙ" },

      { key: "SHIPPED", text: "Ø®Ø±Ø¬ ÙÙØ´Ø­Ù" },

      { key: "ONWAY", text: "ÙÙ Ø§ÙØ·Ø±ÙÙ" },

      { key: "DELIVERED", text: "ØªÙ Ø§ÙØªØ³ÙÙÙ" },
    ];
  }

  const current = steps.findIndex((s) => s.key === status);

  let html = "";

  steps.forEach((step, index) => {
    html += `

        <div class="timeline-item ${index <= current ? "done" : ""}">

            <div class="timeline-circle">

                <i class="fa-solid fa-check"></i>

            </div>

            <div>

                ${step.text}

            </div>

        </div>

        `;
  });

  return html;
}

function updateStats(orders) {
  ordersCount.textContent = orders.length;

  completedOrders.textContent = orders.filter(
    (o) => o.status === "DELIVERED",
  ).length;

  pendingOrders.textContent = orders.filter(
    (o) => o.status !== "DELIVERED",
  ).length;

  totalSpent.textContent =
    orders.reduce((s, o) => s + Number(o.total), 0) + " Ø¬.Ù";
}

document.getElementById("ordersSearch").addEventListener("input", (e) => {
  const value = e.target.value.trim().toLowerCase();

  const filtered = (window.customerOrders || []).filter((order) =>
    order.id.toLowerCase().includes(value),
  );

  renderOrders(filtered);
});

document.getElementById("saveAddressBtn").onclick = async () => {
  await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: addressId.value ? "updateAddress" : "saveAddress",

      id: addressId.value,

      customerId: customer.id,

      title: addressTitle.value,

      receiverName: receiverName.value,

      phone: receiverPhone.value,

      city: addressCity.value,

      address: addressText.value,

      landmark: addressLandmark.value,

      isDefault: defaultAddress.checked,
    }),
  });

  // ØªÙØ¸ÙÙ Ø§ÙÙÙØ±Ù
  addressId.value = "";

  addressTitle.value = "";

  receiverName.value = "";

  receiverPhone.value = "";

  loadCities();

  addressText.value = "";

  addressLandmark.value = "";

  defaultAddress.checked = false;

  // ØºÙÙ Ø§ÙÙÙØ¯Ø§Ù
  document.getElementById("addressModal").classList.remove("show");

  // ØªØ­Ø¯ÙØ« Ø§ÙÙØ§Ø¦ÙØ©
  loadAddresses();
};

const panels = document.querySelectorAll(".account-panel");
const tabs = document.querySelectorAll(".account-tab");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.tab;

    if (!target) return;

    tabs.forEach((btn) => btn.classList.remove("active"));

    tab.classList.add("active");

    panels.forEach((panel) => {
      panel.classList.remove("active");

      panel.style.display = "none";
    });

    const current = document.getElementById(target + "Panel");

    if (current) {
      current.style.display = "block";

      current.classList.add("active");
    }
  });
});

logoutBtn.onclick = () => {
  localStorage.removeItem("mesk_customer");
  localStorage.removeItem("mesk_token");

  location.href = "index.html";
};

addAddressBtn.onclick = () => {
  addressId.value = "";

  addressModalTitle.textContent = "Ø¥Ø¶Ø§ÙØ© Ø¹ÙÙØ§Ù";

  saveAddressBtn.textContent = "Ø­ÙØ¸";

  document.getElementById("addressModal").classList.add("show");
};

closeAddressModal.onclick = () => {
  addressModal.classList.remove("show");
};

addressModal.onclick = (e) => {
  if (e.target === addressModal) {
    addressModal.classList.remove("show");
  }
};

document.getElementById("changePasswordBtn").onclick = changePassword;
async function changePassword() {
  const oldPassword = document.getElementById("oldPassword").value;

  const newPassword = document.getElementById("newAccountPassword").value;

  const confirmPassword = document.getElementById(
    "confirmAccountPassword",
  ).value;

  if (!oldPassword || !newPassword) {
    Swal.fire({
      icon: "warning",

      title: "Ø£ÙÙÙ Ø§ÙØ¨ÙØ§ÙØ§Øª",
    });

    return;
  }

  if (newPassword != confirmPassword) {
    Swal.fire({
      icon: "error",

      title: "ÙÙÙØªØ§ Ø§ÙÙØ±ÙØ± ØºÙØ± ÙØªØ·Ø§Ø¨ÙØªÙÙ",
    });

    return;
  }

  if (newPassword.length < 6) {
    Swal.fire({
      icon: "warning",

      title: "ÙÙÙØ© Ø§ÙÙØ±ÙØ± ÙØµÙØ±Ø© ÙØ¬Ø¨ Ø§Ù ØªÙÙÙ Ø¹ÙÙ Ø§ÙØ§ÙÙ 6 Ø­Ø±ÙÙ Ø§Ù Ø§Ø±ÙØ§Ù",
    });

    return;
  }

  if (oldPassword === newPassword) {
    Swal.fire({
      icon: "warning",

      title: "ÙÙÙØ© Ø§ÙÙØ±ÙØ± Ø§ÙØ¬Ø¯ÙØ¯Ø© ÙØ¬Ø¨ Ø£Ù ØªØ®ØªÙÙ Ø¹Ù Ø§ÙØ­Ø§ÙÙØ©",
    });

    return;
  }

  const response = await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "changePassword",

      customerId: customer.id,

      oldPassword,

      newPassword,
    }),
  });

  const result = await response.json();

  if (result.success) {
    Swal.fire({
      icon: "success",

      title: "ØªÙ ØªØºÙÙØ± ÙÙÙØ© Ø§ÙÙØ±ÙØ±",
    });

    document.getElementById("oldPassword").value = "";

    document.getElementById("newAccountPassword").value = "";

    document.getElementById("confirmAccountPassword").value = "";
  } else {
    Swal.fire({
      icon: "error",

      title: result.message,
    });
  }
}

async function updateProfile() {
  const name = document.getElementById("editCustomerName").value.trim();

  const phone = document.getElementById("editCustomerPhone").value.trim();

  const email = document.getElementById("editCustomerEmail").value.trim();

  const password = document.getElementById("profilePassword").value;

  if (!name || !phone) {
    Swal.fire({
      icon: "warning",

      title: "Ø£ÙÙÙ Ø§ÙØ¨ÙØ§ÙØ§Øª",
    });

    return;
  }

  if (!password) {
    Swal.fire({
      icon: "warning",
      title: "Ø§ÙØªØ¨ ÙÙÙØ© Ø§ÙÙØ±ÙØ± Ø§ÙØ­Ø§ÙÙØ©",
    });

    return;
  }

  const response = await fetch(WEB_APP_URL, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain",
    },

    body: JSON.stringify({
      action: "updateCustomerProfile",

      customerId: customer.id,

      name,

      phone,

      email,

      password,
    }),
  });

  const result = await response.json();

  if (result.success) {
    customer.name = name;
    customer.phone = normalizePhone(phone);
    customer.email = email;

    document.getElementById("accountName").textContent = name;
    document.getElementById("accountPhone").textContent = phone;

    document.getElementById("profilePassword").value = "";

    localStorage.setItem("mesk_customer", JSON.stringify(customer));

    Swal.fire({
      icon: "success",

      title: "ØªÙ Ø­ÙØ¸ Ø§ÙØ¨ÙØ§ÙØ§Øª",
    });
  } else {
    Swal.fire({
      icon: "error",

      title: result.message,
    });
  }
}
document.getElementById("saveProfileBtn").onclick = updateProfile;

let cart = JSON.parse(localStorage.getItem("mesk_cart")) || [];

function saveCart() {
    localStorage.setItem("mesk_cart", JSON.stringify(cart));
}

function wishlistAddToCart(id) {

    const product = wishlist.find(p => String(p.id) === String(id));

    if (!product) return;

    const existing = cart.find(item => String(item.id) === String(id));

    if (existing) {

        existing.qty++;

    } else {

        cart.push({

            id: Number(product.id),

            name: product.name,

            imageUrl: product.imageUrl,

            price: finalPrice(product),

            qty: 1

        });

    }

    saveCart();

    Swal.fire({

        icon: "success",

        title: "ØªÙØª Ø¥Ø¶Ø§ÙØ© Ø§ÙÙÙØªØ¬ ÙÙØ³ÙØ©"

    });

}

loadOrders();
loadAddresses();
loadWishlist();
loadCities();
loadNotifications();

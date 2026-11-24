
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
let checkoutCart = [];
document.addEventListener("DOMContentLoaded", () => {
   checkoutCart = JSON.parse(localStorage.getItem("mesk_cart")) || [];

   const customer = JSON.parse(localStorage.getItem("mesk_customer"));

    if (customer) {
        loadAddressesList(customer.id);
        const savedAddresses = document.getElementById("savedAddresses");

        if (savedAddresses) {
            savedAddresses.addEventListener("change", (e) => {
                const address = customerAddresses.find(
                (a) => String(a.id) === String(e.target.value),
                );

                if (!address) return;

                fillAddress(address);
            });
            }
    }

   if (customer) {
        loadDefaultAddress(customer.id);
   }
  const checkoutItems = document.getElementById("checkoutItems");
  const subtotalPrice = document.getElementById("subtotalPrice");
  const discountPrice = document.getElementById("discountPrice");
  const shippingPrice = document.getElementById("shippingPrice");
  const totalPrice = document.getElementById("totalPrice");
  const citySelect = document.getElementById("customerCity");

  if (
    !checkoutItems ||
    !subtotalPrice ||
    !discountPrice ||
    !shippingPrice ||
    !totalPrice ||
    !citySelect
  ) {
    console.error("Checkout elements are missing");
    return;
  }

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

  citySelect.innerHTML = `<option value="">Ø§Ø®ØªØ± Ø§ÙÙØ­Ø§ÙØ¸Ø©</option>`;
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });


async function loadDefaultAddress(customerId){

    try{

        const response = await fetch(

            `${WEB_APP_URL}?action=getDefaultAddress&customerId=${customerId}`

        );

        const address = await response.json();

        if(!address.id) return;

        customerName.value =

            address.receiverName || "";

        customerPhone.value =

            address.phone || "";

        customerCity.value =

            address.city || "";

        customerAddress.value =

            address.address || "";

        customerLandmark.value =

            address.landmark || "";

    }

    catch(err){

        console.log(err);

    }

}

let customerAddresses = [];

async function loadAddressesList(customerId){

    const response=await fetch(

    `${WEB_APP_URL}?action=getAddresses&customerId=${customerId}`

    );

    customerAddresses=

    await response.json();

    const defaultAddress = customerAddresses.find((a) => a.isDefault);

    if (defaultAddress) {
        fillAddress(defaultAddress);
    }

    const box = document.getElementById("savedAddressesBox");

    if (customerAddresses.length === 0) {
        box.style.display = "none";
    } else {
        box.style.display = "block";
    }
    const select=

    document.getElementById("savedAddresses");

    select.innerHTML=

    `<option value="">

    Ø§Ø®ØªØ± Ø¹ÙÙØ§Ù

    </option>`;

    customerAddresses.forEach(address=>{

    select.innerHTML+=`

    <option

    value="${address.id}"

    ${address.isDefault?"selected":""}>

    ${address.title}

    </option>

    `;

    });

    if(customerAddresses.length){

    const def=

    customerAddresses.find(a=>a.isDefault)

    ||

    customerAddresses[0];

    fillAddress(def);

    }

}

document.getElementById("savedAddresses").onchange = (e) => {
    const address = customerAddresses.find(
        (a) => String(a.id) === e.target.value,
    );

    if (address) {
        fillAddress(address);
    }
};

function fillAddress(address) {
    customerName.value = address.receiverName;

    customerPhone.value = address.phone;

    customerCity.value = address.city;

    customerAddress.value = address.address;

    customerLandmark.value = address.landmark;
}

function renderCheckout() {
    checkoutItems.innerHTML = "";

    let subtotal = 0;

    checkoutCart.forEach((item) => {
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
      subtotal += price * qty;

        checkoutItems.innerHTML += `
        <div class="checkout-item">
            <img src="${item.imageUrl || ""}" alt="${item.name || ""}">
            <div class="checkout-item-info">
            <h4>${item.name || ""}</h4>
            <p>${qty} Ã ${price} Ø¬.Ù</p>
            </div>
        </div>
        `;
    });

    subtotalPrice.textContent = subtotal + " Ø¬.Ù";
    discountPrice.textContent = "0 Ø¬.Ù";
    shippingPrice.textContent = "0 Ø¬.Ù";
    totalPrice.textContent = subtotal + " Ø¬.Ù";
}

    renderCheckout();
    const confirmOrderBtn = document.getElementById("confirmOrderBtn");

    confirmOrderBtn.addEventListener("click", submitOrder);
});

function fillAddress(address) {
    document.getElementById("customerName").value = address.receiverName || "";

    document.getElementById("customerPhone").value = address.phone || "";

    document.getElementById("customerCity").value = address.city || "";

    document.getElementById("customerAddress").value = address.address || "";

    document.getElementById("customerLandmark").value = address.landmark || "";
}

async function submitOrder() {
    alert("Ø¯Ø®ÙØª Ø§ÙØ¯Ø§ÙØ©");

    console.log("Submit Order");
    const customerName = document.getElementById("customerName").value.trim();

    const customerPhone = document.getElementById("customerPhone").value.trim();

    const customerCity = document.getElementById("customerCity").value;

    const customerAddress = document
        .getElementById("customerAddress")
        .value.trim();

    const customerLandmark = document
        .getElementById("customerLandmark")
        .value.trim();

    const customerNotes = document.getElementById("customerNotes").value.trim();

    const paymentMethod = document.querySelector(
        'input[name="payment"]:checked',
    )?.value;

    const shippingType = document.querySelector(
        'input[name="shipping"]:checked',
    )?.value;

    if (!customerName) {
        return Swal.fire({
        icon: "warning",

        title: "Ø§ÙØªØ¨ Ø§ÙØ§Ø³Ù",
        });
    }

    if (!customerPhone) {
        return Swal.fire({
        icon: "warning",

        title: "Ø§ÙØªØ¨ Ø±ÙÙ Ø§ÙÙØ§ØªÙ",
        });
    }

    if (!customerCity) {
        return Swal.fire({
        icon: "warning",

        title: "Ø§Ø®ØªØ± Ø§ÙÙØ­Ø§ÙØ¸Ø©",
        });
    }

    if (!customerAddress) {
        return Swal.fire({
        icon: "warning",

        title: "Ø§ÙØªØ¨ Ø§ÙØ¹ÙÙØ§Ù",
        });
    }

    if (checkoutCart.length === 0) {
        return Swal.fire({
        icon: "warning",

        title: "Ø§ÙØ³ÙØ© ÙØ§Ø±ØºØ©",
        });
    }
    let subTotal = 0;

    checkoutCart.forEach((item) => {
      subTotal += Number(item.price) * Number(item.qty);
    });

    const discount = 0;

    const shipping = 0;

    const total = subTotal - discount + shipping;

    const orderData = {
        action: "createOrder",

        customerName,

        phone: customerPhone,

        city: customerCity,

        address:
            customerAddress +
            (customerLandmark
                ? " - " + customerLandmark
                : ""),

        notes: customerNotes,

        paymentMethod,

        shippingType,

        items: checkoutCart,

        subTotal,

        discount,

        shipping,

        total
    };

    const response = await fetch(WEB_APP_URL, {
        method: "POST",

        headers: {
            "Content-Type": "text/plain",
        },

        body: JSON.stringify(orderData),
    });

    const result = await response.json();

    localStorage.setItem("mesk_customer",
        JSON.stringify({
            id: result.customerId,
            phone: customerPhone,
            name: customerName
        })
    );

    console.log(result);

    Swal.fire({
        icon: "success",

        title: "ØªÙ Ø§Ø³ØªÙØ§Ù Ø·ÙØ¨Ù",

        text: "Ø±ÙÙ Ø§ÙØ·ÙØ¨ : " + result.orderId,
    });

    await fetch(WEB_APP_URL, {
        method: "POST",

        headers: {
            "Content-Type": "text/plain",
        },

        body: JSON.stringify({
            action: "updateAddress",

            id: defaultAddressId,

            customerId: customer.id,

            title: "Ø§ÙÙÙØ²Ù",

            receiverName: customerName,

            phone: customerPhone,

            city: customerCity,

            address: customerAddress,

            landmark: customerLandmark,

            isDefault: true,
        }),
    });

    localStorage.removeItem("mesk_cart");
    console.log({
        customerName,
        customerPhone,
        customerCity,
        customerAddress,
        customerLandmark,
        customerNotes,
        paymentMethod,
        shippingType,
        checkoutCart,
        total
    });
    window.location.href = "index.html";
}

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
    "القاهرة",
    "الجيزة",
    "الإسكندرية",
    "القليوبية",
    "الشرقية",
    "الغربية",
    "المنوفية",
    "البحيرة",
    "كفر الشيخ",
    "الدقهلية",
    "دمياط",
    "بورسعيد",
    "الإسماعيلية",
    "السويس",
    "شمال سيناء",
    "جنوب سيناء",
    "الفيوم",
    "بنى سويف",
    "المنيا",
    "أسيوط",
    "سوهاج",
    "قنا",
    "الأقصر",
    "أسوان",
    "البحر الأحمر",
    "مطروح",
    "الوادى الجديد",
];

  citySelect.innerHTML = `<option value="">اختر المحافظة</option>`;
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

    اختر عنوان

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
            <p>${qty} × ${price} ج.م</p>
            </div>
        </div>
        `;
    });

    subtotalPrice.textContent = subtotal + " ج.م";
    discountPrice.textContent = "0 ج.م";
    shippingPrice.textContent = "0 ج.م";
    totalPrice.textContent = subtotal + " ج.م";
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
    alert("دخلت الدالة");

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

        title: "اكتب الاسم",
        });
    }

    if (!customerPhone) {
        return Swal.fire({
        icon: "warning",

        title: "اكتب رقم الهاتف",
        });
    }

    if (!customerCity) {
        return Swal.fire({
        icon: "warning",

        title: "اختر المحافظة",
        });
    }

    if (!customerAddress) {
        return Swal.fire({
        icon: "warning",

        title: "اكتب العنوان",
        });
    }

    if (checkoutCart.length === 0) {
        return Swal.fire({
        icon: "warning",

        title: "السلة فارغة",
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

        title: "تم استلام طلبك",

        text: "رقم الطلب : " + result.orderId,
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

            title: "المنزل",

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

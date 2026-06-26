const customer = JSON.parse(localStorage.getItem("mesk_customer"));
let addresses = [];

if (!customer) {
  window.location.href = "index.html";
}

document.getElementById("accountName").textContent = customer.name;

document.getElementById("accountPhone").textContent = customer.phone;


if (customer.createdAt) {
  document.getElementById("memberSince").textContent =
    "عضو منذ " + formatDate(customer.createdAt);
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

            <h3>لا توجد طلبات حتى الآن</h3>

            <p>ابدأ التسوق وسيظهر سجل طلباتك هنا.</p>

        </div>
        `;

        return;
    }

    orders.forEach(order => {

        const firstImage =
            order.items?.[0]?.imageUrl || "";

        const itemsCount =
            order.items?.length || 0;

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

                        ${itemsCount} منتج

                    </h3>

                    <p>

                        إجمالى الطلب

                    </p>

                </div>

                <div class="order-price">

                    ${order.total}

                    <small>ج.م</small>

                </div>

            </div>

            <div class="order-bottom">

                <span>

                    عرض التفاصيل

                </span>

                <i class="fa-solid fa-arrow-left"></i>

            </div>

        </div>

        `;

    });

}

function loadCities(selected = "") {

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
        "الوادى الجديد"

    ];

    addressCity.innerHTML =
        `<option value="">اختر المحافظة</option>`;

    cities.forEach(city=>{

        addressCity.innerHTML += `

        <option
            value="${city}"
            ${city===selected?"selected":""}>

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

function renderAddresses(){

    const container =
        document.getElementById("addressesContainer");

    if(!addresses.length){

        container.innerHTML=`

        <div class="empty-orders">

            <i class="fa-solid fa-location-dot"></i>

            <h3>

                لا توجد عناوين

            </h3>

        </div>

        `;

        return;

    }

    container.innerHTML="";

    addresses.forEach(address=>{

        container.innerHTML += `

            <div class="address-card">

            <div class="address-header">

            <div>

            <div class="address-title">

            🏠 ${address.title}

            </div>

            <div class="address-city">

            ${address.city}

            </div>

            </div>

            ${
            address.isDefault
                ? `<span class="default-badge">

            افتراضى

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

            تعديل

            </button>

            <button
            class="delete-address"
            onclick="deleteAddress('${address.id}')">

            <i class="fa-solid fa-trash"></i>

            حذف

            </button>

            ${
            !address.isDefault
                ? `

            <button
            class="default-address-btn"
            onclick="setDefaultAddress('${address.id}')">

            <i class="fa-solid fa-star"></i>

            افتراضى

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

        title: "حذف العنوان؟",

        text: "لن تستطيع استرجاعه",

        showCancelButton: true,

        confirmButtonText: "حذف",
    });

    if (!result.isConfirmed) return;

    await fetch(WEB_APP_URL, {
        method: "POST",

        headers: {
        "Content-Type": "text/plain",
        },

        body:JSON.stringify({

            action:"deleteAddress",

            id,

            customerId:customer.id

        })
    });

    loadAddresses();
}


async function setDefaultAddress(id) {
    await fetch(WEB_APP_URL, {
        method: "POST",

        headers: {
        "Content-Type": "text/plain",
        },

        body:JSON.stringify({

            action:"setDefaultAddress",

            id,

            customerId:customer.id

        })
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

    addressModalTitle.textContent = "تعديل عنوان";

    saveAddressBtn.textContent = "حفظ التعديلات";

    addressTitle.value = address.title;

    receiverName.value = address.receiverName;

    receiverPhone.value = address.phone;

    loadCities(address.city);

    addressText.value = address.address;

    addressLandmark.value = address.landmark;

    defaultAddress.checked = address.isDefault;

    addressModal.classList.add("show");
}


function getStatus(status){

    switch(status){

        case "NEW":

            return {

                text:"جديد",

                className:"orange"

            };

        case "PROCESSING":

            return {

                text:"جارى التجهيز",

                className:"blue"

            };

        case "SHIPPED":

            return {

                text:"تم الشحن",

                className:"purple"

            };

        case "DELIVERED":

            return {

                text:"تم التسليم",

                className:"green"

            };

        case "CANCELLED":

            return {

                text:"ملغى",

                className:"red"

            };

        default:

            return {

                text:status,

                className:"gray"

            };

    }

}

function openOrder(orderId){

    const responseOrder =
        window.customerOrders.find(o=>o.id===orderId);

    if(!responseOrder) return;

    const details=document.getElementById("orderDetails");

    let products = "";

    responseOrder.items.forEach((item) => {
        products += `

    <div class="modal-product-card">

        <img src="${item.imageUrl}" class="modal-product-image">

        <div class="modal-product-info">

            <h3>${item.name}</h3>

            <span>

                الكمية :
                ${item.qty}

            </span>

            <span>

                السعر :
                ${item.price} ج.م

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

            المنتجات

        </div>

        <div class="order-section-title">

            <i class="fa-solid fa-truck-fast"></i>

            تتبع الطلب

            </div>

            <div class="timeline">

            ${getTimeline(responseOrder.status, responseOrder.shippingType)}

        </div>

        <div class="modal-products">

        ${products}

        </div>

        <div class="order-section-title">

            <i class="fa-solid fa-user"></i>

            بيانات العميل

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

            ${responseOrder.landmark || "لا يوجد"}

            </div>

            `
                : `

            <div>

            <i class="fa-solid fa-store"></i>

            استلام من المتجر

            </div>

            `
            }

        </div>

        <div class="order-section-title">

        <i class="fa-solid fa-wallet"></i>

        ملخص الطلب

        </div>

        <div class="summary-card">

        <div>

        <span>الإجمالى</span>

        <strong>

        ${responseOrder.subTotal}

        ج.م

        </strong>

        </div>

        <div>

        <span>الخصم</span>

        <strong>

        ${responseOrder.discount}

        ج.م

        </strong>

        </div>

        <div>

        <span>الشحن</span>

        <strong>

        ${responseOrder.shipping}

        ج.م

        </strong>

        </div>
        <div>

            <span>

            طريقة الاستلام

            </span>

            <strong>

            ${responseOrder.shippingType === "pickup" ? "استلام من المتجر" : "توصيل"}

            </strong>

        </div>

        ${
          responseOrder.shippingCompany
            ? `

                <div>

                <span>

                شركة الشحن

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

                    رقم التتبع

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

        الإجمالى النهائى

        </span>

        <strong>

        ${responseOrder.total}

        ج.م

        </strong>

        </div>

        </div>

    `;
    document
        .getElementById("orderModal")
        .classList.add("show");

}



function getTimeline(status,shippingType){

    let steps;

    if(shippingType==="pickup"){

        steps=[

            {key:"NEW",text:"تم استلام الطلب"},

            {key:"PROCESSING",text:"جارى التجهيز"},

            {key:"READY",text:"جاهز للاستلام"},

            {key:"DELIVERED",text:"تم الاستلام"}

        ];

    }else{

    steps=[

        {key:"NEW",text:"تم استلام الطلب"},

        {key:"REVIEW",text:"تمت المراجعة"},

        {key:"PROCESSING",text:"جارى التجهيز"},

        {key:"PACKED",text:"تم التغليف"},

        {key:"SHIPPED",text:"خرج للشحن"},

        {key:"ONWAY",text:"فى الطريق"},

        {key:"DELIVERED",text:"تم التسليم"}

        ];

    }

    const current=
        steps.findIndex(s=>s.key===status);

    let html="";

    steps.forEach((step,index)=>{

        html+=`

        <div class="timeline-item ${index<=current?"done":""}">

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

function updateStats(orders){

    ordersCount.textContent =
        orders.length;

    completedOrders.textContent =
        orders.filter(o=>o.status==="DELIVERED").length;

    pendingOrders.textContent =
        orders.filter(o=>o.status!=="DELIVERED").length;

    totalSpent.textContent =
        orders
            .reduce((s,o)=>s+Number(o.total),0)
        +" ج.م";

}


document.getElementById("ordersSearch").addEventListener("input", (e) => {
    const value = e.target.value.trim().toLowerCase();

    const filtered = window.customerOrders.filter((order) =>
        order.id.toLowerCase().includes(value),
    );

    renderOrders(filtered);
});


document
.getElementById("saveAddressBtn")
.onclick = async () => {

    await fetch(WEB_APP_URL,{

        method:"POST",

        headers:{
            "Content-Type":"text/plain"
        },

        body:JSON.stringify({

            action: addressId.value
                ? "updateAddress"
                : "saveAddress",

            id: addressId.value,

            customerId: customer.id,

            title: addressTitle.value,

            receiverName: receiverName.value,

            phone: receiverPhone.value,

            city: addressCity.value,

            address: addressText.value,

            landmark: addressLandmark.value,

            isDefault: defaultAddress.checked

        })

    });

    // تنظيف الفورم
    addressId.value = "";

    addressTitle.value = "";

    receiverName.value = "";

    receiverPhone.value = "";

    loadCities();

    addressText.value = "";

    addressLandmark.value = "";

    defaultAddress.checked = false;

    // غلق المودال
    document
    .getElementById("addressModal")
    .classList.remove("show");

    // تحديث القائمة
    loadAddresses();

};

const panels = document.querySelectorAll(".account-panel");
const tabs = document.querySelectorAll(".account-tab");

tabs.forEach(tab=>{

    tab.addEventListener("click",()=>{

        const target = tab.dataset.tab;

        if(!target) return;

        tabs.forEach(btn=>btn.classList.remove("active"));

        tab.classList.add("active");

        panels.forEach(panel=>{

            panel.classList.remove("active");

            panel.style.display="none";

        });

        const current=document.getElementById(target+"Panel");

        if(current){

            current.style.display="block";

            current.classList.add("active");

        }

    });

});

logoutBtn.onclick = () => {
    localStorage.removeItem("mesk_customer");

    location.href = "index.html";
};

addAddressBtn.onclick = () => {
    addressId.value = "";

    addressModalTitle.textContent = "إضافة عنوان";

    saveAddressBtn.textContent = "حفظ";

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

loadOrders();
loadAddresses();
loadCities();
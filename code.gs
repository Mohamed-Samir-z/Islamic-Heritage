const PRODUCTS_SHEET = "Products";
const REVIEWS_SHEET = "Reviews";
const BANNERS_SHEET = "Banners";
const CATEGORIES_SHEET = "Categories";
const ORDERS_SHEET = "Orders";
const CUSTOMERS_SHEET = "Customers";
const COUPONS_SHEET = "Coupons";
const SETTINGS_SHEET = "Settings";
const NOTIFICATIONS_SHEET = "Notifications";
const LOGS_SHEET = "Logs";
const ADDRESSES_SHEET = "Addresses";
const ORDER_ITEMS_SHEET = "OrderItems";
const ORDER_LOGS_SHEET = "OrderLogs";
const FAVORITES_SHEET = "Favorites";

function generateSalt(){

  return Utilities.getUuid().replace(/-/g,"");

}

// ===== Security layer v71 (2026-11-25): admin auth, customer sessions, ownership enforcement =====
var ADMIN_GET_ACTIONS = {getStats:1, getLatestReviews:1, getOrders:1, getOrderLogs:1, getCoupons:1, getCustomers:1};
var ADMIN_POST_ACTIONS = {saveBanner:1, addCategory:1, updateCategory:1, deleteCategory:1, updatePaymentStatus:1, updateOrderStatus:1, deleteOrder:1, saveCoupon:1, deleteCoupon:1, toggleCoupon:1, add:1, update:1, deleteMultiple:1, delete:1, uploadImage:1, adminResetCustomerPassword:1, deleteCustomer:1};
var CUST_GET_ACTIONS = {getCustomerByPhone:1, getCustomerOrders:1, getAddresses:1, getDefaultAddress:1, getWishlist:1, getFavorites:1, getNotifications:1, getUnreadNotifications:1};
var CUST_POST_ACTIONS = {saveAddress:1, updateAddress:1, deleteAddress:1, setDefaultAddress:1, changePassword:1, updateCustomerProfile:1, addFavorite:1, removeFavorite:1, markNotificationsRead:1};
var SESSIONS_SHEET_NAME = "Sessions";
function sha256Hex_(s){var b=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s),Utilities.Charset.UTF_8);for(var i=0;i<b.length;i++){var v=(b[i]<0?b[i]+256:b[i]).toString(16);b[i]=v.length==1?"0"+v:v}return b.join("")}
function denied_(){return ContentService.createTextOutput(JSON.stringify({success:false,error:"unauthorized"})).setMimeType(ContentService.MimeType.JSON)}
function adminTokenValid_(t){if(!t)return false;var k="adm_"+sha256Hex_(t);var c=CacheService.getScriptCache();if(c.get(k)){c.put(k,"1",1800);return true}return false}
function rlCheck_(key,max){var n=CacheService.getScriptCache().get("rl_"+key);return !!(n&&parseInt(n,10)>=max)}
function rlHit_(key,windowSec){var c=CacheService.getScriptCache();var n=c.get("rl_"+key);c.put("rl_"+key,n?String(parseInt(n,10)+1):"1",windowSec)}
function sessionsSheet_(){var ss=SpreadsheetApp.getActiveSpreadsheet();var sh=ss.getSheetByName(SESSIONS_SHEET_NAME);if(!sh){sh=ss.insertSheet(SESSIONS_SHEET_NAME);sh.appendRow(["tokenHash","customerId","phone","expiresAt"])}return sh}
function issueCustomerSession_(customerId,phone){var tok=Utilities.getUuid()+"-"+Utilities.getUuid();sessionsSheet_().appendRow([sha256Hex_(tok),String(customerId),phoneText_(phone),Date.now()+7*24*3600*1000]);return tok}
function customerSession_(t){if(!t)return null;var h=sha256Hex_(t);var rows=sessionsSheet_().getDataRange().getValues();var now=Date.now();for(var i=1;i<rows.length;i++){if(String(rows[i][0])===h){return Number(rows[i][3])>now?{customerId:String(rows[i][1]),phone:String(rows[i][2])}:null}}return null}
// ===== end security layer =====

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRODUCTS_SHEET);
  const data = sheet.getDataRange().getValues();
  const result = [];

  const action = e?.parameter?.action || "products";
  if (ADMIN_GET_ACTIONS[action] && !adminTokenValid_(e.parameter.token)) return denied_();
  if (CUST_GET_ACTIONS[action]) {
    var cs_ = customerSession_(e.parameter.token);
    if (!cs_) return denied_();
    e.parameter.customerId = cs_.customerId;
    e.parameter.phone = cs_.phone;
  }
  if (action === "getStorefront") {
    var sfProducts_ = [];
    for (var sfi_ = 1; sfi_ < data.length; sfi_++) {
      sfProducts_.push({
        id: data[sfi_][0],
        name: data[sfi_][1],
        price: data[sfi_][2],
        discount: data[sfi_][3],
        stock: data[sfi_][4],
        imageUrl: data[sfi_][5],
        images: data[sfi_][6] ? JSON.parse(data[sfi_][6]) : [],
        category: data[sfi_][7],
        description: data[sfi_][8],
      });
    }
    var sfCats_ = [];
    var sfCatRows_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CATEGORIES_SHEET).getDataRange().getValues();
    for (var sfc_ = 1; sfc_ < sfCatRows_.length; sfc_++) {
      sfCats_.push({ id: sfCatRows_[sfc_][0], name: sfCatRows_[sfc_][1] });
    }
    var sfBanner_ = {};
    var sfBRows_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BANNERS_SHEET).getDataRange().getValues();
    for (var sfb_ = 1; sfb_ < sfBRows_.length; sfb_++) {
      if (String(sfBRows_[sfb_][3]).toUpperCase() === "TRUE") {
        var sfRt_ = String(sfBRows_[sfb_][5] || "").trim();
        var sfRv_ = String(sfBRows_[sfb_][6] || "").trim();
        var sfLt_ = "";
        var sfLv_ = "";
        if (["page", "category", "product"].indexOf(sfRt_) > -1) {
          sfLt_ = sfRt_;
          sfLv_ = sfRv_;
        } else if (sfRt_) {
          sfLt_ = "page";
          sfLv_ = sfRt_;
        }
        sfBanner_ = {
          id: sfBRows_[sfb_][0],
          imageUrl: sfBRows_[sfb_][1],
          title: sfBRows_[sfb_][2],
          buttonText: sfBRows_[sfb_][4],
          buttonLinkType: sfLt_,
          buttonLinkValue: sfLv_,
        };
        break;
      }
    }
    return ContentService
      .createTextOutput(JSON.stringify({ products: sfProducts_, categories: sfCats_, banner: sfBanner_ }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getBanner") {
    const bannerSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BANNERS_SHEET);
    const rows = bannerSheet.getDataRange().getValues();

    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][3]).toUpperCase() === "TRUE") {
        const rawType = String(rows[i][5] || "").trim();
        const rawValue = String(rows[i][6] || "").trim();

        let buttonLinkType = "";
        let buttonLinkValue = "";

        if (["page", "category", "product"].includes(rawType)) {
          buttonLinkType = rawType;
          buttonLinkValue = rawValue;
        } else if (rawType) {
          buttonLinkType = "page";
          buttonLinkValue = rawType;
        }

        return ContentService
          .createTextOutput(JSON.stringify({
            id: rows[i][0],
            imageUrl: rows[i][1],
            title: rows[i][2],
            buttonText: rows[i][4],
            buttonLinkType,
            buttonLinkValue
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService.createTextOutput("{}")
      .setMimeType(ContentService.MimeType.JSON);
  }
  if (action === "getReviews") {

    const reviewsSheet =
      SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(REVIEWS_SHEET);

    const productId =
      e.parameter.productId;

    const rows =
      reviewsSheet
      .getDataRange()
      .getValues();

    const reviews = [];

    for(let i=1;i<rows.length;i++){

      if(
        String(rows[i][1]) ===
        String(productId)
      ){

        reviews.push({

          id: rows[i][0],

          productId: rows[i][1],

          name: rows[i][2],

          rating: rows[i][3],

          comment: rows[i][4],

          date: rows[i][5]

        });

      }

    }

    return ContentService
    .createTextOutput(
      JSON.stringify(reviews)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

  }

  if(action === "getStats"){

    const productsSheet =
      SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(PRODUCTS_SHEET);

    const reviewsSheet =
      SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(REVIEWS_SHEET);

    const products =
      productsSheet.getDataRange().getValues();

    const reviews =
      reviewsSheet.getDataRange().getValues();

    let totalProducts = 0;
    let totalStock = 0;
    let lowStock = 0;
    const categories = new Set();

    for(let i=1;i<products.length;i++){

      totalProducts++;

      const stock = Number(products[i][4]) || 0;
      totalStock += stock;

      if(stock <= 5){
        lowStock++;
      }

      if(products[i][7]){
        categories.add(products[i][7]);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        productsCount: totalProducts,
        categoriesCount: categories.size,
        stockCount: totalStock,
        lowStockCount: lowStock,
        reviewsCount: Math.max(reviews.length - 1, 0)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if(action === "getLatestReviews"){

    const reviewsSheet =
      SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(REVIEWS_SHEET);

    const rows =
      reviewsSheet
      .getDataRange()
      .getValues();

    const reviews = [];

    for(let i=1;i<rows.length;i++){

      reviews.push({

        id: rows[i][0],

        productId: rows[i][1],

        name: rows[i][2],

        rating: rows[i][3],

        comment: rows[i][4],

        date: rows[i][5]

      });

    }

    reviews.sort(
      (a,b)=>
        new Date(b.date) -
        new Date(a.date)
    );

    return ContentService
      .createTextOutput(
        JSON.stringify(
          reviews.slice(0,5)
        )
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  }

  if(action === "getCategories"){

    const sheet =
      SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CATEGORIES_SHEET);

    const rows =
      sheet.getDataRange().getValues();

    const categories = [];

    for(let i=1;i<rows.length;i++){
      categories.push({
        id: rows[i][0],
        name: rows[i][1]
      });
    }

    return ContentService
    .createTextOutput(
      JSON.stringify(categories)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );

  }

  if(action === "getCustomerByPhone"){
    const phone = normalizePhone(e.parameter.phone);
    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(CUSTOMERS_SHEET);
    const rows =
        sheet.getDataRange().getValues();
    for(let i=1;i<rows.length;i++){
      if(normalizePhone(rows[i][2])===phone){
        return ContentService
          .createTextOutput(JSON.stringify({
            exists:true
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService
        .createTextOutput(JSON.stringify({
          exists:false
        }))
        .setMimeType(ContentService.MimeType.JSON);
  }


  if(action === "getCustomerOrders"){

    const customerId = e.parameter.customerId;

    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(ORDERS_SHEET);

    const rows =
      sheet.getDataRange().getValues();

    const orders = [];

    for(let i=1;i<rows.length;i++){

      if(String(rows[i][1]) === String(customerId)){

        orders.push({

          id: rows[i][0],

          customerId: rows[i][1],

          customerName: rows[i][2],

          phone: rows[i][3],

          address: rows[i][4],

          city: rows[i][5],

          items: rows[i][6]
            ? JSON.parse(rows[i][6])
            : [],

          subTotal: rows[i][7],

          discount: rows[i][8],

          coupon: rows[i][9],

          shipping: rows[i][10],

          shippingType: rows[i][11],

          shippingCompany: rows[i][12],

          total: rows[i][13],

          status: rows[i][14],

          paymentMethod: rows[i][15],

          paymentStatus: rows[i][16],

          trackingNumber: rows[i][17],

          notes: rows[i][18],

          createdAt: rows[i][19],

          updatedAt: rows[i][20],

          cancelReason: rows[i][21],

          cancelMessage: rows[i][22],

          cancelledBy: rows[i][23],

          cancelledAt: rows[i][24]

        });

      }

    }

    return ContentService
        .createTextOutput(JSON.stringify(orders))
        .setMimeType(ContentService.MimeType.JSON);

  }

  if(action === "getAddresses"){

    const customerId = e.parameter.customerId;

    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(ADDRESSES_SHEET);

    const rows = sheet.getDataRange().getValues();

    const result = [];

    for(let i=1;i<rows.length;i++){

      if(String(rows[i][1])===String(customerId)){

        result.push({

          id:rows[i][0],

          title:rows[i][2],

          receiverName:rows[i][3],

          phone:rows[i][4],

          city:rows[i][5],

          address:rows[i][6],

          landmark:rows[i][7],

          isDefault:rows[i][8]

        });

      }

    }

    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);

  }

  if(action==="getDefaultAddress"){

      const sheet =
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(ADDRESSES_SHEET);

      const rows =
          sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(

              String(rows[i][1])===String(e.parameter.customerId)

              &&

              String(rows[i][8]).toUpperCase()=="TRUE"

          ){

              return ContentService
                  .createTextOutput(JSON.stringify({

                      id:rows[i][0],

                      title:rows[i][2],

                      receiverName:rows[i][3],

                      phone:rows[i][4],

                      city:rows[i][5],

                      address:rows[i][6],

                      landmark:rows[i][7]

                  }))
                  .setMimeType(ContentService.MimeType.JSON);

          }

      }

      return ContentService
          .createTextOutput("{}")
          .setMimeType(ContentService.MimeType.JSON);

  }

  if(action === "getOrders"){

    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(ORDERS_SHEET);

    const rows =
      sheet.getDataRange().getValues();

    const orders = [];

    for(let i=1;i<rows.length;i++){

      orders.push({

        id: rows[i][0],

        customerId: rows[i][1],

        customerName: rows[i][2],

        phone: rows[i][3],

        address: rows[i][4],

        city: rows[i][5],

        items: rows[i][6] ? JSON.parse(rows[i][6]) : [],

        subTotal: rows[i][7],

        discount: rows[i][8],

        coupon: rows[i][9],

        shipping: rows[i][10],

        shippingType: rows[i][11],

        shippingCompany: rows[i][12],

        total: rows[i][13],

        status: rows[i][14],

        paymentMethod: rows[i][15],

        paymentStatus: rows[i][16],

        trackingNumber: rows[i][17],

        notes: rows[i][18],

        createdAt: rows[i][19],

        updatedAt: rows[i][20],

        cancelReason: rows[i][21],

        cancelMessage: rows[i][22],

        cancelledBy: rows[i][23],

        cancelledAt: rows[i][24]

      });

    }

    return ContentService
      .createTextOutput(JSON.stringify(orders))
      .setMimeType(ContentService.MimeType.JSON);

  }

  if(action === "getOrderLogs"){

    const sheet =
      SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(ORDER_LOGS_SHEET);

    const rows =
      sheet.getDataRange().getValues();

    const logs = [];

    for(let i=1;i<rows.length;i++){

      if(String(rows[i][1])===String(e.parameter.orderId)){

        logs.push({

          id: rows[i][0],

          orderId: rows[i][1],

          oldStatus: rows[i][2],

          newStatus: rows[i][3],

          message: rows[i][4],

          createdAt: rows[i][5]

        });

      }

    }

    return ContentService
      .createTextOutput(JSON.stringify(logs))
      .setMimeType(ContentService.MimeType.JSON);

  }

  if(action==="getFavorites"){

    const sheet = SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(FAVORITES_SHEET);

    const rows = sheet.getDataRange().getValues();

    const result = [];

    for(let i=1;i<rows.length;i++){

        if(String(rows[i][1])===String(e.parameter.customerId)){

            result.push({

                id: rows[i][0],

                customerId: rows[i][1],

                productId: rows[i][2],

                createdAt: rows[i][3]

            });

        }

    }

    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);

  }

  if(action=="getWishlist"){

    const favSheet =
        SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName("Favorites");

    const productSheet =
        SpreadsheetApp.getActiveSpreadsheet()
        .getSheetByName(PRODUCTS_SHEET);

    const favRows =
        favSheet.getDataRange().getValues();

    const productRows =
        productSheet.getDataRange().getValues();

    const result=[];

    for(let i=1;i<favRows.length;i++){

        if(String(favRows[i][1])===String(e.parameter.customerId)){

            const productId=
                String(favRows[i][2]);

            for(let j=1;j<productRows.length;j++){

                if(String(productRows[j][0])===productId){

                    result.push({

                        id:productRows[j][0],

                        name:productRows[j][1],

                        price:productRows[j][2],

                        discount:productRows[j][3],

                        stock:productRows[j][4],

                        imageUrl:productRows[j][5],

                        category:productRows[j][7]

                    });

                    break;

                }

            }

        }

    }

    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);

  }

  if(action=="getNotifications"){

    const sheet=
    SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(NOTIFICATIONS_SHEET);

    const rows=
    sheet.getDataRange().getValues();

    const result=[];

    for(let i=1;i<rows.length;i++){

        if(

            String(rows[i][1])==String(e.parameter.customerId)

            ||

            String(rows[i][1])=="ALL"

        ){

            result.push({

                id:rows[i][0],

                title:rows[i][2],

                message:rows[i][3],

                type:rows[i][4],

                isRead:rows[i][5],

                createdAt:rows[i][6]

            });

        }

    }

    result.reverse();

    return ContentService

    .createTextOutput(JSON.stringify(result))

    .setMimeType(ContentService.MimeType.JSON);

  }

  if(action=="getUnreadNotifications"){

    const sheet =
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(NOTIFICATIONS_SHEET);

    const rows =
        sheet.getDataRange().getValues();

    let count=0;

    for(let i=1;i<rows.length;i++){

        if(

            (

                String(rows[i][1])==String(e.parameter.customerId)

                ||

                String(rows[i][1])=="ALL"

            )

            &&

            String(rows[i][5]).toUpperCase()!="TRUE"

        ){

            count++;

        }

    }

    return ContentService

    .createTextOutput(JSON.stringify({

        count

    }))

    .setMimeType(ContentService.MimeType.JSON);

  }

  if(action=="getCoupons"){

    const sheet=
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(COUPONS_SHEET);

    const rows=
        sheet.getDataRange().getValues();

    const result=[];

    for(let i=1;i<rows.length;i++){

        result.push({

            id:rows[i][0],

            code:rows[i][1],

            type:rows[i][2],

            value:rows[i][3],

            minOrder:rows[i][4],

            expireDate:rows[i][5],

            usageLimit:rows[i][6],

            perCustomer:rows[i][7],

            targetCustomer:rows[i][8],

            active:rows[i][9]

        });

    }

    return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);

  }

  if(action=="getCustomers"){
    const crows_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMERS_SHEET).getDataRange().getValues();
    const cresult_ = [];
    for (let ci_ = 1; ci_ < crows_.length; ci_++) {
      cresult_.push({
        id: crows_[ci_][0],
        name: crows_[ci_][1],
        phone: phoneText_(crows_[ci_][2]),
        email: crows_[ci_][5] || "",
        ordersCount: Number(crows_[ci_][9]) || 0,
        totalSpent: Number(crows_[ci_][10]) || 0,
        createdAt: crows_[ci_][11] || "",
        lastLogin: crows_[ci_][12] || "",
        hasPassword: !!String(crows_[ci_][3] || "").trim()
      });
    }
    return ContentService
        .createTextOutput(JSON.stringify(cresult_))
        .setMimeType(ContentService.MimeType.JSON);
  }

  for (let i = 1; i < data.length; i++) {
    result.push({
      id: data[i][0],
      name: data[i][1],
      price: data[i][2],
      discount: data[i][3],
      stock: data[i][4],
      imageUrl: data[i][5],
      images: data[i][6] ? JSON.parse(data[i][6]) : [],
      category: data[i][7],
      description: data[i][8],
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function couponUsageCounts_(code, customerId){
  var osh_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDERS_SHEET);
  var orows_ = osh_.getDataRange().getValues();
  var total_ = 0, perCust_ = 0;
  for (var ui_ = 1; ui_ < orows_.length; ui_++) {
    if (String(orows_[ui_][9] || "").trim() === String(code).trim() && String(orows_[ui_][14] || "").trim().toUpperCase() !== "CANCELLED") {
      total_++;
      if (customerId && String(orows_[ui_][1]) === String(customerId)) perCust_++;
    }
  }
  return {total: total_, perCustomer: perCust_};
}
function validateCoupon_(code, subTotal, customerId){
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(COUPONS_SHEET);
  if (!sh) return {valid:false, message:"الكوبون غير صالح"};
  var rows = sh.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === String(code).trim()) {
      if (String(rows[i][9]).toUpperCase() !== "TRUE") return {valid:false, message:"الكوبون غير صالح"};
      var exp = rows[i][5];
      if (exp) { var d = new Date(exp); if (!isNaN(d) && d.getTime() < Date.now()) return {valid:false, message:"الكوبون منتهي الصلاحية"}; }
      var minOrder = Number(rows[i][4]) || 0;
      if (subTotal < minOrder) return {valid:false, message:"الحد الأدنى للطلب " + minOrder + " جنيه"};
      var target = String(rows[i][8] || "").trim();
      if (target && target !== String(customerId || "")) return {valid:false, message:"الكوبون غير صالح"};
      var usageLimit_ = Number(rows[i][6]) || 0;
      var perCustLimit_ = Number(rows[i][7]) || 0;
      if (usageLimit_ > 0 || perCustLimit_ > 0) {
        var counts_ = couponUsageCounts_(code, customerId);
        if (usageLimit_ > 0 && counts_.total >= usageLimit_) return {valid:false, message:"انتهت عدد مرات استخدام هذا الكوبون"};
        if (perCustLimit_ > 0 && customerId && counts_.perCustomer >= perCustLimit_) return {valid:false, message:"وصلت للحد الأقصى لاستخدام هذا الكوبون"};
      }
      var type = String(rows[i][2] || "").trim();
      var value = Number(rows[i][3]) || 0;
      var discount = (type === "percent" || type === "percentage") ? Math.round(subTotal * value / 100) : Math.round(value);
      if (discount > subTotal) discount = subTotal;
      if (discount <= 0) return {valid:false, message:"الكوبون غير صالح"};
      return {valid:true, discount:discount, type:type, value:value};
    }
  }
  return {valid:false, message:"الكوبون غير صالح"};
}

function generateOrderId(){

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(ORDERS_SHEET);

  let count =
    Math.max(sheet.getLastRow()-1,0)+1;

  const date =
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyMMdd"
    );

  const existing_ = sheet.getDataRange().getValues().map(function(r){ return String(r[0]); });
  let candidate_;
  do {
    candidate_ = `MSK-${date}-${String(count).padStart(4,"0")}`;
    count++;
  } while (existing_.indexOf(candidate_) > -1);

  return candidate_;

}

function normalizePhone(phone){

  phone = String(phone).trim();

  if(phone.startsWith("0")){
    phone = phone.substring(1);
  }

  return phone;

}

function phoneText_(phone){
  return "'" + String(phone==null?"":phone).trim();
}

function hashPassword(password,salt){

    const raw =
        password + salt;

    const bytes =
        Utilities.computeDigest(

            Utilities.DigestAlgorithm.SHA_256,

            raw

        );

    return bytes
        .map(function(b){

            const v =
                (b<0?b+256:b)
                .toString(16);

            return ("0"+v).slice(-2);

        })
        .join("");

}

function generateCustomerId(){

  return "CUS-"+Date.now();

}

function findCustomerByPhone(phone){

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(CUSTOMERS_SHEET);

  const rows =
    sheet.getDataRange().getValues();

  const targetPhone = normalizePhone(phone);
  
  let firstGuest = null;
  for(let i=1;i<rows.length;i++){


    if(normalizePhone(rows[i][2]) === targetPhone && String(rows[i][3]||"").trim()){
      return{
        row:i+1,
        id:rows[i][0]
      };
    }
    if(normalizePhone(rows[i][2]) === targetPhone && !firstGuest){
      firstGuest = { row:i+1, id:rows[i][0] };
    }

  }

  return firstGuest;

}

function updateStock(items){

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(PRODUCTS_SHEET);

  const rows =
    sheet.getDataRange().getValues();

  items.forEach(item=>{

    for(let i=1;i<rows.length;i++){

      if(String(rows[i][0])===String(item.id)){

        const stock =
          Number(rows[i][4])||0;

        const sold =
          Number(rows[i][9])||0;

        const newStock = Math.max(0, stock - item.qty);
          sheet.getRange(i + 1, 5).setValue(newStock);

        sheet.getRange(i+1,10)
          .setValue(sold+item.qty);

        break;

      }

    }

  });

}


function addLog(action,target){

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(LOGS_SHEET);

  sheet.appendRow([

    Date.now(),

    "system",

    action,

    target,

    new Date()

  ]);

}

function addNotification(customerId,title,message,type){

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(NOTIFICATIONS_SHEET);

  sheet.appendRow([

    Date.now(),

    customerId,

    title,

    message,

    type,

    false,

    new Date()

  ]);

}

function addOrderLog(orderId, oldStatus, newStatus, message){

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(ORDER_LOGS_SHEET);

  sheet.appendRow([

    "LOG-" + Date.now(),

    orderId,

    oldStatus,

    newStatus,

    message || "",

    new Date()

  ]);

}

function restoreStock(orderItems){

  const sheet =
      SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(PRODUCTS_SHEET);

  const rows =
      sheet.getDataRange().getValues();

  orderItems.forEach(item=>{

      for(let i=1;i<rows.length;i++){

          if(String(rows[i][0])===String(item.id)){

              const stock =
                  Number(rows[i][4]) || 0;

              const sold =
                  Number(rows[i][9]) || 0;

              sheet
                  .getRange(i+1,5)
                  .setValue(stock + Number(item.qty));

              sheet
                  .getRange(i+1,10)
                  .setValue(Math.max(0,sold-Number(item.qty)));

              break;

          }

      }

  });

}

function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRODUCTS_SHEET);
    const data = JSON.parse(e.postData.contents);
    const action = data.action || "add";
    if (ADMIN_POST_ACTIONS[action] && !adminTokenValid_(data.token)) { output.setContent(JSON.stringify({success:false,error:"unauthorized"})); return output; }
    if (action === "adminLogin") {
      if (rlCheck_("admin",5)) { output.setContent(JSON.stringify({success:false,error:"too_many_attempts"})); return output; }
      var expectedKey = PropertiesService.getScriptProperties().getProperty("ADMIN_KEY") || "";
      if (expectedKey && data.key && sha256Hex_(data.key) === sha256Hex_(expectedKey)) {
        var atok = Utilities.getUuid()+"-"+Utilities.getUuid();
        CacheService.getScriptCache().put("adm_"+sha256Hex_(atok),"1",1800);
        output.setContent(JSON.stringify({success:true,token:atok,expiresIn:1800}));
      } else {
        rlHit_("admin",600);
        output.setContent(JSON.stringify({success:false,error:"unauthorized"}));
      }
      return output;
    }
    if (action === "uploadImage") {
      var imgbbKey = PropertiesService.getScriptProperties().getProperty("IMGBB_KEY") || "";
      if (!imgbbKey || !data.image) { output.setContent(JSON.stringify({success:false,error:"upload_unavailable"})); return output; }
      try {
        var upRes = UrlFetchApp.fetch("https://api.imgbb.com/1/upload", {method:"post", payload:{key:imgbbKey, image:String(data.image)}});
        var upParsed = JSON.parse(upRes.getContentText());
        if (upParsed && upParsed.data && upParsed.data.url) { output.setContent(JSON.stringify({success:true,url:upParsed.data.url})); }
        else { output.setContent(JSON.stringify({success:false,error:"upload_failed"})); }
      } catch (upErr) { output.setContent(JSON.stringify({success:false,error:"upload_failed"})); }
      return output;
    }
    if (action === "createPassword") { output.setContent(JSON.stringify({success:false,error:"unavailable",message:"تم تعطيل إنشاء كلمة المرور للحسابات القائمة مؤقتاً لأمان المتجر"})); return output; }
    if (action === "adminResetCustomerPassword") {
      if (!data.customerId || !data.newPassword || String(data.newPassword).length < 6) { output.setContent(JSON.stringify({success:false,error:"invalid"})); return output; }
      var rsh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMERS_SHEET);
      var rrows = rsh.getDataRange().getValues();
      for (var ri = 1; ri < rrows.length; ri++) {
        if (String(rrows[ri][0]) === String(data.customerId)) {
          if (!String(rrows[ri][3] || "").trim()) { output.setContent(JSON.stringify({success:false,error:"guest_row_no_password"})); return output; }
          var sessSh = sessionsSheet_();
          var srows = sessSh.getDataRange().getValues();
          for (var sri = srows.length - 1; sri >= 1; sri--) {
            if (String(srows[sri][1]) === String(data.customerId)) sessSh.deleteRow(sri+1);
          }
          var rsalt = generateSalt();
          rsh.getRange(ri+1,4).setValue(hashPassword(String(data.newPassword), rsalt));
          rsh.getRange(ri+1,5).setValue(rsalt);
          output.setContent(JSON.stringify({success:true}));
          return output;
        }
      }
      output.setContent(JSON.stringify({success:false,error:"not_found"}));
      return output;
    }
    if (action === "deleteCustomer") {
      var dcid_ = String(data.customerId || "");
      if (!dcid_) { output.setContent(JSON.stringify({success:false,error:"invalid"})); return output; }
      var dsh_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMERS_SHEET);
      var drows_ = dsh_.getDataRange().getValues();
      for (var dri_ = 1; dri_ < drows_.length; dri_++) {
        if (String(drows_[dri_][0]) === dcid_) {
          if (String(drows_[dri_][3] || "").trim()) { output.setContent(JSON.stringify({success:false,error:"registered_account"})); return output; }
          var dsessSh_ = sessionsSheet_();
          var dsrows_ = dsessSh_.getDataRange().getValues();
          for (var dsri_ = dsrows_.length - 1; dsri_ >= 1; dsri_--) {
            if (String(dsrows_[dsri_][1]) === dcid_) dsessSh_.deleteRow(dsri_+1);
          }
          dsh_.deleteRow(dri_+1);
          output.setContent(JSON.stringify({success:true}));
          return output;
        }
      }
      output.setContent(JSON.stringify({success:false,error:"not_found"}));
      return output;
    }
    if (CUST_POST_ACTIONS[action]) {
      var csd_ = customerSession_(data.token);
      if (!csd_) { output.setContent(JSON.stringify({success:false,error:"unauthorized"})); return output; }
      data.customerId = csd_.customerId;
      data.phone = csd_.phone;
    }
    if (action === "cancelOrder") {
      var csc_ = customerSession_(data.token);
      if (!csc_) { output.setContent(JSON.stringify({success:false,error:"unauthorized"})); return output; }
      var ocRows = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDERS_SHEET).getDataRange().getValues();
      var ocOwn = false;
      for (var oci = 1; oci < ocRows.length; oci++) { if (String(ocRows[oci][0]) === String(data.id)) { ocOwn = String(ocRows[oci][1]) === csc_.customerId; break; } }
      if (!ocOwn) { output.setContent(JSON.stringify({success:false,error:"unauthorized"})); return output; }
    }
    if(action === "addReview"){

      const reviewsSheet =
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(REVIEWS_SHEET);

      if(
        !data.productId ||
        !data.name ||
        !data.rating ||
        !data.comment
      ){
        throw new Error("Missing review data");
      }

      reviewsSheet.appendRow([

        Date.now(),

        data.productId,

        data.name,

        data.rating,

        data.comment,

        Utilities.formatDate(
          new Date(),
          Session.getScriptTimeZone(),
          "yyyy-MM-dd HH:mm:ss"
        )

      ]);

    }

    if (action === "saveBanner") {
      const bannersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BANNERS_SHEET);
      const rows = bannersSheet.getDataRange().getValues();

      const bannerId = String(data.id || Date.now());
      const rowData = [
        bannerId,
        data.imageUrl || "",
        data.title || "",
        true,
        data.buttonText || "",
        data.buttonLinkType || "",
        data.buttonLinkValue || ""
      ];

      let targetRow = -1;
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === bannerId || String(rows[i][3]).toUpperCase() === "TRUE") {
          targetRow = i + 1;
          break;
        }
      }

      if (targetRow > -1) {
        bannersSheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
      } else {
        bannersSheet.appendRow(rowData);
      }

      const lastRow = bannersSheet.getLastRow();
      if (lastRow > 1) {
        const actives = [];
        for (let r = 2; r <= lastRow; r++) {
          actives.push([r === (targetRow > -1 ? targetRow : lastRow)]);
        }
        bannersSheet.getRange(2, 4, lastRow - 1, 1).setValues(actives);
      }
    }

    if(action === "addCategory"){
      const categoriesSheet =
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(CATEGORIES_SHEET);

      const name = String(data.name || "").trim();
      if(!name) throw new Error("Category name required");

      const rows = categoriesSheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){
        if(String(rows[i][1]).trim() === name){
          throw new Error("Category already exists");
        }
      }

      categoriesSheet.appendRow([
        Date.now(),
        name
      ]);
    }

    if(action === "updateCategory"){
      const categoriesSheet =
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(CATEGORIES_SHEET);

      const productsSheet =
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(PRODUCTS_SHEET);

      const newName = String(data.name || "").trim();
      const oldName = String(data.oldName || "").trim();

      if(!newName) throw new Error("Category name required");

      const rows = categoriesSheet.getDataRange().getValues();
      let targetRow = -1;

      for(let i=1;i<rows.length;i++){
        if(String(rows[i][0]) === String(data.id)){
          targetRow = i + 1;
          break;
        }
      }

      if(targetRow === -1) throw new Error("Category not found");

      categoriesSheet.getRange(targetRow, 2).setValue(newName);

      const productRows = productsSheet.getDataRange().getValues();
      for(let i=1;i<productRows.length;i++){
        if(String(productRows[i][7]) === oldName){
          productsSheet.getRange(i + 1, 8).setValue(newName);
        }
      }
    }

    if(action === "deleteCategory"){
      const categoriesSheet =
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(CATEGORIES_SHEET);

      const productsSheet =
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(PRODUCTS_SHEET);

      const rows = categoriesSheet.getDataRange().getValues();

      let targetRow = -1;
      let targetName = "";

      for(let i=1;i<rows.length;i++){
        if(String(rows[i][0]) === String(data.id)){
          targetRow = i + 1;
          targetName = String(rows[i][1]);
          break;
        }
      }

      if(targetRow === -1) throw new Error("Category not found");

      const productRows = productsSheet.getDataRange().getValues();
      for(let i=1;i<productRows.length;i++){
        if(String(productRows[i][7]) === targetName){
          throw new Error("Cannot delete category used by products");
        }
      }

      categoriesSheet.deleteRow(targetRow);
    }

    if (action === "validateCoupon") {
      var vcSess_ = customerSession_(data.token);
      var vcRes_ = validateCoupon_(String(data.code || "").trim(), Number(data.subTotal) || 0, vcSess_ ? vcSess_.customerId : "");
      output.setContent(JSON.stringify({success: true, valid: vcRes_.valid, message: vcRes_.message || "", discount: vcRes_.discount || 0, type: vcRes_.type || "", value: vcRes_.value || 0}));
      return output;
    }

    if (action === "createOrder") {
      var coSess_ = customerSession_(data.token);
      var coGuest_ = !coSess_;
      var coCustRows_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMERS_SHEET).getDataRange().getValues();
      if (coSess_) {
        var coCustRow_ = null;
        for (var coi_ = 1; coi_ < coCustRows_.length; coi_++) { if (String(coCustRows_[coi_][0]) === coSess_.customerId) { coCustRow_ = coCustRows_[coi_]; break; } }
        if (!coCustRow_) { output.setContent(JSON.stringify({success:false,error:"unauthorized"})); return output; }
        data.phone = String(coCustRow_[2]);
        data.customerName = String(coCustRow_[1]);
      } else {
        var coPhoneNorm_ = phoneText_(data.phone || "");
        var coDigits_ = coPhoneNorm_.replace(/\D/g, "");
        if (coDigits_.length < 10 || coDigits_.length > 11) { output.setContent(JSON.stringify({success:false, message:"رقم الهاتف غير صالح"})); return output; }
        data.phone = coPhoneNorm_;
        data.customerName = String(data.customerName || "").trim().slice(0, 100);
        if (!data.customerName) { output.setContent(JSON.stringify({success:false, message:"الاسم مطلوب"})); return output; }
      }
      if (rlCheck_("order_" + phoneText_(data.phone).replace(/\D/g, ""), 5)) { output.setContent(JSON.stringify({success:false, message:"طلبات كثيرة من هذا الرقم، حاول لاحقاً"})); return output; }
      var coLock_ = LockService.getScriptLock();
      if (!coLock_.tryLock(15000)) { output.setContent(JSON.stringify({success:false, message:"النظام مشغول، حاول بعد قليل"})); return output; }
      try {
      var coStockRows_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRODUCTS_SHEET).getDataRange().getValues();
      var coItems_ = data.items || [];
      var coQtyById_ = {};
      for (var coj_ = 0; coj_ < coItems_.length; coj_++) {
        var coQty_ = Number(coItems_[coj_].qty);
        if (!isFinite(coQty_) || coQty_ <= 0) { output.setContent(JSON.stringify({success:false, message:"كمية غير صالحة"})); return output; }
        var coKey_ = String(coItems_[coj_].id);
        coQtyById_[coKey_] = (coQtyById_[coKey_] || 0) + coQty_;
      }
      for (var coIdKey_ in coQtyById_) {
        var coFound_ = false;
        for (var cok_ = 1; cok_ < coStockRows_.length; cok_++) {
          if (String(coStockRows_[cok_][0]) === coIdKey_) {
            coFound_ = true;
            if (Number(coStockRows_[cok_][4]) < coQtyById_[coIdKey_]) { output.setContent(JSON.stringify({success:false, message:"الكمية المطلوبة غير متوفرة"})); return output; }
            break;
          }
        }
        if (!coFound_) { output.setContent(JSON.stringify({success:false, message:"منتج غير موجود"})); return output; }
      }

      var coSrvSub_ = 0;
      for (var cos_ = 0; cos_ < coItems_.length; cos_++) {
        var coIt_ = coItems_[cos_];
        for (var cop_ = 1; cop_ < coStockRows_.length; cop_++) {
          if (String(coStockRows_[cop_][0]) === String(coIt_.id)) {
            var coP_ = Number(coStockRows_[cop_][2]) || 0;
            var coD_ = Number(coStockRows_[cop_][3]) || 0;
            var coFP_ = coD_ ? Math.round(coP_ - (coP_ * coD_) / 100) : coP_;
            coIt_.price = coFP_;
            coIt_.qty = Number(coIt_.qty);
            coIt_.name = String(coStockRows_[cop_][1]);
            coSrvSub_ += coFP_ * coIt_.qty;
            break;
          }
        }
      }
      data.subTotal = coSrvSub_;
      var coDisc_ = 0;
      var coCode_ = String(data.coupon || "").trim();
      if (coCode_) {
        var coCpCustId_ = coGuest_ ? "" : coSess_.customerId;
        if (coGuest_) {
          for (var cgfi_ = 1; cgfi_ < coCustRows_.length; cgfi_++) {
            if (phoneText_(coCustRows_[cgfi_][2]) === phoneText_(data.phone) && !String(coCustRows_[cgfi_][3] || "").trim()) { coCpCustId_ = String(coCustRows_[cgfi_][0]); break; }
          }
        }
        var coCp_ = validateCoupon_(coCode_, coSrvSub_, coCpCustId_);
        if (!coCp_.valid) { output.setContent(JSON.stringify({success:false, message: coCp_.message})); return output; }
        coDisc_ = coCp_.discount;
      }
      data.discount = coDisc_;
      data.shipping = 0;
      data.total = coSrvSub_ - coDisc_;

    // ===============================
          // إنشاء أو تحديث العميل
    // ===============================

      const customersSheet =
        SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(CUSTOMERS_SHEET);

      let customer = null;
      if (coGuest_) {
        for (var gfi_ = 1; gfi_ < coCustRows_.length; gfi_++) {
          if (phoneText_(coCustRows_[gfi_][2]) === phoneText_(data.phone) && !String(coCustRows_[gfi_][3] || "").trim()) {
            customer = { id: String(coCustRows_[gfi_][0]), row: gfi_ + 1 };
            break;
          }
        }
      } else {
        customer = findCustomerByPhone(data.phone);
      }

      let customerId;

      if(customer){

        customerId = customer.id;

        if (!coGuest_) {
          customersSheet.getRange(customer.row,2).setValue(data.customerName);
          customersSheet.getRange(customer.row,7).setValue(data.address);
          customersSheet.getRange(customer.row,8).setValue(data.landmark || "");
          customersSheet.getRange(customer.row,9).setValue(data.city);
        }

      }else{

        customerId = generateCustomerId();

        customersSheet.appendRow([

          customerId,          // A id

          data.customerName,   // B name

          phoneText_(data.phone),          // C phone

          "",                  // D passwordHash

          "",                  // E salt

          "",                  // F email

          data.address,        // G address

          data.landmark || "", // H landmark

          data.city || "",     // I city

          0,                   // J ordersCount

          0,                   // K totalSpent

          new Date(),          // L createdAt

          "",                  // M lastLogin

          ""                   // N lastOrder

        ]);

      }

      const ordersSheet =
        SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(ORDERS_SHEET);

      const orderId = generateOrderId();

      var coAppendedOrder_ = false;
      var coStockDone_ = false;
      try {
      ordersSheet.appendRow([

        orderId,

        customerId,

        data.customerName,

        phoneText_(data.phone),

        data.address,

        data.city || "",

        JSON.stringify(data.items || []),

        data.subTotal || 0,

        data.discount || 0,

        data.coupon || "",

        data.shipping || 0,

        data.shippingType || "delivery",

        data.shippingCompany || "",

        data.total || 0,

        "NEW",

        data.paymentMethod || "cash",

        "PENDING",

        "",

        data.notes || "",

        new Date(),

        new Date(),

        "", // cancelReason

        "", // cancelMessage

        "", // cancelledBy

        ""  // cancelledAt

      ]);

      addOrderLog(
        orderId,
        "",
        "NEW",
        "تم إنشاء الطلب"
      );

      const orderItemsSheet =
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName("OrderItems");

        data.items.forEach(item=>{

          orderItemsSheet.appendRow([

            "OI-"+Utilities.getUuid(),

            orderId,

            item.id,

            item.name,

            item.price,

            item.qty,

            item.price*item.qty,

            new Date()

          ]);

      });

            // خصم المخزون
      updateStock(data.items || []);

      coStockDone_ = true;

      // تحديث بيانات العميل
      const customerData =
        findCustomerByPhone(data.phone);

      if(customerData){

        const row = customerData.row;

        const ordersCount =
          Number(customersSheet.getRange(row,10).getValue()) || 0;

          const totalSpent =
          Number(customersSheet.getRange(row,11).getValue()) || 0;

          customersSheet.getRange(row,10)
          .setValue(ordersCount + 1);

          customersSheet.getRange(row,11)
          .setValue(totalSpent + Number(data.total));

          customersSheet.getRange(row,14)
          .setValue(new Date());

      }

      coAppendedOrder_ = true;

      // إضافة Log
      addLog(
        "CREATE_ORDER",
        orderId
      );

      // إشعار
      addNotification(

        customerId,

        "تم استلام طلبك",

        "رقم الطلب : " + orderId,

        "order"

      );

      rlHit_("order_" + phoneText_(data.phone).replace(/\D/g, ""), 3600);

      output.setContent(JSON.stringify({

        status:"success",
        orderId,
        customerId

      }));

      } catch (coErr_) {
        try { if (coStockDone_) { restoreStock(data.items || []); } } catch (coE2_) {}
        try {
          var coOrdSh_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDERS_SHEET);
          var coOrdRows_ = coOrdSh_.getDataRange().getValues();
          for (var cor_ = coOrdRows_.length - 1; cor_ >= 1; cor_--) { if (String(coOrdRows_[cor_][0]) === String(orderId)) { coOrdSh_.deleteRow(cor_ + 1); break; } }
          var coOiSh_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ORDER_ITEMS_SHEET);
          var coOiRows_ = coOiSh_.getDataRange().getValues();
          for (var cor2_ = coOiRows_.length - 1; cor2_ >= 1; cor2_--) { if (String(coOiRows_[cor2_][1]) === String(orderId)) { coOiSh_.deleteRow(cor2_ + 1); } }
        } catch (coE3_) {}
        output.setContent(JSON.stringify({success:false, message:"تعذر إنشاء الطلب"}));
        return output;
      }
      return output;

      } finally { coLock_.releaseLock(); }

    }

    if(action==="loginCustomer"){
      if(rlCheck_("login_"+normalizePhone(data.phone||""),5)){output.setContent(JSON.stringify({success:false,message:"عدد المحاولات كبير، حاول بعد قليل"}));return output;}

      const customersSheet =
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(CUSTOMERS_SHEET);

      const phone =
          normalizePhone(data.phone);

      const rows =
          customersSheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(normalizePhone(rows[i][2])===phone){

              const savedHash =
                  rows[i][3];

              const salt =
                  rows[i][4];

          if(!savedHash || !salt){ continue; }

              const enteredHash =
                  hashPassword(data.password,salt);

              if(savedHash!==enteredHash){
                  rlHit_("login_"+phone,600);

                  output.setContent(JSON.stringify({

                      success:false,

                      message:"كلمة المرور غير صحيحة"

                  }));

                  return output;

              }

              // تحديث آخر تسجيل دخول
              customersSheet
                  .getRange(i+1,13)
                  .setValue(new Date());

              output.setContent(JSON.stringify({

                  success:true,

                  token:issueCustomerSession_(rows[i][0], rows[i][2]),

                  customer:{

                      id:rows[i][0],

                      name:rows[i][1],

                      phone:rows[i][2],

                      email:rows[i][5],

                      address:rows[i][6],

                      landmark:rows[i][7],

                      city:rows[i][8],

                      ordersCount:rows[i][9],

                      totalSpent:rows[i][10],

                      createdAt:rows[i][11]

                  }

              }));

              return output;

          }

      }

      output.setContent(JSON.stringify({

          success:false,

          message:"هذا الرقم غير مسجل"

      }));

      return output;

    }

    if(action==="registerCustomer"){

      const customersSheet =
        SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(CUSTOMERS_SHEET);

      const phone =
        normalizePhone(data.phone);

      const rows =
        customersSheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(normalizePhone(rows[i][2])===phone && String(rows[i][3]||"").trim()){

              output.setContent(JSON.stringify({

                  success:false,

                  message:"رقم الهاتف مستخدم بالفعل"

              }));

              return output;

          }

      }

      const customerId =
        generateCustomerId();

      const salt =
        generateSalt();

      const passwordHash =
        hashPassword(data.password,salt);

      customersSheet.appendRow([

          customerId,

          data.name,

          phoneText_(data.phone),

          passwordHash,

          salt,

          data.email || "",

          data.address || "",

          data.landmark || "",

          data.city || "",

          0,

          0,

          new Date(),

          "",

          ""

      ]);

      output.setContent(JSON.stringify({

          success:true,

          token:issueCustomerSession_(customerId, phone),

          customer:{

              id:customerId,

              name:data.name,

              phone:phone,

              email:data.email || ""

          }

      }));

      return output;

    }

    if(action=="createPassword"){

      const sheet =
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(CUSTOMERS_SHEET);

      const rows =
          sheet.getDataRange().getValues();

      const phone =
          normalizePhone(data.phone);

      for(let i=1;i<rows.length;i++){

          if(normalizePhone(rows[i][2])===phone){

              const salt = generateSalt();

              const hash =
                  hashPassword(
                      data.password,
                      salt
                  );

              sheet.getRange(i+1,4).setValue(hash);

              sheet.getRange(i+1,5).setValue(salt);

              sheet.getRange(i+1,13).setValue(new Date());

              output.setContent(JSON.stringify({

                  success:true,

                  token:issueCustomerSession_(rows[i][0], rows[i][2]),

                  customer:{

                      id:rows[i][0],

                      name:rows[i][1],

                      phone:rows[i][2],

                      email:rows[i][5],

                      address:rows[i][6],

                      landmark:rows[i][7],

                      city:rows[i][8],

                      createdAt:rows[i][11]

                  }

              }));

              return output;

          }

      }

      output.setContent(JSON.stringify({

          success:false

      }));

      return output;

    }

    if(action==="saveAddress"){

      const sheet=
          SpreadsheetApp
              .getActiveSpreadsheet()
              .getSheetByName(ADDRESSES_SHEET);

      const id=
          data.id || "ADD-"+Date.now();

      const rows=
          sheet.getDataRange().getValues();

      if(data.isDefault){

          for(let i=1;i<rows.length;i++){

              if(String(rows[i][1])===String(data.customerId)){

                  sheet
                  .getRange(i+1,9)
                  .setValue(false);

              }

          }

      }

      sheet.appendRow([

          id,

          data.customerId,

          data.title,

          data.receiverName,

          phoneText_(data.phone),

          data.city,

          data.address,

          data.landmark,

          data.isDefault,

          new Date(),

          new Date()

      ]);

      output.setContent(JSON.stringify({

          status:"success"

      }));

      return output;

    }

    if(action==="updateAddress"){

      const sheet=SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(ADDRESSES_SHEET);

      const rows=sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

        if(

          String(rows[i][0])===String(data.id)

          &&

          String(rows[i][1])===String(data.customerId)

        ){

          sheet.getRange(i+1,2,1,8).setValues([[

            data.customerId,

            data.title,

            data.receiverName,

            phoneText_(data.phone),

            data.city,

            data.address,

            data.landmark,

            data.isDefault

          ]]);

          sheet.getRange(i + 1, 11).setValue(new Date());

          break;

        }

      }

    }

    if(action==="deleteAddress"){

      const sheet=SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(ADDRESSES_SHEET);

      const rows=sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

        if(

          String(rows[i][0])===String(data.id)

          &&

          String(rows[i][1])===String(data.customerId)

        ){

          sheet.deleteRow(i+1);

          break;

        }

      }

    }

    if(action==="setDefaultAddress"){

      const sheet=
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(ADDRESSES_SHEET);

      const rows=
          sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(

              String(rows[i][1])===String(data.customerId)

          ){

              sheet
                  .getRange(i+1,9)
                  .setValue(false);

          }

      }

      for(let i=1;i<rows.length;i++){

          if(

              String(rows[i][0])===String(data.id)

              &&

              String(rows[i][1])===String(data.customerId)

          ){

              sheet
                  .getRange(i+1,9)
                  .setValue(true);

              break;

          }

      }

    }

    if(action=="cancelOrder"){

      var ccLock_ = LockService.getScriptLock();
      if (!ccLock_.tryLock(15000)) { output.setContent(JSON.stringify({success:false, message:"النظام مشغول، حاول بعد قليل"})); return output; }
      try {
      const sheet =
      SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(ORDERS_SHEET);

      const rows =
      sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(String(rows[i][0])===String(data.id)){

              if(String(rows[i][14])==="CANCELLED"){

                  output.setContent(JSON.stringify({

                      success:false,

                      message:"تم إلغاء الطلب مسبقاً"

                  }));

                  return output;

              }

              const customerId = rows[i][1];

              const items =
              rows[i][6]
              ? JSON.parse(rows[i][6])
              : [];

              restoreStock(items);

              sheet.getRange(i+1,15).setValue("CANCELLED");

              sheet.getRange(i+1,17).setValue("CANCELLED");

              sheet.getRange(i+1,21).setValue(new Date());

              sheet.getRange(i+1,22).setValue(data.reason || "");

              sheet.getRange(i+1,23).setValue(data.message || "");

              sheet.getRange(i+1,24).setValue(data.admin || "Admin");

              sheet.getRange(i+1,25).setValue(new Date());

              addLog(
                  "ORDER_CANCELLED",
                  data.id
              );

              addNotification(

                  customerId,

                  "تم إلغاء الطلب",

                  data.message || "تم إلغاء الطلب",

                  "order"

              );

              output.setContent(JSON.stringify({

                  success:true

              }));

              return output;

          }

      }

      output.setContent(JSON.stringify({

          success:false

      }));

      return output;

      } finally { ccLock_.releaseLock(); }

    }

    if(action=="updatePaymentStatus"){

      const sheet =
        SpreadsheetApp
        .getActiveSpreadsheet()
        .getSheetByName(ORDERS_SHEET);

      const rows =
        sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(String(rows[i][0])===String(data.id)){

              sheet.getRange(i+1,17).setValue(data.paymentStatus);

              sheet.getRange(i+1,21).setValue(new Date());

              output.setContent(JSON.stringify({
                  success:true
              }));

              return output;

          }

      }

      output.setContent(JSON.stringify({
          success:false
      }));

      return output;

    }

    if(action=="changePassword"){

      const sheet =
        SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(CUSTOMERS_SHEET);

      const rows =
        sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

        if(String(rows[i][0])===String(data.customerId)){

          const oldHash =
            hashPassword(
              data.oldPassword,
              rows[i][4]
            );

          if(oldHash!==rows[i][3]){

            output.setContent(JSON.stringify({

              success:false,

              message:"كلمة المرور الحالية غير صحيحة"

            }));

            return output;

          }

          const newSalt =
            Utilities.getUuid();

          const newHash =
            hashPassword(
              data.newPassword,
              newSalt
            );

          sheet.getRange(i+1,4).setValue(newHash);

          sheet.getRange(i+1,5).setValue(newSalt);

          output.setContent(JSON.stringify({

            success:true

          }));

          return output;

        }

      }

      output.setContent(JSON.stringify({

        success:false,

        message:"الحساب غير موجود"

      }));


      return output;

    }

    if(action=="updateCustomerProfile"){

      const sheet =
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(CUSTOMERS_SHEET);

      const rows =
          sheet.getDataRange().getValues();

      let currentRow = -1;

      for(let i=1;i<rows.length;i++){

          if(String(rows[i][0])===String(data.customerId)){

              currentRow=i+1;
              break;

          }

      }

      if(currentRow==-1){

          output.setContent(JSON.stringify({

              success:false,

              message:"الحساب غير موجود"

          }));

          return output;

      }

      const salt =
          rows[currentRow-1][4];

      const hash =
          hashPassword(data.password,salt);

      if(hash!=rows[currentRow-1][3]){

          output.setContent(JSON.stringify({

              success:false,

              message:"كلمة المرور غير صحيحة"

          }));

          return output;

      }

      for(let i=1;i<rows.length;i++){

          if(

              i!=currentRow-1 &&

              normalizePhone(rows[i][2])==normalizePhone(data.phone)

          ){

              output.setContent(JSON.stringify({

                  success:false,

                  message:"رقم الهاتف مستخدم بالفعل"

              }));

              return output;

          }

      }

      sheet.getRange(currentRow,2).setValue(data.name);

      sheet.getRange(currentRow,3).setValue(phoneText_(data.phone));

      sheet.getRange(currentRow,6).setValue(data.email);

      output.setContent(JSON.stringify({

          success:true

      }));

      return output;

    }

    if(action=="updateOrderStatus"){

      const sheet =
      SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(ORDERS_SHEET);

      const rows =
      sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(rows[i][0]==data.id){

              const oldStatus = rows[i][14];

              sheet.getRange(i+1,15).setValue(data.status);

              sheet.getRange(i+1,21).setValue(new Date());

              addOrderLog(
                data.id,
                oldStatus,
                data.status,
                "تم تغيير الحالة"
              );

              addLog(
                  oldStatus + " → " + data.status,
                  data.id
              );

              addNotification(

                  rows[i][1],

                  "تم تحديث حالة الطلب",

                  "الحالة الجديدة : " + data.status,

                  "order"

              );

              break;

          }

      }

      output.setContent(JSON.stringify({
          success:true
      }));

      return output;

    }

    if(action === "deleteOrder"){

      const sheet =
        SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(ORDERS_SHEET);

      const rows =
        sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

        if(String(rows[i][0])===String(data.id)){

          const delOrderId_ = String(rows[i][0]);
          const delCustomerId_ = String(rows[i][1] || "");
          const delTotal_ = Number(rows[i][13]) || 0;

          try {
            const oiSheet_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("OrderItems");
            if (oiSheet_) {
              const oiRows_ = oiSheet_.getDataRange().getValues();
              for (let j = oiRows_.length - 1; j >= 1; j--) {
                if (String(oiRows_[j][1]) === delOrderId_) {
                  oiSheet_.deleteRow(j + 1);
                }
              }
            }
          } catch (oiErr_) {}

          try {
            if (delCustomerId_) {
              const custSheet_ = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CUSTOMERS_SHEET);
              const cRows_ = custSheet_.getDataRange().getValues();
              for (let k = 1; k < cRows_.length; k++) {
                if (String(cRows_[k][0]) === delCustomerId_) {
                  const oc_ = Number(cRows_[k][9]) || 0;
                  const ts_ = Number(cRows_[k][10]) || 0;
                  custSheet_.getRange(k + 1, 10).setValue(Math.max(0, oc_ - 1));
                  custSheet_.getRange(k + 1, 11).setValue(Math.max(0, ts_ - delTotal_));
                  break;
                }
              }
            }
          } catch (custErr_) {}

          sheet.deleteRow(i+1);

          output.setContent(JSON.stringify({
            success:true
          }));

          return output;

        }

      }

      output.setContent(JSON.stringify({
        success:false
      }));

      return output;

    }

    if(action==="addFavorite"){

      const sheet =
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(FAVORITES_SHEET);

      const rows =
          sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(

              String(rows[i][1])===String(data.customerId)

              &&

              String(rows[i][2])===String(data.productId)

          ){

              output.setContent(JSON.stringify({
                  success:true
              }));

              return output;

          }

      }

      sheet.appendRow([

          "FAV-"+Date.now(),

          data.customerId,

          data.productId,

          new Date()

      ]);

      output.setContent(JSON.stringify({

          success:true

      }));

      return output;

    }

    if(action==="removeFavorite"){

      const sheet =
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(FAVORITES_SHEET);

      const rows =
          sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(

              String(rows[i][1])===String(data.customerId)

              &&

              String(rows[i][2])===String(data.productId)

          ){

              sheet.deleteRow(i+1);

              break;

          }

      }

      output.setContent(JSON.stringify({

          success:true

      }));

      return output;

    }

    if(action=="markNotificationsRead"){

      const sheet =
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(NOTIFICATIONS_SHEET);

      const rows =
          sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(

              String(rows[i][1])==String(data.customerId)

              ||

              String(rows[i][1])=="ALL"

          ){

              sheet.getRange(i+1,6).setValue(true);

          }

      }

      output.setContent(JSON.stringify({

          success:true

      }));

      return output;

    }

    if(action=="saveCoupon"){

      const sheet=
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(COUPONS_SHEET);

      sheet.appendRow([

          "CP-"+Date.now(),

          data.code,

          data.type,

          data.value,

          data.minOrder,

          data.expireDate,

          data.usageLimit,

          data.perCustomer,

          data.targetCustomer,

          true

      ]);

      output.setContent(JSON.stringify({

          success:true

      }));

      return output;

    }

    if(action=="deleteCoupon"){

      const sheet=
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(COUPONS_SHEET);

      const rows=
          sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(String(rows[i][0])==String(data.id)){

              sheet.deleteRow(i+1);

              break;

          }

      }

      output.setContent(JSON.stringify({

          success:true

      }));

      return output;

    }

    if(action=="toggleCoupon"){

      const sheet=
          SpreadsheetApp
          .getActiveSpreadsheet()
          .getSheetByName(COUPONS_SHEET);

      const rows=
          sheet.getDataRange().getValues();

      for(let i=1;i<rows.length;i++){

          if(String(rows[i][0])==String(data.id)){

              sheet
              .getRange(i+1,10)
              .setValue(data.active);

              break;

          }

      }

      output.setContent(JSON.stringify({

          success:true

      }));

      return output;

    }

    // إضافة
    if (action === "add") {
      sheet.appendRow([
        Date.now(),
        data.name,
        data.price,
        data.discount,
        data.stock,
        data.imageUrl, // الرابط الجاهز القادم من ImgBB
        JSON.stringify(data.images || []),
        data.category,
        data.description
      ]);
    }

    // تعديل
    if (action === "update") {
      const rows = sheet.getDataRange().getValues();

      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(data.id)) {
          sheet.getRange(i + 1, 2, 1, 9).setValues([[
            data.name,
            data.price,
            data.discount,
            data.stock,
            data.imageUrl || rows[i][5], 
            JSON.stringify(data.images || []),
            data.category,
            data.description,
            (data.sold !== undefined && data.sold !== "") ? Number(data.sold) : rows[i][9]
          ]]);
          break;
        }
      }
    }

      // حذف مجموعة منتجات
    if (action === "deleteMultiple") {

      const ids = data.ids || [];

      const rows = sheet.getDataRange().getValues();

      const rowsToDelete = [];

      for (let i = 1; i < rows.length; i++) {

        if (ids.includes(String(rows[i][0]))) {

          rowsToDelete.push(i + 1);

        }

      }

      // نحذف من آخر صف لأول صف حتى لا تتغير أرقام الصفوف
      rowsToDelete.reverse().forEach(row => {

        sheet.deleteRow(row);

      });

    }

    // حذف
    if (action === "delete") {
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === String(data.id)) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
    }

    output.setContent(JSON.stringify({ status: "success" }));
  } catch (error) {
    output.setContent(JSON.stringify({ status: "error", message: error.toString() }));
  }

  return output;
}

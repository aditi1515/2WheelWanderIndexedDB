const detailsContainer = document.querySelector(".details");
const ongoingTable = document.querySelector(".ongoing-table");
const activeTable = document.querySelector(".active-table");
const passiveTable = document.querySelector(".passive-table");
const changePassBtn = document.querySelector(".change-password");
const changePassDialog = document.querySelector("#changePass-dialog");
const currPass = document.querySelector("#curr-pass");
const newPass = document.querySelector("#new-pass");
const confirmNewPass = document.querySelector("#confirm-new-pass");
const passChangeBtn = document.querySelector(".pass-change");
const cancelChangeBtn = document.querySelector(".pass-cancel");
const passChangeForm = document.querySelector(".pass-container");
const passChangeSnackbar = document.querySelector("#passChange-snackbar");
const profileInfoContainer = document.querySelector(".profileInfo-container");
const dialog = document.querySelector("#cancel-confirm-dialog")
window.addEventListener("load", () => {
 const currUser = JSON.parse(localStorage.getItem("currUser"));

 if (currUser === null) {
  window.location = "./index.html";
 }


 if (currUser.role === "admin") {
  profileInfoContainer.style.display = "none";
 } else {
  profileInfoContainer.style.display = "block";
 }
});

//change password button
changePassBtn.addEventListener("click", () => {
 changePassDialog.show();
 passChangeForm.reset();
 resetError();
});
newPass.addEventListener("blur", passwordValidation);

//submit pass change form
passChangeForm.addEventListener("submit", (e) => {
 e.preventDefault();
 resetError();
 passwordValidation();
 validateInputs(newPass.value);
});

//validate inputs of form
function validateInputs(newPass) {
 const errorMessageMap = new Map();
 const currUser = JSON.parse(localStorage.getItem("currUser"));

 openDatabase()
  .then((db) => {
   return getObjectById(db, "users", currUser.userId);
  })
  .then((user) => {
   //password
   const currPassMess = [];

   if (currPass.value === "") {
    currPassMess.push("Password Required");
    errorMessageMap.set(currPass, currPassMess);
   } else if (currPass.value !== user.password) {
    currPassMess.push("Incorrect Password");
    errorMessageMap.set(currPass, currPassMess);
   }
   //confirm password check

   if (newPass !== confirmNewPass.value) {
    const confirmPassMess = [];
    confirmPassMess.push("Password does not match");
    errorMessageMap.set(confirmNewPass, confirmPassMess);
   }

   setError(errorMessageMap);

   if (errorMessageMap.size === 0) {
    user.password = newPass;
    // user.updatedAt = new Date().toISOString();
    // user.updatedBy = JSON.parse(localStorage.getItem("currUser"))?.userId,
    openDatabase()
     .then((db) => {
      return addToObjectStore(db, "users", user);
     })
     .then(() => {
      showSnackbar("Password changed successfully", 2000);
      changePassDialog.close();
     })
     .catch((err) => {
      console.log("Error in updating user in object store", err);
     });
   }
  })
  .catch((err) => {
   console.log("Error in changing user password: " + err);
  });

 // if (errorMessageMap.size === 0) {
 //   filterUser[0].password = newPass;

 //   for (const user of users) {
 //     if (user.userId === currUser.userId) {
 //       user.password = newPass;
 //       localStorage.setItem("users", JSON.stringify(users));
 //       showSnackbar("Password changed successfully", 2000);
 //       changePassDialog.close();
 //     }
 //   }
 // }
}

//validate new password
function passwordValidation() {
 const passVal = newPass.value;
 const errMessArr = [];
 if (!/[A-Z]/.test(passVal)) {
  errMessArr.push("Password must include at least one uppercase letter");
 }

 // Check if the password includes at least one lowercase letter
 if (!/[a-z]/.test(passVal)) {
  errMessArr.push("Password must include at least one lowercase letter");
 }

 // Check if the password includes at least one number
 if (!/\d/.test(passVal)) {
  errMessArr.push("Password must include at least one number");
 }

 // Check if the password includes at least one special character
 if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(passVal)) {
  errMessArr.push("Password must include at least one special character");
 }

 // Check if the password meets the overall length requirement
 if (passVal.length < 8) {
  errMessArr.push("Password must be at least 8 characters long");
 }

 const errorMessages = new Map();
 errorMessages.set(newPass, errMessArr);

 setError(errorMessages);
}

//set error messages in form
function setError(errorMessages) {
 errorMessages.forEach((messArr, element) => {
  const errorListElement = document.createElement("ul");
  for (const mess of messArr) {
   const listElement = document.createElement("li");
   listElement.innerText = mess;
   errorListElement.appendChild(listElement);
  }
  // console.log(messArr, element);
  const inputField = element.parentElement;
  // console.log(inputField);
  const errorDisplay = inputField.querySelector(".error");
  errorDisplay.innerText = "";
  errorDisplay.appendChild(errorListElement);
  // console.log(errorListElement);
 });
}
//reset errors
function resetError() {
 const allErrorElements = document.querySelectorAll(".error");
 allErrorElements.forEach((element) => {
  element.innerHTML = "";
 });
}

cancelChangeBtn.addEventListener("click", () => {
 changePassDialog.close();
});
window.addEventListener("load", () => {
 const currUser = JSON.parse(localStorage.getItem("currUser"));
 if (currUser) {
  const nameTag = document.createElement("h3");
  nameTag.innerHTML = ` Name : ${currUser.fname} ${currUser.lname}`;
  detailsContainer.appendChild(nameTag);
  const phoneTag = document.createElement("h3");
  phoneTag.innerHTML = `Phone Number : ${currUser.mobile}`;
  detailsContainer.appendChild(phoneTag);
  const emailTag = document.createElement("h3");
  emailTag.innerHTML = `Email : ${currUser.email} `;
  detailsContainer.appendChild(emailTag);
 }
 // console.log(currUser);
});
// window.onload = setProfileDetails;

//view user orders

//prepare order data function

function prepareOrderData() {
 // const orders = JSON.parse(localStorage.getItem("orders"));

 const currUser = JSON.parse(localStorage.getItem("currUser"));

 openDatabase()
  .then((db) => {
   console.log("Database loaded successfully");
   return conditionedIndexing(
    db,
    "Bookings",
    "orderIndex",
    currUser.userId,
    currUser.userId
   );
  })
  .then((userOrders) => {
   //categorize orders on basis of date
   console.log("userOrders", userOrders);
   const categorizedOrders = userOrders.reduce(
    (acc, order) => {
     const currDate = new Date();
     const endDateTime = new Date(order.end_date + "T" + order.end_time);
     const startDateTime = new Date(order.start_date + "T" + order.start_time);
     console.log(currDate);
     if (endDateTime < currDate) {
      //order has ended
      acc.passiveOrders.push(order);
     } else if (startDateTime <= currDate && endDateTime >= currDate) {
      //order is ongoing
      acc.ongoingOrders.push(order);
     } else {
      //future orders
      acc.activeOrders.push(order);
     }
     return acc;
    },

    {
     ongoingOrders: [],
     activeOrders: [],
     passiveOrders: [],
    }
   );
   console.log("categorizedOrders", categorizedOrders);
   for (const ongoingOrder of categorizedOrders.ongoingOrders) {
    const row = document.createElement("tr");
    row.innerHTML = `
     <td>${ongoingOrder.vehicleBrand} ${ongoingOrder.vehicleModel}</td>
     <td>${ongoingOrder.vehicleType}</td>
     <td>${ongoingOrder.location}</td>
     <td>${ongoingOrder.start_date} , ${ongoingOrder.start_time}</td>
     <td>${ongoingOrder.end_date} ,  ${ongoingOrder.end_time}</td>
    
     <td>ongoing</td>
   `;
    ongoingTable.appendChild(row);
   }
   for (const activeOrder of categorizedOrders.activeOrders) {

    const row = document.createElement("tr");
      row.innerHTML = `
      <td>${activeOrder.vehicleBrand} ${activeOrder.vehicleModel}</td>
      
      <td>${activeOrder.vehicleType}</td>
      <td>${activeOrder.location}</td>
      <td>${activeOrder.start_date} , ${activeOrder.start_time}</td>
      <td>${activeOrder.end_date} ,  ${activeOrder.end_time}</td>
     
      <td><button class="active-cancel-btn" onClick="deleteOrderdialog(event)" orderId=${activeOrder.orderId} vehicleId = ${activeOrder.vehicleId}>Cancel</button></td>
    `;
      activeTable.appendChild(row);
    
   }
  //  addEventListenerToCnclBtns();
   for (const passiveOrder of categorizedOrders.passiveOrders) {
    const row = document.createElement("tr");
      row.innerHTML = `
      <td>${passiveOrder.vehicleBrand} ${passiveOrder.vehicleModel}</td>
      
      <td>${passiveOrder.vehicleType}</td>
      <td>${passiveOrder.location}</td>
      <td>${passiveOrder.start_date} , ${passiveOrder.start_time}</td>
      <td>${passiveOrder.end_date} ,  ${passiveOrder.end_time}</td>
      
      <td>completed </td>
    `;
      passiveTable.appendChild(row);

    // const userOrders = orders.filter((order) => order.userId === currUser.userId);
   }
  });
}

prepareOrderData();

function getVehicleDetails(vehicleId) {
 return openDatabase()
  .then((db) => {
   return getObjectById(db, "vehicles", vehicleId);
  })
  .then((vehicle) => {
   return vehicle;
  });
}


function deleteOrderdialog(event) {
  const orderId = event.target.getAttribute("orderId");
  dialog.innerHTML = `
   <div class="delete-dialog">
   <p>Are you sure you want to delete this Booking?</p>
   <div class = 'deleteDialog-btn-container'><button class="delete-btn" orderId = ${orderId}>Delete</button>
   <button class="cancel-btn">Cancel</button></div>
   
   </div>
   `;
  dialog.style.marginTop = "15rem";
  dialog.show();
  const deleteBtn = document.querySelector(".delete-btn");
  const cancelBtn = document.querySelector(".cancel-btn");
  deleteBtn.addEventListener("click", () => {
    deleteOrderById(event);
   dialog.close();
  });
  cancelBtn.addEventListener("click", () => {
   dialog.close();
  });
 }

 function deleteOrderById(event) {
  console.log(event.target);
  openDatabase()
   .then((db) => {
    console.log("Database opened successfully", db);
    const orderId = event.target.getAttribute("orderId");
    return deleteObject(db, "Bookings", orderId);
   })
   .then(() => {
    showSnackbar("Order Deleted Successfully", 2000);
    window.location.reload();
   });
 
  //  const vehicles = JSON.parse(localStorage.getItem("vehicles")) || [];
  //  const updatedVehicles = vehicles.filter((vehicle) => {
  //   return vehicle.vId !== vehicleId;
  //  });
  //  localStorage.setItem("vehicles", JSON.stringify(updatedVehicles));
 }

function addEventListenerToCnclBtns() {
 const activeOrderCancelBtn = document.querySelectorAll(".active-cancel-btn");

 for (const cancelBtn of activeOrderCancelBtn) {
  console.log(cancelBtn);
  cancelBtn.addEventListener("click", () => {
   const orderId = cancelBtn.getAttribute("orderId");
   const vehicleId = cancelBtn.getAttribute("vehicleId");
   openDatabase()
    .then((db) => {
     console.log("Db opened successully", db);
     return getObjectById(db, "vehicles", vehicleId);
    })
    .then((vehicle) => {
     openDatabase()
      .then((db) => {
       let orderIds = vehicle.orderIds;
       console.log(orderIds);
       vehicle.orderIds = orderIds.filter((oId) => orderId !== oId);
       console.log(vehicle);
       return addToObjectStore(db, "vehicles", vehicle);
      })
      .catch((err) => {
       console.log("Error in deleteing orderIds", err);
      });
    })
    .then(() => {
     openDatabase()
      .then((db) => {
       return deleteObject(db, "Bookings", orderId);
      })

      .catch((err) => {
       console.log("Error in deleting order from bookings object store", err);
      });
    })
    .catch((err) => {
     console.log("Error in cancelling order", err);
    })
    .finally(() => {
     window.location.reload();
    });
   // const orders = JSON.parse(localStorage.getItem("orders"));
   // const canceledOrder = orders.filter((order) => order.orderId === orderId);
   // const otherOrders = orders.filter((order) => order.orderId !== orderId);
   // const vehicles = JSON.parse(localStorage.getItem("vehicles"));
   // vehicles.forEach((vehicle) => {
   //   if (vehicle.vId === canceledOrder[0].vehicleId) {
   //     vehicle.orderIds = vehicle.orderIds.filter((orderId) => {
   //       return orderId !== canceledOrder[0].orderId;
   //     });
   //   }
   // });
   // localStorage.setItem("vehicles", JSON.stringify(vehicles));
   // localStorage.setItem("orders", JSON.stringify(otherOrders));
  });
 }
}
//snackbar
function showSnackbar(message, timeout = 3000) {
 passChangeSnackbar.className = "show";
 passChangeSnackbar.textContent = message;
 setTimeout(function () {
  passChangeSnackbar.className = passChangeSnackbar.className.replace(
   "show",
   ""
  );
 }, timeout);
}

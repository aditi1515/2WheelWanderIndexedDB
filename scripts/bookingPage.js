const selectLocation = document.querySelector(".locationSelect");
const vehicleCardContainer = document.querySelector(".vehicles-card-container");
const dialog = document.getElementById("displayBooking-dialog");
const startDateTimeInput = document.querySelector("#start-date-time");
const endtDateTimeInput = document.querySelector("#end-date-time");
const locationInput = document.querySelector("#locationSelectFilter");

const bookingPageDatesSnackbar = document.querySelector(
 "#bookingPage-dates-snackbar"
);
//set locations in select
window.addEventListener("load", () => {
 openDatabase()
  .then((db) => {
   return getAllFromObjectStore(db, "locations");
  })
  .then((locationsArr) => {
   for (let i = 0; i < locationsArr.length; i++) {
    let opt = locationsArr[i];

    let el = document.createElement("option");
    el.textContent = opt.city;
    el.value = opt.city;
    selectLocation.appendChild(el);
   }
   filterOptionSearchParams();
  })
  .catch((err) => {
   console.log("Error in select menu: " + err.message);
  });
});

//create values from params
function filterOptionSearchParams() {
 const searchParams = new URLSearchParams(window.location.search);
 let location = searchParams.get("locationSelect");
 let startDateTime = searchParams.get("start-date");
 let endDateTime = searchParams.get("end-date");
 let redirection = false;

 if (location == null || location === "" || location === undefined) {
  location = "Mumbai";
  redirection = true;
 }

 let currentDate = new Date();
 currentDate.setSeconds(0);
 currentDate.setMilliseconds(0);
 let startDateTimeInFormat = new Date(startDateTime);
 if (!startDateTime || !endDateTime || startDateTimeInFormat < currentDate) {
  redirection = true;
  startDateTime = getCurrentDateTimeString();
  endDateTime = getThirtyMinutesAhead();
 }

 if (redirection) {
  const redirectURLForBooking = `http://127.0.0.1:5500/bookingPage.html?locationSelect=${location}&start-date=${startDateTime}&end-date=${endDateTime}`;
  window.location.replace(redirectURLForBooking);
 }

 const filterOptions = {
  location: location,
  start_date: startDateTime.split("T")[0],
  end_date: endDateTime.split("T")[0],
  start_time: startDateTime.split("T")[1],
  end_time: endDateTime.split("T")[1],
 };

 prePopulateForm(location, startDateTime, endDateTime);
 filterVehicles(filterOptions, startDateTime, endDateTime);
}
function getCurrentDateTimeString() {
 const now = new Date();
 const year = now.getFullYear();
 const month = String(now.getMonth() + 1).padStart(2, "0");
 const day = String(now.getDate()).padStart(2, "0");
 const hour = String(now.getHours()).padStart(2, "0");
 const minute = String(now.getMinutes()).padStart(2, "0");
 return `${year}-${month}-${day}T${hour}:${minute}`;
}
function getThirtyMinutesAhead() {
 const now = new Date();
 const thirtyMinutesLater = new Date(now.getTime() + 30 * 60000); // 30 minutes in milliseconds
 const year = thirtyMinutesLater.getFullYear();
 const month = String(thirtyMinutesLater.getMonth() + 1).padStart(2, "0");
 const day = String(thirtyMinutesLater.getDate()).padStart(2, "0");
 const hour = String(thirtyMinutesLater.getHours()).padStart(2, "0");
 const minute = String(thirtyMinutesLater.getMinutes()).padStart(2, "0");
 return `${year}-${month}-${day}T${hour}:${minute}`;
}

function validateAndRedirect(event) {
 event.preventDefault();
 // Get form elements
 const locationSelect = document.querySelector(".locationSelect");
 const startDateInput = document.getElementById("start-date-time");
 const endDateInput = document.getElementById("end-date-time");

 // Validate location
 if (locationSelect.value === "") {
  bookingPageSnackbar("Please select a city", 2000);
  return false;
 }

 // Validate if dates are empty
 if (startDateInput.value === "" || endDateInput.value === "") {
  bookingPageSnackbar("Please select a valid date range", 2000);
  return false;
 }

 // Validate date and time
 const startDate = new Date(startDateInput.value);
 const endDate = new Date(endDateInput.value);

 // Validate if start date is in the past
 const bufferTime = 1 * 60 * 1000; // 1 minute in milliseconds

 if (startDate < new Date() - bufferTime || endDate < new Date() - bufferTime) {
  bookingPageSnackbar("Dates must not be  in the past", 2000);
  return false;
 }

 // Validate if end date is at least 1 hour ahead of start date
 const minDifference = 1 * 30 * 60 * 1000; // 1 hour in milliseconds
 if (endDate < startDate) {
  bookingPageSnackbar("Enter Valid Dates", 2000);
  return false;
 } else if (endDate - startDate < minDifference) {
  bookingPageSnackbar(
   "Minimum duration between start and end date should be 30mins",
   2000
  );
  return false;
 }

 // Construct the URL for redirection
 const redirectURL = `http://127.0.0.1:5500/bookingPage.html?locationSelect=${encodeURIComponent(
  locationSelect.value
 )}&start-date=${encodeURIComponent(
  startDateInput.value
 )}&end-date=${encodeURIComponent(endDateInput.value)}`;

 // Redirect to the new URL
 window.location.replace(redirectURL);
}

//filter vehicle on basis of location
function filterVehicles(filterOptions, startDateTime, endDateTime) {
 // const vehicles = JSON.parse(localStorage.getItem("vehicles"));
 // const locationFilteredVehicles = vehicles.filter((vehicle) => {
 //   return vehicle.location === filterOptions.location;
 // });

 openDatabase()
  .then((db) => {
   return conditionedIndexing(
    db,
    "vehicles",
    "vehicleLocationIndex",
    filterOptions.location,
    filterOptions.location
   );
  })
  .then((locationFilteredVehicles) => {
   checkVehicleAVailability(
    locationFilteredVehicles,
    filterOptions,
    startDateTime,
    endDateTime
   );
  });
}

function getOrdersForVehicle(vehicleId) {
 return openDatabase()
  .then((db) => {
   return new Promise((resolve, reject) => {
    const transaction = db.transaction("Bookings", "readonly");
    const bookingsStore = transaction.objectStore("Bookings");
    const index = bookingsStore.index("vehicleIndex");
    const range = IDBKeyRange.only(vehicleId);
    const getRequest = index.getAll(range);

    getRequest.onsuccess = function (event) {
     const orders = event.target.result;
     console.log("Orders for vehicle: ", orders);
     resolve(orders);
    };

    getRequest.onerror = function (event) {
     console.log("Error fetching orders for vehicle: " + event.target.error);
     reject(event.target.error);
    };
   });
  })
  .catch((error) => {
   console.error("Error opening database: ", error);
   throw error;
  });
}

//check for the availability of vehicle
function checkVehicleAVailability(
 vehicles,
 filterOptions,
 startDateTime,
 endDateTime
) {
 openDatabase()
  .then((db) => {
   const finalAvailableVehicles = [];
   const vehiclePromises = vehicles.map((vehicle) => {
    return getOrdersForVehicle(vehicle.vId).then(function (orders) {
     console.log("orders in check availability: ", orders);
     if (orders.length === 0) {
      finalAvailableVehicles.push(vehicle);
      return; // Return early if no orders exist for this vehicle
     }
     let isThisVehicleAvailable = true; // Initialize the variable here

     orders.forEach((order) => {
      if (order === undefined) {
       console.warn("Order is undefined");
      } else {
       const overLapResult = isOverlap(filterOptions, order);
       isThisVehicleAvailable = isThisVehicleAvailable && !overLapResult; // Correct usage of logical AND
      }
     });
     // Use Promise.all to wait for all order promises to resolve for a vehicle
     if (isThisVehicleAvailable) {
      finalAvailableVehicles.push(vehicle);
     }
    });
   });
   // Use Promise.all to wait for all promises for all vehicles to resolve
   return Promise.all(vehiclePromises).then(() => finalAvailableVehicles);
  })
  .then((finalAvailableVehicles) => {
   const amountForVehicles = calculateRentAmount(
    finalAvailableVehicles,
    startDateTime,
    endDateTime
   );
   return { finalAvailableVehicles, amountForVehicles };
  })
  .then(({ finalAvailableVehicles, amountForVehicles }) => {
   console.log(finalAvailableVehicles);
   displayVehicles(finalAvailableVehicles, amountForVehicles);
  })
  .catch((err) => {
   console.log("Error in checking vehicle availability:", err);
  });
}

//to check start and end booking time and date  for availability
function isOverlap(filterOption, order) {
 const filterStart = new Date(
  `${filterOption.start_date}T${filterOption.start_time}`
 );
 const filterEnd = new Date(
  `${filterOption.end_date}T${filterOption.end_time}`
 );
 const orderStart = new Date(`${order.start_date}T${order.start_time}`);
 const orderEnd = new Date(`${order.end_date}T${order.end_time}`);

 return filterStart < orderEnd && filterEnd > orderStart;
}

// to get each ordr based on order id
function getOrder(orderId) {
 const allOrders = JSON.parse(localStorage.getItem("orders")) || [];

 const order = allOrders.filter((order) => order.orderId === orderId);
 return order[0];
}

// to calculate cost
function calculateRentAmount(
 finalAvailableVehicles,
 startDateTime,
 endDateTime
) {
 const hours = calculateHoursBetweenDates(startDateTime, endDateTime);
 for (const vehicle of finalAvailableVehicles) {
  const hourlyDayPrice = vehicle.priceHour;
  const hourlyNightPrice = vehicle.nightPrice;

  const vehicleAmount = calculateEachVehiclePrice(
   hourlyDayPrice,
   hourlyNightPrice,
   hours.morningHours,
   hours.nightHours
  );
  vehicle.amount = vehicleAmount;
  vehicle.startDateTime = startDateTime;
  vehicle.endDateTime = endDateTime;
 }
}

//calculate price for each vehicle
function calculateEachVehiclePrice(
 hourlyDayPrice,
 hourlyNightPrice,
 morningHours,
 nightHours
) {
 // console.log(hourlyDayPrice, hourlyNightPrice, morningHours, nightHours);
 const totalAmount =
  hourlyDayPrice * morningHours + hourlyNightPrice * nightHours;
 // console.log(totalAmount.toFixed(2));
 return totalAmount.toFixed(2);
}

//hours difference
function calculateHoursBetweenDates(dateTime1, dateTime2) {
 const date1 = new Date(dateTime1);
 const date2 = new Date(dateTime2);

 const isBetween6AMand10PM = (date) => {
  const hours = date.getHours();
  return hours >= 6 && hours < 22;
 };

 const isBetween10PMand6AM = (date) => {
  const hours = date.getHours();
  return hours >= 22 || hours < 6;
 };

 let hoursInPeriod1 = 0;
 let hoursInPeriod2 = 0;

 // Calculate the difference in minutes
 const minutesDifference = (date2 - date1) / (1000 * 60);

 // Iterate through each minute and calculate hours for each time period
 for (let i = 0; i < minutesDifference; i++) {
  const currentMinute = i;
  const currentHour = new Date(date1.getTime() + currentMinute * 60 * 1000);

  if (isBetween6AMand10PM(currentHour)) {
   hoursInPeriod1 += 1 / 60; // Increment by 1 minute
  } else if (isBetween10PMand6AM(currentHour)) {
   hoursInPeriod2 += 1 / 60; // Increment by 1 minute
  }
 }

 // Round the result to 2 decimal places
 // hoursInPeriod1 = Math.round(hoursInPeriod1 * 100) / 100;
 // hoursInPeriod2 = Math.round(hoursInPeriod2 * 100) / 100;

 return { morningHours: hoursInPeriod1, nightHours: hoursInPeriod2 };
}

//display vehicles card

function displayVehicles(vehicles, amountForVehicles) {
 for (const vehicle of vehicles) {
  const div = document.createElement("div");
  div.classList.add("vehicle-card");
  div.innerHTML = ` 
    <div class="imgHeading-container">  <div ><img src="${
     vehicle.vimg
    }"/></div> <p>${vehicle.vbrand + " "}  ${vehicle.vmodel}</p></div>
   
  
    <div class="price-container">
      <div class="price1"><p>Rs ${vehicle.priceHour}/hr</p>  <p>Rs ${
   vehicle.nightPrice
  }/hr <span>(10pm-6am)</span></p></div>
  
      <div class="price2">
        <p>Total amt : </p>
        <span>Rs ${vehicle.amount}</span>
       
      </div>
    </div>
    <button class='bookNow-btn' vehicledetail=${JSON.stringify(
     removeSpaceFromObjectField(vehicle)
    )}
      >Book Now</button>
  `;
  vehicleCardContainer.appendChild(div);
 }

 addEventListenerToBookBtns();
}

//remove space from image field in vehicle object
function removeSpaceFromObjectField(object) {
 for (let key in object) {
  if (typeof object[key] === "string") {
   object[key] = object[key].replace(/\s/g, "_"); // Replace spaces with underscores
  }
 }
 return object;
}

function restoreSpacesInObject(obj) {
 for (let key in obj) {
  if (typeof obj[key] === "string") {
   obj[key] = obj[key].replace(/_/g, " "); // Replace underscores with spaces
  }
 }
 return obj;
}

//to prefill form
function prePopulateForm(location, startDateTime, endDateTime) {
 // for (let i = 0; i < locationInput.options.length; i++) {
 //   if (locationInput.options[i].value === value) {
 //     locationInput.selectedIndex = i;
 //   }
 // }

 locationInput.value = location;
 startDateTimeInput.value = startDateTime;
 endtDateTimeInput.value = endDateTime;
}
//check authentication
function checkUserAuthentication() {
 const currUser = localStorage.getItem("currUser");

 if (currUser === null) {
  const redirectURL = window.location.href;

  localStorage.setItem("redirectURL", redirectURL);
  window.location = "./signin.html";
  // window.location.replace(
  //  redirectURL
  // );
 }
}

function addEventListenerToBookBtns() {
 // do not search bookNowBtns outside as they are not rendered in start they will be rendered when filter function run

 const bookNowBtns = document.querySelectorAll(".bookNow-btn");

 for (const btn of bookNowBtns) {
  btn.addEventListener("click", () => {
   checkUserAuthentication();
   let vehicleString = btn.getAttribute("vehicledetail");
   let vehicle = JSON.parse(vehicleString);
   vehicle = restoreSpacesInObject(vehicle);
   const startDT = vehicle.startDateTime.split("T");
   const endDT = vehicle.endDateTime.split("T");
   const startDate = startDT[0];
   const startTime = startDT[1];
   const endDate = endDT[0];
   const endTime = endDT[1];
   dialog.innerHTML = `
        <div class="displayBooking-order">
          <h2>Welcome to <span>2WheelWander</span></h2>
          <div class="orderImg-container">
             <div class="image"><img src="${vehicle.vimg}"></div>

          <p>${vehicle.vbrand} ${vehicle.vmodel}</p></div>
          <div class="dateTime-container"><p>Pickup Date :${startDate} ,${startTime}</p>
          <p>Dropoff Date : ${endDate} ,${endTime}</p></div>
          <p>Total Amount : ${vehicle.amount}</p>
          <div class="btn-container">
            <button class="confirm-btn" vehicledetail=${JSON.stringify(
             removeSpaceFromObjectField(vehicle)
            )}>Confirm</button>
            <button class="cancel-btn" onClick="closeDialog()">Cancel</button>
          </div>`;

   dialog.show();
   createOrder();
  });
 }
}

function closeDialog() {
 console.log(dialog);
 dialog.close();
}

//to create a new order

function createOrder() {
 const confirmBtns = document.querySelectorAll(".confirm-btn");

 for (const btn of confirmBtns) {
  btn.addEventListener("click", () => {
   let vehicleString = btn.getAttribute("vehicleDetail");
   let vehicle = restoreSpacesInObject(JSON.parse(vehicleString));
   console.log("vehicleDetail: " + vehicle);
   // const orders = JSON.parse(localStorage.getItem("orders")) || [];
   const order = {
    orderId: generateOrderID(),
    orderGenerateDate: new Date(),
    userId: JSON.parse(localStorage.getItem("currUser")).userId,
    vehicleId: vehicle.vId,
    vehicleBrand: vehicle.vbrand,
    vehicleModel: vehicle.vmodel,
    vehicleType: vehicle.vType,
    location: vehicle.location,
    cost: vehicle.amount,
    start_date: vehicle.startDateTime.split("T")[0],
    start_time: vehicle.startDateTime.split("T")[1],
    end_date: vehicle.endDateTime.split("T")[0],
    end_time: vehicle.endDateTime.split("T")[1],
   };

   openDatabase()
    .then(function (db) {
     addToObjectStore(db, "Bookings", order);
    })
    .then(() => {
     showSnackbar();
     setTimeout(() => {
      window.location.replace("./index.html");
     }, 3000);
    })
    .catch((err) => {
     console.log("Error in adding in bookings objectstore: " + err);
    });
  });

  // localStorage.setItem("orders", JSON.stringify(orders));
 }
}
//add order id in vechcicle
function addVehicle(db, order) {
 // Declare db at a higher scope

 return openDatabase()
  .then(() => {
   const vehicleId = order.vehicleId;

   return getObjectById(db, "vehicles", vehicleId);
  })
  .then((vehicle) => {
   const orderIds = vehicle.orderIds;

   orderIds.push(order.orderId);

   vehicle.orderIds = orderIds;

   return addToObjectStore(db, "vehicles", vehicle);
  })
  .catch((err) => {
   console.log("Error in adding vehicle to vehicleObject: ", err);
  });
 // const vehicles = JSON.parse(localStorage.getItem("vehicles"));
 // const vehicleArr = vehicles.filter((vehicle) => vehicle.vId === vehicleId);
 // const vehicle = vehicleArr[0];

 // vehicle.orderIds.push(order.orderId);
 // localStorage.setItem("vehicles", JSON.stringify(vehicles));
 // console.log(JSON.parse(localStorage.getItem("vehicles")));
}
//order ID
function generateOrderID() {
 const dateString = Date.now().toString(36);
 const randomness = Math.random().toString(36).substring(2);
 return dateString + randomness;
}
//snackbar
function showSnackbar() {
 // Get the snackbar DIV

 // Add the "show" class to DIV
 snackbar.className = "show";

 // After 3 seconds, remove the show class from DIV
 setTimeout(function () {
  snackbar.className = snackbar.className.replace("show", "");
 }, 3000);
}

//snackbar
function bookingPageSnackbar(message, timeout = 3000) {
 bookingPageDatesSnackbar.className = "show";
 bookingPageDatesSnackbar.textContent = message;
 setTimeout(function () {
  bookingPageDatesSnackbar.className =
   bookingPageDatesSnackbar.className.replace("show", "");
 }, timeout);
}

const vehicleFormDialog = document.querySelector("#vehicleForm-dialog");
const vehicleForm = document.querySelector(".vehicle-form-container-main");
const editVehicleForm = document.querySelector("#displayBooking-dialog");
const addVehicleBtn = document.querySelector(".addVehicle-btn");
const vehicleFormSubmit = document.querySelector(".submit-btn-form");
const closeFormButton = document.querySelector(".closeForm-btn");
const snackbar = document.querySelector("#snackbar");

const vType = document.getElementsByName("radio-group");
const vbrand = document.querySelector("#vbrand");
const vmodel = document.querySelector("#vmodel");
const vnum = document.querySelector("#vnum");
const vimg = document.querySelector("#vimg");
const selectLocation = document.querySelector(".locationSelect");
const priceHourly = document.querySelector("#price");
const nightPrice = document.querySelector("#nightPrice");
// const availability = document.querySelector("#availability");

//to check authentication
window.addEventListener("load", () => {
 const currUser = JSON.parse(localStorage.getItem("currUser"));

 if (currUser === null || currUser.role !== "admin") {
  window.location = "./index.html";
 }
});

//show dialog form

addVehicleBtn.addEventListener("click", () => {
 if (editVehicleForm) editVehicleForm.close();
 vehicleFormDialog.show();
});

// vehicleFormSubmit.addEventListener("click", () => {
//   vehicleFormDialog.close();
// });
closeFormButton.addEventListener("click", () => {
 vehicleFormDialog.close();
});

//set locations in select menu
window.addEventListener("load", () => {
 // to set locations in select menu

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
  })
  .catch((err) => {
   console.log("Error in select menu: " + err.message);
  });
});

//prepare data for vehicle
function prepareData() {
 console.log("in prepareData");
 let vTypeval = "";
 for (let radio of vType) {
  if (radio.checked) {
   vTypeval = radio.value;
   console.log(vTypeval);
  }
 }
 const vbrandVal = vbrand.value;
 const vmodelVal = vmodel.value;
 const vnumVal = vnum.value;
 const vimgVal = vimg.files[0];
 const selectLocationVal = selectLocation.value;
 const priceHourVal = priceHourly.value;
 const nightPriceVal = nightPrice.value;

 if (priceHourVal <= 0 || nightPriceVal <= 0) {
  showSnackbar("Price cannot be negative or 0", 2000);
  return;
 }

 if (priceHourVal > 1000 || nightPriceVal > 1000) {
  showSnackbar("Price cannot be greater than 1000", 2000);
  return;
 }

 let vId = generateBikeID();
 const vehicleData = {
  vId: vId,
  vType: vTypeval,
  vbrand: vbrandVal,
  vmodel: vmodelVal,
  vnum: vnumVal,
  location: selectLocationVal,
  priceHour: priceHourVal,
  nightPrice: nightPriceVal,
  available: true,
  // orderIds: [],
 };
 compressImg64(vimgVal).then((image) => {
  vehicleData.vimg = image;
  console.log("vehicleData submit se pehle");
  saveVehicleData(vehicleData);
  console.log("vehicleData submit", vehicleData);
  vehicleForm.reset();
  showSnackbar("Vehicle Added Successfully", 2000);
  vehicleFormDialog.close();
 });
}

//to encode image format
function compressImg64(imgFile) {
 const file = imgFile;
 const reader = new FileReader();

 return new Promise((resolve, reject) => {
  reader.onload = function (event) {
   const img = new Image();
   img.src = event.target.result;

   img.onload = function () {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to the size you desire
    canvas.width = 300;
    canvas.height = 200;

    // Draw the image on the canvas (this will resize it)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Convert the canvas content to a data URL
    const compressedImageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

    // Resolve with the compressed image data URL
    resolve(compressedImageDataUrl);
   };
  };

  reader.onerror = function (error) {
   // Reject with the error if any
   reject(error);
  };

  reader.readAsDataURL(imgFile);
 });
}

//to generate unique bike id
function generateBikeID() {
 const dateString = Date.now().toString(36);
 const randomness = Math.random().toString(36).substring(2);
 return dateString + randomness;
}

//on submitting add vehicle form
vehicleForm.addEventListener("submit", (e) => {
 e.preventDefault();

 const bikeData = prepareData();
});

// to save vehicle data in db
function saveVehicleData(vehicleData) {
 // const vehicles = JSON.parse(localStorage.getItem("vehicles")) || [];
 // vehicles.push(vehicleData);
 // localStorage.setItem("vehicles", JSON.stringify(vehicles));
 // console.log(vehicles);

 openDatabase()
  .then((db) => {
   console.log("Database opened successfully", db);
   return addToObjectStore(db, "vehicles", vehicleData);
  })
  .then((addedKey) => {
   console.log("Data added successfully", addedKey);
  })
  .then(() => {
   showSnackbar("Vehicle added successfully", 2000);
   setTimeout(() => {
    window.location.reload();
   }, 2000);
  })
  .catch((error) => {
   console.log("Error in adding vehicle: " + error.message);
  });
 // window.alert("Vehicle added successfully");
}

//snackbar to show vehicle added successfully
function showSnackbarMain() {
 // Get the snackbar DIV

 // Add the "show" class to DIV
 console.log("snackbar to show");
 snackbar.className = "show";
 // After 3 seconds, remove the show class from DIV
 setTimeout(function () {
  snackbar.className = snackbar.className.replace("show", "");
 }, 3000);
}

// add all vehicles function from an array
function add() {
 openDatabase()
  .then((db) => {
   for (const v of allVehicles) {
    addToObjectStore(db, "vehicles", v);
   }
  })
  .catch((err) => {
   console.log(err);
  });
}

// add();

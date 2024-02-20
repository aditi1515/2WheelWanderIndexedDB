const selectLocation = document.querySelector(".locationSelect");
const dateTimeForm = document.querySelector(".form-container");
const locationElement = document.querySelector(".locationSelect");
const startDateTime = document.querySelector("#start-date");
const endDateTime = document.querySelector("#end-date");
const submitBtn = document.querySelector("#submit-btn");
const dateValidationSnackbar = document.querySelector(
 "#datesValidation-snackbar"
);

//add locations in select menu

const locationArr = [
 { city: "Mumbai", enabled: true },
 { city: "Delhi", enabled: true },
 { city: "Bangalore", enabled: true },
 { city: "Chennai", enabled: true },
 { city: "Jaipur", enabled: true },
 { city: "Lucknow", enabled: true },
];

addLocations(locationArr);

function addLocations(locationArr) {
 openDatabase()
  .then((db) => {
   clearObjectStore(db, "locations");

   return db;
  })
  .then((db) => {
   console.log("Db opened successfully", db);

   for (const location of locationArr) {
    console.log(location);
    addToObjectStore(db, "locations", location);
   }
  })
  .catch((err) => {
   console.log("Error while adding location", err.message);
  });
 // .then((addedKey) => {
 //   console.log("Locations added successfully", addedKey);
 // })
}
// to set locations in select menu
function setSelectMenu() {
 openDatabase()
  .then((db) => {
   return getAllFromObjectStore(db, "locations");
  })
  .then((locationsArr) => {
   console.log(locationsArr);
   for (let i = 0; i < locationsArr.length; i++) {
    let opt = locationsArr[i];
    console.log(opt);
    console.log(locationsArr[i]);
    let el = document.createElement("option");
    el.textContent = opt.city;
    el.value = opt.city;
    selectLocation.appendChild(el);
   }
  })
  .catch((err) => {
   console.log("Error in select menu: " + err.message);
  });
}

setSelectMenu();
// window.addEventListener("load", () => {
//   const locationArr = JSON.parse(localStorage.getItem("locations"));
//   console.log(locationArr);
// });

//snackbar
function showSnackbar(message, timeout = 3000) {
 dateValidationSnackbar.className = "show";
 dateValidationSnackbar.textContent = message;
 setTimeout(function () {
  dateValidationSnackbar.className = dateValidationSnackbar.className.replace(
   "show",
   ""
  );
 }, timeout);
}

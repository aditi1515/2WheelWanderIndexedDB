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

window.addEventListener("load", () => {
  const currUser = JSON.parse(localStorage.getItem("currUser"));
 
  if (currUser?.role === "admin") {
   window.location = "./analytics.html";
  }
 });


// to set locations in select menu
function setSelectMenu() {
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

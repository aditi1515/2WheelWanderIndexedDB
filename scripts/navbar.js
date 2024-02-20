const loggedOutNavbar = document.querySelector(".loggedOut-navbar-options");
const loggedInNavbar = document.querySelector(".loggedIn-navbar-options");
let userProfileIcon = document.querySelector(".user-img-container");
const adminOption = document.querySelector(".admin");
const logOutOption = document.querySelectorAll("#logOut-link");
const home = document.querySelectorAll(".home");
// const logOutAdmin = document.querySelector("#logOut-link-admin");

// window.addEventListener("load", ()=>{
//   window.location = './index.html'
// })
window.addEventListener("load", handleNavbarVisibility);

for (const logOut of logOutOption) {
  logOut.addEventListener("click", () => {
    localStorage.removeItem("currUser");
    // console.log(currUser);
    window.location.replace("./index.html");
  });
}
for (const homeIcon of home) {
  homeIcon.addEventListener("click", () => {
    window.location.replace("./index.html");
  });
  window.addEventListener('load', handleNavbarVisibility)
}

function handleNavbarVisibility(){
  const currUser = JSON.parse(localStorage.getItem("currUser"));

  // console.log(currUser.role);
  if (currUser && currUser.role === "user") {
    loggedOutNavbar.style.display = "none";
    loggedInNavbar.style.display = "flex";
    adminOption.style.display = "none";
    // userProfileIcon.onclick = function () {
    //   userProfileIcon.classList.add("active");
    // };
  } else if (currUser && currUser.role === "admin") {
    loggedOutNavbar.style.display = "none";
    loggedInNavbar.style.display = "none";
    adminOption.style.display = "flex";
  } else if (currUser === null) {
    // console.log(currUser);
    loggedOutNavbar.style.display = "flex";
    loggedInNavbar.style.display = "none";
    adminOption.style.display = "none";
  }
}
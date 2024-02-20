const signInForm = document.querySelector(".signIn-form");
const email = document.querySelector("#email");
const password = document.querySelector("#password");

window.addEventListener("load", () => {
  const currUser = JSON.parse(localStorage.getItem("currUser"));

  if (currUser !== null) {
    window.location = "./index.html";
  }
});
signInForm.addEventListener("submit", (e) => {
  e.preventDefault();
  resetError();
  validateUser();
});

function setErrorMessage(message) {
  const errorElement = document.querySelector(".error");

  errorElement.innerText = message;
}
function resetError() {
  const errorElement = document.querySelector(".error");

  errorElement.innerText = "";
}

//validate signin
function validateUser() {
  const emailVal = email.value.toLowerCase().trim();

  const passwordVal = password.value;

  // const users = JSON.parse(localStorage.getItem("users"));

  // if (users === null) setErrorMessage("Email does not exist");
  // if (users !== null) {
  //   const filteredUser = users.filter((user) => emailVal === user.email.toLowerCase().trim());
  //   if(filteredUser.length === 0 ) setErrorMessage('* User dont exist')
  //   else if ( filteredUser[0].password != passwordVal) {
  //     setErrorMessage("* Email or password is incorrect");
  //   } else {
  //     saveCurrUserObj(filteredUser[0]);
  //   }
  // }

  openDatabase().then((db) => {
    console.log("Database opened successfully");
    return getObjectFromIndex(db, "users", "emailIndex", emailVal)
      .then((userObj) => {
        console.log("User retrieved sccessfully", userObj);
        return userObj;
      })
      .then((user) => {
        if (user === undefined) setErrorMessage("* User don't exist");
        else {
          if (user.password !== passwordVal)
            setErrorMessage("* Email or Password is incorrect");
          else {
            saveCurrUserObj(user);
          }
        }
      })
      .catch((err) => {
        console.log("Retrieved user failed", err);
      });
  });
}

function saveCurrUserObj(currUser) {
  console.log(currUser);

  const { password, ...user } = currUser;
  localStorage.setItem("currUser", JSON.stringify(user));
  // const URLParams = new URLSearchParams(window.location.search);
  // for (const p of URLParams) {
  //   console.log(p);
  // }
  const redirectLink =
    localStorage.getItem("redirectURL") || "http://127.0.0.1:5500/index.html";
  console.log(redirectLink);

  window.location = redirectLink;
  localStorage.removeItem("redirectURL");
  
  // handleNavbarVisibility();
}

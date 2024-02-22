const signUpForm = document.querySelector(".signUp-form");
const fname = document.querySelector("#fname");
const lname = document.querySelector("#lname");
const mobile = document.querySelector("#mnum");
const email = document.querySelector("#email");
const password = document.querySelector("#password");
const confirmPass = document.querySelector("#confirm-pass");

// const submitButton = document.querySelector('#submit-btn')
window.addEventListener("load", () => {
  const currUser = JSON.parse(localStorage.getItem("currUser"));

  if (currUser !== null) {
    window.location = "./index.html";
  }
});
password.addEventListener("blur", passwordValidation);

function passwordValidation() {
  const passVal = password.value;
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
  console.log(errMessArr);
  const errorMessages = new Map();
  errorMessages.set(password, errMessArr);
  console.log(errorMessages);

  setError(errorMessages);
}

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

signUpForm.addEventListener("submit", (e) => {
  e.preventDefault();
  resetError();
  passwordValidation();
  const data = prepareData();
  validateInputs(data);
});

function prepareData() {
  const fnameVal = fname.value;
  const lnameVal = lname.value;
  const mobileVal = mobile.value;
  const emailVal = email.value;
  const passwordVal = password.value;
  const confirmPassVal = confirmPass.value;
  const userData = {
    fname: fnameVal.toLowerCase().trim(),
    lname: lnameVal.toLowerCase().trim(),
    mobile: mobileVal,
    email: emailVal.toLowerCase().trim(),
    password: passwordVal,
    confirmPass: confirmPassVal,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    
  };
  return userData;
}
function resetError() {
  const allErrorElements = document.querySelectorAll(".error");
  allErrorElements.forEach((element) => {
    element.innerHTML = "";
  });
}

function setSuccess(element) {
  const inputField = element.parentElement;
  const errorDisplay = inputField.querySelector(".error");

  errorDisplay.innerText = "";
  inputField.classList.add("success");
  inputField.classList.add("error");
}

//validate inputs
function validateInputs(data) {
  const errorMessageMap = new Map();
  console.log(data.fname);
  if (data.fname.length==0) {
    const fnameErr = [];
    fnameErr.push("Please enter first name");
    errorMessageMap.set(fname, fnameErr);
  }
  const mobileErrorMess = [];
  if (data.mobile.length < 10) {
    mobileErrorMess.push("Valid mobile number required");
    errorMessageMap.set(mobile, mobileErrorMess);
  }
  const mobilePattern = "[1-9]{1}[0-9]{9}";
  //mobile pattern check
  if (!data.mobile.match(mobilePattern)) {
    mobileErrorMess.push("Invalid mobile number format");
    errorMessageMap.set(mobile, mobileErrorMess);
  }
  //email check
  const regExpEmail = "^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$";
  const emailErrorMess = [];
  if (!data.email.match(regExpEmail)) {
    emailErrorMess.push("Valid email required");
    errorMessageMap.set(email, emailErrorMess);
  }
  openDatabase()
    .then((db) => {
      return getObjectFromIndex(db, "users", "emailIndex", data.email);
    })
    .then((filteredUser) => {
      if (filteredUser !== undefined) {
        emailErrorMess.push("User already exist");
        errorMessageMap.set(email, emailErrorMess);
      }

      //cnfirm password check
      if (data.confirmPass !== data.password) {
        const confirmPassMess = [];
        confirmPassMess.push("Password does not match");
        errorMessageMap.set(confirmPass, confirmPassMess);
      }

      setError(errorMessageMap);

      if (errorMessageMap.size === 0) {
        const { confirmPass, ...userData } = data;
        saveUser(userData);
      }
    })
    .catch((err) => {
      console.log("Error in validating signup details: " + err);
    });
  // const users = JSON.parse(localStorage.getItem("users"));
  // console.log(users);
  // if (users !== null) {
  //   const filteredUser = users.filter((user) => data.email === user.email);
  //   if (filteredUser.length > 0) {
  //     emailErrorMess.push("Email already in use");
  //     errorMessageMap.set(email, emailErrorMess);
  //   }
  // }

  //   const redirectLink =
  //   (localStorage.getItem('redirectURL')) || "http://127.0.0.1:5500/index.html";
  // console.log(redirectLink);

  // window.location = redirectLink;
  // localStorage.removeItem('redirectURL');
  // }
}

function saveUser(userData) {
  // const users = JSON.parse(localStorage.getItem("users")) || [];
  const userId = generateUserId();

  const user = { userId: userId, ...userData, role: "user"};
  // users.push(user);
  // localStorage.setItem("users", JSON.stringify(users));
  console.log(user);
  openDatabase()
    .then((db) => {
      console.log(db);
      return addToObjectStore(db, "users", user);
    })
    .then((addedKey) => {
      console.log("Signup Successfull , User added with key :", addedKey);
    })
    .then(() => {
      showSnackbar();
      setTimeout(() => {
        window.location = "./signIn.html";
      }, 3000);
    })
    .catch((error) => {
      console.log("Signup error", error.message);
    });
}

function generateUserId() {
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

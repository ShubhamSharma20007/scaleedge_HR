function validateForm() {
  var companyName = document.getElementById('company_name').value;
  var userName = document.getElementById('name').value;
  var address = document.getElementById('address').value;
  var email = document.getElementById('email').value;
  var mobile = document.getElementById('mobile').value;
  var password = document.getElementById('password').value;
  var confirmPassword = document.getElementById('cpassword').value;
  var annual_salary = document.getElementById('annual_salary').value;
  var birth_date = document.getElementById('birth_date').value;



  if (
    companyName === '' ||
    userName === '' ||
    address === '' ||
    email === '' ||
    mobile === '' ||
    password === '' ||
    confirmPassword === '' ||
    annual_salary === '' ||
    birth_date ===''
  ) {
    showErrorToast('Please fill in all fields. 😔');
    return false;
  }

  if (password !== confirmPassword) {
    showErrorToast('Passwords do not match. 😔');
    return false;
  }

  var passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[\]:;<>,.?/~_+\-=|\\]).{8,32}$/;
  if (!passwordRegex.test(password)) {
    showErrorToast('Password should contain at least one letter, one number, and one special character. 😔');
    return false;
  }

  if (mobile.length !== 10 || isNaN(mobile)) {
    showErrorToast('Mobile number should have exactly 10 digits. 😔');
    return false;
  }

  checkEmailExists(email, function (emailExists) {
    if (emailExists) {
      showErrorToast('Email already exists. Please use a different email. 😔');
    } else {
      showSuccessToast('Welcome, ' + userName + '! 😊. Your application has been sent to the admin. If the admin approves, you will receive the mail!.');
      // showSuccessToast('Registration successful. Welcome, ' + userName + '! 😊. Your email and password have been sent to your email address.');
      setTimeout(function () {
        document.getElementById('companyForm').submit();
      }, 2000);
    }
  });

  return false;
}

function checkEmailExists(email, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        var response = JSON.parse(xhr.responseText);
        callback(response.exists);
      } else {
        showErrorToast('Error checking email existence. Please try again later. 😔');
        callback(false);
      }
    }
  };

  xhr.open('POST', '/check_email_exists', true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.send('email=' + encodeURIComponent(email));
}

function showErrorToast(message) {
  Toastify({
    text: message,
    duration: 5000,
    newWindow: true,
    close: true,
    gravity: 'top',
    position: 'center',
    backgroundColor: 'red',
    stopOnFocus: true,
    className: 'error-toast',
  }).showToast();
}

function showSuccessToast(message) {
  Toastify({
    text: message,
    duration: 5000,
    newWindow: true,
    close: true,
    gravity: 'top',
    position: 'center',
    backgroundColor: 'lightgreen',
    stopOnFocus: true,
    className: 'success-toast',
  }).showToast();
}


function togglePassword(inputId) {
  var passwordField = document.getElementById(inputId);
  var passwordToggle = document.querySelector(".password-toggle i");

  if (passwordField.type === "password") {
    passwordField.type = "text";
    passwordToggle.classList.remove("fa-eye-slash");
    passwordToggle.classList.add("fa-eye");
  } else {
    passwordField.type = "password";
    passwordToggle.classList.remove("fa-eye");
    passwordToggle.classList.add("fa-eye-slash");
  }
}

function togglePassword1(inputId) {
  var passwordField = document.getElementById(inputId);
  var passwordToggle = document.querySelector(".password-toggle1 i");

  if (passwordField.type === "password") {
    passwordField.type = "text";
    passwordToggle.classList.remove("fa-eye-slash");
    passwordToggle.classList.add("fa-eye");
  } else {
    passwordField.type = "password";
    passwordToggle.classList.remove("fa-eye");
    passwordToggle.classList.add("fa-eye-slash");
  }
}



addEventListener("DOMContentLoaded", (event) => {
  const password = document.getElementById("password");
  const passwordAlert = document.getElementById("password-alert");
  const requirements = document.querySelectorAll(".requirements");
  let lengBoolean, bigLetterBoolean, numBoolean, specialCharBoolean;
  let leng = document.querySelector(".leng");
  let bigLetter = document.querySelector(".big-letter");
  let num = document.querySelector(".num");
  let specialChar = document.querySelector(".special-char");
  const specialChars = "!@#$%^&*()-_=+[{]}\\|;:'\",<.>/?`~";
  const numbers = "0123456789";

  requirements.forEach((element) => element.classList.add("wrong"));

  password.addEventListener("focus", () => {
    passwordAlert.classList.remove("d-none");
    if (!password.classList.contains("is-valid")) {
      password.classList.add("is-invalid");
    }
  });

  password.addEventListener("input", () => {
    let value = password.value;
    if (value.length < 8) {
      lengBoolean = false;
    } else if (value.length > 7) {
      lengBoolean = true;
    }

    if (value.toLowerCase() == value) {
      bigLetterBoolean = false;
    } else {
      bigLetterBoolean = true;
    }

    numBoolean = false;
    for (let i = 0; i < value.length; i++) {
      for (let j = 0; j < numbers.length; j++) {
        if (value[i] == numbers[j]) {
          numBoolean = true;
        }
      }
    }

    specialCharBoolean = false;
    for (let i = 0; i < value.length; i++) {
      for (let j = 0; j < specialChars.length; j++) {
        if (value[i] == specialChars[j]) {
          specialCharBoolean = true;
        }
      }
    }

    if (lengBoolean == true && bigLetterBoolean == true && numBoolean == true && specialCharBoolean == true) {
      password.classList.remove("is-invalid");
      password.classList.add("is-valid");

      requirements.forEach((element) => {
        element.classList.remove("wrong");
        element.classList.add("good");
      });
      passwordAlert.classList.remove("alert-warning");
      passwordAlert.classList.add("alert-success");
    } else {
      password.classList.remove("is-valid");
      password.classList.add("is-invalid");

      passwordAlert.classList.add("alert-warning");
      passwordAlert.classList.remove("alert-success");

      if (lengBoolean == false) {
        leng.classList.add("wrong");
        leng.classList.remove("good");
      } else {
        leng.classList.add("good");
        leng.classList.remove("wrong");
      }

      if (bigLetterBoolean == false) {
        bigLetter.classList.add("wrong");
        bigLetter.classList.remove("good");
      } else {
        bigLetter.classList.add("good");
        bigLetter.classList.remove("wrong");
      }

      if (numBoolean == false) {
        num.classList.add("wrong");
        num.classList.remove("good");
      } else {
        num.classList.add("good");
        num.classList.remove("wrong");
      }

      if (specialCharBoolean == false) {
        specialChar.classList.add("wrong");
        specialChar.classList.remove("good");
      } else {
        specialChar.classList.add("good");
        specialChar.classList.remove("wrong");
      }
    }
  });

  password.addEventListener("blur", () => {
    passwordAlert.classList.add("d-none");
  });
});
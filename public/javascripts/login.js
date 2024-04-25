// const loginForm = document.querySelector('.sign-in-form');

// loginForm.addEventListener('submit', (event) => {
//     event.preventDefault();
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;
//     localStorage.loginemail = email;
//     fetch('/auth_login', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, password }),
//     })
//         .then((response) => response.json())
//         .then((data) => {
//             if (data.success) {
//                 localStorage.username = data.userName;
//                 localStorage.imagePath = data.imagePath;
//                 localStorage.userGroup = data.userGroup;
//                 localStorage.userType = data.userType;
//                 localStorage.userAdhar = data.userAdhar;
//                 localStorage.userPancard = data.userPancard;
//                 localStorage.userEmployeeId = data.userEmployeeId;
//                 // localStorage.userCity = data.userCity;
//                 // localStorage.userPincode = data.userPincode;
//                 // localStorage.userMobile = data.userMobile;
//                 // localStorage.joiningDate = data.joiningDate;
//                 // localStorage.birthDate = data.birthDate;

//                 Toastify({
//                     text: 'Login Successful 😊 Welcome to the dashboard!',
//                     // backgroundColor: 'lightgreen',
//                     className: 'success-toast',
//                     style: {
//                         color: 'white' // Set text color to white
//                     }
//                 }).showToast();
//                 setTimeout(() => {
//                     window.location.href = '/dashboard';
//                 }, 250);

//             } else {
//                 Toastify({
//                     text: `Login Failed 😞 ${data.message}`,
//                     backgroundColor: 'red',
//                     className: 'error-toast',
//                 }).showToast();

//             }

//         })
//         .catch((error) => {
//             console.error('Error:', error);
//         });
// });

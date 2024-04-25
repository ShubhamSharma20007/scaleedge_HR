
// Show loader when the page starts loading
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('preloader').style.display = 'flex';
});

window.addEventListener('load', function () {
    document.getElementById('preloader').style.display = 'none';
});

const loginForm = document.querySelector('.sign-in-form');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    localStorage.loginemail = email.toLowerCase();
    try {
        const response = await fetch('/auth_login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success) {
            localStorage.removeItem('selectedUser'); 
            localStorage.username = data.userName;
            localStorage.imagePath = data.imagePath;
            localStorage.userGroup = data.userGroup;
            localStorage.userType = data.userType;
            localStorage.userAdhar = data.userAdhar;
            localStorage.userPancard = data.userPancard;
            localStorage.userEmployeeId = data.userEmployeeId;
            // Check if employee ID is already stored
            if (!localStorage.getItem('userUniqueId')) {
                localStorage.userUniqueId = data.userEmployeeId;
            }



            // Storing MAC address in localStorage
            localStorage.macAddress = data.macAddress;

            Toastify({
                text: 'Login Successful 😊 Welcome to the dashboard!',
                className: 'success-toast',
                style: {
                    color: 'white'
                }
            }).showToast();
            window.location.href = '/dashboard';

        } else {
            Toastify({
                text: `Login Failed 😞 ${data.message}`,
                backgroundColor: 'red',
                className: 'error-toast',
            }).showToast();
        }
    } catch (error) {
        console.error('Error:', error);
    }
});


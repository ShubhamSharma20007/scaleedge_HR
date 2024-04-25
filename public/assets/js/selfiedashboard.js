let recognizedLabel = null;
// let modelsLoaded = false;
let faceMatcher;

 loadModels();
    faceMatcher = createFaceMatcher();


// Load face recognition models
async function loadModels() {
    const MODEL_URL = '/models';
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ]);
}

// Create a face matcher
async function createFaceMatcher() {
    const timestamp = new Date().getTime(); 
    const response = await fetch(`/usersdtl1.json?v=${timestamp}`);
    const json = await response.json();

    const labeledDescriptors = json.map(data => {
        const title = data.title;
        const descriptor = new Float32Array(Object.values(data.descriptor));
        return { label: title, descriptor: descriptor };
    });

    const loginEmail = localStorage.loginemail;
    let userDescriptor;
    
       userDescriptor = labeledDescriptors.find(item => item.label === loginEmail)?.descriptor;

        if (!userDescriptor) {
            console.error("Descriptor not found for logged in user.");
            return null;
        }

        const faceMatchDescriptor = JSON.stringify(Array.from(userDescriptor));
        localStorage.setItem(`userDescriptor_${loginEmail}`, faceMatchDescriptor);
       

    //const faceMatchDescriptor = localStorage.getItem(`userDescriptor_${loginEmail}`);
    
    // if (faceMatchDescriptor) {
    //     userDescriptor = new Float32Array(JSON.parse(faceMatchDescriptor));
    // } else {
        
    //     userDescriptor = labeledDescriptors.find(item => item.label === loginEmail)?.descriptor;

    //     if (!userDescriptor) {
    //         console.error("Descriptor not found for logged in user.");
    //         return null;
    //     }

    //     const faceMatchDescriptor = JSON.stringify(Array.from(userDescriptor));
    //     localStorage.setItem(`userDescriptor_${loginEmail}`, faceMatchDescriptor);
    // }


    return new faceapi.FaceMatcher([{ label: loginEmail, descriptor: userDescriptor }]);
}

async function createFaceMatcherfromLocalStorage() {

    const loginEmail = localStorage.loginemail;
    const faceMatchDescriptor = localStorage.getItem(`userDescriptor_${loginEmail}`);
     let userDescriptor;
     userDescriptor = new Float32Array(JSON.parse(faceMatchDescriptor));
    return new faceapi.FaceMatcher([{ label: loginEmail, descriptor: userDescriptor }]);

   
    
}

// Compare the detected face with the stored face descriptors
async function facecompare() {
    const startTime = performance.now();

    const img = document.getElementById('blah');
    const faceDescriptions = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    if (!faceDescriptions) {
        displayNoMatchResult();
        return;
    }

    const descriptor = faceDescriptions.descriptor;
    const loginEmail = localStorage.loginemail;

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;

    if (duration > 15) {
        stopPleaseWaitLoading();
        displayTooLongMessage();
        return;
    }

    const bestMatch = faceMatcher.findBestMatch(descriptor);
    if (bestMatch._distance <= 0.51) {
        sendDataToBackend(localStorage.loginemail, duration);
        recognizedLabel = localStorage.loginemail;
        displayMatchResult(recognizedLabel, duration);

    } else {
        displayNoMatchResult();
    }
}

// Send match data to the backend
function sendDataToBackend(recognizedLabel, duration) {
    fetch('/storeData', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            recognizedLabel: recognizedLabel,
            timeSpent: duration
        }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Data sent to backend:', data);
        })
        .catch(error => {
            console.error('Error sending data to backend:', error);
        });
}

// Display match result
function displayMatchResult(label, duration) {
    Swal.fire({
        icon: 'success',
        title: '🎉 Face Match Success!',
        text: `Matched with: ${label}`,
        footer: `Match duration: ${duration.toFixed(2)} seconds`,
        confirmButtonText: 'Great!'
    });
    document.getElementById('btn').style.display = 'block';
}

// Display no match result
function displayNoMatchResult() {
    Swal.fire({
        icon: 'error',
        title: '🚫 Face Match Failed',
        text: 'Sorry, no match found for this face.',
        footer: 'Try again or match the face with your selfie.',
        confirmButtonText: 'Got it'
    });
    document.getElementById('btn').style.display = 'none';
}

// Get image from backend and initiate face comparison
function getval() {
    showPleaseWait();
    fetch('/getimg', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then((response) => response.json())
        .then((data) => {
            jsonObj = [];
            for (let i = 0; i < data.length; i++) {
                const item = {};
                item['title'] = data[i].user_id;
                item['Imagepath'] = data[i].Imagepath;
                item['id'] = data[i].id;
                item['latitude'] = data[i].latitude;
                item['longitude'] = data[i].longitude;
                jsonObj.push(item);
            }
            facecompare(); // Assuming facecompare() is defined elsewhere
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

// Show loading message
function showPleaseWait() {
    Swal.fire({
        title: 'Please wait',
        html: '<div class="custom-loader"></div><br>Fetching face from the database...',
        allowOutsideClick: false,
        showCancelButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
}

function stopPleaseWaitLoading() {
    Swal.close(); // Close the loading message
}

function displayTooLongMessage() {
    Swal.fire({
        icon: 'error',
        title: '⏳ Time Limit Exceeded',
        text: 'Sorry, the process took too long. Please try again.',
        confirmButtonText: 'Got it'
    });
    document.getElementById('btn').style.display = 'none';
}


// Check if the device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth <= 768;
}

// Function to read URL and start face comparison
function readURL(input) {
    if (isMobileDevice()) {
        openCamera();
    } else {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('#blah').attr('src', e.target.result);
                localStorage.startTime = performance.now();
                getval();
            };

            reader.readAsDataURL(input.files[0]);
        }
    }
}

// Function to open camera on mobile devices
function openCamera() {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then(function (stream) {
                var video = document.getElementById('video');
                video.srcObject = stream;
                video.play();
            })
            .catch(function (error) {
                console.error('Error accessing camera:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Camera Error',
                    text: 'Failed to access the camera.',
                });
            });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Camera Error',
            text: 'Camera access is not supported by this browser.',
        });
    }
}



// Function to capture image and compress
function captureImageAndCompress() {
    var video = document.getElementById('video');
    var canvas = document.createElement('canvas');
    var scaleFactor = 0.5; // Scale factor for reducing dimensions
    canvas.width = video.videoWidth * scaleFactor;
    canvas.height = video.videoHeight * scaleFactor;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    // Delay image compression to reduce memory usage
    setTimeout(function () {
        compressImage(canvas);
        // Release video stream to free up memory
        video.srcObject.getTracks().forEach(track => track.stop());
    }, 200); // Adjust the delay time as needed
}

function compressImage(canvas) {
    var tempCanvas = document.createElement('canvas');
    var tempContext = tempCanvas.getContext('2d');
    var scaleFactor = 0.5; // Scale factor for reducing dimensions
    tempCanvas.width = canvas.width * scaleFactor;
    tempCanvas.height = canvas.height * scaleFactor;
    tempContext.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    var quality = 0.6; // Initial quality
    var compressedDataUrl = tempCanvas.toDataURL('image/jpeg', quality);
    while (compressedDataUrl.length > 10 * 1024) {
        quality -= 0.05;
        compressedDataUrl = tempCanvas.toDataURL('image/jpeg', quality);
    }

    $('#blah').attr('src', compressedDataUrl);
    getval();


    tempCanvas = null;
    tempContext = null;

    // Call the face compare function after setting the image source
    facecompare();
}





function storeCheckin(label, latitude, longitude, range_status) {
    const currentTime = new Date().toLocaleTimeString();
    fetch('/storeCheckinTime', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label, latitude, longitude, range_status }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Check-in time stored for label:', label);
            Swal.fire({
                icon: 'success',
                title: 'Check-in Successful!',
                text: `Welcome! Your check-in has been successfully recorded`,
                footer: `Check-in Time: ${currentTime}`,
                // text: `Welcome ${label}! Your check-in is successful.\nCheck-in Time: ${currentTime}`,
                showConfirmButton: false,
                timer: 2500,
            }).then(() => {
                window.location.href = '/dashboard';
            });
        })
        .catch((error) => {
            console.error('Error storing check-in time:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops! Check-in Error',
                text: 'Oops! Something went wrong while processing your check-in. Please try again later.',

            });
        });
}


function storeCheckout(label, latitude, longitude, range_status) {
    const currentTime = new Date().toLocaleTimeString();
    fetch('/checkAttendance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.exists) {
                storeCheckoutTime(label, latitude, longitude, range_status, currentTime); // Corrected function name
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Attendance Entry Missing',
                    text: 'You need to record an "Punch-in" entry for today before "Punch-out".',
                });
            }
        })
        .catch((error) => {
            console.error('Error checking attendance entry:', error);
            Swal.fire({
                icon: 'error',
                title: 'Check-out Error',
                text: 'Failed to check attendance entry.',
            });
        });
}


function storeCheckoutTime(label, latitude, longitude, range_status) {
    const currentTime = new Date().toLocaleTimeString();
    fetch('/storeCheckoutTime', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label, latitude, longitude, range_status }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Checkout time stored for label:', label);
            Swal.fire({
                icon: 'success',
                title: 'Checkout Successful!',
                text: `Goodbye! Your checkout has been successfully recorded.`,
                footer: `Checkout Time: ${currentTime}`,
                // text: `Goodbye, ${label}! Your checkout has been successfully recorded.\nCheckout Time: ${currentTime}`,
                showConfirmButton: false,
                timer: 2500,
            }).then(() => {
                window.location.href = '/dashboard';
            });
        })
        .catch((error) => {
            console.error('Error storing checkout time:', error);
            Swal.fire({
                icon: 'error',
                title: 'Oops! Checkout Error',
                text: 'Oops! Something went wrong while processing your checkout. Please try again later.',
            });
        });
}


function calculateRange(latitude, longitude) {
    return Math.abs(latitude - longitude);
}

function handleCheckin() {
    if (recognizedLabel) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    // Hide loading indicator
                    // Swal.close();

                    const userLatitude = position.coords.latitude;
                    const userLongitude = position.coords.longitude;
                    const { latitude, longitude } = getUserLocation(recognizedLabel);

                    const distanceToUser = getDistance(userLatitude, userLongitude, latitude, longitude);

                    let range_status;
                    const now = new Date();
                    const checkinTime = new Date(now);
                    checkinTime.setHours(8, 0, 0, 0);

                    if (now >= checkinTime) {
                        if (distanceToUser <= 0.3) {
                            range_status = 'ok';
                            storeCheckin(recognizedLabel, userLatitude, userLongitude, range_status);
                        } else {
                            Swal.fire({
                                title: '⚠️ Are you sure you want to check-in outside?',
                                text: 'You are outside the specified location range. Do you still want to check-in?',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Yes, check-in',
                                cancelButtonText: 'No, cancel',
                                confirmButtonColor: '#3085d6',
                                cancelButtonColor: '#d33',
                            }).then((result) => {
                                if (result.isConfirmed) {
                                    range_status = 'onfield';
                                    storeCheckin(recognizedLabel, userLatitude, userLongitude, range_status);
                                }
                            });

                        }
                    } else {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Check-in Time Not Yet Started',
                            text: 'You can only check-in after 8:00 AM.',
                        });
                    }
                },
                function (error) {
                    // Hide loading indicator
                    Swal.close();

                    console.error('Error getting geolocation:', error);
                    Swal.fire({
                        icon: 'error',
                        title: '🌍 Geolocation Error',
                        text: 'Oops! We couldn\'t determine your location.',
                        footer: 'Please check your browser settings or try again later. Note: Geolocation may require a secure connection (HTTPS).',
                        confirmButtonText: 'Got it'
                    });
                }
            );
        } else {
            // Hide loading indicator
            Swal.close();

            Swal.fire({
                icon: 'error',
                title: '🌍 Geolocation Error',
                text: 'Oops! Your browser does not support geolocation.',
                footer: 'Please try using a different browser or enable geolocation settings. Note: Geolocation may require a secure connection (HTTPS).',
                confirmButtonText: 'Got it'
            });

        }
    } else {
        // Hide loading indicator
        Swal.close();

        Swal.fire({
            icon: 'warning',
            title: '🚫 Face Match Failed',
            text: 'Sorry, no match found for this face.',
            footer: 'Try again or match the face with your selfie.',
            confirmButtonText: 'Got it'
        });
    }
}

// function handleCheckout() {
//     // Show loading indicator
//     // Swal.fire({
//     //   title: 'Please wait...',
//     //   text: 'Fetching your location',
//     //   showConfirmButton: false,
//     //   allowOutsideClick: false,
//     //   onBeforeOpen: () => {
//     //     Swal.showLoading();
//     //   }
//     // });

//     if (recognizedLabel) {
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(
//                 function (position) {
//                     // Hide loading indicator
//                     // Swal.close();

//                     const userLatitude = position.coords.latitude;
//                     const userLongitude = position.coords.longitude;
//                     const { latitude, longitude } = getUserLocation(recognizedLabel);

//                     const distanceToUser = getDistance(userLatitude, userLongitude, latitude, longitude);

//                     let range_status;

//                     if (distanceToUser <= 0.3) {
//                         const now = new Date();
//                         const checkoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30);

//                         if (now < checkoutTime) {
//                             range_status = 'ok';
//                             storeCheckoutTime(recognizedLabel, userLatitude, userLongitude, range_status);
//                         } else {
//                             Swal.fire({
//                                 icon: 'warning',
//                                 title: 'Checkout Time Expired',
//                                 text: 'You can only checkout before 08:30 PM.',
//                             });
//                         }
//                     } else {
//                         Swal.fire({
//                             title: 'Are you sure you want to check-out outside?',
//                             text: 'You are outside the specified location range. Do you still want to check-out?',
//                             icon: 'warning',
//                             showCancelButton: true,
//                             confirmButtonText: 'Yes',
//                             cancelButtonText: 'No',
//                         }).then((result) => {
//                             if (result.isConfirmed) {
//                                 range_status = 'onfield';
//                                 storeCheckoutTime(recognizedLabel, userLatitude, userLongitude, range_status);
//                             }
//                         });
//                     }
//                 },
//                 function (error) {
//                     // Hide loading indicator
//                     Swal.close();

//                     console.error('Error getting geolocation:', error);
//                     Swal.fire({
//                         icon: 'error',
//                         title: 'Geolocation Error',
//                         text: 'Failed to get geolocation.',
//                     });
//                 }
//             );
//         } else {
//             // Hide loading indicator
//             Swal.close();

//             Swal.fire({
//                 icon: 'error',
//                 title: 'Geolocation Error',
//                 text: 'Geolocation is not supported by this browser.',
//             });
//         }
//     } else {
//         // Hide loading indicator
//         Swal.close();

//         Swal.fire({
//             icon: 'warning',
//             title: 'Face Not Found',
//             text: 'Face not found. Please try again.',
//         });
//     }
// }
function handleCheckout() {
    if (recognizedLabel) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    // Hide loading indicator
                    // Swal.close();

                    const userLatitude = position.coords.latitude;
                    const userLongitude = position.coords.longitude;
                    const { latitude, longitude } = getUserLocation(recognizedLabel);

                    const distanceToUser = getDistance(userLatitude, userLongitude, latitude, longitude);

                    let range_status;

                    if (distanceToUser <= 0.3) {
                        const now = new Date();
                        range_status = 'ok';
                        storeCheckout(recognizedLabel, userLatitude, userLongitude, range_status);
                    } else {
                        Swal.fire({
                            title: '⚠️ Are you sure you want to check-out outside?',
                            text: 'You are outside the specified location range. Do you still want to check-out?',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Yes, check-out',
                            cancelButtonText: 'No, cancel',
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                        }).then((result) => {
                            if (result.isConfirmed) {
                                range_status = 'onfield';
                                storeCheckout(recognizedLabel, userLatitude, userLongitude, range_status);

                            }
                        });
                    }
                },
                function (error) {
                    // Hide loading indicator
                    Swal.close();

                    console.error('Error getting geolocation:', error);
                    Swal.fire({
                        icon: 'error',
                        title: '🌍 Geolocation Error',
                        text: 'Oops! We couldn\'t determine your location.',
                        footer: 'Please check your browser settings or try again later. Note: Geolocation may require a secure connection (HTTPS).',
                        confirmButtonText: 'Got it'
                    });
                }
            );
        } else {
            // Hide loading indicator
            Swal.close();

            Swal.fire({
                icon: 'error',
                title: '🌍 Geolocation Error',
                text: 'Oops! Your browser does not support geolocation.',
                footer: 'Please try using a different browser or enable geolocation settings. Note: Geolocation may require a secure connection (HTTPS).',
                confirmButtonText: 'Got it'
            });
        }
    } else {
        // Hide loading indicator
        Swal.close();

        Swal.fire({
            icon: 'warning',
            title: '🚫 Face Match Failed',
            text: 'Sorry, no match found for this face.',
            footer: 'Try again or match the face with your selfie.',
            confirmButtonText: 'Got it'
        });
    }
}





function getUserLocation(label) {
    const user = jsonObj.find((item) => item.title === label);

    if (user) {
        return { latitude: user.latitude, longitude: user.longitude };
    } else {
        // Handle the case where user is not found
        console.error(`User with label '${label}' not found.`);
        // You might want to return a default location or handle this case differently.
        return { latitude: 0, longitude: 0 };
    }
}

function getDistance(lat1, lon1, lat2, lon2) {
    const radlat1 = (Math.PI * lat1) / 180;
    const radlat2 = (Math.PI * lat2) / 180;
    const theta = lon1 - lon2;
    const radtheta = (Math.PI * theta) / 180;
    let dist =
        Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515 * 1.609344;
    return dist;
}
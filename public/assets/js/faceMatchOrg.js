let recognizedLabel = null;
let jsonObj = [];

let modelsLoaded = false;

async function loadModels() {
    if (!modelsLoaded) {
        const MODEL_URL = '/models';
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        modelsLoaded = true;
        console.log("Models loaded successfully.");
    }
}

window.onload = async function () {
    await loadModels();
};

// async function facecompare() {
//     const startTime = performance.now();

//     await loadModels();

//     const img = document.getElementById('blah');
//     const faceDescriptions = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

//     fetch('/megapower.json?v=2.9')
//         .then(response => response.json())
//         .then(async json => {
//             const faceMatcher = new faceapi.FaceMatcher(faceDescriptions);
//             const loginEmail = localStorage.loginemail;
//             for (const data of json) {
//                 if (data.title === loginEmail) {
//                     const descriptor = new Float32Array(Object.values(data.descriptor));
//                     const bestMatch = faceMatcher.findBestMatch(descriptor);
//                     if (bestMatch._distance <= 0.51) {
//                         const endTime = performance.now(); // Record end time
//                         const duration = (endTime - startTime) / 1000; // Calculate duration in seconds

//                         // Send data to backend
//                         sendDataToBackend(data.title, duration);

//                         alert('Face matching time: ' + duration + ' seconds');
//                         recognizedLabel = data.title;
//                         displayMatchResult(recognizedLabel, duration);
//                         return; // Exit loop once match is found
//                     }
//                 }
//             }
//             displayNoMatchResult();
//         })
//         .catch(error => console.error('Error:', error));
// }

async function facecompare() {
    const startTime = performance.now();

    await loadModels();

    const img = document.getElementById('blah');
    const faceDescriptions = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    if (!faceDescriptions) {
        displayNoMatchResult();
        return;
    }

    const descriptor = faceDescriptions.descriptor;

    fetch('/megapower.json?v=2.9')
        .then(response => response.json())
        .then(async json => {
            const faceMatcher = new faceapi.FaceMatcher([{ descriptor: descriptor }]);
            const loginEmail = localStorage.loginemail;
            for (const data of json) {
                if (data.title === loginEmail) {
                    const descriptor = new Float32Array(Object.values(data.descriptor));
                    const bestMatch = faceMatcher.findBestMatch(descriptor);
                    if (bestMatch._distance <= 0.51) {
                        const endTime = performance.now(); 
                        const duration = (endTime - startTime) / 1000; 

                        sendDataToBackend(data.title, duration);

                        alert('Face matching time: ' + duration + ' seconds');
                        recognizedLabel = data.title;
                        displayMatchResult(recognizedLabel, duration);
                        return;
                    }
                }
            }
            displayNoMatchResult();
        })
        .catch(error => console.error('Error:', error));
}


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

function displayMatchResult(label, duration) {
    Swal.fire({
        icon: 'success',
        title: 'Face Match Result',
        text: `Face matched: ${label}`,
    });
    document.getElementById('btn').style.display = 'block';
}

function displayNoMatchResult() {
    Swal.fire({
        icon: 'error',
        title: 'Face not matched',
        text: 'Face not found',
    });
}

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

function showPleaseWait() {
    Swal.fire({
        title: 'Please wait',
        text: 'Fetching face from the database...',
        allowOutsideClick: false,
        showCancelButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.innerWidth <= 768;
}

function readURL(input) {
    if (isMobileDevice()) {
        openCamera();
    } else {
        if (input.files && input.files[0]) {
            var reader = new FileReader();

            reader.onload = function (e) {
                $('#blah').attr('src', e.target.result);
            };

            reader.readAsDataURL(input.files[0]);
        }
    }
}

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

$("#imgInp").change(function () {
    readURL(this);
    getval();
});

$("#blah").click(function () {
    if (isMobileDevice()) {
        captureImage();
    }
});

// function captureImageAndCompress() {
//     var video = document.getElementById('video');
//     var canvas = document.createElement('canvas');
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

//     // Delay image compression to reduce memory usage
//     setTimeout(function () {
//         compressImage(canvas);
//     }, 200); // Adjust the delay time as needed
// }

// function compressImage(canvas) {
//     var tempCanvas = document.createElement('canvas');
//     var tempContext = tempCanvas.getContext('2d');
//     tempCanvas.width = canvas.width;
//     tempCanvas.height = canvas.height;
//     tempContext.drawImage(canvas, 0, 0);

//     var quality = 0.6; // Initial quality
//     var compressedDataUrl = tempCanvas.toDataURL('image/jpeg', quality);
//     while (compressedDataUrl.length > 10 * 1024) {
//         quality -= 0.05;
//         compressedDataUrl = tempCanvas.toDataURL('image/jpeg', quality);
//     }

//     $('#blah').attr('src', compressedDataUrl);
// }


function captureImageAndCompress() {
    var video = document.getElementById('video');
    var canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
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
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempContext.drawImage(canvas, 0, 0);

    var quality = 0.6; // Initial quality
    var compressedDataUrl = tempCanvas.toDataURL('image/jpeg', quality);
    while (compressedDataUrl.length > 10 * 1024) {
        quality -= 0.05;
        compressedDataUrl = tempCanvas.toDataURL('image/jpeg', quality);
    }

    $('#blah').attr('src', compressedDataUrl);

    // Release temporary canvas to free up memory
    tempCanvas = null;
    tempContext = null;
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
                title: 'Check-in successful',
                text: `Face match found: ${recognizedLabel}\nCheck-in Time: ${currentTime}`,
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
                title: 'Check-in Error',
                text: 'Failed to store check-in time.',
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
                title: 'Checkout successful',
                text: `Face match found: ${recognizedLabel}\nCheckout Time: ${currentTime}`,
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
                title: 'Checkout Error',
                text: 'Failed to store checkout time.',
            });
        });
}


function calculateRange(latitude, longitude) {
    return Math.abs(latitude - longitude);
}

function handleCheckin() {
    // Show loading indicator
    // Swal.fire({
    //   title: 'Please wait...',
    //   text: 'Fetching your location',
    //   showConfirmButton: false,
    //   allowOutsideClick: false,
    //   onBeforeOpen: () => {
    //     Swal.showLoading();
    //   }
    // });

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
                                title: 'Are you sure you want to check-in outside?',
                                text: 'You are outside the specified location range. Do you still want to check-in?',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Yes',
                                cancelButtonText: 'No',
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
                        title: 'Geolocation Error',
                        text: 'Failed to get geolocation.',
                    });
                }
            );
        } else {
            // Hide loading indicator
            Swal.close();

            Swal.fire({
                icon: 'error',
                title: 'Geolocation Error',
                text: 'Geolocation is not supported by this browser.',
            });
        }
    } else {
        // Hide loading indicator
        Swal.close();

        Swal.fire({
            icon: 'warning',
            title: 'Face Not Found',
            text: 'Face not found. Please try again.',
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
    // Show loading indicator
    // Swal.fire({
    //   title: 'Please wait...',
    //   text: 'Fetching your location',
    //   showConfirmButton: false,
    //   allowOutsideClick: false,
    //   onBeforeOpen: () => {
    //     Swal.showLoading();
    //   }
    // });

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
                        const checkoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30);

                        if (now < checkoutTime) {
                            range_status = 'ok';
                            storeCheckoutTime(recognizedLabel, userLatitude, userLongitude, range_status);
                        } else {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Checkout Time Expired',
                                text: 'You can only checkout before 08:30 PM.',
                            });
                        }
                    } else {
                        Swal.fire({
                            title: 'Are you sure you want to check-out outside?',
                            text: 'You are outside the specified location range. Do you still want to check-out?',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Yes',
                            cancelButtonText: 'No',
                        }).then((result) => {
                            if (result.isConfirmed) {
                                range_status = 'onfield';
                                storeCheckoutTime(recognizedLabel, userLatitude, userLongitude, range_status);
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
                        title: 'Geolocation Error',
                        text: 'Failed to get geolocation.',
                    });
                }
            );
        } else {
            // Hide loading indicator
            Swal.close();

            Swal.fire({
                icon: 'error',
                title: 'Geolocation Error',
                text: 'Geolocation is not supported by this browser.',
            });
        }
    } else {
        // Hide loading indicator
        Swal.close();

        Swal.fire({
            icon: 'warning',
            title: 'Face Not Found',
            text: 'Face not found. Please try again.',
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

document.getElementById('checkin-btn').addEventListener('click', handleCheckin);
document.getElementById('checkout-btn').addEventListener('click', handleCheckout);
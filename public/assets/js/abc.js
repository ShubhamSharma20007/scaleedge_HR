let recognizedLabel = null;
let jsonObj = [];
let jsonUserObj = [];

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
async function getval() {
  showPleaseWait();

  try {
    const response = await fetch('/getimg', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching user data');
    }

    const data = await response.json();
    jsonObj = [];

    await Promise.all(data.map(async (item) => {
      const userJsonUrl = `/${item.user_id}.json.json`;
      try {
        const response = await fetch(userJsonUrl);
        if (!response.ok) {
          throw new Error(`Error fetching user JSON for user with ID: ${item.user_id}`);
        }

        const json = await response.json();
        jsonObj.push({
          title: json.title,
          Imagepath: item.Imagepath,
          id: item.id,
          latitude: item.latitude,
          longitude: item.longitude,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    }));

    // Perform face comparison after all user data is fetched
    facecompare();
  } catch (error) {
    console.error('Error:', error);
  }
}

async function facecompare() {
  const MODEL_URL = '/models';
  var matchData = 0;
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

  const img = document.getElementById('blah');
  var begin = Date.now();

  let faceDescriptions = await faceapi
    .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 })) // Adjust minConfidence as needed
    .withFaceLandmarks()
    .withFaceDescriptors();

  const faceMatcher = new faceapi.FaceMatcher(faceDescriptions);

  for (let i = 0; i < jsonObj.length; i++) {
    const userId = jsonObj[i].id;
    const userJsonUrl = `${localStorage.loginemail}.json.json?v=1.8`;

    try {
      const response = await fetch(userJsonUrl);
      if (!response.ok) {
        throw new Error(`Error fetching user JSON for user with ID: ${userId}`);
      }

      const json = await response.json();
      const lbl1 = json.title;

      var s = new Float32Array(Object.values(json.descriptor));
      const bestMatch = faceMatcher.findBestMatch(s);
      console.log(bestMatch._distance);

      if (bestMatch._distance <= 0.51) {
        hidePleaseWait(); // Hide "Please wait" message when a face match is found

        recognizedLabel = lbl1;
        showResult(recognizedLabel); // Show the result
        matchData = 1;
        break;
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  var end = Date.now();
  var timeSpent = (end - begin) / 1000 + 'secs';

  console.log(timeSpent);
  if (matchData === 0) {
    hidePleaseWait(); // Hide "Please wait" message when no face match is found
    showResultFailure(); // Show the failure result
  }
}

function showResult(label) {
  // Display success message or take appropriate action
  Toastify({
    text: `🎉 Face matched: ${label}`,
    backgroundColor: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
    duration: 3000,
    className: "success",
    close: true,
    gravity: 'top',
    position: 'center',
    stopOnFocus: true,
    onClick: function () {
    },
    style: {
      fontFamily: 'cursive',
      fontSize: '15px',
      fontWeight: 'bold',
      color: 'linear-gradient(to right, #ff7e5f, #feb47b)',
      textAlign: 'center',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
  }).showToast();

  document.getElementById('btn').style.display = 'block';
}

function showResultFailure() {
  // Display failure message or take appropriate action
  Toastify({
    text: '😟 Oops! We couldn\'t find your face. Please try again with better lighting or adjust your camera position.',
    backgroundColor: 'red',
    duration: 5000,
    close: true,
    gravity: 'top',
    position: 'right',
    stopOnFocus: true,
    onClick: function () {
    }
  }).showToast();
}

// async function facecompare() {
//   const MODEL_URL = '/models';
//   var matchData = 0;
//   await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
//   await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
//   await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
//   await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

//   const img = document.getElementById('blah');
//   var begin = Date.now();
//   let faceDescriptions = await faceapi
//   .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
//   .withFaceLandmarks()
//   .withFaceDescriptors();


//   const faceMatcher = new faceapi.FaceMatcher(faceDescriptions);

//   const userJsonUrl = `${localStorage.loginemail}.json?v=1.7`;

//   try {
//     const response = await fetch(userJsonUrl);
//     const json = await response.json();
//     const lbl1 = json.title;
//     console.log(localStorage.loginemail);
//     console.log(lbl1);

//     if (lbl1 == localStorage.loginemail) {
//       console.log('match');
//       var s = new Float32Array(Object.values(json.descriptor));
//       const bestMatch = faceMatcher.findBestMatch(s);
//       console.log(bestMatch._distance);

//       if (bestMatch._distance <= 0.51) {
//         hidePleaseWait(); // Hide "Please wait" message when no face match is found

//         recognizedLabel = lbl1;
//         Toastify({
//           text: `🎉 Face matched: ${recognizedLabel}`,
//           backgroundColor: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
//           duration: 3000,
//           className: "success",
//           close: true,
//           gravity: 'top',
//           position: 'center',
//           stopOnFocus: true,
//           onClick: function () {
//           },
//           style: {
//             fontFamily: 'cursive',
//             fontSize: '15px',
//             fontWeight: 'bold',
//             color: 'linear-gradient(to right, #ff7e5f, #feb47b)',
//             textAlign: 'center',
//             padding: '20px',
//             borderRadius: '10px',
//             boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
//           },
//         }).showToast();
//         document.getElementById('btn').style.display = 'flex';
//         matchData = 1;
//       }
//     }
//   } catch (error) {
//     console.error('Error:', error);
//   }

//   var end = Date.now();
//   var timeSpent = (end - begin) / 1000 + 'secs';

//   alert(timeSpent);

//   if (matchData == 0) {
//     hidePleaseWait(); // Hide "Please wait" message when no face match is found

//     Toastify({
//       text: '😟 Oops! We couldn\'t find your face. Please try again with better lighting or adjust your camera position.',
//       backgroundColor: 'red',
//       duration: 5000,
//       close: true,
//       gravity: 'top',
//       position: 'right',
//       stopOnFocus: true,
//       onClick: function () {
//       }
//     }).showToast();
//   } else {
//     const numericTimeSpent = parseFloat(timeSpent);

//     try {
//       const response = await fetch('/storeData', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           recognizedLabel: recognizedLabel,
//           timeSpent: numericTimeSpent,
//         }),
//       });

//       const data = await response.json();
//       console.log(data);
//     } catch (error) {
//       console.error('Error sending data to server:', error);
//     }
//   }
// }


// async function facecompare1() {
//   const MODEL_URL = '/models';
//   var matchData = 0;
//   await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
//   await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
//   await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
//   await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

//   const img = document.getElementById('blah');
//   var begin = Date.now();
  
//     let faceDescriptions = await faceapi
//   .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
//   .withFaceLandmarks()
//   .withFaceDescriptors();


//   const faceMatcher = new faceapi.FaceMatcher(faceDescriptions);

//   for (let i = 0; i < jsonObj.length; i++) {
//     const userId = jsonObj[i].id;
//     const userJsonUrl = `/${userId}.json`;

//     try {
//       const response = await fetch(userJsonUrl);
//       if (!response.ok) {
//         throw new Error(`Error fetching user JSON for user with ID: ${userId}`);
//       }

//       const json = await response.json();
//       const lbl1 = json.title;

//       var s = new Float32Array(Object.values(json.descriptor));
//       const bestMatch = faceMatcher.findBestMatch(s);
//       console.log(bestMatch._distance);

//       if (bestMatch._distance <= 0.51) {
//         hidePleaseWait(); // Hide "Please wait" message when no face match is found

//         recognizedLabel = lbl1;
//         Toastify({
//           text: `🎉 Face matched: ${recognizedLabel}`,
//           backgroundColor: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
//           duration: 3000,
//           className: "success",
//           close: true,
//           gravity: 'top',
//           position: 'center',
//           stopOnFocus: true,
//           onClick: function () {

//           },
//           style: {
//             fontFamily: 'cursive',
//             fontSize: '15px',
//             fontWeight: 'bold',
//             color: 'linear-gradient(to right, #ff7e5f, #feb47b)',
//             textAlign: 'center',
//             padding: '20px',
//             borderRadius: '10px',
//             boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
//           },
//         }).showToast();

//         document.getElementById('btn').style.display = 'flex';
//         matchData = 1;
//         break;
//       }
//     } catch (error) {
//       console.error('Error:', error);
//     }
//   }

//   var end = Date.now();
//   var timeSpent = (end - begin) / 1000 + 'secs';

//   console.log(timeSpent);
//   if (matchData === 0) {
//     hidePleaseWait(); // Hide "Please wait" message when no face match is found

//     Toastify({
//       text: '😟 Oops! We couldn\'t find your face. Please try again with better lighting or adjust your camera position.',
//       backgroundColor: 'red',
//       duration: 5000,
//       close: true,
//       gravity: 'top',
//       position: 'right',
//       stopOnFocus: true,
//       onClick: function () {
//       }
//     }).showToast();
//   }
// }

function hidePleaseWait() {
  Swal.close(); // Close the "Please wait" message
}

// async function getval() {
//   showPleaseWait();
//   try {
//     const response = await fetch('/getimg', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!response.ok) {
//       throw new Error('Error fetching user data');
//     }

//     const data = await response.json();
//     jsonObj = [];

//     // Use Promise.all to fetch user data in parallel
//     await Promise.all(data.map(async (item) => {
//       const userJsonUrl = `/${item.user_id}.json`;
//       try {
//         const response = await fetch(userJsonUrl);
//         if (!response.ok) {
//           throw new Error(`Error fetching user JSON for user with ID: ${item.user_id}`);
//         }

//         const json = await response.json();
//         jsonObj.push({
//           title: json.title,
//           Imagepath: item.Imagepath,
//           id: item.id,
//           latitude: item.latitude,
//           longitude: item.longitude,
//         });
//       } catch (error) {
//         console.error('Error fetching user data:', error);
//       }
//     }));

//     // Perform face comparison after all user data is fetched
//     facecompare();
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }


async function facenew() {
  const MODEL_URL = '/models';
  var matchData = 0;
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

  const img = document.getElementById('blah');
  var begin = Date.now();
  let faceDescriptions = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();

  const faceMatcher = new faceapi.FaceMatcher(faceDescriptions);

  const labels = jsonObj;
  for (let i = 0; i < labels.length; i++) {
    var label = labels[i];
    const lbl = label.Imagepath;
    const lbl1 = label.title;
    const imgUrl = `profile/${lbl}`;
    const img = await faceapi.fetchImage(imgUrl);

    const singleResult = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    console.log(singleResult);

    if (singleResult) {
      const item = {};
      item['title'] = lbl1;
      item['singleResult'] = singleResult;
      jsonUserObj.push(item);

      const bestMatch = faceMatcher.findBestMatch(singleResult.descriptor);

      if (bestMatch._distance <= 0.51) {
        Swal.fire({
          icon: 'success',
          title: 'Face Match Result',
          text: `Face matched: ${lbl1}`,
        });
        document.getElementById('btn').style.display = 'block';
        matchData = 1;
        break;
      }
    }
  }

  var end = Date.now();
  var timeSpent = (end - begin) / 1000 + 'secs';

  if (matchData === 0) {
    Swal.fire({
      icon: 'error',
      title: 'Face not matched',
      text: 'Face not found',
    });
  }
}

async function face() {
  const MODEL_URL = '/models';

  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

  const img = document.getElementById('blah');
  console.time();

  // Detect faces, landmarks, descriptors, and expressions
  let faceDescriptions = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors()
    .withFaceExpressions();

  alert("1");
  console.log(faceDescriptions);
  faceDescriptions = faceapi.resizeResults(faceDescriptions, img);
  alert("2");
  console.log(faceDescriptions);

  const labels = jsonObj;

  const labeledFaceDescriptors = await Promise.all(
    labels.map(async (label) => {
      const lbl = label.Imagepath;
      const lbl1 = label.title;
      const imgUrl = `profile/${lbl}`;
      const img = await faceapi.fetchImage(imgUrl);
      console.log(imgUrl);
      const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

      if (!detections) {
        console.log('no');
        throw new Error(`No faces detected for ${lbl1}`);
      }

      const faceDescriptors = [detections.descriptor];
      console.log(faceDescriptors);

      return new faceapi.LabeledFaceDescriptors(lbl1, faceDescriptors);
    })
  );

  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  // Find best matches for each face description
  const results = faceDescriptions.map((fd) => faceMatcher.findBestMatch(fd.descriptor));
  console.log(results.length);

  if (results.length === 0 || results[0].label === 'unknown') {
    recognizedLabel = 'Unknown';
    Swal.fire({
      icon: 'error',
      title: 'Face not matched',
      text: 'Face not found',
    });
  } else {
    results.forEach((bestMatch, i) => {
      const box = faceDescriptions[i].detection.box;
      const text = bestMatch.toString();
      recognizedLabel = bestMatch._label;
      document.getElementById('btn').style.display = 'block';
      // const drawBox = new faceapi.draw.DrawBox(box, { label: text });
      // drawBox.draw(canvas);
    });

    Swal.fire({
      icon: 'success',
      title: 'Face Match Result',
      text: `Face matched: ${recognizedLabel}`,
    });
  }
  console.timeEnd();
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

function captureImage() {
  var canvas = document.createElement('canvas');
  var video = document.getElementById('video');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  var imageSrc = canvas.toDataURL('image/png');
  $('#blah').attr('src', imageSrc);
  video.pause();
  video.srcObject.getTracks().forEach(function (track) {
    track.stop();
  });
}

function storeCheckin(label, latitude, longitude, range_status) {
  const currentTime = new Date().toLocaleTimeString();
  Toastify({
    text: `🎉 Check-in successful\nFace match found: ${recognizedLabel}\nCheck-in Time: ${currentTime}`,
    backgroundColor: 'linear-gradient(to top, #a8edea 0%, #fed6e3 100%)',
    duration: 2500,
    className: "success",
    gravity: 'top',
    position: 'center',
    stopOnFocus: true,
    style: {
      fontFamily: 'cursive',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    },
  }).showToast();

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
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2500);
    })
    .catch((error) => {
      console.error('Error storing check-in time:', error);
      Toastify({
        text: '❌ Check-in Error\nFailed to store check-in time.',
        backgroundColor: '#ff7e5f',
        duration: 3000,
        className: "error",
        gravity: 'top',
        position: 'center',
        stopOnFocus: true,
        style: {
          fontFamily: 'cursive',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
      }).showToast();
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
        storeCheckoutTime(label, latitude, longitude, range_status, currentTime);


        Toastify({
          text: `🎉 Check-out successful\nCheck-out Time: ${currentTime}`,
          backgroundColor: 'linear-gradient(to top, #a8edea 0%, #fed6e3 100%)',
          duration: 2500,
          className: "success",
          gravity: 'top',
          position: 'center',
          stopOnFocus: true,
          style: {
            fontFamily: 'cursive',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333',  // Gradient text color
            textAlign: 'center',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          },
        }).showToast();
      } else {
        Toastify({
          text: '⚠️ Attendance Entry Missing\nYou need to record a "Punch-in" entry for today before "Punch-out".',
          backgroundColor: '#ffd166',
          duration: 4000,
          className: "warning",
          gravity: 'top',
          position: 'center',
          stopOnFocus: true,
          style: {
            fontFamily: 'cursive',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#333',
            textAlign: 'center',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          },
        }).showToast();
      }
    })
    .catch((error) => {
      console.error('Error checking attendance entry:', error);
      Toastify({
        text: '❌ Check-out Error\nFailed to check attendance entry.',
        backgroundColor: '#ff7e5f',
        duration: 3000,
        className: "error",
        gravity: 'top',
        position: 'center',
        stopOnFocus: true,
        style: {
          fontFamily: 'cursive',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
      }).showToast();
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
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2500);
    })
    .catch((error) => {
      console.error('Error storing checkout time:', error);
      Toastify({
        text: '❌ Checkout Error\nFailed to store checkout time.',
        backgroundColor: '#ff7e5f',
        duration: 3000,
        className: "error",
        gravity: 'top',
        position: 'center',
        stopOnFocus: true,
        style: {
          fontFamily: 'cursive',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#fff',
          textAlign: 'center',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
      }).showToast();
    });
}



function calculateRange(latitude, longitude) {
  return Math.abs(latitude - longitude);
}


function handleCheckout() {
  if (recognizedLabel) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
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
              storeCheckout(recognizedLabel, userLatitude, userLongitude, range_status);
            } else {
              Toastify({
                text: '⚠️ Checkout Time Expired\nYou can only checkout before 08:30 PM.',
                backgroundColor: '#ffd166',
                duration: 4000,
                className: "warning",
                gravity: 'top',
                position: 'center',
                stopOnFocus: true,
                style: {
                  fontFamily: 'cursive',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#333',
                  textAlign: 'center',
                  padding: '20px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                },
              }).showToast();
            }
          } else {
            range_status = 'onfield';
          }

          storeCheckout(recognizedLabel, userLatitude, userLongitude, range_status);
        },
        function (error) {
          console.error('Error getting geolocation:', error);
          Toastify({
            text: '⚠️ Location Not Found\nPlease ensure location is enabled and try again.',
            backgroundColor: '#ffd166',
            duration: 4000,
            className: "warning",
            gravity: 'top',
            position: 'center',
            stopOnFocus: true,
            style: {
              fontFamily: 'cursive',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333',
              textAlign: 'center',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }).showToast();
        }
      );
    } else {
      Toastify({
        text: '⚠️ Location Not Found\nPlease ensure location is enabled and try again.',
        backgroundColor: '#ffd166',
        duration: 4000,
        className: "warning",
        gravity: 'top',
        position: 'center',
        stopOnFocus: true,
        style: {
          fontFamily: 'cursive',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
      }).showToast();
    }
  } else {
    Toastify({
      text: '⚠️ Face Not Found\nFace not found. Please try again.',
      backgroundColor: '#ffd166',
      duration: 4000,
      className: "warning",
      gravity: 'top',
      position: 'center',
      stopOnFocus: true,
      style: {
        fontFamily: 'cursive',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      },
    }).showToast();
  }
}



function handleCheckin() {
  if (recognizedLabel) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
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
            } else {
              range_status = 'onfield';
            }

            storeCheckin(recognizedLabel, userLatitude, userLongitude, range_status);
          } else {
            Toastify({
              text: '⚠️ Check-in Time Not Yet Started\nYou can only check-in after 8:00 AM.',
              backgroundColor: '#ffd166',
              duration: 4000,
              className: "warning",
              gravity: 'top',
              position: 'center',
              stopOnFocus: true,
              style: {
                fontFamily: 'cursive',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#333',
                textAlign: 'center',
                padding: '20px',
                borderRadius: '10px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              },
            }).showToast();
          }
        },
        function (error) {
          console.error('Error getting geolocation:', error);
          Toastify({
            text: '⚠️ Location Not Found\nPlease ensure location is enabled and try again.',
            backgroundColor: '#ffd166',
            duration: 4000,
            className: "warning",
            gravity: 'top',
            position: 'center',
            stopOnFocus: true,
            style: {
              fontFamily: 'cursive',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#333',
              textAlign: 'center',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            },
          }).showToast();
        }
      );
    } else {
      Toastify({
        text: '⚠️ Location Not Found\nPlease ensure location is enabled and try again.',
        backgroundColor: '#ffd166',
        duration: 4000,
        className: "warning",
        gravity: 'top',
        position: 'center',
        stopOnFocus: true,
        style: {
          fontFamily: 'cursive',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333',
          textAlign: 'center',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
      }).showToast();
    }
  } else {
    Toastify({
      text: '⚠️ Face Not Found\nFace not found. Please try again.',
      backgroundColor: '#ffd166',
      duration: 4000,
      className: "warning",
      gravity: 'top',
      position: 'center',
      stopOnFocus: true,
      style: {
        fontFamily: 'cursive',
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      },
    }).showToast();
  }
}



function getUserLocation(label) {
  const user = jsonObj.find((item) => item.title === label);
  return { latitude: user.latitude, longitude: user.longitude };
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
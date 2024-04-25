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
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();

  const faceMatcher = new faceapi.FaceMatcher(faceDescriptions);

  await fetch('/usersdtl.json').then((response) => response.json()).then(json => {
    for (let i = 0; i < json.length; i++) {
      const lbl1 = json[i].title;

      var s = new Float32Array(Object.values(json[i].descriptor));
      const bestMatch = faceMatcher.findBestMatch(s);
      //console.log(bestMatch._distance);

      if (bestMatch._distance <= 0.51) {
        recognizedLabel = lbl1;
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

  }).catch(function (error) {
    console.error('Error:', error);
  })


  var end = Date.now();
  var timeSpent = (end - begin) / 1000 + "secs";

  alert(timeSpent);
  if (matchData == 0) {
    Swal.fire({
      icon: 'error',
      title: 'Face not matched',
      text: 'Face not found',
    });
  }
}
async function facecompare1() {
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

  // console.log(faceMatcher);    
  for (let i = 0; i < jsonObj.length; i++) {

    await fetch('/' + jsonObj[i].id + '.json').then((response) => response.json()).then(json => {

      // console.log(json);
      const lbl1 = json.title;

      var s = new Float32Array(Object.values(json.descriptor));
      const bestMatch = faceMatcher.findBestMatch(s);
      console.log(bestMatch._distance);
      if (bestMatch._distance <= 0.51) {
        recognizedLabel = lbl1
        Swal.fire({
          icon: 'success',
          title: 'Face Match Result',
          text: `Face matched: ${lbl1}`,
        });
        document.getElementById('btn').style.display = 'block';
        matchData = 1;

      }

      /* end */
    }).catch(function (error) {
      console.error('Error:', error);
    })
    if (matchData == 1) { break };
  }
  var end = Date.now();
  var timeSpent = (end - begin) / 1000 + "secs";

  alert(timeSpent);
  if (matchData == 0) {
    Swal.fire({
      icon: 'error',
      title: 'Face not matched',
      text: 'Face not found',
    });
  }
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

      //console.log(jsonObj);
      //face();
      //facenew();
      facecompare();
    })
    .catch((error) => {
      console.error('Error:', error);
    });

}

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
  //const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  //console.log(faceMatcher);
  //faceDescriptions = faceapi.resizeResults(faceDescriptions, img);  
  const labels = jsonObj;
  for (let i = 0; i < labels.length; i++) {
    var label = labels[i];
    const lbl = label.Imagepath;
    const lbl1 = label.title;
    const imgUrl = `profile/${lbl}`;
    const img = await faceapi.fetchImage(imgUrl);
    //$("#blah").attr("src","https://node.scaleedge.in/"  + imgUrl);
    //const img = await faceapi.fetchImage('https://node.scaleedge.in/' + imgUrl);
    //console.log(imgUrl); 
    //var img1=document.getElementById('blah');
    const singleResult = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    console.log(singleResult);
    if (singleResult) {
      const item = {};
      item['title'] = lbl1;
      item['singleResult'] = singleResult;
      jsonUserObj.push(item);
      const bestMatch = faceMatcher.findBestMatch(singleResult.descriptor)

      //console.log(imgUrl)
      //console.log(bestMatch.toString())
      //console.log(bestMatch);
      //console.log(bestMatch._distance);

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
  var timeSpent = (end - begin) / 1000 + "secs";
  //console.log(JSON.stringify(jsonUserObj));
  //alert(timeSpent);
  if (matchData == 0) {
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
  //$("#blah").attr("src","https://node.scaleedge.in/profile/sumit.jpg");
  const img = document.getElementById('blah');
  console.time();
  let faceDescriptions = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors()
    .withFaceExpressions();

  // let faceDescriptions = await faceapi
  //   .detectSingleFace(img)
  //   .withFaceLandmarks()
  //   .withFaceDescriptor()
  //   .withFaceExpressions();

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
      const distance = faceapi.euclideanDistance(faceDescriptions, detections);
      console.log('distance');
      console.log(distance);

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

  const results = faceDescriptions.map((fd) => faceMatcher.findBestMatch(fd.descriptor));
  console.log(results.length);
  if (results.length === 0 || results[0].label === "unknown") {
    recognizedLabel = "Unknown";
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
      //const drawBox = new faceapi.draw.DrawBox(box, { label: text })
      //drawBox.draw(canvas)
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
  fetch('/checkAttendanceEntry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ label }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.exists) {
        storeCheckinTime(label, latitude, longitude, range_status, currentTime);
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Attendance Entry Missing',
          text: 'You need to record an "Punch-in" entry for today before meeting-in.',
        });
      }
    })
    .catch((error) => {
      console.error('Error checking attendance entry:', error);
      Swal.fire({
        icon: 'error',
        title: 'Check-in Error',
        text: 'Failed to check attendance entry.',
      });
    });
}

function storeCheckout(label, latitude, longitude, range_status) {
  const currentTime = new Date().toLocaleTimeString();
  fetch('/checkAttendanceEntry', {
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
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Attendance Entry Missing',
          text: 'You need to record an "Punch-in" entry for today before meeting-in.',
        });
      }
    })
    .catch((error) => {
      console.error('Error checking attendance entry:', error);
      Swal.fire({
        icon: 'error',
        title: 'Check-in Error',
        text: 'Failed to check attendance entry.',
      });
    });
}

function storeCheckinTime(label, latitude, longitude, range_status, currentTime) {
  fetch('/storeMeetinTime', {
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
        title: 'Meeting-in successful',
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

function storeCheckoutTime(label, latitude, longitude, range_status) {
  const currentTime = new Date().toLocaleTimeString();
  fetch('/storeMeetoutTime', {
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
        title: 'Meeting out successful',
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
  if (recognizedLabel) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const userLatitude = position.coords.latitude;
          const userLongitude = position.coords.longitude;

          let range_status;
          const now = new Date();
          const checkinTime = new Date(now);
          checkinTime.setHours(8, 0, 0, 0);

          if (now >= checkinTime) {
            range_status = 'ok';
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Check-in Time Not Yet Started',
              text: 'You can only check-in after 8:00 AM.',
            });
          }
          storeCheckin(recognizedLabel, userLatitude, userLongitude, range_status);
        },
        function (error) {
          console.error('Error getting geolocation:', error);
          Swal.fire({
            icon: 'error',
            title: 'Geolocation Error',
            text: 'Failed to get geolocation.',
          });
        }
      );
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Geolocation Error',
        text: 'Geolocation is not supported by this browser.',
      });
    }
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Face Not Found',
      text: 'Face not found. Please try again.',
    });
  }
}

function handleCheckout() {
  if (recognizedLabel) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const userLatitude = position.coords.latitude;
          const userLongitude = position.coords.longitude;

          let range_status;

          const now = new Date();
          const checkoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 30);

          if (now < checkoutTime) {
            range_status = 'ok';
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Checkout Time Expired',
              text: 'You can only checkout before 08:30 PM.',
            });
          }
          storeCheckout(recognizedLabel, userLatitude, userLongitude, range_status);
        },
        function (error) {
          console.error('Error getting geolocation:', error);
          Swal.fire({
            icon: 'error',
            title: 'Geolocation Error',
            text: 'Failed to get geolocation.',
          });
        }
      );
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Geolocation Error',
        text: 'Geolocation is not supported by this browser.',
      });
    }
  } else {
    Swal.fire({
      icon: 'warning',
      title: 'Face Not Found',
      text: 'Face not found. Please try again.',
    });
  }
}



// function getUserLocation(label) {
//   const user = jsonObj.find((item) => item.title === label);
//   return { latitude: user.latitude, longitude: user.longitude };
// }


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

document.getElementById('meetin-btn').addEventListener('click', handleCheckin);
document.getElementById('meetout-btn').addEventListener('click', handleCheckout);
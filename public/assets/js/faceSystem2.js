let recognizedLabel = null;
let jsonObj = [];

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
      for (let i = 0; i < data.length; i++) {
        const item = {};
        item['title'] = data[i].user_id;
        item['Imagepath'] = data[i].Imagepath;
        jsonObj.push(item);
      }
      console.log(jsonObj);
      face();
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

async function face() {
  const MODEL_URL = '/models';

  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

  const img = document.getElementById('blah');
  let faceDescriptions = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors()
    .withFaceExpressions();
  faceDescriptions = faceapi.resizeResults(faceDescriptions, img);

  const labels = jsonObj;
  const labeledFaceDescriptors = await Promise.all(
    labels.map(async (label) => {
      const lbl = label.Imagepath;
      const lbl1 = label.title;
      const imgUrl = `profile/${lbl}`;
      const img = await faceapi.fetchImage(imgUrl);
      const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

      if (!detections) {
        console.log('no');
        throw new Error(`No faces detected for ${lbl1}`);
      }

      const faceDescriptors = [detections.descriptor];
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
        showConfirmButton: false,
        timer: 1500,
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




document.getElementById('checkin-btn').addEventListener('click', handleCheckin);
document.getElementById('checkout-btn').addEventListener('click', handleCheckout);
let recognizedLabel = null;
let jsonObj = [];
let jsonUserObj = [];
async function createjsonfile() {
  const MODEL_URL = '/models';
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

  const labels = jsonObj;

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const lbl = label.Imagepath;
    const lbl1 = label.title;
    const lblid = label.id;
    const imgUrl = `profile/${lbl}`;
    const img = await faceapi.fetchImage(imgUrl);
    const singleResult = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

    if (singleResult) {
      const item = {};
      item['title'] = lbl1;
      item['descriptor'] = singleResult.descriptor;

      // Save each user's data in a separate file
      const userFilePath = `/generateusersjson/${lbl1}.json`;
      await saveUserJson(item, userFilePath);
    }
  }

  alert('done');
}

// Function to save user JSON data to a file
async function saveUserJson(userData, filePath) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: filePath,
      type: 'POST',
      data: { usersjson: JSON.stringify(userData) },
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
      success: function (response) {
        console.log('File saved:', filePath);
        resolve(response);
      },
      error: function (err) {
        console.error('Error saving file:', filePath, err.statusText);
        reject(err);
      }
    });
  });
}

async function createjsonfile1(){

  const MODEL_URL = '/models';
  var matchData = 0;
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  const labels=jsonObj;
  for (let i=0; i<labels.length; i++){
    var label=labels[i];
    const lbl = label.Imagepath;
    const lbl1 = label.title;
    const lblid=label.id;
    const imgUrl = `profile/${lbl}`;
    const img = await faceapi.fetchImage(imgUrl);
    //console.log(imgUrl);
    const singleResult = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    
    //console.log(singleResult);
    if (singleResult) {
      const item = {};
      item['title'] = lbl1;
      //item['singleResult']=singleResult;
      item['descriptor']=singleResult.descriptor;
    //   item['detection']=singleResult.detection;
    //   item['landmarks']=singleResult.landmarks;
    //   item['unshiftedLandmarks']=singleResult.unshiftedLandmarks;
    //   item['alignedRect']=singleResult.alignedRect;
        $.ajax({
            url: '/generateusersjson',
            type: 'POST',
            data: { usersjson: JSON.stringify(item), userfilename: lblid + '.json'},
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            success: function (response) {
                console.log('IIII');
                console.log(response);
                // alert(response);
            
            },
            error: function (err) {
                alert(err.statusText);
            }
        });
        //jsonUserObj.push(item);
  
    }
   
  }
  const params = {
    usersjson: JSON.stringify(jsonUserObj)
    
  };
  
  alert('done');
}


function createusersjson(){
  alert("ss");  
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
        jsonObj.push(item);
      }
   
      createjsonfile();
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
        jsonObj.push(item);
      }
      
      //console.log(jsonObj);
      //face();
      facenew();
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  
}

async function facenew(){
  const MODEL_URL = '/models';
  var matchData = 0;
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);

  const img = document.getElementById('blah');
  var begin=Date.now();
  let faceDescriptions = await faceapi
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();
    
  const faceMatcher = new faceapi.FaceMatcher(faceDescriptions);
  //const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
  //console.log(faceMatcher);
  //faceDescriptions = faceapi.resizeResults(faceDescriptions, img);  
  const labels = jsonObj;
   for (let i=0; i<labels.length; i++){
      var label=labels[i];
      const lbl = label.Imagepath;
      const lbl1 = label.title;
      const imgUrl = `profile/${lbl}`;
      const img = await faceapi.fetchImage(imgUrl);
      //$("#blah").attr("src","https://node.scaleedge.in/"  + imgUrl);
      //const img = await faceapi.fetchImage('https://node.scaleedge.in/' + imgUrl);
      //console.log(imgUrl); 
      //var img1=document.getElementById('blah');
      const singleResult = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

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
        
        if (bestMatch._distance<=0.51){
          Swal.fire({
            icon: 'success',
            title: 'Face Match Result',
            text: `Face matched: ${lbl1}`,
          });
          document.getElementById('btn').style.display = 'block';
            matchData=1;
            break;
        }
        
      }

   }
   var end= Date.now();
   var timeSpent=(end-begin)/1000+"secs";
   console.log(JSON.stringify(jsonUserObj));
   //alert(timeSpent);
   if (matchData == 0){
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

function storeCheckout(label, latitude, longitude, range_status) {
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
        showConfirmButton: false,
        timer: 1500,
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
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const range = calculateRange(latitude, longitude);
          let range_status;

          const now = new Date();
          const checkinTime = new Date(now);
          checkinTime.setHours(8, 0, 0, 0); 

          if (now >= checkinTime) {
            if (range <= 60.0000) {
              range_status = 'ok';
              storeCheckin(recognizedLabel, latitude, longitude, range_status);
            } else {
              range_status = 'onfield';
              storeCheckin(recognizedLabel, latitude, longitude, range_status);
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
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          const range = calculateRange(latitude, longitude);
          let range_status;

          if (range <= 60.0000) {
            const now = new Date();
            const checkoutTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0); 

            if (now < checkoutTime) {
              range_status = 'ok';
              storeCheckout(recognizedLabel, latitude, longitude, range_status);
            } else {
              Swal.fire({
                icon: 'warning',
                title: 'Checkout Time Expired',
                text: 'You can only checkout before 20:00 PM.',
              });
            }
          } else {
            range_status = 'onfield';
            storeCheckout(recognizedLabel, latitude, longitude, range_status);
          }
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



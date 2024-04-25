const express = require("express");
const router = express.Router();
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const fs = require("fs");
const xlsx = require("xlsx");
const con = require("../database");
const XLSX = require('xlsx');
const fileUpload = require("express-fileupload");
const sharp = require("sharp");
const handlebars = require("express-handlebars");
const hbs = require("hbs");
const swal = require("sweetalert");
const Handlebars = require("handlebars");
router.use(fileUpload());
const path = require("path");
const { google } = require("googleapis");
const { JWT } = require("google-auth-library");
const checkUser = require('../middleware/checkUser')
const excel = require('exceljs');
const ip = require('ip');
const { networkInterfaces } = require('os');

const interfaces = networkInterfaces();
const macAddresses = new Set();

for (const interfaceName in interfaces) {
  const interfaceInfo = interfaces[interfaceName];
  for (const iface of interfaceInfo) {
    if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
      macAddresses.add(iface.mac);
    }
  }
}

console.log(Array.from(macAddresses), 123445666);



// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.session.user_group === 'admin') {
    next();
  } else {
    req.flash('message', "Your Session is expired please login again")

    res.redirect('/');
  }
}

// Middleware to check if user is regular user
function isUser(req, res, next) {
  if (req.session.user_group === 'user') {
    next();
  } else {
    req.flash('message', "Your Session is expired please login again")

    res.redirect('/');
  }
}


//calendar router for fetch calendar events
const serviceAccountKey = {
  type: "service_account",
  project_id: "myattendancesystem-401903",
  private_key_id: "1c585d88930672899453c0881e8f764d98785b9b",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCt9Oni42ivDxja\nTJuSi0APejUlpG62tQPo+cD+m9tHzHgIRwy2GUoBZIUVYWYA7WgfzaKGdDedZKR8\nZTU8MwASx9IqtlYWB8g1qEsC/XFkUACzJUGtO/iQvg0Z57zjyYWUPez2bpr9cpro\nK6P6e9hqyPiHGLvG8v3fqMig+gUUdIbpaGupkEsTwlOfq5A4Ilg6IiLVrRz+4BMN\n4VyxRoObhF4pBtGub8YSr+QijQMqXoHCbCS1aSLnEf2uunqmb/mnLjIV7YuEn+I8\nvPwp09FvNyea5OaQKkAdUA1HuX5+OLZLtk5i01FXSDdwbcAzjUzQCLDesro9KhtT\ndc22YD6TAgMBAAECggEACZT0r+o0N6kehqImOZq3Yxx2Ql+kN40qxqtaWmWHkEgu\nqzbaq0pWULnsOLX30k10nFFz39fiWyZfIKwxRy+AYNU/4HMEGxkmCb3LSY75rxUj\n2Yccu7TF2sph9CjXHaCM917rDaHtbwN5wLGF46pTTLWx0HABokV7mKIpg70+ojAE\nhcPJEYhrB7QlUK6MuXwMEg/8foAe9AA31Lb6vzaNDsu54h4i3HKm3kKYr3WazW7F\ni59gaLDoV93F+Aj3+yrw4z6JYRlpw+YwrIYf1SinVNjwW8Yq9SUr71TCDGzloUAG\n0NopePCtixGMwnrY6IusCiQ6AsvqJ94LnmR/ZJHb9QKBgQDZB8FaqDmogwVjI+vO\n/qn18i1404JOjRpIVhJjMi7gIVk+9OslS8jSAhYcQFoU3CitLZ14mEVZuLt2gpPV\nbZgbQQHV/1q4mD3uXk91E/5sovjwzyfHJzzJz6urkFCv89eQChDp87MLESrcUyLt\nR4xvHC4ZFOkaN4oCObX01uHINwKBgQDNMTEIBNQUxGF/tB2azLrB6SarjFw+zWX0\nH6LRX2Zr3ItdFPI5c+mHPHUtgm1uqTYt75tR2qefoEN2mUnE3LqP8hiZz52Mh/uY\nH6u3kmJs3jVK2Znal4u2eZ4g25ZqhjSjSHLQLxBiJdAZEXLkcEx6Ud1KhgSzmmoT\nPX8+XtWWhQKBgH5sJhXJKM0ghWLa6eIKNrct+48GpkFbsJOyj8N42BV3V6V0xgVT\nwAeVb4vFcLP2CzvV9oTpLny1P34pUjRhQtmdZJRjy1T8WhcgmOh6XRqrVJfyFBnO\noXptnnKx/k6AnHEra+7cJs+rkGwHgbD2nLeckr3JkH/VGm9xbqzQ/3TBAoGAEOQy\nyBk1qDv+VrfqE/s0iI/76fVVBqp78RvFmHzE/q4aHuCBjC85kzNr5gItpgVx+1gV\nLijU0bQsuY+m3fjZts3ULp1Dt/TdxkkdJrB7P8EPHAlLvA3rp2rdlJDfEgfYP3TQ\nVsj5DUtVlSq1jY6dDRi+IctkibB1eP4AAo9l/80CgYASNbcRNtKUPfqaxux9lj2x\nipNdcoGr6Bru+Ft9QC+8wxUgzM0wDcuxJ0/0yy3p+f9dzenQel6/hbchb4WJGmaV\nBFSA/n9ug5ceAriG8fsaF6liQokIpcWJn4aCIoDYVQiY+vdKDZUEh1sz7TxFTXN2\n5nga+FOd2bbMjMGhDVXAYA==\n-----END PRIVATE KEY-----\n",
  client_email:
    "payRoll-bhargav-110@myattendancesystem-401903.iam.gserviceaccount.com",
  client_id: "118294208194288726953",
};

const oauth2Client = new JWT({
  email: serviceAccountKey.client_email,
  key: serviceAccountKey.private_key,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
});

router.get("/oauth2callback", async (req, res) => {
  const { tokens } = await oauth2Client.authorize();
  oauth2Client.setCredentials(tokens);
});

router.get("/fetchEvents", async (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  const calendarId = "primary";

  calendar.events.list(
    {
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults: 10,
    },
    (err, response) => {
      if (err) {
        console.error("Error fetching events from Google Calendar:", err);
        res.status(500).json({ message: "Error fetching events" });
      } else {
        const events = response.data.items;
        res.json(events);
      }
    }
  );
});

//showAction Button custom Helper
hbs.registerHelper("showActionButton", function (data) {
  const inTime = data.time_in;
  const outTime = data.time_out;

  const rowDate = new Date(data.date_column);

  const currentDate = new Date();
  const differenceInDays = Math.floor(
    (currentDate - rowDate) / (1000 * 60 * 60 * 24)
  );

  if (inTime !== "--" && outTime !== "--") {
    return false;
  } else if (inTime !== "--" && outTime === "--") {
    return true;
  } else if (inTime === "--" && outTime !== "--") {
    return true;
  }
  return data.attendance_mark !== "Sunday" && differenceInDays < 30;
});

//argument custom Helper
hbs.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

//capital letter custom helper
hbs.registerHelper("capitalizeFirst", function (str) {
  if (typeof str !== "string") {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
});

//background colur change custom helper
hbs.registerHelper("getBackgroundColor", function (index) {
  const backgroundColors = [
    "#FFC107",
    "#FF5722",
    "#4CAF50",
    "#2196F3",
    "#E91E63",
    "#9C27B0",
    "#00BCD4",
    "#607D8B",
    "#FF9800",
    "#03A9F4",
    "#8BC34A",
    "#795548",
    "#9E9E9E",
    "#CDDC39",
    "#FFEB3B",
    "#FF9800",
    "#F44336",
    "#673AB7",
    "#009688",
    "#FFC107",
    "#3F51B5",
    "#FF5722",
    "#4CAF50",
    "#2196F3",
    "#E91E63",
    "#9C27B0",
    "#00BCD4",
    "#607D8B",
    "#FF9800",
    "#03A9F4",
    "#8BC34A",
    "#795548",
    "#9E9E9E",
    "#CDDC39",
    "#FFEB3B",
    "#FF9800",
    "#F44336",
    "#673AB7",
    "#009688",
    "#FFC107",
    "#3F51B5",
    "#FF5722",
    "#4CAF50",
    "#2196F3",
    "#E91E63",
    "#9C27B0",
    "#00BCD4",
    "#607D8B",
  ];
  return backgroundColors[index % backgroundColors.length];
});

//argument Helper router
hbs.registerHelper("eq", function (a, b, options) {
  return a === b ? options.fn(this) : options.inverse(this);
});

//google authentication router
passport.use(
  new GoogleStrategy(
    {
      clientID:
        "152929754189-jeal30nt1bodjqm4krhvbkqkeak8ahht.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: "http://localhost:7000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      return done(null, profile);
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

//login router
router.get("/", function (req, res, next) {
  res.render("login", { title: "Scaleedge", message: req.flash('message'), success: req.flash('success'), ogImage: "https://node.scaleedge.in/images/scaleedgeLogin.png", ogUrl: "https://node.scaleedge.in/", ogDescription: "An integrated HR system facilitating attendance tracking via facial recognition and seamless generation of salary payroll." });
});

router.get("/maintenance", function (req, res, next) {
  res.render("maintenance", { title: "scaleedge", message: req.flash('message') });
});

// Function to retrieve MAC address
function getMACAddress() {
  const { networkInterfaces } = require('os');
  const interfaces = networkInterfaces();
  const macAddresses = new Set();

  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    for (const iface of interfaceInfo) {
      if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
        macAddresses.add(iface.mac);
      }
    }
  }

  // Assuming you only want one MAC address, you can return the first one
  return Array.from(macAddresses)[0] || null;
}

// router.post("/auth_login", async function (req, res, next) {
//   try {
//     var email = req.body.email;
//     var password = req.body.password;
//     email = email.toLowerCase();
//     var sql = "CALL loginUser(?, ?);";
//     const result = await new Promise((resolve, reject) => {
//       con.query(sql, [email, password], function (err, result, fields) {
//         if (err) reject(err);
//         resolve(result);
//       });
//     });

//     var message = result[0][0].message;

//     if (message === "Login successful.") {
//       var userGroup = result[0][0].userGroup;
//       var userName = result[0][0].userName;
//       var imagePath = result[0][0].Imagepath;
//       var userType = result[0][0].userType;
//       var userAdhar = result[0][0].userAdhar;
//       var userPancard = result[0][0].userPancard;
//       var userEmployeeId = result[0][0].userEmployeeId;
//       var userId = email;

//       // Storing MAC address
//       var macAddress = getMACAddress();
//       if (macAddress) {
//         // Inserting into mac_address_table
//         con.query("INSERT INTO mac_address_table (user_id, mac_address) VALUES (?, ?)", [userId, macAddress], function (err, result) {
//           if (err) {
//             console.error('Error storing MAC address:', err);
//           } else {
//             console.log('MAC address stored successfully:', macAddress);
//           }
//         });
//       } else {
//         console.log('MAC address not found.');
//       }

//       req.session.macAddress = macAddress;

//       // Setting session variables
//       req.session.email = email;
//       req.session.user_group = userGroup;
//       req.session.isLoggedIn = true;
//       res.send({
//         success: true,
//         semail: email,
//         userGroup: userGroup,
//         userName: userName,
//         imagePath: imagePath,
//         userType: userType,
//         userAdhar: userAdhar,
//         userPancard: userPancard,
//         userEmployeeId: userEmployeeId,
//         macAddress : macAddress
//       });
//     } else {
//       res.send({ success: false, message: "Invalid email or password." });
//     }
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).send({ success: false, message: "Internal Server Error" });
//   }
// });



router.post("/auth_login", function (req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  email = email.toLowerCase();
  var sql = "CALL loginUser(?, ?);";
  con.query(sql, [email, password], function (err, result, fields) {
    if (err) throw err;
    var message = result[0][0].message;

    if (message === "Login successful.") {
      var userGroup = result[0][0].userGroup;
      var userName = result[0][0].userName;
      var imagePath = result[0][0].Imagepath;
      var userType = result[0][0].userType;
      var userAdhar = result[0][0].userAdhar;
      var userPancard = result[0][0].userPancard;
      // var userCity = result[0][0].userCity;
      // var userPincode = result[0][0].userPincode;
      var userEmployeeId = result[0][0].userEmployeeId;
      // var userMobile = result[0][0].userMobile;
      // var joiningDate = result[0][0].joiningDate;
      // var birthDate = result[0][0].birthDate;


      req.session.email = email;
      req.session.user_group = userGroup;
      req.session.isLoggedIn = true;
      res.send({
        success: true,
        semail: email,
        userGroup: userGroup,
        userName: userName,
        imagePath: imagePath,
        userType: userType,
        userAdhar: userAdhar,
        userPancard: userPancard,
        // userCity: userCity,
        // userPincode: userPincode,
        userEmployeeId: userEmployeeId,
        // userMobile: userMobile,
        // joiningDate: joiningDate,
        // birthDate: birthDate
      });
    } else {
      res.send({ success: false, message: "Invalid email or password." });
    }
  });
});


// Registeration router
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  con: true,
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "viveksingh2003e@gmail.com",
    pass: "sgraipgxdsrkfmyh",
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log("SMTP connection error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

router.get("/auth_reg", function (req, res, next) {
  res.render("register", { title: "scaleedge", message: req.flash('message') });
});

router.get("/registerationRequests", function (req, res, next) {
  const query = "SELECT * from user_master_new";
  con.query(query, function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }
    res.render("registerationRequests", {
      title: "scaleedge",
      manualData: results,
    });
  });
});

router.get("/registerationRequests1/:id", checkUser, function (req, res, next) {
  var userId = req.params.id;
  var selectSql = "SELECT * FROM user_master_new WHERE id = ?";
  con.query(selectSql, [userId], function (err, result) {
    if (err) {
      throw err;
    }
    if (result.length > 0) {
      res.render("registerationShow", {
        title: "scaleedge",
        user: result[0],
      });
    } else {
      res.redirect("/usermanagement");
    }
  });
});

router.get("/downloadExcel", isAdmin, (req, res) => {
  try {
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sheet 1');

    // Add headers to the worksheet
    const headers = [
      'First & Last Name',
      'Office Email',
      'Personal Email',
      'Mobile Number',
      'Password',
      'Image',
      'User Type (office & sales)',
      'Branch',
      'Annual Salary',
      'Travel Allowance',
      'Street Address',
      'House Number',
      'City',
      'State',
      'Pincode',
      'Landmark',
      'Aadhar Card',
      'Pan Card',
      'Position',
      'Department',
      'Joining Date',
      'Birth Date',
      'Reporting To'
    ];
    worksheet.addRow(headers);

    // Set up a sample row with default values
    const sampleRow = headers.reduce((row, header) => {
      row[header] = ''; // Set default values here if needed
      return row;
    }, {});

    // Add a sample row to the worksheet

    worksheet.addRow(sampleRow);

    // Set response headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sample.xlsx');

    // Write the Excel file to the response
    workbook.xlsx.write(res).then(() => {
      res.end();
    });
  } catch (error) {
    console.error("Error creating Excel file:", error);
    res.status(500).send("Internal Server Error");
  }
});


const excelDateToJSDate = (serial) => {
  const excelDate = new Date((serial - 1 + 1) * 86400 * 1000 + Date.UTC(1899, 11, 30));
  const year = excelDate.getFullYear();
  const month = excelDate.getMonth() + 1; // Month index starts from 0
  const day = excelDate.getDate();

  // Ensure leading zeros for month and day
  const formattedMonth = month < 10 ? `0${month}` : `${month}`;
  const formattedDay = day < 10 ? `0${day}` : `${day}`;

  return `${year}-${formattedMonth}-${formattedDay}`;
};


router.post("/importExcel", (req, res) => {
  try {
    const workbook = xlsx.read(req.files.excelFile.data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    data.forEach((row) => {
      const {
        'First & Last Name': user_name,
        'Office Email': email,
        'Mobile Number': mobile,
        'Password': password,
        'User Type (office & sales)': user_type,
        'Image': Imagepath,
        'Branch': branch,
        'Annual Salary': annual_salary,
        'Travel Allowance': km_rupees,
        'Personal Email': personal_email,
        'Street Address': street_address,
        'House Number': house,
        'City': city,
        'State': state,
        'Pincode': pincode,
        'Landmark': landmark,
        'Aadhar Card': Adhar,
        'Pan Card': Pancard,
        'Position': position,
        'Department': department,
        'Joining Date': joining_date_serial, // Include Joining Date field
        'Birth Date': birth_date_serial, // Include Birth Date field
        'Reporting To': reportingTo
      } = row;

      // Convert Excel serial numbers to proper date strings
      const joining_date = excelDateToJSDate(joining_date_serial);
      const birth_date = excelDateToJSDate(birth_date_serial);

      const nameFirstTwoLetters = user_name.substring(0, 2).toUpperCase();
      const employeeId = `SCALEEDGE#${nameFirstTwoLetters}`;

      const sql = `INSERT INTO user_master (
        user_id,
        user_name,
        email,
        mobile,
        password,
        user_group,
        Imagepath,
        user_type,
        annual_salary,
        latitude,
        longitude,
        km_rupees,
        company_id,
        deleted_b,
        personal_email,
        street_address,
        house,
        city,
        state,
        pincode,
        landmark,
        Adhar,
        Pancard,
        employee_id,
        branch,
        position,
        department,
        joining_date,
        birth_date,
        reportingTo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`;

      con.query(
        sql,
        [
          email,
          user_name,
          email,
          mobile,
          password,
          'user', // Assuming 'user_group' is a constant value
          Imagepath,
          user_type,
          annual_salary,
          "27.5944", // Assuming 'latitude' and 'longitude' are available in your scope
          "76.6167",
          km_rupees,
          "1",
          "N",
          personal_email,
          street_address,
          house,
          city,
          state,
          pincode,
          landmark,
          Adhar,
          Pancard,
          employeeId,
          branch,
          position,
          department,
          joining_date,
          birth_date,
          reportingTo
        ],

        (err, result) => {
          if (err) {
            console.error("Error inserting data into MySQL:", err);
          } else {
            console.log("Data inserted successfully");
          }
        }
      );
    });

    res.status(200).send("Data imported successfully");
  } catch (error) {
    console.error("Error processing Excel file:", error);
    res.status(500).send("Internal Server Error");
  }
});




// router.post("/registerationRequests", function (req, res, next) {
//   const userId = req.body.id;
//   const user = {
//     user_id: req.body.user_id,
//     user_name: req.body.user_name,
//     email: req.body.email,
//     mobile: req.body.mobile,
//     password: req.body.password,
//     user_group: req.body.user_group,
//     company_id: req.body.company_id,
//     deleted_b: req.body.deleted_b,
//   };

//   const insertSql = "INSERT INTO user_master SET ?, created_on = NOW()";
//   con.query(insertSql, user, function (err, result) {
//     if (err) {
//       throw err;
//     }

//     const deleteSql = "DELETE FROM user_master_data WHERE id = ?";
//     con.query(deleteSql, [userId], function (err, result) {
//       if (err) {
//         throw err;
//       }

//       res.redirect("/dashboard");
//     });
//   });
// });

router.post("/registerationRequests", function (req, res, next) {
  var userId = req.body.id;
  var action = req.body.action;

  if (action === "approve") {
    var selectSql = "SELECT * FROM user_master_new WHERE id = ?";
    con.query(selectSql, [userId], function (err, result) {
      if (err) {
        throw err;
      }

      if (result.length > 0) {
        var userData = result[0];

        var insertSql =
          "INSERT INTO user_master (user_id, user_name, email, mobile, password, user_group, company_id, deleted_b, created_on, Imagepath, annual_salary, latitude, longitude, user_type, joining_date, birth_date, personal_email, street_address, house, city, state, pincode, landmark, Adhar, Pancard, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)";
        con.query(
          insertSql,
          [
            userData.user_id,
            userData.user_name,
            userData.email,
            userData.mobile,
            userData.password,
            userData.user_group,
            '1',
            'N',
            userData.Imagepath,
            userData.annual_salary,
            userData.latitude,
            userData.longitude,
            'office',
            userData.joining_date,
            userData.birth_date,
            userData.personal_email,
            userData.street_address,
            userData.house,
            userData.city,
            userData.state,
            userData.pincode,
            userData.landmark,
            userData.Adhar,
            userData.Pancard,
            userData.employee_id
          ],
          function (err, result) {
            if (err) {
              throw err;
            }

            var deleteSql = "DELETE FROM user_master_new WHERE id = ?";
            con.query(deleteSql, [userId], function (err, result) {
              if (err) {
                throw err;
              }

              sendApprovalEmail(userData);

              res.json({ success: true }); // Return success as JSON response
            });
          }
        );
      } else {
        res.json({ success: false, message: 'User not found' });
      }
    });
  } else if (action === "reject") {
    var deleteSql = "DELETE FROM user_master_new WHERE id = ?";
    con.query(deleteSql, [userId], function (err, result) {
      if (err) {
        throw err;
      }
      sendRejectionEmail(req.body.email);
      res.json({ success: true }); // Return success as JSON response
    });
  }
});

router.post("/bulkApproveUsers", function (req, res, next) {
  var userIds = req.body.userIds;

  userIds.forEach(userId => {
    var selectSql = "SELECT * FROM user_master_new WHERE id = ?";
    con.query(selectSql, [userId], function (err, result) {
      if (err) {
        throw err;
      }

      if (result.length > 0) {
        var userData = result[0];

        var insertSql =
          "INSERT INTO user_master (user_id, user_name, email, mobile, password, user_group, company_id, deleted_b, created_on, Imagepath, annual_salary, latitude, longitude, user_type, joining_date, birth_date, personal_email, street_address, house, city, state, pincode, landmark, Adhar, Pancard, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)";
        con.query(
          insertSql,
          [
            userData.user_id,
            userData.user_name,
            userData.email,
            userData.mobile,
            userData.password,
            userData.user_group,
            '1',
            'N',
            userData.Imagepath,
            '0',
            userData.latitude,
            userData.longitude,
            'office',
            userData.joining_date,
            userData.birth_date,
            userData.personal_email,
            userData.street_address,
            userData.house,
            userData.city,
            userData.state,
            userData.pincode,
            userData.landmark,
            userData.Adhar,
            userData.Pancard,
            userData.employee_id
          ],
          function (err, result) {
            if (err) {
              throw err;
            }

            var deleteSql = "DELETE FROM user_master_new WHERE id = ?";
            con.query(deleteSql, [userId], function (err, result) {
              if (err) {
                throw err;
              }

              sendApprovalEmail(userData);
            });
          }
        );
      }
    });
  });

  res.json({ success: true });
});


function sendApprovalEmail(userData) {
  const mailOptions = {
    from: "viveksingh2003e@gmail.com",
    to: userData.email,
    subject: "Your Application Was Approved",
    html: `<p>Hello ${userData.user_name},</p>
           <p>Your registration request has been approved. Here are your account details:</p>
           <p>Name: ${userData.user_name}</p>
           <p>Email: ${userData.email}</p>
           <p>Password: ${userData.password}</p>
           <p>Click the following link to access your account: <a href="https://node.scaleedge.in/">ScaleEdge Solution</a></p>`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Email sending error: " + error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

function sendRejectionEmail(userEmail) {
  const mailOptions = {
    from: "viveksingh2003e@gmail.com",
    to: userEmail,
    subject: "Your Application Was Rejected",
    html: "<p>We regret to inform you that your registration request has been rejected by ScaleEdge.</p>",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Rejection email sending error: " + error);
    } else {
      console.log("Rejection email sent: " + info.response);
    }
  });
}

router.post("/checkEmailExists", (req, res) => {
  const email = req.body.email;

  const selectEmailSql = "SELECT * FROM user_master WHERE email = ?";
  con.query(selectEmailSql, [email], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }

    if (result && result.length > 0) {
      return res.json({ emailExists: true });
    } else {
      return res.json({ emailExists: false });
    }
  });
});

router.post("/auth_reg", function (req, res, next) {
  var company_name = req.body.company_name;
  var address = req.body.address;
  var email = req.body.email;
  var mobile = req.body.mobile;
  var password = req.body.password;
  var cpassword = req.body.cpassword;
  var annual_salary = req.body.annual_salary;
  var name = req.body.name;
  var birth_date = req.body.birth_date;
  var registrationType = req.body.registrationType;
  var profileImage = req.files.Imagepath;
  var Imagepath = "public/profile/" + profileImage.name;
  var Imagename = profileImage.name;
  if (registrationType === "google") {
    res.redirect("/auth/google");
  } else {
    if (cpassword == password) {
      var insertSql = "CALL insert_company_user2 (?, ?, ?, ?, ?, ?, ?, ?,?);";
      con.query(
        insertSql,
        [company_name, address, email, mobile, password, name, Imagename, annual_salary, birth_date],
        function (err, result, fields) {
          if (err) throw err;

          if (result.affectedRows > 0) {
            profileImage.mv(Imagepath, function (err) {
              if (err) {
                console.error("Failed to save profile image:", err);
              }
            });
            const mailOptions = {
              from: "sumit@scaleedge.in",
              to: email,
              subject: "Application has been sent to the administrator...",
              html: `<p>
              Your application has been sent to the administrator. If the administrator approves, you will receive the mail!</p>
                <p>Name: ${name}</p>                
                <p>Email: ${email}</p>
                <p>Password: ${password}</p>
                <p>Click the following link to access your account: <a href="https://node.scaleedge.in/">ScaleEdge Solution</a></p>
                `,
            };

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log("Email sending error:", error);
              } else {
                console.log("Email sent: " + info.response);
              }
            });

            res.redirect("/");
          } else {
            res.redirect("/");
          }
        }
      );
    } else {
      res.redirect("/");
    }
  }
});

router.get("/registerationShow/:id", isAdmin, checkUser, function (req, res, next) {
  var userId = req.params.id;
  var selectSql =
    "SELECT id, user_name, email, mobile, Imagepath, user_group, joining_date, annual_salary, latitude, longitude FROM user_master_new WHERE id = ?";
  con.query(selectSql, [userId], function (err, result) {
    if (err) {
      throw err;
    }

    if (result.length > 0) {
      var formattedJoiningDate = new Date(result[0].joining_date)
        .toISOString()
        .split("T")[0];
      var annualSalary = parseFloat(result[0].annual_salary);
      res.render("registerationShow", {
        title: "scaleedge",
        user: result[0],
        formattedJoiningDate: formattedJoiningDate,
        annualSalary: annualSalary,
      });
    }
  });
});

//google auth_reg router
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  function (req, res) {
    var user = req.user;

    var firstName = user.displayName.split(" ")[0];
    var password = firstName + "@11";

    var selectSql =
      "SELECT email, user_group FROM user_master WHERE user_id = ?";
    con.query(selectSql, [user.id], function (err, result, fields) {
      if (err) {
        console.error("An error occurred while checking user data:", err);
        res.redirect("/");
      } else {
        if (result.length > 0) {
          req.session.email = result[0].email;
          req.session.user_group = result[0].user_group;
          res.redirect("/?emailExists=true");
        } else {
          var insertSql =
            "INSERT INTO user_master (user_id, email, user_name, Imagepath, password, user_group, mobile, company_id, deleted_b, created_on) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())";
          con.query(
            insertSql,
            [
              user.emails[0].value,
              user.emails[0].value,
              user.displayName,
              "monica.jpg",
              password,
              "admin",
              "null",
              "1",
              "Y",
            ],
            function (err, result, fields) {
              if (err) {
                console.error(
                  "An error occurred while inserting user data:",
                  err
                );
                res.redirect("/");
              } else {
                if (result.affectedRows > 0) {
                  req.session.email = user.emails[0].value;
                  req.session.user_group = "admin";
                  res.redirect("/dashboard");
                } else {
                  res.redirect("/");
                }
              }
            }
          );
        }
      }
    });
  }
);

//check email exists router
router.post("/check_email_exists", function (req, res, next) {
  var email = req.body.email;

  con.query(
    "CALL CheckEmailExists(?, @emailExists)",
    [email],
    function (err, result, fields) {
      if (err) {
        res.status(500).json({ exists: false });
        return;
      }

      con.query(
        "SELECT @emailExists AS emailExists",
        function (err, result, fields) {
          if (err) {
            res.status(500).json({ exists: false });
            return;
          }

          var emailExists = result[0].emailExists;
          if (emailExists) {
            res.json({ exists: true });
          } else {
            res.json({ exists: false });
          }
        }
      );
    }
  );
});

//dashboard router
function getUserInfoByEmail(email, callback) {
  con.query(
    "SELECT user_name, Imagepath, email FROM user_master WHERE email = ?",
    [email],
    function (err, userRows) {
      if (err) {
        console.error(err);
        return callback(err, null);
      }
      const user = userRows[0];
      callback(null, user);
    }
  );
}
router.get('/dashboard', function (req, res) {
  const user_group = req.session.user_group;

  // Check if user_group is 'admin'
  if (user_group === 'admin') {
    res.render('dashboard', { title: 'Admin Dashboard' });
  } else {
    res.redirect('/userdashboard');
  }
});

router.get("/dashboard/json", checkUser, async function (req, res, next) {
  try {
    const user_group = req.session.user_group;
    const user_email = req.session.email;

    const result = await new Promise((resolve, reject) => {
      con.query("CALL GetDashboardData(?, ?)", [user_group, user_email], function (err, rows) {
        if (err) {
          console.error(err);
          reject("Internal Server Error");
        } else {
          resolve(rows[0]);
        }
      });
    });

    if (user_group === "admin") {
      const totalPendingRequests = result.length;

      const [manualRows, userCountRows, totalUsersRows, activeUsersRows, inactiveUsersRows, onHoldUsersRows, totalLoanRequestsRows] = await Promise.all([
        queryAsync("SELECT COUNT(*) AS totalAttendanceRequests FROM manual WHERE status = 'pending'"),
        queryAsync("SELECT COUNT(*) AS totalRegisterUsers FROM user_master_new"),
        queryAsync("SELECT COUNT(*) AS totalUsers FROM user_master"),
        queryAsync("SELECT COUNT(*) AS totalActiveUsers FROM user_master WHERE status = 'active'"),
        queryAsync("SELECT COUNT(*) AS totalInactiveUsers FROM user_master WHERE status = 'inactive'"),
        queryAsync("SELECT COUNT(*) AS totalOnHoldUsers FROM user_master WHERE status = 'onhold'"),
        queryAsync("SELECT COUNT(*) AS totalLoanRequests FROM loan_approval_table where status='Pending'")
      ]);

      const totalAttendanceRequests = manualRows[0].totalAttendanceRequests;
      const totalRegisterUsers = userCountRows[0].totalRegisterUsers;
      const totalUsers = totalUsersRows[0].totalUsers;
      const totalActiveUsers = activeUsersRows[0].totalActiveUsers;
      const totalInactiveUsers = inactiveUsersRows[0].totalInactiveUsers;
      const totalOnHoldUsers = onHoldUsersRows[0].totalOnHoldUsers;
      const totalLoanRequests = totalLoanRequestsRows[0].totalLoanRequests;

      const currentDate = new Date();
      const dateString = currentDate.toISOString().split("T")[0];

      res.json({
        message: "Dashboard Data",
        totalPendingRequests,
        totalAttendanceRequests,
        totalUsers,
        totalActiveUsers,
        totalInactiveUsers,
        totalOnHoldUsers,
        dateString,
        totalLoanRequests,
        totalRegisterUsers
      });
    } else {
      res.status(403).json({ error: "Forbidden" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

function queryAsync(sql) {
  return new Promise((resolve, reject) => {
    con.query(sql, function (err, rows) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// router.get("/dashboard", checkUser, function (req, res, next) {
//   const user_group = req.session.user_group;
//   const user_email = req.session.email;

//   con.query(
//     "CALL GetDashboardData(?, ?)",
//     [user_group, user_email],
//     function (err, rows) {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Internal Server Error");
//       }

//       const result = rows[0];

//       if (user_group === "admin") {
//         const totalPendingRequests = result.length;

//         con.query(
//           "SELECT COUNT(*) AS totalAttendanceRequests FROM manual WHERE status = 'pending'",
//           function (err, manualRows) {
//             if (err) {
//               console.error(err);
//               return res.status(500).send("Internal Server Error");
//             }

//             const totalAttendanceRequests =
//               manualRows[0].totalAttendanceRequests;

//             con.query(
//               "SELECT COUNT(*) AS totalUsers FROM user_master",
//               function (err, userCountRows) {
//                 if (err) {
//                   console.error(err);
//                   return res.status(500).send("Internal Server Error");
//                 }

//                 const totalUsers = userCountRows[0].totalUsers;

//                 // New queries to count active, inactive, and on-hold users
//                 con.query(
//                   "SELECT COUNT(*) AS totalActiveUsers FROM user_master WHERE status = 'active'",
//                   function (err, activeUsersRows) {
//                     if (err) {
//                       console.error(err);
//                       return res.status(500).send("Internal Server Error");
//                     }

//                     const totalActiveUsers = activeUsersRows[0].totalActiveUsers;

//                     con.query(
//                       "SELECT COUNT(*) AS totalInactiveUsers FROM user_master WHERE status = 'inactive'",
//                       function (err, inactiveUsersRows) {
//                         if (err) {
//                           console.error(err);
//                           return res.status(500).send("Internal Server Error");
//                         }

//                         const totalInactiveUsers = inactiveUsersRows[0].totalInactiveUsers;

//                         con.query(
//                           "SELECT COUNT(*) AS totalOnHoldUsers FROM user_master WHERE status = 'onhold'",
//                           function (err, onHoldUsersRows) {
//                             if (err) {
//                               console.error(err);
//                               return res.status(500).send("Internal Server Error");
//                             }

//                             const totalOnHoldUsers = onHoldUsersRows[0].totalOnHoldUsers;

//                             const currentDate = new Date();
//                             const dateString = currentDate.toISOString().split("T")[0];


// con.query(
//   "SELECT COUNT(*) AS totalLoanRequests FROM loan_approval_table where status='Pending'",
//   function (err, totalLoanRequestsRows) {
//     if (err) {
//       console.error(err);
//       return res.status(500).send("Internal Server Error");
//     }

//     const totalLoanRequests = totalLoanRequestsRows[0].totalLoanRequests;

//                                     // Render the dashboard template with all counts
//                                     res.render("dashboard", {
//                                       message: "Welcome, " + user_email,
//                                       rows: result,
//                                       totalPendingRequests: totalPendingRequests,
//                                       totalAttendanceRequests: totalAttendanceRequests,
//                                       totalUsers: totalUsers,
//                                       totalActiveUsers: totalActiveUsers,
//                                       totalInactiveUsers: totalInactiveUsers,
//                                       totalOnHoldUsers: totalOnHoldUsers,
//                                       // dashboardTrackerData: dashboardTrackerResult,
//                                       totalLoanRequests: totalLoanRequests,
//                                     });
//                               }
//                             );
//                           }
//                         );
//                       }
//                     );
//                   }
//                 );
//               }
//             );
//           }
//         );
//       } else if (user_group === "user") {
//         res.redirect("/userdashboard");
//       } else {
//         res.redirect("/");
//       }
//     }
//   );
// });

router.get('/getTodayActivity', async function (req, res, next) {
  try {
    const currentDate = new Date();
    const dateString = currentDate.toISOString().split('T')[0];

    // Call the stored procedure 'dashboardTracker' for today's date
    const rows = await new Promise((resolve, reject) => {
      con.query('CALL dashboardTracker(?)', [dateString], function (err, rows) {
        if (err) reject(err);
        resolve(rows);
      });
    });

    // Extract the data from the stored procedure result
    const dashboardData = rows[0];

    // Extract present, absent, and halfday user counts
    const presentUsers = dashboardData.filter(user => user.attendance_mark === 'Present').length;
    const absentUsers = dashboardData.filter(user => user.attendance_mark === 'Absent').length;
    const halfdayUsers = dashboardData.filter(user => user.attendance_mark === 'Half Day').length;

    // Construct response object
    const response = {
      dashboardData: dashboardData,
      presentUsers: presentUsers,
      absentUsers: absentUsers,
      halfdayUsers: halfdayUsers
    };

    // Send the data as JSON response
    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard data: ' + error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/dashboardTrackerTotal', (req, res) => {
  const currentDate = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD format

  // Call the stored procedure with the current date
  con.query(
    'CALL dashboardTrackerTotal(?)',
    [currentDate],
    (error, results) => {
      if (error) {
        res.status(500).json({ error: 'Internal Server Error' });
        throw error;
      }

      // Results will be an array with a single element containing the result of the stored procedure
      const dashboardTrackerTotal = results[0][0];

      // Send the result as JSON
      res.json(dashboardTrackerTotal);
    }
  );
});

router.get('/dashboard-month-total', (req, res) => {
  con.query('CALL dashboardMonthTotal()', (error, results, fields) => {
    if (error) {
      console.error('Error executing stored procedure: ', error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log(results); // Log the results here

    res.json(results);
  });
});

// router.get("/dashboard", checkUser, function (req, res, next) {
//   const user_group = req.session.user_group;
//   const user_email = req.session.email;

//   con.query(
//     "CALL GetDashboardData(?, ?)",
//     [user_group, user_email],
//     function (err, rows) {
//       if (err) {
//         console.error(err);
//         return res.status(500).send("Internal Server Error");
//       }

//       const result = rows[0];

//       if (user_group === "admin") {
//         const totalPendingRequests = result.length;

//         con.query(
//           "SELECT COUNT(*) AS totalAttendanceRequests FROM manual WHERE status = 'pending'",
//           function (err, manualRows) {
//             if (err) {
//               console.error(err);
//               return res.status(500).send("Internal Server Error");
//             }

//             const totalAttendanceRequests =
//               manualRows[0].totalAttendanceRequests;

//             con.query(
//               "SELECT COUNT(*) AS totalUsers FROM user_master_data",
//               function (err, userCountRows) {
//                 if (err) {
//                   console.error(err);
//                   return res.status(500).send("Internal Server Error");
//                 }

//                 const totalUsers = userCountRows[0].totalUsers;

//                 res.render("dashboard", {
//                   message: "Welcome, " + user_email,
//                   rows: result,
//                   totalPendingRequests: totalPendingRequests,
//                   totalAttendanceRequests: totalAttendanceRequests,
//                   totalUsers: totalUsers,
//                 });
//               }
//             );
//           }
//         );
//       } else if (user_group === "user") {
//         res.redirect("/userdashboard");
//       } else {
//         res.redirect("/");
//       }
//     }
//   );
// });

//dashboardLeave router
router.get("/dashboardLeave", isAdmin, checkUser, function (req, res, next) {
  const user_email = req.session.email;
  const user_group = req.session.user_group;

  con.query(
    "CALL GetDashboardData(?, ?)",
    [user_group, user_email],
    function (err, rows) {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

      const result = rows[0];

      result.forEach((row) => {
        row.daysGreaterThanOne = row.days > 1;
      });

      res.render("dashboardLeave", {
        message: "Welcome, " + user_email,
        rows: result,
        totalPendingRequests: result.length,
      });
    }
  );
});

// Route to handle leave approval or rejection
router.post("/approveRejectLeave", function (req, res) {
  const leaveId = req.body.leaveId;
  const action = req.body.action;
  const userEmail = req.session.email;

  con.query(
    "SELECT id, email as user_email FROM user_master WHERE email = ?",
    [userEmail],
    function (err, userResult) {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

      if (userResult.length === 0) {
        // User not found, handle accordingly
        return res.status(404).send("User not found");
      }

      const userId = userResult[0].id;
      const userEmailAddress = userResult[0].user_email;
      const status = action === "approve" ? "approved" : "rejected";

      con.query(
        "UPDATE tblattendance SET approve_b = ?, approved_by = ?, status = ? WHERE id = ?",
        [action === "approve" ? "y" : "n", userId, status, leaveId],
        function (err, result) {
          if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
          }

          // Send email to the user
          const mailOptions = {
            from: 'viveksingh2003e@gmail.com',
            to: userEmailAddress,
            subject: `Leave ${action}d`,
            text: `Your leave request has been ${action}d.`
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log("Email sending error:", error);
            } else {
              console.log("Email sent:", info.response);
            }
          });

          // Send a success response
          res.json({
            success: true,
            message: `Leave ${action}d successfully. Email sent to user.`,
          });
        }
      );
    }
  );
});


//details of particular user router
router.get("/details/:user_name", isAdmin, checkUser, function (req, res, next) {
  const user_name = req.params.user_name;
  con.query("CALL user_in_out(?)", [user_name], (err, rows) => {
    if (!err) {
      getUserInfoByEmail(req.session.email, function (err, user) {
        if (err) {
          console.error(err);
          return res.status(500).send("Internal Server Error");
        }

        res.render("details", {
          rows: rows[0],
          message: "Welcome, " + user.email,
        });
      });
    } else {
      console.log(err);
    }
    console.log("The data from attendance table: \n", rows[0]);
  });
});

// userdashboard router
function sendBirthdayEmail(userEmail, userName) {
  const transporter = nodemailer.createTransport({
    con: true,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'viveksingh2003e@gmail.com',
      pass: 'sgraipgxdsrkfmyh',
    },
  });

  // Inline styles and script
  const inlineStyles = `<style>
  @import url(https://fonts.googleapis.com/css?family=Nobile:400italic,700italic);
  @import url(https://fonts.googleapis.com/css?family=Dancing+Script);

  body{

    margin: 0;
  
    padding: 16px;
  
    /* background: #512da8; */
  
    
  
  }
  
  .birthday-card{
  
    margin: 40px auto;
  
    padding: 16px;
  
    max-width: 400px;
  
    background-color: #fff;
  
    text-align: center;
  
    /* text-transform: uppercase; */
  
    box-shadow: 0 24px 40px -8px #311b92;
  
  }
  
  .birthday-card img{
  
    width: 100%;
  
    
  
  }
  
  
</style>
  `;

  // Email content
  const mailOptions = {
    from: 'viveksingh2003e@gmail.com',
    to: userEmail,
    subject: `Happy Birthday, ${userName}! 🎉`,
    html: `
    <!DOCTYPE html>
    <html>
    
    <head>
    
      <title>birthday card</title>
    
      <link rel="stylesheet" href="style.css">
    
    </head>
    
    <body>
    
      <div class="birthday-card">
    
<img src="public/7.jpg" alt="birthday card">
    
        <h1>Happy Birthday, ${userName}! 🎉</h1>
    
        <p style="font-size: large;">🎂 May your day be filled
          with joy, success, and all the wonderful moments that make life truly special. "</p>
        <p style="font-size: large;">🌟 Wishing
          you another year of amazing achievements and growth. 🚀 Cheers to you and the fantastic
          journey ahead! 🥳</p>
        <h3 style="font-family: 'Nobile', sans-serif;">SCALEEDGE TEAM</h3>
      </div>
    </body>
    
    </html>
    `,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending birthday email:', error.message);
    } else {
      console.log('Birthday email sent:', info.response);
    }
  });
}

router.get('/userdashboard', checkUser, (req, res) => {
  const userEmail = req.session.email;
  const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
  const getUserInfoQuery = "SELECT user_name, birth_date FROM user_master WHERE email = ?";
  const countTotalLeavesQuery = "SELECT count(*) AS total_leaves FROM tblattendance WHERE userpk = (SELECT user_name FROM user_master WHERE email = ?)";
  const getAttendanceRequestsProcedure = "CALL GetAttendanceRequestsByEmail(?)";
  const inQuery =
    "SELECT user_name, A_type, date_column, time_column, attendance_mark FROM attendance WHERE user_email = ? AND A_type = 'in' AND date_column = ? ORDER BY time_column ASC LIMIT 1";
  const outQuery =
    "SELECT user_name, A_type, date_column, time_column FROM attendance WHERE user_email = ? AND A_type = 'out' AND date_column = ? ORDER BY time_column ASC LIMIT 1";

  con.query(getUserInfoQuery, [userEmail], (getUserInfoErr, userInfoResults) => {
    if (getUserInfoErr) {
      console.error('Error retrieving user info: ' + getUserInfoErr.message);
      return res.status(500).send('Internal Server Error');
    }

    if (!userInfoResults || userInfoResults.length === 0) {
      console.error('User not found');
      return res.status(404).send('User not found');
    }

    const { user_name, birth_date } = userInfoResults[0];

    // Check if it's the user's birthday
    const today = new Date();
    const userBirthday = new Date(birth_date);
    const isBirthday = today.getMonth() === userBirthday.getMonth() && today.getDate() === userBirthday.getDate();

    con.query(countTotalLeavesQuery, [userEmail], (countTotalLeavesErr, countTotalLeavesResults) => {
      if (countTotalLeavesErr) {
        console.error('Error counting total leaves: ' + countTotalLeavesErr.message);
        return res.status(500).send('Internal Server Error');
      }

      const totalLeaves = countTotalLeavesResults[0].total_leaves || 0;

      con.query(getAttendanceRequestsProcedure, [userEmail], (attendanceRequestsErr, attendanceRequestsResults) => {
        if (attendanceRequestsErr) {
          console.error('Error calling GetAttendanceRequestsByEmail procedure: ' + attendanceRequestsErr.message);
          return res.status(500).send('Internal Server Error');
        }

        if (!attendanceRequestsResults || attendanceRequestsResults.length === 0 || !attendanceRequestsResults[0][0]) {
          console.error('No result returned from GetAttendanceRequestsByEmail procedure');
          return res.status(404).send('No data found');
        }

        const totalAttendanceRequests = attendanceRequestsResults[0][0].totalAttendanceRequests;

        con.query(inQuery, [userEmail, currentDate], (inErr, inResults) => {
          if (inErr) {
            console.error('Error querying the database for "A_type = in": ' + inErr.message);
            return res.status(500).send('Internal Server Error');
          }

          con.query(outQuery, [userEmail, currentDate], (outErr, outResults) => {
            if (outErr) {
              console.error('Error querying the database for "A_type = out": ' + outErr.message);
              return res.status(500).send('Internal Server Error');
            }

            const firstInRecord = inResults.length > 0 ? `${inResults[0].time_column}` : '00:00:00';
            const firstOutRecord = outResults.length > 0 ? `${outResults[0].time_column}` : '00:00:00';

            res.render('userdashboard', {
              user_name,
              isBirthday,
              totalLeaves,
              totalAttendanceRequests,
              firstInRecord,
              firstOutRecord
            });
          });
        });
      });
    });
  });
});



router.get('/birthday-users', (req, res) => {
  const birthdayQuery =
    "SELECT user_name, Imagepath FROM user_master WHERE MONTH(birth_date) = ? AND DAY(birth_date) = ?";
  con.query(
    birthdayQuery,
    [new Date().getMonth() + 1, new Date().getDate()],
    (birthdayErr, birthdayResults) => {
      if (birthdayErr) {
        console.error(
          'Error querying the database for birthdays: ' +
          birthdayErr.message
        );
        return res.status(500).json({ error: "Internal Server Error" });
      }

      const birthdayUsers = birthdayResults.map((user) => ({
        user_name: user.user_name,
        image_path: user.Imagepath,
      }));

      res.json(birthdayUsers);
    }
  );
});


// router.get("/userdashboard", checkUser, function (req, res, next) {
//   const userEmail = req.session.email;
//   const getUserNameQuery = "SELECT user_name FROM user_master WHERE email = ?";

//   con.query(getUserNameQuery, [userEmail], (userNameErr, userNameResults) => {
//     if (userNameErr) {
//       console.error('Error querying user_name from user_master: ' + userNameErr.message);
//       return res.status(500).send('Internal Server Error');
//     }

//     if (userNameResults.length === 0) {
//       return res.status(404).send('User not found');
//     }

//     const userName = userNameResults[0].user_name;

// const calculateTotalHoursProcedure = "CALL CalculateTotalHoursWorked(?)";

// con.query(calculateTotalHoursProcedure, [userEmail], (calculateTotalHoursErr, calculateTotalHoursResults) => {
//   if (calculateTotalHoursErr) {
//     console.error('Error calling CalculateTotalHoursWorked procedure: ' + calculateTotalHoursErr.message);
//     return res.status(500).send('Internal Server Error');
//   }

//   const totalHoursWorked = calculateTotalHoursResults[0][0].total_hours_worked;

// const getAttendanceRequestsProcedure = "CALL GetAttendanceRequestsByEmail(?)";

// con.query(getAttendanceRequestsProcedure, [userEmail], (attendanceRequestsErr, attendanceRequestsResults) => {
//   if (attendanceRequestsErr) {
//     console.error('Error calling GetAttendanceRequestsByEmail procedure: ' + attendanceRequestsErr.message);
//     return res.status(500).send('Internal Server Error');
//   }

//   const totalAttendanceRequests = attendanceRequestsResults[0][0].totalAttendanceRequests;

//         const query =
//           "SELECT user_name, Imagepath, mobile, user_type, birth_date FROM user_master WHERE email = ?";
//         con.query(query, [userEmail], (err, results) => {
//           if (err) {
//             console.error("Error querying the database: " + err.message);
//             return res.status(500).send("Internal Server Error");
//           }

//           if (results.length === 0) {
//             return res.status(404).send("User not found");
//           }

//           const userData = results[0];

//           const currentDate = new Date().toISOString().split("T")[0];

//           const isBirthday =
//             userData.birth_date &&
//             userData.birth_date.getMonth() === new Date().getMonth() &&
//             userData.birth_date.getDate() === new Date().getDate();

// const inQuery =
//   "SELECT user_name, A_type, date_column, time_column, attendance_mark FROM attendance WHERE user_email = ? AND A_type = 'in' AND date_column = ? ORDER BY time_column ASC LIMIT 1";

// const outQuery =
//   "SELECT user_name, A_type, date_column, time_column FROM attendance WHERE user_email = ? AND A_type = 'out' AND date_column = ? ORDER BY time_column ASC LIMIT 1";

// con.query(inQuery, [userEmail, currentDate], (inErr, inResults) => {
//   if (inErr) {
//     console.error(
//       'Error querying the database for "A_type = in": ' + inErr.message
//     );
//     return res.status(500).send("Internal Server Error");
//   }

//   con.query(outQuery, [userEmail, currentDate], (outErr, outResults) => {
//     if (outErr) {
//       console.error(
//         'Error querying the database for "A_type = out": ' +
//         outErr.message
//       );
//       return res.status(500).send("Internal Server Error");
//     }

//     const firstInRecord =
//       inResults.length > 0 ? `${inResults[0].time_column}` : "00:00:00";
//     const firstOutRecord =
//       outResults.length > 0 ? `${outResults[0].time_column}` : "00:00:00";

//               // Fetch upcoming holidays
//               const upcomingHolidaysQuery =
//                 "SELECT `Date`, Remarks FROM holiday_master WHERE `Date` >= ? ORDER BY `Date` ASC LIMIT 3";

//               con.query(
//                 upcomingHolidaysQuery,
//                 [currentDate],
//                 (holidaysErr, holidaysResults) => {
//                   if (holidaysErr) {
//                     console.error(
//                       'Error querying the database for upcoming holidays: ' +
//                       holidaysErr.message
//                     );
//                     return res.status(500).send("Internal Server Error");
//                   }

//                   const upcomingHolidays = holidaysResults.map((holiday) => ({
//                     date: holiday.Date,
//                     remarks: holiday.Remarks,
//                   }));

//                   console.log('Upcoming Holidays:', upcomingHolidays);

//                   // If it's the user's birthday, send the birthday email
//                   if (isBirthday) {
//                     sendBirthdayEmail(userEmail, userData.user_name);
//                   }

//                   // Fetch users with birthdays on the current date
// const birthdayQuery =
//   "SELECT user_name, Imagepath FROM user_master WHERE MONTH(birth_date) = ? AND DAY(birth_date) = ?";
// con.query(
//   birthdayQuery,
//   [new Date().getMonth() + 1, new Date().getDate()],
//   (birthdayErr, birthdayResults) => {
//     if (birthdayErr) {
//       console.error(
//         'Error querying the database for birthdays: ' +
//         birthdayErr.message
//       );
//       return res.status(500).send("Internal Server Error");
//     }

//     const birthdayUsers = birthdayResults.map((user) => ({
//       user_name: user.user_name,
//       image_path: user.Imagepath,
//     }));

//                       // Custom SQL query to retrieve user attendance data
//                       const customQuery = `
//                             SELECT
//                                 user_master.user_name,
//                                 user_master.email,
//                                 DATE_FORMAT(dates.date_show, '%Y-%m-%d') AS date_column,
//                                 IFNULL(
//                                     (SELECT attendance.attendance_mark 
//                                     FROM attendance
//                                     WHERE attendance.user_email = user_master.email 
//                                       AND attendance.date_column = dates.date_show
//                                     ORDER BY attendance.time_column ASC
//                                     LIMIT 1), 'Absent'
//                                 ) AS attendance_mark
//                             FROM
//                                 user_master
//                             CROSS JOIN (
//                                 SELECT DISTINCT date_column AS date_show FROM attendance
//                             ) AS dates
//                             WHERE user_master.email = ?
//                             ORDER BY dates.date_show, user_master.email;
//                         `;

//                       // Execute the custom query
//                       con.query(customQuery, [userEmail], (customQueryErr, customQueryResults) => {
//                         if (customQueryErr) {
//                           console.error('Error executing custom query: ' + customQueryErr.message);
//                           return res.status(500).send('Internal Server Error');
//                         }

//                         // Process customQueryResults as needed
//                         const userAttendanceData = customQueryResults || [];


//                         res.render("userdashboard", {
//                           title: "scaleedge",
//                           user_name: userData.user_name,
//                           image_path: userData.Imagepath,
//                           mobile: userData.mobile,
//                           user_type: userData.user_type,
//                           firstInRecord: firstInRecord,
//                           firstOutRecord: firstOutRecord,
//                           attendance_mark:
//                             inResults.length > 0
//                               ? inResults[0].attendance_mark
//                               : null,
//                           isBirthday: isBirthday,
//                           birthdayUsers: birthdayUsers,
//                           upcomingHolidays: upcomingHolidays,
//                           userAttendanceData: userAttendanceData, // Pass the data to the view
//                           totalHoursWorked: totalHoursWorked,  // Pass the total hours worked to the view
//                           totalAttendanceRequests: totalAttendanceRequests
//                         });
//                       });
//                     });
//                 });
//             });
//           });
//         });
//       });
//     });
//   });
// });


router.get("/getUserAttendanceData", isUser, function (req, res, next) {
  const userEmail = req.session.email;

  // Replace 'checkUserAttendanceData' with the actual function to fetch user attendance data
  checkUserAttendanceData(userEmail)
    .then(userAttendanceData => {
      res.json({ userAttendanceData });
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

// Replace this function with your actual database query logic
function checkUserAttendanceData(userEmail) {
  return new Promise((resolve, reject) => {
    con.query('CALL checkData(?)', [userEmail], function (error, results, fields) {
      if (error) {
        reject(error);
      } else {
        // Extract the data from the result set
        const rows = results[0];
        const attendanceData = rows.map(row => row.attendance_mark);
        resolve(attendanceData);
      }
    });
  });
}



router.get("/getUpcomingHolidays", isUser, async function (req, res, next) {
  try {
    // Fetch upcoming holidays data
    const upcomingHolidaysData = await fetchUpcomingHolidays();

    // Return the upcoming holidays data
    res.json({ upcomingHolidaysData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



function fetchUpcomingHolidays() {
  return new Promise((resolve, reject) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const upcomingHolidaysQuery =
      "SELECT `Date`, Remarks FROM holiday_master WHERE `Date` >= ? ORDER BY `Date` ASC LIMIT 3";
    con.query(upcomingHolidaysQuery, [currentDate], function (error, results, fields) {
      if (error) {
        reject(error);
      } else {
        // Extract the data from the result set
        const holidaysData = results;
        resolve(holidaysData);
      }
    });
  });
}


router.get('/birthdays', isUser, (req, res) => {
  const birthdayQuery =
    "SELECT user_name, Imagepath FROM user_master WHERE MONTH(birth_date) = ? AND DAY(birth_date) = ?";

  con.query(
    birthdayQuery,
    [new Date().getMonth() + 1, new Date().getDate()],
    (birthdayErr, birthdayResults) => {
      if (birthdayErr) {
        console.error(
          'Error querying the database for birthdays: ' +
          birthdayErr.message
        );
        return res.status(500).send("Internal Server Error");
      }

      const birthdayUsers = birthdayResults.map((user) => ({
        user_name: user.user_name,
        image_path: user.Imagepath,
      }));

      res.json(birthdayUsers);
    }
  );
});

// router.get("/getUserCalendar", (req, res) => {
//   const userEmail = req.query.email; 
//   const selectedMonth = req.query.month;
//   const selectedYear = req.query.year;

//   // Call the 'user_calendar' procedure
//   const userCalendarQuery = "CALL user_calendar(?, ?, ?)";
//   con.query(userCalendarQuery, [userEmail, selectedMonth, selectedYear], (userCalendarErr, userCalendarResults) => {
//     if (userCalendarErr) {
//       console.error('Error calling user_calendar procedure: ' + userCalendarErr.message);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }

//     // Assuming the result structure is an array of objects with 'user_name', 'date_column', and 'attendance_mark' properties
//     const userCalendarData = userCalendarResults[0];

//     res.json(userCalendarData);
//   });
// });

hbs.registerHelper('formatDateToMySQLDate', function (date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
});

//leaveApplication router
router.get("/leaveAppl", checkUser, function (req, res, next) {
  if (req.session.user_group === "admin") {
    con.query("CALL GetAdminUserData()", function (err, result) {
      if (err) {
        console.error("An error occurred while fetching user names:", err);
        res.render("leaveAppl", {
          user_names: [],
          user_name: "Default Login User",
          sidebar: true,
          attendanceSidebar: false,
        });
      } else {
        var user_names = result[0].map((entry) => entry.user_name);
        res.render("leaveAppl", {
          user_names: user_names,
          user_name: "Default Login User",
          sidebar: true,
          attendanceSidebar: false,
        });
      }
    });
  } else if (req.session.user_group === "user") {
    var user_email = req.session.email;
    con.query(
      "CALL GetUserDataByEmail(?)",
      [user_email],
      function (err, result) {
        if (err) {
          console.error("An error occurred while fetching user's name:", err);
          res.render("leaveAppl", {
            user_name: "Default Login User",
            sidebar: false,
            attendanceSidebar: true,
            id: "" // add id here
          });
        } else {
          var user_name = result[0][0]
            ? result[0][0].user_name
            : "Default Login User";
          var user_id = result[0][0] ? result[0][0].id : ""; // get user id

          res.render("leaveAppl", {
            user_name: user_name,
            sidebar: false,
            attendanceSidebar: true,
            id: user_id // pass user id to the template
          });
        }
      }
    );
  } else {
    res.redirect("/");
  }
});


//submitleave router
// router.post("/submitLeave", function (req, res, next) {
//   const userpk = req.body.user_name;
//   const from_date = req.body.from_date;
//   const days = parseFloat(req.body.days);
//   const remarks = req.body.remarks;

//   con.query(
//     "CALL SubmitLeave(?, ?, ?, ?)",
//     [userpk, from_date, days, remarks],
//     function (err, result) {
//       if (err) {
//         console.error(
//           "An error occurred while calling the stored procedure:",
//           err
//         );
//         res.redirect("/");
//       } else {
//         console.log(result[0][0].message);

//         // Assuming req.session.email contains the user's email address
//         const userEmail = req.session.email;

//         // Sending email
//         sendLeaveApplicationEmail(userEmail, from_date, days, remarks, userpk);

//         if (req.session.user_group === "admin") {
//           res.redirect("/dashboard");
//         } else if (req.session.user_group === "user") {
//           res.redirect("/userdashboard");
//         } else {
//           res.redirect("/");
//         }
//       }
//     }
//   );
// });


// function sendLeaveApplicationEmail(userEmail, from_date, days, remarks, username) {
//   const mailOptions = {
//     from: userEmail,
//     to: "viveksingh2003e@gmail.com",
//     subject: "Leave Application",
//     html: `
//       <html>
//         <head>
//           <style>
//             body {
//               font-family: 'Arial', sans-serif;
//               background-color: #f5f5f5;
//               margin: 0;
//               padding: 0;
//             }
//             .container {
//               max-width: 600px;
//               margin: 20px auto;
//               padding: 20px;
//               background-color: #ffffff;
//               border-radius: 10px;
//               box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
//             }
//             h2 {
//               color: #333333;
//             }
//             p {
//               color: #555555;
//             }
//             ul {
//               list-style-type: none;
//               padding: 0;
//             }
//             li {
//               margin-bottom: 10px;
//             }
//             .details {
//               background-color: #f9f9f9;
//               padding: 15px;
//               border-radius: 8px;
//             }
//           </style>
//         </head>
//         <body>
//           <div class="container">
//             <h2>Leave Application submitted by ${username}</h2>
//             <div class="details">
//               <p><strong>Details:</strong></p>
//               <ul>
//                 <li><strong>From Date:</strong> ${from_date}</li>
//                 <li><strong>Days:</strong> ${days}</li>
//                 <li><strong>Remarks:</strong> ${remarks}</li>
//               </ul>
//             </div>
//           </div>
//         </body>
//       </html>
//     `,
//   };

//   transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//       console.error("Error sending email:", error);
//     } else {
//       console.log("Email sent:", info.response);
//     }
//   });
// }

router.post('/submitLeave', (req, res) => {
  const { user_name, from_date, days, leaveType, remarks, user_id } = req.body;

  const toDate = new Date(from_date);
  toDate.setDate(toDate.getDate() + parseInt(days) - 1);


  // Check if from_date already exists for this user_id
  const checkQuery = `SELECT * FROM tblattendance WHERE user_id = ? AND from_date = ?`;
  con.query(checkQuery, [user_id, from_date], (checkError, checkResults, checkFields) => {
    if (checkError) {
      console.error(checkError);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (checkResults.length > 0) {
      // Update existing record
      const updateQuery = `UPDATE tblattendance SET userpk = ?, days = ?, to_date = ?, remarks = ?, leave_type = ? WHERE user_id = ? AND from_date = ?`;
      con.query(updateQuery, [user_name, days, toDate, remarks, leaveType, user_id, from_date], (updateError, updateResults, updateFields) => {
        if (updateError) {
          console.error(updateError);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        // Update user's leave details and send response
        updateUserLeaveDetails(res, user_id, leaveType, days, from_date);
      });
    } else {
      // Insert new record
      const insertQuery = `INSERT INTO tblattendance (userpk, from_date, days, to_date, remarks, leave_type, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      con.query(insertQuery, [user_name, from_date, days, toDate, remarks, leaveType, user_id], (insertError, insertResults, insertFields) => {
        if (insertError) {
          console.error(insertError);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        // Update user's leave details and send response
        updateUserLeaveDetails(res, user_id, leaveType, days, from_date);
      });
    }
  });
});

function updateUserLeaveDetails(res, user_id, leaveType, days, from_date) {
  // Fetch user's leave details from the database
  const selectQuery = `SELECT total_casual_leave, balance_casual_leave, total_medical_leave, balance_medical_leave, total_paid_leave, balance_paid_leave FROM user_leave_details WHERE user_id = ?`;
  con.query(selectQuery, [user_id], (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'User leave details not found' });
      return;
    }

    const leaveDetails = results[0];
    let balanceCasualLeave = leaveDetails.balance_casual_leave !== null ? leaveDetails.balance_casual_leave : leaveDetails.total_casual_leave;
    let balanceMedicalLeave = leaveDetails.balance_medical_leave !== null ? leaveDetails.balance_medical_leave : leaveDetails.total_medical_leave;
    let balancePaidLeave = leaveDetails.balance_paid_leave !== null ? leaveDetails.balance_paid_leave : leaveDetails.total_paid_leave;

    // Calculate the remaining leave balance
    let remainingBalance = 0;
    let updatedLeaveType = leaveType; // Updated leave type variable
    switch (leaveType) {
      case 'Casual Leave':
        remainingBalance = balanceCasualLeave - parseInt(days);
        balanceCasualLeave = remainingBalance >= 0 ? remainingBalance : 0;
        if (remainingBalance < 0) {
          updatedLeaveType = 'Other'; // Set leave type to 'Other' for insufficient balance
        }
        break;
      case 'Medical Leave':
        remainingBalance = balanceMedicalLeave - parseInt(days);
        balanceMedicalLeave = remainingBalance >= 0 ? remainingBalance : 0;
        if (remainingBalance < 0) {
          updatedLeaveType = 'Other'; // Set leave type to 'Other' for insufficient balance
        }
        break;
      case 'Paid Leave':
        remainingBalance = balancePaidLeave - parseInt(days);
        balancePaidLeave = remainingBalance >= 0 ? remainingBalance : 0;
        if (remainingBalance < 0) {
          updatedLeaveType = 'Other'; // Set leave type to 'Other' for insufficient balance
        }
        break;
      // Add more cases for other leave types if needed
      default:
        updatedLeaveType = 'Other'; // Set leave type to 'Other' for any other type
        break;
    }

    // Update user's leave details in the database
    const updateQuery = `UPDATE user_leave_details SET balance_casual_leave = ?, balance_medical_leave = ?, balance_paid_leave = ? WHERE user_id = ?`;
    con.query(updateQuery, [balanceCasualLeave, balanceMedicalLeave, balancePaidLeave, user_id], (updateError, updateResults, updateFields) => {
      if (updateError) {
        console.error(updateError);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Update leave type in the attendance table if necessary
      if (updatedLeaveType !== leaveType) {
        const updateLeaveTypeQuery = `UPDATE tblattendance SET leave_type = ? WHERE user_id = ? AND from_date = ?`;
        con.query(updateLeaveTypeQuery, [updatedLeaveType, user_id, from_date], (updateLeaveTypeError, updateLeaveTypeResults, updateLeaveTypeFields) => {
          if (updateLeaveTypeError) {
            console.error(updateLeaveTypeError);
            return;
          }
        });
      }

      // Send response based on leave balance status
      if (remainingBalance >= 0) {
        res.status(200).json({ message: 'Leave submitted successfully' });
      } else {
        res.status(400).json({ message: 'Insufficient leave balance. Deduction will be from salary.' });
      }
    });
  });
}




//leave table admin router
router.get("/leaveTable", isAdmin, checkUser, function (req, res, next) {
  var userGroup = req.session.user_group;
  var userEmail = req.session.email;

  con.query(
    "CALL GetLeaveDataByUserGroup(?, ?)",
    [userGroup, userEmail],
    function (err, results) {
      if (err) {
        console.error("An error occurred while fetching data:", err);
        res.render("leaveTable", { title: "sumit", leaveData: [] });
      } else {
        res.render("leaveTable", { title: "sumit", leaveData: results[0] });
      }
    }
  );
});

//leave table user router
router.get("/leaveTableuser", isUser, checkUser, function (req, res, next) {
  var userEmail = req.session.email;

  con.query(
    "CALL GetLeaveDataForUser(?)",
    [userEmail],
    function (err, results) {
      if (err) {
        console.error("An error occurred while fetching data:", err);
        res.render("leaveTableUser", { title: "sumit", leaveData: [] });
      } else {
        res.render("leaveTableUser", { title: "sumit", leaveData: results[0] });
      }
    }
  );
});

//leave approval router
router.get("/leaveApproval", isAdmin, checkUser, function (req, res, next) {
  let userGroup = req.session.user_group;
  let isAdmin = userGroup === "admin";
  res.render("leaveApproval", { title: "sumit", isAdmin: isAdmin });
});

//get leave approval by id router
router.get("/leaveApproval/:id", isAdmin, checkUser, function (req, res, next) {
  const leaveId = req.params.id;
  const query = "CALL GetLeaveData(?)";

  con.query(query, [leaveId], function (err, result) {
    if (err) {
      console.error("An error occurred while fetching data:", err);
      res.render("leaveApproval", { leaveData: {} });
    } else {
      if (result[0].length > 0) {
        const leaveData = result[0][0];
        leaveData.selectedDays = {
          0.5: leaveData.days === 0.5,
          1: leaveData.days === 1,
          3: leaveData.days === 3,
        };
        leaveData.from_date = leaveData.from_date.toISOString().split("T")[0];
        leaveData.to_date = leaveData.to_date.toISOString().split("T")[0];

        let userGroup = req.session.user_group;
        let isAdmin = userGroup === "admin";

        res.render("leaveApproval", { leaveData, isAdmin });
      } else {
        res.render("leaveApproval", { leaveData: {}, isAdmin: false });
      }
    }
  });
});

//upadte leave by id router
router.post("/updateLeave/:id", function (req, res, next) {
  const leaveId = req.params.id;
  const { approval, leave_type, manager_remarks } = req.body;
  const userEmail = req.session.email;

  con.query(
    "CALL UpdateLeaveWithApproval(?, ?, ?, ?, ?)",
    [leaveId, approval, leave_type, userEmail, manager_remarks],
    function (err, results) {
      if (err) {
        console.error("An error occurred while updating data:", err);
        res.send({ success: false, message: err.message });
      } else {
        const message = results[0][0].message;
        console.log(message);
        res.redirect(`/leaveTable`);
      }
    }
  );
});

//usermanagment router
router.get("/usermangment", isAdmin, checkUser, (req, res) => {
  con.query("CALL user_master_fetchdata()", (err, rows) => {
    if (!err) {
      // Map rows and format dates
      const formattedRows = rows[0].map(row => ({
        ...row,
        joining_date: formatDate(row.joining_date),
        birth_date: formatDate(row.birth_date)
      }));

      let removedUser = req.query.removed;
      res.render("usermangment", { rows: formattedRows, removedUser });
    } else {
      console.log(err);
    }
  });
});

// Function to format date to 'YYYY/MM/DD'
function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}


hbs.registerHelper('isStatusInactiveOrOnHold', function (status) {
  return status === 'inactive' || status === 'onhold';
});

//logout router
router.get("/logout", function (req, res, next) {
  if (req.session.email) {
    req.session.destroy();
  }
  res.redirect("/");
});

//add user router
router.get("/add", isAdmin, checkUser, function (req, res, next) {
  res.render("adduser", { message: "Welcome, " + req.session.email });
});

router.post("/add", function (req, res, next) {
  var user_name = req.body.user_name;
  var email = req.body.email;
  var mobile = req.body.mobile;
  var password = req.body.password;
  var user_type = req.body.user_type;
  var joining_date = req.body.joining_date;
  var annual_salary = req.body.annual_salary;
  var km_rupees = req.body.km_rupees;
  var birth_date = req.body.birth_date;
  var personal_email = req.body.personal_email; // Updated
  var street_address = req.body.street;
  var house = req.body.house;
  var city = req.body.city;
  var state = req.body.state;
  var pincode = req.body.pincode;
  var landmark = req.body.landmark;
  var adhar = req.files.adhar;
  var pan = req.files.pan;
  var Imagepath = req.files.Imagepath;
  var adharName = adhar.name;
  var panName = pan.name;
  var imageName = Imagepath.name;

  var adharPath = "public/document/" + adharName;
  var panPath = "public/document/" + panName;
  var profileImagePath = "public/profile/" + imageName;

  var insertSql = "CALL user_master_userformdata1 (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

  con.query(
    insertSql,
    [
      user_name, email, mobile, password, imageName, user_type,
      joining_date, annual_salary, km_rupees, birth_date, personal_email,
      street_address, house, city, state, pincode, landmark, adharName, panName
    ],
    function (err, result) {
      if (err) {
        console.error("An error occurred while adding the user:", err);
        res.status(500).json({ error: "Failed to add user" });
      } else {
        // Move files to the specified paths
        adhar.mv(adharPath, function (err) {
          if (err) {
            console.error("Failed to save Adhar document:", err);
          }
        });

        pan.mv(panPath, function (err) {
          if (err) {
            console.error("Failed to save PAN document:", err);
          }
        });

        Imagepath.mv(profileImagePath, function (err) {
          if (err) {
            console.error("Failed to save profile image:", err);
          }
        });

        if (result.affectedRows > 0) {
          console.log("User added successfully.");

          var mailOptions = {
            from: "viveksingh2003e@gmail.com",
            to: email,
            subject: "User Added Notification",
            html: `
                          <p>Hello, a new user has been registered successfully!</p>
                          <p>Name: ${user_name}</p>
                          <p>Email: ${email}</p>
                          <p>Password: ${password}</p>
                      `,
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log("Email could not be sent:", error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });

          res.status(200).json({ success: "User added successfully." });
        } else {
          res.status(500).json({ error: "Failed to add user" });
        }
      }
    }
  );
});


//check email router
router.post("/check_email", (req, res) => {
  const email = req.body.email;
  const query = "SELECT COUNT(*) AS count FROM user_master WHERE email = ?";
  con.query(query, [email], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ exists: false });
    } else {
      const count = results[0].count;
      const emailExists = count > 0;
      res.json({ exists: emailExists });
    }
  });
});

//edit router
router.get("/edit/:id", isAdmin, function (req, res, next) {
  var userId = req.params.id;
  var selectUserSql = "SELECT * FROM user_master WHERE id = ?";
  var selectEmployeeDetailsSql = "SELECT * FROM employee_account_details WHERE email = (SELECT email FROM user_master WHERE id = ?)";
  var selectBranchSql = "SELECT * FROM branch_table";
  var selectDepartmentSql = "SELECT * FROM departments"; // New SQL query for departments

  con.query(selectUserSql, [userId], function (err, userResult) {
    if (err) {
      throw err;
    }

    if (userResult.length > 0) {
      var formattedJoiningDate = new Date(userResult[0].joining_date)
        .toISOString()
        .split("T")[0];
      var annualSalary = parseFloat(userResult[0].annual_salary);

      var userTypeOfficeSelected = userResult[0].user_type === "office" ? "selected" : "";
      var userTypeSalesSelected = userResult[0].user_type === "sales" ? "selected" : "";
      var statusActiveSelected = userResult[0].status === "active" ? "selected" : "";
      var statusInactiveSelected = userResult[0].status === "inactive" ? "selected" : "";
      var statusOnHoldSelected = userResult[0].status === "onhold" ? "selected" : "";

      con.query(selectBranchSql, function (err, branchResult) {
        if (err) {
          throw err;
        }

        con.query(selectDepartmentSql, function (err, departmentResult) { // Execute department query
          if (err) {
            throw err;
          }

          con.query(selectEmployeeDetailsSql, [userId], function (err, employeeDetailsResult) {
            if (err) {
              throw err;
            }

            res.render("edit", {
              title: "scaleedge",
              user: userResult[0],
              formattedJoiningDate: formattedJoiningDate,
              annualSalary: annualSalary,
              userTypeOfficeSelected: userTypeOfficeSelected,
              userTypeSalesSelected: userTypeSalesSelected,
              statusActiveSelected: statusActiveSelected,
              statusInactiveSelected: statusInactiveSelected,
              statusOnHoldSelected: statusOnHoldSelected,
              branches: branchResult,
              departments: departmentResult, // Pass departments to the render function
              employeeDetails: employeeDetailsResult[0]
            });
          });
        });
      });
    } else {
      res.redirect("/usermanagement");
    }
  });
});




// router.post("/edit", function (req, res, next) {
//   var userId = req.body.id;
//   var user_name = req.body.user_name;
//   var email = req.body.email;
//   var mobile = req.body.mobile;
//   var user_group = req.body.user_group;
//   var user_type = req.body.user_type;
//   var profileImage = req.files && req.files.profileImage;
//   var joining_date = req.body.joining_date;
//   var annual_salary = req.body.annual_salary;
//   var latitude = req.body.latitude;
//   var longitude = req.body.longitude;
//   var km_rupees = req.body.km_rupees;
//   var personalEmail = req.body.personal_email;
//   var house = req.body.house;
//   var street_address = req.body.street;
//   var city = req.body.city;
//   var state = req.body.state;
//   var pincode = req.body.pincode;
//   var landmark = req.body.landmark;
//   var status = req.body.status;
//   var position = req.body.position;
//   var branch = req.body.branch;
//   var department = req.body.department;
//   var reportingTo = req.body.reportingTo;
// var updateSql =
//   "CALL user_master_update_on (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?, ?,?,?,?,?)";

// if (profileImage) {
//   con.query(
//     updateSql,
//     [
//       userId,
//       user_name,
//       email,
//       mobile,
//       profileImage.name,
//       user_group,
//       user_type,
//       joining_date,
//       annual_salary,
//       latitude,
//       longitude,
//       km_rupees,
//       personalEmail,
//       house,
//       street_address,
//       city,
//       state,
//       pincode,
//       landmark,
//       status,
//       position,
//       branch,
//       department,
//       reportingTo
//     ],
//       function (err, result) {
//         if (err) {
//           console.error("An error occurred while updating the user:", err);
//           res.redirect("/usermangment");
//         } else {
// var imagePath = "public/profile/" + profileImage.name;

//           profileImage.mv(imagePath, function (err) {
//             if (err) {
//               console.error("Failed to save profile image:", err);
//             }
//           });

//           console.log("User updated successfully.");
//           res.redirect("/usermangment");
//         }
//       }
//     );
//   } else {
//     con.query(
//       "UPDATE user_master SET user_id= ?,  user_name = ?, email = ?, mobile = ?, user_group = ?, user_type = ?, joining_date = ?, annual_salary = ?, latitude = ?, longitude = ?, km_rupees = ?, personal_email=?, house=?, street_address=?, city=?, state=?, pincode=?, landmark=?, status=?, position=?, branch=?, department=?, reportingTo=? WHERE id = ?",
//       [
//         email,
//         user_name,
//         email,
//         mobile,
//         user_group,
//         user_type,
//         joining_date,
//         annual_salary,
//         latitude,
//         longitude,
//         km_rupees,
//         personalEmail,
//         house,
//         street_address,
//         city,
//         state,
//         pincode,
//         landmark,
//         status,
//         position,
//         branch,
//         department,
//         reportingTo,
//         userId,
//       ],
//       function (err, result) {
//         if (err) {
//           console.error("An error occurred while updating the user:", err);
//           res.redirect("/usermangment");
//         } else {
//           console.log("User updated successfully.");
//           res.redirect("/usermangment");
//         }
//       }
//     );
//   }
// });

router.post("/edit", function (req, res, next) {
  var userId = req.body.id;
  var user_name = req.body.user_name;
  var email = req.body.email;
  var mobile = req.body.mobile;
  var user_group = req.body.user_group;
  var user_type = req.body.user_type;
  var profileImage = req.files && req.files.profileImage;
  var joining_date = req.body.joining_date;
  var annual_salary = req.body.annual_salary;
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;
  var km_rupees = req.body.km_rupees;
  var personalEmail = req.body.personal_email;
  var house = req.body.house;
  var street_address = req.body.street;
  var city = req.body.city;
  var state = req.body.state;
  var pincode = req.body.pincode;
  var landmark = req.body.landmark;
  var status = req.body.status;
  var position = req.body.position;
  var branch = req.body.branch;
  var department = req.body.department;
  var reportingTo = req.body.reportingTo;

  var account_holder_name = req.body.account_holder_name;
  var account_number = req.body.account_number;
  var bank_name = req.body.bank_name;
  var ifsc_code = req.body.ifsc_code;
  var branch_name = req.body.branch_name;

  var updateSql =
    "CALL user_master_update_on (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?, ?,?,?,?,?)";

  if (profileImage) {
    con.query(
      updateSql,
      [
        userId,
        user_name,
        email,
        mobile,
        profileImage.name,
        user_group,
        user_type,
        joining_date,
        annual_salary,
        latitude,
        longitude,
        km_rupees,
        personalEmail,
        house,
        street_address,
        city,
        state,
        pincode,
        landmark,
        status,
        position,
        branch,
        department,
        reportingTo
      ],
      function (err, result) {
        if (err) {
          console.error("An error occurred while updating the user:", err);
          res.redirect("/usermangment");
        } else {
          var imagePath = "public/profile/" + profileImage.name;
          profileImage.mv(imagePath, function (err) {
            if (err) {
              console.error("Failed to save profile image:", err);
            }
          });
          console.log("User updated successfully.");
          // Now update the employee account details
          updateEmployeeAccountDetails(email, req.body, res);
        }
      }
    );
  } else {
    // If no profile image provided, update only user master details
    con.query(
      "UPDATE user_master SET user_name = ?, email = ?, mobile = ?, user_group = ?, user_type = ?, joining_date = ?, annual_salary = ?, latitude = ?, longitude = ?, km_rupees = ?, personal_email=?, house=?, street_address=?, city=?, state=?, pincode=?, landmark=?, status=?, position=?, branch=?, department=?, reportingTo=? WHERE id = ?",
      [
        user_name,
        email,
        mobile,
        user_group,
        user_type,
        joining_date,
        annual_salary,
        latitude,
        longitude,
        km_rupees,
        personalEmail,
        house,
        street_address,
        city,
        state,
        pincode,
        landmark,
        status,
        position,
        branch,
        department,
        reportingTo,
        userId,
      ],
      function (err, result) {
        if (err) {
          console.error("An error occurred while updating the user:", err);
          res.redirect("/usermangment");
        } else {
          console.log("User updated successfully.");
          // Now update the employee account details
          updateEmployeeAccountDetails(email, req.body, res);
        }
      }
    );
  }
});

function updateEmployeeAccountDetails(email, employeeDetails, res) {
  // Function to update employee account details based on email
  var updateEmployeeDetailsSql =
    "UPDATE employee_account_details SET account_holder_name = ?, account_number = ?, bank_name = ?, ifsc_code = ?, branch_name = ? WHERE email = ?";
  con.query(
    updateEmployeeDetailsSql,
    [
      employeeDetails.account_holder_name,
      employeeDetails.account_number,
      employeeDetails.bank_name,
      employeeDetails.ifsc_code,
      employeeDetails.branch_name,
      email
    ],
    function (err, result) {
      if (err) {
        console.error("An error occurred while updating employee account details:", err);
        res.redirect("/usermangment");
      } else {
        console.log("Employee account details updated successfully.");
        res.redirect("/usermangment");
      }
    }
  );
}



//delete
router.get("/delete/:id", checkUser, function (req, res, next) {
  var userId = req.params.id;

  var deleteSql = "CALL delete_data(?);";
  con.query(deleteSql, [userId], function (err, result) {
    if (err) throw err;

    console.log("User deleted:", userId);
    res.redirect("/usermangment?removed=true");
  });
});

//report for admin for all users
router.get("/distance", isAdmin, checkUser, function (req, res, next) {
  // Extract user_name and date from the query parameters
  const userName = req.query.user_name;
  const date = req.query.date;

  // Call the stored procedure with the extracted parameters
  con.query("CALL scaleedgeDistance(?, ?)", [userName, date], function (error, results, fields) {
    if (error) {
      // Handle the error (e.g., render an error page)
      return next(error);
    }

    // Render the 'distance' template with the results
    res.render("distance", {
      message: "Welcome, " + req.session.email,
      rows: results[0] // Assuming the results are in the first element of the array
    });
  });
});

router.get("/demoReport", function (req, res, next) {
  res.render("demoReport", { title: "scaleedge" });
});

// router.get("/demoReport1", function (req, res, next) {
//   const selectedMonth = req.query.month;
//   const selectedYear = req.query.year;

//   // Call the stored procedure with the extracted month and year
//   const query = `CALL TrackerHours(${selectedMonth}, ${selectedYear})`;

//   con.query(query, (error, results, fields) => {
//     if (error) {
//       console.error("Error executing stored procedure:", error);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }

//     // Assuming the stored procedure returns the required data
//     const rows = results[0];

//     // Retrieve users from the user_master table
//     const usersQuery = "SELECT user_name FROM user_master";
//     con.query(usersQuery, (usersError, usersResults) => {
//       if (usersError) {
//         console.error("Error retrieving users:", usersError);
//         return res.status(500).json({ error: "Internal Server Error" });
//       }

// const users = usersResults.map((user) => user.user_name);

// const combinedRows = [];
// const numMonths = 6;
// const currentDate = new Date();
// const currentMonthDate = new Date(
//   currentDate.getFullYear(),
//   currentDate.getMonth(),
//   1
// );

// for (let i = 0; i < numMonths; i++) {
//   const monthDate = new Date(
//     currentMonthDate.getFullYear(),
//     currentMonthDate.getMonth() - i,
//     1
//   );

//   let lastDateOfMonth = new Date(
//     monthDate.getFullYear(),
//     monthDate.getMonth() + 1,
//     0
//   );

//   if (i === 0) {
//     lastDateOfMonth = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       currentDate.getDate()
//     );
//   }

//   const allDatesForMonth = generateDatesForMonth(
//     monthDate,
//     lastDateOfMonth
//   );

//   users.forEach((user) => {
//     allDatesForMonth.forEach((date) => {
//       const dateString = date.toISOString().split("T")[0];
//       const existingRow = rows.find(
//         (row) =>
//           row.date_column === dateString &&
//           row.user_name === user
//       );

//       const isSunday = date.getDay() === 1;

//       combinedRows.push({
//         user_name: user,
//         date_column: dateString,
//         time_in: existingRow ? existingRow.time_in : "--",
//         time_out: existingRow ? existingRow.time_out : "--",
//         hours_worked: existingRow ? existingRow.hours_worked : "--",
//         range_status: existingRow ? existingRow.range_status : "--",
//         attendance_mark: isSunday
//           ? "Sunday"
//           : existingRow
//           ? existingRow.attendance_mark
//           : "Absent",
//       });
//     });
//   });
// }

// combinedRows.sort((a, b) =>
//   a.date_column < b.date_column ? -1 : 1
// );

//       res.json(combinedRows);
//     });
//   });
// });



router.get("/demoReport1", function (req, res, next) {
  const selectedMonth = req.query.month;
  const selectedYear = req.query.year;

  // Call the stored procedure with the extracted month and year
  const query = `CALL TrackerHours(${selectedMonth}, ${selectedYear})`;

  con.query(query, (error, results, fields) => {
    if (error) {
      console.error("Error executing stored procedure:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Assuming the stored procedure returns the required data
    const responseData = results[0];

    // Send the data in JSON format
    res.json(responseData);
  });
});


router.get("/report", isAdmin, checkUser, function (req, res, next) {
  con.query(
    "SELECT DISTINCT user_name FROM user_master WHERE status = 'active'",
    function (error, users) {
      if (error) {
        console.log("Error fetching users:", error);
        return res.status(500).send("Internal Server Error");
      }

      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Adding leading zero if needed
      const day = String(currentDate.getDate()).padStart(2, '0'); // Adding leading zero if needed
      const dateString = `${year}-${month}-${day}`;

      con.query("CALL demoHoursTracker(?)", [dateString], function (error, rows) {
        if (error) {
          console.log("Error fetching attendance data:", error);
          return res.status(500).send("Internal Server Error");
        }

        const combinedRows = [];

        users.forEach((user) => {
          const existingRow = rows[0].find(
            (row) =>
              row.date_column === dateString &&
              row.user_name === user.user_name
          );

          const isSunday = currentDate.getDay() === 0; // Sunday is typically day 0

          combinedRows.push({
            user_name: user.user_name,
            date_column: dateString,
            time_in: existingRow ? existingRow.time_in : "--",
            time_out: existingRow ? existingRow.time_out : "--",
            hours_worked: existingRow ? existingRow.hours_worked : "--",
            range_status: existingRow ? existingRow.range_status : "--",
            attendance_mark: isSunday
              ? "Sunday"
              : existingRow
                ? existingRow.attendance_mark
                : "Absent",
          });
        });

        // Sort the combinedRows array based on date_column
        combinedRows.sort((a, b) => (a.date_column < b.date_column ? -1 : 1));

        res.render("report", {
          title: "payRoll",
          rows: combinedRows,
          users: users,
        });
      });
    }
  );
});



router.get("/reportMonthYearWise", isAdmin, checkUser, function (req, res, next) {
  let userGroup = req.session.user_group;
  let isAdmin = userGroup === "admin";
  res.render("reportMonthYearWise", { title: "sumit", isAdmin: isAdmin });
});

router.post("/reportMonthYearWise", function (req, res, next) {
  const selectedMonth = req.body.selectedMonth;
  const selectedYear = req.body.selectedYear;

  con.query(
    "SELECT DISTINCT user_name FROM user_master",
    function (error, users) {
      if (error) {
        console.log("Error fetching users:", error);
        return res.status(500).send("Internal Server Error");
      }

      con.query(
        "CALL TrackerHours(?, ?)",
        [selectedMonth, selectedYear], function (error, rows) {
          if (error) {
            console.log("Error fetching attendance data:", error);
            return res.status(500).send("Internal Server Error");
          }

          const combinedRows = [];
          const currentDate = new Date();

          const monthDate = new Date(
            selectedYear,
            selectedMonth - 1,
            2
          );

          let lastDateOfMonth = new Date(
            selectedYear,
            selectedMonth,
            0
          );

          // lastDateOfMonth.setDate(lastDateOfMonth.getDate() - 1);


          // For the current month, set the lastDateOfMonth to the current date
          if (
            selectedMonth === currentDate.getMonth() + 1 &&
            selectedYear === currentDate.getFullYear()
          ) {
            lastDateOfMonth = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate()
            );
          }

          const allDatesForMonth = generateDatesForMonth(
            monthDate,
            lastDateOfMonth
          );

          users.forEach((user) => {
            allDatesForMonth.forEach((date) => {
              const dateString = date.toISOString().split("T")[0];
              const existingRow = rows[0].find(
                (row) =>
                  row.date_column === dateString &&
                  row.user_name === user.user_name
              );

              const isSunday = date.getDay() === 1;

              combinedRows.push({
                user_name: user.user_name,
                date_column: dateString,
                time_in: existingRow ? existingRow.time_in : "--",
                time_out: existingRow ? existingRow.time_out : "--",
                hours_worked: existingRow ? existingRow.hours_worked : "--",
                range_status: existingRow ? existingRow.range_status : "--",
                attendance_mark: isSunday
                  ? "Sunday"
                  : existingRow
                    ? existingRow.attendance_mark
                    : "Absent",
              });
            });
          });

          combinedRows.sort((a, b) => (a.date_column < b.date_column ? -1 : 1));

          res.render("reportMonthYearWise", {
            title: "payRoll",
            rows: combinedRows,
            users: users,
          });
        });
    }
  );
});


function generateDatesForMonth(startDate, endDate) {
  const dates = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const nextDay = new Date(currentDate);
  dates.push(nextDay);

  return dates;
}

//faceRecognition router for fetch face and store checkin checkout time
router.get("/attendanceSelfie", checkUser, function (req, res, next) {
  let userGroup = req.session.user_group;
  let isAdmin = userGroup === "admin";
  let currentTime = Date.now(); // Get current time in milliseconds
  res.render("SelfieAttendance", { title: "sumit", isAdmin: isAdmin, currentTime: currentTime });
});

router.get("/attendanceBrowser", checkUser, function (req, res, next) {
  let userGroup = req.session.user_group;
  let isAdmin = userGroup === "admin";
  res.render("attendanceBrowser", { title: "sumit", isAdmin: isAdmin });
});

router.get("/attendanceMeetingIn", checkUser, function (req, res, next) {
  let userGroup = req.session.user_group;
  let isAdmin = userGroup === "admin";
  res.render("attendanceMeeting", { title: "sumit", isAdmin: isAdmin });
});

router.get("/attendanceMeetingOut", checkUser, function (req, res, next) {
  let userGroup = req.session.user_group;
  let isAdmin = userGroup === "admin";
  res.render("attendanceMeetingOut", { title: "sumit", isAdmin: isAdmin });
});

router.get("/attendanceMobile", checkUser, function (req, res, next) {
  let userGroup = req.session.user_group;
  let isAdmin = userGroup === "admin";
  res.render("attendanceMobile", { title: "sumit", isAdmin: isAdmin });
});

router.post("/getimg", function (req, res, next) {
  var callProc = "CALL get_images()";
  con.query(callProc, function (err, result, fields) {
    if (err) throw err;
    res.json(result[0]);
  });
});

router.post("/storeFaceMatchResult", function (req, res, next) {
  var label = req.body.label;
  var distance = req.body.distance;
  var updateType = req.body.update_type;
  var user_id = label;

  var insertSql = "CALL Attendance(?, ?, ?, ?, ?, ?, ?)";
  con.query(
    insertSql,
    [user_id, updateType, distance, null, null, null, null],
    function (err, result) {
      if (err) {
        console.error(
          "An error occurred while storing face match result:",
          err
        );
        res.status(500).json({ success: false, error: err });
      } else {
        console.log("Face match result stored:", result);
        res.json({ success: true });
      }
    }
  );
});

router.post("/storeMeetinTime", function (req, res, next) {
  var label = req.body.label;
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;

  var selectSql =
    "SELECT id, email, user_name FROM user_master WHERE user_id = ?";
  con.query(selectSql, [label], function (err, result) {
    if (err) {
      console.error("An error occurred while retrieving user details:", err);
      res.status(500).json({ success: false, error: err });
    } else {
      if (result.length > 0) {
        var user_id = result[0].id;
        var email = result[0].email;
        var username = result[0].user_name;

        var insertSql = "CALL InsertMeeting(?, ?, ?, ?, ?)";
        con.query(
          insertSql,
          [user_id, email, latitude, longitude, username],
          function (err, result) {
            if (err) {
              console.error(
                "An error occurred while storing check-in time:",
                err
              );
              res.status(500).json({ success: false, error: err });
            } else {
              console.log("Check-in time stored for label:", label);
              res.json({ success: true });
            }
          }
        );
      } else {
        console.error("User not found with label:", label);
        res.status(404).json({ success: false, error: "User not found" });
      }
    }
  });
});

router.post("/checkAttendanceEntry", function (req, res, next) {
  var label = req.body.label;
  var currentDate = formatDateToMySQLDate(new Date());

  var selectSql =
    'SELECT COUNT(*) AS count FROM attendance WHERE user_email = ? AND A_type = "in" AND date_column = ?';
  con.query(selectSql, [label, currentDate], function (err, result) {
    if (err) {
      console.error("An error occurred while checking attendance entry:", err);
      res.status(500).json({ success: false, error: err });
    } else {
      const exists = result[0].count > 0;
      res.json({ exists });
    }
  });
});

router.post("/checkAttendance", function (req, res, next) {
  var label = req.body.label;
  var currentDate = formatDateToMySQLDate(new Date());

  var selectSql =
    'SELECT COUNT(*) AS count FROM attendance WHERE user_email = ? AND A_type = "in" AND date_column = ?';
  con.query(selectSql, [label, currentDate], function (err, result) {
    if (err) {
      console.error("An error occurred while checking attendance entry:", err);
      res.status(500).json({ success: false, error: err });
    } else {
      const exists = result[0].count > 0;
      res.json({ exists });
    }
  });
});

function formatDateToMySQLDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}
var currentDate = formatDateToMySQLDate(new Date());

router.post("/attendanceMeeting", function (req, res, next) {
  const userEmail = req.session.email;
  const getUserInfoQuery =
    "SELECT id, user_id, email, user_name FROM user_master WHERE email = ?";

  con.query(getUserInfoQuery, [userEmail], (err, userResults) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error retrieving user information");
    } else {
      const meetIn = req.body.meet_in;
      const lat = req.body.Lat;
      const lon = req.body.Lon;
      const cType = req.body.c_type;
      const dateField = req.body.date_field;
      const timeField = req.body.time_field;
      const companyName = req.body.companyName;

      const insertMeetingQuery = `
        INSERT INTO meeting_table (user_Id, email, meet_in, Lat, Lon, Ctype, date_field, time_field, user_name1, companyName)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const userData = userResults[0];

      con.query(
        insertMeetingQuery,
        [
          userData.id,
          userData.email,
          meetIn,
          lat,
          lon,
          cType,
          dateField,
          timeField,
          userData.user_name,
          companyName,
        ],
        (insertErr, insertResults) => {
          if (insertErr) {
            console.error(insertErr);
            res.status(500).send("Error inserting meeting data");
          } else {
            res.render("attendanceMeeting");
          }
        }
      );
    }
  });
});

router.post("/attendanceMeetingOut", function (req, res, next) {
  const userEmail = req.session.email;
  const getUserInfoQuery =
    "SELECT id, user_id, email, user_name FROM user_master WHERE email = ?";

  con.query(getUserInfoQuery, [userEmail], (err, userResults) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error retrieving user information");
    } else {
      const user_id = userResults[0].id;
      const image_path = req.files.profileImage;
      const clientName = req.body.clientName;
      const client_email = req.body.client_email;
      const client_mobile = req.body.client_mobile;
      const lead_status = req.body.client_status;

      const imageFileName = `${user_id}-${Date.now()}-${image_path.name}`;

      image_path.mv(`public/client/${imageFileName}`, (imageMoveErr) => {
        if (imageMoveErr) {
          console.error(imageMoveErr);
          res.status(500).send("Error saving the image");
        } else {
          const updateMeetingQuery = `
          UPDATE meeting_table 
          SET meet_out = NOW(), time_field = CONVERT_TZ(NOW(), '+00:00', '+12:30'), 
          clientName = ?, client_email = ?, client_mobile = ?, image_path = ?, lead_status = ?
          WHERE user_Id = ? AND meet_out IS NULL
        `;

          con.query(
            updateMeetingQuery,
            [
              clientName,
              client_email,
              client_mobile,
              imageFileName,
              lead_status,
              user_id,
            ],
            (updateErr, updateResults) => {
              if (updateErr) {
                console.error(updateErr);
                res.status(500).send("Error updating meeting data");
              } else {
                res.render("attendanceMeetingOut");
              }
            }
          );
        }
      });
    }
  });
});

router.post("/storeMeetoutTime", function (req, res, next) {
  var label = req.body.label;
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;

  var selectSql = "SELECT id, email FROM user_master WHERE user_id = ?";
  con.query(selectSql, [label], function (err, result) {
    if (err) {
      console.error("An error occurred while retrieving user details:", err);
      res.status(500).json({ success: false, error: err });
    } else {
      if (result.length > 0) {
        var user_id = result[0].id;
        var email = result[0].email;

        var updateSql =
          "UPDATE meeting_table SET meet_out = NOW(), time_field = CURTIME() WHERE user_Id = ? AND meet_out IS NULL";
        con.query(updateSql, [user_id], function (err, result) {
          if (err) {
            console.error(
              "An error occurred while storing check-out time:",
              err
            );
            res.status(500).json({ success: false, error: err });
          } else {
            console.log(
              "Checkout time and time_field stored for label:",
              label
            );
            res.json({ success: true });
          }
        });
      } else {
        console.error("User not found with label:", label);
        res.status(404).json({ success: false, error: "User not found" });
      }
    }
  });
});

router.post("/storeCheckoutTime", function (req, res, next) {
  var label = req.body.label;
  var updateType = "out";
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;
  var range_status = req.body.range_status;

  var selectSql =
    "SELECT id, email, user_name FROM user_master WHERE user_id = ?";
  con.query(selectSql, [label], function (err, result) {
    if (err) {
      console.error("An error occurred while retrieving user details:", err);
      res.status(500).json({ success: false, error: err });
    } else {
      if (result.length > 0) {
        var user_id = result[0].id;
        var email = result[0].email;
        var username = result[0].user_name;

        var insertSql = "CALL Attendance(?, ?, ?, ?, ?, ?, ?)";
        con.query(
          insertSql,
          [
            user_id,
            updateType,
            latitude,
            longitude,
            range_status,
            email,
            username,
          ],
          function (err, result) {
            if (err) {
              console.error(
                "An error occurred while storing checkout time:",
                err
              );
              res.status(500).json({ success: false, error: err });
            } else {
              console.log("Checkout time stored for label:", label);
              res.json({ success: true });
            }
          }
        );
      } else {
        console.error("User not found with label:", label);
        res.status(404).json({ success: false, error: "User not found" });
      }
    }
  });
});

router.post("/storeCheckinTime", function (req, res, next) {
  var label = req.body.label;
  var updateType = "in";
  var latitude = req.body.latitude;
  var longitude = req.body.longitude;
  var range_status = req.body.range_status;

  var selectSql =
    "SELECT id, email, user_name FROM user_master WHERE user_id = ?";
  con.query(selectSql, [label], function (err, result) {
    if (err) {
      console.error("An error occurred while retrieving user details:", err);
      res.status(500).json({ success: false, error: err });
    } else {
      if (result.length > 0) {
        var user_id = result[0].id;
        var email = result[0].email;
        var username = result[0].user_name;

        var insertSql = "CALL Attendance(?, ?, ?, ?, ?, ?, ?)";
        con.query(
          insertSql,
          [
            user_id,
            updateType,
            latitude,
            longitude,
            range_status,
            email,
            username,
          ],
          function (err, result) {
            if (err) {
              console.error(
                "An error occurred while storing check-in time:",
                err
              );
              res.status(500).json({ success: false, error: err });
            } else {
              console.log("Check-in time stored for label:", label);
              res.json({ success: true });
            }
          }
        );
      } else {
        console.error("User not found with label:", label);
        res.status(404).json({ success: false, error: "User not found" });
      }
    }
  });
});

function getUserIDFromLabel(label) {
  var callProc = "CALL get_user_id_by_label(?)";
  var result = con.query(callProc, [label]);
  if (result[0].length > 0) {
    return result[0][0].id;
  } else {
    return null;
  }
}


router.post("/generateusersjson", function (req, res, next) {

  var fs = require("fs");

  let usersjson = req.body.usersjson;

  let userfilename = req.body.userfilename;



  //fs.writeFile ("users.json", usersjson, function(err) {

  fs.writeFile(

    "public/" + userfilename,

    usersjson,

    "utf8",

    function (err) {

      if (err) throw err;

      console.log("complete");

      res.json("ok");

    }

  );

});
// router.post("/generateusersjson/:userid", function (req, res, next) {
//   const usersjson = req.body.usersjson;
//   const userId = req.params.userid;
//   const publicDirectory = path.join(__dirname, "../public");

//   if (!fs.existsSync(publicDirectory)) {
//     fs.mkdirSync(publicDirectory);
//   }

//   const filePath = path.join(publicDirectory, `${userId}`);

//   fs.writeFile(filePath, usersjson, "utf8", function (err) {
//     if (err) {
//       console.error(err);
//       res.status(500).json("Error writing the file.");
//     } else {
//       console.log("File saved:", filePath);
//       res.json("File saved successfully.");
//     }
//   });
// });

//Attendance add update delete
router.get("/attendanceAUD", isAdmin, checkUser, function (req, res, next) {
  con.query("CALL GetDistinctUserNames()", function (error, userResults) {
    if (error) throw error;

    con.query("CALL GetAttendanceData()", function (error, results) {
      if (error) throw error;

      res.render("attendance", {
        message: "Welcome, " + req.session.email,
        users: userResults[0],
        rows: results[0],
      });
    });
  });
});

router.get("/addAttendance", isAdmin, checkUser, function (req, res, next) {
  con.query("CALL GetUsers()", (err, results) => {
    if (err) throw err;

    const users = results[0];

    // Fetch branch details
    con.query("SELECT * FROM branch_table", (err, branchResults) => {
      if (err) throw err;

      const branches = branchResults;

      // Render the addAttendance view with both users and branches
      res.render("addAttendance", { users: users, branches: branches });
    });
  });
});


router.post("/addAttendance", function (req, res, next) {
  const {
    userDropdwon,
    date,
    time,
    A_type,
    userLat,
    userLon,
    attendanceMark,
    rangeStatus,
  } = req.body;

  const procedure = "AddAttendanceProcedure";

  con.query(
    `CALL AddAttendanceProcedure(?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userDropdwon,
      date,
      time,
      A_type,
      userLat,
      userLon,
      attendanceMark,
      rangeStatus,
    ],
    (err, result) => {
      if (err) throw err;

      console.log("Attendance data inserted:", result);
      res.redirect("/attendanceAUD");
    }
  );
});

router.get("/deleteAttendance/:id", isAdmin, checkUser, function (req, res, next) {
  const attendanceId = req.params.id;

  con.query(
    "CALL DeleteAttendanceById(?)",
    [attendanceId],
    function (error, results, fields) {
      if (error) throw error;

      console.log("User deleted:", attendanceId);
      res.redirect("/attendanceAUD?removed=true");
    }
  );
});

router.get("/attendanceEdit/:id", isAdmin, checkUser, function (req, res, next) {
  var userId = req.params.id;
  var callProc = "CALL GetAttendanceById(?)";

  con.query(callProc, [userId], function (err, result) {
    if (err) throw err;

    if (result[0].length > 0) {
      var user = result[0][0];

      var aTypeInSelected = user.A_type === "in" ? "selected" : "";
      var aTypeOutSelected = user.A_type === "out" ? "selected" : "";

      var rangeStatusOkSelected = user.range_status === "ok" ? "selected" : "";
      var rangeStatusOnFieldSelected = user.range_status === "onfield" ? "selected" : "";

      var attendanceMarkPresentSelected = user.attendance_mark === "Present" ? "selected" : "";
      var attendanceMarkHalfdaySelected = user.attendance_mark === "Halfday" ? "selected" : "";
      var attendanceMarkAbsentSelected = user.attendance_mark === "Absent" ? "selected" : "";

      res.render("attendanceEdit", {
        title: "scaleedge",
        user: user,
        aTypeInSelected: aTypeInSelected,
        aTypeOutSelected: aTypeOutSelected,
        rangeStatusOkSelected: rangeStatusOkSelected,
        rangeStatusOnFieldSelected: rangeStatusOnFieldSelected,
        attendanceMarkPresentSelected: attendanceMarkPresentSelected,
        attendanceMarkHalfdaySelected: attendanceMarkHalfdaySelected,
        attendanceMarkAbsentSelected: attendanceMarkAbsentSelected
      });
    } else {
      res.redirect("/attendanceAUD");
    }
  });
});


router.post("/updateAttendance/:id", function (req, res, next) {
  var userId = req.params.id;
  var user_name = req.body.user_name;
  var date = req.body.date;
  var time = req.body.time;
  var A_type = req.body.A_type;
  var userLat = req.body.userLat;
  var userLon = req.body.userLon;
  var rangeStatus = req.body.rangeStatus;
  var attendanceMark = req.body.attendanceMark;

  var updateProcedure = "CALL UpdateAttendance(?, ?, ?, ?, ?, ?, ?, ?, ?)";

  con.query(
    updateProcedure,
    [
      userId,
      user_name,
      date,
      time,
      A_type,
      userLat,
      userLon,
      rangeStatus,
      attendanceMark,
    ],
    function (err, results, fields) {
      if (err) throw err;

      console.log(results[0][0].message);

      res.redirect("/attendanceAUD");
    }
  );
});

// Combined router for fetching both holiday and halfday data
router.get("/holiday", checkUser, isAdmin, function (req, res, next) {
  con.query("CALL GetHolidayData()", function (error, holidayResults) {
    if (error) {
      return next(error);
    }

    con.query("CALL GetHalfdayData()", function (error, halfdayResults) {
      if (error) {
        return next(error);
      }

      const holidayData = holidayResults[0].map((entry) => {
        return { ...entry, Date: entry.FormattedDate };
      });

      const halfdayData = halfdayResults[0].map((entry) => {
        return { ...entry, Date: entry.FormattedDate };
      });

      res.render("Holiday", {
        message: "Welcome, " + req.session.email,
        holidayData,
        halfdayData,
      });
    });
  });
});


router.post("/saveHoliday", (req, res) => {
  const { month, year, date, remarks } = req.body;

  const insertQuery =
    "INSERT INTO holiday_master (Month, Year, Date, Remarks) VALUES (?, ?, ?, ?)";
  con.query(insertQuery, [month, year, date, remarks], (error, results) => {
    if (error) {
      res.status(500).send("Failed to insert holiday data");
    } else {
      res.status(200).send("Holiday data saved successfully");
    }
  });
});

router.post("/saveHalfday", (req, res) => {
  const { month, year, date, remarks } = req.body;

  const insertQuery =
    "INSERT INTO halfday (Month, Year, Date) VALUES (?, ?, ?)";
  con.query(insertQuery, [month, year, date], (error, results) => {
    if (error) {
      res.status(500).send("Failed to insert halfday data");
    } else {
      res.status(200).send("Holiday data saved successfully");
    }
  });
});

router.delete("/deleteHoliday/:id", checkUser, function (req, res, next) {
  const holidayId = req.params.id;

  con.query("CALL DeleteHoliday(?)", [holidayId], function (error, results) {
    if (error) {
      console.error("Delete error:", error);
      return res.json({ success: false });
    }
    return res.json({ success: true });
  });
});


router.delete("/deleteHalfday/:id", checkUser, function (req, res, next) {
  const holidayId = req.params.id;

  con.query("CALL DeleteHalfday(?)", [holidayId], function (error, results) {
    if (error) {
      console.error("Delete error:", error);
      return res.json({ success: false });
    }
    return res.json({ success: true });
  });
});

router.get("/editHoliday/:Id", isAdmin, checkUser, function (req, res, next) {
  var userId = req.params.Id;
  var selectSql =
    "SELECT Id, Month, Year, Date, Remarks FROM holiday_master WHERE Id = ?";
  con.query(selectSql, [userId], function (err, result) {
    if (err) throw err;

    if (result.length > 0) {
      const userDate = new Date(result[0].Date).toISOString().split("T")[0];
      const startYear = 1995;
      const endYear = 2030;
      const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
      );

      const userMonth = result[0].Month;

      res.render("editHoliday", {
        title: "scaleedge",
        user: result[0],
        months: [
          "Select a month",
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
        years: years,
        userDate: userDate,
        userMonth: userMonth,
      });
    } else {
      res.redirect("/holiday");
    }
  });
});


router.get("/editHalfday/:Id", isAdmin, checkUser, function (req, res, next) {
  var userId = req.params.Id;
  var selectSql =
    "SELECT Id, Month, Year, Date FROM halfday WHERE Id = ?";
  con.query(selectSql, [userId], function (err, result) {
    if (err) throw err;

    if (result.length > 0) {
      const userDate = new Date(result[0].Date).toISOString().split("T")[0];
      const startYear = 1995;
      const endYear = 2030;
      const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
      );

      const userMonth = result[0].Month;

      res.render("editHalfday", {
        title: "scaleedge",
        user: result[0],
        months: [
          "Select a month",
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
        years: years,
        userDate: userDate,
        userMonth: userMonth,
      });
    } else {
      res.redirect("/holiday");
    }
  });
});

router.post("/updateHoliday/:Id", function (req, res, next) {
  var userId = req.params.Id;
  var month = req.body.month;
  var year = req.body.year;
  var date = req.body.date;
  var remarks = req.body.remarks;

  con.query(
    "CALL UpdateHoliday(?, ?, ?, ?, ?)",
    [userId, month, year, date, remarks],
    function (err, result) {
      if (err) throw err;
      res.redirect("/holiday");
    }
  );
});

router.post("/updateHalfday/:Id", function (req, res, next) {
  var userId = req.params.Id;
  var month = req.body.month;
  var year = req.body.year;
  var date = req.body.date;

  con.query(
    "CALL UpdateHalfday(?, ?, ?, ?)",
    [userId, month, year, date],
    function (err, result) {
      if (err) throw err;
      res.redirect("/holiday");
    }
  );
});

//salary router
router.get("/salaryFinder", isAdmin, checkUser, function (req, res, next) {
  con.query("SELECT user_name FROM user_master", function (error, results) {
    if (error) {
      throw error;
    }
    const users = results;
    res.render("salary", { title: "scaleedge", users });
  });
});

router.post("/salaryFinder", (req, res) => {
  const selected_year = req.body.selected_year;
  const selected_month = req.body.selected_month;
  const selected_user_name = req.body.selected_user_name;

  con.query("SELECT user_name FROM user_master", (error, users) => {
    if (error) {
      console.error(error);
      return res.status(500).send("Error fetching user data");
    }

    con.query(
      "SELECT SUM(total_salary_perDay_hour) AS total_salary FROM salary_user WHERE user_name = ? AND selected_month = ? AND selected_year = ?",  // Update the query to include selected_year
      [selected_user_name, selected_month, selected_year],
      (error, salaryData) => {
        if (error) {
          console.error(error);
          return res.status(500).send("Error fetching salary data");
        }

        con.query(
          "CALL SalaryBureo(?, ?, ?)",  // Update the call to the stored procedure to include selected_year
          [selected_year, selected_month, selected_user_name],
          (error, results) => {
            if (error) {
              console.error(error);
              return res.status(500).send("Error calling the stored procedure");
            }

            const userHoursData = results[0];

            userHoursData.forEach((row) => {
              row.date_column = formatDate(row.date_column);
            });

            res.render("salary", {
              title: "scaleedge",
              users,
              userHoursData,
              total_salary: salaryData[0].total_salary,
            });
          }
        );
      }
    );
  });
});


function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).substring(2);

  return `${dd}-${mm}-${yy}`;
}

// router.post("/salaryFinder", function (req, res, next) {
//   const selectedMonth = req.body.selected_month;
//   const selectedUserName = req.body.selected_user_name;

//   con.query("SELECT user_name FROM user_master", function (error, results) {
//     if (error) {
//       throw error;
//     }
//     const users = results;

//     con.query(
//       "CALL SalaryBureo(?, ?)",
//       [selectedMonth, selectedUserName],
//       function (error, results) {
//         if (error) {
//           throw error;
//         }
//         const userHoursData = results[0];

//         for (const row of userHoursData) {
//           const date = new Date(row.date_column);
//           row.date_column = date.toISOString().split("T")[0];
//         }

//         const existingDates = [];
//         let selectedUserSalaryPerHour = "0.00";
//         let selectedUserSalaryPerDay = "0.00";

//         for (const row of userHoursData) {
//           if (row.user_name === selectedUserName) {
//             existingDates.push(row.date_column);
//             selectedUserSalaryPerHour = row.salary_per_hour;
//             selectedUserSalaryPerDay = row.salary_per_day;
//           }
//         }

//         const allDates = getDatesInMonth(selectedMonth);

//         const missingDates = allDates.filter(
//           (date) => !existingDates.includes(date)
//         );

//         const missingData = missingDates.map((date) => ({
//           user_name: selectedUserName,
//           date_column: date,
//           hours_worked: "00:00:00",
//           salary_per_day: selectedUserSalaryPerDay,
//           salary_per_hour: selectedUserSalaryPerHour,
//           salary_perDay_hour: "0.00",
//         }));

//         const combinedData = userHoursData.concat(missingData);

//         combinedData.sort((a, b) => a.date_column.localeCompare(b.date_column));

//         let totalSalary = 0;
//         for (const row of combinedData) {
//           totalSalary += parseFloat(row.salary_perDay_hour);
//         }

//         res.render("salary", {
//           title: "scaleedge",
//           users,
//           selectedUserName,
//           userHoursData: combinedData,
//           totalSalary,
//         });
//       }
//     );
//   });
// });

function getDatesInMonth(selectedMonth) {
  const dates = [];
  const currentDate = new Date();
  currentDate.setMonth(selectedMonth - 1);

  while (currentDate.getMonth() === selectedMonth - 1) {
    if (currentDate.getDay() === 0) {
      dates.push(currentDate.toISOString().slice(0, 10));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

router.get("/salaryTracker", isAdmin, checkUser, (req, res, next) => {
  res.render("salaryTracker", { title: "scaleedge" });
});

router.post("/generate-salary", (req, res) => {
  const selectedMonth = req.body.selectedMonth;
  const selectedYear = req.body.selectedYear;

  con.query(
    "CALL new_generate_salary1(?, ?)",
    [selectedMonth, selectedYear],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Error fetching salary data");
      }

      con.query("SELECT * FROM salary_user", (err, salaryData) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error fetching salary data");
        }

        res.render("salaryTracker", {
          title: "scaleedge",
          salaryData,
          selectedMonth,
          selectedYear,
        });
      });
    }
  );
});


router.get("/salaryView", isAdmin, checkUser, (req, res, next) => {
  const userEmail = req.session.email;

  const getUserQuery = "SELECT user_name FROM user_master WHERE email = ?";

  con.query(getUserQuery, [userEmail], (err, results) => {
    if (err) {
      console.error("Error fetching user_name:", err);
      return next(err);
    }

    if (results.length === 0) {
      return res.status(404).send("User not found");
    }

    const selectedUserName = results[0].user_name;
    const currentDate = new Date();
    const selectedMonth = (currentDate.getMonth() === 0) ? 12 : currentDate.getMonth();
    const selectedYear = (selectedMonth === 12) ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

    const procedureQuery = "CALL new_generate_salary2(?, ?, ?)";

    con.query(procedureQuery, [selectedUserName, selectedMonth, selectedYear], (procedureErr, procedureResults) => {
      if (procedureErr) {
        console.error("Error calling MySQL procedure:", procedureErr);
        return next(procedureErr);
      }

      // Render the view with the procedure results
      res.render("salaryUserView", {
        title: "scaleedge",
        selectedUserName: selectedUserName,
        selectedMonth: selectedMonth,
        selectedYear: selectedYear,
        salaryData: procedureResults[0] // Assuming the result is in the first element of the array
      });
    });
  });
});


//user report router
router.get("/user_report", isUser, checkUser, function (req, res, next) {
  con.query(
    "SELECT DISTINCT user_name FROM user_master",
    function (error, users) {
      if (error) {
        console.log("Error fetching users:", error);
        return res.status(500).send("Internal Server Error");
      }

      con.query("CALL GetAttendanceReport()", function (error, rows) {
        if (error) {
          console.log("Error fetching attendance data:", error);
          return res.status(500).send("Internal Server Error");
        }
        res.render("userReport", {
          title: "payRoll",
          rows: rows[0],
          users: users,
        });
      });
    }
  );
});

//report_user router
function getAllDatesForMonth(year, month) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);

  if (year === currentYear && month === currentMonth) {
    const lastDay = Math.min(
      lastDayOfCurrentMonth.getDate(),
      currentDate.getDate()
    );
    const dates = [];

    for (let day = 1; day <= lastDay + 1; day++) {
      dates.push(new Date(year, month, day));
    }

    return dates;
  } else {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const dates = [];

    for (
      let date = firstDay;
      date <= lastDay;
      date.setDate(date.getDate() + 1)
    ) {
      dates.push(new Date(date));
    }

    return dates;
  }
}

router.get("/report_user", isUser, checkUser, function (req, res, next) {
  const userEmail = req.session.email;

  con.query(
    "SELECT DISTINCT user_name FROM user_master WHERE email = ?",
    [userEmail],
    function (error, users) {
      if (error) {
        console.log("Error fetching users:", error);
        return res.status(500).send("Internal Server Error");
      }

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();

      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      const allDatesForCurrentMonth = getAllDatesForMonth(
        currentYear,
        currentMonth
      );
      const allDatesForPrevMonth = getAllDatesForMonth(
        prevMonthYear,
        prevMonth
      );

      con.query("CALL summaryTracker(?)", [userEmail], function (error, rows) {
        if (error) {
          console.log("Error fetching attendance data:", error);
          return res.status(500).send("Internal Server Error");
        }

        const combinedRows = [];

        allDatesForCurrentMonth.forEach((date) => {
          const dateString = date.toISOString().split("T")[0];
          const existingRow = rows[0].find(
            (row) => row.date_column === dateString
          );

          const isSunday = date.getDay() === 1;

          combinedRows.push({
            user_name: users[0].user_name,
            date_column: dateString,
            time_in: existingRow ? existingRow.time_in : "--",
            time_out: existingRow ? existingRow.time_out : "--",
            hours_worked: existingRow ? existingRow.hours_worked : "--",
            attendance_mark: isSunday
              ? "Sunday"
              : existingRow
                ? existingRow.attendance_mark
                : "Absent",
          });
        });

        allDatesForPrevMonth.forEach((date) => {
          const dateString = date.toISOString().split("T")[0];
          const existingRow = rows[0].find(
            (row) => row.date_column === dateString
          );

          const isSunday = date.getDay() === 0;

          combinedRows.push({
            user_name: users[0].user_name,
            date_column: dateString,
            time_in: existingRow ? existingRow.time_in : "--",
            time_out: existingRow ? existingRow.time_out : "--",
            hours_worked: existingRow ? existingRow.hours_worked : "--",
            attendance_mark: isSunday
              ? "Sunday"
              : existingRow
                ? existingRow.attendance_mark
                : "Absent",
          });
        });

        combinedRows.sort((a, b) => (a.date_column < b.date_column ? -1 : 1));

        res.render("reportUser", {
          title: "payRoll",
          rows: combinedRows,
          users: users,
        });
      });
    }
  );
});

//manualAttendance router
router.get("/manualAttendance", isUser, checkUser, function (req, res, next) {
  const userEmail = req.session.email;

  con.query(
    "SELECT user_name FROM user_master WHERE email = ?",
    [userEmail],
    function (error, results) {
      if (error) {
        console.error("Database query error:", error);
        return res
          .status(500)
          .json({ success: false, error: "Database error" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      const user_name = results[0].user_name;

      res.render("manualAttendance", { title: "scaleedge", user_name });
    }
  );
});

router.post("/manualAttendance", function (req, res, next) {
  const {
    user_name,
    date,
    time,
    A_type,
    userLat,
    userLon,
    attendanceMark,
    rangeStatus,
  } = req.body;

  con.query(
    "CALL InsertManualAttendance(?, ?, ?, ?, ?, ?, ?, ?)",
    [
      user_name,
      date,
      time,
      A_type,
      userLat,
      userLon,
      attendanceMark,
      rangeStatus,
    ],
    function (error, results) {
      if (error) {
        console.error("Database query error:", error);
        return res
          .status(500)
          .json({ success: false, error: "Database error" });
      }

      res.redirect("/report_user");
    }
  );
});

router.post("/manualAttendanceDashboard", function (req, res, next) {
  const {
    user_name,
    date,
    time,
    A_type,
    userLat,
    userLon,
    attendanceMark,
    rangeStatus,
  } = req.body;

  con.query(
    "CALL InsertManualAttendance(?, ?, ?, ?, ?, ?, ?, ?)",
    [
      user_name,
      date,
      time,
      A_type,
      userLat,
      userLon,
      attendanceMark,
      rangeStatus,
    ],
    function (error, results) {
      if (error) {
        console.error("Database query error:", error);
        return res
          .status(500)
          .json({ success: false, error: "Database error" });
      }

      res.json({ success: true, message: "Attendance data inserted successfully." });
    }
  );
});


// check manual data is exists in table or not router
router.post("/checkData", function (req, res, next) {
  const { user_name, date, A_type } = req.body;

  con.query(
    "SELECT COUNT(*) as count FROM attendance WHERE user_name = ? AND date_column = ? AND A_type = ?",
    [user_name, date, A_type],
    function (error, results) {
      if (error) {
        console.error("Database query error:", error);
        res.status(500).json({ exists: false, error: "Database error" });
      } else {
        const count = results[0].count;
        res.status(200).json({ exists: count > 0 });
      }
    }
  );
});

//get attendance manual data router
router.get("/attendanceManual", checkUser, function (req, res, next) {
  const query = "CALL GetAttendanceManual()";
  con.query(query, function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }
    res.render("attendanceManual", {
      title: "scaleedge",
      manualData: results[0],
    });
  });
});

//approve attendance get router
router.get("/approveAttendance/:id", checkUser, function (req, res, next) {
  const id = req.params.id;

  const query = "CALL GetManualData(?)";
  con.query(query, [id], function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    if (results[0].length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Record not found" });
    }

    const manualData = results[0][0];

    const dbDate = new Date(manualData.date_column);

    dbDate.setMinutes(dbDate.getMinutes() - dbDate.getTimezoneOffset());

    res.render("approveAttendance", {
      title: "scaleedge",
      id: manualData.id,
      user_id: manualData.user_id,
      email: manualData.user_email,
      user_name: manualData.user_name,
      date: dbDate.toISOString().slice(0, 10),
      time: manualData.time_column,
      A_type: manualData.A_type,
      userLat: manualData.user_lat,
      userLon: manualData.user_lon,
      attendanceMark: manualData.attendance_mark,
      rangeStatus: manualData.range_status,
    });
  });
});

//approve attendance post router
// router.post("/approveAttendance", function (req, res, next) {
//   const {
//     id,
//     user_id,
//     user_name,
//     user_email,
//     date,
//     time,
//     A_type,
//     userLat,
//     userLon,
//   } = req.body;
//   const attendanceMark = (req.body.attendanceMark || "").trim();
//   const rangeStatus = (req.body.rangeStatus || "").trim();

//   const updateQuery = "UPDATE manual SET status = 'approve', approved_by = ?, approve_datetime = NOW(), approve_ip = ? WHERE id = ?";
//   const approveIp = req.ip === '::1' ? ip.address() : req.ip;

//   con.query(updateQuery, [req.session.email, approveIp, id], function (updateError, updateResults) {
//     if (updateError) {
//       console.error("Database query error:", updateError);
//       return res.status(500).json({ success: false, error: "Database error" });
//     }

//     const query = `
//       INSERT INTO attendance (user_id, user_name, user_email, date_column, time_column, A_type, user_lat, user_lon, attendance_mark, range_status)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     // Add req.session.email to the values array
//     const values = [
//       user_id,
//       user_name,
//       user_email,
//       date,
//       time,
//       A_type,
//       userLat,
//       userLon,
//       attendanceMark,
//       rangeStatus,
//     ];

//     con.query(query, values, function (error, results) {
//       if (error) {
//         console.error("Database query error:", error);
//         return res
//           .status(500)
//           .json({ success: false, error: "Database error" });
//       }

//       res.json({
//         success: true,
//         message:
//           "Attendance has been approved and data inserted into the attendance table",
//       });
//     });
//   });
// });

// Approve attendance post router
router.post("/approveAttendance1", function (req, res, next) {
  const ids = req.body.ids;
  const additionalData = JSON.parse(req.body.additionalData);

  const approveIp = req.ip === '::1' ? ip.address() : req.ip;

  const updateQuery = "UPDATE manual SET status = 'approve', approved_by = ?, approve_datetime = NOW(), approve_ip = ? WHERE id IN (?)";
  con.query(updateQuery, [req.session.email, approveIp, ids], function (updateError, updateResults) {
    if (updateError) {
      console.error("Database query error during update:", updateError);
      return res.status(500).json({ success: false, error: "Database error during update" });
    }

    const selectQuery = "SELECT * FROM manual WHERE id IN (?)";
    con.query(selectQuery, [ids], function (selectError, selectResults) {
      if (selectError) {
        console.error("Database query error during select:", selectError);
        return res.status(500).json({ success: false, error: "Database error during select" });
      }

      if (selectResults.length === 0) {
        return res.status(404).json({ success: false, error: "No records found for the specified IDs" });
      }

      const insertQuery = "INSERT INTO attendance (user_id, user_name, user_email, date_column, time_column, A_type, user_lat, user_lon, attendance_mark, range_status) VALUES ?";
      const values = selectResults.map(row => [
        row.user_id,
        row.user_name,
        row.user_email,
        row.date_column,
        row.time_column,
        row.A_type,
        row.user_lat,
        row.user_lon,
        row.attendance_mark,
        row.range_status
      ]);

      console.log("Data to be inserted into attendance table:", values);

      con.query(insertQuery, [values], function (insertError, insertResults) {
        if (insertError) {
          console.error("Database query error during insert:", insertError);
          return res.status(500).json({ success: false, error: "Error inserting into attendance table" });
        }

        console.log("Inserted data into attendance table:", values);

        res.json({
          success: true,
          message: "Attendance has been approved and data inserted into the attendance table",
        });
      });
    });
  });
});

// reject attendance post router
// router.post("/rejectAttendance", function (req, res, next) {
//   const { id } = req.body;

//   const updateQuery = "UPDATE manual SET status = 'reject', approved_by = ?, approve_datetime = NOW(), approve_ip = ? WHERE id = ?";
//   const rejectIp = req.ip === '::1' ? ip.address() : req.ip;
//   con.query(updateQuery,[req.session.email,rejectIp, id], function (updateError, updateResults) {
//     if (updateError) {
//       console.error("Database query error:", updateError);
//       return res.status(500).json({ success: false, error: "Database error" });
//     }

//     res.json({ success: true, message: "Attendance has been rejected" });
//   });
// });

router.post("/rejectAttendance1", function (req, res, next) {
  const ids = req.body.ids;

  const updateQuery = "UPDATE manual SET status = 'reject', approved_by = ?, approve_datetime = NOW(), approve_ip = ? WHERE id IN (?)";
  const rejectIp = req.ip === '::1' ? ip.address() : req.ip;

  con.query(updateQuery, [req.session.email, rejectIp, ids], function (updateError, updateResults) {
    if (updateError) {
      console.error("Database query error:", updateError);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    // Assuming that you don't need to perform any additional actions for rejection

    res.json({ success: true, message: "Attendance has been rejected" });
  });
});

//userManualUpdate router for get
router.get("/userManualUpdate", checkUser, function (req, res, next) {
  const userEmail = req.session.email;
  con.query("CALL GetAtteManual(?)", [userEmail], function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }
    res.render("userManualUpdate", { title: "scaleedge", rows: results[0] });
  });
});

//traveling allowance
router.get("/travelDistanceAdmin", checkUser, function (req, res, next) {
  con.query("SELECT user_name FROM user_master", function (error, results) {
    if (error) {
      throw error;
    }
    const users = results;
    res.render("travel_distance_admin", { title: "scaleedge", users });
  });
});

router.get("/travelMeetingAdmin", checkUser, function (req, res, next) {
  con.query("SELECT user_name FROM user_master", function (error, results) {
    if (error) {
      throw error;
    }
    const users = results;
    res.render("travel_meeting_admin", { title: "scaleedge", users });
  });
});

// router.post("/fetchData", function (req, res) {
//   const selectedMonth = req.body.selected_month;
//   const userEmail = req.session.email;

//   con.query(
//     "SELECT id FROM user_master WHERE email = ?",
//     [userEmail],
//     function (error, userResults) {
//       if (error) {
//         console.error(error);
//         res.status(500).send("Error fetching user ID");
//       } else {
//         if (userResults.length > 0) {
//           const userId = userResults[0].id;

//           con.query(
//             "CALL GenerateTemporaryTableWithDistance(?, ?)",
//             [userId, selectedMonth],
//             function (error, results) {
//               if (error) {
//                 console.error(error);
//                 res.status(500).send("Error fetching data");
//               } else {
//                 const data = results[0].map((row) => ({
//                   ...row,
//                   date: new Date(row.date).toLocaleDateString("en-US"),
//                   distance1: row.distance1.toFixed(3),
//                   distance2: row.distance2.toFixed(3),
//                   distance3: row.distance3.toFixed(3),
//                   distance4: row.distance4.toFixed(3),
//                   distance5: row.distance5.toFixed(3),
//                   total_distance: row.total_distance.toFixed(3),
//                   total_cost: row.total_cost.toFixed(3),
//                 }));
//                 res.render("travel_user_distance", { rows: data });
//               }
//             }
//           );
//         } else {
//           res.status(404).send("User not found");
//         }
//       }
//     }
//   );
// });

// router.post("/fetchData1", function (req, res) {
//   const selectedMonth = req.body.selected_month;
//   const userEmail = req.session.email;

//   con.query(
//     "SELECT user_name FROM user_master WHERE email = ?",
//     [userEmail],
//     function (error, userResults) {
//       if (error) {
//         console.error(error);
//         res.status(500).send("Error fetching user ID");
//       } else {
//         if (userResults.length > 0) {
//           const userId = userResults[0].id;

//           con.query(
//             "CALL GenerateTemporaryTableWithDistance(?, ?)",
//             [userId, selectedMonth],
//             function (error, results) {
//               if (error) {
//                 console.error(error);
//                 res.status(500).send("Error fetching data");
//               } else {
//                 const data = results[0].map((row) => ({
//                   ...row,
//                   date: new Date(row.date).toLocaleDateString("en-US"),
//                   distance1: row.distance1.toFixed(3),
//                   distance2: row.distance2.toFixed(3),
//                   distance3: row.distance3.toFixed(3),
//                   distance4: row.distance4.toFixed(3),
//                   distance5: row.distance5.toFixed(3),
//                   total_distance: row.total_distance.toFixed(3),
//                   total_cost: row.total_cost.toFixed(3),
//                 }));
//                 res.render("travel_meeting", { rows: data });
//               }
//             }
//           );
//         } else {
//           res.status(404).send("User not found");
//         }
//       }
//     }
//   );
// });

// router.get("/getUserID", function (req, res) {
//   const userEmail = req.session.email;

//   con.query(
//     "SELECT user_name FROM user_master WHERE email = ?",
//     [userEmail],
//     function (error, results) {
//       if (error) {
//         console.error(error);
//         res.status(500).json({ user_id: null });
//       } else {
//         if (results.length > 0) {
//           const user_id = results[0].user_name;
//           res.json({ user_id });
//         } else {
//           res.json({ user_id: null });
//         }
//       }
//     }
//   );
// });

// router.get("/travelDistance", function (req, res, next) {
//   res.render("travel_user_distance");
// });

router.get("/travelMeeting", checkUser, function (req, res, next) {
  res.render("travel_meeting");
});

// router.post("/taCalculator", function (req, res, next) {
//   con.query("SELECT user_name FROM user_master", function (error, results) {
//     if (error) {
//       throw error;
//     }
//     const users = results;

//     const selectedUser = req.body.selected_user_name;
//     const selectedMonth = req.body.selected_month;
//     const selectedYear = req.body.selectedYear;

//     con.query(
//       "CALL CalculateDistance_17(?, ?, ?)",
//       [selectedUser, selectedMonth, selectedYear],
//       (err, results, fields) => {
//         if (err) {
//           console.error("Error executing the stored procedure:", err);
//           return next(err);
//         }

//         const dataFromProcedure = results[0];
//         dataFromProcedure.forEach((row) => {
//           row.date_column = formatDate(row.date_column);
//         });
//         console.log("Data from procedure:", dataFromProcedure);


//         res.render("travel_distance_admin", {
//           rows: dataFromProcedure,
//           users,
//           selectedUser,
//           selectedMonth,
//         });
//       }
//     );
//   });
// });

router.post("/taCalculator", function (req, res, next) {
  con.query("SELECT user_name FROM user_master", function (error, results) {
      if (error) {
          throw error;
      }
      const users = results;

      const selectedUser = req.body.selected_user_name;
      const selectedMonth = req.body.selected_month;
      const selectedYear = req.body.selectedYear;

      con.query(
          "CALL TaCalculatorNew(?, ?, ?)",
          [selectedUser, selectedMonth, selectedYear],
          (err, results, fields) => {
              if (err) {
                  console.error("Error executing the stored procedure:", err);
                  return next(err);
              }

              const dataFromProcedure = results[0]; // Data returned from the stored procedure
              dataFromProcedure.forEach((row) => {
                  row.date_column = formatDate(row.date_column);
              });
              console.log("Data from procedure:", dataFromProcedure);


              res.render("travel_distance_admin", {
                  rows: dataFromProcedure,
                  users,
                  selectedUser,
                  selectedMonth,
              });
          }
      );
  });
});


// router.post("/fetchData4", function (req, res, next) {  
//   con.query("SELECT user_name FROM user_master", function (error, results) {
//     if (error) {
//       throw error;
//     }
//     const users = results;

//     const selectedUser = req.body.selected_user_name;
//     const selectedMonth = req.body.selected_month;

//     con.query(
//       "CALL GenerateTemporaryTableWithDistanceWithName(?, ?)",
//       [selectedUser, selectedMonth],
//       (err, results, fields) => {
//         if (err) {
//           console.error("Error executing the stored procedure:", err);
//           return next(err);
//         }

//         const data = results[0];
//         data.forEach((row) => {
//           row.date = formatDate(row.date);
//         });

//         res.render("travel_meeting_admin", { rows: data, users });
//       }
//     );
//   });
// });

function formatDate(date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

//new Ta
router.get(
  "/travel_distance_admin1/:user_name/:date", checkUser,
  function (req, res, next) {
    const user_name = req.params.user_name;
    const date = req.params.date;

    // Ensure the date is in the correct format 'YYYY-MM-DD'
    const formattedDateString = formatDate(new Date(date));

    // Parse the formattedDateString to create a Date object
    const formattedDate = new Date(formattedDateString);

    // Check if the parsed date is valid
    if (isNaN(formattedDate.getTime())) {
      console.error("Invalid date format");
      res.status(400).send("Bad Request");
      return;
    }

    // Increment the date by one day
    formattedDate.setDate(formattedDate.getDate() + 1);

    // Call the stored procedure
    const query = `CALL CalculateDistance_1611('${user_name}', '${formattedDate
      .toISOString()
      .slice(0, 10)}')`;

    con.query(query, (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
        return;
      }

      const rows = results[0]; // Assuming the result of the stored procedure is in the first element of the results array
      rows.forEach((row) => {
        row.date = formatDate(row.date_column);
      });
      res.render("travel_distance_admin1", {
        title: "scaleedge",
        user_name,
        date,
        rows,
      });
    });
  }
);

router.get("/travelDistance", checkUser, function (req, res, next) {
  const userEmail = req.session.email;

  con.query(
    "SELECT user_name FROM user_master WHERE email = ?",
    [userEmail],
    function (error, results) {
      if (error) {
        throw error;
      }

      const users = results;

      res.render("travel_user_distance", { title: "scaleedge", users });
    }
  );
});


router.post("/taCalculatorForUser", function (req, res, next) {
  const userEmail = req.session.email;

  con.query(
    "SELECT user_name FROM user_master WHERE email = ?",
    [userEmail],
    function (error, results) {
      if (error) {
        throw error;
      }
      const users = results;

      const selectedUser = req.body.selected_user_name;
      const selectedMonth = req.body.selected_month;
      const selectedYear = req.body.selectedYear;

      con.query(
          "CALL TaCalculatorNew(?, ?, ?)",
          [selectedUser, selectedMonth, selectedYear],
          (err, results, fields) => {
              if (err) {
                  console.error("Error executing the stored procedure:", err);
                  return next(err);
              }

              const dataFromProcedure = results[0]; // Data returned from the stored procedure
              dataFromProcedure.forEach((row) => {
                  row.date_column = formatDate(row.date_column);
              });
              console.log("Data from procedure:", dataFromProcedure);


              res.render("travel_user_distance", {
                  rows: dataFromProcedure,
                  users,
                  selectedUser,
                  selectedMonth,
              });
          }
      );
  });
});

router.post("/fetchData5", function (req, res, next) {
  const userEmail = req.session.email;

  con.query(
    "SELECT user_name FROM user_master WHERE email = ?",
    [userEmail],
    function (error, results) {
      if (error) {
        throw error;
      }
      const users = results;

      const selectedUser = req.body.selected_user_name;
      const selectedMonth = req.body.selected_month;

      con.query(
        "CALL CalculateDistance1(?, ?)",
        [selectedUser, selectedMonth],
        (err, results, fields) => {
          if (err) {
            console.error("Error executing the stored procedure:", err);
            return next(err);
          }
          const dataFromProcedure = results[0];
          const dataFromTable = results[1];
          dataFromProcedure.forEach((row) => {
            row.date_column = formatDate(row.date_column);
          });

          res.render("travel_user_distance", {
            rows: dataFromProcedure,
            users,
            permanentTableData: dataFromTable,
            selectedUser,
            selectedMonth,
          });
        }
      );
    }
  );
});

router.get("/travel_meeting/:user_name/:date", checkUser, function (req, res, next) {
  const user_name = req.params.user_name;
  const date = req.params.date;

  // Ensure the date is in the correct format 'YYYY-MM-DD'
  const formattedDateString = formatDate(new Date(date));

  // Parse the formattedDateString to create a Date object
  const formattedDate = new Date(formattedDateString);

  // Check if the parsed date is valid
  if (isNaN(formattedDate.getTime())) {
    console.error("Invalid date format");
    res.status(400).send("Bad Request");
    return;
  }

  // Increment the date by one day
  formattedDate.setDate(formattedDate.getDate() + 1);

  // Call the stored procedure
  const query = `CALL CalculateDistance('${user_name}', '${formattedDate
    .toISOString()
    .slice(0, 10)}')`;

  con.query(query, (error, results, fields) => {
    if (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
      return;
    }

    const rows = results[0]; // Assuming the result of the stored procedure is in the first element of the results array
    rows.forEach((row) => {
      row.date = formatDate(row.date_column);
    });
    res.render("travel_meeting", { title: "scaleedge", user_name, date, rows });
  });
});

//resetpassword
router.get("/resetpassword", function (req, res, next) {
  res.render("resetpassword", { title: "scaleedge" });
});

let otpStorage = {};

// Route for sending OTP
router.post("/sendOTP", (req, res) => {
  const { email } = req.body;
  // Generate OTP
  const otp = generateOTP();
  // Store OTP temporarily
  otpStorage[email] = otp;

  // Send the OTP to the email
  const transporter = nodemailer.createTransport({
    con: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "viveksingh2003e@gmail.com",
      pass: "sgraipgxdsrkfmyh",
    },
  });

  const mailOptions = {
    from: "viveksingh2003e@gmail.com", // Enter your Gmail address
    to: email,
    subject: "OTP for Password Reset",
    text: `Your OTP for password reset is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false, message: "Failed to send OTP via email" });
    } else {
      console.log("Email sent:", info.response);
      // For simplicity, let's just return the OTP in the response
      res.json({ success: true, otp });
    }
  });
});

// Route for verifying OTP
router.post("/verifyOTP", (req, res) => {
  const { email, otp } = req.body;
  const storedOTP = otpStorage[email];
  if (storedOTP && otp === storedOTP) {
    // OTP is correct
    res.json({ success: true });
  } else {
    // OTP is incorrect
    res.status(400).json({ success: false, message: "Wrong OTP" });
  }
});

function generateOTP() {
  // Implement OTP generation logic (e.g., random number generation)
  return Math.floor(1000 + Math.random() * 9000).toString();
}

//restpasswordcheckemail
router.post("/check_email_reset", (req, res) => {
  const email = req.body.email;
  const query = "SELECT COUNT(*) AS count FROM user_master WHERE email = ?";
  con.query(query, [email], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ exists: false });
    } else {
      const count = results[0].count;
      const emailExists = count > 0;
      res.json({ exists: emailExists });
    }
  });
});

// newpassword
router.get("/password", function (req, res, next) {
  const email = req.query.email;
  res.render("password", { title: "scaleedge", email: email });
});

router.post("/update_password", (req, res) => {
  const email = req.body.email;
  const newPassword = req.body.password;

  const query = "UPDATE user_master SET password = ? WHERE email = ?";
  con.query(query, [newPassword, email], (err, results) => {
    if (err) {
      console.error(err);
      res
        .status(500)
        .json({ success: false, error: "Error updating password" });
    } else {
      sendEmail1({ email, password: newPassword });
      res.json({ success: true });
    }
  });
});

function sendEmail1(userData) {
  const mailOptions = {
    from: "viveksingh2003e@gmail.com",
    to: userData.email,
    subject: "Your Password Has Been Updated",
    html: `<p>Hello ${userData.email},</p>
           <p>Your password has been updated successfully. Here are your account details:</p>
           <p>Email: ${userData.email}</p>
           <p>Password: ${userData.password}</p>
           <p>Click the following link to access your account: <a href="https://node.scaleedge.in/">ScaleEdge Solution</a></p>`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Email sending error: " + error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}

//excel
router.get("/excel", checkUser, function (req, res, next) {
  res.render("excel", { title: "scaleedge" });
});

//offerletter
// router.get("/offerletter", checkUser, function (req, res, next) {
//   const userGroup = req.session.user_group;
//   res.render("offerletter", { title: "scaleedge", userGroup });
// });

router.get("/offerletter", checkUser, function (req, res, next) {
  const userGroup = req.session.user_group;
  const userEmail = req.session.email;

  if (userGroup === 'admin') {
    return res.render("offerletter", {
      title: "scaleedge",
      userGroup
    });
  }

  const sqlQueryForFetchData = `SELECT * FROM user_master WHERE email = ?`;

  con.query(sqlQueryForFetchData, [userEmail], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length > 0) {
      const user = results[0];
      var formattedJoiningDate = new Date(results[0].joining_date)
        .toISOString()
        .split("T")[0];
      res.render("offerletter", {
        title: "scaleedge",
        userGroup,
        user,
        formattedJoiningDate: formattedJoiningDate,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });
});


hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

router.get("/appointmentLetter", checkUser, function (req, res, next) {
  const userGroup = req.session.user_group;
  const userEmail = req.session.email;

  if (userGroup === 'admin') {
    const sqlQueryForBranchData = `SELECT * FROM branch_table`;
    con.query(sqlQueryForBranchData, (err, branches) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.render("appointment", {
          title: "scaleedge",
          userGroup,
          branches
        });
      }
    });
  } else {
    const sqlQueryForFetchData = `SELECT * FROM user_master WHERE email = ?`;
    con.query(sqlQueryForFetchData, [userEmail], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        if (results.length > 0) {
          const user = results[0];
          var formattedJoiningDate = new Date(results[0].joining_date)
            .toISOString()
            .split("T")[0];
          res.render("appointment", {
            title: "scaleedge",
            userGroup,
            user,
            formattedJoiningDate: formattedJoiningDate
          });
        } else {
          res.status(404).json({ error: "User not found" });
        }
      }
    });
  }
});


router.get("/confirmationLetter", checkUser, function (req, res, next) {
  const userGroup = req.session.user_group;
  const userEmail = req.session.email;

  if (userGroup === 'admin') {
    const sqlQueryForBranchData = `SELECT * FROM branch_table`;
    con.query(sqlQueryForBranchData, (err, branches) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.render("confirmationLetter", {
          title: "scaleedge",
          userGroup,
          branches
        });
      }
    });
  } else {
    const sqlQueryForFetchData = `SELECT * FROM user_master WHERE email = ?`;
    con.query(sqlQueryForFetchData, [userEmail], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        if (results.length > 0) {
          const user = results[0];
          var formattedJoiningDate = new Date(results[0].joining_date)
            .toISOString()
            .split("T")[0];
          res.render("confirmationLetter", {
            title: "scaleedge",
            userGroup,
            user,
            formattedJoiningDate: formattedJoiningDate
          });
        } else {
          res.status(404).json({ error: "User not found" });
        }
      }
    });
  }
});


router.get("/terminationletter", checkUser, function (req, res, next) {
  const userGroup = req.session.user_group;
  const userEmail = req.session.email;
  if (userGroup === 'admin') {
    return res.render("termination", {
      title: "scaleedge",
      userGroup
    });
  }
  const sqlQueryForFetchData = `SELECT * FROM user_master WHERE email = ?`;

  con.query(sqlQueryForFetchData, [userEmail], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (results.length > 0) {
        const user = results[0];
        var formattedJoiningDate = new Date(results[0].joining_date)
          .toISOString()
          .split("T")[0];
        res.render("termination", {
          title: "scaleedge",
          userGroup,
          user,
          formattedJoiningDate: formattedJoiningDate,

        });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    }
  });
});

// router.get("/terminationletter", checkUser, function (req, res, next) {
//   const userGroup = req.session.user_group;

//   res.render("termination", { title: "scaleedge", userGroup });
// });

// router.get("/confirmationLetter", checkUser, function (req, res, next) {
//   const userGroup = req.session.user_group;
//   res.render("confirmationLetter", { title: "scaleedge", userGroup });
// });


const randomstring = require('randomstring');
const otpMap = new Map();

router.post('/send-otp', (req, res) => {
  const email = req.body.email;

  // Generate a random OTP
  const otp = randomstring.generate({
    length: 6,
    charset: 'numeric'
  });

  // You should store this OTP on the server for verification
  otpMap.set(email, otp);

  // Send the OTP to the email
  const transporter = nodemailer.createTransport({
    con: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "viveksingh2003e@gmail.com",
      pass: "sgraipgxdsrkfmyh",
    },
  });

  const mailOptions = {
    from: 'viveksingh2003e@gmail.com',
    to: email,
    subject: 'Verification OTP',
    text: `Your OTP is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
      res.json({ success: false });
    } else {
      console.log('Email sent: ' + info.response);
      // Include the generated OTP in the response
      res.json({ success: true, otp: otp });
    }
  });
});

// router.use(fileUpload());

// router.post('/register', async (req, res) => {
//   const email = req.body.email;
//   const enteredOTP = req.body.otp;
//   const storedOTP = otpMap.get(email);

//   if (enteredOTP === storedOTP) {
//       otpMap.delete(email);

//       const name = req.body.name;
//       const mobile = req.body.mobile;
//       const annualSalary = req.body.annual_salary;
//       const password = req.body.password;
//       const personalEmail = req.body.personal_email;
//       const joiningDate = req.body.joining_date;
//       const birthDate = req.body.birth_date;
//       const street = req.body.street_address;
//       const city = req.body.city;
//       const landmark = req.body.landmark;
//       const pincode = req.body.pincode;
//       const house = req.body.house;
//       const state = req.body.state;
// const adhar = req.files.adhar;
// const pan = req.files.pan;
// const adharName = adhar.name;
// const panName = pan.name;
// const profileImage = req.files.Imagepath;
// const Imagename = profileImage.name;
//       const confirmPassword = req.body.cpassword;


//       const emailExists = await checkEmailExists(email);

//       if (emailExists) {
//           return res.status(400).json({ message: 'Email already exists. Please use a different email address.' });
//       }

//       const nameFirstTwoLetters = name.substring(0, 2).toUpperCase();
//       const birthDateOnlyDate = birthDate.split('-')[2];
//       const employeeId = `SCALEEDGE#${nameFirstTwoLetters}${birthDateOnlyDate}`;

//       const insertQuery = `
//       INSERT INTO user_master_data (user_id, user_name, user_group, email, mobile, password, created_on, annual_salary, personal_email, joining_date, birth_date, latitude, longitude, street_address, house, city, state, pincode, landmark, Imagepath, Adhar, Pancard, employee_id)
//       VALUES (?,?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?)
//     `;

//       const values = [email, name, 'user', email, mobile, password, annualSalary, personalEmail, joiningDate, birthDate, 27.5944, 76.6167, street, house, city, state, pincode, landmark, Imagename, adharName, panName, employeeId];

//       con.query(insertQuery, values, (error, results) => {
// var Imagepath = "public/profile/" + profileImage.name;
// var adharpath = "public/document/" + adhar.name;
// var panpath = "public/document/" + pan.name;
// profileImage.mv(Imagepath, function (err) {
//     if (err) {
//         console.error("Failed to save profile image:", err);
//     } else {
//         console.log("Profile image saved successfully.");
//     }
// })
// adhar.mv(adharpath, function (err) {
//     if (err) {
//         console.error("Failed to save profile image:", err);
//     } else {
//         console.log("Profile image saved successfully.");
//     }
// })
// pan.mv(panpath, function (err) {
//     if (err) {
//         console.error("Failed to save profile image:", err);
//     } else {
//         console.log("Profile image saved successfully.");
//     }
// })
//           if (error) {
//               console.error('Error inserting user details into the database:', error);
//               return res.status(500).json({ message: 'Failed to register user. Please try again.' });
//           } else {
//               console.log('User details inserted into the database.');
//               req.flash('success', 'Welcome 😊. Your application has been sent to the admin. If the admin approves, you will receive the mail!.')
//               const successMessage = "Welcome 😊. Your application has been sent to the admin. If the admin approves, you will receive the mail!.";
//               res.status(200).json({ message: successMessage });
//               sendEmailNotification(email, name, password);
//           }
//       });
//   } else {
//       return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
//   }
// });

router.post('/register', async (req, res) => {
  const email = req.body.email;
  const enteredOTP = req.body.otp;
  const storedOTP = otpMap.get(email);

  if (enteredOTP === storedOTP) {
    otpMap.delete(email);

    const name = req.body.name;
    const mobile = req.body.mobile;
    const annualSalary = 0; // Set annual_salary to 0
    const password = req.body.password;
    const personalEmail = req.body.personal_email; // Corrected variable name
    const joiningDate = req.body.joining_date;
    const street = req.body.street_address;
    const city = req.body.city;
    const landmark = req.body.landmark;
    const pincode = req.body.pincode;
    const house = req.body.house;
    const state = req.body.state;
    const confirmPassword = req.body.cpassword;

    const emailExists = await checkEmailExists(email);

    if (emailExists) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email address.' });
    }

    // Generate a random 2-digit number
    const randomFourDigitNumber = Math.floor(1000 + Math.random() * 9000); // generates a number between 1000 and 9999
    const employeeId = `Scaleedge#${randomFourDigitNumber}`;


    const insertQuery = `
          INSERT INTO user_master_data (user_name, user_group, email, mobile, password, created_on, annual_salary, personal_email, joining_date, street_address, house, city, state, pincode, landmark, employee_id, latitude, longitude, user_id)
          VALUES (?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

    // Set latitude and longitude values
    const latitude = 27.5944;
    const longitude = 76.6167;

    const values = [name, 'user', email, mobile, password, annualSalary, personalEmail, joiningDate, street, house, city, state, pincode, landmark, employeeId, latitude, longitude, email];

    con.query(insertQuery, values, (error, results) => {
      if (error) {
        console.error('Error inserting user details into the database:', error);
        return res.status(500).json({ message: 'Failed to register user. Please try again.' });
      } else {
        console.log('User details inserted into the database.');
        req.flash('success', 'Welcome 😊. Your application has been sent to the admin. If the admin approves, you will receive the mail!.')
        const successMessage = "Welcome 😊. Your application has been sent to the admin. If the admin approves, you will receive the mail!.";
        res.status(200).json({ message: successMessage });
        sendEmailNotification(email, name, password);

      }
    });

  } else {
    return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
  }
});

function sendEmailNotification(email, name, password) {
  const transporter = nodemailer.createTransport({
    con: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "viveksingh2003e@gmail.com",
      pass: "sgraipgxdsrkfmyh",
    },
  });

  const mailOptions = {
    from: 'viveksingh2003e@gmail.com',
    to: email,
    subject: 'Application has been sent to the administrator...',
    html: `
      <p>Your application has been sent to the administrator. If the administrator approves, you will receive the mail!</p>
      <p>Name: ${name}</p>
      <p>Email: ${email}</p>
      <p>Password: ${password}</p>
      <p>Click the following link to access your account: <a href="https://node.scaleedge.in/">ScaleEdge Solution</a></p>
    `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error("Email could not be sent:", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
}



async function checkEmailExists(email) {
  return new Promise((resolve, reject) => {
    const selectEmailSql = `
      SELECT email FROM user_master WHERE email = ?
      UNION
      SELECT email FROM user_master_new WHERE email = ?
    `;

    con.query(selectEmailSql, [email, email], (err, result) => {
      if (err) {
        reject(err);
      }

      resolve(result && result.length > 0);
    });
  });
}


router.get("/uploadDetails", function (req, res, next) {
  const { email } = req.query; // Retrieve email from query params
  console.log(req.query.email);

  if (!email) {
    return res.status(400).json({ success: false, error: "Email parameter is required" });
  }

  const query = 'SELECT * FROM user_master_data WHERE email = ?'; // Define SQL query

  con.query(query, [email], function (error, results) { // Pass email as parameter
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    // Check if results are empty
    if (results.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // If user found, retrieve user details
    const { user_name, email, mobile, password, personal_email, joining_date, street_address, city, landmark, pincode, house, state, user_id, user_group, annual_salary, latitude, longitude, employee_id } = results[0];
    const formatted_joining_date = joining_date.toISOString().split('T')[0]; // Assuming joining_date is a JavaScript Date object

    res.render("uploadDetails", {
      title: "scaleedge",
      user_name, // Pass the name retrieved from the database
      email,
      mobile,
      password,
      personal_email,
      joining_date: formatted_joining_date, // Pass the formatted joining date
      street_address,
      city,
      landmark,
      pincode,
      house,
      state,
      user_id,
      user_group,
      annual_salary,
      latitude,
      longitude,
      employee_id
    });
  });
});




router.post("/uploadDetails", async function (req, res, next) {
  try {
    const { user_name, email, mobile, password, personal_email, joining_date, street_address, city, landmark, pincode, house, state, user_id, user_group, annual_salary, latitude, longitude, employee_id } = req.body;

    const adhar = req.files.adhar;
    const pan = req.files.pan;
    const adharName = generateUniqueName(adhar.name);
    const panName = generateUniqueName(pan.name);
    const profileImage = req.files.Imagepath;
    const Imagename = generateUniqueName(profileImage.name);
    const birthDate = req.body.birth_date;

    const Imagepath = "public/profile/" + Imagename;
    const adharpath = "public/document/" + adharName;
    const panpath = "public/document/" + panName;

    // Promisified version of mv function
    const mvAsync = (file, destination) => {
      return new Promise((resolve, reject) => {
        file.mv(destination, function (err) {
          if (err) {
            console.error("Failed to save file:", err);
            reject(err);
          } else {
            console.log("File saved successfully.");
            resolve();
          }
        });
      });
    };

    // Move files to their respective paths
    await Promise.all([
      mvAsync(profileImage, Imagepath),
      mvAsync(adhar, adharpath),
      mvAsync(pan, panpath)
    ]);

    // Insert data into user_master_new table
    const insertQueryNew = `
    INSERT INTO user_master_new (user_name, email, mobile, password, personal_email, joining_date, street_address, city, landmark, pincode, house, state, adhar, pancard, birth_date, Imagepath, created_on, user_id, user_group, annual_salary,latitude,longitude,employee_id )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)
    `;

    const valuesNew = [user_name, email, mobile, password, personal_email, joining_date, street_address, city, landmark, pincode, house, state, adharName, panName, birthDate, Imagename, email, user_group, annual_salary, latitude, longitude, employee_id];

    con.query(insertQueryNew, valuesNew, (errNew, resultNew) => {
      if (errNew) {
        console.error("Error inserting user details into user_master_new:", errNew);
        return res.status(500).json({ error: "Error inserting user details into user_master_new" });
      }
      console.log("User details inserted into user_master_new successfully");

      res.status(200).json({ success: true, message: "Welcome 😊. Your application has been sent to the admin. If the admin approves, you will receive the mail!." });
    });
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});




function generateUniqueName(filename) {
  const timestamp = Date.now();
  const extension = filename.split('.').pop();
  return `${timestamp}_${Math.floor(Math.random() * 10000)}.${extension}`;
}


// function getSweetAlertScript(icon, title, location) {
//   return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <title>Document</title>
//       <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
//       <meta charset="UTF-8" />
//       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//       <title>Document</title>
//       <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet" />
//       <link href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" rel="stylesheet" />
//       <link href="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.4.2/mdb.min.css" rel="stylesheet" />
//       <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css" />
//       <script src="https://cdnjs.cloudflare.com/ajax/libs/zxcvbn/4.4.2/zxcvbn.js"></script>
//       <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/mdb-ui-kit/6.4.2/mdb.min.js"></script>

//     </head>
//     <body>

//   <script>
//   document.addEventListener("DOMContentLoaded", function() {
//     Swal.fire({
//       icon: '${icon}',
//       title: '${title}',
//       showConfirmButton: false,
//       timer: 5000
//     }).then(function() {
//       window.location.href = '${location}';
//     });
//   });
//       </script>
//     </body>
//     </html>
//   `;
// }


router.post('/storeData', (req, res) => {
  const { recognizedLabel, timeSpent } = req.body;

  const query = 'INSERT INTO recognition_data (recognized_label, time_spent) VALUES (?, ?)';
  con.query(query, [recognizedLabel, timeSpent], (error, results) => {
    if (error) {
      console.error('Error storing data in MySQL:', error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    } else {
      console.log('Data stored successfully in MySQL');
      res.status(200).json({ success: true, message: 'Data stored successfully' });
    }
  });
});


router.get("/timeSpent", function (req, res, next) {
  const query = "SELECT * from recognition_data";
  con.query(query, function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }
    res.render("timeSpent", {
      title: "scaleedge",
      timeSpent: results,
    });
  });
});

router.get("/payRoll", isAdmin, function (req, res, next) {

  con.query('SELECT employee_id, user_name, status FROM user_master', function (error, results, fields) {
    if (error) throw error;
    res.render("payRoll", { title: "scaleedge", employees: results });
  });
});

router.get("/pay_roll", isAdmin, function (req, res, next) {
  res.render("pay_roll", { title: "scaleedge" });
});

router.get("/downloadArrears", isAdmin, function (req, res, next) {
  const inputMonth = req.query.inputMonth;
  const inputYear = req.query.inputYear;

  // Assume you have a database connection named 'con'
  con.query('SELECT employee_id, user_name FROM user_master', function (error, results, fields) {
    if (error) throw error;

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Arrears');

    worksheet.addRow(['EmployeeID', 'UserName', 'ArrearsAmount', 'Incentives', 'Date']);

    results.forEach(result => {
      const currentDate = new Date().getDate(); // Get current day of the month
      const dateString = `${inputYear}-${inputMonth}-${currentDate}`;
      worksheet.addRow([result.employee_id, result.user_name, result.arrears_amount, result.Incentives, dateString]);
    });

    worksheet.columns.forEach(column => {
      column.width = 25;
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=arrears.xlsx');

    workbook.xlsx.write(res)
      .then(function () {
        res.end();
      })
      .catch(function (error) {
        throw error;
      });
  });
});

router.post('/upload-arrears', isAdmin, function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const file = req.files.file;

  // Process the Excel file
  const workbook = xlsx.read(file.data, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  // Assuming your Excel file has columns: 'employee_id', 'employee_name', 'arrears_amount'
  const arrearsData = data.map(row => [
    row.EmployeeID,
    row.UserName,
    row.ArrearsAmount,
    row.Incentives,
    row.Date // Get current date in 'YYYY-MM-DD HH:mm:ss' format
  ]);

  // Truncate existing data in the arrears table
  con.query('TRUNCATE TABLE arrears', function (truncateError) {
    if (truncateError) {
      return res.status(500).json({ error: 'Error truncating table' });
    }

    // Insert new data into the arrears table
    const insertQuery = `
      INSERT INTO arrears (employee_id, employee_name, arrears_amount, Incentives, date_of_apply)
      VALUES ?
    `;

    con.query(insertQuery, [arrearsData], function (insertError, results) {
      console.log(insertError)
      if (insertError) {
        return res.status(500).json({ error: 'Error inserting data into arrears table' });
      }

      res.redirect('/payRoll'); // Redirect to your desired route after successful upload
    });
  });
});


router.post('/uploadPayroll', isAdmin, function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const excelFile = req.files.excelFile;

  // Process the Excel file
  const workbook = xlsx.read(excelFile.data, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);

  // Extract the Incentives value from the first row of the data
  const incentivesValue = data[0].Incentives;

  // Execute the update query
  const updateQuery = `
    UPDATE payroll
    SET Incentives = ?
    WHERE id = 1
  `;

  con.query(updateQuery, [incentivesValue], function (error, results, fields) {
    if (error) throw error;
    res.redirect('/payRoll'); // Redirect to your desired route after successful upload
  });
});



router.post('/upload-variable-pays', isAdmin, function (req, res, next) {
  // Extract data from the request body
  const {
    HRA,
    TA,
    Special,
    PF,
    ESIC,
    MedicalAllowance,
    Bonus,
    StandardDeduction,
    health_education_cess,
    VPF,
    VESIC,
    Incentives
  } = req.body;

  // Truncate existing data in the payroll table
  con.query('TRUNCATE TABLE payroll', function (truncateError) {
    if (truncateError) {
      return res.status(500).json({ error: 'Error truncating table' });
    }

    // Insert new data into the payroll table
    const insertQuery = `
      INSERT INTO payroll (HRA, TA, Special, PF, ESIC, MedicalAllowance, Bonus, StandardDeduction, health_education_cess, VPF, VESIC, Incentives)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [HRA, TA, Special, PF, ESIC, MedicalAllowance, Bonus, StandardDeduction, health_education_cess, VPF, VESIC, Incentives];

    con.query(insertQuery, values, function (insertError, results) {
      if (insertError) {
        return res.status(500).json({ error: 'Error inserting data into payroll table' });
      }

      res.status(200).json({ message: 'Data uploaded successfully' });
    });
  });
});

// router.post('/upload-variable-pays', function (req, res, next) {
//   const { Incentives } = req.body;

//   const updateQuery = `
//     UPDATE payroll
//     SET Incentives = ?
//     WHERE id = 1
//   `;

//   const values = [Incentives];

//   con.query(updateQuery, values, function (updateError, results) {
//     if (updateError) {
//       return res.status(500).json({ error: 'Error updating incentives in payroll table' });
//     }

//     res.status(200).json({ message: 'Incentives updated successfully' });
//   });
// });


// Update status based on employee_id

router.post("/update-status", isAdmin, function (req, res, next) {
  const { employee_id, newStatus, selectedYear, selectedMonth } = req.body;

  const updateQuery = 'UPDATE user_master SET status = ? WHERE employee_id = ?';

  con.query(updateQuery, [newStatus, employee_id], function (error, results, fields) {
    if (error) throw error;

    // After updating the status, call the stored procedure
    con.query("CALL new_payroll_2024_03(?, ?)", [selectedYear, selectedMonth], function (err, payrollResults, fields) {
      if (err) {
        console.error("Error executing stored procedure:", err);
        throw err;
      }

      const salaryData = payrollResults[0];

      // Fetch additional data from user_master table
      con.query('SELECT employee_id, user_name, status FROM user_master', function (error, employees, fields) {
        if (error) {
          console.error("Error fetching data from user_master:", error);
          throw error;
        }

        res.render("pay_roll", {
          title: "Generated Salary",
          salaryData: salaryData,
          employees: employees,
          selectedMonth: selectedMonth,
          selectedYear: selectedYear
        });
      });
    });
  });
});



router.get("/payRollForUser", isUser, function (req, res, next) {
  res.render("payRollForUser", { title: "scaleedge" });
});




router.post("/generateSalary", function (req, res) {
  const inputYear = req.body.selectedYear || req.query.selectedYear; // Prefer body over query for security
  const inputMonth = req.body.selectedMonth || req.query.selectedMonth; // Prefer body over query for security

  con.query("CALL new_payroll_2024_03(?, ?)", [inputYear, inputMonth], function (err, results, fields) {
    if (err) {
      console.error("Error executing stored procedure:", err);
      throw err;
    }

    const salaryData = results[0];

    // Fetch additional data from user_master table
    con.query('SELECT employee_id, user_name, status FROM user_master', function (error, employees, fields) {
      if (error) {
        console.error("Error fetching data from user_master:", error);
        throw error;
      }

      res.render("pay_roll", {
        title: "Generated arrearsSalary",
        salaryData: salaryData,
        employees: employees,
        selectedMonth: inputMonth,
        selectedYear: inputYear
      });
    });
  });
});


router.post("/generateSalary", function (req, res) {
  const inputYear = req.body.selectedYear;
  const inputMonth = req.body.selectedMonth;

  con.query("CALL new_payroll_2024_03(?, ?)", [inputYear, inputMonth], function (err, results, fields) {
    if (err) {
      console.error("Error executing stored procedure:", err);
      throw err;
    }

    const salaryData = results[0];

    // Fetch additional data from user_master table
    con.query('SELECT employee_id, user_name, status FROM user_master', function (error, employees, fields) {
      if (error) {
        console.error("Error fetching data from user_master:", error);
        throw error;
      }

      res.render("pay_roll", {
        title: "Generated Salary",
        salaryData: salaryData,
        employees: employees,
        selectedMonth: inputMonth,
        selectedYear: inputYear
      });
    });
  });
});



// router.get("/userProfile", function (req, res, next) {
//   res.render("profile", { title: "scaleedge" });
// });

// router.get("/userProfile", checkUser, function (req, res, next) {
//   var email = req.session.email;
//   var selectSql = "SELECT * FROM employee_account_details WHERE email = ?";

//   con.query(selectSql, [email], function (err, result) {
//     if (err) {
//       throw err;
//     }

//     if (result && result.length > 0) {
//       res.render("profile", {
//         title: "scaleedge",
//         user: result[0],
//       });
//     } else {
//       res.redirect("/userProfile");
//     }
//   });
// });

router.get("/userProfile", checkUser, function (req, res, next) {
  var email = req.session.email;
  let userGroup = req.session.user_group;
  let isAdmin = userGroup === "admin";
  var selectSql = "SELECT * FROM employee_account_details WHERE email = ?";
  con.query(selectSql, [email], function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    const profileData = results[0];

    var selectUserSql = "SELECT * FROM user_master WHERE email = ?";
    con.query(selectUserSql, [email], function (error, userResults) {
      if (error) {
        console.error("User data query error:", error);
        return res.status(500).json({ success: false, error: "Database error" });
      }

      if (userResults.length === 0) {
        return res.status(404).json({ success: false, error: "User data not found" });
      }

      const userData = userResults[0];

      // Calculate profile completion percentage
      let filledFields = 0;
      let totalFields = Object.keys(userData).length - 2; // Excluding 'id' and 'email' fields
      for (const field in userData) {
        if (userData[field] !== null && field !== 'id' && field !== 'email') {
          filledFields++;
        }
      }
      const profileCompletionPercentage = ((filledFields / totalFields) * 100).toFixed(2);
      console.log(profileCompletionPercentage)

      // Render the profile page with both employee and user data
      res.render("profile", { title: "scaleedge", profileData, userData, profileCompletionPercentage, isAdmin: isAdmin });
    });
  });
});




router.post('/userProfile', async (req, res, next) => {
  try {
    const {
      employee_id,
      user_name,
      accountHolderName,
      accountNumber,
      bankName,
      ifscCode,
      branchName,
    } = req.body;

    // Start a transaction
    await con.beginTransaction();

    // Delete previous data if it exists based on employee_id and email
    await con.query(
      'DELETE FROM employee_account_details WHERE employee_id = ? AND email = ?',
      [employee_id, req.session.email]
    );

    // Insert new data
    await con.query(
      'INSERT INTO employee_account_details (employee_id, user_name, account_holder_name, account_number, bank_name, ifsc_code, branch_name, email) VALUES (?,?,?,?,?,?,?, ?)',
      [employee_id, user_name, accountHolderName, accountNumber, bankName, ifscCode, branchName, req.session.email]
    );

    // Commit the transaction
    await con.commit();

    // Send JSON response indicating success
    res.redirect('/userProfile');
  } catch (error) {
    // Rollback the transaction in case of error
    await con.rollback();
    console.error('Error updating profile:', error);
    // Send JSON response indicating failure
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});





router.get("/home", function (req, res, next) {
  res.render("home", { title: "scaleedge" });
});


router.get("/testing", checkUser, function (req, res, next) {
  let userGroup = req.session.user_group;
  let isAdmin = userGroup === "admin";
  res.render("testing", { title: "sumit", isAdmin: isAdmin });
});

router.get("/ApplyLoan", checkUser, function (req, res, next) {
  const userEmail = req.session.email;

  con.query(
    "SELECT DISTINCT user_name FROM user_master WHERE email = ?",
    [userEmail],
    function (error, users) {
      if (error) {
        console.log("Error fetching users:", error);
        return res.status(500).send("Internal Server Error");
      }

      // Check if users array is empty
      if (users.length === 0) {
        console.log("User not found for email:", userEmail);
        return res.status(404).send("User not found");
      }

      const userName = users[0].user_name; // Assuming user_name is in the first element of the array

      res.render("loanApply", { title: "scaleedge", user_name: userName });
    }
  );
});


router.post("/loanApply", checkUser, function (req, res, next) {
  const { user_name, loan_amount, tax_pay_month } = req.body;

  const sql = "INSERT INTO loan_approval_table (username, loan_amount, tax_pay_month, date_of_apply) VALUES (?, ?, ?, CURDATE())";
  con.query(sql, [user_name, loan_amount, tax_pay_month], function (error, result) {
    if (error) {
      console.error("Error inserting data into loan_approval_table:", error);
      return res.status(500).json({ success: false, message: "Internal Server Error" });
    }

    console.log("Data inserted successfully:", result);

    // Respond with a JSON object indicating success
    res.json({ success: true, message: "Loan application submitted successfully" });
  });
});


router.get("/loanRequests", function (req, res, next) {
  const query = "SELECT * from loan_approval_table where status = 'Pending'";
  con.query(query, function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    const loanData = results;

    res.render("loanRequests", { title: "scaleedge", loanData });
  });
});

router.get("/loanReport", function (req, res, next) {
  const query = "SELECT * from loan_table";
  con.query(query, function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    const loanData = results;

    res.render("loanReport", { title: "scaleedge", loanData });
  });
});



router.post("/processLoanApproval", function (req, res, next) {
  const { id, interestRate, action } = req.body;

  if (action === "approve") {
    if (!interestRate) {
      return res.status(400).json({ success: false, error: "Please fill in the interest rate." });
    }

    const insertQuery = "INSERT INTO loan_table (username, loan_amount, tax_pay_month, interest_rate, date_of_apply) SELECT username, loan_amount, tax_pay_month, ? , date_of_apply FROM loan_approval_table WHERE id = ?";
    con.query(insertQuery, [interestRate, id], function (error, results) {
      if (error) {
        console.error("Loan approval error:", error);
        return res.status(500).json({ success: false, error: "Loan approval error" });
      }

      const updateQuery = "UPDATE loan_approval_table SET status = 'Approved' WHERE id = ?";
      con.query(updateQuery, [id], function (error, results) {
        if (error) {
          console.error("Loan approval update error:", error);
          return res.status(500).json({ success: false, error: "Loan approval update error" });
        }

        res.status(200).json({ success: true, message: "Loan approved successfully." });
      });
    });
  } else if (action === "reject") {
    const updateQuery = "UPDATE loan_approval_table SET status = 'Rejected' WHERE id = ?";
    con.query(updateQuery, [id], function (error, results) {
      if (error) {
        console.error("Loan rejection error:", error);
        return res.status(500).json({ success: false, error: "Loan rejection error" });
      }

      res.status(200).json({ success: true, message: "Loan rejected successfully." });
    });
  } else {
    res.status(400).json({ success: false, error: "Invalid action." });
  }
});

router.post('/updateGeneratePayroll', (req, res) => {
  const { year, month, employeeId } = req.body;

  console.log('Updating generate_payroll for Employee ID:', employeeId);
  console.log('Year:', year);
  console.log('Month:', month);
  const query = `
      UPDATE generate_payroll
      SET isFrozen = 1
      WHERE input_year = ? AND input_month = ? AND employee_id = ?
  `;
  console.log(query);

  con.query(query, [year, month, employeeId], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ message: 'Salary frozen successfully' });
    }
  });
});


// Add a new route for freezing all salaries
router.post('/freezeAllSalaries', (req, res) => {
  console.log('Freezing all salaries...');

  const query = `
      UPDATE generate_payroll
      SET isFrozen = 1
  `;

  con.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ message: 'All salaries frozen successfully' });
    }
  });
});



router.get("/applyReimburshment", function (req, res, next) {
  // Assuming req.session.email contains the email to filter
  const userEmail = req.session.email;

  // Construct the SQL query
  const query = `
    SELECT employee_id, user_name, status
    FROM user_master
    WHERE email = ?;
  `;

  // Execute the query
  con.query(query, [userEmail], function (error, results, fields) {
    if (error) {
      console.error(error);
      // Handle the error appropriately, e.g., send an error response to the client
      res.status(500).send('Internal Server Error');
    } else {
      // Render the 'reimbursement' view with the retrieved data
      res.render("reimburshment", { title: "scaleedge", userData: results[0] });
    }
  });
});


router.post("/applyReimburshment", function (req, res, next) {
  const { user_name, employee_id, reimbursement_date, amount } = req.body;
  const file = req.files.Imagepath;

  const filePath = 'public/reimburshment/' + file.name;

  file.mv(filePath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    const formattedDate = new Date(reimbursement_date).toISOString().split('T')[0];
    const query = `
      INSERT INTO reimbursement_pending (name, employee_id, month, year, document, amount, reimbursement_date)
      VALUES (?, ?, ?, ?, ?, ?, ?);
    `;


    const currentDate = new Date(reimbursement_date);
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    con.query(query, [user_name, employee_id, month, year, filePath, amount, formattedDate], function (error, results, fields) {
      if (error) {
        console.error(error);
        return res.status(500).send('Internal Server Error');
      }

      res.redirect('/applyReimburshment');
    });
  });
});

router.get("/reimburshmentRequests", function (req, res, next) {
  const query = "SELECT *, DATE_FORMAT(reimbursement_date, '%Y-%m-%d') AS reimbursement_date from reimbursement_pending where status='Pending'";
  con.query(query, function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    const row = results;

    res.render("reimburshmentRequests", { title: "scaleedge", row });
  });
});

router.post("/approve", function (req, res, next) {
  const requestId = req.body.id;

  // Get data from reimbursement_pending
  const selectPendingQuery = `SELECT * FROM reimbursement_pending WHERE id = ${requestId}`;
  con.query(selectPendingQuery, function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    const reimbursementData = results[0];

    // Insert data into reimbursement table
    const insertReimbursementQuery = `
      INSERT INTO reimbursement (name, employee_id, month, year, document, amount, reimbursement_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const reimbursementValues = [
      reimbursementData.name,
      reimbursementData.employee_id,
      reimbursementData.month,
      reimbursementData.year,
      reimbursementData.document,
      reimbursementData.amount,
      reimbursementData.reimbursement_date
    ];

    con.query(insertReimbursementQuery, reimbursementValues, function (error) {
      if (error) {
        console.error("Database query error:", error);
        return res.status(500).json({ success: false, error: "Database error" });
      }

      // Update reimbursement_pending status to 'Approved'
      const updatePendingQuery = `UPDATE reimbursement_pending SET status = 'Approved' WHERE id = ${requestId}`;
      con.query(updatePendingQuery, function (error) {
        if (error) {
          console.error("Database query error:", error);
          return res.status(500).json({ success: false, error: "Database error" });
        }

        res.json({ success: true });
      });
    });
  });
});


router.post("/reject", function (req, res, next) {
  const requestId = req.body.id;

  // Update reimbursement_pending status to 'Rejected'
  const updatePendingQuery = `UPDATE reimbursement_pending SET status = 'Rejected' WHERE id = ${requestId}`;
  con.query(updatePendingQuery, function (error) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    res.json({ success: true });
  });
});


router.post("/salaryEmployee", function (req, res) {
  const inputYear = req.body.selectedYear;
  console.log(inputYear);
  const inputMonth = req.body.selectedMonth;
  console.log(inputMonth);
  const user_email = req.body.email;
  console.log(user_email);

  const query = `
    SELECT *
    FROM generate_payroll
    WHERE input_month = ? AND input_year = ? AND email = ?;
  `;

  con.query(query, [inputMonth, inputYear, user_email], function (err, results, fields) {
    if (err) {
      console.error("Error executing query:", err);
      throw err;
    }

    const salaryData = results;

    res.render("payRollForUser", {
      title: "Generated Salary",
      salaryData: salaryData,
      selectedMonth: inputMonth,
      selectedYear: inputYear
    });
  });
});

router.get("/applyArrears", checkUser, function (req, res, next) {
  const userEmail = req.session.email;
  const query = `
    SELECT employee_id, user_name, status
    FROM user_master
    WHERE email = ?;
  `;
  con.query(query, [userEmail], function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    } else {
      res.render("applyArrears", { title: "scaleedge", userData: results[0] });
    }
  });
});

router.post("/applyArrears", function (req, res, next) {
  const { employee_name, employee_id, amount, date, remarks, Incentives } = req.body;
  const file = req.files.document;
  const filepath = 'public/document/' + file.name;
  const filename = file.name;
  file.mv(filepath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    const [year, month] = date.split('-');

    // Getting current date
    const currentDate = new Date();

    // Calculating incentive month and year
    const incentiveYear = currentDate.getFullYear();
    let incentiveMonth = currentDate.getMonth() - 1;

    // If incentiveMonth becomes 0, it means we're in January, so adjust the year and month accordingly
    if (incentiveMonth === 0) {
      incentiveYear--;
      incentiveMonth = 12; // December
    }

    // Creating a new Date object for the date of application and subtracting a month from it
    const dateOfApply = new Date(date);
    dateOfApply.setMonth(dateOfApply.getMonth() + 1);

    const query = `
      INSERT INTO arrears_for_users 
      (employee_id, employee_name, arrears_amount, date, month, year, date_of_apply, remarks, Incentives, document, incentivesMonth, incentivesYear, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending")
      ON DUPLICATE KEY UPDATE 
      employee_name = VALUES(employee_name),
      arrears_amount = VALUES(arrears_amount),
      date = VALUES(date),
      month = VALUES(month),
      year = VALUES(year),
      date_of_apply = VALUES(date_of_apply),
      remarks = VALUES(remarks),
      Incentives = VALUES(Incentives),
      document = VALUES(document),
      incentivesMonth = VALUES(incentiveMonth),
      incentivesYear = VALUES(incentiveYear),
      status="pending"
  `;

    con.query(query, [employee_id, employee_name, amount, date, month, year, dateOfApply, remarks, Incentives, filename, incentiveMonth, incentiveYear], function (error, results, fields) {
      if (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      } else {
        res.send('Arrears applied successfully');
      }
    });
  });
});





router.get("/arrearRequests", function (req, res, next) {
  const query = "SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date from arrears_for_users where status = 'pending'";
  con.query(query, function (error, results) {
    if (error) {
      console.error("Database query error:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    const arrearsData = results;

    // Assuming 'document' is a field in the arrears_for_users table
    // Fetching the 'document' field from the first row of results
    const documentPath = results.length > 0 ? results[0].document : '';

    res.render("arrearRequests", { title: "scaleedge", arrearsData, document: documentPath });
  });
});


router.post("/storeArrearsData", function (req, res, next) {
  const { employeeId, employeeName, arrearsAmount, incentives, dateOfApply, incentivesMonth, incentivesYear } = req.body;

  // Insert form data into arrears table
  const insertQuery = "INSERT INTO arrears (employee_id, employee_name, arrears_amount, incentives, date_of_apply,incentivesMonth,incentivesYear) VALUES (?, ?, ?, ?, ?,?,?)";
  con.query(insertQuery, [employeeId, employeeName, arrearsAmount, incentives, dateOfApply, incentivesMonth, incentivesYear], function (error, results) {
    if (error) {
      console.error("Error inserting data into arrears table:", error);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    // Update arrears_for_users table status, arrears amount, and incentives
    const updateQuery = "UPDATE arrears_for_users SET status = 'approved', arrears_amount = ?, incentives = ? WHERE employee_id = ?";
    con.query(updateQuery, [arrearsAmount, incentives, employeeId], function (error, results) {
      if (error) {
        console.error("Error updating status, arrears amount, and incentives in arrears_for_users table:", error);
        return res.status(500).json({ success: false, error: "Database error" });
      }

      res.status(200).json({ success: true });
    });
  });
});



router.post("/arrearRequests/approve", function (req, res, next) {
  const { employeeId } = req.body;

  // Start a transaction
  con.beginTransaction(function (err) {
    if (err) {
      console.error("Transaction start error:", err);
      return res.status(500).json({ success: false, error: "Transaction start error" });
    }

    // Get arrears data for the selected employee
    const selectQuery = "SELECT * FROM arrears_for_users WHERE employee_id = ? AND status = 'Pending'";
    con.query(selectQuery, [employeeId], function (error, results) {
      if (error) {
        console.error("Select query error:", error);
        return res.status(500).json({ success: false, error: "Select query error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ success: false, error: "No pending request found for this employee" });
      }

      const { employee_name, arrears_amount, date_of_apply, Incentives, incentivesMonth, incentivesYear } = results[0]; // Assuming there's only one pending request per employee

      // Update status in arrears_for_users table
      const updateQuery = "UPDATE arrears_for_users SET status = 'Approved' WHERE employee_id = ?";
      con.query(updateQuery, [employeeId], function (error, results) {
        if (error) {
          console.error("Update query error:", error);
          con.rollback(function () {
            return res.status(500).json({ success: false, error: "Update query error" });
          });
        }

        // Insert into arrears table
        const insertQuery = "INSERT INTO arrears (employee_id, employee_name, arrears_amount, Incentives, date_of_apply,incentivesMonth,incentivesYear) VALUES (?, ?, ?, ?, ?,?,?)";
        con.query(insertQuery, [employeeId, employee_name, arrears_amount, Incentives, date_of_apply, incentivesMonth, incentivesYear], function (error, results) {
          if (error) {
            console.error("Insert query error:", error);
            con.rollback(function () {
              return res.status(500).json({ success: false, error: "Insert query error" });
            });
          }

          // Commit the transaction
          con.commit(function (err) {
            if (err) {
              console.error("Commit error:", err);
              con.rollback(function () {
                return res.status(500).json({ success: false, error: "Commit error" });
              });
            }

            // Send success response
            res.status(200).json({ success: true, message: "Approved successfully" });
          });
        });
      });
    });
  });
});


router.post("/arrearRequests/reject", function (req, res, next) {
  const { employeeId } = req.body;

  const updateQuery = "UPDATE arrears_for_users SET status = 'Rejected' WHERE employee_id = ?";
  con.query(updateQuery, [employeeId], function (error, results) {
    if (error) {
      console.error("Update query error:", error);
      return res.status(500).json({ success: false, error: "Update query error" });
    }

    // Send success response
    res.status(200).json({ success: true, message: "Rejected successfully" });
  });
});

router.get("/accessdenied", function (req, res, next) {
  res.render("accessDenied", { title: "scaleedge", message: req.flash('message') });
});


router.get('/getUserData', (req, res) => {
  const email = req.query.email; // Assuming email is sent as query parameter

  con.query('SELECT * FROM user_master WHERE email = ?', [email], (error, results) => {
    if (error) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = results[0]; // Assuming there's only one user with a given email

    // Assuming you want to send data in a specific format
    const formattedData = {
      user_name: userData.user_name,
      email: userData.email,
      personal_email: userData.personal_email,
      mobile: userData.mobile,
      house: userData.house,
      street: userData.street_address,
      city: userData.city,
      state: userData.state,
      pincode: userData.pincode,
      landmark: userData.landmark,
      joining_date: userData.joining_date,
      birth_date: userData.birth_date,
      // You may add more fields here based on your table structure
    };

    res.json(formattedData);
  });
});

// router.post("/updateUser", function (req, res, next) {
//   var email = req.body.email;
//   var user_name = req.body.user_name;
//   var mobile = req.body.mobile;
//   var joining_date = req.body.joining_date;
//   var km_rupees = req.body.km_rupees;
//   var personalEmail = req.body.personal_email;
//   var house = req.body.house;
//   var street_address = req.body.street_address;
//   var city = req.body.city;
//   var state = req.body.state;
//   var pincode = req.body.pincode;
//   var landmark = req.body.landmark;
//   var status = req.body.status || 'active';
//   var birth_date = req.body.birth_date;
//   console.log(birth_date);

//   if (email) {
//     con.query(
//       "UPDATE user_master SET user_name = ?, mobile = ?, joining_date = ?, km_rupees = ?, personal_email=?, house=?, street_address=?, city=?, state=?, pincode=?, landmark=?, status=?, birth_date=?  WHERE email = ?",
//       [
//         user_name,
//         mobile,
//         joining_date,
//         km_rupees,
//         personalEmail,
//         house,
//         street_address,
//         city,
//         state,
//         pincode,
//         landmark,
//         status,
//         birth_date,
//         email,
//       ],
//       function (err, result) {
//         if (err) {
//           console.error("An error occurred while updating the user:", err);
//           res.redirect("/userProfile");
//         } else {
//           console.log("User updated successfully.");
//           res.redirect("/userProfile");
//         }
//       }
//     );
//   } else {
//     console.error("Email is missing.");
//     res.redirect("/userProfile");
//   }
// });

router.post("/updateUser", function (req, res, next) {
  var email = req.body.email;
  var user_name = req.body.user_name;
  var mobile = req.body.mobile;
  var joining_date = req.body.joining_date;
  var km_rupees = req.body.km_rupees;
  var personalEmail = req.body.personal_email;
  var house = req.body.house;
  var street_address = req.body.street_address;
  var city = req.body.city;
  var state = req.body.state;
  var pincode = req.body.pincode;
  var landmark = req.body.landmark;
  var status = req.body.status || 'active';
  var birth_date = req.body.birth_date;
  var adhar = req.files.adhar;
  var pan = req.files.pan;
  var adharName = adhar.name;
  var panName = pan.name;
  var adharPath = "public/document/" + adharName;
  var panPath = "public/document/" + panName;

  // Move files to the specified paths
  adhar.mv(adharPath, function (err) {
    if (err) {
      console.error("Failed to save Adhar document:", err);
    }
  });

  pan.mv(panPath, function (err) {
    if (err) {
      console.error("Failed to save PAN document:", err);
    }
  });

  if (email) {
    con.query(
      "UPDATE user_master SET user_name = ?, mobile = ?, joining_date = ?, km_rupees = ?, personal_email=?, house=?, street_address=?, city=?, state=?, pincode=?, landmark=?, status=?, birth_date=?, Adhar=?, Pancard=?  WHERE email = ?",
      [
        user_name,
        mobile,
        joining_date,
        km_rupees,
        personalEmail,
        house,
        street_address,
        city,
        state,
        pincode,
        landmark,
        status,
        birth_date,
        adharName,
        panName,
        email,
      ],
      function (err, result) {
        if (err) {
          console.error("An error occurred while updating the user:", err);
          res.redirect("/userProfile");
        } else {
          console.log("User updated successfully.");
          res.redirect("/userProfile");
        }
      }
    );
  } else {
    console.error("Email is missing.");
    res.redirect("/userProfile");
  }
});



// router.get("/error", function (req, res, next) {
//   res.render("error", { title: "scaleedge", message: req.flash('message') });
// });

// router.get("*", function (req, res, next) {
//   res.redirect('/error');
// });

router.get("/form", function (req, res, next) {
  res.render("form", { title: "scaleedge", message: req.flash('message') });
});

router.post('/send-email', (req, res) => {
  const { name, email, message } = req.body;

  const transporter = nodemailer.createTransport({
    con: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "viveksingh2003e@gmail.com",
      pass: "sgraipgxdsrkfmyh",
    }
  });

  const mailOptions = {
    from: 'shubhamsharma20007@gmail.com',
    to: email,
    subject: 'Message from your website',
    text: `Hello ${name},\n\nThank you for reaching out. Here is your message:\n\n${message}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('Error sending email');
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).send('Email sent successfully');
    }
  });
});


router.get('/download-excel', (req, res) => {
  res.render('download-excel');
})

router.get('/downloadUsers', (req, res) => {
  const columns = [
    'id as `Employee Id`',
    'email as `Email`',
  ];

  const query = `SELECT ${columns.join(', ')} FROM user_master WHERE status = 'active'`;

  con.query(query, [columns], (err, rows) => {
    if (err) {
      console.error('Error fetching users: ' + err.stack);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Convert users data to Excel format
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

    // Write Excel file to disk
    const filePath = 'users.xlsx';
    XLSX.writeFile(workbook, filePath);

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + filePath);

    // Send the file as response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Delete the file after sending
    fileStream.on('end', () => {
      fs.unlinkSync(filePath);
    });
  });
});

router.post('/uploadUsers', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Assuming the file input field in the form is named 'file'
  const file = req.files.file;

  // Read the uploaded Excel file
  const workbook = XLSX.read(file.data, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  // Update user details in the database based on email
  rows.forEach(row => {
    const id = row['Employee Id'];
    const updateValues = {
      email: row['Email']
    };

    const query = 'UPDATE user_master SET ? WHERE id = ?';
    con.query(query, [updateValues, id], (err, result) => {
      if (err) {
        console.error('Error updating user: ' + err.stack);
        return res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  // Respond with success if the update process is completed
  return res.status(200).json({ success: 'User details updated successfully' });
});

router.get("/addBranch", function (req, res, next) {
  res.render("addBranch", { title: "scaleedge" });
});

router.post("/addBranch", function (req, res, next) {
  const branchName = req.body.branchName;
  const latitude = req.body.latitude;
  const longitude = req.body.longitude;

  const sql = "INSERT INTO branch_table (branch_name, latitude, longitude) VALUES (?, ?, ?)";
  con.query(sql, [branchName, latitude, longitude], function (err, result) {
    if (err) {
      console.error('Error inserting data into branch_table: ' + err.message);
      res.status(500).json({ error: 'Error inserting data into branch_table' });
      return;
    }
    console.log("Branch added successfully");
    res.json({ message: 'Branch added successfully' });
  });
});


router.get("/addLeaveDetails", function (req, res, next) {
  const sqlQuery = "SELECT um.id AS user_id, um.user_name, uld.total_casual_leave, uld.total_medical_leave, uld.total_paid_leave FROM user_master AS um LEFT JOIN user_leave_details AS uld ON um.id = uld.user_id";
  con.query(sqlQuery, function (err, result) {
    if (err) {
      console.error('Error executing SQL query: ' + err.message);
      res.status(500).json({ error: 'Error executing SQL query' });
      return;
    }
    res.render("addLeaveDetails", { title: "scaleedge", users: result });
  });
});



router.post("/addLeaveDetails", function (req, res, next) {
  const leaveDetails = req.body;

  const year = new Date().getFullYear().toString();

  const sqlInsertLeaveDetails = `
    INSERT INTO user_leave_details 
    (user_id, user_name, total_casual_leave, balance_casual_leave, total_medical_leave, balance_medical_leave, total_paid_leave, balance_paid_leave, year) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
    total_casual_leave = VALUES(total_casual_leave), 
    balance_casual_leave = null,
    total_medical_leave = VALUES(total_medical_leave),
    balance_medical_leave = null,
    total_paid_leave = VALUES(total_paid_leave),
    balance_paid_leave = null
  `;

  const values = leaveDetails.map(detail => [
    detail.user_id,
    detail.user_name,
    detail.total_casual_leave,
    null,
    detail.total_medical_leave,
    null,
    detail.total_paid_leave,
    null,
    year
  ]);

  con.query(sqlInsertLeaveDetails, [values], function (err, result) {
    if (err) {
      console.error('Error inserting/updating data into user_leave_details: ' + err.message);
      res.status(500).json({ error: 'Error inserting/updating data into user_leave_details' });
      return;
    }
    res.status(200).json({ message: 'Leave details added/updated successfully' });
  });
});


router.get("/addHoursDetails", function (req, res, next) {
  const sqlQuery = "SELECT um.id AS user_id, um.user_name, uld.total_hours FROM user_master AS um LEFT JOIN user_hours_details AS uld ON um.id = uld.user_id";
  con.query(sqlQuery, function (err, result) {
    if (err) {
      console.error('Error executing SQL query: ' + err.message);
      res.status(500).json({ error: 'Error executing SQL query' });
      return;
    }
    res.render("addHoursDetails", { title: "scaleedge", users: result });
  });
});



router.post("/addHoursDetails", function (req, res, next) {
  const hoursDetails = req.body;

  const sqlInsertHoursDetails = `
    INSERT INTO user_hours_details 
    (user_id, user_name, total_hours) 
    VALUES ? 
    ON DUPLICATE KEY UPDATE 
    total_hours = VALUES(total_hours) 
  `;

  const values = hoursDetails.map(detail => [
    detail.user_id,
    detail.user_name,
    detail.total_hours,

  ]);

  con.query(sqlInsertHoursDetails, [values], function (err, result) {
    if (err) {
      console.error('Error inserting/updating data into user_hours_details: ' + err.message);
      res.status(500).json({ error: 'Error inserting/updating data into user_hours_details' });
      return;
    }
    res.status(200).json({ message: 'Hours details added/updated successfully' });
  });
});

router.get("/applySalaryForSunday", checkUser, function (req, res, next) {
  const userEmail = req.session.email;

  const currentYear = new Date().getFullYear();

  const isLeapYear = (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0;

  let totalDays, totalSundays;
  if (isLeapYear) {
    totalDays = 366;
    totalSundays = 52;
  } else {
    totalDays = 365;
    totalSundays = 53;
  }

  const query = `
    SELECT employee_id, user_name, status, annual_salary
    FROM user_master
    WHERE email = ?;
  `;

  con.query(query, [userEmail], function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    } else {
      if (results.length === 0) {
        res.status(404).send('User not found');
      } else {
        const amount = results[0].annual_salary / (totalDays - totalSundays);
        res.render("sundaySalary", { title: "scaleedge", userData: results[0], amount });
      }
    }
  });
});

router.post("/storeSundaySalary", function (req, res, next) {
  const { employeeId, user_name, date, amount } = req.body;

  const query = `
    INSERT INTO sunday_salary (employee_id, user_name, date, amount)
    VALUES (?, ?, ?, ?);
  `;

  con.query(query, [employeeId, user_name, date, amount], function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    } else {
      res.status(200).send('Data stored successfully');
    }
  });
});




router.get("/sundaySalaryRequests", function (req, res, next) {
  const query = `
    SELECT *, DATE_FORMAT(date, '%Y-%m-%d') AS date FROM sunday_salary where status = 'Pending';
  `;

  // Execute the query
  con.query(query, function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    } else {
      res.render("sundaySalaryRequests", { title: "Sunday Salary Requests", arrearsData: results });
    }
  });
});


router.post("/approveSalaryRequest", function (req, res, next) {
  const employeeId = req.body.employeeId;

  const query = `
      UPDATE sunday_salary
      SET status = 'Approved'
      WHERE id = ?;
  `;

  con.query(query, [employeeId], function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    } else {
      res.send('Salary request approved successfully');
    }
  });
});

router.post("/rejectSalaryRequest", function (req, res, next) {
  const employeeId = req.body.employeeId;

  const query = `
      UPDATE sunday_salary
      SET status = 'Rejected'
      WHERE id = ?;
  `;

  con.query(query, [employeeId], function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    } else {
      res.send('Salary request rejected successfully');
    }
  });
});

router.get("/faceMatch", checkUser, function (req, res, next) {
  res.render("faceMatch", { title: "faceMatch" });
})

router.get("/faceMatch3", checkUser, function (req, res, next) {
  res.render("faceMatcher3", { title: "faceMatch" });
})

router.get("/faceMatch2", checkUser, function (req, res, next) {
  res.render("faceMatch2", { title: "faceMatch" });
})

router.get("/faceMatchMac", checkUser, function (req, res, next) {
  res.render("faceMatchMac", { title: "faceMatch" });
})

router.get('/api/macaddress', (req, res) => {
  const macAddress = getMACAddress();
  res.json({ macAddress });
});

router.get('/takeImage', function (req, res) {
  const email = req.session.email;
  const query = `
    SELECT Imagepath FROM user_master
    WHERE email = ?;
  `;
  con.query(query, [email], function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (results.length === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.json({ imagePath: results[0].Imagepath });
      }
    }
  });
});


router.get("/companyDirectory", checkUser, function (req, res, next) {
  res.render("companyDirectory", { title: "faceMatch" });
})

router.get("/faceMatchNew", checkUser, function (req, res, next) {
  res.render("faceMatchNew", { title: "faceMatch" });
})

router.get("/uniqueId", checkUser, function (req, res, next) {
  con.query('SELECT employee_id FROM user_master WHERE email = ?', [req.session.email], function (err, rows, fields) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ title: "faceMatch", employeeIds: rows });
    }
  });
});



router.get('/getFaceDetails', function (req, res) {
  const email = req.session.email;
  const query = `
    SELECT id, user_id, Imagepath, latitude, longitude, user_name
    FROM user_master WHERE email = ?;
  `;
  con.query(query, [email], function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      if (results.length === 0) {
        res.status(404).json({ error: 'User not found' });
      } else {
        const userData = {
          id: results[0].id,
          user_id: results[0].user_id,
          Imagepath: results[0].Imagepath,
          latitude: results[0].latitude,
          longitude: results[0].longitude,
          user_name: results[0].user_name
        };
        res.json(userData);
      }
    }
  });
});


router.post('/storePunchInDetails', function (req, res) {
  const {
      user_id,
      A_type,
      user_lat,
      user_lon,
      date_column,
      time_column,
      range_status,
      user_email,
      user_name,
      attendance_mark,
      late_time,
      late_arrive
  } = req.body;

  const query = `
      INSERT INTO attendance (user_id, A_type, user_lat, user_lon, date_column, time_column, range_status, user_email, user_name, attendance_mark, late_time, late_arrive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  con.query(query, [user_id, A_type, user_lat, user_lon, date_column, time_column, range_status, user_email, user_name, attendance_mark, late_time, late_arrive], function (error, results, fields) {
      if (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });
      } else {
          res.json({ message: 'Attendance inserted successfully' });
      }
  });
});



router.post('/storePunchOutDetails', function (req, res) {
  const {
    user_id,
    A_type,
    user_lat,
    user_lon,
    date_column,
    time_column,
    range_status,
    user_email,
    user_name,
    attendance_mark
  } = req.body;

  const query = `
      INSERT INTO attendance (user_id, A_type, user_lat, user_lon, date_column, time_column, range_status, user_email, user_name, attendance_mark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  con.query(query, [user_id, A_type, user_lat, user_lon, date_column, time_column, range_status, user_email, user_name, attendance_mark], function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json({ message: 'Attendance inserted successfully' });
    }
  });
});


router.post('/departments', (req, res) => {
  const { department_name, department_manager } = req.body;
  const sql = 'INSERT INTO departments (department_name, department_manager) VALUES (?, ?)';
  con.query(sql, [department_name, department_manager], (err, result) => {
    if (err) {
      console.error('Error adding department: ' + err.message);
      res.status(500).send('Error adding department');
      return;
    }
    console.log('Department added successfully');
    res.status(200).send('Department added successfully');
  });
});

router.get('/departments', (req, res) => {
  const sql = 'SELECT * FROM departments';
  con.query(sql, (err, result) => {
    if (err) {
      console.error('Error fetching departments: ' + err.message);
      res.status(500).send('Error fetching departments');
      return;
    }
    console.log('Departments fetched successfully');
    res.status(200).json(result);
  });
});


router.get('/user_name_department', function (req, res) {
  const query = 'SELECT user_name FROM user_master WHERE status = "active"';
  con.query(query, function (error, results, fields) {
    if (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(results);
    }
  });
});

router.get('/api/departments/employee-count', (req, res) => {
  const query = `
    SELECT departments.department_name, 
           COALESCE(COUNT(user_master.department), 0) as employee_count, 
           departments.department_manager
    FROM departments
    LEFT JOIN user_master ON departments.department_name = user_master.department
    GROUP BY departments.department_name, departments.department_manager
  `;

  con.query(query, (error, results) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});


router.get('/api/departments/users', (req, res) => {
  const query = `
    SELECT user_master.user_name, 
           user_master.email, 
           user_master.mobile,
           departments.department_name
    FROM user_master
    JOIN departments ON user_master.department = departments.department_name
    ORDER BY departments.department_name, user_master.user_name
  `;

  con.query(query, (error, results) => {
    if (error) {
      console.error('Error executing MySQL query: ' + error.stack);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    // Group users by department
    const groupedUsers = {};
    results.forEach(user => {
      const departmentName = user.department_name;
      if (!groupedUsers[departmentName]) {
        groupedUsers[departmentName] = [];
      }
      groupedUsers[departmentName].push({
        user_name: user.user_name,
        email: user.email,
        mobile: user.mobile
      });
    });

    res.json(groupedUsers);
  });
});

//VIVEK API
router.get('/attendance', (req, res) => {
  const userEmail = req.session.email; 

  // Query to get 'in' attendance data
  con.query(
    "SELECT user_name, A_type, date_column, time_column, attendance_mark FROM attendance WHERE user_email = ? AND A_type = 'in' AND date_column = ? ORDER BY time_column ASC LIMIT 1",
    [userEmail, req.query.date], // Assuming you're passing the date as a query parameter
    (error, results, fields) => {
      if (error) {
        console.error('Error executing query: ' + error.stack);
        res.status(500).send('Error fetching attendance data');
        return;
      }
      const inAttendanceData = results[0];

      // Query to get 'out' attendance data
      con.query(
        "SELECT user_name, A_type, date_column, time_column FROM attendance WHERE user_email = ? AND A_type = 'out' AND date_column = ? ORDER BY time_column DESC LIMIT 1",
        [userEmail, req.query.date], // Assuming you're passing the date as a query parameter
        (error, results, fields) => {
          if (error) {
            console.error('Error executing query: ' + error.stack);
            res.status(500).send('Error fetching attendance data');
            return;
          }
          const outAttendanceData = results[0];

          // Combine 'in' and 'out' attendance data and send response
          const attendanceData = {
            inAttendance: inAttendanceData,
            outAttendance: outAttendanceData
          };
          res.json(attendanceData);
        }
      );
    }
  );
});


router.get('/leave-notifications', (req, res) => {
  const userEmail = req.session.email;
  const userIdQuery = 'SELECT id FROM user_master WHERE email = ?';
  con.query(userIdQuery, [userEmail], (err, userResults) => {
    if (err) {
      console.error('Error fetching user ID:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (userResults.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userId = userResults[0].id;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();

    const startDate = `${ currentYear }-${ currentMonth }-01`;
    const endDate = `${ currentYear }-${ currentMonth }-${ currentDay }`;

    const leaveQuery = `
      SELECT * 
      FROM tblattendance 
      WHERE user_id = ? 
      AND from_date >= ? 
      AND to_date <= ? 
    `;

    const manualAttendanceQuery = `
      SELECT *
      FROM manual
      WHERE user_id = ?
      AND date_column >= ?
      AND date_column <= ?
    `;

    const holidayQuery = `
      SELECT *
      FROM holiday_master
      WHERE Year = ? AND Month = ? AND Date >= ?
    `;

    const currentDayHolidayQuery = `
      SELECT *
      FROM holiday_master
      WHERE Year = ? AND Month = ? AND Date = ?
    `;

    con.query(leaveQuery, [userId, startDate, endDate], (err, leaveResults) => {
      if (err) {
        console.error('Error fetching leave notifications:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      con.query(manualAttendanceQuery, [userId, startDate, endDate], (err, manualResults) => {
        if (err) {
          console.error('Error fetching manual attendance data:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }

        con.query(holidayQuery, [currentYear, currentMonth, currentDate], (err, holidayResults) => {
          if (err) {
            console.error('Error fetching holiday data:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }

          con.query(currentDayHolidayQuery, [currentYear, currentMonth, `${ currentYear }-${ currentMonth }-${ currentDay }`], (err, currentDayHolidayResults) => {
            if (err) {
              console.error('Error fetching current day holiday data:', err);
              res.status(500).json({ error: 'Internal server error' });
              return;
            }

            const combinedResults = {
              leaveNotifications: leaveResults,
              manualAttendance: manualResults,
              upcomingHolidays: holidayResults,
              currentDayHoliday: currentDayHolidayResults.length > 0 ? currentDayHolidayResults[0] : null
            };
            res.json(combinedResults);
          });
        });
      });
    });
  });
});
router.get('/totalHoursWorked', (req, res) => {
  const { email } = req.session;

  if (!email) {
      return res.status(400).json({ message: 'Email is missing in session.' });
  }

  const date = new Date();
  const currentMonth = date.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = date.getFullYear();

  const sql = `
      CALL CalculateTotalHoursWorkedForUser('${email}', ${currentMonth}, ${currentYear});
  `;

  con.query(sql, (error, results) => {
      if (error) {
          console.error('Error executing procedure: ', error.message);
          return res.status(500).json({ message: 'Internal server error.' });
      }
      
      if (results && results.length > 0) {
          return res.status(200).json(results[0]);
      } else {
          return res.status(404).json({ message: 'No data found.' });
      }
  });
});


router.get('/dailyHoursWorked', (req, res) => {
  const { email } = req.session;

  if (!email) {
      return res.status(400).json({ message: 'Email is missing in session.' });
  }

  const date = new Date();
  const currentMonth = date.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = date.getFullYear();

  const sql = `
      CALL CalculateDailyHoursWorkedForUser('${email}', ${currentMonth}, ${currentYear});
  `;

  con.query(sql, (error, results) => {
      if (error) {
          console.error('Error executing procedure: ', error.message);
          return res.status(500).json({ message: 'Internal server error.' });
      }

      if (results && results.length > 0) {
          return res.status(200).json(results);
      } else {
          return res.status(404).json({ message: 'No data found.' });
      }
  });
});
module.exports = router;

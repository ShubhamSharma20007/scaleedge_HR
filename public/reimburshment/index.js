const express = require("express");

const router = express.Router();

const passport = require("passport");

const GoogleStrategy = require("passport-google-oauth20").Strategy;

const mysql = require("mysql");

const bcrypt = require("bcrypt");

const con = require("../database");

const fileUpload = require("express-fileupload");

/*const sharp = require("sharp");*/

const hbs = require("hbs");

const swal = require("sweetalert");

const Handlebars = require("handlebars");

router.use(fileUpload());

const nodemailer = require("nodemailer");

const fs = require("fs");
const xlsx = require("xlsx");
const checkUser = require('../middleware/checkUser')


const transporter = nodemailer.createTransport({

    host: "az1-ts112.a2hosting.com",

    port: 465,

    secure: true,

    auth: {

        user: "sumit@scaleedge.in",

        pass: "sumitQWE123!@",

    },

});



transporter.verify(function (error, success) {

    if (error) {

        console.log("SMTP connection error:", error);

    } else {

        console.log("Server is ready to take our messages");

    }

});



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



hbs.registerHelper("formatDate", function (date) {

    return new Date(date).toISOString().split("T")[0];

});



hbs.registerHelper("ifEquals", function (arg1, arg2, options) {

    return arg1 === arg2 ? options.fn(this) : options.inverse(this);

});



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



hbs.registerHelper("capitalizeFirst", function (str) {

    if (typeof str !== "string") {

        return str;

    }

    return str.charAt(0).toUpperCase() + str.slice(1);

});

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



//login

router.get("/", function (req, res, next) {

    res.render("login", { title: "scaleedge", message: req.flash('message') });
});



router.post("/auth_login", function (req, res, next) {
    var email = req.body.email;
    var password = req.body.password;
    email = email.toLowerCase();
    var sql = "CALL loginUserNew(?, ?);";
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
            var userCity = result[0][0].userCity;
            var userPincode = result[0][0].userPincode;
            var userEmployeeId = result[0][0].userEmployeeId;
            var userMobile = result[0][0].userMobile;
            var joiningDate = result[0][0].joiningDate;
            var birthDate = result[0][0].birthDate;


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
                userCity: userCity,
                userPincode: userPincode,
                userEmployeeId: userEmployeeId,
                userMobile: userMobile,
                joiningDate: joiningDate,
                birthDate: birthDate
            });
        } else {
            res.send({ success: false, message: "Invalid email or password." });
        }
    });
});



// Registeration

router.get("/auth_reg", function (req, res, next) {

    res.render("register", { title: "scaleedge" });

});

router.get("/registerationRequests", checkUser, function (req, res, next) {
    const query = "SELECT * from user_master_data";
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

router.get("/registerationShow/:id", checkUser, function (req, res, next) {
    var userId = req.params.id;
    var selectSql =
        "SELECT id, user_name, email, mobile, Imagepath, user_group, joining_date, annual_salary, latitude, longitude FROM user_master_data WHERE id = ?";
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

router.get("/registerationRequests1/:id", checkUser, function (req, res, next) {
    var userId = req.params.id;
    var selectSql = "SELECT * FROM user_master_data WHERE id = ?";
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

router.post("/registerationRequests", function (req, res, next) {
    var userId = req.body.id;
    var action = req.body.action;

    if (action === "approve") {
        var selectSql = "SELECT * FROM user_master_data WHERE id = ?";
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

                        var deleteSql = "DELETE FROM user_master_data WHERE id = ?";
                        con.query(deleteSql, [userId], function (err, result) {
                            if (err) {
                                throw err;
                            }

                            sendApprovalEmail(userData, function () {
                                res.json({ success: true }); // Return success as JSON response
                            });
                        });
                    }
                );
            } else {
                res.json({ success: false, message: 'User not found' });
            }
        });
    } else if (action === "reject") {
        var deleteSql = "DELETE FROM user_master_data WHERE id = ?";
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
        var selectSql = "SELECT * FROM user_master_data WHERE id = ?";
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

                        var deleteSql = "DELETE FROM user_master_data WHERE id = ?";
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
        from: "sumit@scaleedge.in",
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
        from: "sumit@scaleedge.in",
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

router.post("/auth_reg", function (req, res, next) {
    var company_name = req.body.company_name;
    var address = req.body.address;
    var email = req.body.email;
    var mobile = req.body.mobile;
    var password = req.body.password;
    var cpassword = req.body.cpassword;
    var annual_salary = req.body.annual_salary;
    var name = req.body.name;
    var registrationType = req.body.registrationType;
    var profileImage = req.files.Imagepath;
    var Imagepath = "public/profile/" + profileImage.name;
    var Imagename = profileImage.name;
    if (registrationType === "google") {
        res.redirect("/auth/google");
    } else {
        if (cpassword == password) {
            var insertSql = "CALL insert_company_user22112023 (?, ?, ?, ?, ?, ?, ?, ?);";
            con.query(
                insertSql,
                [company_name, address, email, mobile, password, name, Imagename, annual_salary],
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

router.post('/checkEmailExists', (req, res) => {
    const email = req.body.email;

    const selectEmailSql = "SELECT * FROM user_master WHERE email = ?";
    con.query(selectEmailSql, [email], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (result && result.length > 0) {
            return res.json({ emailExists: true });
        } else {
            return res.json({ emailExists: false });
        }
    });
});

router.post("/check_email_exists", function (req, res, next) {

    var email = req.body.email;



    con.query(

        "CALL CheckEmailExists3112023(?, @emailExists)",

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



//dashboard

router.get("/dashboard", checkUser, function (req, res, next) {
    const user_group = req.session.user_group;
    const user_email = req.session.email;

    con.query(
        "CALL GetDashboardData(?, ?)",
        [user_group, user_email],
        function (err, rows) {
            if (err) {
                console.error(err);
                return res.status(500).send("Internal Server Error");
            }

            const result = rows[0];

            if (user_group === "admin") {
                const totalPendingRequests = result.length;

                con.query(
                    "SELECT COUNT(*) AS totalAttendanceRequests FROM manual WHERE status = 'pending'",
                    function (err, manualRows) {
                        if (err) {
                            console.error(err);
                            return res.status(500).send("Internal Server Error");
                        }

                        const totalAttendanceRequests =
                            manualRows[0].totalAttendanceRequests;

                        con.query(
                            "SELECT COUNT(*) AS totalUsers FROM user_master_data",
                            function (err, userCountRows) {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).send("Internal Server Error");
                                }

                                const totalUsers = userCountRows[0].totalUsers;

                                res.render("dashboard", {
                                    message: "Welcome, " + user_email,
                                    rows: result,
                                    totalPendingRequests: totalPendingRequests,
                                    totalAttendanceRequests: totalAttendanceRequests,
                                    totalUsers: totalUsers,
                                });
                            }
                        );
                    }
                );
            } else if (user_group === "user") {
                res.redirect("/userdashboard");
            } else {
                res.redirect("/");
            }
        }
    );
});



router.get("/dashboardLeave", checkUser, function (req, res, next) {

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



//details

router.get("/details/:user_name", checkUser, function (req, res, next) {

    const user_name = req.params.user_name;

    con.query("CALL user_in_out2(?)", [user_name], (err, rows) => {

        if (!err) {

            res.render("details", {

                rows: rows[0],

                message: "Welcome, " + req.session.email,

            });

        } else {

            console.log(err);

        }

        console.log("The data from attendance table: \n", rows[0]);

    });

});



//leaveApplication

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

                    });

                } else {

                    var user_name = result[0][0]

                        ? result[0][0].user_name

                        : "Default Login User";

                    res.render("leaveAppl", {

                        user_name: user_name,

                        sidebar: false,

                        attendanceSidebar: true,

                    });

                }

            }

        );

    } else {

        res.redirect("/");

    }

});



router.post("/submitLeave", function (req, res, next) {
    const userpk = req.body.user_name;
    const from_date = req.body.from_date;
    const days = parseFloat(req.body.days);
    const remarks = req.body.remarks;

    con.query(
        "CALL SubmitLeave3(?, ?, ?, ?)",
        [userpk, from_date, days, remarks],
        function (err, result) {
            if (err) {
                console.error(
                    "An error occurred while calling the stored procedure:",
                    err
                );
                res.redirect("/");
            } else {
                console.log(result[0][0].message);

                // Assuming req.session.email contains the user's email address
                const userEmail = req.session.email;

                // Sending email
                sendLeaveApplicationEmail(userEmail, from_date, days, remarks, userpk);

                if (req.session.user_group === "admin") {
                    res.redirect("/dashboard");
                } else if (req.session.user_group === "user") {
                    res.redirect("/userdashboard");
                } else {
                    res.redirect("/");
                }
            }
        }
    );
});


function sendLeaveApplicationEmail(userEmail, from_date, days, remarks, username) {
    const mailOptions = {
        from: userEmail,
        to: "sumit@scaleedge.in",
        subject: "Leave Application",
        html: `
        <html>
          <head>
            <style>
              body {
                font-family: 'Arial', sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
              }
              h2 {
                color: #333333;
              }
              p {
                color: #555555;
              }
              ul {
                list-style-type: none;
                padding: 0;
              }
              li {
                margin-bottom: 10px;
              }
              .details {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Leave Application submitted by ${username}</h2>
              <div class="details">
                <p><strong>Details:</strong></p>
                <ul>
                  <li><strong>From Date:</strong> ${from_date}</li>
                  <li><strong>Days:</strong> ${days}</li>
                  <li><strong>Remarks:</strong> ${remarks}</li>
                </ul>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error("Error sending email:", error);
        } else {
            console.log("Email sent:", info.response);
        }
    });
}


router.get("/leaveTable", checkUser, function (req, res, next) {

    var userGroup = req.session.user_group;

    var userEmail = req.session.email;



    con.query(

        "CALL GetLeaveDataByUserGroup2(?, ?)",

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



router.get("/leaveTableuser", checkUser, function (req, res, next) {

    var userEmail = req.session.email;



    con.query(

        "CALL GetLeaveDataForUser22112023(?)",

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



router.get("/leaveApproval", checkUser, function (req, res, next) {

    let userGroup = req.session.user_group;

    let isAdmin = userGroup === "admin";

    res.render("leaveApproval", { title: "sumit", isAdmin: isAdmin });

});



router.get("/leaveApproval/:id", checkUser, function (req, res, next) {

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



router.post("/updateLeave/:id", function (req, res, next) {

    const leaveId = req.params.id;

    const { approval, leave_type, manager_remarks } = req.body;

    const userEmail = req.session.email;



    con.query(

        "CALL UpdateLeaveWithApproval4(?, ?, ?, ?, ?)",

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



//usermanagment

router.get("/usermangment", checkUser, (req, res) => {

    con.query("CALL user_master_fetchdata()", (err, rows) => {

        if (!err) {

            let removedUser = req.query.removed;

            res.render("usermangment", { rows: rows[0], removedUser });

        } else {

            console.log(err);

        }

        console.log("The data from user table: \n", rows[0]);

    });

});



//logout

router.get("/logout", function (req, res, next) {

    if (req.session.email) {

        req.session.destroy();

    }

    res.redirect("/");

});



//add user

router.get("/add", checkUser, function (req, res, next) {

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

    var insertSql = "CALL user_master_userformdata08122023 (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

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
                        from: "sumit@scaleedge.in",
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



//edit



router.get("/edit/:id", function (req, res, next) {
    var userId = req.params.id;
    var selectSql =
        "SELECT * FROM user_master WHERE id = ?";
    con.query(selectSql, [userId], function (err, result) {
        if (err) {
            throw err;
        }

        if (result.length > 0) {
            var formattedJoiningDate = new Date(result[0].joining_date)
                .toISOString()
                .split("T")[0];
            var annualSalary = parseFloat(result[0].annual_salary);
            res.render("edit", {
                title: "scaleedge",
                user: result[0],
                formattedJoiningDate: formattedJoiningDate,
                annualSalary: annualSalary,
            });
        } else {
            res.redirect("/usermanagement");
        }
    });
});

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
    var updateSql =
        "CALL user_master_update_on08122023 (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?)";

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
                landmark
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
                    res.redirect("/usermangment");
                }
            }
        );
    } else {
        con.query(
            "UPDATE user_master SET user_id= ?,  user_name = ?, email = ?, mobile = ?, user_group = ?, user_type = ?, joining_date = ?, annual_salary = ?, latitude = ?, longitude = ?, km_rupees = ?, personal_email=?, house=?, street_address=?, city=?, state=?, pincode=?, landmark=? WHERE id = ?",
            [
                email,
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
                userId
            ],
            function (err, result) {
                if (err) {
                    console.error("An error occurred while updating the user:", err);
                    res.redirect("/usermangment");
                } else {
                    console.log("User updated successfully.");
                    res.redirect("/usermangment");
                }
            }
        );
    }
});


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



//report

// router.get("/report", function (req, res, next) {

//   con.query(

//     "SELECT DISTINCT user_name FROM user_master",

//     function (error, users) {

//       if (error) {

//         console.log("Error fetching users:", error);

//         return res.status(500).send("Internal Server Error");

//       }



//       con.query("CALL GetAttendanceReport()", function (error, rows) {

//         if (error) {

//           console.log("Error fetching attendance data:", error);

//           return res.status(500).send("Internal Server Error");

//         }

//         res.render("report", { title: "ashish", rows: rows[0], users: users });

//       });

//     }

//   );

// });
router.get("/distance", checkUser, function (req, res, next) {
    // Extract user_name and date from the query parameters
    const userName = req.query.user_name;
    const date = req.query.date;
  
    // Call the stored procedure with the extracted parameters
    con.query("CALL scaleedgeAttendanceDistance(?, ?)", [userName, date], function (error, results, fields) {
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

router.get("/report", checkUser, function (req, res, next) {
    con.query(
        "SELECT DISTINCT user_name FROM user_master",
        function (error, users) {
            if (error) {
                console.log("Error fetching users:", error);
                return res.status(500).send("Internal Server Error");
            }

            con.query("CALL UserHoursTracker()", function (error, rows) {
                if (error) {
                    console.log("Error fetching attendance data:", error);
                    return res.status(500).send("Internal Server Error");
                }

                const combinedRows = [];
                const numMonths = 6; // Display data for the current month up to the current date and the previous 5 months
                const currentDate = new Date();
                const currentMonthDate = new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    1
                );

                for (let i = 0; i < numMonths; i++) {
                    const monthDate = new Date(
                        currentMonthDate.getFullYear(),
                        currentMonthDate.getMonth() - i,
                        1
                    );

                    let lastDateOfMonth = new Date(
                        monthDate.getFullYear(),
                        monthDate.getMonth() + 1,
                        0
                    );

                    // For the current month, set the lastDateOfMonth to the current date
                    if (i === 0) {
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

                            const isSunday = date.getDay() === 0; // Sunday is typically day 0

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
                }

                combinedRows.sort((a, b) => (a.date_column < b.date_column ? -1 : 1));

                res.render("report", {
                    title: "ashish",
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

    // Add the next day's date
    const nextDay = new Date(currentDate);
    dates.push(nextDay);

    return dates;
}



//faceRecognition

router.get("/attendanceBrowser", checkUser, function (req, res, next) {

    let userGroup = req.session.user_group;

    let isAdmin = userGroup === "admin";

    res.render("attendanceBrowser", { title: "sumit", isAdmin: isAdmin });

});



router.get("/attendanceMobile", checkUser, function (req, res, next) {

    let userGroup = req.session.user_group;

    let isAdmin = userGroup === "admin";

    res.render("attendanceMobile", { title: "sumit", isAdmin: isAdmin });

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

router.post("/attendanceMeeting", function (req, res, next) {
    const userEmail = req.session.email;
    const getUserInfoQuery = 'SELECT id, user_id, email, user_name FROM user_master WHERE email = ?';

    con.query(getUserInfoQuery, [userEmail], (err, userResults) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error retrieving user information');
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
                        res.status(500).send('Error inserting meeting data');
                    } else {
                        res.render('attendanceMeeting');
                    }
                }
            );
        }
    });
});


router.post("/attendanceMeetingOut", function (req, res, next) {
    const userEmail = req.session.email;
    const getUserInfoQuery = 'SELECT id, user_id, email, user_name FROM user_master WHERE email = ?';

    con.query(getUserInfoQuery, [userEmail], (err, userResults) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error retrieving user information');
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
                    res.status(500).send('Error saving the image');
                } else {
                    const updateMeetingQuery = `
            UPDATE meeting_table 
            SET meet_out = NOW(), time_field = CONVERT_TZ(NOW(), '+00:00', '+12:30'), 
            clientName = ?, client_email = ?, client_mobile = ?, image_path = ?, lead_status = ?
            WHERE user_Id = ? AND meet_out IS NULL
          `;

                    con.query(
                        updateMeetingQuery,
                        [clientName, client_email, client_mobile, imageFileName, lead_status, user_id],
                        (updateErr, updateResults) => {
                            if (updateErr) {
                                console.error(updateErr);
                                res.status(500).send('Error updating meeting data');
                            } else {
                                res.render('attendanceMeetingOut');
                            }
                        }
                    );
                }
            });
        }
    });
});;

router.post("/getimg", function (req, res, next) {

    var callProc = "CALL get_images1110()";

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



    var insertSql = "CALL Attendance4(?, ?, ?, ?, ?, ?, ?)";

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

                var insertSql = "CALL InsertMeeting_4112023(?, ?, ?, ?, ?)";
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



router.post('/checkAttendanceEntry', function (req, res, next) {

    var label = req.body.label;

    var currentDate = formatDateToMySQLDate(new Date());



    var selectSql = 'SELECT COUNT(*) AS count FROM attendance WHERE user_email = ? AND A_type = "in" AND date_column = ?';

    con.query(selectSql, [label, currentDate], function (err, result) {

        if (err) {

            console.error('An error occurred while checking attendance entry:', err);

            res.status(500).json({ success: false, error: err });

        } else {

            const exists = result[0].count > 0;

            res.json({ exists });

        }

    });

});



router.post('/checkAttendance', function (req, res, next) {

    var label = req.body.label;

    var currentDate = formatDateToMySQLDate(new Date());



    var selectSql = 'SELECT COUNT(*) AS count FROM attendance WHERE user_email = ? AND A_type = "in" AND date_column = ?';

    con.query(selectSql, [label, currentDate], function (err, result) {

        if (err) {

            console.error('An error occurred while checking attendance entry:', err);

            res.status(500).json({ success: false, error: err });

        } else {

            const exists = result[0].count > 0;

            res.json({ exists });

        }

    });

});





function formatDateToMySQLDate(date) {

    const year = date.getFullYear();

    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;

}

var currentDate = formatDateToMySQLDate(new Date());





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

                        console.log("Checkout time and time_field stored for label:", label);

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



                var insertSql = "CALL Attendance4(?, ?, ?, ?, ?, ?, ?)";

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



                var insertSql = "CALL Attendance4(?, ?, ?, ?, ?, ?, ?)";

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



//lead_managment

router.get("/lead", checkUser, function (req, res, next) {

    res.render("lead", { message: "Welcome, " + req.session.email });

});



router.post("/lead", function (req, res, next) {

    var name = req.body.name;

    var email = req.body.email;

    var mobile = req.body.mobile;

    var source = req.body.source;



    var insertSql = "CALL insert_lead(?, ?, ?, ?);";



    con.query(

        insertSql,

        [name, email, mobile, source],

        function (err, result, fields) {

            if (err) {

                console.error("An error occurred while inserting the lead:", err);

                return res.status(500).send("Internal Server Error");

            }



            if (result.affectedRows > 0) {

                res.json({ success: true });

            } else {

                res

                    .status(400)

                    .json({ success: false, message: "Failed to add the lead." });

            }

        }

    );

});



//Attendance/add/update/delete

router.get("/attendanceAUD", checkUser, function (req, res, next) {

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



router.get("/addAttendance", checkUser, function (req, res, next) {

    con.query("CALL GetUsers()", (err, results) => {

        if (err) throw err;



        const users = results[0];

        res.render("addAttendance", { users: users });

    });

});



// router.post("/addAttendance", function (req, res, next) {

//   const {

//       userDropdwon,

//       date,

//       time,

//       userLat,

//       userLon,

//       A_type,

//       attendanceMark,

//       rangeStatus,

//   } = req.body;



//   con.query(

//       "CALL AddAttendance(?, ?, ?, ?, ?, ?, ?, ?)",

//       [

//           userDropdwon,

//           A_type,

//           userLat,

//           userLon,

//           date,

//           time,

//           rangeStatus,

//           attendanceMark,

//       ],

//       (err, result) => {

//           if (err) throw err;



//           console.log("Attendance record inserted successfully!");

//           res.redirect("/attendanceAUD");

//       }

//   );

// });



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

router.get("/deleteAttendance/:id", checkUser, function (req, res, next) {

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



router.get("/attendanceEdit/:id", checkUser, function (req, res, next) {

    var userId = req.params.id;

    var callProc = "CALL GetAttendanceById(?)";



    con.query(callProc, [userId], function (err, result) {

        if (err) throw err;



        if (result[0].length > 0) {

            res.render("attendanceEdit", {

                title: "scaleedge",

                user: result[0][0],

            });

        } else {

            res.redirect("/attendanceAUD");

        }

    });

});



hbs.registerHelper("eq", function (a, b, options) {

    return a === b ? options.fn(this) : options.inverse(this);

});



// router.post('/updateAttendance/:id', function (req, res, next) {

//   const userId = req.params.id;

//   const { user_name, date, time, A_type, userLat, userLon, attendanceMark, rangeStatus } = req.body;



//   con.query(

//     'CALL UpdateAttendance31(?, ?, ?, ?, ?, ?, ?, ?, ?)',

//     [userId, user_name, date, time, A_type, userLat, userLon, attendanceMark, rangeStatus],

//     function (err, results) {

//       if (err) throw err;



//       const message = results[0][0].message;



//       if (message === 'Update successful') {

//         res.redirect('/attendanceAUD');

//       } else {

//         res.send('Update failed');

//       }

//     }

//   );

// });

router.get("/userHrsTracker", checkUser, function (req, res, next) {

    con.query(

        "SELECT DISTINCT user_name FROM user_master",

        function (error, users) {

            if (error) {

                console.log("Error fetching users:", error);

                return res.status(500).send("Internal Server Error");

            }



            con.query("CALL UserHoursTracker()", function (error, rows) {

                if (error) {

                    console.log("Error fetching attendance data:", error);

                    return res.status(500).send("Internal Server Error");

                }

                res.render("workingHours", {

                    title: "ashish",

                    rows: rows[0],

                    users: users,

                });

            });

        }

    );

});

//holiday

router.get("/holiday", checkUser, function (req, res, next) {
    con.query("CALL GetHolidayDataver2()", function (error, holidayResults) {
        if (error) {
            return next(error);
        }

        con.query("CALL GetHalfdayDataver2()", function (error, halfdayResults) {
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



    con.query("CALL DeleteHoliday0412(?)", [holidayId], function (error, results) {

        if (error) {

            console.error("Delete error:", error);

            return res.json({ success: false });

        }

        return res.json({ success: true });

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

router.delete("/deleteHalfday/:id", function (req, res, next) {
    const holidayId = req.params.id;

    con.query("CALL DeleteHalfday0412(?)", [holidayId], function (error, results) {
        if (error) {
            console.error("Delete error:", error);
            return res.json({ success: false });
        }
        return res.json({ success: true });
    });
});

router.get("/editHalfday/:Id", checkUser, function (req, res, next) {
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

router.post("/updateHalfday/:Id", function (req, res, next) {
    var userId = req.params.Id;
    var month = req.body.month;
    var year = req.body.year;
    var date = req.body.date;

    con.query(
        "CALL UpdateHalfday0412(?, ?, ?, ?)",
        [userId, month, year, date],
        function (err, result) {
            if (err) throw err;
            res.redirect("/holiday");
        }
    );
});

router.get("/editHoliday/:Id", checkUser, function (req, res, next) {

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



router.post("/updateHoliday/:Id", function (req, res, next) {

    var userId = req.params.Id;

    var month = req.body.month;

    var year = req.body.year;

    var date = req.body.date;

    var remarks = req.body.remarks;



    con.query(

        "CALL UpdateHoliday0412(?, ?, ?, ?, ?)",

        [userId, month, year, date, remarks],

        function (err, result) {

            if (err) throw err;

            res.redirect("/holiday");

        }

    );

});



router.post("/updateHoliday/:Id", function (req, res, next) {

    var userId = req.params.Id;

    var month = req.body.month;

    var year = req.body.year;

    var date = req.body.date;

    var remarks = req.body.remarks;



    con.query(

        "CALL UpdateHoliday0412(?, ?, ?, ?, ?)",

        [userId, month, year, date, remarks],

        function (err, result) {

            if (err) throw err;

            res.redirect("/holiday");

        }

    );

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



    var updateProcedure = "CALL UpdateAttendance31(?, ?, ?, ?, ?, ?, ?, ?, ?)";



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



//salary

router.get("/salaryFinder", checkUser, function (req, res, next) {

    con.query("SELECT user_name FROM user_master", function (error, results) {

        if (error) {

            throw error;

        }

        const users = results;

        res.render("salary", { title: "scaleedge", users });

    });

});



router.post("/salaryFinder", (req, res) => {
    const selected_year = req.body.selected_year;  // Add this line to get the selected_year from the request body
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
            "CALL SalaryBureo_year(?, ?, ?)",  // Update the call to the stored procedure to include selected_year
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



router.get("/salaryTracker", checkUser, (req, res, next) => {

    res.render("salaryTracker", { title: "scaleedge" });

});



router.post("/generate-salary", (req, res) => {
    const selectedMonth = req.body.selectedMonth;
    const selectedYear = req.body.selectedYear;

    con.query(
        "CALL salary_halfday_ta(?, ?)",
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

                const insertQuery =
                    "INSERT INTO generate_salary (user_id, total_salary, month, year, date, total_working_hours, total_present,total_absent, total_halfday, total_holidays ) VALUES ?";
                const values = [];

                for (const user of salaryData) {
                    values.push([
                        user.id,
                        user.total_salary_perDay_hour,
                        selectedMonth,
                        selectedYear,
                        new Date(),
                        user.total_working_hours,
                        user.total_present,
                        user.total_absent,
                        user.total_halfday,
                        user.total_holidays,
                    ]);
                }

                con.query(insertQuery, [values], (err, insertResult) => {
                    if (err) {
                        console.error(err);
                        return res
                            .status(500)
                            .send("Error inserting data into generate_salary");
                    }

                    res.render("salaryTracker", {
                        title: "scaleedge",
                        salaryData,
                        selectedMonth,
                        selectedYear,
                    });
                });
            });
        }
    );
});



router.get("/user_report", checkUser, function (req, res, next) {

    con.query(

        "SELECT DISTINCT user_name FROM user_master",

        function (error, users) {

            if (error) {

                console.log("Error fetching users:", error);

                return res.status(500).send("Internal Server Error");

            }



            con.query("CALL GetAttendanceReport08()", function (error, rows) {

                if (error) {

                    console.log("Error fetching attendance data:", error);

                    return res.status(500).send("Internal Server Error");

                }

                res.render("userReport", {

                    title: "ashish",

                    rows: rows[0],

                    users: users,

                });

            });

        }

    );

});



router.get("/attendanceSelfie", checkUser, function (req, res, next) {

    let userGroup = req.session.user_group;

    let isAdmin = userGroup === "admin";

    res.render("SelfieAttendance", { title: "sumit", isAdmin: isAdmin });

});



// router.post("/generateusersjson", function (req, res, next) {

//   const usersjson = req.body.usersjson;

//   const userfilename = req.body.userfilename;

//   const publicDirectory = path.join(__dirname, '../public');



//   if (!fs.existsSync(publicDirectory)) {

//     fs.mkdirSync(publicDirectory);

//   }



//   const filePath = path.join(publicDirectory, userfilename);



//   fs.writeFile(filePath, usersjson, 'utf8', function (err) {

//     if (err) {

//       console.error(err);

//       res.status(500).json("Error writing the file.");

//     } else {

//       console.log('File saved:', filePath);

//       res.json("File saved successfully.");

//     }

//   });

// });



const path = require('path');

router.post("/generateusersjson/:userid", function (req, res, next) {
  const usersjson = req.body.usersjson;
  const userId = req.params.userid;
  const customDirectory = "/home/scaleedg/node.scaleedge.in/public";

  if (!fs.existsSync(customDirectory)) {
    fs.mkdirSync(customDirectory, { recursive: true });
  }

  const filePath = path.join(customDirectory, `${userId}.json`);

  fs.writeFile(filePath, usersjson, "utf8", function (err) {
    if (err) {
      console.error(err);
      res.status(500).json("Error writing the file.");
    } else {
      console.log("File saved:", filePath);
      res.json("File saved successfully.");
    }
  });
});



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



// router.get("/report_user", function (req, res, next) {

//   const userEmail = req.session.email;



//   con.query(

//     "SELECT DISTINCT user_name FROM user_master WHERE email = ?",

//     [userEmail],

//     function (error, users) {

//       if (error) {

//         console.log("Error fetching users:", error);

//         return res.status(500).send("Internal Server Error");

//       }



//       const currentDate = new Date();

//       const currentYear = currentDate.getFullYear();

//       const currentMonth = currentDate.getMonth();



//       const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;

//       const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;



//       const allDatesForCurrentMonth = getAllDatesForMonth(currentYear, currentMonth);

//       const allDatesForPrevMonth = getAllDatesForMonth(prevMonthYear, prevMonth);



//       con.query("CALL summaryTracker1110(?)", [userEmail], function (error, rows) {

//         if (error) {

//           console.log("Error fetching attendance data:", error);

//           return res.status(500).send("Internal Server Error");

//         }



//         const combinedRows = [];



//         allDatesForCurrentMonth.forEach((date) => {

//           const dateString = date.toISOString().split("T")[0];

//           const existingRow = rows[0].find((row) => row.date_column === dateString);



//           const isSunday = date.getDay() === 1;



//           combinedRows.push({

//             user_name: users[0].user_name,

//             date_column: dateString,

//             time_in: existingRow ? existingRow.time_in : "--",

//             time_out: existingRow ? existingRow.time_out : "--",

//             hours_worked: existingRow ? existingRow.hours_worked : "--",

//             attendance_mark: isSunday ? "Sunday" : (existingRow ? existingRow.attendance_mark : "Absent"),

//           });

//         });



//         allDatesForPrevMonth.forEach((date) => {

//           const dateString = date.toISOString().split("T")[0];

//           const existingRow = rows[0].find((row) => row.date_column === dateString);



//           const isSunday = date.getDay() === 0;



//           combinedRows.push({

//             user_name: users[0].user_name,

//             date_column: dateString,

//             time_in: existingRow ? existingRow.time_in : "--",

//             time_out: existingRow ? existingRow.time_out : "--",

//             hours_worked: existingRow ? existingRow.hours_worked : "--",

//             attendance_mark: isSunday ? "Sunday" : (existingRow ? existingRow.attendance_mark : "Absent"),

//           });

//         });



//         combinedRows.sort((a, b) => (a.date_column < b.date_column ? -1 : 1));



//         res.render("reportUser", { title: "ashish", rows: combinedRows, users: users });

//       });

//     }

//   );

// });

router.get("/report_user", checkUser, function (req, res, next) {

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



            con.query(

                "CALL summaryTracker_271023(?)",

                [userEmail],

                function (error, rows) {

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

                        title: "ashish",

                        rows: combinedRows,

                        users: users,

                    });

                }

            );

        }

    );

});



router.get("/manualAttendance", checkUser, function (req, res, next) {

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

        "CALL InsertManualAttendance_271023(?, ?, ?, ?, ?, ?, ?, ?)",

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



router.get("/attendanceManual", checkUser, function (req, res, next) {

    const query = "CALL GetAttendanceManual_271023()";

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



router.get("/approveAttendance/:id", checkUser, function (req, res, next) {

    const id = req.params.id;



    const query = "CALL GetManualData_271023(?)";

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



        res.render("approveAttendance", {

            title: "scaleedge",

            id: manualData.id,

            user_id: manualData.user_id,

            email: manualData.user_email,

            user_name: manualData.user_name,

            date: manualData.date_column.toISOString().slice(0, 10),

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
router.post("/approveAttendance", function (req, res, next) {
    const {
        id,
        user_id,
        user_name,
        user_email,
        date,
        time,
        A_type,
        userLat,
        userLon

    } = req.body;
    const attendanceMark = (req.body.attendanceMark || '').trim();
    const rangeStatus = (req.body.rangeStatus || '').trim();

    const updateQuery = "UPDATE manual SET status = 'approve' WHERE id = ?";
    con.query(updateQuery, [id], function (updateError, updateResults) {
        if (updateError) {
            console.error("Database query error:", updateError);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        const query = `
          INSERT INTO attendance (user_id, user_name, user_email, date_column, time_column, A_type, user_lat, user_lon, attendance_mark, range_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

        const values = [
            user_id,
            user_name,
            user_email,
            date,
            time,
            A_type,
            userLat,
            userLon,
            attendanceMark,
            rangeStatus
        ];
        con.query(query, values, function (error, results) {
            if (error) {
                console.error("Database query error:", error);
                return res.status(500).json({ success: false, error: "Database error" });
            }

            res.json({ success: true, message: "Attendance has been approved and data inserted into the attendance table" });
        });
    });
});


// reject attendance post router
router.post("/rejectAttendance", function (req, res, next) {
    const { id } = req.body;

    const updateQuery = "UPDATE manual SET status = 'reject' WHERE id = ?";
    con.query(updateQuery, [id], function (updateError, updateResults) {
        if (updateError) {
            console.error("Database query error:", updateError);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        res.json({ success: true, message: "Attendance has been rejected" });
    });
});



function sendBirthdayEmail(userEmail, userName) {
    const transporter = nodemailer.createTransport({
        con: true,
        host: 'az1-ts112.a2hosting.com',
        port: 465,
        secure: true,
        auth: {
            user: 'sumit@scaleedge.in',
            pass: 'sumitQWE123!@',
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
        from: 'sumit@scaleedge.in',
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


router.get("/userdashboard", checkUser, function (req, res, next) {
    const userEmail = req.session.email;

    const query =
        "SELECT user_name, Imagepath, mobile, user_type, birth_date FROM user_master WHERE email = ?";
    con.query(query, [userEmail], (err, results) => {
        if (err) {
            console.error("Error querying the database: " + err.message);
            return res.status(500).send("Internal Server Error");
        }

        if (results.length === 0) {
            return res.status(404).send("User not found");
        }

        const userData = results[0];

        const currentDate = new Date().toISOString().split("T")[0];

        const isBirthday = userData.birth_date && userData.birth_date.getMonth() === new Date().getMonth() && userData.birth_date.getDate() === new Date().getDate();

        const inQuery =
            "SELECT user_name, A_type, date_column, time_column, attendance_mark FROM attendance WHERE user_email = ? AND A_type = 'in' AND date_column = ? ORDER BY time_column ASC LIMIT 1";

        const outQuery =
            "SELECT user_name, A_type, date_column, time_column FROM attendance WHERE user_email = ? AND A_type = 'out' AND date_column = ? ORDER BY time_column ASC LIMIT 1";

        con.query(inQuery, [userEmail, currentDate], (inErr, inResults) => {
            if (inErr) {
                console.error(
                    'Error querying the database for "A_type = in": ' + inErr.message
                );
                return res.status(500).send("Internal Server Error");
            }

            con.query(outQuery, [userEmail, currentDate], (outErr, outResults) => {
                if (outErr) {
                    console.error(
                        'Error querying the database for "A_type = out": ' + outErr.message
                    );
                    return res.status(500).send("Internal Server Error");
                }

                const firstInRecord =
                    inResults.length > 0 ? `${inResults[0].time_column}` : "00:00:00";
                const firstOutRecord =
                    outResults.length > 0 ? `${outResults[0].time_column}` : "00:00:00";

                // If it's the user's birthday, send the birthday email
                if (isBirthday) {
                    sendBirthdayEmail(userEmail, userData.user_name);
                }

                res.render("userdashboard", {
                    title: "scaleedge",
                    user_name: userData.user_name,
                    image_path: userData.Imagepath,
                    mobile: userData.mobile,
                    user_type: userData.user_type,
                    firstInRecord: firstInRecord,
                    firstOutRecord: firstOutRecord,
                    attendance_mark:
                        inResults.length > 0 ? inResults[0].attendance_mark : null,
                    isBirthday: isBirthday,
                });
            });
        });
    });
});



router.get("/userManualUpdate", checkUser, function (req, res, next) {

    const userEmail = req.session.email;

    con.query(

        "CALL GetAtteManual_271023(?)",

        [userEmail],

        function (error, results) {

            if (error) {

                console.error("Database query error:", error);

                return res

                    .status(500)

                    .json({ success: false, error: "Database error" });

            }

            res.render("userManualUpdate", { title: "scaleedge", rows: results[0] });

        }

    );

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

router.post("/fetchData2", function (req, res, next) {
    con.query("SELECT user_name FROM user_master", function (error, results) {
        if (error) {
            throw error;
        }
        const users = results;

        const selectedUser = req.body.selected_user_name;
        const selectedMonth = req.body.selected_month;

        con.query(
            "CALL CalculateDistance_17(?, ?)",
            [selectedUser, selectedMonth],
            (err, results, fields) => {
                if (err) {
                    console.error("Error executing the stored procedure:", err);
                    return next(err);
                }

                const dataFromProcedure = results[0]; // Data returned from the stored procedure
                const dataFromTable = results[1]; // Data from PermanentMeetingTable
                dataFromProcedure.forEach((row) => {
                    row.date_column = formatDate(row.date_column);
                });

                res.render("travel_distance_admin", { rows: dataFromProcedure, users, permanentTableData: dataFromTable, selectedUser, selectedMonth });
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
router.get("/travel_distance_admin1/:user_name/:date", checkUser, function (req, res, next) {
    const user_name = req.params.user_name;
    const date = req.params.date;

    // Ensure the date is in the correct format 'YYYY-MM-DD'
    const formattedDateString = formatDate(new Date(date));

    // Parse the formattedDateString to create a Date object
    const formattedDate = new Date(formattedDateString);

    // Check if the parsed date is valid
    if (isNaN(formattedDate.getTime())) {
        console.error('Invalid date format');
        res.status(400).send('Bad Request');
        return;
    }

    // Increment the date by one day
    formattedDate.setDate(formattedDate.getDate() + 1);

    // Call the stored procedure
    const query = `CALL CalculateDistance_1611('${user_name}', '${formattedDate.toISOString().slice(0, 10)}')`;

    con.query(query, (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
            return;
        }

        const rows = results[0]; // Assuming the result of the stored procedure is in the first element of the results array
        rows.forEach((row) => {
            row.date = formatDate(row.date_column);
        });
        res.render("travel_distance_admin1", { title: "scaleedge", user_name, date, rows });
    });
});

router.get("/travelDistance", checkUser, function (req, res, next) {
    const userEmail = req.session.email;

    con.query("SELECT user_name FROM user_master WHERE email = ?", [userEmail], function (error, results) {
        if (error) {
            throw error;
        }

        const users = results;

        res.render("travel_user_distance", { title: "scaleedge", users });
    });
});


router.post("/fetchData5", function (req, res, next) {
    const userEmail = req.session.email;

    con.query("SELECT user_name FROM user_master WHERE email = ?", [userEmail], function (error, results) {
        if (error) {
            throw error;
        }
        const users = results;

        const selectedUser = req.body.selected_user_name;
        const selectedMonth = req.body.selected_month;

        con.query(
            "CALL CalculateDistance_17(?, ?)",
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

                res.render("travel_user_distance", { rows: dataFromProcedure, users, permanentTableData: dataFromTable, selectedUser, selectedMonth });
            }
        );
    });
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
        console.error('Invalid date format');
        res.status(400).send('Bad Request');
        return;
    }

    // Increment the date by one day
    formattedDate.setDate(formattedDate.getDate() + 1);

    // Call the stored procedure
    const query = `CALL CalculateDistance_1611('${user_name}', '${formattedDate.toISOString().slice(0, 10)}')`;

    con.query(query, (error, results, fields) => {
        if (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
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
router.get("/resetpassword",function (req, res, next) {
    res.render("resetpassword", { title: "scaleedge" });
});

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
router.get("/password",function (req, res, next) {
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
        from: "sumit@scaleedge.in",
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

router.post("/importExcel", (req, res) => {
    try {
        const workbook = xlsx.read(req.files.excelFile.data, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        data.forEach((row) => {
            const {
                user_name,
                email,
                mobile,
                password,
                user_group,
                Imagepath,
                user_type,
                joining_date,
                annual_salary,
                latitude,
                longitude,
                km_rupees,
                personal_email,
                street_address,
                house,
                city,
                state,
                pincode,
                landmark,
                Adhar,
                Pancard

            } = row;
            const nameFirstTwoLetters = user_name.substring(0, 2).toUpperCase();
            const birthDateOnlyDate = joining_date ? joining_date.toISOString().split('T')[0] : '';
            const employeeId = `SCALEEDGE#${nameFirstTwoLetters}${birthDateOnlyDate}`;
            const sql = `INSERT INTO user_master (
          user_id,
          user_name,
          email,
          mobile,
          password,
          user_group,
          Imagepath,
          user_type,
          joining_date,
          annual_salary,
          latitude,
          longitude,
          km_rupees,
          company_id,
          deleted_b, 
          created_on, 
          personal_email,
          street_address,
          house,
          city,
          state,
          pincode,
          landmark,
          Adhar,
          Pancard, 
          employee_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, DATE_FORMAT(CURDATE(), '%Y-%m-%d'), ?, ?, ?, ?, ?, ?, CURDATE(),?, ?,?,?,?,?,?,?,?,?)`;

            con.query(
                sql,
                [
                    email,
                    user_name,
                    email,
                    mobile,
                    password,
                    user_group,
                    Imagepath,
                    user_type,
                    // joining_date,
                    annual_salary,
                    latitude,
                    longitude,
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
                    employeeId
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

            // Update tblattendance table with the approved_by value and leave_type
            con.query(
                "UPDATE tblattendance SET approve_b = ?, approved_by = ?, leave_type = '' WHERE id = ?",
                [action === "approve" ? "y" : "n", userId, leaveId],
                function (err, result) {
                    if (err) {
                        console.error(err);
                        return res.status(500).send("Internal Server Error");
                    }

                    // Send email to the user
                    const mailOptions = {
                        from: 'sumit@scaleedge.in',
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

//offerletter
router.get("/offerletter", checkUser, function (req, res, next) {
    res.render("offerletter", { title: "scaleedge" });
});

//terminationletter
router.get("/terminationletter", checkUser, function (req, res, next) {
    res.render("termination", { title: "scaleedge" });
});

router.get("/salaryView", checkUser, (req, res, next) => {
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

        const procedureQuery = "CALL new_generate_salary08122023(?, ?, ?)";

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


const randomstring = require('randomstring');
const otpMap = new Map();

// router.post('/send-otp', (req, res) => {
//     const email = req.body.email;

//     // Generate a random OTP
//     const otp = randomstring.generate({
//         length: 6,
//         charset: 'numeric'
//     });

//     // You should store this OTP on the server for verification
//     otpMap.set(email, otp);

//     // Send the OTP to the email
//     const transporter = nodemailer.createTransport({
//         con: true,
//         host: "az1-ts112.a2hosting.com",
//         port: 465,
//         secure: true,
//         auth: {
//             user: "sumit@scaleedge.in",
//             pass: "sumitQWE123!@",
//         },
//     });

//     const mailOptions = {
//         from: 'sumit@scaleedge.in',
//         to: email,
//         subject: 'Verification OTP',
//         text: `Your OTP is: ${otp}`,
//     };

//     transporter.sendMail(mailOptions, (error, info) => {
//         if (error) {
//             console.error('Error sending email:', error);
//             res.json({ success: false });
//         } else {
//             console.log('Email sent: ' + info.response);
//             res.json({ success: true });
//         }
//     });
// });


router.post('/send-otp', (req, res) => {
    const email = req.body.email;

    // Generate a random OTP
    const otp = randomstring.generate({
        length: 6,
        charset: 'numeric'
    });

    // You should store this OTP on the server for verification
    otpMap.set(email, otp);

    const transporter = nodemailer.createTransport({
        con: true,
        host: "az1-ts112.a2hosting.com",
        port: 465,
        secure: true,
        auth: {
            user: "sumit@scaleedge.in",
            pass: "sumitQWE123!@",
        },
    });

    const mailOptions = {
        from: 'sumit@scaleedge.in',
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
            res.json({ success: true, otp: otp });
        }
    });
});

// router.use(fileUpload());

router.post('/register', async (req, res) => {
    const email = req.body.email;
    const enteredOTP = req.body.otp;
    const storedOTP = otpMap.get(email);

    if (enteredOTP === storedOTP) {
        otpMap.delete(email);

        const name = req.body.name;
        const mobile = req.body.mobile;
        const annualSalary = req.body.annual_salary;
        const password = req.body.password;
        const personalEmail = req.body.personal_email;
        const joiningDate = req.body.joining_date;
        const birthDate = req.body.birth_date;
        const street = req.body.street_address;
        const city = req.body.city;
        const landmark = req.body.landmark;
        const pincode = req.body.pincode;
        const house = req.body.house;
        const state = req.body.state;
        const adhar = req.files.adhar;
        const pan = req.files.pan;
        const adharName = adhar.name;
        const panName = pan.name;
        const profileImage = req.files.Imagepath;
        const Imagename = profileImage.name;
        const confirmPassword = req.body.cpassword;


        const emailExists = await checkEmailExists(email);

        if (emailExists) {
            return res.status(400).json({ message: 'Email already exists. Please use a different email address.' });
        }

        const nameFirstTwoLetters = name.substring(0, 2).toUpperCase();
        const birthDateOnlyDate = birthDate.split('-')[2];
        const employeeId = `SCALEEDGE#${nameFirstTwoLetters}${birthDateOnlyDate}`;

        const insertQuery = `
        INSERT INTO user_master_data (user_id, user_name, user_group, email, mobile, password, created_on, annual_salary, personal_email, joining_date, birth_date, latitude, longitude, street_address, house, city, state, pincode, landmark, Imagepath, Adhar, Pancard, employee_id)
        VALUES (?,?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? , ?)
      `;

        const values = [email, name, 'user', email, mobile, password, annualSalary, personalEmail, joiningDate, birthDate, 27.5944, 76.6167, street, house, city, state, pincode, landmark, Imagename, adharName, panName, employeeId];

        con.query(insertQuery, values, (error, results) => {
            var Imagepath = "public/profile/" + profileImage.name;
            var adharpath = "public/document/" + adhar.name;
            var panpath = "public/document/" + pan.name;
            profileImage.mv(Imagepath, function (err) {
                if (err) {
                    console.error("Failed to save profile image:", err);
                } else {
                    console.log("Profile image saved successfully.");
                }
            })
            adhar.mv(adharpath, function (err) {
                if (err) {
                    console.error("Failed to save profile image:", err);
                } else {
                    console.log("Profile image saved successfully.");
                }
            })
            pan.mv(panpath, function (err) {
                if (err) {
                    console.error("Failed to save profile image:", err);
                } else {
                    console.log("Profile image saved successfully.");
                }
            })
            if (error) {
                console.error('Error inserting user details into the database:', error);
                return res.status(500).json({ message: 'Failed to register user. Please try again.' });
            } else {
                console.log('User details inserted into the database.');
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
        host: "az1-ts112.a2hosting.com",
        port: 465,
        secure: true,
        auth: {
            user: "sumit@scaleedge.in",
            pass: "sumitQWE123!@",
        },
    });

    const mailOptions = {
        from: 'sumit@scaleedge.in',
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
      SELECT email FROM user_master_data WHERE email = ?
    `;

        con.query(selectEmailSql, [email, email], (err, result) => {
            if (err) {
                reject(err);
            }

            resolve(result && result.length > 0);
        });
    });
}



router.get("/userProfile", function (req, res, next) {
    res.render("profile", { title: "scaleedge" });
});


router.get("/testing", checkUser, function (req, res, next) {
    let userGroup = req.session.user_group;
    let isAdmin = userGroup === "admin";
    res.render("testing", { title: "sumit", isAdmin: isAdmin });
  });

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

    const sql = "INSERT INTO loan_approval_table (username, loan_amount, tax_pay_month) VALUES (?, ?, ?)";
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

        const insertQuery = "INSERT INTO loan_table (username, loan_amount, tax_pay_month, interest_rate) SELECT username, loan_amount, tax_pay_month, ? FROM loan_approval_table WHERE id = ?";
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
    const query = "SELECT * from reimbursement_pending where status='Pending'";
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


module.exports = router;


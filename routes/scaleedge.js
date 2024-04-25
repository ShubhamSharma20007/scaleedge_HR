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
const ip = require('ip');
const excel = require('exceljs');

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
        req.flash('message' , "Your Session is expired please login again")

        res.redirect('/');
    }
}


const transporter = nodemailer.createTransport({

    host: "az1-ts112.a2hosting.com",

    port: 465,

    secure: true,

    auth: {

        user: "sumit@scaleedge.in",

        pass: "Sumit@4567",

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
    // Clear cache headers
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1
    res.setHeader('Pragma', 'no-cache'); // HTTP 1.0
    res.setHeader('Expires', '0'); // Proxies

    // Render the "login" template with the provided data
    res.render("login", {
        title: "Scaleedge",
        message: req.flash('message'),
        success: req.flash('success'),
        ogImage: "https://node.scaleedge.in/images/scaleedgeLogin.png",
        ogUrl: "https://node.scaleedge.in/",
        ogDescription: "An integrated HR system facilitating attendance tracking via facial recognition and seamless generation of salary payroll."
    });
});



router.post("/auth_login", async function (req, res, next) {
    try {
        var email = req.body.email;
        var password = req.body.password;
        email = email.toLowerCase();
        var sql = "CALL loginUserNewToday(?, ?);";
        const result = await new Promise((resolve, reject) => {
            con.query(sql, [email, password], function (err, result, fields) {
                if (err) reject(err);
                resolve(result);
            });
        });

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
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send({ success: false, message: "Internal Server Error" });
    }
});



// Registeration

router.get("/auth_reg", function (req, res, next) {

    res.render("register", { title: "scaleedge" });

});

router.get("/registerationRequests", isAdmin, checkUser, function (req, res, next) {
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

router.get("/registerationRequests1/:id", isAdmin, checkUser, function (req, res, next) {
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

router.post("/registerationRequests", isAdmin, function (req, res, next) {
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
        from: "sumit@scaleedge.in",
        to: userData.email,
        subject: "Your Application Was Approved",
        html: `<p>Hello ${userData.user_name},</p>
           <p>Your registration request has been approved. Here are your account details:</p>
           <p>Name: ${userData.user_name}</p>
           <p>Email: ${userData.email}</p>
           <p>Password: ${userData.password}</p>
           <p>Click the following link to access your account: <a href="https://martonline.scaleedge.in/">ScaleEdge Solution</a></p>`,
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
                <p>Click the following link to access your account: <a href="https://martonline.scaleedge.in/">ScaleEdge Solution</a></p>
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

// router.get("/dashboard",  checkUser, function (req, res, next) {
//     const user_group = req.session.user_group;
//     const user_email = req.session.email;

//     con.query(
//         "CALL GetDashboardData(?, ?)",
//         [user_group, user_email],
//         function (err, rows) {
//             if (err) {
//                 console.error(err);
//                 return res.status(500).send("Internal Server Error");
//             }

//             const result = rows[0];

//             if (user_group === "admin") {
//                 const totalPendingRequests = result.length;

//                 con.query(
//                     "SELECT COUNT(*) AS totalAttendanceRequests FROM manual WHERE status = 'pending'",
//                     function (err, manualRows) {
//                         if (err) {
//                             console.error(err);
//                             return res.status(500).send("Internal Server Error");
//                         }

//                         const totalAttendanceRequests =
//                             manualRows[0].totalAttendanceRequests;

//                         con.query(
//                             "SELECT COUNT(*) AS totalUsers FROM user_master_data",
//                             function (err, userCountRows) {
//                                 if (err) {
//                                     console.error(err);
//                                     return res.status(500).send("Internal Server Error");
//                                 }

//                                 const totalUsers = userCountRows[0].totalUsers;

//                                 res.render("dashboard", {
//                                     message: "Welcome, " + user_email,
//                                     rows: result,
//                                     totalPendingRequests: totalPendingRequests,
//                                     totalAttendanceRequests: totalAttendanceRequests,
//                                     totalUsers: totalUsers,
//                                 });
//                             }
//                         );
//                     }
//                 );
//             } else if (user_group === "user") {
//                 res.redirect("/userdashboard");
//             } else {
//                 res.redirect("/");
//             }
//         }
//     );
// });
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
        'CALL dashboardTrackerTotal1(?)',
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



//details

router.get("/details/:user_name", isAdmin, checkUser, function (req, res, next) {

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


router.get("/leaveTable", isAdmin, checkUser, function (req, res, next) {

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



router.get("/leaveTableuser", isUser, checkUser, function (req, res, next) {

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



router.get("/leaveApproval", isAdmin, checkUser, function (req, res, next) {

    let userGroup = req.session.user_group;

    let isAdmin = userGroup === "admin";

    res.render("leaveApproval", { title: "sumit", isAdmin: isAdmin });

});



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

router.get("/usermangment", isAdmin, checkUser, (req, res) => {

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

hbs.registerHelper('isStatusInactiveOrOnHold', function (status) {
    return status === 'inactive' || status === 'onhold';
});

//logout

router.get("/logout", function (req, res, next) {

    if (req.session.email) {

        req.session.destroy();

    }

    res.redirect("/");

});



//add user

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

router.get("/edit/:id", isAdmin, function (req, res, next) {
    var userId = req.params.id;
    var selectSql = "SELECT * FROM user_master WHERE id = ?";
    con.query(selectSql, [userId], function (err, result) {
        if (err) {
            throw err;
        }

        if (result.length > 0) {
            var formattedJoiningDate = new Date(result[0].joining_date)
                .toISOString()
                .split("T")[0];
            var annualSalary = parseFloat(result[0].annual_salary);

            // Manually set selected options based on user_type and status
            var userTypeOfficeSelected = result[0].user_type === "office" ? "selected" : "";
            var userTypeSalesSelected = result[0].user_type === "sales" ? "selected" : "";
            var statusActiveSelected = result[0].status === "active" ? "selected" : "";
            var statusInactiveSelected = result[0].status === "inactive" ? "selected" : "";
            var statusOnHoldSelected = result[0].status === "onhold" ? "selected" : "";

            res.render("edit", {
                title: "scaleedge",
                user: result[0],
                formattedJoiningDate: formattedJoiningDate,
                annualSalary: annualSalary,
                userTypeOfficeSelected: userTypeOfficeSelected,
                userTypeSalesSelected: userTypeSalesSelected,
                statusActiveSelected: statusActiveSelected,
                statusInactiveSelected: statusInactiveSelected,
                statusOnHoldSelected: statusOnHoldSelected
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
    var status = req.body.status;
    var updateSql =
        "CALL updateEmployee (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?, ?)";

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
                status
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
            "UPDATE user_master SET user_id= ?,  user_name = ?, email = ?, mobile = ?, user_group = ?, user_type = ?, joining_date = ?, annual_salary = ?, latitude = ?, longitude = ?, km_rupees = ?, personal_email=?, house=?, street_address=?, city=?, state=?, pincode=?, landmark=?, status=? WHERE id = ?",
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
                status,
                userId,
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

router.get("/delete/:id", isAdmin, checkUser, function (req, res, next) {

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
router.get("/distance", isAdmin, checkUser, function (req, res, next) {
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

// router.get("/report", checkUser, function (req, res, next) {
//     con.query(
//       "SELECT DISTINCT user_name FROM user_master",
//       function (error, users) {
//         if (error) {
//           console.log("Error fetching users:", error);
//           return res.status(500).send("Internal Server Error");
//         }

//         con.query("CALL demoHoursTracker()", function (error, rows) {
//           if (error) {
//             console.log("Error fetching attendance data:", error);
//             return res.status(500).send("Internal Server Error");
//           }

//           const combinedRows = [];
//           const currentDate = new Date();

//           // Iterate only for the current date
//           const dateString = currentDate.toISOString().split("T")[0];
//           users.forEach((user) => {
//             const existingRow = rows[0].find(
//               (row) =>
//                 row.date_column === dateString &&
//                 row.user_name === user.user_name
//             );

//             const isSunday = currentDate.getDay() === 1; // Sunday is typically day 0

//             combinedRows.push({
//               user_name: user.user_name,
//               date_column: dateString,
//               time_in: existingRow ? existingRow.time_in : "--",
//               time_out: existingRow ? existingRow.time_out : "--",
//               hours_worked: existingRow ? existingRow.hours_worked : "--",
//               range_status: existingRow ? existingRow.range_status : "--",
//               attendance_mark: isSunday
//                 ? "Sunday"
//                 : existingRow
//                 ? existingRow.attendance_mark
//                 : "Absent",
//             });
//           });

//           // Sort the combinedRows array based on date_column
//           combinedRows.sort((a, b) => (a.date_column < b.date_column ? -1 : 1));

//           res.render("report", {
//             title: "payRoll",
//             rows: combinedRows,
//             users: users,
//           });
//         });
//       }
//     );
//   });

router.get("/report", isAdmin, checkUser, function (req, res, next) {
    con.query(
        "SELECT DISTINCT user_name FROM user_master WHERE status = 'active'",
        function (error, users) {
            if (error) {
                console.log("Error fetching users:", error);
                return res.status(500).send("Internal Server Error");
            }

            const currentDate = new Date();
            const dateString = currentDate.toISOString().split("T")[0];

            con.query("CALL report_hours(?)", [dateString], function (error, rows) {
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

                    const isSunday = currentDate.getDay() === 1; // Sunday is typically day 0

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
                        1
                    );

                    let lastDateOfMonth = new Date(
                        selectedYear,
                        selectedMonth,
                        0
                    );
                    lastDateOfMonth.setDate(lastDateOfMonth.getDate() - 1);

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

                            const isSunday = date.getDay() === 1; // Sunday is typically day 0

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

router.get("/attendanceAUD", isAdmin, checkUser, function (req, res, next) {

    con.query("CALL GetDistinctUserNamesNew()", function (error, userResults) {

        if (error) throw error;



        con.query("CALL GetAttendanceDataNew()", function (error, results) {

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

router.get("/holiday", isAdmin, checkUser, function (req, res, next) {
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



router.get("/salaryTracker", isAdmin, checkUser, (req, res, next) => {

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



router.get("/user_report", isUser, checkUser, function (req, res, next) {

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



// const path = require('path');

// router.post("/generateusersjson/:userid", function (req, res, next) {
//     const usersjson = req.body.usersjson;
//     const userId = req.params.userid;
//     const customDirectory = "/home/scaleedg/martonline.scaleedge.in/public";

//     if (!fs.existsSync(customDirectory)) {
//         fs.mkdirSync(customDirectory, { recursive: true });
//     }

//     const filePath = path.join(customDirectory, `${userId}.json`);

//     fs.writeFile(filePath, usersjson, "utf8", function (err) {
//         if (err) {
//             console.error(err);
//             res.status(500).json("Error writing the file.");
//         } else {
//             console.log("File saved:", filePath);
//             res.json("File saved successfully.");
//         }
//     });
// });

router.post("/generateusersjson", function (req, res, next) {

    var fs = require("fs");

    let usersjson = req.body.usersjson;

    let userfilename = req.body.userfilename;



    //fs.writeFile ("users.json", usersjson, function(err) {

    fs.writeFile(

        "/home/scaleedg/martonline.scaleedge.in/public/" + userfilename,

        usersjson,

        "utf8",

        function (err) {

            if (err) throw err;

            console.log("complete");

            res.json("ok");

        }

    );

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
  
        res.json({ success: true, message: "Attendance data inserted successfully." });
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
        userLon,
    } = req.body;
    const attendanceMark = (req.body.attendanceMark || "").trim();
    const rangeStatus = (req.body.rangeStatus || "").trim();

    const updateQuery = "UPDATE manual SET status = 'approve', approved_by = ?, approve_datetime = NOW(), approve_ip = ? WHERE id = ?";
    const approveIp = req.ip === '::1' ? ip.address() : req.ip;

    con.query(updateQuery, [req.session.email, approveIp, id], function (updateError, updateResults) {
        if (updateError) {
            console.error("Database query error:", updateError);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        const query = `
        INSERT INTO attendance (user_id, user_name, user_email, date_column, time_column, A_type, user_lat, user_lon, attendance_mark, range_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

        // Add req.session.email to the values array
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
            rangeStatus,
        ];

        con.query(query, values, function (error, results) {
            if (error) {
                console.error("Database query error:", error);
                return res
                    .status(500)
                    .json({ success: false, error: "Database error" });
            }

            res.json({
                success: true,
                message:
                    "Attendance has been approved and data inserted into the attendance table",
            });
        });
    });
});



// reject attendance post router
router.post("/rejectAttendance", function (req, res, next) {
    const { id } = req.body;

    const updateQuery = "UPDATE manual SET status = 'reject', approved_by = ?, approve_datetime = NOW(), approve_ip = ? WHERE id = ?";
    const rejectIp = req.ip === '::1' ? ip.address() : req.ip;
    con.query(updateQuery, [req.session.email, rejectIp, id], function (updateError, updateResults) {
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
            pass: 'Sumit@4567',
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

hbs.registerHelper('formatDateToMySQLDate', function (date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const query = `CALL CalculateDistanceForAdmin('${user_name}', '${formattedDate.toISOString().slice(0, 10)}')`;

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
router.get("/resetpassword", function (req, res, next) {
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
        from: "sumit@scaleedge.in",
        to: userData.email,
        subject: "Your Password Has Been Updated",
        html: `<p>Hello ${userData.email},</p>
           <p>Your password has been updated successfully. Here are your account details:</p>
           <p>Email: ${userData.email}</p>
           <p>Password: ${userData.password}</p>
           <p>Click the following link to access your account: <a href="https://martonline.scaleedge.in/">ScaleEdge Solution</a></p>`,
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
            'Pan Card'
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
                'Pan Card': Pancard
            } = row;

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
          branch
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

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
                    branch
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
    const userGroup = req.session.user_group;
    res.render("offerletter", { title: "scaleedge", userGroup });
});

hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

router.get("/appointmentLetter", checkUser, function (req, res, next) {
    const userGroup = req.session.user_group;
    res.render("appointment", { title: "scaleedge", userGroup });
});

router.get("/terminationletter", checkUser, function (req, res, next) {
    const userGroup = req.session.user_group;
    res.render("termination", { title: "scaleedge", userGroup });
});

router.get("/confirmationLetter", checkUser, function (req, res, next) {
    const userGroup = req.session.user_group;
    res.render("confirmationLetter", { title: "scaleedge", userGroup });
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
//             pass: "Sumit@4567",
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
            pass: "Sumit@4567",
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
        host: "az1-ts112.a2hosting.com",
        port: 465,
        secure: true,
        auth: {
            user: "sumit@scaleedge.in",
            pass: "Sumit@4567",
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
      <p>Click the following link to access your account: <a href="https://martonline.scaleedge.in/">ScaleEdge Solution</a></p>
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

router.get("/payRoll", isAdmin, function (req, res, next) {

    con.query('SELECT employee_id, user_name, status FROM user_master', function (error, results, fields) {
        if (error) throw error;
        res.render("payRoll", { title: "scaleedge", employees: results });
    });
});

router.get("/pay_roll", isAdmin, function (req, res, next) {
    res.render("pay_roll", { title: "scaleedge" });
});

// router.get("/downloadArrears", function (req, res, next) {
//     con.query('SELECT employee_id, user_name, status FROM user_master', function (error, results, fields) {
//         if (error) throw error;

//         // Create a new Excel workbook and worksheet
//         const workbook = new excel.Workbook();
//         const worksheet = workbook.addWorksheet('Arrears');

//         // Add column headers
//         worksheet.addRow(['EmployeeID', 'UserName', 'ArrearsAmount', 'Incentives']);

//         // Add data to the worksheet
//         results.forEach(result => {
//             worksheet.addRow([result.employee_id, result.user_name, result.arrears_amount, result.Incentives]);
//         });

//         worksheet.columns.forEach(column => {
//             column.width = 25; // Set the width to 25 units (adjust as needed)
//         });

//         // Set up the response headers for Excel download
//         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//         res.setHeader('Content-Disposition', 'attachment; filename=arrears.xlsx');

//         // Send the workbook as the response
//         workbook.xlsx.write(res)
//             .then(function () {
//                 res.end();
//             })
//             .catch(function (error) {
//                 throw error;
//             });
//     });
// });

// router.post('/upload-arrears', function (req, res) {
//     if (!req.files || Object.keys(req.files).length === 0) {
//         return res.status(400).send('No files were uploaded.');
//     }

//     const file = req.files.file;

//     // Process the Excel file
//     const workbook = xlsx.read(file.data, { type: 'buffer' });
//     const sheet = workbook.Sheets[workbook.SheetNames[0]];
//     const data = xlsx.utils.sheet_to_json(sheet);

//     // Assuming your Excel file has columns: 'employee_id', 'employee_name', 'arrears_amount'
//     const arrearsData = data.map(row => [row.EmployeeID, row.UserName, row.ArrearsAmount, row.Incentives]);

//     // Truncate existing data in the arrears table
//     con.query('TRUNCATE TABLE arrears', function (truncateError) {
//         if (truncateError) {
//             return res.status(500).json({ error: 'Error truncating table' });
//         }

//         // Insert new data into the arrears table
//         const insertQuery = `
//         INSERT INTO arrears (employee_id, employee_name, arrears_amount, Incentives)
//         VALUES ?
//       `;

//         con.query(insertQuery, [arrearsData], function (insertError, results) {
//             if (insertError) {
//                 return res.status(500).json({ error: 'Error inserting data into arrears table' });
//             }

//             res.redirect('/payRoll'); // Redirect to your desired route after successful upload
//         });
//     });
// });


router.get("/downloadArrears", function (req, res, next) {
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

router.post('/upload-arrears', function (req, res) {
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


router.post('/uploadPayroll', function (req, res) {
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



router.post('/upload-variable-pays', function (req, res, next) {
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
        con.query("CALL new_payroll_2024_02(?, ?)", [selectedYear, selectedMonth], function (err, payrollResults, fields) {
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

router.post("/generateSalary", function (req, res) {
    const inputYear = req.body.selectedYear;
    const inputMonth = req.body.selectedMonth;

    con.query("CALL new_payroll_2024_02_19(?, ?)", [inputYear, inputMonth], function (err, results, fields) {
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

router.get("/payRollForUser", isUser, function (req, res, next) {
    res.render("payRollForUser", { title: "scaleedge" });
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
        const [incentivesYear, incentivesMonth] = req.body.incentivesMonthYear.split('-');

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
        incentivesMonth = VALUES(incentivesMonth),
        incentivesYear = VALUES(incentivesYear),
        status="pending"
    `;

        con.query(query, [employee_id, employee_name, amount, date, month, year, dateOfApply, remarks, Incentives, filename, incentivesMonth, incentivesYear], function (error, results, fields) {
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

router.get("/accessdenied", function (req, res, next) {
    res.render("accessDenied", { title: "scaleedge", message: req.flash('message') });
});

// router.get("/error", function (req, res, next) {
//     res.render("error", { title: "scaleedge", message: req.flash('message') });
// });

// router.get("*", function (req, res, next) {
//     res.redirect('/error');
// });

module.exports = router;


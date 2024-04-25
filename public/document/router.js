const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.get("/register/:aname", (req, res) => {
  const aname = req.params.aname;
  res.status(201).json({ status: 201, message: aname });
});

router.post("/register", async (req, res) => {
  //const { email, name, product, contact, message } = req.body;
  try {
    // const transporter = nodemailer.createTransport({
    //   service: "mail",
    //   auth: {
    //     user: process.env.MAIL,
    //     pass: process.env.PASSWORD,
    //   },
    // });
    // var cname=req.body.aname;
    // var cemail=req.body.email;
    // var cproduct=req.body.product;
    // var ccontact=req.body.contact;
    // var cmessage=req.body.message;
    const {
      aname,
      email,
      product,
      contact,
      message
    } = req.body;
    const transporter = nodemailer.createTransport({
      host: 'az1-ts112.a2hosting.com',
      port: 465,
      secure: true,
      auth: {
        user: "sumit@scaleedge.in",
        pass: "sumitQWE123!@"
      }
    });

    const mailOptions = {
      from: "sumit@scaleedge.in",
      //to: 'anupriya@scaleedge.in',
      to: 'sumit.debnath@gmail.com',
      subject: "Contact Form Submission",
      //html: '<p><strong>Name:</strong> ' + cname + '</p><p><strong>Email:</strong> ' + cemail + '</p><p><strong>Product:</strong> ' +  cproduct + '</p><p><strong>Contact:</strong> ' + ccontact + ' </p><p><strong>Message:</strong> ' + cmessage + '</p>',
      html: `<p><strong>Name:</strong> ${aname}</p><p><strong>Email:</strong> ${email}</p><p><strong>Product:</strong> ${product}</p><p><strong>Contact:</strong> ${contact}</p><p><strong>Message:</strong> ${message}</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ status: 500, error: "Failed to send email" });
      } else {
        console.log("Email sent successfully", info.response);
        res.status(201).json({ status: 201, message: "Email sent successfully" });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 500, error: "Failed to send email" });
  }
});

module.exports = router;

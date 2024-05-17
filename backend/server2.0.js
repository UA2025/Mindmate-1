const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const mongoose = require('./mongo');
const User = require('../backend/models/model');
const ArticleSchema = require('../backend/models/article_schema');
const Rating = require('../backend/models/rating_schema');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: true, credentials: true }));

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send email with an image attachment
const sendEmail = async (to, subject, text, imagePath) => {
    const mailOptions = {
        from: process.env.EMAIL_USER, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        attachments: [
            {
                filename: 'image.jpg',
                path: imagePath,
                cid: 'unique@image.cid' // same cid value as in the html img src
            }
        ],
        html: `<p>${text}</p><img src="cid:unique@image.cid"/>`
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Example usage
sendEmail('recipient@example.com', 'Subject', 'Email body text', 'path/to/image.jpg');

app.post('/ratings', async (req, res) => {
    try {
        const { userId, ratings } = req.body;
        const newRating = new Rating({ userId, ratings });
        const savedRating = await newRating.save();
        res.status(201).json(savedRating);
    } catch (error) {
        console.error('Error saving rating:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/getarticles', (req, res) => {
    ArticleSchema.find()
        .then(ArticleSchema => res.json(ArticleSchema))
        .catch(err => res.json(err));
});

app.get('/getUsername', async (req, res) => {
    const email = req.query.email;
    try {
      const user = await User.findOne({ email: email });
      if (user) {
        res.json({ username: user.username });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  app.post("/sig", async (req, res) => {
      try {
          const { username, email, password, action } = req.body;
  
          if (action === "signup") {
              const existingUser = await User.findOne({ $or: [{ username: username }, { email: email }] });
  
              if (existingUser) {
                  return res.json("exist");
              } else {
                  const newUser = new User({
                      username: username,
                      email: email,
                      password: password
                  });
  
                  await newUser.save();
                  return res.json("success");
              }
          } else if (action === "login") {
              try {
                  const user = await User.findOne({ $or: [{ username: username }, { email: email }] });
          console.log("uzerrr:",user)
                  if (user) {
                      console.log("uzerpass:",password,user.password)
                      console.log("HEYYYY",user._id)
                     if(password===user.password){
                
                      console.log("yayyy")
  
                      return res.json({status : "success", userId: user._id });
                     }
                     else {
                          console.log("whyyy")
                       return res.json("invalid");
                      }
                  } else {
                      // User not found, return user not exist error
                      return res.json("notexist");
                  }
              } catch (error) {
                  // Catch any errors that occur during the database query
                  console.error("Login error:", error);
                  return res.status(500).json("fail");
              }
          }
          
          else if (action === "forgotpassword") {
              try {
                  const user = await User.findOne({ email });
  
                  if (!user) {
                      // User not found
                      return res.json("notexist");
                  }
  
                  // // Check if the provided password matches the confirm password
                  // if (password !== confirmPassword) {
                  //     return res.json("passwordsNotMatch");
                  // }
  
                  // Update the user's password in the database
                  user.password = password;
                  await user.save();
  
                  // Optionally, you can notify the user that their password has been successfully reset
                  return res.json("success");
              } catch (error) {
                  console.error(error);
                  return res.json("fail");
              }
          }
      } catch (error) {
          console.error(error);
          return res.status(500).json("fail");
      }
  }
  );

app.listen(8000, () => {
    console.log("Server listening on port 8000");
});

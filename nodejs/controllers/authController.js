const express = require('express');

const User = require('../models/userModel');
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt = require('bcryptjs');
const config = require('../config'); // get config file
const mongodb = require('../mongodb');
const shortid = require('shortid');
const nodemailer = require('nodemailer');


// exports.loginadmin = async (req, res, next) => {
//     try {
//         User.findOne({ email: req.body.email }, function (err, user) {
//             if (err) return res.status(500).send('Error on the server.');
//             if (!user) return res.status(404).send('No user found.');
            
//             // check if the password is valid
//             var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
//             if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
        
//             // if user is found and password is valid
//             // create a token
//             var token = jwt.sign({ id: user._id }, config.secret, {
//               expiresIn: 86400 // expires in 24 hours
//             });

//             res.status(200).json({
//                 status: true,
//                 message : 'Authentication Check',
//                 data: {
//                     auth: true, token: token
//                 }
//             });
//         });
    
//     } catch (err) {
//         next(err);
//     }
// };

// exports.logoutadmin = async (req, res, next) => {
//     try {
    
//         res.status(200).json({
//             status: true,
//             message : 'Logout',
//             data: {
//                 auth: false, token: null
//             }
//         });
    
//     } catch (err) {
//         next(err);
//     }
// };

// exports.registeradmin = async (req, res, next) => {
//     try {
    
//         var hashedPassword = bcrypt.hashSync(req.body.password, 8);

//         User.create({
//             name : req.body.name,
//             email : req.body.email,
//             password : hashedPassword
//         }, 
//         function (err, user) {
//             if (err) return res.status(500).send("There was a problem adding the information to the database.");
//             res.status(200).send(user);
//         });
        
//     } catch (err) {
//         next(err);
//     }
// };




exports.signup = async (req, res, next) => {
    try {

        let {username, fullname, email, password, gender} = req.body; // this is called destructuring. We're extracting these variables and their values from 'req.body'
        let userData = {
            username,
            password: bcrypt.hashSync(password, 5), // we are using bcrypt to hash our password before saving it to the database
            fullname,
            email,
            gender
        };
        
        let newUser = new User(userData);
        newUser.save().then(error => {
            if (!error) {
                console.log('1')
                return res.status(201).json('signup successful')
            } 
            else{
                return res.status(400).send(error)
            }
            // else {
            //     if (err.code && err.code === 11000) { // this error gets thrown only if similar user record already exist.
            //         console.log('2')

            //         return res.status(409).send('user already exist!')
            //     } else {
            //         console.log(JSON.stringigy(error, null, 2)); // you might want to do this to examine and trace where the problem is emanating from
            //         console.log('3')

            //         return res.status(500).send('error signing up user')
            //     }
            // }
            
        })
        
    } catch (err) {
        next(err);
    }
};


exports.login = async (req, res, next) => {
    try {
    
        let {username, password} = req.body;
        User.findOne({username: username}, 'username email password', (err, userData) => {
    	if (!err) {
        	let passwordCheck = bcrypt.compareSync(password, userData.password);
        	if (passwordCheck) { // we are using bcrypt to check the password hash from db against the supplied password by user
                req.session.user = {
                  email: userData.email,
                  username: userData.username,
                  id: userData._id
                }; // saving some user's data into user's session
                req.session.user.expires = new Date(
                  Date.now() + 3 * 24 * 3600 * 1000 // session expires in 3 days
                );
                res.status(200).send('You are logged in, Welcome!');
            } else {
            	res.status(401).send('incorrect password');
            }
        } else {
        	res.status(401).send('invalid login credentials')
        }
    })
        
    } catch (err) {
        next(err);
    }
};


// Password Reset
exports.forgot = async (req, res, next) => {
    try {
    
        let {email} = req.body; // same as let email = req.body.email
        User.findOne({email: email}, (err, userData) => {
          if (!err) {
            userData.passResetKey = shortid.generate();
            userData.passKeyExpires = new Date().getTime() + 20 * 60 * 1000 // pass reset key only valid for 20 minutes
            userData.save().then(result => {
                if (result) {
                  // configuring smtp transport machanism for password reset email
                  let transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                      user: 'lifeblockg1@gmail.com', // generated ethereal user
                      pass: 'jetsorock' // generated ethereal password
                    }
                  });
                  let mailOptions = {
                    subject: `SaasBase | Password reset`,
                    from: '"Fred Foo 👻" <lifeblockg1@gmail.com>', // sender address
                    to: email, // list of receivers
                    html: `
                      <h1>Hi,</h1>
                      <h2>Here is your password reset key</h2>
                      <h2><code contenteditable="false" style="font-weight:200;font-size:1.5rem;padding:5px 10px; background: #EEEEEE; border:0">${userData.passResetKey}</code></h4>
                      <p>Please ignore if you didn't try to reset your password on our platform</p>`
                  };
                  try {
                    transporter.sendMail(mailOptions, (error, response) => {
                      if (error) {
                        // console.log("error:\n", error, "\n");
                        res.status(500).send("could not send reset code");
                      } else {
                        // console.log("email sent:\n", response);
                        res.status(200).send("Reset Code sent");
                      }
                    });
                  } catch (error) {
                    res.status(500).send("could not sent reset code");
                  }
                }
              })
          } else {
            res.status(400).send('email is incorrect');
          }
        })
        
    } catch (err) {
        next(err);
    }
};


exports.resetpass = async (req, res, next) => {
    try {
    
        let {resetKey, newPassword} = req.body
        User.find({passResetKey: resetKey}, (err, userData) => {
            if (!err) {
                let now = new Date().getTime();
                let keyExpiration = userData.passKeyExpires;
                console.log(keyExpiration, now)
                if (keyExpiration > now) {
                    userData.password = bcrypt.hashSync(newPassword, 5);
                    userData.passResetKey = null; // remove passResetKey from user's records
                    userData.keyExpiration = null;
                    userData.save().then(err => { // save the new changes
                        if (!err) {
                            res.status(200).send('Password reset successful')
                        } else {
                            res.status(500).send('error resetting your password')
                        }
                    })
                } else {
                    res.status(400).send('Sorry, pass key has expired. Please initiate the request for a new one');
                }
            } else {
                res.status(400).send('invalid pass key!');
            }
        })
        
    } catch (err) {
        next(err);
    }
};

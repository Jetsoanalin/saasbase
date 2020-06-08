const express = require('express');

const User = require('../models/userModel');
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt = require('bcryptjs');
const config = require('../config'); // get config file
const mongodb = require('../mongodb');
const shortid = require('shortid');
const nodemailer = require('nodemailer');


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
        newUser.save().then((response) => {
            if (response) {
                res.status(200).json({
                  status: true,
                  message : 'Signup Successful! Please Login!',
                }) 
                return res.status(201).json('Signup Successful')
            } 
        }).catch(error => {
          if (error.code && error.code === 11000) { // this error gets thrown only if similar user record already exist.
            res.status(409).json({
              status: false,
              message : 'User with Email ID already exist!',
            })      
            } else {
                // console.log(JSON.stringigy(error, null, 2)); // you might want to do this to examine and trace where the problem is emanating from
                res.status(500).json({
                  status: false,
                  message : 'Error Signing up User, Please Try again Later',
                  data : {
                    error: JSON.stringigy(error, null, 2)
                  }
                })
              }        
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
                res.status(200).json({
                  status: true,
                  message : 'You are logged in, Welcome!',
                })
            } else {
                res.status(401).json({
                  status: false,
                  message : 'incorrect password',
                })
            }
        } else {
          res.status(401).json({
            status: false,
            message : 'invalid login credentials',
          });
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
                      user: 'your gmail address', // generated ethereal user (allow less secure apps in gmail)
                      pass: 'your gmail password' // generated ethereal password
                    }
                  });
                  let mailOptions = {
                    subject: `SaasBase | Password reset`,
                    from: '"Jetso Dev 👻" <lifeblockg1@gmail.com>', // sender address
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
                        res.status(500).json({
                          status: false,
                          message : 'Could not send reset code',
                        });
                      } else {
                        // console.log("email sent:\n", response);
                          res.status(200).json({
                            status: true,
                            message : 'Reset Code sent',
                          });
                      }
                    });
                  } catch (error) {
                      res.status(500).json({
                        status: false,
                        message : 'Could not sent reset code, Please try again Later',
                      });
                  }
                }
              })
          } else {
              res.status(400).json({
                status: false,
                message : 'Email is incorrect',
              });
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
          if(userData != '')
          {
            if (!err) {
              
                let now = new Date().getTime();
                let keyExpiration = userData[0].passKeyExpires;
                if (keyExpiration > now) {
                    userData[0].password = bcrypt.hashSync(newPassword, 5);
                    userData[0].passResetKey = null; // remove passResetKey from user's records
                    userData[0].keyExpiration = null;
                    userData[0].save().then(result => { // save the new changes
                        if (result) {
                          res.status(200).json({
                            status: true,
                            message : 'Password reset successful !',
                          });
                        } else {
                            res.status(500).json({
                              status: false,
                              message : 'Error resetting your password, Please Try again Later !',
                            });
                        }
                    })
                } else {
                    res.status(400).json({
                      status: false,
                      message : 'Sorry, pass key has expired. Please initiate the request for a new one',
                    });
                }
            } else {
                res.status(400).json({
                  status: false,
                  message : 'invalid Reset pass key!',
                });
          
            }
          }else{
            res.status(400).json({
              status: false,
              message : 'Reset Key is not generated for your emailID!, Please click on Reset Password',
            });
          }
        })
        
    } catch (err) {
        next(err);
    }
};

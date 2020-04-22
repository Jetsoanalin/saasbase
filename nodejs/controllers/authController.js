const express = require('express');

const User = require('../models/userModel');
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt = require('bcryptjs');
const config = require('../config'); // get config file


exports.loginadmin = async (req, res, next) => {
    try {
        User.findOne({ email: req.body.email }, function (err, user) {
            if (err) return res.status(500).send('Error on the server.');
            if (!user) return res.status(404).send('No user found.');
            
            // check if the password is valid
            var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
            if (!passwordIsValid) return res.status(401).send({ auth: false, token: null });
        
            // if user is found and password is valid
            // create a token
            var token = jwt.sign({ id: user._id }, config.secret, {
              expiresIn: 86400 // expires in 24 hours
            });

            res.status(200).json({
                status: true,
                message : 'Authentication Check',
                data: {
                    auth: true, token: token
                }
            });
        });
    
    } catch (err) {
        next(err);
    }
};

exports.logoutadmin = async (req, res, next) => {
    try {
    
        res.status(200).json({
            status: true,
            message : 'Logout',
            data: {
                auth: false, token: null
            }
        });
    
    } catch (err) {
        next(err);
    }
};

exports.registeradmin = async (req, res, next) => {
    try {
    
        var hashedPassword = bcrypt.hashSync(req.body.password, 8);

        User.create({
            name : req.body.name,
            email : req.body.email,
            password : req.body.password
        }, 
        function (err, user) {
            if (err) return res.status(500).send("There was a problem adding the information to the database.");
            res.status(200).send(user);
        });
        
    } catch (err) {
        next(err);
    }
};

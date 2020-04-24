const mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/saasbase';

const Db = require('mongodb').Db;
const Server = require('mongodb').Server;
var db = new Db('saasbase', new Server('localhost', 27017));
//connect to database

MongoClient.connect(url, {useUnifiedTopology: true, useNewUrlParser: true}, function(err, db) {
    if (err) 
    {
        console.log("Couldn't connect to Mongo Database");
    } 
    else {
        console.log(`Connected To Mongo Database`);
    }
}); 

mongoose.connect(url, {useUnifiedTopology: true, useNewUrlParser: true,  
                        useCreateIndex: true, useNewUrlParser: true});

mongoose.connection.on('error', function(error){
  throw new Error(error);
});
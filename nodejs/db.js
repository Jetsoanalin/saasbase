const mysql = require('mysql');

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root"
});

const dbname = "cryptwallet";

con.connect(function(err) {
  if (err) {
    console.log(err);
    console.log("Database Not Connected");
  }
  else{
    console.log("Database Connected!");
    con.query("CREATE DATABASE IF NOT EXISTS "+dbname, function (err, result) {
      if (err) {
        console.log(err);
        console.log("Database with name "+dbname+" Already Exists");
      }
      else{
        console.log("Database "+dbname+" is Active");  
      }
    });  
  }
  
});
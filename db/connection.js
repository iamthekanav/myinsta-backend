//to connect app.js to cloud database
const mysql      = require('mysql');
const connection = mysql.createConnection({
  host     : 'b2klnatxjsxaytgztsnz-mysql.services.clever-cloud.com',
  user     : 'ugact8lrqhfjzxxl',
  password : 'IDB7ScC2mLD3gr0G2a85',
  database : 'b2klnatxjsxaytgztsnz'
});
 
connection.connect();

console.log("Connection Successfull");
 
connection.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});

module.exports=connection;

var mysql = require('mysql');
exports.dotenv = require('dotenv').config();
var config = {
  connectionLimit: 10,
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  timezone: 'IST',
  multipleStatements: true,
  charset: 'UTF8_GENERAL_CI',
  port: process.env.MYSQL_PORT
}

var pool = mysql.createPool(config);


pool.on('connection', function (connection) {
  console.log('DB Connection established');

  connection.on('error', function (error) {
    console.error(new Date(), 'MySQL error', error.code);
  });
  connection.on('close', function (error) {
    console.error(new Date(), 'MySQL close', error);
  });

});

module.exports = pool;
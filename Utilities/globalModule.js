const logger = require("./logger");
const firebase = require('./firebase');
var applicationkey = process.env.APPLICATION_KEY

var mysql = require('mysql');
exports.dotenv = require('dotenv').config();
var config = {

    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: 'IST',
    multipleStatements: true,
    charset: 'UTF8_GENERAL_CI',
    dateStrings: true,
    timeout: 20000,
    port: process.env.MYSQL_PORT

}
exports.executeQuery = (query, supportKey, callback) => {
    var connection = mysql.createConnection(config);
    try {
        connection.connect();
        console.log(query);
        connection.query(query, callback);
    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        connection.end();
    } finally {
        connection.end();
    }
}

exports.executeQueryData = (query, data, supportKey, callback) => {
    var connection = mysql.createConnection(config);
    try {
        connection.connect();
        console.log(query, data);
        connection.query(query, data, callback);
    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        connection.end();
    } finally {
        connection.end();
    }
}

exports.diff_hours = (dt2, dt1) => {

    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60);
    return Math.abs(diff);

}

exports.getFormmattedDate = function (inDate) {
    let date_ob = new Date(inDate);
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    date_cur = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

    return date_cur;
}

exports.diff_minutes = (dt2, dt1) => {
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(diff);

}

exports.diff_seconds = (dt2, dt1) => {

    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    return Math.abs(diff);

}

exports.sendRequest = (methodType, method, body, callback) => {
    try {

        var request = require('request');
        var options = {
            url: process.env.GM_API + method,
            headers: {
                "apikey": process.env.GM_API_KEY,
                "supportkey": process.env.SUPPORT_KEY,
            },
            body: body,
            method: methodType,
            json: true
        }

        request(options, (error, response, body) => {
            if (error) {
                console.log("request error -send email ", error);
                callback(error);
            } else {
                console.log(body);
                callback(null, body);
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.executeQueryAsync = (query, supportKey) => {
    var connection = mysql.createConnection(config);
    try {
        return new Promise((resolve, reject) => {
            connection.connect();
            console.log(query);
            connection.query(query, (error, res) => {
                if (error) {
                    resolve({ error: error })
                }

                console.log("res");
                resolve(res)
            });
            logger.database(query, applicationkey, supportKey);
        });
    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        return { error: error };
    } finally {
        connection.end()
    }
}

exports.executeQueryTransaction = async (query, connection) => {

    try {

        return new Promise((resolve, reject) => {
            console.log(query);
            connection.query(query, (error, results) => {
                if (error) {
                    console.log(error);
                    this.rolbackConnection(connection);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        this.rolbackConnection(connection);
    } finally {
    }
}

exports.executeQueryDataTransaction = (query, data, connection) => {
    try {
        return new Promise((resolve, reject) => {
            console.log(query, data);
            connection.query(query, data, (error, results) => {
                if (error) {
                    console.log(error);
                    this.rolbackConnection(connection);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        this.rolbackConnection(connection);
    } finally {
    }
}

exports.getSystemDate = function (date) {
    let date_ob = date ? new Date(date) : new Date();
    let day = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    date_cur = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    return date_cur;
}

exports.getTimeDate = function () {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    date_cur = year + month + date + hours + minutes + seconds;
    return date_cur;
}

exports.intermediateDates = function (startDate, endDate) {
    var startDatea = new Date(startDate);
    var endDatea = new Date(endDate);
    var getDateArray = function (start, end) {
        var arr = new Array();
        var dt = new Date(start);
        while (dt <= end) {

            var tempDate = new Date(dt);
            let date = ("0" + tempDate.getDate()).slice(-2);
            let month = ("0" + (tempDate.getMonth() + 1)).slice(-2);
            let year = tempDate.getFullYear();

            arr.push(year + "-" + month + "-" + date);
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    }

    var dateArr = getDateArray(startDatea, endDatea);
    return dateArr;
}

exports.generateKey = function (size) {

    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = size; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    console.log('length = ', result.length);
    return result;

}

exports.sanitizeDataJson = (json) => {
    try {
        console.log("before jsondata", json)
        json.replace(/\\/g, '')
        console.log("jsondata", json)

        json = JSON.parse(json);

        return json;

    } catch (error) {
        console.log(error);
    }
}

exports.sendEmail = (to, subject, body, callback) => {
    console.log("to  ", to)
    console.log("body ", body)
    console.log("Mail subject ", subject)
    var request = require('request');

    console.log("email key ", process.env.EMAIL_SERVER_KEY)

    var options = {
        url: process.env.GM_API + 'sendEmail',
        headers: {
            "apikey": process.env.GM_API_KEY,
            "supportkey": process.env.SUPPORT_KEY,
            "applicationkey": process.env.APPLICATION_KEY
        },
        body: {
            KEY: process.env.EMAIL_SERVER_KEY,
            TO: to,
            SUBJECT: subject,
            BODY: body
        },
        json: true
    }

    request.post(options, (error, response, body) => {
        if (error) {
            console.log("request error -send email ", error);
            callback("EMAIL SEND ERROR.");
        } else {
            console.log(body);
            callback(null, response.body)
        }
    });
}

exports.sendSMS = (to, body, callback) => {
    const request = require('request');
    console.log("in sms send method", body);
    var options = {
        url: process.env.GM_API + 'sendSms',
        headers: {
            "apikey": process.env.GM_API_KEY,
            "supportkey": process.env.SUPPORT_KEY,
            "applicationkey": process.env.APPLICATION_KEY
        },
        body: {

            KEY: body.search(/otp/i) ? process.env.SMS_SERVER_KEY_OTP : process.env.SMS_SERVER_KEY,
            TO: to,
            BODY: String.raw`${body}`//body

        },
        json: true
    };

    console.log(options);
    request.post(options, (error, response, body) => {
        if (error) {
            callback(error);
        } else {
            console.log("bdoy: ", response.body);
            if (response.body.code == 400)
                callback("SMS SEND ERROR." + JSON.stringify(body));
            else
                callback(null, "SMS SEND : " + JSON.stringify(body))
        }
    });
}

exports.openConnection = () => {
    try {
        const con = mysql.createConnection(config);
        con.connect();
        con.beginTransaction(function (err) {
            if (err) {
                throw err;
            }
        });
        return con;
    }
    catch (error) {
        console.error(error);
    }
}

exports.rollbackConnection = (connection) => {
    try {
        connection.rollback(function () {
            connection.end();
        });
    }
    catch (error) {
        console.error(error);
    }
}

exports.commitConnection = (connection) => {
    try {
        connection.commit(function () {
            connection.end();
        });
    }
    catch (error) {
        console.error(error);
    }
}

exports.executeDML = (query, data, supportKey, connection, callback) => {
    try {
        console.log(query, data);
        connection.query(query, data, callback);
    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        callback(error);
    } finally {
    }
}

exports.sanitizeFilter = (input) => {
    const forbiddenWords = [
        "SELECT", "INSERT", "UPDATE", "DELETE", "DROP", "TRUNCATE", "ALTER", "CREATE",
        "RENAME", "GRANT", "REVOKE", "EXECUTE", "UNION", "HAVING", "WHERE", "ORDER BY",
        "GROUP BY", "ROLLBACK", "COMMIT", "--", ";", "/*", "*/", "undefined"
    ];
    var IS_FILTER_WRONG = "0"
    forbiddenWords.forEach(word => {
        if (input.toUpperCase().includes(word)) {
            IS_FILTER_WRONG = "1";
        }
    });
    return IS_FILTER_WRONG;
};

var scheduler = require('node-schedule');
const mm = require('../Utilities/globalModule');
const db = require('../Utilities/globalModule');
const logger = require("../Utilities/logger");
const async = require('async');
const axios = require('axios');
// const ah = require('../Utilities/Helper'); // Helper file not found, comment out if not needed

var supportKey = "schedularLog";

exports.schedulerJob = (req, res) => {
    try {
        console.log("scheduler started");
        var j = scheduler.scheduleJob(" */1 * * * *", getSchedulerMaster);
    } catch (error) {
        console.log(error);
    }
}

var log = "schedularLog";

function getSchedulerMaster() {
    try {

        console.log("scheduled on " + new Date().toString());
        var systemdate = mm.getSystemDate();
        var dateTime = systemdate.toString().split(' ');
        var todayDate = new Date(systemdate);

        var dayName = todayDate.toString().split(' ')[0];
        var date = dateTime[0].split('-');
        var time = dateTime[1].split(':');

        var dhours = ("0" + todayDate.getHours()).slice(-2) + ':00:00';

        var dmin = '00:' + ("0" + todayDate.getMinutes()).slice(-2) + ':' + ("0" + todayDate.getSeconds()).slice(-2);
        var dsec = '00:' + '00:' + ("0" + todayDate.getSeconds()).slice(-2);


        var query = `select * from view_scheduler_master where  STATUS = 'A' AND ((REPEAT_MODE = 'C' AND REPEAT_DATA = '${dateTime[1]}') or (REPEAT_MODE = 'H' AND REPEAT_DATA = '${dateTime[1]}') or (REPEAT_MODE = 'N' AND REPEAT_DATA = '${dateTime[1]}') or (TIME = '${dateTime[1]}' AND ( (REPEAT_MODE = 'D') OR (REPEAT_MODE = 'W' AND REPEAT_DATA ='${dayName}') OR (REPEAT_MODE = 'M' AND REPEAT_DATA = '${date[2]}') OR (REPEAT_MODE = 'Y' AND REPEAT_DATA = '${date[1]}-${date[2]}') OR (REPEAT_MODE = 'S' AND REPEAT_DATA = '${dateTime[0]}'))))`;

        mm.executeQuery(query, log, (error, results) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log(results);


                var timeObject = new Date(systemdate);
                var milliseconds = 60 * 1000; // 10 seconds = 10000 milliseconds
                timeObject = new Date(timeObject.getTime() + milliseconds);
                var hours = ("0" + timeObject.getHours()).slice(-2);

                // current minutes	
                var minutes = ("0" + timeObject.getMinutes()).slice(-2);

                // current seconds
                var seconds = ("0" + timeObject.getSeconds()).slice(-2);
                var curTime = hours + ":" + minutes + ":" + seconds;


                mm.executeQuery(`update scheduler_master set REPEAT_DATA = '${curTime}'  WHERE  REPEAT_MODE= 'N' AND STATUS ='A'`, log, (error, resultsUpdateIsFetched) => {
                    if (error) {
                        console.log("Error in last 1 : ", error);

                    }
                    else {
                        if (results.length > 0) {
                            for (let i = 0; i < results.length; i++) {
                                var record = results[i];
                                executeTask(record);
                            }
                        }
                        else {
                            console.log('No record');
                        }
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

function executeTask(data) {

    var supportKey = "schedular"

    switch (data.NOTIFICATION_TYPE_ID) {

        case 1:
            function1()
            break;

        default:
            break;
    }
}

const function1 = () => {
    console.log("function 1");
}


const mm = require('../../Utilities/globalModule');
//const db = require('../../utilities/dbModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../Utilities/logger");
const jwt = require('jsonwebtoken');
const applicationkey = process.env.APPLICATION_KEY;
var user_role_mapping = "user_role_mapping";
var viewUserRoleMapping = "view_" + user_role_mapping;

function reqData(req) {

    var data = {
        USER_ID: req.body.USER_ID,
        ROLE_ID: req.body.ROLE_ID ? req.body.ROLE_ID : 0,
        //NAME: req.body.NAME,
        //EMAIL_ID: req.body.EMAIL_ID,
        //MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        //IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        //PASSWORD: req.body.PASSWORD,
        CLIENT_ID: req.body.CLIENT_ID,
        STATUS: req.body.STATUS
    }
    return data;
}

// exports.validate = function () {
//     return [
//         // body('ROLE_ID').isInt(),
//         body('NAME', ' parameter missing').exists(),
//         body('EMAIL_ID', ' parameter missing').exists(),
//         body('MOBILE_NUMBER', ' parameter missing').exists(),
//         body('PASSWORD', ' parameter missing').exists(),
//         body('ID').optional()
//     ]
// }

exports.get = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    // console.log(pageIndex + " " + pageSize)
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
        // console.log(start + " " + end);
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey']; //Supportkey ;
    try {
        mm.executeQuery('select count(*) as cnt from ' + viewUserRoleMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    "code": 400,
                    "message": "Failed to get users count...",
                });
            } else {
                mm.executeQuery('select * from ' + viewUserRoleMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                        res.send({
                            "code": 400,
                            "message": "Failed to get user information..."
                        });
                    } else {
                        res.send({
                            "code": 200,
                            "message": "success",
                            "count": results1[0].cnt,
                            "data": results
                        });
                    }
                });
            }
        });
    } catch (error) {
        
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        console.log(error);
    }
}

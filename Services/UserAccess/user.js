const mm = require('../../Utilities/globalModule');
//const db = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../Utilities/logger");
const jwt = require('jsonwebtoken');

const applicationkey = process.env.APPLICATION_KEY;

var userMaster = "user_master";
var viewUserMaster = "view_" + userMaster;

function reqData(req) {
    var data = {
        ROLE_ID: req.body.ROLE_ID ? req.body.ROLE_ID : 0,
        NAME: req.body.NAME,
        EMAIL_ID: req.body.EMAIL_ID,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        PASSWORD: req.body.PASSWORD,
        CLIENT_ID: req.body.CLIENT_ID,
        FIREBASE_REG_TOKEN: req.body.FIREBASE_REG_TOKEN
    }
    return data;
}

exports.validate = function () {
    return [
        // body('ROLE_ID').isInt(),
        body('NAME', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('MOBILE_NUMBER', ' parameter missing').exists(),
        body('PASSWORD', ' parameter missing').exists(),
        body('ID').optional()
    ]
}

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

        mm.executeQuery('select count(*) as cnt from ' + viewUserMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);

                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    "code": 400,
                    "message": "Failed to get users count...",
                });
            } else {
                mm.executeQuery('select * from ' + viewUserMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
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

exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey']; //Supportkey ;

    var roleData = req.body.ROLE_DATA;

    const connection = mm.openConnection()
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            mm.executeDML('INSERT INTO ' + userMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    mm.rollbackConnection(connection);
                    res.send({
                        "code": 400,
                        "message": "Failed to save user information..."
                    });
                } else {

                    if (roleData && roleData.length > 0) {
                        var inserQuery = `INSERT INTO user_role_mapping(USER_ID,ROLE_ID,CLIENT_ID) VALUES ?`
                        var recordData = []
                        for (let index = 0; index < roleData.length; index++) {
                            const roles = roleData[index];
                            var rec = [results.insertId, roles, data.CLIENT_ID];
                            recordData.push(rec)
                        }

                        mm.executeDML(inserQuery, [recordData], supportKey, connection, (error, resultRole) => {
                            if (error) {
                                console.log(error)
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                                mm.rollbackConnection(connection);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save user information..."
                                });
                            }
                            else {
                                mm.commitConnection(connection);
                                res.send({
                                    "code": 200,
                                    "message": "User information saved successfully...",
                                });
                            }
                        });
                    }
                    else {
                        mm.commitConnection(connection);
                        res.send({
                            "code": 200,
                            "message": "User information saved successfully...",
                        });
                    }
                }
            });
        } catch (error) {

            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
            console.log(error)
        }
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);

    var data = reqData(req);
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey']; //Supportkey ;
    var roleData = req.body.ROLE_DATA;
    const connection = mm.openConnection()
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        //data[key] ? setData += `${key}= '${data[key]}', ` : true;
        // setData += `${key}= :"${key}", `;
        data[key] ? setData += `${key}= ? , ` : true;
        data[key] ? recordData.push(data[key]) : true;
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            mm.executeDML(`UPDATE ` + userMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
                if (error) {

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    console.log(error);
                    mm.rollbackConnection(connection);
                    res.send({
                        "code": 400,
                        "message": "Failed to update user information."
                    });
                } else {
                    if (roleData && roleData.length > 0) {
                        mm.executeDML(`delete from user_role_mapping where USER_ID = ?`, [criteria.ID], supportKey, connection, (error, resultDelete) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save user information..."
                                });
                            }
                            else {
                                var inserQuery = `INSERT INTO user_role_mapping(USER_ID,ROLE_ID,COLLEGE_ID,COLLEGE_CONTACT_ID,CLIENT_ID) VALUES ?`
                                var recordData = []
                                console.log(roleData);
                                for (let index = 0; index < roleData.length; index++) {
                                    const roles = roleData[index];

                                    var rec = [criteria.ID, roles, 0, 0, data.CLIENT_ID];
                                    recordData.push(rec);
                                }
                                mm.executeDML(inserQuery, [recordData], supportKey, connection, (error, resultRole) => {
                                    if (error) {
                                        console.log(error)
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                                        mm.rollbackConnection(connection);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save user information..."
                                        });
                                    }
                                    else {
                                        mm.commitConnection(connection);
                                        res.send({
                                            "code": 200,
                                            "message": "User information updated successfully...",
                                        });
                                    }
                                });
                            }
                        })
                    }
                    else {
                        mm.commitConnection(connection);
                        res.send({
                            "code": 200,
                            "message": "User information updated successfully...",
                        });
                    }
                }
            });
        } catch (error) {

            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
            console.log(error);
        }
    }
}
/////Methods with transaction commit rollback 

exports.get1 = async (req, res) => {
    try {
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
        var connection = await mm.getConnection();
        var countQuery = 'select count(*) as cnt from ' + viewUserMaster + ' where 1 ' + countCriteria;
        await mm.executeQueryTransaction(countQuery, connection).then(async (result) => {
            if (result.length > 0) {
                var dataquery = 'select * from ' + viewUserMaster + ' where 1 ' + criteria;
                await mm.executeQueryTransaction(dataquery, connection).then((results) => {
                    console.log(results);
                    if (results.length > 0) {
                        res.send({
                            "code": 200,
                            "message": "success",
                            "count": result[0].cnt,
                            "data": results
                        });
                    } else {
                        //No data found
                        res.send({
                            "code": 200,
                            "message": "No Data"
                        });
                    }
                }, (error) => {
                    console.log('Error occurred in method : ', req.method, "Error : ", error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    res.send({
                        "code": 400,
                        "message": "Failed to get users count...",
                    });
                });
            } else {
                //No data found
                res.send({
                    "code": 200,
                    "message": "No Data"
                });
            }
        }, (error) => {
            console.log('Error occurred in method : ', req.method, "Error : ", error);
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
            res.send({
                "code": 400,
                "message": "Failed to get users count.",
            });
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        console.log(error);
    }
}

exports.create1 = async (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey']; //Supportkey ;
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });

    } else {
        try {
            var connection = await mm.getConnection(); //get connection from pool
            mm.executeQueryDataTransaction('INSERT INTO ' + userMaster + ' SET ?', data, connection).then((results) => {
                console.log(results);
                res.send({
                    "code": 200,
                    "message": "User information saved successfully...",
                });
            }, (error) => {
                //console.log("Error in method : ", req.method, req.url, "Error : ", error);
                console.log("Error in method : ", error.sqlMessage);

                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    "code": 400,
                    "message": "Failed to save user information..."
                });
            });
            mm.endConnection(connection);
        } catch (error) {

            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
            console.log("Exception in method : ", req.method, req.url, " Error : ", error);
            mm.endConnection(connection);
        }
    }
}

exports.update1 = async (req, res) => {
    try {
        const errors = validationResult(req);
        //console.log(req.body);
        var data = reqData(req);
        var deviceid = req.headers['deviceid'];
        var supportKey = req.headers['supportkey'];
        var criteria = {
            ID: req.body.ID,
        };
        var systemDate = mm.getSystemDate();
        var setData = "";
        var recordData = [];
        Object.keys(data).forEach(key => {
            //data[key] ? setData += `${key}= '${data[key]}', ` : true;
            // setData += `${key}= :"${key}", `;
            data[key] ? setData += `${key}= ? , ` : true;
            data[key] ? recordData.push(data[key]) : true;
        });

        if (!errors.isEmpty()) {
            console.log(errors);
            res.send({
                "code": 422,
                "message": errors.errors
            });
        } else {
            var connection = await mm.getConnection();
            mm.executeQueryDataTransaction(`UPDATE ` + userMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, connection).then((results) => {
                console.log(results);
                res.send({
                    "code": 200,
                    "message": "User information updated successfully...",
                });
            }, (error) => {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                console.log(error);
                res.send({
                    "code": 400,
                    "message": "Failed to update user information..."
                });
            });
            mm.endConnection(connection);
        }
    } catch (error) {

        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        console.log(error);
        mm.endConnection(connection);
    }
}

exports.login = (req, res) => {
    try {
        var username = req.body.username;
        var password = req.body.password;
        //var cloudId = req.body.cloudid ? req.body.cloudid : '';
        var supportKey = req.headers['supportkey'];
        if ((!username && username == '' && username == undefined) && (!password && password == '' && password == undefined)) {
            res.send({
                "code": 400,
                "message": "username or password parameter missing...",
            });
        }
        else {
            //and DEVICE_ID = '${deviceId}
            mm.executeQuery(`SELECT * FROM ${viewUserMaster}  WHERE  (MOBILE_NUMBER ='${username}' or EMAIL_ID='${username}') and PASSWORD ='${password}' and IS_ACTIVE = 1`, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    // logger.error('APIK:' + req.headers['apikey'] + ' ' + supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
                    res.send({
                        "code": 400,
                        "message": "Failed to get record...",
                    });
                }
                else {
                    if (results1.length > 0) {
                        mm.executeQueryData(`SELECT COUNTRY_ID,ID,YEAR_ID,STEP_NO,BOARD_ID FROM school_master WHERE  PRINCIPLE_ID = ? `, [results1[0]?.ID], supportKey, (error, resultsSchool) => {
                            if (error) {
                                console.log(error);
                                // logger.error('APIK:' + req.headers['apikey'] + ' ' + supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get record...",
                                });
                            }
                            else {
                                var userDetails = [{
                                    USER_ID: results1[0].ID,
                                    CLIENT_ID: results1[0].CLIENT_ID,
                                    ROLE_ID: results1[0].ROLE_ID,
                                    NAME: results1[0].NAME,
                                    EMAIL_ID: results1[0].EMAIL_ID,
                                    COUNTRY_ID: resultsSchool[0]?.COUNTRY_ID ? resultsSchool[0]?.COUNTRY_ID : '',
                                    SCHOOL_ID: resultsSchool[0]?.ID ? resultsSchool[0]?.ID : '',
                                    YEAR_ID: resultsSchool[0]?.YEAR_ID ? resultsSchool[0]?.YEAR_ID : '',
                                    STEP_NO: resultsSchool[0]?.STEP_NO ? resultsSchool[0]?.STEP_NO : 0,
                                    BOARD_ID: resultsSchool[0]?.BOARD_ID ? resultsSchool[0]?.BOARD_ID : ''
                                }]
                                generateToken(results1[0].ID, res, userDetails);
                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "Incorrect username or password..."
                        });
                    }
                }
            });
        }
    } catch (error) {
        console.log(error);
        // logger.error('APIK:' + req.headers['apikey'] + ' ' + supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
    }
}

function generateToken(userId, res, resultsUser) {
    try {
        var data = {
            "USER_ID": userId,
        }
        jwt.sign({ data }, process.env.SECRET, (error, token) => {
            if (error) {
                console.log("token error", error);
                //  logger.error('APIK:' + req.headers['apikey'] + ' ' + supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
                //logger.error('APIK' + req.headers['apikey'] + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
            }
            else {
                // console.log("token generation", token);
                // console.log(data);
                // console.log("jkl :", resultsUser);
                res.send({
                    "code": 200,
                    "message": "Logged in successfully...",
                    "data": [{
                        "token": token,
                        "UserData": resultsUser
                    }]
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.getForms1 = (req, res) => {

    try {
        var userId = req.body.USER_ID;
        var supportKey = req.headers['supportkey'];
        var filter = req.body.filter ? (' AND ' + req.body.filter) : ''

        if (userId) {
            mm.executeQuery(`select ROLE_ID from view_user_master where ID = '${userId}'`, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to get Record..."
                    });
                }
                else {
                    console.log(results);
                    if (results.length > 0) {
                        mm.executeQuery(`select * from view_role_details where ROLE_ID = '${results[0].ROLE_ID}' ${filter} order by SEQ_NO`, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get Record..."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "Form Data...",
                                    "data": results
                                });
                            }
                        });
                    }
                    else {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "No user found... "
                        });
                    }
                }
            });
        }
        else {
            res.send({
                "code": 400,
                "message": "Failed to get Record..."
            });
            return
        }
    } catch (error) {
        console.log(error);
    }
}

exports.getForms = (req, res) => {
    try {
        var ROLE_ID = req.body.ROLE_ID;
        var supportKey = req.headers['supportkey'];
        //var filter = req.body.filter ? (' AND ' + req.body.filter) : ''

        if (ROLE_ID) {
            var query = `SET SESSION group_concat_max_len = 4294967290;SELECT replace(REPLACE(( CONCAT('[',GROUP_CONCAT(JSON_OBJECT('level',1,'title',m.FORM_NAME,'icon',m.ICON,'link',m.LINK,'SEQ_NO',m.SEQ_NO,'children',( IFNULL((SELECT replace(REPLACE(( CONCAT('[',GROUP_CONCAT(JSON_OBJECT('level',2,'title',FORM_NAME,'icon',ICON,'link',link,'SEQ_NO',SEQ_NO)),']')),'"[','['),']"',']') FROM view_role_details WHERE PARENT_ID = m.FORM_ID AND ROLE_ID = m.ROLE_ID  and IS_ALLOWED=1 AND SHOW_IN_MENU = 1 order by SEQ_NO ASC),'[]') )
            )),']')),'"[','['),']"',']') AS data FROM view_role_details m WHERE PARENT_ID = 0 AND ROLE_ID = ${ROLE_ID} AND IS_ALLOWED = 1 AND SHOW_IN_MENU = 1 order by SEQ_NO ASC`

            // var query = `SET SESSION group_concat_max_len = 4294967290;
            // select replace(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('ID',ID,'ROLE_ID',ROLE_ID,'FORM_ID',FORM_ID,'IS_ALLOWED',IS_ALLOWED,'SEQ_NO',SEQ_NO,'PARENT_ID',PARENT_ID,'CLIENT_ID',CLIENT_ID,'FORM_NAME',FORM_NAME,'ICON',ICON,'LINK',LINK,'subforms',(IFNULL((SELECT replace(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('ID',ID,'ROLE_ID',ROLE_ID,'FORM_ID',FORM_ID,'IS_ALLOWED',IS_ALLOWED,'SEQ_NO',SEQ_NO,'PARENT_ID',PARENT_ID,'CLIENT_ID',CLIENT_ID,'FORM_NAME',FORM_NAME,'ICON',ICON,'LINK',LINK)),']'),'"[','['),']"',']') FROM view_role_details WHERE ROLE_ID = m.ROLE_ID and  IS_ALLOWED = 1 AND PARENT_ID = m.FORM_ID   order by SEQ_NO asc),'[]'))
            // )),']'),'"[','['),']"',']') as data FROM
            // view_role_details m Where ROLE_ID = ${ROLE_ID} AND IS_ALLOWED = 1 AND PARENT_ID = 0 order by SEQ_NO asc`

            mm.executeQuery(query, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to get Record..."
                    });
                }
                else {
                    if (results.length > 0) {
                        var json = results[1][0].data
                        if (json) {
                            json = json.replace(/\\/g, '');
                            json = JSON.parse(json);
                        }
                        res.send({
                            "code": 200,
                            "message": "SUCCESS",
                            "data": json
                        });
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": "No Data...",
                        });
                    }
                }
            });
        }
        else {
            res.send({
                "code": 400,
                "message": "Parameter missing - ROLE_ID... "
            });
            return
        }
    } catch (error) {
        console.log(error);
    }
}

exports.changePassword = (req, res) => {
    try {

        var ID = req.body.EMPLOYEE_ID;
        var OLD_PASSWORD = req.body.OLD_PASSWORD;
        var NEW_PASSWORD = req.body.NEW_PASSWORD;
        var supportKey = req.headers["supportkey"];
        var systemDate = mm.getSystemDate();

        if (ID && ID != " " && NEW_PASSWORD && NEW_PASSWORD != " " && OLD_PASSWORD && OLD_PASSWORD != " ") {

            var connection = mm.openConnection();
            mm.executeDML(`SELECT PASSWORD,NAME,CLIENT_ID,ID FROM VIEW_USER_MASTER WHERE ID = ? limit 1`, [ID],
                supportKey, connection, (error, results) => {
                    if (error) {
                        console.log(error);
                        mm.rollbackConnection(connection);
                        logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                        res.send({
                            code: 400,
                            message: "Failed to get PASSWORD details ",
                        });
                    } else {
                        if (results[0].PASSWORD == OLD_PASSWORD) {
                            mm.executeDML(`UPDATE USER_MASTER SET PASSWORD = '${NEW_PASSWORD}' where ID = ? and PASSWORD = ?`, [ID, OLD_PASSWORD], supportKey,
                                connection,
                                (error, resultsUpdate1) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(
                                            supportKey +
                                            " " +
                                            req.method +
                                            " " +
                                            req.url +
                                            " " +
                                            JSON.stringify(error),
                                            applicationkey
                                        );
                                        mm.rollbackConnection(connection);
                                        res.send({
                                            code: 400,
                                            message:
                                                "Failed to update PASSWORD!",
                                        });
                                    } else {
                                        mm.commitConnection(connection);
                                        res.send({
                                            code: 200,
                                            message: "PASSWORD UPDATED SUCCSESFULLY.....",
                                        });

                                    }
                                }
                            );
                        } else {
                            mm.rollbackConnection(connection);
                            res.send({
                                code: 400,
                                message: "invalid old password ",
                            });
                        }
                    }
                }
            );
        } else {
            res.send({
                code: 400,
                message: "NEW_PASSWORD parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);
    }
};
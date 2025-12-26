const mm = require('../../Utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../Utilities/logger");
const async = require('async');

const applicationkey = process.env.APPLICATION_KEY;

var roleDetails = "role_details";
var viewRoleDetails = "view_" + roleDetails;

function reqData(req) {
    var data = {
        ROLE_ID: req.ROLE_ID,
        FORM_ID: req.FORM_ID,
        IS_ALLOWED: req.IS_ALLOWED ? 1 : 0,
        SEQ_NO: req.SEQ_NO ? req.SEQ_NO : 0,
        CLIENT_ID: req.CLIENT_ID,
        SHOW_IN_MENU: req.SHOW_IN_MENU ? req.SHOW_IN_MENU : 0
    }
    return data;
}

exports.validate = function () {
    return [
        body('ROLE_ID').isInt(),
        body('FORM_ID').isInt(),
        body('SEQ_NO').isInt().optional(),
        body('ID').optional(),
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
    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQuery('select count(*) as cnt from ' + viewRoleDetails + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    "code": 400,
                    "message": "Failed to get roleDetails count...",
                });
            } else {
                mm.executeQuery('select * from ' + viewRoleDetails + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                        res.send({
                            "code": 400,
                            "message": "Failed to get roleDetail information..."
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
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            mm.executeQueryData('INSERT INTO ' + roleDetails + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    res.send({
                        "code": 400,
                        "message": "Failed to save roleDetail information..."
                    });
                } else {
                    res.send({
                        "code": 200,
                        "message": "RoleDetail information saved successfully...",
                    });
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
        try {
            mm.executeQueryData(`UPDATE ` + roleDetails + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update roleDetail information..."
                    });
                } else {
                    res.send({
                        "code": 200,
                        "message": "RoleDetail information updated successfully...",
                    });
                }
            });
        } catch (error) {
            
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
            console.log(error);
        }
    }
}

exports.addBulk = (req, res) => {
    try {
        var data = req.body.data;
        var supportKey = req.headers['supportkey'];
        var errors1 = "";
        var ROLE_ID1 = req.body.ROLE_ID;

        if ((!ROLE_ID1 && ROLE_ID1 == undefined && ROLE_ID1 == '') || (data == undefined && data.length == 0 && data == "")) {
            res.send({
                "code": 400,
                "message": "ROLE_ID  or data parameter missing..."
            });
        } else {
            var connection = mm.openConnection();
            async.eachSeries(data, function iteratorOverElems(roleDetailsItem, callback) {
                roleDetailsItem.ROLE_ID = ROLE_ID1;
                var dataRecord = reqData(roleDetailsItem);
                mm.executeQueryData(`select * from ` + viewRoleDetails + ` where ROLE_ID = ? and FORM_ID = ?`, [ROLE_ID1, dataRecord.FORM_ID], supportKey, (error, resultsIsDataPresent) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error)
                        callback(error);
                    } else {
                        if (resultsIsDataPresent.length > 0) {
                            //update record
                            mm.executeDML(`update ` + roleDetails + ` set SHOW_IN_MENU = ? ,IS_ALLOWED = ?,SEQ_NO = ? where  ID = ?`, [dataRecord.SHOW_IN_MENU, dataRecord.IS_ALLOWED, dataRecord.SEQ_NO, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                                if (error) {
                                    console.log(error);
                                    errors1 += ('\n' + error);
                                    callback(error);
                                }
                                else {
                                    callback();
                                }
                            });
                        } else {
                            //insert record 
                            mm.executeDML('INSERT INTO ' + roleDetails + ' SET ?', dataRecord, supportKey, connection, (error, resultsInsert) => {
                                if (error) {
                                    console.log(error)
                                    errors1 += ('\n' + error);
                                    callback(error);
                                }
                                else {
                                    callback();
                                }
                            });
                        }
                    }
                });
            }, function subCb(error) {
                if (error) {
                    //rollback
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceId);
                    mm.rollbackConnection(connection);
                    res.send({
                        "code": 400,
                        "message": "Failed to Insert Role details..."
                    });
                } else {
                    mm.commitConnection(connection);
                    res.send({
                        "code": 200,
                        "message": "New role details Successfully added...",
                    });
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}

exports.addBulk1 = (req, res) => {
    try {
        var data = req.body.data;
        console.log(req.body);
        var supportKey = req.headers['supportkey'];
        var errors1 = "";
        var ROLE_ID1 = req.body.ROLE_ID;
        console.log("ROLE_ID", req.body.ROLE_ID)


        if ((!ROLE_ID1 && ROLE_ID1 == undefined && ROLE_ID1 == '') || (data == undefined && data.length == 0 && data == "")) {
            res.send({
                "code": 400,
                "message": "ROLE_ID  or data parameter missing..."
            });

        } else {

            data.forEach(roleDetailsItem => {
                console.log("roleDetailsItem : ", roleDetailsItem, ROLE_ID1);
                roleDetailsItem.ROLE_ID = ROLE_ID1;
                var dataRecord = reqData(roleDetailsItem);

                mm.executeQuery(`select * from  ${viewRoleDetails} where ROLE_ID = '${ROLE_ID1}' and FORM_ID = '${dataRecord.FORM_ID}'`, supportKey, (error, resultsIsDataPresent) => {
                    if (error) {
                        //logger.error('APIK:' + req.headers['apikey'] + ' ' + supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
                        console.log(error)
                    } else {
                        if (resultsIsDataPresent.length > 0) {
                            //update record
                            mm.executeQuery(`update ${roleDetails} set SHOW_IN_MENU = ${dataRecord.SHOW_IN_MENU} ,IS_ALLOWED ='${dataRecord.IS_ALLOWED}',SEQ_NO = '${dataRecord.SEQ_NO}' where  ID = '${resultsIsDataPresent[0].ID}'`, supportKey, (error, resultsUpdate) => {
                                if (error) {
                                    console.log(error);
                                    errors1 += ('\n' + error);
                                }
                            });
                        } else {
                            //insert record 
                            mm.executeQueryData('INSERT INTO ' + roleDetails + ' SET ?', dataRecord, supportKey, (error, resultsInsert) => {
                                if (error) {
                                    console.log(error)
                                    errors1 += ('\n' + error);
                                }
                            });
                        }
                    }
                });
            });

            if (errors1.length > 0) {
                //logger.error('APIK:' + req.headers['apikey'] + ' ' + supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
                res.send({
                    "code": 400,
                    "message": "Failed to Insert Role details..."
                });
            } else {
                res.send({
                    "code": 200,
                    "message": "New role details Successfully added...",
                });
            }
        }
    } catch (error) {
        console.log(error);
    }

}

exports.getMappingData11 = (req, res) => {

    try {
        var supportKey = req.headers['supportkey'];
        var roleId = req.body.ROLE_ID;
        var query = `SELECT m.ID AS FORM_ID,m.*,If((SELECT IS_ALLOWED FROM ${viewRoleDetails}  WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}')=1,1,0) AS IS_ALLOWED,IF(IFNULL((SELECT SEQ_NO FROM view_role_details WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}'),'')='',0,(SELECT SEQ_NO FROM view_role_details WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}')) AS SEQ_NO,(SELECT SHOW_IN_MENU FROM view_role_details WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}') AS SHOW_IN_MENU FROM view_form_master m`

        mm.executeQuery(query, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                //logger.error('APIK:' + req.headers['apikey'] + ' ' + supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
                res.send({
                    "code": 400,
                    "message": "Failed to get record..."
                });
            } else {
                if (results.length > 0) {
                    res.send({
                        "code": 200,
                        "message": "success",
                        "data": results
                    });
                } else {
                    res.send({
                        "code": 200,
                        "message": "success",
                        "data": results
                    });
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.getMappingData = (req, res) => {

    try {
        console.log("in get ");
        var supportKey = req.headers['supportkey'];
        var roleId = req.body.ROLE_ID;
        var filter = req.body.filter ? req.body.filter : '';

        mm.executeQuery(`SELECT * FROM view_role_master where ID = ${roleId}`, supportKey, (error, results) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get record..."
                });
            }
            else {
                if (results.length > 0) {
                    var query = ``;
                    //  if(results[0].PARENT_ID == 0)
                    //  {
                    query = `SELECT m.ID AS FORM_ID,m.*,If((SELECT IS_ALLOWED FROM ${viewRoleDetails}  WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}')=1,1,0) AS IS_ALLOWED,IF(IFNULL((SELECT SEQ_NO FROM view_role_details WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}'),'')='',0,(SELECT SEQ_NO FROM view_role_details WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}')) AS SEQ_NO,(SELECT SHOW_IN_MENU FROM view_role_details WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}') AS SHOW_IN_MENU FROM view_form_master m where 1 ${filter} `
                    // }
                    // else
                    //  {
                    //   query = `SELECT m.ID AS FORM_ID,m.*,If((SELECT IS_ALLOWED FROM ${viewRoleDetails}  WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}')=1,1,0) AS IS_ALLOWED,IF(IFNULL((SELECT SEQ_NO FROM view_role_details WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}'),'')='',0,(SELECT SEQ_NO FROM view_role_details WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}')) AS SEQ_NO,(SELECT SHOW_IN_MENU FROM view_role_details WHERE FORM_ID=m.ID AND ROLE_ID='${roleId}') AS SHOW_IN_MENU FROM view_form_master m  WHERE ID IN (SELECT FORM_ID FROM view_role_details WHERE ROLE_ID = ${results[0].PARENT_ID} and IS_ALLOWED = 1) `
                    //}
                    mm.executeQuery(query, supportKey, (error, results1) => {
                        if (error) {
                            console.log(error);
                            //logger.error('APIK:' + req.headers['apikey'] + ' ' + supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get record..."
                            });
                        } else {
                            if (results.length > 0) {
                                res.send({
                                    "code": 200,
                                    "message": "success",
                                    "data": results1
                                });
                            } else {
                                res.send({
                                    "code": 200,
                                    "message": "success",
                                    "data": results1
                                });
                            }
                        }
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "No role Id record found..."
                    });
                }
            }
        });
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
    }
}

exports.checkAccess = (req, res) => {
    try {
        var roleId = req.body.ROLE_ID;
        var formLink = req.body.LINK;
        var supportKey = req.headers['supportkey']

        console.log(formLink, roleId);
        if (roleId && formLink) {
            mm.executeQueryData(`select * from view_role_details where ROLE_ID = ? AND LINK = ? and IS_ALLOWED = 1`, [roleId, formLink], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    //logger.error('APIK:' + req.headers['apikey'] + ' ' + supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
                    res.send({
                        "code": 400,
                        "message": "Failed to get record..."
                    });
                }
                else {
                    if (results.length > 0) {
                        res.send({
                            "code": 200,
                            "message": "success",
                            "data": true
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "success",
                            "data": false
                        });
                    }
                }
            })
        }
        else {
            console.log(error);
            //logger.error('APIK:' + req.headers['apikey'] + ' ' + supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), req.headers['supportkey']);
            res.send({
                "code": 400,
                "message": "Parameter Missing roleId or formLink... "
            });
        }
    } catch (error) {
        console.log(error)
    }
}
const mm = require('../../Utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../Utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;

var roleMaster = "role_master";
var viewRoleMaster = "view_" + roleMaster;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        PARENT_ID: req.body.PARENT_ID,
        TYPE: req.body.TYPE,
        DESCRIPTION: req.body.DESCRIPTION,
        START_PAGE: req.body.START_PAGE,
        PARENT_ROLE_ID: req.body.PARENT_ROLE_ID,
        SHORT_CODE: req.body.SHORT_CODE,
        STATUS: req.body.STATUS ? '1' : '0',
        SEQUENCE_NO: req.body.SEQUENCE_NO,
        PARENT_NAME: req.body.PARENT_NAME,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').exists(),
        //body('PARENT_ID').isInt(),
        body('TYPE').optional(),
        body('DESCRIPTION').optional(),
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
        mm.executeQuery('select count(*) as cnt from ' + viewRoleMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get roles count...",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewRoleMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get role information..."
                        });
                    }
                    else {
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
        
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
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
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + roleMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save role information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Role information saved successfully...",
                    });
                }
            });
        } catch (error) {
            
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
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
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + roleMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update role information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Role information updated successfully...",
                    });
                }
            });
        } catch (error) {
            
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
        }
    }
}

exports.getChildRoles = (req, res) => {

    console.log(req.body)

    var parentId = req.body.parentId ? req.body.parentId : '';
    var employeeId = req.body.employeeId ? req.body.employeeId : '';

    // var pageSize = req.body.pageSize ? req.body.pageSize : '';
    // var start = 0;
    // var end = 0;

    // console.log(pageIndex + " " + pageSize)
    // if (pageIndex != '' && pageSize != '') {
    //     start = (pageIndex - 1) * pageSize;
    //     end = pageSize;
    //     console.log(start + " " + end);
    // }

    // let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    // let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    // let filter = req.body.filter ? req.body.filter : '';
    // let criteria = '';

    // if (pageIndex === '' && pageSize === '')
    //     criteria = filter + " order by " + sortKey + " " + sortValue;
    // else
    //     criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    // let countCriteria = filter;
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];//Supportkey ;
    try {
        //select  id,name,PARENT_ROLE_ID from (select * from view_role_master order by PARENT_ROLE_ID, id) roles, (select @pv := ${parentId}) initialisation where find_in_set(PARENT_ROLE_ID, @pv) and  length(@pv := concat(@pv, ',', id))
        mm.executeQueryData(`select * from (select * from role_master order by PARENT_ROLE_ID, id) roles, (select @pv := ?) initialisation where find_in_set(PARENT_ROLE_ID, @pv) and length(@pv := concat(@pv, ',', id)) and id not in(select role_id from employee_role_mapping where EMPLOYEE_ID = ?)`, [parentId, employeeId], supportKey, (error, results) => {
            //mm.executeQuery('select * from role_master where (parent_role_id in(select id from role_master where parent_role_id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')))) or id in (select id from role_master where parent_role_id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + ')) or id in(select id from role_master where parent_role_id in(' + parentId + ') or id in (' + parentId + '))))) and id not in(select role_id from employee_role_mapping where EMPLOYEE_ID = '+ employeeId +')', supportKey, (error, results) => {
            if (error) {
                console.log(error);
                
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get role information..."
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "success",
                    "data": results
                });
            }
        });
    } catch (error) {
        
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
    }
}


const mm = require('../../Utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../Utilities/logger");
const async = require('async');

const applicationkey = process.env.APPLICATION_KEY;

var tableName = "table_name";
var viewTableName = "view_" + tableName;

function reqData(req) {
    var data = {
        // Here multiple fields will comes as per table structure
        FIELD_NAME: req.body.FIELD_NAME,
    }
    return data;
}

exports.validate = function () {
    return [
        //here we give multiple properties of express validator such as exists(),optional(),isInt(),isEmail() etc
        body('FIELD_NAME', ' parameter missing').exists(),
        body('FIELD_NAME').optional(),
        body('ID').optional()
    ]
}

exports.get = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewTableName + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get tableName count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTableName + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get tableName information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "message": "success",
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).json({
                code: 400,
                message: "Invalid filter parameter.",
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }
}

exports.getList = (req, res) => {

    var pageIndex = req.query.pageIndex ? req.query.pageIndex : '';
    var pageSize = req.query.pageSize ? req.query.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.query.sortKey ? req.query.sortKey : 'ID';
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewTableName + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get tableName count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTableName + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get tableName information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "message": "success",
                                "count": results1[0].cnt,
                                "data": results,
                                "TAB_ID": 1 //here tab id will comes from tab_master table 
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).json({
                code: 400,
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "code": 500,
            "message": "Internal Server Error"
        });
    }
}

exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + tableName + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save tableName information..."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "tableName information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                code: 500,
                message: "Something went wrong."
            });
        }
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        data[key] ? setData += `${key}= ? , ` : true;
        data[key] ? recordData.push(data[key]) : true;
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + tableName + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update tableName information."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "tableName information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                code: 500,
                message: "Something went wrong."
            });
        }
    }
}

exports.delete = (req, res) => {
    var supportKey = req.headers['supportkey'];
    //here may be multiple FIELD_NAME will comes
    var FIELD_NAME = req.body.FIELD_NAME;
    var FIELD_NAME1 = req.body.FIELD_NAME1;
    try {
        if (FIELD_NAME) {
            mm.executeQueryData('DELETE FROM ' + tableName + ' WHERE FIELD_NAME = ? AND FIELD_NAME1 = ?', [FIELD_NAME, FIELD_NAME1], supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to delete tableName information."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "tableName information deleted successfully...",
                    });
                }
            });
        }
        else {
            res.status(400).json({
                "code": 400,
                "message": "Invalid parameter."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Internal Server Error"
        });
    }
}

// serial insertion and updation of data
exports.mapping = (req, res) => {

    let data = req.body.data ? req.body.data : []; //From data multiple fields will come
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection();
        async.eachSeries(data, function iteratorOverElems(element, callback) {
            if (element.ID) {
                mm.executeDML('UPDATE table_name_mapping SET FIELD_NAME1 = ?, FIELD_NAME2 = ? WHERE ID = ?', [element.FIELD_NAME1, element.FIELD_NAME2, element.ID], supportKey, connection, (error, resultUpdate) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                });
            } else if (element.IS_ACTIVE == 1) { //here either IS_ACTIVE or STATUS will come
                mm.executeDML('INSERT INTO table_name_mapping SET ?', [element], supportKey, connection, (error, resultInsert) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback();
                    }
                });
            } else {
                callback();
            }
        }, function subCb(error) {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                mm.rollbackConnection(connection);
                res.status(400).json({
                    code: 400,
                    message: "Failed to map table_name information."
                });
            } else {
                mm.commitConnection(connection);
                res.status(200).json({
                    code: 200,
                    message: "table_name information mapped successfully..."
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Internal Server Error"
        });
    }
}

//To Extract data from mapping table based on ID
exports.getMapping = (req, res) => {
    var supportKey = req.headers['supportkey'];
    const FIELD_ID = req.params.ID;
    try {
        mm.executeQueryData('select * from  view_table_name_mapping WHERE FIELD_ID = ?', [FIELD_ID], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to get  symptoms."
                });
            }
            else {
                res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "data": results
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Internal Server Error"
        });
    }
}

//bulk insert 
exports.bulkInsert = (req, res) => {
    var data = reqData(req);
    let tableOneObject = req.body.tableOneObject;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection()
        var FIRST_DATA = []
        for (let i = 0; i < tableOneObject.length; i++) {
            FIRST_DATA.push([tableOneObject[i].FIELD_1, tableOneObject[i].FIELD_2, tableOneObject[i].FIELD_3, tableOneObject[i].FIELD_4, data.CLIENT_ID])
        }
        mm.executeDML('INSERT INTO table_1 (FIELD_1,FIELD_2,FIELD_3,FIELD_4,CLIENT_ID) VALUES ?', [FIRST_DATA], supportKey, connection, (error, results3) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                mm.rollbackConnection(connection)
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to save tables information..."
                });
            }
            else {
                mm.commitConnection(connection)
                res.status(200).json({
                    "code": 200,
                    "message": "Property information saved successfully...",
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Internal Server Error"
        });
    }
}
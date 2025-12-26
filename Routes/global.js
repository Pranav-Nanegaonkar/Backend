const express = require("express");
const router = express.Router();
var globalService = require('../Services/global.js');


router

    //auth
    .all('*', globalService.checkAuthorization)
    .use('/api', globalService.checkToken)
    
    //ModuleName
    .use('/api/module', require('./ModuleName/fileName'))

    //UserAccess Routes
    .use('/api/user', require('./UserAccess/user'))
    .use('/api/role', require('./UserAccess/role'))
    .use('/api/form', require('./UserAccess/form'))
    .use('/api/roledetail', require('./UserAccess/roleDetail'))
    .use('/api/userrolemapping', require('./UserAccess/userRoleMapping'))

    //Uploads
    .post("/uploadFilesTos3", globalService.uploadFilesTos3)
    .post("/fileUpload", globalService.fileUpload)

module.exports = router;    

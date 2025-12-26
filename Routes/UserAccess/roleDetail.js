const express = require('express');
const router = express.Router();
const roleDetailService = require('../../Services/UserAccess/roleDetail');

router
    .post('/get', roleDetailService.get)
    // .post('/create',roleService.validate(),roleService.create)
    // .put('/update',roleService.validate(),roleService.update)
    .post('/addBulk', roleDetailService.addBulk)
    .post('/getData', roleDetailService.getMappingData)
    .post('/checkAccess', roleDetailService.checkAccess)
    
module.exports = router;
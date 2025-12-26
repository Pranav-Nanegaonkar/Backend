const express = require('express');
const router = express.Router();
const FileNameService = require('../../Services/ModuleName/fileName.js');

router
    .post('/get', FileNameService.get)
    .post('/getlist', FileNameService.getList)
    .post('/create', FileNameService.validate(), FileNameService.create)
    .put('/update', FileNameService.validate(), FileNameService.update)
    .post('/delete', FileNameService.delete)
    .post('/mapping', FileNameService.mapping)
    .post('/getMapping', FileNameService.getMapping); //To get data from mapping table  

module.exports = router;
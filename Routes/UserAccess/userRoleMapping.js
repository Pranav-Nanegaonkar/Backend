const express = require('express');
const router = express.Router();
const userRoleMappingService = require('../../Services/UserAccess/userRoleMapping');

router
    .post('/get', userRoleMappingService.get)

module.exports = router;
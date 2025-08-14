const express = require('express');
const { loginSuperadmin, registerSuperadmin } = require('../controllers/superadmin');

const router = express.Router();

router.post('/login',loginSuperadmin);

router.post('/register',registerSuperadmin);

module.exports = router;
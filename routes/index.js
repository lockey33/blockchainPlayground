import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const resolve = require('path').resolve
const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.send({ response: "I am alive" }).status(200);
});

module.exports = router;
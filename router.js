
const router = require('express').Router();
const app = require('./src');

router.get('/', function (req, res, next) {
    res.status(200).send({
        "status": "ok"
    });
});

router.use('/images', app.Routes.Images);

module.exports = router;

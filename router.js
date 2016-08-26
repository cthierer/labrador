
const router = require('express').Router();
const app = require('./src');

router.use(function (req, res, next) {
    res.set('Access-Control-Allow-Origin', req.headers.origin)
    res.set('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method.toUpperCase() === 'OPTIONS') {
        res.status(204).end()
        return
    }

    next()
})

router.get('/', function (req, res, next) {
    res.status(200).send({
        "status": "ok"
    });
});

// router.use('/images', app.Routes.Images);
router.use('/posts', app.Routes.Posts);

module.exports = router;

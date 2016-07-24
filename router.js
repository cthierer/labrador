
const fs = require('fs'),
    multer = require('multer'),
    mimeTypes = require('mime-types'),
    uuid = require('uuid'),
    _ = require('lodash'),
    router = require('express').Router(),
    pusher = require('pusher-google-drive');

const SERVICE_USER = process.env.SERVICE_USER;
const SERVICE_KEY = fs.readFileSync(process.env.SERVICE_KEY_FILE);
const SCOPES = [pusher.Services.Token.SCOPES.FILE, pusher.Services.Token.SCOPES.META];

const LEGAL_IMAGE_TYPES = [
    mimeTypes.types['png'],
    mimeTypes.types['jpg'],
    mimeTypes.types['gif'],
    mimeTypes.types['tif']
];

function isImage (file) {
    return LEGAL_IMAGE_TYPES.indexOf(file.mimetype) >= 0;
}

var upload = multer({
    fileFilter: function (req, file, cb) {
        cb(null, isImage(file));
    }
});

router.get('/', function (req, res, next) {
    res.status(200).send({
        "status": "ok"
    });
});

router.post('/images/:project', upload.array('image'), function (req, res, next) {
    var project = req.params.project,
        submitter = req.body.name || "",
        email = req.body.email || "",
        message = req.body.message || "";

    pusher.Services.Token.getToken(SERVICE_USER, SCOPES, SERVICE_KEY).then(function (token) {
        var properties = {
                "parents": [ project ],
                "description": message + "\n(Submitted by " + submitter + " <" + email + ">)",
                "properties": {
                    "submitter": submitter,
                    "email": email
                }
            },
            promises = [];

        for (var i = 0; i < req.files.length; i++) {
            var file = req.files[i],
                fileProperties = _.extend(properties, {
                    "name": uuid.v4() + "." + mimeTypes.extension(file.mimetype)
                });

            promises.push(pusher.Services.File.upload(file.buffer,
                file.mimetype, fileProperties, token));
        }

        Promise.all(promises).then(function (results) {
            res.status(200).send({
                'status': 'ok',
                'count': promises.length,
                'files': results
            });
            next();
        }).catch(function (err) {
            next(err);
        });
    });
});

module.exports = router;

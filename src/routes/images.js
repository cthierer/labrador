
const multer = require('multer');
const mimeTypes = require('mime-types');
const router = require('express').Router();
const uuid = require('uuid');
const _ = require('lodash');
const GoogleDrivePusher = require('pusher-google-drive');

const SERVICE_USER = process.env.SERVICE_USER;
const SERVICE_KEY = process.env.SERVICE_KEY;

const pusher = new GoogleDrivePusher(SERVICE_USER, SERVICE_KEY);

const LEGAL_IMAGE_TYPES = [
    mimeTypes.types['png'],
    mimeTypes.types['jpg'],
    mimeTypes.types['gif'],
    mimeTypes.types['tif']
];

function isImage (file) {
    return LEGAL_IMAGE_TYPES.indexOf(file.mimetype) >= 0;
}

function isNotEmptyStr (str) {
    return str && _.isString(str) && !_.isEmpty(str);
}

function buildDescription (message, submitter, email) {
    var description = isNotEmptyStr(message) ? message : "";

    if (isNotEmptyStr(submitter) || isNotEmptyStr(email)) {
        if (!_.isEmpty(description)) {
            description += "\n(Submitted by ";
        }

        if (isNotEmptyStr(submitter)) {
            description += submitter;

            if (isNotEmptyStr(email)) {
                description += " ";
            }
        }

        if (isNotEmptyStr(email)) {
            description += "<" + email + ">";
        }

        description += ")";
    }

    return description;
}

var upload = multer({
    fileFilter: function (req, file, cb) {
        cb(null, isImage(file));
    }
});

router.post('/:project', upload.array('image'), function (req, res, next) {
    var project = req.params.project,
        submitter = req.body.submitter || "",
        email = req.body.email || "",
        message = req.body.message || "",
        files = req.files || [];

    var properties = {
            "parents": [ project ],
            "description": buildDescription(message, submitter, email),
            "properties": {
                "submitter": submitter,
                "email": email
            }
        },
        promises = [];

    for (var i = 0; i < files.length; i++) {
        var file = files[i],
            fileProperties = _.extend(properties, {
                "name": uuid.v4() + "." + mimeTypes.extension(file.mimetype)
            });

        promises.push(pusher.uploadFile(file.buffer, file.mimetype, fileProperties));
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

module.exports = router;

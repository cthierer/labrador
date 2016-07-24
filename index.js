const express = require('express'),
    bodyParser = require('body-parser'),
    port = process.env.PORT || 4000;

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(require('./router'));

app.listen(port, function () {
    console.log('Listening on port', port);
});

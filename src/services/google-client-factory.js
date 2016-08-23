
const GoogleDrivePusher = require('pusher-google-drive')

const SERVICE_USER = process.env.SERVICE_USER;
const SERVICE_KEY = process.env.SERVICE_KEY;

var client = new GoogleDrivePusher(SERVICE_USER, SERVICE_KEY)

module.exports = {
  getClient: () => client
}

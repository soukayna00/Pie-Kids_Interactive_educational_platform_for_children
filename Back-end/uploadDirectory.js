const path = require('node:path');

function uploadDirectory() {
  return process.env.PIE_KIDS_UPLOAD_DIR || path.join(__dirname, 'uploads');
}

module.exports = { uploadDirectory };

function sendSuccess(res, message = "", data = {}) {
  return res.json({ success: true, message, data });
}

function sendError(res, message = "Error", status = 500, data = {}) {
  return res.status(status).json({ success: false, message, data });
}

module.exports = { sendSuccess, sendError };

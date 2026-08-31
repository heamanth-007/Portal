const Message = require("../models/Message");
const { sendSuccess, sendError } = require("../utils/response");

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    return sendSuccess(res, "Messages fetched", { messages });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return sendError(res, "Message text is required", 400);

    const employeeId = req.user.id;
    const msg = new Message({
      employeeId,
      text,
      readBy: [employeeId],
    });

    await msg.save();

    // Broadcast message via Socket.io
    const io = req.app.get("io");
    if (io) {
      io.emit("new_message", msg);
    }

    return sendSuccess(res, "Message created", { message: msg });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const employeeId = req.user.id;

    // Add employeeId to readBy array for all messages that don't already have it
    await Message.updateMany(
      { readBy: { $ne: employeeId } },
      { $addToSet: { readBy: employeeId } },
    );

    return sendSuccess(res, "Messages marked as read", {});
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

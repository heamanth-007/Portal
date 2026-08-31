const Holiday = require("../models/Holiday");
const { sendSuccess, sendError } = require("../utils/response");

exports.list = async (req, res) => {
  try {
    const holidays = await Holiday.find();
    return sendSuccess(res, "Holidays", { holidays });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.create = async (req, res) => {
  try {
    const { name, date, type, description } = req.body;
    const h = new Holiday({
      name,
      date,
      type: type ? type.toUpperCase() : "COMPANY",
      description,
    });
    await h.save();
    return sendSuccess(res, "Holiday added", { id: h._id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.update = async (req, res) => {
  try {
    const h = await Holiday.findById(req.params.id);
    if (!h) return sendError(res, "Holiday not found", 404);

    if (req.body.type) {
      req.body.type = req.body.type.toUpperCase();
    }

    Object.assign(h, req.body);
    await h.save();
    return sendSuccess(res, "Holiday updated", { id: h._id });
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

exports.remove = async (req, res) => {
  try {
    const h = await Holiday.findById(req.params.id);
    if (!h) return sendError(res, "Holiday not found", 404);
    await h.deleteOne();
    return sendSuccess(res, "Holiday deleted", {});
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error");
  }
};

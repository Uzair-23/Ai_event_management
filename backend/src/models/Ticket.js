const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  // store Clerk user id (string)
  userId: { type: String, required: true, index: true },
  qrData: { type: String }, // data URL or short token
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Ticket', TicketSchema);

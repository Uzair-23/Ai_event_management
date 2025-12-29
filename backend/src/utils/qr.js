const QRCode = require('qrcode');

// Generate a data URL containing the QR code image for the given text
exports.generateQRCodeDataUrl = async (text) => {
  try {
    return await QRCode.toDataURL(text || '');
  } catch (err) {
    console.error('QR generation error', err.message);
    throw err;
  }
};
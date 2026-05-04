const { saveInternshipToDb } = require('./db');

const saveInternship = async (data, source) => {
  try {
    await saveInternshipToDb(data, source);
  } catch (err) {
    console.error(`[save] DB save failed for ${data.internship?.url}:`, err.message);
    throw err;
  }
};

module.exports = {
  saveInternship,
};

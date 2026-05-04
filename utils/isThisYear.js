/**
 * Returns true if the given date is in the current year.
 * @param {Date|string|number} date - date to check
 * @returns {boolean}
 */
const isThisYear = (date) => {
  if (date == null) return false;
  const d = new Date(date);
  return !isNaN(d.getTime()) && d.getFullYear() === new Date().getFullYear();
};

/**
 * Returns true if the internship's datePosted is in the current year.
 * @param {{ internship?: { datePosted?: Date|string } }} item - scraped item with internship
 * @returns {boolean}
 */
const isPostedThisYear = (item) => isThisYear(item?.internship?.datePosted);

module.exports = { isThisYear, isPostedThisYear };

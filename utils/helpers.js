const validator = require('validator');

const validateEmail = (email) => validator.isEmail(email);
const validatePassword = (password) => password && password.length >= 8;
const sanitizeInput = (input) => validator.escape(input || '');

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const calculateAge = (birthDate, deathDate) => {
  if (!birthDate || !deathDate) return null;
  const birth = new Date(birthDate);
  const death = new Date(deathDate);
  let age = death.getFullYear() - birth.getFullYear();
  const monthDiff = death.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) age--;
  return age;
};

module.exports = { validateEmail, validatePassword, sanitizeInput, formatDate, calculateAge };

/**
 * Utility functions for social media deep linking and contact interactions
 */

/**
 * Creates a WhatsApp deep link with an optional message
 * @param {string} phoneNumber - Phone number in international format without + (e.g., 255759767735)
 * @param {string} message - Optional pre-filled message
 * @returns {string} WhatsApp deep link URL
 */
export const createWhatsAppLink = (phoneNumber, message = '') => {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}${message ? `?text=${encodedMessage}` : ''}`;
};

/**
 * Creates a telephone link
 * @param {string} phoneNumber - Phone number in international format with + (e.g., +255759767735)
 * @returns {string} Telephone link URL
 */
export const createPhoneLink = (phoneNumber) => {
  return `tel:${phoneNumber}`;
};

/**
 * Creates an email link with optional subject and body
 * @param {string} email - Email address
 * @param {string} subject - Optional email subject
 * @param {string} body - Optional email body
 * @returns {string} Email link URL
 */
export const createEmailLink = (email, subject = '', body = '') => {
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  
  return `mailto:${email}${params.length > 0 ? `?${params.join('&')}` : ''}`;
};

/**
 * Creates a Facebook deep link
 * @param {string} username - Facebook username or page ID
 * @returns {string} Facebook deep link URL
 */
export const createFacebookLink = (username) => {
  return `https://facebook.com/${username}`;
};

/**
 * Creates an Instagram deep link
 * @param {string} username - Instagram username
 * @returns {string} Instagram deep link URL
 */
export const createInstagramLink = (username) => {
  return `https://instagram.com/${username}`;
};

/**
 * Creates a Twitter/X deep link
 * @param {string} username - Twitter/X username without @
 * @returns {string} Twitter/X deep link URL
 */
export const createTwitterLink = (username) => {
  return `https://twitter.com/${username}`;
};

/**
 * Creates a LinkedIn deep link
 * @param {string} type - Type of LinkedIn entity ('company', 'profile', etc.)
 * @param {string} identifier - LinkedIn identifier
 * @returns {string} LinkedIn deep link URL
 */
export const createLinkedInLink = (type, identifier) => {
  return `https://linkedin.com/${type}/${identifier}`;
};

/**
 * Creates a Google Maps link for a location
 * @param {string} query - Location query or coordinates
 * @returns {string} Google Maps link URL
 */
export const createGoogleMapsLink = (query) => {
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
};

/**
 * Social media link attributes for security and proper behavior
 * @returns {object} Object with target and rel attributes
 */
export const getSocialLinkAttributes = () => {
  return {
    target: '_blank',
    rel: 'noopener noreferrer'
  };
};

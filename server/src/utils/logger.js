/**
 * Simple structured logger for Trace server.
 * Wraps console with timestamp and level prefixes.
 */

const formatTimestamp = () => new Date().toISOString();

const logger = {
  /**
   * @param {string} message
   * @param {object} [meta]
   */
  info(message, meta) {
    const base = `[${formatTimestamp()}] [INFO] ${message}`;
    if (meta !== undefined) {
      console.log(base, meta);
    } else {
      console.log(base);
    }
  },

  /**
   * @param {string} message
   * @param {object} [meta]
   */
  error(message, meta) {
    const base = `[${formatTimestamp()}] [ERROR] ${message}`;
    if (meta !== undefined) {
      console.error(base, meta);
    } else {
      console.error(base);
    }
  },

  /**
   * @param {string} message
   * @param {object} [meta]
   */
  warn(message, meta) {
    const base = `[${formatTimestamp()}] [WARN] ${message}`;
    if (meta !== undefined) {
      console.warn(base, meta);
    } else {
      console.warn(base);
    }
  },
};

module.exports = logger;

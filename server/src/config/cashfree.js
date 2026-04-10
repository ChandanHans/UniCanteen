const { Cashfree, CFEnvironment } = require("cashfree-pg");

const cashfree = new Cashfree(
  process.env.NODE_ENV === "production" ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

module.exports = cashfree;

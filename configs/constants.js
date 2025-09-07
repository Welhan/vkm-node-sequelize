const dotenv = require("dotenv");
dotenv.config();

const constants = {
  transactionPath: "logs/transactions",
  errorPath: "logs/errors",
  websiteName: "Tutor Website",
  developmentNotes: {
    "v 1.0.0": "Initial release",
  },
  base_url:
    process.env.NODE_APP === "production"
      ? ""
      : `http://localhost:${process.env.APP_PORT}`,
};
module.exports = { constants };

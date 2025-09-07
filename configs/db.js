const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const isProduction = process.env.NODE_APP === "production";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: "localhost",
    dialect: "mysql",
    logging: isProduction ? false : console.log,
    port: process.env.DB_PORT ? process.env.DB_PORT : 3306,
  }
);

module.exports = sequelize;

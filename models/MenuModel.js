const { DataTypes } = require("sequelize");
const sequelize = require("../configs/db");

const Menu = sequelize.define(
  "Menu",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unsigned: true,
    },
    Menu: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Active: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    Icon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    HasSubmenu: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    Url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Add: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    Edit: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
    Delete: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "mst_menu",
  }
);

Menu.runCustomQuery = async function (query, options = {}) {
  return sequelize.query(query, options);
};

module.exports = Menu;

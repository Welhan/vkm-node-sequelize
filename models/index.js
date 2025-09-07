// models/index.js
const sequelize = require("../configs/db");
const Admin = require("./AdminModel");
const Cabang = require("./CabangModel");

Admin.belongsTo(Cabang, { foreignKey: "CabangID" });
Cabang.hasMany(Admin, {
  foreignKey: "CabangID",
  sourceKey: "ID",
});

module.exports = {
  sequelize,
  Admin,
  Cabang,
};

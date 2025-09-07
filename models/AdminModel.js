const { DataTypes } = require("sequelize");
const sequelize = require("../configs/db");

const AdminModel = sequelize.define(
  "Admin",
  {
    ID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unsigned: true,
    },
    NamaDepan: {
      type: DataTypes.STRING(225), // varchar(225)
      allowNull: true,
    },
    NamaBelakang: {
      type: DataTypes.STRING(225), // varchar(225)
      allowNull: true,
    },
    Telp: {
      type: DataTypes.STRING(225), // varchar(225)
      allowNull: true,
    },
    Tgl_Lahir: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    Alamat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    JenisKelamin: {
      type: DataTypes.ENUM("Pria", "Wanita"),
      allowNull: true,
      defaultValue: "Pria",
    },
    Image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    CabangID: {
      type: DataTypes.INTEGER.UNSIGNED,
      // unsigned: true,
      allowNull: false,
    },
    Username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Role: {
      type: DataTypes.ENUM("Owner", "Admin", "CS", "Guru"),
      allowNull: true,
      defaultValue: null,
    },
    Bidang: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    Password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    Percentage: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    Nominal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    Active: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    CreatedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    CreatedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    UpdatedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    UpdatedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    DeletedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    DeletedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "user",
    timestamps: false,
  }
);

AdminModel.runCustomQuery = async function (query, options = {}) {
  return sequelize.query(query, options);
};

AdminModel.getUsersByCabang = async function (cabangID) {
  const sql = `
    SELECT * FROM user 
    WHERE CabangID = :cabangID AND DeletedDate IS NULL
  `;
  return sequelize.query(sql, {
    replacements: { cabangID },
    type: sequelize.QueryTypes.SELECT,
  });
};

module.exports = AdminModel;

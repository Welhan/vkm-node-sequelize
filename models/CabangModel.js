// // AnggotaModel.js
// class CabangModel {
//   constructor(db) {
//     this.db = db;
//   }
//   tableName = "list_cabang";

//   async getAll(cabang = 0, role = "Owner") {
//     let query = `SELECT * FROM ${this.tableName} WHERE 1`;
//     let queryParams = [];
//     if (cabang && role != "Owner") {
//       query += " AND CabangID = ?";
//       queryParams.push(cabang);
//     }
//     query += " ORDER BY ID DESC";
//     const rows = await this.db.query(query, queryParams);
//     return rows;
//   }

//   async getById(id) {
//     const rows = await this.db.query(
//       `SELECT * FROM ${this.tableName} WHERE ID = ?`,
//       [id]
//     );
//     return rows[0];
//   }

//   async getByUsername(username) {
//     const rows = await this.db.query(
//       `SELECT * FROM ${this.tableName} WHERE Username = ?`,
//       [username]
//     );
//     return rows[0];
//   }

//   async create(data) {
//     const { nama, alamat, email } = data;
//     const result = await this.db.query(
//       "INSERT INTO user (nama, alamat, email) VALUES (?, ?, ?)",
//       [nama, alamat, email]
//     );
//     return result.insertId;
//   }

//   async update(id, data) {
//     const { nama, alamat, email } = data;
//     await this.db.query(
//       "UPDATE user SET nama = ?, alamat = ?, email = ? WHERE id = ?",
//       [nama, alamat, email, id]
//     );
//     return true;
//   }

//   async delete(id) {
//     await this.db.query("DELETE FROM user WHERE id = ?", [id]);
//     return true;
//   }
// }

// module.exports = CabangModel;

const { DataTypes } = require("sequelize");
const sequelize = require("../configs/db");

const CabangModel = sequelize.define(
  "Cabang",
  {
    ID: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      // unsigned: true,
    },
    Cabang: {
      type: DataTypes.STRING(225), // varchar(225)
      allowNull: true,
    },
    Telp: {
      type: DataTypes.STRING(225), // varchar(225)
      allowNull: true,
    },
    Alamat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    FlagPusat: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
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
  },
  {
    tableName: "list_cabang",
    timestamps: false,
  }
);

CabangModel.runCustomQuery = async function (query, options = {}) {
  return sequelize.query(query, options);
};

CabangModel.getUsersByCabang = async function (cabangID) {
  const sql = `
    SELECT * FROM user 
    WHERE CabangID = :cabangID AND DeletedDate IS NULL
  `;
  return sequelize.query(sql, {
    replacements: { cabangID },
    type: sequelize.QueryTypes.SELECT,
  });
};

module.exports = CabangModel;

// BidangModel.js
class BidangModel {
  constructor(db) {
    this.db = db;
  }
  tableName = "list_bimbel";

  async getAll(cabang = 0, role = "Owner") {
    let query = `SELECT DISTINCT(Bidang) AS Bidang FROM ${this.tableName} WHERE Aktif = 1`;
    let queryParams = [];
    if (cabang && role != "Owner") {
      query += " AND CabangID = ?";
      queryParams.push(cabang);
    }
    // query += " ORDER BY ID DESC";
    const rows = await this.db.query(query, queryParams);
    return rows;
  }

  async getById(id) {
    const rows = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE ID = ?`,
      [id]
    );
    return rows[0];
  }

  async getByUsername(username) {
    const rows = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE Username = ?`,
      [username]
    );
    return rows[0];
  }

  async create(data) {
    const { nama, alamat, email } = data;
    const result = await this.db.query(
      "INSERT INTO user (nama, alamat, email) VALUES (?, ?, ?)",
      [nama, alamat, email]
    );
    return result.insertId;
  }

  async update(id, data) {
    const { nama, alamat, email } = data;
    await this.db.query(
      "UPDATE user SET nama = ?, alamat = ?, email = ? WHERE id = ?",
      [nama, alamat, email, id]
    );
    return true;
  }

  async delete(id) {
    await this.db.query("DELETE FROM user WHERE id = ?", [id]);
    return true;
  }
}

module.exports = BidangModel;

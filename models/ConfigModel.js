// ConfigModel.js
class ConfigModel {
  constructor(db) {
    this.db = db;
  }
  tableName = "config";

  async getKelas() {
    const rows = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE Config = 'kelas'`
    );
    return rows;
  }
}

module.exports = ConfigModel;

// MuridModel.js
class MuridModel {
  constructor(db) {
    this.db = db;
  }
  tableName = "siswa";

  async getAll() {
    let query = `SELECT A.*, B.Cabang, B.FlagPusat AS PusatF, TIMESTAMPDIFF(YEAR, TglLahir, CURDATE()) AS Umur, CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM tutor_web.jadwal j 
      WHERE j.Siswa = A.Nama
    ) THEN 1
    ELSE 0
  END AS hasJadwal FROM ${this.tableName} A LEFT JOIN list_cabang B ON A.CabangID IS NOT NULL AND A.CabangID = B.ID ORDER BY A.ID DESC`;
    const rows = await this.db.query(query);
    return rows;
  }

  async getById(id) {
    let query = `SELECT A.*, B.Cabang, B.FlagPusat AS PusatF, TIMESTAMPDIFF(YEAR, TglLahir, CURDATE()) AS Umur FROM ${this.tableName} A LEFT JOIN list_cabang B ON A.CabangID IS NOT NULL AND A.CabangID = B.ID WHERE A.ID = ?`;
    let params = [id];
    const rows = await this.db.query(query, [id]);
    return rows[0];
  }

  async getByName(name) {
    const rows = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE Nama = ?`,
      [name]
    );
    return rows[0];
  }

  async create(data) {
    const {
      CabangID,
      Nama,
      Telp,
      Alamat,
      TglLahir,
      JenisKelamin,
      Image,
      Kelas,
      Sekolah,
      Les,
      Guru,
      GuruID,
      Active,
      CreatedBy,
    } = data;
    let params = [];
    params = Array(Object.keys(data).length).fill("?");
    const result = await this.db.query(
      `INSERT INTO ${
        this.tableName
      } (CabangID, Nama, Telp, Alamat, TglLahir, JenisKelamin, Image, Kelas, Sekolah, Les, Guru, GuruID, Active, CreatedBy, CreatedDate) VALUES (${params.join(
        ", "
      )}, NOW())`,
      [
        CabangID,
        Nama,
        Telp,
        Alamat,
        TglLahir,
        JenisKelamin,
        Image,
        Kelas,
        Sekolah,
        Les,
        Guru,
        GuruID,
        Active,
        CreatedBy,
      ]
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

module.exports = MuridModel;

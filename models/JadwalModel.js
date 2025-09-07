// JadwalModel.js
class JadwalModel {
  constructor(db) {
    this.db = db;
  }
  tableName = "jadwal";

  async getForTeacher(username = "", edit = false) {
    let queryParam = [];
    let query = `SELECT 
            Guru,
            Hari,
            DATE_FORMAT(JamLes, '%H:%i') AS Jam,
            GROUP_CONCAT(CONCAT(Bidang, ' - ', Siswa) SEPARATOR ', ') AS Jadwal
            FROM 
            jadwal
            WHERE 
            Hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')`;

    if (!edit) {
      query += " AND Trial = 0";
    }

    if (username) {
      query += " AND Guru = ?";
      queryParam.push(username.trim());
    }

    query += ` GROUP BY 
            Guru, Hari, JamLes
            ORDER BY 
            Guru, FIELD(Hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'), JamLes;`;
    const rows = await this.db.query(query, queryParam);
    return rows;
  }

  async getForStudent(student = "") {
    let query = `SELECT Siswa, Hari, GROUP_CONCAT(CONCAT(
      Bidang, ' - ',
      UPPER(LEFT(Guru, 1)), LOWER(SUBSTRING(Guru, 2)),
      ' (', DATE_FORMAT(JamLes, '%H:%i'), ')'
    ) ORDER BY JamLes SEPARATOR ', ') AS Jadwal FROM ${this.tableName} Where 1`;
    let queryParam = [];

    if (student) {
      query += " AND Siswa = ?";
      queryParam.push(student);
    }

    query += ` AND Hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')
            GROUP BY Siswa, Hari
            ORDER BY Siswa, FIELD(Hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu');`;

    const rows = await this.db.query(query, queryParam);
    return rows;
  }

  async getMuridNotExist(guru = "") {
    let query = `SELECT s.* FROM siswa s LEFT JOIN jadwal j ON j.Siswa = s.Nama WHERE j.ID IS NULL AND (s.DeletedF IS NULL OR s.DeletedF = 0) `;
    let queryParams = [];
    if (guru) {
      query += ` AND FIND_IN_SET(?, s.GuruID)`;
      queryParams.push(guru);
    }

    const rows = await this.db.query(query, queryParams);
    return rows;
  }

  async getAll() {
    const rows = await this.db.query(
      `SELECT A.*, B.Cabang, B.FlagPusat AS PusatF FROM ${this.tableName} A LEFT JOIN list_cabang B ON A.CabangID IS NOT NULL AND A.CabangID = B.ID ORDER BY A.ID DESC`
    );
    return rows;
  }

  async getById(id) {
    const rows = await this.db.query(
      `SELECT A.*, B.Cabang, B.FlagPusat AS PusatF, TIMESTAMPDIFF(YEAR, TglLahir, CURDATE()) AS Umur FROM ${this.tableName} A LEFT JOIN list_cabang B ON A.CabangID IS NOT NULL AND A.CabangID = B.ID WHERE A.ID = ?`,
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
    const { guru, siswa, bidang, hari, jamLes, trial, createdBy } = data;
    let params = [];
    params = Array(Object.keys(data).length).fill("?");
    const result = await this.db.query(
      `INSERT INTO ${
        this.tableName
      } (Guru, Siswa, Bidang, Hari, JamLes, Trial, CreatedBy, CreatedDate) VALUES (${params.join(
        ", "
      )}, NOW())`,
      [guru, siswa, bidang, hari, jamLes, trial, createdBy]
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

module.exports = JadwalModel;

const express = require("express");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { db } = require("../configs/db");
const helpers = require("../helpers/helpers");
const { constants } = require("../configs/constants");
const AdminModel = require("../models/AdminModel");
const MuridModel = require("../models/MuridModel");
const CabangModel = require("../models/CabangModel");
const JadwalModel = require("../models/JadwalModel");
const BidangModel = require("../models/BidangModel");
const ConfigModel = require("../models/ConfigModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
dotenv.config();

const adminModel = new AdminModel(db);
const muridModel = new MuridModel(db);
const cabangModel = new CabangModel(db);
const jadwalModel = new JadwalModel(db);
const bidangModel = new BidangModel(db);
const configModel = new ConfigModel(db);
const saveMuridImg = "public/assets/images/murid";

const muridFolder = path.join(__dirname, "../public/assets/images/murid");
if (!fs.existsSync(muridFolder)) {
  fs.mkdirSync(muridFolder, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets/images/murid");
  },
  filename: function (req, file, cb) {
    const sanitized = file.originalname
      .split(" ")
      .join("_")
      .replace(/[^a-zA-Z0-9_.]/g, "");
    cb(null, sanitized);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const isValid = allowedTypes.test(file.mimetype);
  cb(
    isValid ? null : new Error("Hanya file gambar yang diperbolehkan"),
    isValid
  );
};

const upload = multer({ storage, fileFilter });

uploadMiddleware = upload.single("image");

function formatDate(date, dateTime = true, delimiter = true) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  if (dateTime) {
    if (delimiter) {
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } else {
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
  } else {
    return `${year}-${month}-${day}`;
  }
}

function conditionalUpload(req, res, next) {
  const contentType = req.headers["content-type"] || "";
  const hasFile = contentType.includes("multipart/form-data");

  if (hasFile) {
    upload.single("image")(req, res, next);
  } else {
    next();
  }
}

const deleteFile = (filePath, baseUrl) => {
  let removePath = "public/" + filePath.replace(baseUrl, "");
  if (removePath) {
    try {
      fs.unlinkSync(removePath);
      console.log(`File deleted: ${removePath}`);
    } catch (err) {
      console.error(`Failed to delete file: ${removePath}`, err);
    }
  }
};

module.exports = {
  upload: conditionalUpload,
  index: async function (req, res) {
    if (!req.session.ID) {
      return res.redirect("/");
    }
    let activeUser = await helpers.checkActiveUser(req.session.ID);
    if (!activeUser) {
      req.flash("error", "Akun Anda tidak aktif, silakan hubungi admin.");
      return res.redirect("/logout");
    }
    let UserID = req.session.UserID;
    let akses = await helpers.checkUserAccess(UserID, 1, 2);
    if (!akses) return res.redirect("/");
    let menu = await helpers.generateMenu(UserID);
    let user = await adminModel.getByUsername(UserID);
    menu = await Promise.all(
      menu.map(async (item) => {
        item.submenu = await helpers.generateSubmenu(item.ID, UserID);
        return item;
      })
    );
    let fitur = await helpers.checkFiturAccess(UserID, 1, 1);
    return res.render("murid/murid", {
      successMessage: req.flash("success"),
      errorMessage: req.flash("error"),
      session: req.session,
      menu,
      user,
      fitur:
        fitur.length > 0 ? fitur[0] : { Add: 0, Edit: 0, Delete: 0, Others: 0 },
      title: "Data Murid",
      open: 1,
      active: 2,
      csrfToken: req.csrfToken(),
      constants,
    });
  },
  getDataMurid: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ redirect: "/logout" });
    }
    let UserID = req.session.UserID;
    let akses = await helpers.checkUserAccess(UserID, 1, 1);
    if (!akses) {
      return res.status(200).json({ redirect: "/" });
    }
    let getDataMurid = await muridModel.getAll();
    let fitur = await helpers.checkFiturAccess(UserID, 1, 1);
    return res.json({
      data: getDataMurid,
      fitur:
        fitur.length > 0 ? fitur[0] : { Add: 0, Edit: 0, Delete: 0, Others: 0 },
    });
  },
  profileMurid: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ redirect: "/logout" });
    }
    let UserID = req.session.UserID;
    let akses = await helpers.checkUserAccess(UserID, 1, 1);
    if (!akses) {
      return res.status(200).json({ redirect: "/" });
    }
    let ID = req.body.ID;
    let getData = await muridModel.getById(ID);

    res.render(
      "murid/modals/profile",
      { layout: false, user: getData },
      (err, html) => {
        if (err) {
          console.error("Error rendering template:", err);
        }
        return res.json({
          view: html,
        });
      }
    );
  },
  jadwalMurid: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ redirect: "/logout" });
    }
    let UserID = req.session.UserID;
    let akses = await helpers.checkUserAccess(UserID, 1, 1);
    if (!akses) {
      return res.status(200).json({ redirect: "/" });
    }
    let ID = req.body.ID;
    let murid = await muridModel.getById(ID);
    let jadwal = await jadwalModel.getForStudent(murid.Nama);
    let senin = jadwal.filter(
      (j) => j.Hari && j.Hari.toLowerCase() === "senin"
    );
    let selasa = jadwal.filter(
      (j) => j.Hari && j.Hari.toLowerCase() === "selasa"
    );
    let rabu = jadwal.filter((j) => j.Hari && j.Hari.toLowerCase() === "rabu");
    let kamis = jadwal.filter(
      (j) => j.Hari && j.Hari.toLowerCase() === "kamis"
    );
    let jumat = jadwal.filter(
      (j) => j.Hari && j.Hari.toLowerCase() === "jumat"
    );
    let sabtu = jadwal.filter(
      (j) => j.Hari && j.Hari.toLowerCase() === "sabtu"
    );

    let getData = await muridModel.getById(ID);

    res.render(
      "murid/modals/jadwal",
      {
        layout: false,
        murid: getData,
        senin,
        selasa,
        rabu,
        kamis,
        jumat,
        sabtu,
      },
      (err, html) => {
        if (err) {
          console.error("Error rendering template:", err);
        }
        return res.json({
          view: html,
        });
      }
    );
  },
  getAddMurid: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ logout: "/logout" });
    }
    let user = helpers.checkActiveUser(req.session.ID);
    let getCabang = await cabangModel.getAll(user.CabangID, user.Role);
    let cabangOptions = getCabang.map((cabang) => {
      return { ID: cabang.ID, Name: cabang.Cabang };
    });

    let bidang = await bidangModel.getAll(user.CabangID, user.Role);
    let guru = await adminModel.getAll();
    let guruOption = guru.filter((el) => el.Role == "Guru" && el.Active == 1);
    let kelas = await configModel.getKelas();
    let kelasOptions = kelas.map((c) => {
      return { kelas: c.Value };
    });

    res.cookie("csrfToken", req.csrfToken());
    res.render(
      "murid/modals/newMurid",
      {
        layout: false,
        csrfToken: req.csrfToken(),
        cabang: cabangOptions,
        bidang,
        guru: guruOption,
        kelas: kelasOptions,
      },
      (err, html) => {
        if (err) {
          console.error("Error rendering template:", err);
        }
        return res.json({
          view: html,
        });
      }
    );
  },
  addMurid: async function (req, res) {
    if (!req.session.ID) {
      return res.redirect("/");
    }
    let baseUrl = req.protocol + "://" + req.get("host") + "/";

    let imageUrl = "";
    if (req.file) {
      let originalFileName = req.file.originalname;
      console.log("Original file name:", originalFileName);
      imageUrl =
        baseUrl +
        saveMuridImg.replace("public/", "") +
        "/" +
        originalFileName
          .split(" ")
          .join("_")
          .replace(/[^a-zA-Z0-9_.]/g, "");
    }

    console.log(req.body);
    let nama = helpers.escapeHtml(req.body.name);
    let name2 = helpers.escapeHtml(req.body.name2);
    let telp = helpers.escapeHtml(req.body.telp);
    let alamat = helpers.escapeHtml(req.body.alamat);
    let tglLahir = req.body.tglLahir;
    let jk = helpers.escapeHtml(req.body.jenisKelamin);
    let cabang = helpers.escapeHtml(req.body.cabang);
    let sekolah = helpers.escapeHtml(req.body.sekolah);
    let kelas = helpers.escapeHtml(req.body.kelas);
    let bidang = req.body.bidang;
    let guru = req.body.guru;
    let tiral = req.body.tiral;
    let error = {};
    guru = guru.map((el) => el.replace(/\s+/g, ""));

    if (!nama || !name2) {
      error.Name = "Nama wajib diisi";
    }

    nama = nama + " " + name2;

    if (!telp) {
      error.Telp = "No. Telp wajib diisi";
    }

    if (!tglLahir) {
      error.TglLahir = "Tanggal Lahir wajib diisi";
    }

    let checkMurid = await muridModel.getByName(nama);

    if (checkMurid) {
      error.Name = "Murid sudah terdaftar.";
    }

    if (Object.keys(error).length > 0) {
      try {
        deleteFile(imageUrl, baseUrl);
      } catch (error) {
        console.error("Error deleting file:", error);
      }

      return res.json({ error: error });
    }

    let guruID = [];
    for (const g of guru) {
      const guruData = await adminModel.getByName(g.trim());
      if (guruData && guruData.ID) {
        guruID.push(guruData.Username);
      }
    }

    try {
      let data = {
        CabangID: cabang,
        Nama: nama,
        Telp: telp,
        Alamat: alamat,
        TglLahir: tglLahir,
        JenisKelamin: jk,
        Image: imageUrl,
        Kelas: kelas,
        Sekolah: sekolah,
        Les: bidang,
        Guru: guru.join(","),
        GuruID: guruID.join(","),
        Active: 1,
        CreatedBy: req.session.UserID,
      };
      let insertId = await muridModel.create(data);

      if (insertId) {
        req.flash("success", "User berhasil ditambahkan!");
      } else {
        req.flash("error", "User gagal ditambahkan!");
      }
    } catch (err) {
      console.error("Error in password hashing:", err);
    }

    return res.status(200).json({ status: true });
  },
  getEditAdmin: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ logout: "/logout" });
    }
    let ID = req.body.ID;
    let getData = await adminModel.getById(ID);
    let getCabang = await cabangModel.getAll();
    let cabangOptions = getCabang.map((cabang) => {
      return { ID: cabang.ID, Name: cabang.Cabang };
    });
    res.render(
      "admin/modals/editAdmin",
      {
        layout: false,
        csrfToken: req.csrfToken(),
        user: getData,
        cabang: cabangOptions,
      },
      (err, html) => {
        if (err) {
          console.error("Error rendering template:", err);
        }
        return res.json({
          view: html,
        });
      }
    );
  },
  editAdmin: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ logout: "/logout" });
    }
    let ID = req.body.ID;

    let baseUrl = req.protocol + "://" + req.get("host") + "/";

    let imageUrl = "";
    if (req.file) {
      let originalFileName = req.file.originalname;
      console.log("Original file name:", originalFileName);
      imageUrl =
        baseUrl +
        saveMuridImg.replace("public/", "") +
        "/" +
        originalFileName
          .split(" ")
          .join("_")
          .replace(/[^a-zA-Z0-9_.]/g, "");
    }

    let nama = helpers.escapeHtml(req.body.name);
    let name2 = helpers.escapeHtml(req.body.name2);
    let telp = helpers.escapeHtml(req.body.telp);
    let alamat = helpers.escapeHtml(req.body.alamat);
    let tglLahir = req.body.tglLahir;
    let jk = helpers.escapeHtml(req.body.jenisKelamin);
    let username = helpers.escapeHtml(req.body.username);
    let password = req.body.password;
    let role = helpers.escapeHtml(req.body.role);
    let cabang = helpers.escapeHtml(req.body.cabang);
    let penghasilan = helpers.escapeHtml(req.body.penghasilan);
    let type = helpers.escapeHtml(req.body.type);
    let bidang = helpers.escapeHtml(req.body.bidang);
    let error = {};
    type = type == "persen" ? 1 : 0;

    if (!username) {
      error.Username = "Nama Pengguna wajib diisi";
    }

    if (!password) {
      error.Password = "Kata Sandi wajib diisi";
    }

    if (!nama) {
      error.Name = "Nama wajib diisi";
    }

    let checkUsername = await adminModel.getByUsername(username);

    if (checkUsername) {
      error.Username = "Username sudah terdaftar";
    }

    if (Object.keys(error).length > 0) {
      try {
        deleteFile(imageUrl, baseUrl);
      } catch (error) {
        console.error("Error deleting file:", error);
      }

      return res.json({ error: error });
    }
    password = await bcrypt.hash(password, 10);

    return res.status(200).json({ status: true });
    if (!Username) {
      error.Username = "Nama Pengguna wajib diisi";
    }
    console.log(`Role: ${role}`);

    let adminData = (
      await helpers.doQuery(db, `SELECT * FROM admin WHERE ID = ?`, [ID])
    ).results[0];
    if (adminData.Username != Username) {
      let checkUsernameExist = (
        await helpers.doQuery(db, `SELECT * FROM admin WHERE Username = ?`, [
          Username,
        ])
      ).results;

      if (checkUsernameExist.length > 0) {
        error.Username = "Username sudah terdaftar";
      }
    }
    if (Object.keys(error).length > 0) {
      return res.json({ error: error });
    }
    db.query(
      `UPDATE admin SET Username = ?, Role = ?, UpdateDate = NOW(), UpdatedBy = ? WHERE ID = ?`,
      [Username, role, req.session.ID, ID],
      function (err) {
        if (err) {
          req.flash("error", "Admin gagal diubah!");
          return res.status(202).json({ status: false });
        }
        req.flash("success", "Admin berhasil diubah!");
        return res.status(200).json({ status: true });
      }
    );
  },
  getDeleteAdmin: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ logout: "/logout" });
    }
    let ID = req.body.ID;
    let getData = (
      await helpers.doQuery(
        db,
        `SELECT ID, Username, Email FROM admin WHERE ID = ${ID}`
      )
    ).results[0];
    res.render(
      "admin/modals/deleteAdmin",
      { layout: false, csrfToken: req.csrfToken(), data: getData },
      (err, html) => {
        if (err) {
          console.error("Error rendering template:", err);
        }
        return res.json({
          view: html,
        });
      }
    );
  },
  deleteAdmin: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ logout: "/logout" });
    }
    let ID = req.body.ID;
    db.query(`DELETE FROM admin WHERE ID = ?`, [ID], function (err) {
      if (err) {
        req.flash("error", "Admin gagal dihapus!");
        return res.status(202).json({ status: false });
      }
      req.flash("success", "Admin berhasil dihapus!");
      return res.status(200).json({ status: true });
    });
  },
  getUserAccess: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ logout: "/logout" });
    }
    let ID = req.body.ID;
    let getData = (
      await helpers.doQuery(db, `SELECT Username FROM admin WHERE ID = ?`, [ID])
    ).results;

    let Username = getData.length > 0 ? getData[0].Username : "";
    let menu = await helpers.generateMenu();
    let levelAccess = await helpers.checkUserAccess(Username, 0, 11);
    let otpAccess = await helpers.checkUserAccess(Username, 0, 12);
    menu = await Promise.all(
      menu.map(async (item) => {
        item.submenu = await helpers.generateSubmenu(item.ID);
        item.submenu = await Promise.all(
          item.submenu.map(async (subItem) => {
            subItem.access = await helpers.checkUserAccess(
              Username,
              item.ID,
              subItem.ID
            );
            return subItem;
          })
        );
        return item;
      })
    );
    let data = {
      username: Username,
      menu,
      levelAccess,
      otpAccess,
    };

    res.render(
      "admin/modals/accessAdmin",
      {
        layout: false,
        csrfToken: req.csrfToken(),
        data: data,
        helpers,
      },
      (err, html) => {
        if (err) {
          console.error("Error rendering template:", err);
        }
        return res.json({
          view: html,
        });
      }
    );
  },
  updateUserAccess: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ logout: "/logout" });
    }
    let Username = req.body.Username;
    let SubmenuID = req.body.SubmenuID;
    let View;
    let getDataAccess = (
      await helpers.doQuery(
        db,
        `SELECT View FROM user_access_menu WHERE SubmenuID = ${SubmenuID} AND Username = '${Username}'`
      )
    ).results;
    if (getDataAccess.length > 0) {
      if (getDataAccess[0].View == 1) {
        View = 0;
      } else {
        View = 1;
      }
      db.query(
        `UPDATE user_access_menu SET View = ${View} WHERE SubmenuID = ${SubmenuID} AND Username = '${Username}'`,
        function (err) {
          if (err) {
            console.log(err);
            return res.status(202).json({ status: false });
          }
          return res.status(200).json({ status: true });
        }
      );
    } else {
      let MenuID = (
        await helpers.doQuery(
          db,
          `SELECT MenuID FROM mst_submenu WHERE ID = ${SubmenuID}`
        )
      ).results[0].MenuID;
      let query = `INSERT INTO user_access_menu (Username, MenuID, SubmenuID, View) VALUE (?,?,?,?)`;
      let queryValues = [Username, MenuID, SubmenuID, 1];
      db.query(query, queryValues, function (err) {
        if (err) {
          console.log(err);
          return res.status(202).json({ status: false });
        }
        return res.status(200).json({ status: true });
      });
    }
  },
};

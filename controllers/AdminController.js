const express = require("express");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const axios = require("axios");
const { db } = require("../configs/db");
const helpers = require("../helpers/helpers");
const { constants } = require("../configs/constants");
const AdminModel = require("../models/AdminModel");
const CabangModel = require("../models/CabangModel");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sequelize = require("../configs/db");
dotenv.config();

const saveUserImg = "public/assets/images/user";

const userFolder = path.join(__dirname, "../public/assets/images/user");
if (!fs.existsSync(userFolder)) {
  fs.mkdirSync(userFolder, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/assets/images/user");
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
    let akses = await helpers.checkUserAccess(UserID, 1, 1);
    if (!akses) return res.redirect("/");
    let menu = await helpers.generateMenu(UserID);
    let user = await AdminModel.findOne({ where: { Username: UserID } });
    menu = await Promise.all(
      menu.map(async (item) => {
        item.submenu = await helpers.generateSubmenu(item.ID, UserID);
        return item;
      })
    );
    let fitur = await helpers.checkFiturAccess(UserID, 1, 1);
    return res.render("admin/admin", {
      successMessage: req.flash("success"),
      errorMessage: req.flash("error"),
      session: req.session,
      menu,
      user,
      fitur: fitur ? fitur : { Add: 0, Edit: 0, Delete: 0, Others: 0 },
      title: "Data Karyawan",
      open: 1,
      active: 1,
      csrfToken: req.csrfToken(),
      constants,
    });
  },
  getDataAdmin: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ redirect: "/logout" });
    }
    let UserID = req.session.UserID;
    let akses = await helpers.checkUserAccess(UserID, 1, 1);
    if (!akses) {
      return res.status(200).json({ redirect: "/" });
    }
    let getDataAdmin = await AdminModel.findAll({
      order: [["ID", "DESC"]],
      include: [
        {
          model: CabangModel,
          as: "Cabang",
          attributes: ["Cabang", "FlagPusat"],
          required: false,
        },
      ],
      attributes: [
        "ID",
        "NamaDepan",
        "NamaBelakang",
        "Username",
        "Image",
        "Telp",
        "Active",
        "Role",
        [sequelize.col("Cabang.FlagPusat"), "FlagPusat"],
        [sequelize.col("Cabang.Cabang"), "CabangName"],
      ],
    });
    let fitur = await helpers.checkFiturAccess(UserID, 1, 1);
    return res.json({
      data: getDataAdmin,
      fitur: fitur ? fitur : { Add: 0, Edit: 0, Delete: 0, Others: 0 },
    });
  },
  getAddAdmin: async function (req, res) {
    if (!req.session.ID) {
      return res.status(200).json({ logout: "/logout" });
    }
    let getCabang = await CabangModel.findAll({
      where: { Active: 1 },
      order: [["ID", "DESC"]],
    });
    let cabangOptions = getCabang.map((cabang) => {
      return { ID: cabang.ID, Name: cabang.Cabang };
    });
    res.cookie("csrfToken", req.csrfToken());
    res.render(
      "admin/modals/newAdmin",
      { layout: false, csrfToken: req.csrfToken(), cabang: cabangOptions },
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
  addAdmin: async function (req, res) {
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
        saveUserImg.replace("public/", "") +
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

    let checkUsername = await AdminModel.count({
      where: { Username: username },
    });

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

    try {
      let newAdmin = await AdminModel.create({
        NamaDepan: nama,
        NamaBelakang: name2,
        Telp: telp,
        Tgl_Lahir: tglLahir,
        Alamat: alamat,
        JenisKelamin: jk,
        Image: imageUrl,
        CabangID: cabang,
        Username: username,
        Password: password,
        Role: role,
        Bidang: bidang,
        Percentage: type,
        Nominal: penghasilan,
        CreatedBy: req.session.UserID,
        CreatedDate: new Date(),
      });

      if (newAdmin.ID) {
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
    let getData = await AdminModel.findByPk(ID);
    let getCabang = await CabangModel.findAll({
      where: { Active: 1 },
      order: [["ID", "DESC"]],
      raw: true,
    });
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
        saveUserImg.replace("public/", "") +
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
  guruByCabangBidang: async function (req, res) {
    if (!req.session.ID) {
      return res.json({ redirect: "/logout" });
    }
    let activeUser = await helpers.checkActiveUser(req.session.ID);
    if (!activeUser) {
      return res.json({ redirect: "/logout" });
    }
    let UserID = req.session.UserID;
    let akses = await helpers.checkUserAccess(UserID, 1, 2);
    if (!akses) return res.json({ redirect: "/" });
    let cabang = req.body.cabang;
    let bidang = req.body.bidang;

    let result = await adminModel.guruByBidang(cabang, bidang);
    return res.json({
      data: result,
    });
  },
};

const express = require("express");
const router = express.Router();
const DashboardController = require("../controllers/DashboardController");
const AuthController = require("../controllers/AuthController");
const UploadController = require("../controllers/UploadController");
const AdminController = require("../controllers/AdminController");
const MuridController = require("../controllers/MuridController");
const SettingsController = require("../controllers/SettingsController");
const JadwalController = require("../controllers/JadwalController");
const BidangController = require("../controllers/BidangController");
const { uploadImage, uploadXlsx } = require("../configs/multer");
const multer = require("multer");
const crypto = require("crypto");
const csrf = require("csurf");
const csrfProtection = csrf({ cookie: true });

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let bannerPathMobile = "public/uploads/banner/mobile/";
    let bannerPathDesktop = "public/uploads/banner/desktop/";
    if (req.session.ID) {
      let isImage = file.mimetype.startsWith("image/");
      if (isImage) {
        if (file.fieldname === "imageMobile") {
          cb(null, bannerPathMobile);
        } else if (file.fieldname === "imageBanner") {
          cb(null, bannerPathDesktop);
        } else {
          cb(new Error("Unknown fieldname"), false);
        }
      } else {
        cb(new Error("File is not an image"), false);
      }
    } else {
      cb(new Error("No session ID"), false);
    }
  },
  filename: function (req, file, cb) {
    const randomString = crypto.randomBytes(16).toString("hex");
    const fileExtension = file.originalname.split(".").pop();
    cb(null, `${randomString}.${fileExtension}`);
  },
});
var upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.get("/", DashboardController.index);
router.get("/dashboard", DashboardController.index);
router.get("/login", AuthController.login);
router.post("/auth", AuthController.auth);
router.get("/logout", AuthController.logout);

//change password
router.post("/getChangePassword", AuthController.getChangePassword);
router.post("/changePassword", AuthController.changePassword);

//admin
router.get("/user", AdminController.index);
router.post("/getDataUser", AdminController.getDataAdmin);
router.post("/getAddUser", csrfProtection, AdminController.getAddAdmin);
router.post(
  "/addUser",
  AdminController.upload,
  csrfProtection,
  AdminController.addAdmin
);
router.post("/getEditUser", AdminController.getEditAdmin);
router.post(
  "/editUser",
  AdminController.upload,
  csrfProtection,
  AdminController.editAdmin
);
router.post("/getDeleteUser", AdminController.getDeleteAdmin);
router.post("/deleteUser", AdminController.deleteAdmin);
router.post("/getAccessUser", AdminController.getUserAccess);
router.post("/updateUserUser", AdminController.updateUserAccess);
router.post("/getGuruByCabangBidang", AdminController.guruByCabangBidang);

// murid
router.get("/murid", MuridController.index);
router.post("/getDataMurid", MuridController.getDataMurid);
router.post("/getAddMurid", csrfProtection, MuridController.getAddMurid);
router.post(
  "/addMurid",
  MuridController.upload,
  csrfProtection,
  MuridController.addMurid
);
router.post("/getProfileMurid", csrfProtection, MuridController.profileMurid);
router.post("/getJadwalMurid", csrfProtection, MuridController.jadwalMurid);

// jadwal
router.get("/jadwalTutor", JadwalController.index);
router.post("/getDataJadwal", JadwalController.getDataJadwal);
router.post("/getAddJadwal", JadwalController.getAddJadwal);
router.post("/getBidangJadwal", JadwalController.getBidangMurid);
router.post("/newJadwal", JadwalController.newJadwal);
router.post("/getEditJadwal", csrfProtection, JadwalController.getEditJadwal);

// bidang
router.post("/getBidangByCabang", BidangController.bidangByCabang);

// uploads
router.post("/getDataTop50", UploadController.getDataTop50);
router.post("/dataTop50", UploadController.dataTop50);
router.post("/getDataTopSlot", UploadController.getDataTopSlot);
router.post("/dataTopSlot", UploadController.dataTopSlot);
router.post("/getDataTopCasino", UploadController.getDataTopCasino);
router.post("/dataTopCasino", UploadController.dataTopCasino);
router.post("/getDataTopWD", UploadController.getDataTopWD);
router.post("/dataTopWD", UploadController.dataTopWD);
router.get("/getDataTop200", UploadController.dataTop200);

// upload
router.post(
  "/upload-xslx-process-leads",
  uploadXlsx.single("xslx"),
  UploadController.uploadXslxLeadsProcess
);
router.post("/getUploadLeadsProcess", UploadController.getUploadLeadsProcess);
router.get("/getTemplate", UploadController.templateUpload);

router.get("/settings", SettingsController.index);
router.post("/save-setting", SettingsController.updateSetting);

module.exports = router;

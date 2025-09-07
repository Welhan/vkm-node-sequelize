const express = require("express");
const app = express();
const session = require("express-session");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const dotenv = require("dotenv");
const { db } = require("./configs/db");
var methodOverride = require("method-override");
const path = require("path");
const con = require("./configs/db");
const expressLayouts = require("express-ejs-layouts");
const helpers = require("./helpers/helpers");
const { constants } = require("./configs/constants");
const csrf = require("csurf");
const axios = require("axios");
const http = require("http");
const https = require("https");
const cookieParser = require("cookie-parser");
const pkg = require("./package.json");
const bcrypt = require("bcrypt");
const sequelize = require("./configs/db");
dotenv.config();

// Middleware setup
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "",
    resave: false,
    saveUninitialized: true,
    rolling: true,
    cookie: {
      // maxAge: 5 * 60 * 1000, // 5 menit dalam milidetik
      sameSite: "lax",
    },
  })
);
app.use(flash());
app.use(express.static(path.join(__dirname, "public")));
// app.use("/public", express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(expressLayouts);
app.set("layout", "layout/layout");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
const timer = (ms) => new Promise((res) => setTimeout(res, ms));
const csrfProtection = csrf({ cookie: true });
const excludePaths = [];

app.use(cookieParser());
app.use((req, res, next) => {
  res.locals.versioning = pkg.version;
  res.locals.helpers = helpers;
  res.locals.session = req.session;
  req.con = con;
  if (excludePaths.includes(req.path)) {
    next();
  } else {
    csrfProtection(req, res, next);
  }
});

app.use((err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN") {
    console.error("CSRF token error:", err.code);
    res.status(403).send("Form tampered with");
  } else {
    next(err);
  }
});
const index = require("./routes/route.js");
app.use("/", index);

let port = process.env.node_app == "production" ? 2053 : 3003;
let server = "";
let optionsSSL = "";
let httpsAgent;
if (process.env.node_app == "production") {
  optionsSSL = {
    ca: fs.readFileSync("./config/ca_bundle.crt"),
    key: fs.readFileSync("./config/private.key"),
    cert: fs.readFileSync("./config/certificate.crt"),
  };
  httpsAgent = new https.Agent({
    rejectUnauthorized: false,
    ca: fs.readFileSync("./config/ca_bundle.crt"),
    key: fs.readFileSync("./config/private.key"),
    cert: fs.readFileSync("./config/certificate.crt"),
  });
  server = https.createServer(optionsSSL, app);
} else {
  server = http.createServer(app);
}
// server.listen(port, function () {});
sequelize
  .sync({ alter: false }) // alter: true untuk development
  .then(() => {
    // console.log("Database & tabel tersinkron.");
    app.listen(port, () => {
      // console.log(`Server berjalan di http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Gagal koneksi database:", err);
  });

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
const { uploadImage, uploadXlsx } = require("./configs/multer");
const reader = require("xlsx");
const fs = require("fs");
const { Worker } = require("worker_threads");

app.post(
  "/upload-xslx-process-leadss",
  uploadXlsx.single("xslx"),
  (req, res) => {
    let Username = req.session.Username;
    if (!Username) return res.redirect("/login");
    let attachment = req.file;
    let file = reader.readFile("./public/uploads/xlsx/" + req.file.filename);
    let fileData = "./public/uploads/xlsx/" + req.file.filename;
    let dataTop50 = new Array();
    let dataGame = new Array();
    new Promise((resolve, reject) => {
      try {
        let errMsg = new Array();
        let errTemplate = new Array();
        let errTop50 = false;
        let errGame = false;
        let TotalData = 0;
        file.SheetNames.forEach(async (sheetName) => {
          if (sheetName == "Top 50") {
            let sheetData = reader.utils.sheet_to_json(file.Sheets[sheetName]);
            let headers = Object.keys(sheetData[0]);
            if (headers.length >= 4) {
              if (
                headers[0] !== "Player" ||
                headers[1] !== "Loyalty" ||
                headers[2] !== "Turnover" ||
                headers[3] !== "Fake Account"
              ) {
                errTop50 = true;
                let error = {
                  error: `Template Leaderboard Top50 Tidak Sesuai`,
                };
                errTemplate.push(error);
              } else {
                TotalData += sheetData.length;
              }
            } else {
              errTop50 = true;
              let error = { error: `Template Leaderboard Top50 Tidak Sesuai` };
              errTemplate.push(error);
            }
          } else if (sheetName == "Game") {
            let sheetData = reader.utils.sheet_to_json(file.Sheets[sheetName]);
            let headers = Object.keys(sheetData[0]);
            if (headers.length >= 4) {
              if (
                headers[0] != "Player" ||
                headers[1] != "Slot" ||
                headers[2] != "Casino" ||
                headers[3] != "Fake Account"
              ) {
                errGame = true;
                let error = { error: `Template Leaderboard Game Tidak Sesuai` };
                errTemplate.push(error);
              } else {
                TotalData += sheetData.length * 2;
              }
            } else {
              errGame = true;
              let error = { error: `Template Leaderboard Game Tidak Sesuai` };
              errTemplate.push(error);
            }
          }
        });
        if (errTemplate.length == 2) {
          req.flash(
            "error",
            "Template Leaderboard Top50 dan Game tidak sesuai"
          );
          return res.redirect("/upload-leaderboard");
        } else if (errTop50) {
          req.flash("error", "Template Leaderboard Top50 tidak sesuai");
          return res.redirect("/upload-leaderboard");
        } else if (errGame) {
          req.flash("error", "Template Leaderboard Game tidak sesuai");
          return res.redirect("/upload-leaderboard");
        } else {
          db.query(
            `INSERT INTO files (UploadFor, TotalData,CUserID,CDate) VALUE ('Leaderboard',${TotalData},${req.session.ID}, NOW())`,
            async function (err, results) {
              if (err) {
                req.flash("error", "Upload XLSX gagal!");
                return res.redirect("/upload-leaderboard");
              }
              req.session.FileID = results.insertId;
              req.flash("success", "Uploading...");
              res.redirect("/upload-leaderboard");
              const worker = new Worker(path.resolve(__dirname, "worker.js"), {
                workerData: { file, insertId: results.insertId },
              });

              worker.on("message", (result) => {
                console.log(result);
              });

              worker.on("error", (err) => {
                console.log(err);
              });

              worker.on("exit", (code) => {
                if (code !== 0) {
                  console.error(`Worker stopped with exit code ${code}`);
                }
              });
              resolve();
            }
          );
        }
      } catch (error) {
        reject(error);
      }
    });
    fs.unlink(fileData, (err) => {});
  }
);

const forge = require("node-forge");

function generateKeyPair() {
  const keyPair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
  fs.writeFileSync(
    "private_key.pem",
    forge.pki.privateKeyToPem(keyPair.privateKey)
  );
  fs.writeFileSync(
    "public_key.pem",
    forge.pki.publicKeyToPem(keyPair.publicKey)
  );
  createAdmin();
  console.log("Keys generated and saved.");
}
// generateKeyPair();
createAdmin();
async function createAdmin() {
  let AdminModel = require("./models/AdminModel");
  let checkUser = await AdminModel.count();
  if (checkUser == 0) {
    let password = await bcrypt.hash("admin123", 10);
    await AdminModel.create({
      NamaDepan: "Admin",
      Username: "admin",
      Role: "Owner",
      Active: 1,
      CabangID: 1,
      Password: password,
      CreatedBy: "admin",
      CreatedDate: new Date(),
    });
  }
}
const cron = require("node-cron");

cron.schedule("*/5 * * * *", () => {
  // weeklyQuest();
  // weeklyQuestProcess();
  // withdrawProcess();
});

cron.schedule("0 12 * * *", () => {
  // withdrawProcess();
});

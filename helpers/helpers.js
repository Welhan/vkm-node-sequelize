const { resolve } = require("path");
const { db } = require("../configs/db.js");
const axios = require("axios");
const { constants } = require("../configs/constants");
const moment = require("moment");
const os = require("os");
const fs = require("fs");
const sequelize = require("../configs/db");

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  // doQuery: async function (conn, sql, args) {
  //   return new Promise((resolve, reject) => {
  //     conn.query(sql, args, (error, results, fields) => {
  //       if (error) {
  //         reject(error);
  //       } else {
  //         resolve({ results, fields });
  //       }
  //     });
  //   });
  // },
  formatDate: async function (date, dateTime = true, delimiter = true) {
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
  },
  syncMenu: async function () {
    return await this.generateMenu();
  },
  syncSubmenu: async function (menuid) {
    return await this.generateSubmenu(menuid);
  },
  generateMenu: async function (username = "") {
    let query = `SELECT * FROM mst_menu WHERE Active = 1`;

    if (username) {
      query = `SELECT DISTINCT A.ID, A.Menu, A.Icon, A.Url
        FROM mst_menu A
        LEFT JOIN mst_submenu B ON A.HasSubmenu = 1 AND B.MenuID = A.ID
        RIGHT JOIN user_access_menu C ON A.ID = C.MenuID
        WHERE A.Active = 1 AND C.Username = '${username}' AND C.View = 1`;
    }
    const [results] = await sequelize.query(query);
    return results;
  },
  generateSubmenu: async function (menuid, username = "") {
    let query = `SELECT * FROM mst_submenu WHERE MenuID = ${menuid}`;

    if (username) {
      query = `SELECT A.ID, A.Submenu, A.Url, B.SubmenuID FROM mst_submenu A
        RIGHT JOIN user_access_menu B ON A.ID = B.SubmenuID
        RIGHT JOIN mst_menu C on C.HasSubmenu = 1 AND B.MenuID = C.ID
        WHERE A.MenuID = '${menuid}' AND B.Username = '${username}' AND C.Active = 1 AND A.Active = 1 AND B.View = 1 ORDER BY C.ID ASC;`;
    }
    const [results] = await sequelize.query(query);
    return results;
  },
  log_update: async function (status, log, UserID) {
    let formattedDate = moment().utcOffset("+0700").format("DD-MM-YYYY");
    let formattedTime = moment().utcOffset("+0700").format("HH:mm:ss");
    let filePath =
      status == "success" ? constants.transactionPath : constants.errorPath;
    // let path =
    //   status == "success"
    //     ? "logs/transactions/Transaction"
    //     : "logs/errors/Error";
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, (err) => {
        if (err) {
          return console.log(err);
        }
      });
    }
    if (!fs.existsSync(`${path} - ${formattedDate}.txt`)) {
      if (UserID) {
        fs.appendFileSync(
          `${path} - ${formattedDate}.txt`,
          `[${formattedTime}] ${log} 'UserID = ${UserID} '${os.EOL}`,
          "utf-8",
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      } else {
        fs.appendFileSync(
          `${path} - ${formattedDate}.txt`,
          `[${formattedTime}] ${log} ${os.EOL}`,
          "utf-8",
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      }
    } else {
      if (UserID) {
        fs.appendFileSync(
          `${path} - ${formattedDate}.txt`,
          `[${formattedTime}] ${log} 'UserID = ${UserID} '${os.EOL}`,
          "utf-8",
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      } else {
        fs.appendFileSync(
          `${path} - ${formattedDate}.txt`,
          `[${formattedTime}] ${log} ${os.EOL}`,
          "utf-8",
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      }
    }
  },
  activity: async function (status, log, UserID) {
    let formattedDate = moment().utcOffset("+0700").format("DD-MM-YYYY");
    let formattedTime = moment().utcOffset("+0700").format("HH:mm:ss");
    let filePath = "logs/activity";
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, (err) => {
        if (err) {
          return console.log(err);
        }
      });
    }
    if (!fs.existsSync(`${path} - ${formattedDate}.txt`)) {
      if (UserID) {
        fs.appendFileSync(
          `${path} - ${formattedDate}.txt`,
          `[${formattedTime}] ${log} 'UserID = ${UserID} '${os.EOL}`,
          "utf-8",
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      } else {
        fs.appendFileSync(
          `${path} - ${formattedDate}.txt`,
          `[${formattedTime}] ${log} ${os.EOL}`,
          "utf-8",
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      }
    } else {
      if (UserID) {
        fs.appendFileSync(
          `${path} - ${formattedDate}.txt`,
          `[${formattedTime}] ${log} 'UserID = ${UserID} '${os.EOL}`,
          "utf-8",
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      } else {
        fs.appendFileSync(
          `${path} - ${formattedDate}.txt`,
          `[${formattedTime}] ${log} ${os.EOL}`,
          "utf-8",
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      }
    }
  },
  formatToIndonesianNumber: function (number) {
    const units = [
      { value: 1e9, label: "miliar" },
      { value: 1e6, label: "juta" },
      { value: 1e3, label: "ribu" },
    ];

    for (const unit of units) {
      if (number >= unit.value) {
        const formattedNumber = (number / unit.value).toLocaleString("id-ID", {
          maximumFractionDigits: 2,
        });
        return `${formattedNumber} ${unit.label}`;
      }
    }

    return number.toLocaleString("id-ID");
  },
  reverseIndonesianNumber: function (formattedString) {
    const units = {
      miliar: 1e9,
      juta: 1e6,
      ribu: 1e3,
    };

    const parts = formattedString.split(" ");

    if (parts.length === 1) {
      return parts[0];
    }

    const [numberString, unitLabel] = parts;
    const multiplier = units[unitLabel.toLowerCase()];

    if (!multiplier) {
      throw new Error(
        "Label satuan tidak dikenal. Gunakan 'ribu', 'juta', atau 'miliar'."
      );
    }

    const numericValue = parseFloat(numberString.replace(",", "."));
    return numericValue * multiplier;
  },
  escapeHtml: function (text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, function (m) {
      return map[m];
    });
  },
  checkUserAccess: async function (username, menuID, submenuID) {
    let query = `SELECT A.* FROM user_access_menu A LEFT JOIN mst_menu B ON A.MenuID = B.ID 
    WHERE A.Username = :username 
    AND A.MenuID = :menuID 
    AND A.SubmenuID = :submenuID 
    AND A.View = 1 
    AND (B.ID IS NULL OR B.Active = 1)`;
    const [results] = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        username: username,
        menuID: menuID,
        submenuID: submenuID,
      },
    });
    return results ? true : false;
  },
  checkFiturAccess: async function (username, menuID, submenuID) {
    let query = `SELECT * FROM user_access_menu WHERE Username = :username AND MenuID = :menuID AND SubmenuID = :submenuID AND View = 1`;
    const [results] = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      replacements: {
        username: username,
        menuID: menuID,
        submenuID: submenuID,
      },
    });
    return results;
  },
  checkActiveUser: async function (id) {
    let query = `SELECT * FROM user WHERE ID = :id AND Active = 1`;
    const [results] = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
      replacements: { id: id },
    });
    return results;
  },
  getCabang: async function (id) {
    return;
  },
  dateFormate: function (dateTime, time = false) {
    const tgl = new Date(dateTime);
    tgl.setMinutes(tgl.getMinutes() - tgl.getTimezoneOffset());
    if (time === true) {
      return tgl.toISOString();
    }
    return tgl.toISOString().slice(0, 10);
  },
};

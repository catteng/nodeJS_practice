const express = require("express");
const { now } = require("moment-timezone");
const moment = require("moment-timezone");
const db = require("./../modules/db_connect2");
const upload = require("./../modules/upload-imgs");

const router = express.Router();

router.use((req, res, next) => {
  // if (!req.session.admin) {
  //   return res.redirect("login");
  // }
  next();
});

const getListData = async (req) => {
  let redirect = "";
  const perPage = 25;
  let page = +req.query.page || 1;
  let sqlWhere = " WHERE 1 "; // 條件式的開頭
  let search = req.query.search;
  if (search && search.trim()) {
    search = search.trim(); // 去掉頭尾空白

    const searchEsc = db.escape("%" + search + "%");
    sqlWhere += ` AND \`name\` LIKE ${searchEsc} `;
  }
  console.log({ sqlWhere });
  page = parseInt(page);

  if (page < 1) {
    redirect = req.baseUrl; // 設定要轉向的 URL
  }
  // 算總筆數
  const [[{ totalRows }]] = await db.query(
    `SELECT COUNT(1) totalRows FROM address_book ${sqlWhere} `
  );
  const totalPages = Math.ceil(totalRows / perPage); // 總頁數

  let rows = [];
  if (totalRows > 0) {
    if (page > totalPages) {
      redirect = req.baseUrl + `?page=` + totalPages;
    }
    const sql = `SELECT * FROM address_book 
      ${sqlWhere}
      ORDER BY sid ASC 
      LIMIT ${(page - 1) * perPage}, ${perPage}`;

    // return res.send(sql); // SQL 除錯方式之一
    [rows] = await db.query(sql);
  }
  // 轉換 Date 類型的物件變成格式化的字串
  const fm = "YYYY-MM-DD";
  rows.forEach((v) => {
    v.birthday = moment(v.birthday).format(fm);
  });

  return {
    totalRows,
    totalPages,
    perPage,
    page,
    rows,
    redirect,
  };
};

router.get("/edit/:sid", async (req, res) => {
  const sql = "SELECT * FROM address_book WHERE sid=?";

  const [rows] = await db.query(sql, [req.params.sid]);

  if (rows.length) {
    // res.json(rows[0]);
    res.render("address-book/edit", {
      ...rows[0],
      Referer: req.get("Referer") || "",
    });
  } else {
    res.redirect(req.baseUrl);
  }
});

router.put("/edit/:sid", upload.none(), async (req, res) => {
  // res.json({});const sid = req.params.sid;
  const sid = req.params.sid;
  let { name, email, mobile, birthday, address } = req.body;

  // TODO: 檢查表單各欄位的資料

  if (!moment(birthday).isValid()) {
    birthday = null;
  } else {
    birthday = moment(birthday).format("YYYY-MM-DD");
  }

  const sql =
    "UPDATE `address_book` SET `name`=?,`email`=?,`mobile`=?,`birthday`=?,`address`=? WHERE `sid`=? ";

  const [result] = await db.query(sql, [
    name,
    email,
    mobile,
    birthday,
    address,
    sid,
  ]);

  res.json({
    success: !!result.changedRows,
    formData: req.body,
    result,
  });
});

router.delete("/:sid", async (req, res) => {
  //req.params.sid
  const sql = "DELETE FROM address_book WHERE sid=?";
  const [result] = await db.query(sql, [req.params.sid]);
  res.json(result);
});

router.get("/add", async (req, res) => {
  res.render("address-book/add", { pageName: "ab-add" }); // 呈現表單
});

router.post("/add", upload.none(), async (req, res) => {
  let { name, email, mobile, birthday, address } = req.body;

  if (!moment(birthday).isValid()) {
    birthday = null;
  } else {
    birthday = moment(birthday).format("YYYY-MM-DD");
  }

  const sql =
    "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`) VALUES (?,?,?,?,?,NOW())";
  const [result] = await db.query(sql, [
    name,
    email,
    mobile,
    birthday,
    address,
  ]);

  res.json({
    success: !!result.affectedRows,
    postData: req.body,
    result,
  });
});

router.get("/", async (req, res) => {
  const output = await getListData(req);
  if (output.redirect) {
    return res.redirect(output.redirect);
  }
  res.render("address-book/list", output);
});

router.get("/api", async (req, res) => {
  res.json(await getListData(req));
});
module.exports = router;

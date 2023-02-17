if (process.argv[2] && process.argv[2] === "production") {
  require("dotenv").config({
    path: "./production.env",
  });
} else {
  require("dotenv").config({
    path: "./dev.env",
  });
}

const express = require("express");
const Jimp = require("jimp");
const moment = require("moment-timezone");
// const multer = require("multer");
// const upload = multer({ dest: "tmp_uploads/" });
const upload = require("./modules/upload-imgs");
const db = require("./modules/db_connect2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MysqlStore = require("express-mysql-session")(session);
const sessionStore = new MysqlStore({}, db);

const app = express();

app.get("/try-moment", (req, res) => {
  const formatTime = "YYYY-MM-DD HH:mm:ss";
  const m1 = moment(); //當下
  const m2 = moment("2023-03-30");
  res.json({
    m1a: m1.format(formatTime),
    m1b: m1.tz("Europe/London").format(formatTime),
    m1c: m1.tz("Asia/Tokyo").format(formatTime),
    m2isValid: m2.isValid(),
  });
});

app.set("view engine", "ejs");

// top-level middlewares
app.use(
  session({
    saveUninitialized: false,
    resave: false,
    secret: "jdkfksd8934-@_75634kjdkjfdkssdfg",
    store: sessionStore,
    cookie: {
      // maxAge: 1200_000,
    },
  })
);
app.get("/try-sess", (req, res) => {
  req.session.myVar = req.session.myVar || 0;
  req.session.myVar++;
  res.json(req.session);
});

// app.get("/a.html", (req, res) => {
//   res.send("假的 a.html");
// });

//top-level middlewares
// app.use(cors());
const corsOptions = {
  credentials: true,
  origin: function (origin, cb) {
    console.log({ origin });
    cb(null, true);
  },
};
+app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use((req, res, next) => {
  res.locals.title = `wei's website`;
  res.locals.pageName = "";

  res.locals.myToDateString = (d) => moment(d).format("YYYY-MM-DD");
  res.locals.myToDatetimeString = (d) =>
    moment(d).format("YYYY-MM-DD HH:mm:ss");
  res.locals.session = req.session; //把session傳給ejs
  next();
});

//routes路由
// app.get("/", (req, res) => {
//   res.render("main", { name: "weiwei" });
// });

app.get("/", (req, res) => {
  res.locals.title = "首頁 - " + res.locals.title;
  res.render("main", { name: `wei` });
});

app.get("/sales-json", (req, res) => {
  const sales = require(__dirname + "/data/sales");
  console.log(sales);
  // res.json(sales);
  res.render("sales-json", { sales, title: "業務員資料" });
});

app.get("/try-qs", (req, res) => {
  res.json(req.query);
});

var urlencodedParser = express.urlencoded({ extended: false });
app.post("/try-post", urlencodedParser, (req, res) => {
  res.json(req.body);
});

app.get("/try-post-form", (req, res) => {
  res.render("try-post-form", { account: "", password: "" });
});
app.post("/try-post-form", (req, res) => {
  console.log("req.files:", req.files);
  res.render("try-post-form", req.body);
});

app.post("/try-upload", upload.single("avatar"), (req, res) => {
  console.log("req.files:", req.files);
  res.json(req.file);
});

app.post("/try-uploads", upload.array("photos", 5), (req, res) => {
  // res.json(req.files);
  res.json({
    body: req.body,
    files: req.files,
  });
});

app.get("/try-db", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM address_book LIMIT 5");
  res.json(rows);
});

app.get("/p1/:action?/id?", (req, res) => {
  res.json(req.params);
});
app.use(require("./routes/admin2")); // router 當作 middleware
app.use("/admin", require("./routes/admin2")); // router 當作 middleware

app.use("/address-book", require("./routes/address-book"));

app.get("/login", async (req, res) => {
  res.render("login"); // 呈現登入的表單
});
app.post("/login", async (req, res) => {
  const output = {
    success: false,
    error: "帳號或密碼錯誤 !!!",
    code: 0,
    postData: req.body,
  };

  const sql = "SELECT * FROM admin WHERE account=?";

  const [rows] = await db.query(sql, [req.body.account]);
  if (!rows.length) {
    // 帳號是錯的
    output.code = 401;
    return res.json(output);
  }

  if (!(await bcrypt.compare(req.body.password, rows[0].password_hash))) {
    // 密碼是錯的
    output.code = 402;
  } else {
    output.success = true;
    output.code = 200;
    output.error = "";

    req.session.admin = {
      sid: rows[0].sid,
      account: rows[0].account,
    };
  }
  res.json(output);
});
app.get("/logout", async (req, res) => {
  delete req.session.admin;
  res.redirect("/"); // 登出後跳到首頁
});

app.get("/hash", async (req, res) => {
  const p = req.query.p || "123456";
  const hash = await bcrypt.hash(p, 10);
  res.json({ hash });
});

app.use(express.static("public"));
app.use(express.static("node_modules/bootstrap/dist"));

// 所有路由要放在 404 之前
app.use((req, res) => {
  res.type("text/html");
  res.status(404).send(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Document</title>
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD"
        crossorigin="anonymous"
      />
    </head>
    <body>
      <div class="container">
        <div class="row justify-content-center text-center">
          <div class="align-content-center">
            <h1>找不到泥要去哪</h1>
            <p>404啦</p>
          </div>
  
          <img style="width: 300px; height: 280px" src="cat-01.jpg" alt="" />
        </div>
      </div>
  
      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"
        integrity="sha384-w76AqPfDkMBDXo30jS1Sgez6pr3x5MlQ1ZAGC+nuZB+EYdgRZgiwxhTBTkF7CXvN"
        crossorigin="anonymous"
      ></script>
    </body>
  </html>
  `);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`伺服器啟動: ${port}`);
});

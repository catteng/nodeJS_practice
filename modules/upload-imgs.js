const multer = require("multer");

const { v4: uuidv4 } = require("uuid");
//{a:b}=把a改名為b

const extMap = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
};

const fileFilter = (req, file, cb) => {
  cb(null, !!extMap[file.mimetype]);
};
//過濾檔案的規則  //cb=callback //mimetype=文件類型

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/../public/uploads");
  },
  filename: (req, file, cb) => {
    const ext = extMap[file.mimetype];
    const fid = uuidv4();
    cb(null, fid + ext);
  },
});
module.exports = multer({ fileFilter, storage });

const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("<h2>Admin2 /</h2>");
});

router.get("/admin2/:action?/:id?", (req, res) => {
  const { url, baseUrl, originalUrl } = req;
  res.json({ url, baseUrl, originalUrl, params: req.params });
});
module.exports = router;

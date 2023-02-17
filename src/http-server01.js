const http = require("http");

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html" });

  response.end(`<h1 >Hello</h1> <p>${request.url}</p>`);
});

server.listen(3000);
//mac不能用5000，有東西衝突

//要停止server=press ctrl+C

const express = require('express');
const multer = require('multer');
const fs = require("fs");


let port = process.env.PORT || 4000;
let app = express();
app.use(multer().single("image"));
app.post('/', (req, res) => {
	console.log(req.body);
	console.log(req.file.buffer);
	res.send('hello');
});
app.listen(port, () => {
	console.log(`server run at http://localhost:${port}`);
});
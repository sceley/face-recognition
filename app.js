const fs = require('rd');
const writeFile = require('fs').writeFile;
const request = require('superagent');
const async = require('async');
const path = require('path');
const Xlsx = require('excel-class');

let complete = 0;
let pattern = /(\d{8}-?[\u4e00-\u9fa5]+|[\u4e00-\u9fa5]+-?\d{8})\.(jpg|png)$/;
let failperson = [];
let failCount = 0;
let successCount = 0;
let existCount = 0;
let personset = [];
let files = fs.readFileFilterSync(path.join(__dirname, 'images'), pattern);
let filePattern = file => {
	let result;
	let pattern1 = /(\d{8})-?([\u4e00-\u9fa5]+)\.(jpg|png)$/;
	let pattern2 = /([\u4e00-\u9fa5]+)-?(\d{8})\.(jpg|png)$/;
	if(pattern1.test(file)) {
		result = {};
		file.replace(pattern1, (match, code1, code2) => {
			result.image = file;
			result.personserial = code1;
			result.personname = code2;
		});
	} else if(pattern2.test(file)) {
		result = {};
		file.replace(pattern2, (match, code1, code2) => {
			result.image = file;
			result.personname = code1;
			result.personserial = code2;
		});
	}
	return result;
};

files.forEach(file => {
	let person = filePattern(file);
	personset.push(person);
});

let requestset = [];
personset.forEach(person => {
	let arequest = formRequset(person);
	requestset.push(arequest);
});

async.parallelLimit(requestset, 5, function (err, results) {
	if(err) return console.log(err);
	console.log(`上传${results.length}张图片`);
	console.log(`上传成功${successCount}张`);
	console.log(`存在${existCount}张`);
	console.log(`上传失败${failCount}张`);
	let xlsx = new Xlsx(path.join(__dirname,'wrongimage.xlsx'));
	xlsx.writeSheet('Sheet1', ['personname','personserial'], failperson)
	.then(()=>{
	    console.log(`统计图片不正确成功`);
	});
});


function formRequset(json) {
	return async.reflect(async.apply(cb => {
		request
			.post('http://192.168.1.101:8080/fsdkfrservice/facetech/register/')
			.field('personname', json.personname)
			.field('personserial', json.personserial)
			.field('appname', 'DoorControl')
			.field('persontype', '1')
			.field('permission', 22)
			.attach('image', json.image)
			.end((err, res) => {
				complete += 1;
				if(complete % 10 == 0) {
					console.log(`complete: ${complete}`);
				}

				if(err) {
					//服务器错误，不做处理
					cb(err);
				} else if(res.statusCode == 200) {
					//服务器正常处理
					let json_res = JSON.parse(res.text);
					console.log(json_res);
					if(json_res.errorcode == 0) {
						//成功
						successCount++;
					} else if(json_res.errorcode == 50002) {
						//存在不做处理
						existCount++;
					} else if(json_res.errorcode == 20003) {
						//不能识别的图片
						failCount++;
						delete json.image;
						failperson.push(json);
					}
					cb(null, json_res);
				} else {
					//状态码不正确则不做处理
					cb(null);
				}
			});
	}));
};

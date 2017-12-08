let pattern = /(\d{8}-?[\u4e00-\u9fa5]+|[\u4e00-\u9fa5]+-?\d{8})\.(jpg|png)$/;
"/home/覃永利-16051223.jpg".replace(pattern, (match, code1, code2, code3) => {
    console.log(code1);
    console.log(code2);
    console.log(match);
});
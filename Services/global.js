const jwt = require('jsonwebtoken');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');

exports.checkAuthorization = (req, res, next) => {
    try {
        var apikey = req.headers['apikey'];
        if (apikey == process.env.APIKEY) {
            next();
        }
        else {
            res.status(403).json({
                // "code": 403,
                "message": "Access Denied...!"
            });
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({
            // "code": 500,
            "message": "Internal server error."
        });
    }
}

exports.checkToken = (req, res, next) => {
    let bearerHeader = req.headers['token'];
    if (typeof bearerHeader !== 'undefined') {
        jwt.verify(bearerHeader, process.env.SECRET, (err, decode) => {
            if (err) {
                res.status(401).json({
                    // "code": 401,
                    'message': 'Invalid token'
                });
            }
            else {
                next();
            }
        });
    }
    else {
        res.status(500).json({
            // "code": 500,
            "message": "Internal server error."
        });
    }
}


//File Upload on Local server
exports.fileUpload = function (req, res) {
    let folderName = req.params.folderName;

    try {
        const form = new formidable.IncomingForm();

        form.parse(req, async (err, fields, files) => {
            if (err) {
                console.error('Form parsing error:', err);
                res.status(400).json({
                    code: 400,
                    message: 'Failed to parse form data.'
                });
            }

            try {
                if (!files.Image || !files.Image[0]) {
                    return res.status(400).json({
                        code: 400,
                        message: 'No image file uploaded'
                    });
                }
                const uploadDir = path.join(__dirname, `../Uploads/${folderName}/`);
                const oldPath = files.Image[0].filepath;
                const newPath = path.join(uploadDir, files.Image[0].originalFilename);

                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                const rawData = fs.readFileSync(oldPath);
                fs.writeFileSync(newPath, rawData);

                res.status(200).json({
                    code: 200,
                    message: 'Success'
                });

            } catch (fileError) {
                console.error('File processing error:', fileError);
                res.status(400).json({
                    code: 400,
                    message: 'Failed to upload file.'
                });
            }
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({
            // code: 500,
            message: 'Internal server error.'
        });
    }
};

//File upload on s3 bucket
// const s3 = new AWS.S3({
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//     region: process.env.AWS_REGION,
// });

exports.uploadFilesTos3 = function (req, res) {
    const folderName = req.params['folderName'];
    const form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files) {
        if (err) {
            res.status(400).send({
                code: 400,
                message: 'Error parsing the form'
            });
        }

        if (!files.Image || !Array.isArray(files.Image) || files.Image.length === 0) {
            return res.status(400).send({
                code: 400,
                message: 'No image file uploaded'
            });
        }

        const file = Array.isArray(files.Image) ? files.Image[0] : files.Image;
        const fileContent = fs.readFileSync(file.filepath);
        const fileName = `${folderName}/${file.originalFilename}`;

        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fileName,
            Body: fileContent,
            ContentType: file.mimetype
        };

        s3.upload(params, function (s3Err, data) {
            if (s3Err) {
                console.error('S3 Upload Error:', s3Err);
                res.status(500).send({
                    code: 500,
                    message: 'Failed to upload to S3'
                });
            } else {
                res.status(200).send({
                    code: 200,
                    message: 'Uploaded successfully to S3',
                    fileUrl: data.Location
                });
            }

        });
    });
};



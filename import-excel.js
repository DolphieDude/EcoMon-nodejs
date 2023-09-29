const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyparser = require('body-parser');
const readXlsxFile = require('read-excel-file/node');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();

app.use(express.static('./public'));

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));

var connection = mysql.createConnection({
    host    :'localhost',
    user    :'root',
    password:'7720',
    database:'shevchuk'
});

connection.connect(function(err){
    if (err) {
        return console.error(err.message);
    }
    else {
        console.log("Connected to MySQL");
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.cwd() + '/uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname)
    },
})
const uploadFile = multer({storage: storage})

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/import-object', uploadFile.single('import-object'),
    (req, res) => {
        importFileToDb(process.cwd() + '/uploads/' + req.file.filename, 'object(name, description, ownership)');
        console.log(res);
    })

app.post('/import-pollutant', uploadFile.single('import-pollutant'),
    (req, res) => {
        importFileToDb(process.cwd() + '/uploads/' + req.file.filename, 'pollutant(name_pollutant, mass_consumption)');
        console.log(res);
    })

app.post('/import-pollution', uploadFile.single('import-pollution'),
    (req, res) => {
        importFileToDb(process.cwd() + '/uploads/' + req.file.filename, 'pollution(idobject, idpollutant, valuepollution, year)');
        console.log(res);
    })

function importFileToDb(exFile, query){
    readXlsxFile(exFile).then((rows) => {
        rows.shift();
        connection.query('INSERT INTO ' + query + ' VALUES ?', [rows], (error, response) => {
            console.log(error || response);
        })
    })
}

const port = 3000;
app.listen(port, () => {
    console.log('localhost port is ' + port);
});
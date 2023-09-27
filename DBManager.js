const mysql   = require('mysql2');
const express = require("express");
const app = express();


const urlencodedParser = express.urlencoded({extended: false});
// встановлює Handlebars як двигун представлень в Express
app.set("view engine", "hbs");


// зміна, в якій зберігаються дані для підключення до БД
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '7720',
    database : 'shevchuk'
});


// підключення до БД
connection.connect(function(err){
    if (err) {
        return console.error("Error-connect: " + err.message);
    }
    else{
        console.log("Connection to MySQL OK!");
    }
});




// звертаємося до корню програми і отримуємо дані з БД та виводимо їх на екран у вигляді таблиці
app.get("/", function(req, res){
    connection.query("SELECT * FROM object", function(err, data) {
        if(err) return console.log(err);
        res.render("index.hbs", {
            object: data
            // object - назва вашої таблиці
        });
    });
});




// запит get до серверу верне нам форму для додання нового об'єкта
app.get("/add", function(req, res){
    res.render("add.hbs");
});
// Після заповнення форми та натискання на кнопку дані в запиті POST відправляються методом, що отримує відправлені дані і за допомогою SQL-команди INSERT відправляє їх в БД
app.post("/add", urlencodedParser, function (req, res) {

    if(!req.body) return res.sendStatus(400);
    const name = req.body.name;
    const description = req.body.description;
    const ownership = req.body.ownership;
    connection.query("INSERT INTO object(name, description, ownership) VALUES (?,?,?)", [name, description, ownership], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});




// При натисканні на редагування у списку об'єктів наступному методу в GET-запиті передається id об'єкта. Метод отримує id і ним витягує з БД необхідний об'єкт і передається його форму у поданні edit.hbs.
app.get("/edit/:idobject", function(req, res){
    const idobject = req.params.idobject;
    connection.query("SELECT * FROM object WHERE idobject=?", [idobject], function(err, data) {
        if(err) return console.log(err);
        res.render("edit.hbs", {
            object: data[0]
// object - назва вашої таблиці
        });
    });
});
// Після редагування та натискання на кнопку дані надсилаються у POST-запиті. Метод отримує дані та за допомогою команди UPDATE відправляє їх у БД.
app.post("/edit", urlencodedParser, function (req, res) {

    if(!req.body) return res.sendStatus(400);
    const name = req.body.name;
    const description = req.body.description;
    const ownership = req.body.ownership;
    const idobject = req.body.idobject;

    connection.query("UPDATE object SET name=?, description=?, ownership=? WHERE idobject=?", [name, description, ownership, idobject], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});




// При натисканні на кнопку видалення у списку об'єктів спрацьовує метод, який отримує id об'єкта, що видаляється, і видаляє його з БД за допомогою команди DELETE.
app.post("/delete/:idobject", function(req, res){

    const idobject = req.params.idobject;
    connection.query("DELETE FROM object WHERE idobject=?", [idobject], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

const port = 3000;
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});

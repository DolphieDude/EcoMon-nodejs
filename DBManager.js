const mysql   = require('mysql2');
const express = require("express");
const app = express();


const urlencodedParser = express.urlencoded({extended: false});
app.set("view engine", "hbs");


var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '7720',
    database : 'shevchuk'
});


connection.connect(function(err){
    if (err) {
        return console.error(err.message);
    }
    else{
        console.log("Connected to MySQL");
    }
});




app.get("/", function(req, res){
    connection.query("SELECT * FROM object", function(err, object_data) {
        if(err) return console.log(err);
        connection.query("SELECT * FROM pollutant", function(err, pollutant_data) {
            if(err) return console.log(err);
            connection.query("SELECT pollution.idpollution, object.name, pollutant.name_pollutant, pollution.valuepollution, " +
                "pollution.year FROM pollution INNER JOIN object ON object.idobject = pollution.idobject " +
                "INNER JOIN pollutant ON pollutant.idpollutant = pollution.idpollutant ORDER BY idpollution", function(err, pollution_data) {
                connection.query("SELECT results.idresults, pollution.idobject, object.name, pollution.idpollutant, " +
                    "pollutant.name_pollutant, results.valueresult " +
                    "FROM results INNER JOIN pollution ON pollution.idpollution = results.idpollution " +
                    "INNER JOIN object ON object.idobject = pollution.idobject " +
                    "INNER JOIN pollutant ON pollutant.idpollutant = pollution.idpollutant ORDER BY idresults", function(err, results_data) {
                    if(err) return console.log(err);
                    res.render("index.hbs", {
                        object: object_data,
                        pollutant: pollutant_data,
                        pollution: pollution_data,
                        results: results_data
                    });
                });
            });
        });
    });
});





app.get("/add-object", function(req, res){
    res.render("object/add-object.hbs");
});
app.post("/add-object", urlencodedParser, function (req, res) {

    if(!req.body) return res.sendStatus(400);
    const name = req.body.name;
    const description = req.body.description;
    const ownership = req.body.ownership;
    connection.query("INSERT INTO object(name, description, ownership) VALUES (?,?,?)", [name, description, ownership], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.get("/add-pollutant", function(req, res){
    res.render("pollutant/add-pollutant.hbs");
});
app.post("/add-pollutant", urlencodedParser, function (req, res) {

    if(!req.body) return res.sendStatus(400);
    const name_pollutant = req.body.name_pollutant;
    const mass_consumption = req.body.mass_consumption;
    const tax = req.body.tax;
    connection.query("INSERT INTO pollutant(name_pollutant, mass_consumption, tax) VALUES (?,?,?)",
        [name_pollutant, mass_consumption, tax], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.get("/add-pollution", function(req, res){
    connection.query("SELECT * FROM object", function(err, object_data) {
        connection.query("SELECT * FROM pollutant", function(err, pollutant_data) {
            if(err) return console.log(err);
            res.render("pollution/add-pollution.hbs", {
                object: object_data,
                pollutant: pollutant_data
            });
        });
    });
});
app.post("/add-pollution", urlencodedParser, function (req, res) {

    if(!req.body) return res.sendStatus(400);
    const idobject = req.body.idobject;
    const idpollutant = req.body.idpollutant;
    const valuepollution = req.body.valuepollution;
    const year = req.body.year;
    connection.query("INSERT INTO pollution(idobject, idpollutant, valuepollution, year) VALUES (?,?,?,?)", [idobject, idpollutant, valuepollution, year], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});




app.get("/edit-object/:idobject", function(req, res){
    const idobject = req.params.idobject;
    connection.query("SELECT * FROM object WHERE idobject=?", [idobject], function(err, data) {
        if(err) return console.log(err);
        res.render("object/edit-object.hbs", {
            object: data[0]
        });
    });
});
app.post("/edit-object", urlencodedParser, function (req, res) {

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

app.get("/edit-pollutant/:idpollutant", function(req, res){
    const idpollutant = req.params.idpollutant;
    connection.query("SELECT * FROM pollutant WHERE idpollutant=?", [idpollutant], function(err, data) {
        if(err) return console.log(err);
        res.render("pollutant/edit-pollutant.hbs", {
            pollutant: data[0]
        });
    });
});
app.post("/edit-pollutant", urlencodedParser, function (req, res) {

    if(!req.body) return res.sendStatus(400);
    const name_pollutant = req.body.name_pollutant;
    const mass_consumption = req.body.mass_consumption;
    const tax = req.body.tax;
    const idpollutant = req.body.idpollutant;

    connection.query("UPDATE pollutant SET name_pollutant=?, mass_consumption=?, tax=? WHERE idpollutant=?",
        [name_pollutant, mass_consumption, tax, idpollutant], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.get("/edit-pollution/:idpollution", function(req, res){
    const idpollution = req.params.idpollution;
    connection.query("SELECT * FROM pollution WHERE idpollution=?", [idpollution], function(err, data) {
        connection.query("SELECT * FROM object", function(err, object_data) {
            connection.query("SELECT * FROM pollutant", function(err, pollutant_data) {
                if(err) return console.log(err);
                res.render("pollution/edit-pollution.hbs", {
                    pollution: data[0],
                    object: object_data,
                    pollutant: pollutant_data
                });
            });
        });
    });
});
app.post("/edit-pollution", urlencodedParser, function (req, res) {

    if(!req.body) return res.sendStatus(400);
    const idobject = req.body.idobject;
    const idpollutant = req.body.idpollutant;
    const valuepollution = req.body.valuepollution;
    const year = req.body.year;
    const idpollution= req.body.idpollution;

    connection.query("UPDATE pollution SET idobject=?, idpollutant=?, valuepollution=?, year=? WHERE idpollution=?", [idobject, idpollutant, valuepollution, year, idpollution], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});


app.post("/delete-object/:idobject", function(req, res) {

    const idobject = req.params.idobject;
    connection.query("DELETE FROM object WHERE idobject=?", [idobject], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.post("/delete-pollutant/:idpollutant", function(req, res) {

    const idpollutant = req.params.idpollutant;
    connection.query("DELETE FROM pollutant WHERE idpollutant=?", [idpollutant], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});

app.post("/delete-pollution/:idpollution", function(req, res) {

    const idpollution = req.params.idpollution;
    connection.query("DELETE FROM pollution WHERE idpollution=?", [idpollution], function(err, data) {
        if(err) return console.log(err);
        res.redirect("/");
    });
});


app.post("/calculate-results", function (req, res) {
    connection.query("SELECT pollution.*, pollutant.tax FROM pollution INNER JOIN pollutant ON pollution.idpollutant = pollutant.idpollutant", function (err, pollution_data) {
        if (err) {
            console.log(err);
            return res.status(500).send("Error calculating results.");
        }

        const resultsPromises = pollution_data.map(pollution => {
            const valuepollution = pollution.valuepollution;
            const tax = pollution.tax;

            // Log the values
            console.log("valuepollution:", valuepollution);
            console.log("tax:", tax);

            const valueresult = valuepollution * tax;

            if (!isNaN(valueresult)) {
                return new Promise((resolve, reject) => {
                    connection.query(
                        "INSERT INTO results (idpollution, valueresult) VALUES (?, ?)",
                        [pollution.idpollution, valueresult],
                        function (err, insertResult) {
                            if (err) {
                                console.log(err);
                                reject(err);
                            } else {
                                resolve(insertResult);
                            }
                        }
                    );
                });
            } else {
                // Handle invalid values (e.g., log an error)
                console.log("Invalid valueresult:", valueresult);
                return Promise.resolve();
            }
        });

        Promise.all(resultsPromises)
            .then(() => {
                // Redirect back to the main page after calculations and insertions
                res.redirect("/");
            })
            .catch(err => {
                console.log(err);
                res.status(500).send("Error calculating results.");
            });
    });
});




const port = 3000;
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});

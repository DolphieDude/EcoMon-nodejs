const mysql = require('mysql2');
const express = require("express");
const app = express();


const urlencodedParser = express.urlencoded({extended: false});
app.set("view engine", "hbs");


const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '7720',
    database: 'shevchuk',
    multipleStatements: true
})


connection.connect(function (err) {
    if (err) {
        return console.error(err.message);
    } else {
        console.log("Connected to MySQL");
    }
});

const results_query = "SELECT results.idresults, pollution.idobject, object.name, pollution.idpollutant, " +
    "pollutant.name_pollutant, pollution.year, pollution.valuepollution, results.valueresult FROM results " +
    "INNER JOIN pollution ON pollution.idpollution = results.idpollution " +
    "INNER JOIN object ON object.idobject = pollution.idobject " +
    "INNER JOIN pollutant ON pollutant.idpollutant = pollution.idpollutant ";

const danger_query = "SELECT danger.iddanger, pollution.idobject, object.name, pollution.idpollutant, " +
    "pollutant.name_pollutant, pollution.year, pollution.concentration, danger.hq, danger.cr FROM danger " +
    "INNER JOIN pollution ON pollution.idpollution = danger.idpollution " +
    "INNER JOIN object ON object.idobject = pollution.idobject " +
    "INNER JOIN pollutant ON pollutant.idpollutant = pollution.idpollutant "

app.get("/", function (req, res) {
    let query = "SELECT * FROM object; ";

    query += "SELECT * FROM pollutant; ";

    query += "SELECT pollution.idpollution, object.name, pollutant.name_pollutant, pollution.valuepollution, " +
        "pollution.year, pollution.concentration, pollution.losses FROM pollution " +
        "INNER JOIN object ON object.idobject = pollution.idobject " +
        "INNER JOIN pollutant ON pollutant.idpollutant = pollution.idpollutant ORDER BY idpollution; ";

    query += results_query + "ORDER BY idresults; ";

    query += danger_query + "ORDER BY iddanger; ";

    connection.query(query, function (err, data) {
        if (err) {
            return console.log(err);
        }

        const [object_data, pollutant_data, pollution_data, results_data, danger_data] = data;

        const dangerWithAssessments = danger_data.map(assessDanger);

        res.render("index.hbs", {
            object: object_data,
            pollutant: pollutant_data,
            pollution: pollution_data,
            results: results_data,
            danger: dangerWithAssessments
        });
    });
});

function assessDanger(row) {
    let nonCarcinogenDanger, carcinogenDanger;

    if (row.hq > 1) {
        nonCarcinogenDanger = 'It may pose a risk, depends on HQ';
    } else if (row.hq === 1) {
        nonCarcinogenDanger = 'Allowed risk but cannot be considered acceptable';
    } else {
        nonCarcinogenDanger = 'No significant danger';
    }

    if (row.cr === null) {
        carcinogenDanger = null;
    } else if (row.cr > Math.pow(10, -3)) {
        carcinogenDanger = 'High - De Manifestis. Necessary implementation measures to reduce the risk';
    } else if (Math.pow(10, -4) < row.cr && row.cr <= Math.pow(10, -3)) {
        carcinogenDanger = 'Average - acceptable for production conditions';
    } else if (Math.pow(10, -6) < row.cr && row.cr <= Math.pow(10, -4)) {
        carcinogenDanger = 'Low - acceptable risk. The level at which, as hygienic standards are established';
    } else {
        carcinogenDanger = 'Minimum - De Minimis. desired amount of risk';
    }

    return {
        ...row,
        non_carcinogen_danger: nonCarcinogenDanger,
        carcinogen_danger: carcinogenDanger
    };
}


app.get("/add-object", function (req, res) {
    res.render("object/add-object.hbs");
});
app.post("/add-object", urlencodedParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);
    const name = req.body.name;
    const description = req.body.description;
    const ownership = req.body.ownership;
    connection.query("INSERT INTO object(name, description, ownership) VALUES (?,?,?)", [name, description, ownership], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});

app.get("/add-pollutant", function (req, res) {
    res.render("pollutant/add-pollutant.hbs");
});
app.post("/add-pollutant", urlencodedParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);
    const name_pollutant = req.body.name_pollutant;
    const mass_consumption = req.body.mass_consumption;
    const tax = req.body.tax;
    connection.query("INSERT INTO pollutant(name_pollutant, mass_consumption, tax) VALUES (?,?,?)",
        [name_pollutant, mass_consumption, tax], function (err, data) {
            if (err) return console.log(err);
            res.redirect("/");
        });
});

app.get("/add-pollution", function (req, res) {
    connection.query("SELECT * FROM object", function (err, object_data) {
        connection.query("SELECT * FROM pollutant", function (err, pollutant_data) {
            if (err) return console.log(err);
            res.render("pollution/add-pollution.hbs", {
                object: object_data,
                pollutant: pollutant_data
            });
        });
    });
});
app.post("/add-pollution", urlencodedParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);
    const idobject = req.body.idobject;
    const idpollutant = req.body.idpollutant;
    const valuepollution = req.body.valuepollution;
    const year = req.body.year;
    connection.query("INSERT INTO pollution(idobject, idpollutant, valuepollution, year) VALUES (?,?,?,?)", [idobject, idpollutant, valuepollution, year], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});


app.get("/edit-object/:idobject", function (req, res) {
    const idobject = req.params.idobject;
    connection.query("SELECT * FROM object WHERE idobject=?", [idobject], function (err, data) {
        if (err) return console.log(err);
        res.render("object/edit-object.hbs", {
            object: data[0]
        });
    });
});
app.post("/edit-object", urlencodedParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);
    const name = req.body.name;
    const description = req.body.description;
    const ownership = req.body.ownership;
    const idobject = req.body.idobject;

    connection.query("UPDATE object SET name=?, description=?, ownership=? WHERE idobject=?", [name, description, ownership, idobject], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});

app.get("/edit-pollutant/:idpollutant", function (req, res) {
    const idpollutant = req.params.idpollutant;
    connection.query("SELECT * FROM pollutant WHERE idpollutant=?", [idpollutant], function (err, data) {
        if (err) return console.log(err);
        res.render("pollutant/edit-pollutant.hbs", {
            pollutant: data[0]
        });
    });
});
app.post("/edit-pollutant", urlencodedParser, function (req, res) {

    if (!req.body) return res.sendStatus(400);
    const name_pollutant = req.body.name_pollutant;
    const mass_consumption = req.body.mass_consumption;
    const tax = req.body.tax;
    const idpollutant = req.body.idpollutant;

    connection.query("UPDATE pollutant SET name_pollutant=?, mass_consumption=?, tax=? WHERE idpollutant=?",
        [name_pollutant, mass_consumption, tax, idpollutant], function (err, data) {
            if (err) return console.log(err);
            res.redirect("/");
        });
});

app.get("/edit-pollution/:idpollution", function (req, res) {
    const idpollution = req.params.idpollution;
    connection.query("SELECT * FROM pollution WHERE idpollution=?", [idpollution], function (err, data) {
        connection.query("SELECT * FROM object", function (err, object_data) {
            connection.query("SELECT * FROM pollutant", function (err, pollutant_data) {
                if (err) return console.log(err);
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

    if (!req.body) return res.sendStatus(400);
    const idobject = req.body.idobject;
    const idpollutant = req.body.idpollutant;
    const valuepollution = req.body.valuepollution;
    const year = req.body.year;
    const idpollution = req.body.idpollution;

    connection.query("UPDATE pollution SET idobject=?, idpollutant=?, valuepollution=?, year=? WHERE idpollution=?", [idobject, idpollutant, valuepollution, year, idpollution], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});


app.post("/delete-object/:idobject", function (req, res) {

    const idobject = req.params.idobject;
    connection.query("DELETE FROM object WHERE idobject=?", [idobject], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});

app.post("/delete-pollutant/:idpollutant", function (req, res) {

    const idpollutant = req.params.idpollutant;
    connection.query("DELETE FROM pollutant WHERE idpollutant=?", [idpollutant], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});

app.post("/delete-pollution/:idpollution", function (req, res) {

    const idpollution = req.params.idpollution;
    connection.query("DELETE FROM pollution WHERE idpollution=?", [idpollution], function (err, data) {
        if (err) return console.log(err);
        res.redirect("/");
    });
});


app.post("/calculate-results", function (req, res) {
    const query = "INSERT INTO results (idpollution, valueresult) " +
        "SELECT pollution.idpollution, pollution.valuepollution * pollutant.tax " +
        "FROM pollution INNER JOIN pollutant ON pollution.idpollutant = pollutant.idpollutant";

    connection.query(query, function (err, insertResult) {
        if (err) return console.log(err);
        res.redirect("/");
    })
});

app.get("/filter-by-object/:idobject", function (req, res) {
    const idobject = req.params.idobject;

    connection.query(results_query + "WHERE pollution.idobject = ? " +
        "ORDER BY results.idpollution;", [idobject], function (err, data) {
        if (err) return console.log(err);

        let sum = 0;
        data.forEach(row => {
            sum += parseFloat(row.valueresult);
        });

        res.render("filter-results.hbs", {
            filter: data[0].name,
            sum: sum,
            results: data
        });
    });
});

app.get("/filter-by-year/:year", function (req, res) {
    const year = req.params.year;

    connection.query(results_query + "WHERE pollution.year = ? " +
        "ORDER BY results.idpollution;", [year], function (err, data) {
        if (err) return console.log(err);

        let sum = 0;
        data.forEach(row => {
            sum += parseFloat(row.valueresult);
        });

        res.render("filter-results.hbs", {
            filter: data[0].year,
            sum: sum,
            results: data
        });
    });
});

app.post("/filter-by-object-and-year/:idobject/:year", function (req, res) {
    const idobject = req.params.idobject;
    const year = req.params.year;

    connection.query(results_query + "WHERE pollution.idobject = ? AND pollution.year = ? " +
        "ORDER BY results.idpollution", [idobject, year], function (err, data) {
        if (err) return console.log(err);

        let sum = 0;
        data.forEach(row => {
            sum += parseFloat(row.valueresult);
        });

        res.render("filter-results.hbs", {
            filter: data[0].name + " in " + data[0].year,
            sum: sum,
            results: data
        });
    });
});

app.post("/assess-danger", function (req, res) {

    const query = "SELECT pollution.idpollution, pollution.concentration, " +
        "pollutant.reference_concentration, pollutant.slope_factor " +
        "FROM pollution INNER JOIN pollutant ON pollution.idpollutant = pollutant.idpollutant";

    connection.query(query, function (err, data) {
        if (err) return console.log(err);
        let HQ, CR
        data.forEach(row => {
            RfC = row.reference_concentration;
            conc = row.concentration;

            HQ = conc / RfC;

            SF = row.slope_factor;

            if (SF != null) {
                BW = 65, EF = 350, Tout = 5.3, Tin = 18.7, AT = 70, Vout = 1.4, Vin = 0.63, ED = 30;
                AddLadd = (((conc * Tout * Vout) + (conc * Tin * Vin)) * EF * ED) / (BW * AT * 365);

                CR = AddLadd * SF;
            } else {
                CR = null;
            }

            const insertQuery = "INSERT INTO danger (idpollution, hq, cr) VALUES (?, ?, ?)";
            const values = [row.idpollution, HQ, CR];

            connection.query(insertQuery, values, function (err, result) {
                if (err) return console.log(err);
            });
        });
        res.redirect("/");
    })
});

app.get("/filter-danger-by-object/:idobject", function (req, res) {
    const idobject = req.params.idobject;

    connection.query(danger_query + "WHERE pollution.idobject = ? " +
        "ORDER BY danger.idpollution;", [idobject], function (err, data) {
        if (err) return console.log(err);

        const dangerWithAssessments = data.map(assessDanger);

        res.render("filter-danger.hbs", {
            filter: data[0].name,
            danger: dangerWithAssessments
        });
    });
});

app.get("/filter-danger-by-pollutant/:idpollutant", function (req, res) {
    const idpollutant = req.params.idpollutant;

    connection.query(danger_query + "WHERE pollution.idpollutant = ? " +
        "ORDER BY danger.idpollution;", [idpollutant], function (err, data) {
        if (err) return console.log(err);

        const dangerWithAssessments = data.map(assessDanger);

        res.render("filter-danger.hbs", {
            filter: data[0].name_pollutant,
            danger: dangerWithAssessments
        });
    });
});

app.get("/filter-danger-by-year/:year", function (req, res) {
    const year = req.params.year;

    connection.query(danger_query + "WHERE pollution.year = ? " +
        "ORDER BY danger.idpollution;", [year], function (err, data) {
        if (err) return console.log(err);

        const dangerWithAssessments = data.map(assessDanger);

        res.render("filter-danger.hbs", {
            filter: data[0].year,
            danger: dangerWithAssessments
        });
    });
});

app.post("/calculate-losses", function (req, res) {
    const query = "SELECT pollution.idpollution, " +
        "pollution.concentration, pollution.valuepollution, pollutant.tlv, pollutant.mass_flow " +
        "FROM pollution INNER JOIN pollutant ON pollution.idpollutant = pollutant.idpollutant";

    connection.query(query, function (err, data) {
        if (err) return console.log(err);

        data.forEach(row => {
            let conc = row.concentration;
            let value = row.valuepollution;
            let tlv = row.tlv;
            let massFlow = row.mass_flow;
            let loss = 0;

            if (value > 0 && massFlow > 0 && tlv > 0 && value > massFlow / 114.1552) {
                let minWage = 6700;
                let Ai = tlv > 1 ? 10 / tlv : 1 / tlv;
                let Knas = 1.80;
                let Kf = 1.25;
                let Kt = Knas * Kf;
                let Kzi = 1;

                if (conc > 0 && conc > tlv) {
                    Kzi = conc / tlv;
                }

                loss = 3.6 * Math.pow(10, -3) * (value * 0.031709 - massFlow / 3600) * 8760 * minWage * Ai * Kt * Kzi;
            }

            const updateQuery = "UPDATE pollution SET losses = ? WHERE idpollution = ?";
            const updateValues = [loss, row.idpollution];

            connection.query(updateQuery, updateValues, function (updateErr, updateRes) {
                if (updateErr) {
                    console.log(updateErr);
                }
            });
        });

        res.redirect("/");
    });
});





const port = 3000;
app.listen(port, () => {
    console.log(`App listening on port ${port}`)
});

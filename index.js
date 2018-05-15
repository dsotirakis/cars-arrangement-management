var express = require("express");
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', './views');

//app.use(express.static("public"));
app.use(express.static("node_modules"));

var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/node-demo2");

// Define User Model
var nameSchema = new mongoose.Schema({
    firstName: String,
    lastName: String
}, {versionKey: false});

var User = mongoose.model("User", nameSchema);

// Define Category Model
var categorySchema = new mongoose.Schema({
	categoryName: String
});

var Category = mongoose.model("Category", categorySchema);

var carSchema = new mongoose.Schema({
    carName: String,
    categoryName: String
});

var Car = mongoose.model("Car", carSchema);
// Define index page
app.get("/", (req, res) => {
    res.render("index");
});

var eventSchema = new mongoose.Schema({
	startDate : Date,
	endDate : Date,
	categoryName : String
});

var Event = mongoose.model("Event", eventSchema);

app.get("/", (req, res) => {
	db.users.find({}, function(err, docs){
	res.render("index", {users:docs});
	});
});

// Define category page
app.get("/category", (req, res) => {
    res.render("category");
});

app.get("/car", (req, res) => {
	mongoose.model("Car").find(function(err, cars) {
		mongoose.model("Category").find(function (err, categories) {
   			res.render('car', {
				categories : categories,
				cars : cars
			});
		});
	});
});

app.get("/event", (req, res) => {
	mongoose.model("Event").find(function(err, events) {
		mongoose.model("Category").find(function (err, categories) {
   			res.render('event', {
				categories : categories,
				events : events
			});
		});
	});
});

app.post("/addname", (req, res) => {
    var myData = new User(req.body);
    myData.save()
        .then(item => {
            res.send("Name saved to database");
        })
        .catch(err => {
            res.status(400).send("Unable to save to database");
        });
});

app.post("/addCategory", (req, res) => {
	var myData = new Category(req.body);
	myData.save().then(item => {
		res.send("Category saved to database!");
	})
	.catch(err => {
		res.status(400).send("Unable to save to database");
	});
});

app.post("/addCar", (req, res) => {
	var myData = new Car(req.body);
	myData.save().then(item => {
		res.send("Car saved to database!");
		console.log(req.body.categoryName);
	})
	.catch(err => {
		res.status(400).send("Unable to save to database");
	});
});

app.post("/addEvent", (req, res) => {
	var myData = new Event(req.body);
	myData.save().then(item => {
		res.send("Event saved to database!");
	})
	.catch(err => {
		res.status(400).send("Unable to save to database");
	});
});

app.get('/test', function(req, res){
	mongoose.model("Category").find(function(err, categories) {
   	res.render('first_view', {
	   categories : categories
   });
});
});


app.get('/groups', function(req, res){
	mongoose.model("Car").find(function(err, cars) {
		mongoose.model("Event").find(function (err, events) {
   			res.render('view', {
	   			cars : cars,
	   			events : events
			});
   		});
	});
});

app.get('/show_events', function(req, res){
	mongoose.model("Event").find(function(err, events) {
   	res.render('showEvents', {
	   events : events
   });
});
});

app.listen(8080, function() {
	console.log("Open server.");
});

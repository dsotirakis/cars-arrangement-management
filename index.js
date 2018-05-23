var express = require("express");
var app = express();
var bodyParser = require('body-parser');
const TreeMap = require("treemap-js");
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
    categoryName: String,
    weight: {type: Number, min: 1}
});

var Car = mongoose.model("Car", carSchema);
// Define index page
app.get("/", (req, res) => {
    res.render("index");
    var users = getUsers();
    console.log("lelos");
    console.log(users.length);
});

var eventSchema = new mongoose.Schema({
	startDate : Date,
	endDate : Date,
	categoryName : String,
	carName: String
});

var Event = mongoose.model("Event", eventSchema);

app.get("/", (req, res) => {
	db.users.find({}, function(err, docs){
	res.render("index", {users:docs});
	});
});


function getUsers(){
	User.find({}, function(err, users) {
  		if (err) throw err;
		
  		// object of all the users
  		return users;
	});
};

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
	
	Event.find({categoryName:req.body.categoryName}, function(err, events) {
  		if (err) throw err;

		Car.find({categoryName:req.body.categoryName}, function(err, cars) {
  			if (err) throw err;
		
			// Initialize auxiliary variables.
			var eventsMap = new TreeMap();

			// Fill eventsMap. The map key is the total event duration in minutes,
			// while the values are the start and stop seconds as a unix timestamp.
			for (var i = 0; i < events.length; i++){
				
				// Initialize auxiliary variables.
				var criticalSeconds = [];
				var startDate_toDate = new Date(events[i].startDate);
				var endDate_toDate = new Date(events[i].endDate);
				
				// Fill critical seconds array.
				var criticalSeconds = [startDate_toDate.getTime() / 1000,
									   endDate_toDate.getTime() / 1000];

				// Calculate the total duration of the event.
				var totalTime = (endDate_toDate.getTime() - startDate_toDate.getTime()) / (3600*1000);
				
				// Fill the events map.
				eventsMap.set(totalTime, criticalSeconds);

			}

			// Initialize booked cars map.
			var bookedCarsMap = new TreeMap();
			var bookedCarsMapToAdd = new TreeMap();

			// For each element of the events map.
			eventsMap.each(function (value, key) {

				if (bookedCarsMap.length > 0){
						
					bookedCarsMap.each(function (value1, key1) {
							
						for (var i = 0; i < cars.length; i++){

							if (cars[i].carName == key1){
								if (((value[0] >= value1[0]) && (value[0] <= value1[1])) || 
									((value[1] >= value1[0]) && (value[1] <= value1[1]))){
									continue;
								}
								else{
									bookedCarsMapToAdd.set(cars[i].carName, value);
									break;
								}
							}
							else{
								bookedCarsMapToAdd.set(cars[i].carName, value);
								break;
							}
									
						
						}

					});
					
				}
				else{
					bookedCarsMap.set(cars[0].carName, value);
				}
			});

			bookedCarsMapToAdd.each(function (value, key) {
				//bookedCarsMap.set(
			}

			for (var i = 0; i < events.length; i++){
				var startDate_toDate = new Date(events[i].startDate);
				var endDate_toDate = new Date(events[i].endDate);
				
				var period = endDate_toDate.getDay() - startDate_toDate.getDay();
				var minPeriod = 100000, minIndex = -1;
				for (var j = 0; j < cars.length; j++){
					if (minPeriod > period * cars[j].weight){
						minIndex = j;
						minPeriod = period * cars[j].weight;
					}
				}
				console.log(startDate_toDate.getTime());
				console.log(endDate_toDate.getTime());
				Event.update({ _id: events[i].id}, { $set: { carName: cars[minIndex].carName }}, function(err, res) {
				if (err) {
					console.log("Something went wrong!");
				}
				});
			}

  		// object of all the users
  			console.log(cars);
		});
	});
	redirectFunction(app, req.body.categoryName);
	res.redirect(301, '/groups' + req.body.categoryName);
});

// This function is used in order to redirect in the specific car category groups page.
function redirectFunction(app, catName) {
	app.get('/groups' + catName, function(req, res){
		mongoose.model("Car").find({categoryName: catName}, function(err, cars) {
			mongoose.model("Event").find(function (err, events) {
   				res.render('view', {
	   				cars : cars,
	   				events : events
				});
   			});
		});
	});
};


app.get('/test', function(req, res){
	mongoose.model("Category").find(function(err, categories) {
   	res.render('first_view', {
	   categories : categories
   });
});
});


app.get('/groups', function(req, res){
	mongoose.model("Car").find({categoryName: "Sedan"}, function(err, cars) {
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

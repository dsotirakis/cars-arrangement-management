// Initialize auxiliary variables. Declare constants.
var express = require("express");
var app = express();
var bodyParser = require('body-parser');
var autoIncrement = require('mongoose-auto-increment');
var stringify = require('json-stringify');
var l = require('passport-login-check')
var mongoose = require("mongoose");
var session = require('express-session')
var cookieParser = require('cookie-parser');
const passport = require('passport');
const sortMap = require('sort-map');
const arraySort = require('array-sort');

// Use and set attributes in the express app.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static("node_modules"));

// Declare the home page.
app.get("/", function(req, res) {

	res.render('auth');

});

/*  PASSPORT SETUP  */

app.use(session({ secret: 'anything' }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/success', (req, res) => res.redirect(301, '/home'));
app.get('/error', (req, res) => res.send("No such user."));

passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  UserDetails.findById(id, function(err, user) {
    cb(err, user);
  });
});

/* PASSPORT LOCAL AUTHENTICATION */

const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function(username, password, done) {
      UserDetails.findOne({
        username: username
      }, function(err, user) {
        if (err) {
          return done(err);
        }

        if (!user) {
          return done(null, false);
        }

        if (user.password != password) {
          return done(null, false);
        }
        return done(null, user);
      });
  }
));

app.post('/',
  passport.authenticate('local', { failureRedirect: '/error' , successRedirect: '/home'})),


// Initialize Mongoose properties.
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://dimitris:abc123456789@bluerent-nqiw4.mongodb.net/test?retryWrites=false");
//autoIncrement.initialize(mongoose.createConnection("mongodb://localhost:27017/node-demo2"));

// Declare the Schema constant.
const Schema = mongoose.Schema;

// Define User model.
const UserDetail = new Schema({
      username: String,
      password: String
    });

const UserDetails = mongoose.model('userInfo', UserDetail, 'userInfo');

// Define Category Model
var categorySchema = new mongoose.Schema({
	categoryName: String
});

var Category = mongoose.model("Category", categorySchema);

// Define Car Model
var carSchema = new mongoose.Schema({
    carName: String,
    categoryName: String,
    weight: Number,
    brand : String,
});

var Car = mongoose.model("Car", carSchema);

// Define Event Model.
var eventSchema = new mongoose.Schema({
	startDate : Date,
	endDate : Date,
	categoryName : String,
	carName: String,
	person: String
});

var Event = mongoose.model("Event", eventSchema);

/**
 * This function is responsible for checking if the the user is logged in
 * every time.
 **/
function adminIsLoggedIn(req, res, next) {

    // If user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // If they aren't redirect them to the home page
    res.redirect('/');
}

// Get the homepage, checking if the user is authenticated.
app.get("/home", adminIsLoggedIn, (req, res) => {
	mongoose.model("Category").find({}, null, {sort:{'categoryName': 1}}, function (err, categories) {
		mongoose.model("Event").find({}, function(err, events) {
			res.render('chooseGroups', {
				categories: categories,
				events: events
			});
		});
	});
});

app.post("/changeCar", (req, res) => {

		var temp = [];
		var today = new Date();
		console.log("asdads: " + req.body.cars);
		for (var i = 0; i < req.body.new.length; i++)
			temp.push(JSON.parse(req.body.new[i]));
	Car.find({categoryName:temp[0].categoryName}, function(err, cars) {
		console.log("lela: " + req.body.carName + " " + req.body.brand + " " + req.body.id);
		console.log(req.body.categoryName);
	    var promises = [];
		for (var i = 0; i < req.body.carName.length; i++){

			promises.push(changeCarsMongoose(temp[i].id, req.body.carName[i], req.body.brand[i]));
		}
	
		Promise.all(promises).then( item => {

			var promises2 = [];
			for (var i = 0; i < req.body.carName.length; i++){
				promises2.push(updateEventsAfterCarsMongoose(cars[i].carName, req.body.carName[i]));
			}
			
			Promise.all(promises2).then( item => {
				redirectFunction(app, cars[0].categoryName);
				res.redirect(301, '/groups' + cars[0].categoryName);
			});
		});
	});
});

// Update cars process.
app.post("/updateCar", (req, res) => {
	
	var temp = [];
	var today = new Date();

	for (var i = 0; i < req.body.new.length; i++)
		temp.push(JSON.parse(req.body.new[i]));
      // After succ
    var promises = [];
	for (var i = 0; i < req.body.weight.length; i++){

		console.log(temp[i].carName + " '' " + req.body.weight[i]);
	
		promises.push(updateCarsMongoose(temp[i].carName, req.body.weight[i]));
	}
	
	Promise.all(promises).then( item => {
		redirectFunction(app, temp[0].categoryName);
		res.redirect(301, '/groups' + temp[0].categoryName);
	});

			
});

// Use promise to update car priorities.
function updateCarsMongoose(carName, weight){
	return new Promise(function(resolve, reject) {
		Car.findOneAndUpdate({ carName: carName}, { $set: { weight: weight }}, function(err, res) {
			if (err) {
				console.log("Something went wrong!");
			}
			else{
				return resolve();
			}
		});
	});
}

// Use promise to update car priorities.
function changeCarsMongoose(id, carName, brand){
	return new Promise(function(resolve, reject) {
		
		Car.findOneAndUpdate({ _id: id}, { $set: { carName: carName, brand:brand }}, function(err, res) {
			if (err) {
				console.log("Something went wrong!");
			}
			else{
				return resolve();
			}
		});
	});
}
// Add category POST method.
app.post("/addCategory", (req, res) => {
	var myData = new Category(req.body);
	myData.save().then(item => {
		res.redirect(301, '/home');
	})
	.catch(err => {
		res.status(400).send("Unable to save to database");
	});
});

// Add car POST method.
app.post("/addCar", (req, res) => {
	var myData = new Car(req.body);
	var today  = new Date();
	myData.save().then(item => {

			Event.find({categoryName:req.body.categoryName}, function(err, events) {
		  		if (err) throw err;

				Car.find({categoryName:req.body.categoryName}, null, {sort:{'weight':1}}, function(err, cars) {
		  			if (err) throw err;

		  			for (var i = 0; i < cars.length; i++)
		  				console.log("car: " + cars[i].carName + " " + cars[i].weight);
					
					shuffleEvents(cars, events);	
					redirectFunction(app, req.body.categoryName);
					res.redirect(301, '/groups' + req.body.categoryName);
				});
			});

			})
	.catch(err => {
		res.status(400).send("Unable to save to database");
	});
});

// Delete event POST method.
app.post("/deleteEvent", (req, res) => {

	console.log(req.body.event);
	var today = new Date();
	var temp = JSON.parse(req.body.event);
	Event.deleteOne({ _id : temp.id }).then(item => {
		
			console.log("here");	
			Event.find({categoryName:temp.categoryName}, function(err, events) {
		  		if (err) throw err;

				Car.find({categoryName:temp.categoryName}, null, {sort:{'weight':1}}, function(err, cars) {
		  			if (err) throw err;
					
						shuffleEvents(cars,events).then( bookedCarsArr => {	
						

								redirectFunction(app, temp.categoryName);
								res.redirect(301, '/groups' + temp.categoryName);
								console.log("neanias");
							});
				});
			});

			})
			.catch(err => {
				res.status(400).send("Unable to save to database");
			});
});

// Delete category POST method.
app.post("/deleteCategory", (req, res) => {
	Category.deleteOne({categoryName : req.body.categoryName}).then(item => {

		Event.deleteMany( {"categoryName" : req.body.categoryName}).then(item => {
			console.log("Done");
			
			Car.deleteOne( {"categoryName" : req.body.categoryName}).then(item => {
				console.log("Done");
			});
		
		});
		
	}).catch(res.redirect(301, '/'));
});

// Delete car POST method.
app.post("/deleteCar", (req, res) => {
	
	var temp = JSON.parse(req.body.carName);
	var today = new Date();
	console.log("here: " + temp.categoryName)
	Car.deleteOne({ carName: temp.carName, categoryName: temp.categoryName }).then(item => {

		Event.deleteMany( {"carName" : temp.carName, categoryName : temp.categoryName}).then(item => {
			console.log("Done");

			console.log(item);	
			Event.find({categoryName:temp.categoryName}, function(err, events) {
		  		if (err) throw err;

				Car.find({categoryName:temp.categoryName}, null, {sort:{'weight':1}}, function(err, cars) {
		  			if (err) throw err;
					
					shuffleEvents(cars, events);

					redirectFunction(app, temp.categoryName);
					res.redirect(301, '/groups' + temp.categoryName);
				});
			});

		});


			})
			.catch(err => {
				res.status(400).send("Unable to save to database");
			});


	});

/**
 * This function is responsible for filtering events based on certain criteria.
 **/
function filterEvents(eventData, categoryName) {

	// Initialize auxiliary variables.
	var start = new Date(eventData.startDate);
	var stop  = new Date(eventData.endDate);	
	var today = new Date();

	// If the start date or stop date is before the current date, don't save.
	if (today > stop || today > start){
		var string = "Αδύνατη κράτηση. Η ημερομηνία αρχής της κράτησης, βρίσκεται πριν τη σημερινή μέρα.";
		return string;
	}
	start = start.getTime() / 1000;
	stop = stop.getTime() / 1000;
	console.log(start + " " + stop);

	// If start and stop date are the same, then don't save.
	if (start == stop){
		var string = "Αδύνατη κράτηση. Η αρχή και το τέλος της κράτησης συμπίπτουν.";
		return string;
	}

	// If start date is after stop date, don't save,
	if (start > stop){
		var string = "Η ημερομηνία αρχής της κράτησης, είναι μεταγενέστερη από αυτή του τερματισμού. Παρακαλώ διορθώστε.";
		return string;
	}

	// Return defailt value.
	return "";
}

/**
 * This function is used in order to test equality between Sets.
**/
function eqSet(as, bs) {
    if (as.size !== bs.size) return false;
    for (var a of as) if (!bs.has(a)) return false;
    return true;
}

/**
 * This function is responsible for updating events. Returns a promise resolve.
 **/
function updateEventsMongoose(id, carName){
	return new Promise(function(resolve, reject) {
		
		Event.findOneAndUpdate({ _id: id}, { $set: { carName: carName }}, function(err, res) {
			if (err) {
				console.log("Something went wrong!");
			}
			else{
				console.log("id: " + id);
				return resolve();
			}
		});
	});
}

/**
 * This function is responsible for updating events. Returns a promise resolve.
 **/
function updateEventsAfterCarsMongoose(prevCarName, newCarName){
	return new Promise(function(resolve, reject) {
		console.log("sssssssss: " + prevCarName + " - " + newCarName);	
		Event.findOneAndUpdate({ carName: prevCarName}, { $set: { carName: newCarName }}, function(err, res) {
			if (err) {
				console.log("Something went wrong!");
			}
			else{
				return resolve();
			}
		});
	});
}
/**
 * This function is responsible for checking the availability of cars.
 **/
function getMessage(start, stop, categoryName) {
	return new Promise(function(resolve, reject) {
		Event.find({categoryName:categoryName}, function(err, events) {
		  	if (err) throw err;
			

			Car.find({categoryName:categoryName}, function(err, cars) {
			  	if (err) throw err;

				var eventsArr = [];
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
					eventsArr.push({eventId: events[i].id, totalTime: totalTime, criticalSeconds: criticalSeconds, carName: events[i].carName});
				}

				var carsBooked = new Set();
				var allCars = new Set();
				for (var i = 0; i < cars.length; i++)
					allCars.add(cars[i].carName);

				console.log("equals: " + eqSet(allCars, carsBooked));
				var carCountBef = 0, carCountAft = 0;
				for (var i = 0; i < eventsArr.length; i ++){
					console.log("newnew");
					if ((eventsArr[i].criticalSeconds[0] - 10800 >= start  && eventsArr[i].criticalSeconds[0] - 10800 <= stop) ||
						 (start >= eventsArr[i].criticalSeconds[0] - 10800 && start <= eventsArr[i].criticalSeconds[1] + 10800)){
						carCountBef += 1;
						carsBooked.add(eventsArr[i].carName);
						console.log("in2!");
					}
				 	if ((eventsArr[i].criticalSeconds[1] + 10800 >= start && eventsArr[i].criticalSeconds[1] + 10800 <= stop) ||
						 (stop >= eventsArr[i].criticalSeconds[0] - 10800 && stop <= eventsArr[i].criticalSeconds[1] + 10800)){
						carCountAft += 1;
						carsBooked.add(eventsArr[i].carName);
						console.log("in!");
					}
				}
				console.log(carsBooked);
	
				if (eqSet(carsBooked, allCars)){
					return resolve("Αδύνατη κράτηση. Αυτοκίνητα μη διαθέσιμα.");
				}
				else
					return resolve("");
			});

		});
	});
}

app.post("/addEvent", (req, res) => {

	var myData = new Event(req.body);
	var start = new Date(myData.startDate);
	var stop  = new Date(myData.endDate);	
	start = start.getTime() / 1000;
	stop = stop.getTime() / 1000;
	var message1 = filterEvents(myData, req.body.categoryName);
	getMessage(start, stop, req.body.categoryName).then(message2 => {
	if (message1 === "" && message2 === ""){
		myData.save().then(item => {
			
			Event.find({categoryName:req.body.categoryName}, function(err, events) {
		  		if (err) throw err;

				Car.find({categoryName:req.body.categoryName}, null, {sort:{'weight':1}}, function(err, cars) {
		  			if (err) throw err;
					
						shuffleEvents(cars,events).then( bookedCarsArr => {	
						
								redirectFunction(app, req.body.categoryName);
								res.redirect(301, '/groups' + req.body.categoryName);
								console.log("neanias");
							});
						}).catch(err => { res.status(400).send("Error1"); });
					}).catch( err => { res.status(400).send("Error2"); });


					})
					.catch(err => {
						res.status(400).send("Unable to save to database");
					});
			}
			else{
			//res.status(400).send("Reasons: " + message1 + " - " +message2);
				res.render('error', {
					curCategory: req.body.categoryName,
					message: message1 + " - " + message2
				});
			}
		});

});

function shuffleEvents(cars, events) {

	return new Promise(function(resolve, reject) {
					var today = new Date();
					
					// Initialize auxiliary variables.
					var eventsArr = [];
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
						
						eventsArr.push({eventId: events[i].id, totalTime: 100000 - totalTime, criticalSeconds: criticalSeconds, startDate: startDate_toDate, prevCarName: events[i].carName});
					}

		var newlySavedEvent = eventsArr[eventsArr.length - 1];
		var breakFlag = false;
		var bookedFlag = false;
		console.log("newlysaved: " + newlySavedEvent.person);	
		for (var i = 0; i < cars.length; i++){
		
			if (events.length == 1) break;
			if (breakFlag) 
				break;

			bookedFlag = false;
			
			for (var j = 0; j < eventsArr.length - 1; j++){
	
				console.log(cars[i].carName + " - " + eventsArr[j].prevCarName);
				if (eventsArr[j].prevCarName == cars[i].carName){
				
					if ((newlySavedEvent.criticalSeconds[0] > (eventsArr[j].criticalSeconds[0] - 10800) && newlySavedEvent.criticalSeconds[0] < (eventsArr[j].criticalSeconds[1] + 10800))){
						
						bookedFlag = true;
						console.log("nene");
						continue;
					}
					else
						if ((newlySavedEvent.criticalSeconds[1] > (eventsArr[j].criticalSeconds[0] - 10800) && newlySavedEvent.criticalSeconds[1] < (eventsArr[j].criticalSeconds[1] + 10800)) ||
							(eventsArr[j].criticalSeconds[0] > (newlySavedEvent.criticalSeconds[0] - 10800) && eventsArr[j].criticalSeconds[0] < (newlySavedEvent.criticalSeconds[1] + 10800)) ||
							(eventsArr[j].criticalSeconds[1] > (newlySavedEvent.criticalSeconds[0] - 10800) && eventsArr[j].criticalSeconds[1] < (newlySavedEvent.criticalSeconds[1] + 10800))){
							
								bookedFlag = true;
								console.log("salas");
								continue;
						}

				}

			}
			if (!bookedFlag){
				newlySavedEvent.prevCarName = cars[i].carName;
				breakFlag = true;
				break;
			}
		}
						var promises = [];
							if (newlySavedEvent.startDate > today && events.length != 1){
									promises.push(updateEventsMongoose(newlySavedEvent.eventId, newlySavedEvent.prevCarName));
							}
							else if (events.length == 1)
									promises.push(updateEventsMongoose(newlySavedEvent.eventId, cars[0].carName));

			Promise.all(promises).then( item => {
				return 	resolve(events);
			});
	});

}

// This function is used in order to redirect in the specific car category groups page.
function redirectFunction(app, catName) {
	app.get('/groups' + catName, function(req, res){
		mongoose.model("Car").find({categoryName: catName}, function(err, cars) {
			mongoose.model("Event").find({categoryName: catName}, function (err, events) {
			
				
				var carsBooked = new Set();

				for (var i = 0; i < events.length; i++)
					carsBooked.add(events[i].carName);

				var carsRemaining = cars.length - carsBooked.size;

				mongoose.model("Category").find({categoryName: catName}, function(err, categories) {
   					res.render('view', {
						carsRemaining : carsRemaining,
						curCategory : catName,
	   					cars : cars,
	  	 				events : events,
	 	  				categories : categories
					});
   				});
   			});
		});
	});
};

app.post('/groups', function(req, res){
	var curCategory = req.body.categoryName;
	mongoose.model("Car").find({categoryName: curCategory}, function(err, cars) {
		mongoose.model("Event").find({categoryName: curCategory}, function (err, events) {
			
			var carsBooked = new Set();

			for (var i = 0; i < events.length; i++)
				carsBooked.add(events[i].carName);
			
			var carsRemaining = cars.length - carsBooked.size;
			console.log("carsRem: " + carsRemaining);
			mongoose.model("Category").find({categoryName: curCategory}, function(err, categories) {
   				res.render('view', {
					carsRemaining : carsRemaining,
					curCategory : curCategory,
	   				cars : cars,
	   				events : events,
	   				categories : categories
				});
   			});
		});
	});
});

app.post('/updateCarForm', function(req, res){
	var curCategory = req.body.categoryName;
	mongoose.model("Car").find({categoryName: req.body.categoryName},null, {sort:{'weight':1}}, function(err, cars) {
   				res.render('updateCar', {
					curCategory : curCategory,
	   				cars : cars
				});
	});
});

app.post('/changeCarVars', function(req, res){
	var curCategory = req.body.categoryName;
	mongoose.model("Car").find({categoryName: req.body.categoryName},null, {sort:{'weight':1}}, function(err, cars) {
   				res.render('changeCar', {
					curCategory : curCategory,
	   				cars : cars
				});
	});
});

app.listen(process.env.PORT || 8080, function() {
	console.log("Open server.");
});

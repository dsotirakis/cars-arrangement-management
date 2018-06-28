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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug');
app.set('views', './views');
//app.use(express.static("public"));
app.use(express.static("node_modules"));
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

	
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://dimitris:abc123456789@bluerent-nqiw4.mongodb.net/test?retryWrites=false");
//autoIncrement.initialize(mongoose.createConnection("mongodb://localhost:27017/node-demo2"));

const Schema = mongoose.Schema;
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

var carSchema = new mongoose.Schema({
    carName: String,
    categoryName: String,
    weight: Number,
    brand : String,
});

var Car = mongoose.model("Car", carSchema);
// Define index page

var eventSchema = new mongoose.Schema({
	startDate : Date,
	endDate : Date,
	categoryName : String,
	carName: String,
	person: String
});

var Event = mongoose.model("Event", eventSchema);

function adminIsLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

app.get("/home", adminIsLoggedIn, (req, res) => {
	mongoose.model("Category").find({}, null, {sort:{'categoryName': 1}}, function (err, categories) {
		res.render('chooseGroups', {
			categories: categories
		});
	});
});

app.post("/updateCar", (req, res) => {
	console.log("body:: " + req.body.weight);
	console.log("lelos: " + req.body.new.length);
	var temp = [];
	var today = new Date();
	for (var i = 0; i < req.body.new.length; i++)
		temp.push(JSON.parse(req.body.new[i]));

	for (var i = 0; i < temp.length; i++)
		console.log("sa;a: " + temp[i].categoryName);
	
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


app.post("/addCategory", (req, res) => {
	var myData = new Category(req.body);
	myData.save().then(item => {
		res.redirect(301, '/home');
	})
	.catch(err => {
		res.status(400).send("Unable to save to database");
	});
});

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
						
							var maxSec = 0;
							for (var i = 0; i < bookedCarsArr.length; i++)
								if (bookedCarsArr[i].modify == 0)
									if (bookedCarsArr[i].criticalSeconds[1] > maxSec)
										maxSec = bookedCarsArr[i].criticalSeconds[1];
					

							var maxAssociatedSec = 0;
							for (var i = 0; i < bookedCarsArr. length; i++)
								if (bookedCarsArr[i].criticalSeconds[0] < maxSec)
									if (bookedCarsArr[i].criticalSeconds[1] > maxAssociatedSec)
										maxAssociatedSec = bookedCarsArr[i].criticalSeconds[1];

							console.log("nininii: " + maxSec + " - " + maxAssociatedSec);

							var tempSum = [];
							for (var i = 0; i < cars.length; i++){
								var sum = 0;
								for (var j = 0; j < bookedCarsArr.length; j++){
									if (bookedCarsArr[j].carName === cars[i].carName && bookedCarsArr[j].criticalSeconds[0] > maxAssociatedSec){
										sum = sum + (bookedCarsArr[j].criticalSeconds[1] - bookedCarsArr[j].criticalSeconds[0]);
									}
								}
								console.log(cars[i].carName + " - " + sum);
								tempSum.push({sum: sum, newCarNo: i});
							}
	
							for (var i = 0; i < tempSum.length; i++){
								console.log(tempSum[i]);
							}
					
	      					tempSum.sort(function(a,b){return b.sum - a.sum});
							for (var i = 0; i < tempSum.length; i++){
								console.log(tempSum[i]);
							}
      						console.log("cars: " + cars);
							var promises = [];

							for (var j = 0; j < cars.length; j++){

	
								var bookedCarsToDelete = [];
								for (var i = 0; i < bookedCarsArr.length; i++){		
									if (bookedCarsArr[i].carName === cars[tempSum[j].newCarNo].carName && bookedCarsArr[i].criticalSeconds[0] > maxAssociatedSec){
								
										promises.push(updateEventsMongoose(bookedCarsArr[i].eventId, cars[j].carName));
										console.log("cars: " + cars[j].carName + " - " + cars[tempSum[j].newCarNo].carName);
									}
								}
									console.log("before: " + bookedCarsArr.length);
								for (var i = 0; i < bookedCarsToDelete.length; i++){
									bookedCarsArr.splice(bookedCarsToDelete[i], 1);
								}
									console.log("agter: " + bookedCarsArr.length);
							}

							Promise.all(promises).then( item => {
								redirectFunction(app, temp.categoryName);
								res.redirect(301, '/groups' + temp.categoryName);
								console.log("neanias");
							});
							});
				});
			});

			})
			.catch(err => {
				res.status(400).send("Unable to save to database");
			});
});

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

function filterEvents(eventData, categoryName) {

	var start = new Date(eventData.startDate);
	var stop  = new Date(eventData.endDate);	
	var today = new Date();


	if (today > stop || today > start){
		var string = "Αδύνατη κράτηση. Η ημερομηνία αρχής της κράτησης, βρίσκεται πριν τη σημερινή μέρα.";
		return string;
	}
	start = start.getTime() / 1000;
	stop = stop.getTime() / 1000;
	console.log(start + " " + stop);

	if (start == stop){
		var string = "Αδύνατη κράτηση. Η αρχή και το τέλος της κράτησης συμπίπτουν.";
		return string;
	}

	if (start > stop){
		var string = "Η ημερομηνία αρχής της κράτησης, είναι μεταγενέστερη από αυτή του τερματισμού. Παρακαλώ διορθώστε.";
		return string;
	}

	

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
						
							var maxSec = 0;
							for (var i = 0; i < bookedCarsArr.length; i++)
								if (bookedCarsArr[i].modify == 0)
									if (bookedCarsArr[i].criticalSeconds[1] > maxSec)
										maxSec = bookedCarsArr[i].criticalSeconds[1];
					

							var maxAssociatedSec = 0;
							for (var i = 0; i < bookedCarsArr. length; i++)
								if (bookedCarsArr[i].criticalSeconds[0] < maxSec)
									if (bookedCarsArr[i].criticalSeconds[1] > maxAssociatedSec)
										maxAssociatedSec = bookedCarsArr[i].criticalSeconds[1];

							console.log("nininii: " + maxSec + " - " + maxAssociatedSec);

							var tempSum = [];
							for (var i = 0; i < cars.length; i++){
								var sum = 0;
								for (var j = 0; j < bookedCarsArr.length; j++){
									if (bookedCarsArr[j].carName === cars[i].carName && bookedCarsArr[j].criticalSeconds[0] > maxAssociatedSec){
										sum = sum + (bookedCarsArr[j].criticalSeconds[1] - bookedCarsArr[j].criticalSeconds[0]);
									}
								}
								console.log(cars[i].carName + " - " + sum);
								tempSum.push({sum: sum, newCarNo: i});
							}
	
							for (var i = 0; i < tempSum.length; i++){
								console.log(tempSum[i]);
							}
					
	      					tempSum.sort(function(a,b){return b.sum - a.sum});
							for (var i = 0; i < tempSum.length; i++){
								console.log(tempSum[i]);
							}
      						console.log("cars: " + cars);
							var promises = [];

							for (var j = 0; j < cars.length; j++){

	
								var bookedCarsToDelete = [];
								for (var i = 0; i < bookedCarsArr.length; i++){		
									if (bookedCarsArr[i].carName === cars[tempSum[j].newCarNo].carName && bookedCarsArr[i].criticalSeconds[0] > maxAssociatedSec){
								
										promises.push(updateEventsMongoose(bookedCarsArr[i].eventId, cars[j].carName));
										console.log("cars: " + cars[j].carName + " - " + cars[tempSum[j].newCarNo].carName);
									}
								}
									console.log("before: " + bookedCarsArr.length);
								for (var i = 0; i < bookedCarsToDelete.length; i++){
									bookedCarsArr.splice(bookedCarsToDelete[i], 1);
								}
									console.log("agter: " + bookedCarsArr.length);
							}

							Promise.all(promises).then( item => {
								redirectFunction(app, req.body.categoryName);
								res.redirect(301, '/groups' + req.body.categoryName);
								console.log("neanias");
							});
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
						
+						arraySort(eventsArr, 'totalTime', {reversed: true});
						
						
						for (var i = 0; i < eventsArr.length; i++){
							console.log("nena: " + eventsArr[i].startDate + " - " + eventsArr[i].totalTime);
						}
		
						// Sort the multimap, based on the event's total time.
						var maxDuration     = -1;
						var count		    =  0;
						var index 		    = -1;
						var durationsToSort = [];
						var breakFlag 		= false;

						var bookedCarsArr = [];
						var bookedCarsArrToAdd = [];
			
						for (var i = 0; i < eventsArr.length; i++)
							if (eventsArr[i].startDate < today)
								bookedCarsArr.push({eventId: eventsArr[i].eventId, carName: eventsArr[i].prevCarName, criticalSeconds: eventsArr[i].criticalSeconds, startDate: eventsArr[i].startDate, modify: 0});
						

						for (var i = 0; i < eventsArr.length; i++){
							if (eventsArr[i].startDate < today){
								continue;
							}
							if (bookedCarsArr.length > 0){

								bookedCarsArrToAdd = [];
									
								for (var k = 0; k < cars.length; k++) {

										var tempBookedArr = bookedCarsArr.filter(function (element){
											return element.carName == cars[k].carName;
										});

		
										if (tempBookedArr.length == 0){
											bookedCarsArrToAdd.push({eventId: eventsArr[i].eventId, carName: cars[k].carName, criticalSeconds: eventsArr[i].criticalSeconds, startDate: eventsArr[i].startDate});
											break;
										}
									
										var toAdd = false;
										var overlapFlag = false;
										for (var j = 0; j < tempBookedArr.length; j++){
											if (cars[k].carName == tempBookedArr[j].carName) {
												if (((eventsArr[i].criticalSeconds[0] >= tempBookedArr[j].criticalSeconds[0] - 10800) && (eventsArr[i].criticalSeconds[0] <= tempBookedArr[j].criticalSeconds[1] + 10800)) ||
											    	((eventsArr[i].criticalSeconds[1] >= tempBookedArr[j].criticalSeconds[0] - 10800) && (eventsArr[i].criticalSeconds[1] <= tempBookedArr[j].criticalSeconds[1] + 10800)) ||
											    	((eventsArr[i].criticalSeconds[0] <= tempBookedArr[j].criticalSeconds[0] - 10800) && (eventsArr[i].criticalSeconds[1] >= tempBookedArr[j].criticalSeconds[0] - 10800)) ||
											    	((eventsArr[i].criticalSeconds[0] <= tempBookedArr[j].criticalSeconds[1] + 10800) && (eventsArr[i].criticalSeconds[1] >= tempBookedArr[j].criticalSeconds[1] + 10800))){
											    	overlapFlag = true;
										    	
										    		continue;
												}
												else{
													if (!toAdd){
														var tempBookedElement = [];
														tempBookedElement.push({eventId: eventsArr[i].eventId, carName: cars[k].carName, criticalSeconds: eventsArr[i].criticalSeconds, startDate: eventsArr[i].startDate});
														toAdd = true;
													}
												}
											}
									
										}
										
										if (toAdd && !overlapFlag){
											bookedCarsArrToAdd = bookedCarsArrToAdd.concat(tempBookedElement);
											breakFlag = true;
										}
										else
											continue;

										if (breakFlag){
											breakFlag = false;
											break;
										}
										
									}

									if (bookedCarsArrToAdd.length == 0){
										console.log("Not availiable date!");
										continue;
									}
									console.log("pwsGinetai");
									bookedCarsArr = bookedCarsArr.concat(bookedCarsArrToAdd);
							}
							else{
								bookedCarsArr.push({eventId: eventsArr[i].eventId, carName: cars[0].carName, criticalSeconds: eventsArr[i].criticalSeconds, startDate: eventsArr[i].startDate});
							}
						}

						var promises = [];
						for (var i = 0; i < bookedCarsArr.length; i++){
							if (bookedCarsArr[i].startDate > today){
									promises.push(updateEventsMongoose(bookedCarsArr[i].eventId, bookedCarsArr[i].carName));
							}
						}

			Promise.all(promises).then( item => {
				return 	resolve(bookedCarsArr);
			});
	});

}

// This function is used in order to redirect in the specific car category groups page.
function redirectFunction(app, catName) {
	app.get('/groups' + catName, function(req, res){
		mongoose.model("Car").find({categoryName: catName}, function(err, cars) {
			mongoose.model("Event").find({categoryName: catName}, function (err, events) {
				mongoose.model("Category").find({categoryName: catName}, function(err, categories) {
   					res.render('view', {
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
			console.log("salasala: " + events.length);
			mongoose.model("Category").find({categoryName: curCategory}, function(err, categories) {
   				res.render('view', {
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
	mongoose.model("Car").find({categoryName: req.body.categoryName}, function(err, cars) {
   				res.render('updateCar', {
					curCategory : curCategory,
	   				cars : cars
				});
	});
});

app.listen(process.env.PORT || 8080, function() {
	console.log("Open server.");
});

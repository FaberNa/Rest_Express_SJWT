// =======================
// get the packages we need ============
// =======================
var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');

var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model
var Car    = require('./app/models/car'); // get our mongoose model
// API ROUTES -------------------

// get an instance of the router for api routes
var apiRoutes = express.Router();

// =======================
// configuration =========
// =======================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database
app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =======================
// routes ================
// =======================
// basic route
app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

//API for setup new user
app.get('/setup', function(req, res) {

    // create a sample user
    var nick = new User({
        name: 'Nick1',
        password: 'password',
        email: 'email@gmail.com',
        admin: true
    });

    // save the sample user
    nick.save(function(err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({ success: true });
    });
});

//check if email is already in the store

app.post('/signUp',function(req,res){
    var name = req.body.name || req.query.name;
    var password = req.body.password || req.query.password;
    var email= req.body.email || req.query.email;

    if(email){
        User.findOne({email:email}, function(err,user){
            if(user) {
                res.json({
                    success: false,
                    message: 'User with ' + user.email + ' is already defined'
                });
            }else{
                var newUser = new User({
                    name: name,
                    password: password,
                    email: email,
                    admin: true
                });
                newUser.save(function(err) {
                    if (err) throw err;

                    console.log('User saved successfully');
                    res.json({ success: true });
                });
            }
        });

    }
});
// TODO: route to authenticate a user (POST http://localhost:8080/api/authenticate)
// route to authenticate a user (POST http://localhost:8080/api/authenticate)
apiRoutes.post('/authenticate', function(req, res) {

    console.log(req.body.name);

    // find the user
    User.findOne({
        name: req.body.name
    }, function(err, user) {

        if (err) throw err;

        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {

            // check if password matches
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {

                // if user is found and password is right
                // create a token
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn: 60*(1440) // expires in 24 hours value is in second
                });

                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }

        }

    });
});

// TODO: route middleware to verify a token
// route middleware to verify a token
apiRoutes.use(function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });

    }
});


// route to show a random message (GET http://localhost:8080/api/)
apiRoutes.get('/', function(req, res) {
    res.json({ message: 'Welcome to the coolest API on earth!' });
});



// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function(req, res) {
    User.find({}, function(err, users) {
        res.json(users);
    });
});

// route to return all cars for User (GET http://localhost:8080/api/CarsByUser)
apiRoutes.get('/CarsByUser', function(req, res) {
    var idUser = req.query.name;
    var tmp = this;
    console.log(idUser);
    User.findOne({
        name: idUser
    }, function(err, user) {

        if (err) throw err;

        if (!user) {
            res.json({success: false, message: 'Authentication failed. User not found.'});
        } else if (user) {
            tmp.car = user.auto;
            tmp.cars=[];
            if (tmp.car){
                for (var i = 0; i < tmp.car.length; i++) {
                    tmp.cars.push(tmp.car[i]);
                }
                res.json(tmp.cars);


            }else{
                return res.status(403).send({
                    success: false,
                    message: 'No cars associated'
                });
            }
        }
    });
});


apiRoutes.get("/getCar",function(req,res){

    var obj =req.body.carid||req.query.carid;

    Car.findOne({_id:obj},function(err,car){
        if(err) throw err;
        if(!car){
            res.json({success: false, message: 'No car for user'});
        }else if(car){
            res.json(car);

        }
    });

});

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);

// API ROUTES -------------------
// we'll get to these in a second

// =======================
// start the server ======
// =======================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
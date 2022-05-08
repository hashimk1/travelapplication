// Importing all the necessary libraries with 'require'
var express = require('express')
var bodyParser = require('body-parser')
var mongoose = require('mongoose');
var validator = require ('express-validator');
var expressSanitizer = require('express-sanitizer');
var session = require ('express-session');

const app = express()
const port = 8000


// Initialising connection to my mongo database
mongoose.connect("mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test");
mongoose.connection
    .once('open', () => console.log('Connected successfully to MongoDB...\nApplication running.....'))
    .on('error', (error) => {
        console.warn('Warning', error);
    });



// Added for session management
app.use(session({
    secret: 'sessionsecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));


app.use(expressSanitizer());
app.use(bodyParser.urlencoded({extended: true}))



// To retrieve and run the 'main.js' file in the routes folder
require('./routes/main')(app);
// To retrieve the 'views' folder
app.set('views',__dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
// To retireve the 'assets' folder
app.set('assets', __dirname + '/assets');
app.use(express.static('assets'));


// Displays to show that the server is successfully running
app.listen(port, () => console.log(`Server listening on port ${port}.`));
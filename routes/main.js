module.exports = function(app)
{



  // Reusable variables to use for the messagestatus
  var bootstrapLink = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384+0n0xVW2eSR5OomGNYDnhzAbDsOXxcvSN1TPprVMTNDbiYZCxYbOOl7+AMvyTG2x" crossorigin="anonymous">'
  var navBar = '<nav class="navbar navbar-expand-lg"><div class="container-fluid"><a class="navbar-brand" a href="/">Travel Network</a></div></nav>'
  var cssLink = '<link rel="stylesheet" href="css/style.css">'
  
    var{check, validationResult} = require('express-validator')

    // Function to move users who aren't logged in back to the authentication page
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('./authentication')
        } 
        else { 
            next ();
        }
    }
    
    
////////////////////////////////////***  Authentication Page  ***///////////////////////////////////////

    // Displays the login/register page onto the webpage
    app.get('/authentication',function(req,res){
        res.render("authentication.html");
    });

    // Processing the information submitted in the form
    // Validation to ensure email is in an email format, i.e contains '@' and password must be of length minimum 8. 
    app.post('/registerstatus', [check('username').isLength({min:6}), check('password').isLength({min:8})], function (req,res) {

    var errors = validationResult(req);
    if (!errors.isEmpty()) {
    res.redirect('./authentication'); }
    else {

        // Bcrypt allows the password to be hashed to ensure extra security
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        const plainPassword = req.sanitize(req.body.password);

        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {

        var MongoClient = require('mongodb').MongoClient; // Connecting to the database
        var url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";
                                                                                                               
        MongoClient.connect(url, function(err, client) {
        if (err) throw err;
        var db = client.db ('travelappDB');
        // Inserts each value in the register form into the collection 'Users' to be stored in the database  
        db.collection('users').insertOne({ 
        username: req.body.username,
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        password: hashedPassword,
        friends: "",
        destination: "",
        departure: "",
        arrival: ""                                                                                               
        });
        req.session.userId = req.body.username
        res.render('finishregistration.html')
        });
    });
    };
    });


    // Going over the database to see if user exists
    app.post('/loginstatus', function (req,res) {
        var MongoClient = require('mongodb').MongoClient;
        var url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";

        MongoClient.connect(url, function(err, client) {
            if (err) throw err;
            var db = client.db ('travelappDB');

            const bcrypt = require('bcrypt');   
            const saltRounds = 10;             
            const plainPassword = req.body.password;

            db.collection('users').findOne({username:req.body.username}, (findErr, results) => {
            if(err) throw err;
            if(results != null){
                bcrypt.compare(plainPassword, results.password, function(err, result){
                if(err) throw err;
                if(result == true){
                    req.session.userId = req.body.username
                    res.send(bootstrapLink + navBar + cssLink + '<div class="messagestatus">You have successfully logged in!')
                }
                else{
                    res.send(bootstrapLink + navBar + cssLink + '<div class="messagestatus">Try again, you have entered the wrong password')
                }
                })
            }else{
                res.send(bootstrapLink + navBar + cssLink + '<div class="messagestatus">User not found')
                }
            })
        })
    })


    // Destroys the current session management, meaning user needs to login again to view other webpages.
    app.get('/logout', redirectLogin, (req,res) => {
        req.session.destroy(err => {
        if (err) {
          return res.redirect('/authentication')
        }
         res.send(bootstrapLink + navBar + cssLink + '<div class="messagestatus">You are now logged out. Goodbye');
        })
      })




////////////////////////////////////***  Home Page/Posts  ***///////////////////////////////////////

app.get('/', redirectLogin, function (req,res) {
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";

  MongoClient.connect(url, function(err, client) {
      if (err) throw err;
      var db = client.db ('travelappDB');
      var thisuser = req.session.userId;

      db.collection('users').find({username: thisuser}).toArray((findErr, thecurrentuser) => {
      if(findErr) {
        throw err;
      } else {
        db.collection('posts').find().sort({$natural: -1}).toArray((findErr, results) => {
          if (findErr){
            throw findErr
          } else{
            res.render('home.ejs', {currentuser: thecurrentuser, availableposts: results})
          }
        });
      }
      })
  })
})


// When post button is pressed - Instructions for when user sends a post
app.post("/postadded", (req, res) => {
  var MongoClient = require('mongodb').MongoClient;
  const url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";
  var date = new Date();

  function getOrdinal(n) {
    let ord = ["st", "nd", "rd"]
    let exceptions = [11, 12, 13]
    let nth = 
    ord[(n % 10) - 1] == undefined || exceptions.includes(n % 100) ? "th" : ord[(n % 10) - 1]
    return n + nth
}

  const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  MongoClient.connect(url, (err, client) => {
    if (err) throw err;
    var db = client.db('travelappDB');
    db.collection('posts').insertOne({
      username: req.session.userId,
      message: req.body.message,
      timeDate: getOrdinal(date.getDate()) + ' ' + month[date.getMonth()] + ' ' + date.getFullYear() + ' (' + date.toLocaleString('en-GB', { hour: 'numeric', minute: 'numeric', hour12: true }) + ')'
    } , function (err, result) {
      if (err) throw err;
      res.send(bootstrapLink + navBar + cssLink + '<div class="messagestatus">Post has been added')
    });
  });
})


////////////////////////////////////***  Find Friends Page  ***///////////////////////////////////////

app.get('/findfriends', redirectLogin, function(req, res) {
  var MongoClient = require('mongodb').MongoClient;
  const url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";

  MongoClient.connect(url, function (err, client) {
     if (err) throw err;
     var db = client.db('travelappDB');
     db.collection('users').find().toArray((findErr, results) => {
         if (findErr) throw findErr;
         else
          res.render('findfriends.ejs', {allusers:results});
       });
  });
});



app.post('/friendadded', function(req, res) {
  var MongoClient = require('mongodb').MongoClient;
  const url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";
  var thisuser = req.session.userId;

  MongoClient.connect(url, function (err, client) {
     if (err) throw err;
     var db = client.db('travelappDB');

     db.collection('users').updateOne({username: thisuser}, {$set: {
      friends: [req.body.addfriend]
    }});
      res.send(bootstrapLink + navBar + cssLink + '<div class="messagestatus">Friend Added')
       });
  });




////////////////////////////////////***  Registration Completetion Form  ***///////////////////////////////////////


app.post("/infoadded", (req, res) => {
  var MongoClient = require('mongodb').MongoClient;
  const url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";


  MongoClient.connect(url, (err, client) => {
    if (err) throw err;
    var db = client.db('travelappDB');
    var thisuser = req.session.userId;

    var newDate = new Date(req.body.birthday);

    function getOrdinal(n) {
      let ord = ["st", "nd", "rd"]
      let exceptions = [11, 12, 13]
      let nth = 
      ord[(n % 10) - 1] == undefined || exceptions.includes(n % 100) ? "th" : ord[(n % 10) - 1]
      return n + nth
  }
  
    const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  
    birthdayFormat = getOrdinal(newDate.getDate()) + ' ' + month[newDate.getMonth()] + ' ' + newDate.getFullYear()

    db.collection('users').updateOne({username: thisuser}, {$set: {
      location: req.body.location,
      birthday: birthdayFormat,
      dreamcountry : req.body.dreamcountry,
      countryvisited : [req.body.countryvisited1, req.body.countryvisited2, req.body.countryvisited3]
    }});
      res.send(bootstrapLink + navBar + cssLink + '<div class="messagestatus">Registration completed')
       
  });
 
  });


/////------------------------------------- WEATHER PAGE ---------------------------------------------------------------\\\\\

app.get('/weather', redirectLogin, function(req,res){
  res.render('weatherform.html')
});

/////--------------- DISPLAYS WEATHER INFORMATION OF THE CITY SEARCHED ---------------------\\\\\

app.get('/weather-result', function(req,res){
  const request = require('request');
          
  let apiKey = 'bf1adaa596367a42f178ac022c30bf56';
  let city = req.query.city;
  let url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`
               
  request(url, function (err, response, body) {
    if(err){
      console.log('error:', error);
    } else {
      try{
      var weatherObj = JSON.parse(body)
      var output = bootstrapLink + navBar + cssLink + '<div class="messagestatus"> Country/City - ' + weatherObj.name + '<br>' + 'Temperature - ' + weatherObj.main.temp + '°C' + '</div>';
      res.send (output);
      }catch(err){
        res.send(bootstrapLink + navBar + cssLink + '<div class="messagestatus">Invalid input. Enter a valid Country/City name')
      }
    } 
  });
  });    


/////------------------------------------- DELETE ACCOUNT PAGE ---------------------------------------------------------------\\\\\


app.get('/deleteaccount', function (req,res) {
  var MongoClient = require('mongodb').MongoClient;
  var url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";

  MongoClient.connect(url, function(err, client) {
      if (err) throw err;
      var db = client.db ('travelappDB');
      var thisuser = req.session.userId;

      db.collection('users').find({username: thisuser}).toArray((findErr, thecurrentuser) => {
      if(findErr) {
        throw err;
      } else {
            res.render('deleteaccount.ejs', {currentuser: thecurrentuser})
          }
        });
      })
      })


  app.post('/accountdeleted', redirectLogin, function (req,res) {
        var MongoClient = require('mongodb').MongoClient;
        var url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";
      
        MongoClient.connect(url, function(err, client) {
            if (err) throw err;
            var db = client.db ('travelappDB');
      
            db.collection('users').deleteOne({username: req.body.deleteduser});
            req.session.userId = null;
            res.send(bootstrapLink + navBar + cssLink + '<div class="messagestatus"> Account deleted')
            });
          });
            
      

/////------------------------------------- TRAVEL PLANNER PAGE ---------------------------------------------------------------\\\\\

app.get('/travelplanner', redirectLogin, function(req, res) {
  var MongoClient = require('mongodb').MongoClient;
  const url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";

  MongoClient.connect(url, function (err, client) {
     if (err) throw err;
     var db = client.db('travelappDB');
     db.collection('users').find().toArray((findErr, results) => {
         if (findErr) throw findErr;
         else
          res.render('travelplanner.ejs', {allusers:results});
       });
  });
});



app.post("/addedtravelplan", (req, res) => {
  var MongoClient = require('mongodb').MongoClient;
  const url = "mongodb+srv://travelapp:travelapp@travelappdb.e79gx.mongodb.net/test";


  MongoClient.connect(url, (err, client) => {
    if (err) throw err;
    var db = client.db('travelappDB');
    var thisuser = req.session.userId;

    var departureDate = new Date(req.body.departure);
    var arrivalDate = new Date(req.body.arrival);

    function getOrdinal(n) {
      let ord = ["st", "nd", "rd"]
      let exceptions = [11, 12, 13]
      let nth = 
      ord[(n % 10) - 1] == undefined || exceptions.includes(n % 100) ? "th" : ord[(n % 10) - 1]
      return n + nth
  }
  
    const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  
    departureFormat = getOrdinal(departureDate.getDate()) + ' ' + month[departureDate.getMonth()] + ' ' + departureDate.getFullYear();
    arrivalFormat = getOrdinal(arrivalDate.getDate()) + ' ' + month[arrivalDate.getMonth()] + ' ' + arrivalDate.getFullYear();

    db.collection('users').updateOne({username: thisuser}, {$set: {
      destination: req.body.destination,
      departure: departureFormat,
      arrival : arrivalFormat
    }});
      res.send(bootstrapLink + navBar + cssLink + '<div class="messagestatus">Travel Plan added successfully')
       
  });
 
  });











}
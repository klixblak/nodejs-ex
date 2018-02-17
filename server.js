//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan'),
    http    = require('http');

var data = JSON.stringify({'id': '2'
                          });
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/sailing-conditions', function (req, res) {
        
        // try to initialize the db on every request if it's not already
        // initialized.
        if (!db) {
            initDb(function(err){});
        }
        if (db) {
        db.collection('counts').count(function(err, count ){
                                      res.send('{ Wind Speed: ' + count + '}');
                                      });
        } else {
        res.send('{ Wind Speed: ERROR }');
        }

        
});

app.get('/weatherinfo:location', function(req, res)
        {
        const url = "http://api.openweathermap.org/data/2.5/weather?q=" + req.params.location + "&units=imperial&appid=7938d1ebc15262643719cfe6bb490b35";
        console.log("URL: " + url);
        
        var data = "";
        
        http.get(url, api_res =>
                 {
                 api_res.setEncoding("utf8");
                 let body = "";
                 api_res.on("data", data =>
                            {
                            body += data;
                            });
                 
                 api_res.on("end", () =>
                            {
                            body = JSON.parse(body);
                            
                            // did the passed location exist?
                            if (body.cod != '404')
                            {
                            // show the full results in the console
                            console.log(body);
                            //res.write(JSON.stringify(body));
                            
                            // create the specific JSON for the specialised response back to the caller
                            res.json({Location:body.name , WindSpeed:body.wind.speed*1.943844 , WindDirection:body.wind.deg , Temperature:body.main.temp , Overview:body.weather[0].main});
                            res.end();
                            }
                            });
                 
                 });
        })


app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;

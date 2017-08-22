var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var documents = require('./routes/documents');
var dbConnect = require('./config/connect');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
app.use('/documents', documents);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


function getDatabaseUrl(dbName) {
  return `postgres://yhemmy@localhost/${dbName}`;
}

var elastic = require('./elasticsearch');
function initElasticSearch(indexName, db, query) {
  return elastic.indexExists(indexName).then((exists) => {
  if (exists) {
    return elastic.deleteIndex(indexName);
  }
}).then(() => elastic.initIndex(indexName))
  .then(() => dbConnect(db))
  .then(client => client.query(query))
  .then(async (res) => {
    if(res.rows.length > 0) {
      const properties = Object.keys(res.rows[0]).reduce((acc, val) => {
        acc[val] = { type: (typeof res.rows[0][val] === 'number' && 'integer') || typeof res.rows[0][val] }
        return acc;
      }, {});
      await elastic.initMapping(indexName, properties)
      return Promise.all(res.rows.map((document) => elastic.addDocument(document, indexName)));
    }
    return Promise.resolve('no value in databse');
  })
  .then((res) => console.log(res, 'resposne'))
  .catch(e => console.log(e, 'error from appjs'));
}

function init() {
  const database_one = {
    url: 'test_elastic_search',
    indexName: 'books',
    query: 'select * from books'
  }
  const database_two = {
    url: 'test_database_two',
    indexName: 'users',
    query: 'select * from users'
  }
  const databaseThree = {
    url: 'test_database_three',
    indexName: 'movies',
    query: 'select * from movies'
  }
  const dbArray = [database_one, database_two, databaseThree];
  return Promise.all(dbArray.map((fromDb) => 
    initElasticSearch(fromDb.indexName, getDatabaseUrl(fromDb.url), fromDb.query)))

}
init();
setInterval(() => {
  init();
}, 1000* 60 * 2)



module.exports = app;

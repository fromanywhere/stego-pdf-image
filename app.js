var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var io = require('socket.io');
var timeout = require('connect-timeout');
var hbs = require('express-hbs');

var app = express();

global.appRoot = path.resolve(__dirname);
global.jobs = {};

var routes = require('./routes/index');
var pdf2svg = require('./routes/pdf2svg');
var uploadPdf = require('./routes/uploadPdf');
var svg2pdf = require('./routes/svg2pdf');
var uploadSvg = require('./routes/uploadSvg');
var detect = require('./routes/detect');
var detectPdf = require('./routes/detectPdf');

// view engine setup
app.engine('hbs', hbs.express4());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(timeout('360s'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/pdf2svg', pdf2svg);
app.use('/uploadPdf', uploadPdf);
app.use('/svg2pdf', svg2pdf);
app.use('/uploadSvg', uploadSvg);
app.use('/detect', detect);
app.use(haltOnTimedout);
app.use('/detectPdf', detectPdf);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

function haltOnTimedout(req, res, next){
  if (!req.timedout) next();
}

var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
})

io = io(server);
io.on('connection', function (socket) {
	socket.emit('registration', { id: socket.id });
	global.jobs[socket.id] = {
		socket: socket,
		name: socket.id
	};

	console.log('');
	console.log('New connection:', socket.id);
	console.log('Total clients:');
	for (var job in global.jobs) {
		console.log(global.jobs[job].name);
	}
	console.log('');

	socket.on('disconnect', function () {
		var currentJobName = global.jobs[this.id].name;
		if (delete global.jobs[this.id]) {
			console.log(currentJobName, 'successly disconnected');
		}
	});
});

module.exports = app;

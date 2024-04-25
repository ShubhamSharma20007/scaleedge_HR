const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const hbs = require('hbs');
const { detect } = require('detect-browser'); 
const flash = require('connect-flash');
const http = require('http');

const indexRouter = require('./routes/index');
const db = require('./database');
const app = express();
// Middleware to handle cases where session is null
function checkSession(req, res, next) {
    if (!req.session) {
      res.redirect('/');
    } else {
      next();
    }
  }
  
const staticpath = path.join(__dirname,);
const templatespath = path.join(__dirname, "./templates/views");
const partialpath = path.join(__dirname, "./templates/partials");
app.set('view engine', 'hbs');
app.set("views", templatespath);
hbs.registerPartials(partialpath);
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'webslesson',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 60 * 60 * 1000 // One hour in milliseconds
    }
}));

app.use(flash())

const device = require('express-device');
app.use(device.capture());

// Middleware to set X-Title header


const machineId = require('node-machine-id'); // Add this line
// Function to get machine ID
async function getMachineId() {
    try {
        const id = await machineId.machineId();
        return id;
    } catch (error) {
        console.error('Error getting machine ID:', error);
        return null;
    }
}

app.use('/', async (req, res, next) => {
    const isLocalhost = req.hostname === 'scaleedge.thestockedge.com';
    const deviceInfo = req.device.type;

    if (isLocalhost) {
        const machineId = await getMachineId();
        if (machineId) {
            db.query('INSERT INTO detect (machine_id) VALUES (?)', [machineId], (err, result) => {
                if (err) {
                    console.error('Error storing device information:', err);
                } else {
                    console.log('Device information stored successfully.');
                }
            });
        }
    }

    // Browser detection
    const userAgent = req.headers['user-agent'].toLowerCase();
    const isChromeOrSafari = userAgent.includes('chrome') || (userAgent.indexOf('safari') !== -1 && userAgent.indexOf('chrome') === -1);
    const isVivoBrowser = userAgent.includes('vivo');
    const isOperaMini = userAgent.includes('opr') || userAgent.includes('pie') || userAgent.includes('miui') || userAgent.includes('MiuiBrowser') || userAgent.includes('samsung') || userAgent.includes('SamsungBrowser');
    const isRealmeBrowser = userAgent.includes('ie');
    const isUCBrowser = userAgent.includes('ucbrowser') || userAgent.includes('ucweb');
    const isFirefox = userAgent.includes('firefox');
    const isEdge = userAgent.includes('edg')

    if ((isChromeOrSafari || isFirefox || isEdge) && !isVivoBrowser && !isOperaMini && !isUCBrowser && !isRealmeBrowser) {
        next();
    } else {
        res.send('<script>alert("Unsupported browser. Please use Chrome, Safari, or Firefox.");</script>');
    }
}, indexRouter);



// Routes
app.use('/', indexRouter);

function generateHTML(title, description) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <meta name="description" content="${description}">
            <meta property="og:title" content="${title}">
            <meta property="og:description" content="${description}">
            <!-- Other meta tags and link tags -->
        </head>
        <body>
            <h1>${title}</h1>
            <p>${description}</p>
            <!-- Other page content -->
        </body>
        </html>
    `;
}

const server = http.createServer((req, res) => {
    const title = 'Your Page Title';
    const description = 'Your page description goes here';

    const htmlContent = generateHTML(title, description);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
});

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//     next(createError(404));
//   });
  
//   // error handler
//   app.use(function(err, req, res, next) {
//     // set locals, only providing error in development
//     res.locals.message = err.message;
//     res.locals.error = req.app.get('env') === 'development' ? err : {};
  
//     // render the error page
//     res.status(err.status || 500);
//     res.render('error');
//   });

app.listen(7000, () => {
    console.log('Listening on port 7000...');
});

module.exports = app;

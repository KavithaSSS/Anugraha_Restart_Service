// /* eslint-disable no-undef */
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mountRoutes = require('./routes');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const constants = require('./constants');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const app = express();
/* middleware */
app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({
  origin: ['http://localhost:8003','http://localhost:8088', 'http://localhost:8083','http://localhost:8082','http://localhost:8090','http://172.16.1.201:8074',
    'http://localhost:3001','http://localhost:3002','http://localhost:3002','http://localhost:89','http://localhost:8091','http://localhost:8070','http://172.16.1.201:8070','http://172.16.1.201:8072' ],// Replace with your React app’s URL
  credentials: true // This is essential for sending cookies cross-origin
}));

app.use(session({
  secret: 'Shiva#12344', // Replace with a secure secret key
  resave: false,             // Don't resave the session if not modified
  saveUninitialized: true,   // Save session even if it's uninitialized
  cookie: {
    httpOnly: true,          // Prevent client-side access to the cookie
    secure: false,           // Set to `true` for HTTPS in production
    maxAge: 24 * 60 * 60 * 1000  // Set expiration time for the cookie (1 day)
  }
}));

app.use(express.json({limit: '50mb'})); // request payload middleware
app.use(bodyParser.json({
  limit: '50mb'
}));
app.use(express.urlencoded({limit: '50mb',  extended: true }));
app.use(bodyParser.urlencoded({
  limit: '50mb',
  parameterLimit: 100000,
  extended: true 
}));
mountRoutes(app);

const PORT = constants.ENV.PORT || 3002;
app.use(express.static('public'));
app.use('/images', express.static('images'));
app.listen(PORT,() => {
  // console.log(`Server listening on port ${PORT}`);
  console.log(`Retail POS Portal API ${PORT}`);
});

app.post('/restart-service', async (req, res) => {
  const serviceName = 'testadminapi';
  
  try {
    // Query service status
    const { stdout } = await execPromise(`sc query "${serviceName}.exe"`);
    
    let message = '';
    
    if (stdout.includes('RUNNING')) {
      console.log('Service is running, restarting...');
      await execPromise(`net stop "${serviceName}"`);
      await execPromise(`net start "${serviceName}"`);
      message = 'Service restarted successfully';
    } else if (stdout.includes('STOPPED')) {
      console.log('Service is stopped, starting...');
      await execPromise(`net start "${serviceName}"`);
      message = 'Service restarted successfully';
    } else {
      return res.status(400).json({ 
        error: 'Service status unknown',
        status: stdout 
      });
    }
    
    res.json({ message });
    
  } catch (err) {
    console.error('Service operation failed:', err.message);
    res.status(500).json({ 
      error: 'Failed to manage service',
      details: err.message 
    });
  }
});

app.use(function (err, res,) {
  res.status(500).send({
    status: 500,
    message: err.message,
    body: {}
  });
});


//Deployment coding
 

// const express = require('express');

// const cors = require('cors');
// const session = require('express-session');
// const cookieParser = require('cookie-parser');
// const helmet = require("helmet");
// const mountRoutes = require('./routes');

// const bodyParser = require('body-parser');
// const swaggerUi = require("swagger-ui-express");
// const swaggerSpec = require('./swagger');
// const path = require('path');
// const { exec } = require('child_process');
// const constants = require('./constants');

// const app = express();
// app.use(helmet());
// const CSRFKEY = '06vUSNEzq1z9U476UrMEx7xIOPGYfu2m';
// // cors
// app.use(cors({
//   origin: ['http://localhost:8003','http://localhost:8088', 'http://localhost:8083','http://localhost:8082','http://localhost:8090','http://172.16.1.201:8074',
//     'http://localhost:3001','http://localhost:3002','http://localhost:3002','http://localhost:89','http://localhost:8091','http://localhost:8070','http://172.16.1.201:8070','http://172.16.1.201:8072' ],// Replace with your React app’s URL
//   credentials: true // This is essential for sending cookies cross-origin
// }));
// app.use(cookieParser('secret'));
// app.use(express.static(path.join(__dirname, 'dist')));
// var sess = {
//     secret: CSRFKEY,
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: true }
// }

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

// if (app.get('env') === 'production') {
//   app.set('trust proxy', 1) // trust first proxy
//   sess.cookie.secure = true // serve secure cookies
// }
// app.use(session(sess));
// // request payload middleware
// app.use(express.json({ limit: '50mb' }));
// app.use(bodyParser.json({
//   limit: '50mb'
// }));
// app.use(express.urlencoded({ limit: '50mb', extended: true }));
// app.use(bodyParser.urlencoded({
//   limit: '50mb',
//   parameterLimit: 100000,
//   extended: true
// }));
// mountRoutes(app);

// // app.get('/', (req, res, next) => {
// //   res.send('POS Billing API');
// // });


// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use('/images', express.static(path.join( path.resolve(), 'images')));
// app.use('/items', express.static(path.join( path.resolve(), 'items')));
// /** Swagger url */
// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerSpec)
// );

// const PORT = constants.ENV.PORT;

// // app.listen(PORT, () => {
// //   console.log(`Server listening on port ${PORT}`);
// //  exec(`start http://localhost:${PORT}`);
// // });

// // error handler middleware
// app.use(function (err, req, res, next) {
//   res.status(500).send({
//     status: 500,
//     message: err.message,
//     body: {}
//   });
// })
// app.use(express.static('public'));
// app.use('/api/public/images', express.static(path.join(__dirname, 'public/images')));

// const startServer = () => {
//   app.listen(PORT, () => {
//     console.log(`Backend running on http://localhost:${PORT}`);
//   });
// };

// // Export the function to start the server
// module.exports = startServer;


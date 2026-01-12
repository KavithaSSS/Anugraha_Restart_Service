// /* eslint-disable no-undef */
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
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

const PORT = constants.ENV.PORT || 3002;
app.use(express.static('public'));
app.use('/images', express.static('images'));
app.listen(PORT,() => {
  // console.log(`Server listening on port ${PORT}`);
  console.log(`Restart API ${PORT}`);
 
});


app.get('/', (req, res, next) => {
  res.send('Restart API');
});

app.post('/restart-service', async (req, res) => {
  const serviceName = 'anugraha_cashier_api';
  
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

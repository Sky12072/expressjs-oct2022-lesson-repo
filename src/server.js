const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');

// Set values for the server's address
const PORT = process.env.PORT || 0;
const HOST = '0.0.0.0';

// Cool trick for when promises or other complex callstack things are crashing & breaking:
void process.on('unhandledRejection', (reason, p) => {
    console.log(`Things got pretty major here! Big error:\n`+ p);
    console.log(`That error happened because of:\n` + reason);
});

// Configure server security, based on documentation outlined here:
// https://www.npmjs.com/package/helmet
// TLDR: Very niche things from older days of the web can still be used to hack APIs
// but we can block most things with these settings.
app.use(helmet());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.contentSecurityPolicy({
    directives:{
        defaultSrc:["'self'"]
    }
}));

// Configure API data receiving & sending
// Assume we always receive and send JSON
// The backend and frontend are communicating via JSON. 
app.use(express.json());
app.use(express.urlencoded({extended:true}));


// Configure CORS, add domains to the origin array as needed.
// This is basically where you need to know what your ReactJS app is hosted on.
// eg. React app at localhost:3000 and deployedApp.com can communicate to this API, 
// but a React app at localhost:3001 or SomeRandomWebsite.com can NOT communicate to this API. 
var corsOptions = {
    origin: ["http://localhost:3000", "https://deployedApp.com"],
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));


require('dotenv').config(); //it loads up the env file and ready to go, without storing it into a variable. 

// console.log("Firebase project ID is: " + process.env.FIREBASE_ADMIN_PROJECT_ID)

//initilize firebase
const firebaseAdmin = require('firebase-admin');
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert({// we need build a certificate and using a custom data, not locked in to firebase. ie. deployment database, we need to build our own certificate. 
        "projectId": process.env.FIREBASE_ADMIN_PROJECT_ID,
        "privateKey": process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        "clientEmail": process.env.FIREBASE_ADMIN_CLIENT_EMAIL
    })  

});


const {databaseConnector} = require('./database');

// databaseConnector("some mongo string")

// if it's a not a test environment
if (process.env.NODE_ENV != "test") {
    const DATABASE_URI = process.env.DATABASE_URI || "mongodb://localhost:27017/ExpressLessonOctLocal" 
    //what is 27017 coming from, and why when I changed it, it'll fail ? 27017 is the default mongoose url maybe
    databaseConnector(DATABASE_URI).then(() => {
        // if database connection succeeded, log a nice success message
        console.log("Database connected, wohoo!!")
    }).catch(error => {
        // if database connection failed, log the error
        console.log(`
        Some error occured, it was: 
        ${error}
        `)
    });
}

//------------------------------------------------
// Config Above
// Routes Below


// Actual server behaviour
app.get('/', (req, res) => { // example of req: authorisation, form data. Res is what the server send back to the front end.
    console.log('ExpressJS API homepage received a request.');
  
    const target = process.env.NODE_ENV || 'not yet set';
    res.json({
        'message':`Hello ${target} world, wohoooo!`
    });

});

const importedBlogRouting = require('./Blogs/BlogsRoutes');
app.use('/blogs', importedBlogRouting);
// localhost:55000/blogs/blaa


const importedUserRouting = require('./Users/UserRoutes');
app.use('/users', importedUserRouting)


// Notice that we're not calling app.listen() anywhere in here.
// This file contains just the setup/config of the server,
// so that the server can be used more-simply for things like Jest testing.
// Because everything is bundled into app, 
// we can export that and a few other important variables.
module.exports = {
    app, PORT, HOST
}
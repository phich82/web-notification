// Refer: https://github.com/web-push-libs/web-push

require('dotenv').config({ debug: true });

const express = require("express");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const port = 5000;
const ENV = process.env;

console.log('ENV => ', ENV)

// Set static path
app.use(express.static(path.join(__dirname, "../")));

app.use(bodyParser.json());

webpush.setVapidDetails("mailto:test@test.com", ENV.PUBLIC_VAPID_KEY, ENV.PRIVATE_VAPID_KEY);

// Subscribe Route
app.post("/subscribe", (req, res) => {
  // Get pushSubscription object
  const subscription = req.body;

  console.log('subscription => ', new Date().toUTCString(), subscription)

  // Send 201 - resource created
  res.status(201).json({});

  // Create payload
  const payload = JSON.stringify({ title: "Push Test", body: 'This is message from server.' });

  // Pass object into sendNotification
  webpush
    .sendNotification(subscription, payload)
    .catch(err => console.error(err));
});

app.listen(port, () => console.log(`Server started on port ${port}`));

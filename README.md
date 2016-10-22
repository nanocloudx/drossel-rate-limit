# drossel-rate-limit
Unneccesary request rate limitter

[![NPM](https://nodei.co/npm/drossel-rate-limit.png)](https://nodei.co/npm/drossel-rate-limit/)

## What is this?
"drossel-rate-limit" is append rate limit to request.   
Compatible to Express and ioredis.  

## Install
step1: npm install
```
npm install drossel-rate-limit
```

step2: import and settings
```
const express = require('express');
const Redis = require('ioredis');
const RateLimit = require('drossel-rate-limit');

const app = express();
app.use(new RateLimit({
  store: new Redis('redis://localhost'),
  time: 60, // 1 minutes
  limit: 10, // 10 requests
  prefix: 'limit:',
  message: 'too large request.'
}));
```

## Settings

### store (required)
Specify redis client. (Compatible to ioredis)

### time
Period to request count.
Default value is 60 second.

### limit
Allow max request count.
Default value is 10 count.

### prefix
Redis key prefix.
Default value is "limit:"

### message
If limit over, response this message. (status code is 429)
Default value is "Too many requests, please try again later."


## Usage
"DrosselRateLimit" is append request Header.

- "X-Rate-Limit-Limit": max request count
- "X-Rate-Limit-Remaining": current request count
- "X-Rate-Limit-Reset": reset time of the remaining count

if under limit, not update redis expire.
if over limit, reset expire from the beginning.

'use strict';

function DrosselRateLimit(options) {

  if (!options.store) {
    throw new Error('DrosselRateLimit: redis store is required.');
  }
  const preset = {
    time: 60, // 1 minute
    limit: 10, // 10 requests
    prefix: 'limit:',
    message: 'Too many requests, please try again later.'
  };
  const settings = {
    store: options.store,
    time: options.time ? options.time : preset.time,
    limit: options.limit ? options.limit : preset.limit,
    prefix: options.prefix ? options.prefix : preset.prefix,
    message: options.message ? options.message : preset.message
  };

  return (req, res, next) => {
    const key = settings.prefix + req.ip; // recording IP address.

    settings.store.pipeline().get(key).ttl(key).exec((err, results) => {
      // get error
      if (results[0][0]) {
        next(results[0][0]);
        return;
      }
      // ttl error
      if (results[1][0]) {
        next(results[1][0]);
        return;
      }
      const currentCount = results[0][1] ? results[0][1] : 0;
      const ttl = results[1][1] < 0 ? settings.time : results[1][1];
      const isOverLimit = settings.limit < currentCount;
      let resetTime;
      if (isOverLimit) {
        resetTime = new Date(Date.now() + (settings.time * 1000)).toISOString();
      } else {
        resetTime = new Date(Date.now() + (ttl * 1000)).toISOString();
      }

      // set header
      req.rateLimit = {
        limit: settings.limit,
        remaining: Math.max(settings.limit - currentCount, 0),
        reset: resetTime
      };
      res.setHeader('X-Rate-Limit-Limit', req.rateLimit.limit);
      res.setHeader('X-Rate-Limit-Remaining', req.rateLimit.remaining);
      res.setHeader('X-Rate-Limit-Reset', req.rateLimit.reset);

      // limit over or first access
      if (isOverLimit || !currentCount) {
        const pipe = settings.store.pipeline();
        pipe.incr(key);
        pipe.expire(key, settings.time);
        pipe.exec((err, results) => {
          // incr error
          if (results[0][0]) {
            next(results[0][0]);
            return;
          }
          // expire error
          if (results[1][0]) {
            next(results[1][0]);
            return;
          }
          if (isOverLimit) {
            res.status(429);
            res.end(settings.message);
            return;
          }
          next();
        });
        return;
      }

      // continue access
      settings.store.incr(key, (err, result) => {
        // incr error
        if (err) {
          next(err);
          return;
        }
        next();
      });
    });
  };
}

module.exports = DrosselRateLimit;

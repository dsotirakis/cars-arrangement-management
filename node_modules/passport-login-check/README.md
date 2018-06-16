# passport-login-check

This middleware ensures that a user is logged in.  If a request is received where
the user is unauthenticated, the request will be redirected to a login page.

## Install

    $ npm install passport-login-check

## Usage
*index.js*
```JavaScript
var l = require('passport-login-check')

//If req is unauthenticated, user will be redirected to this
l.defaultRedirectUrl = '/login'
//If req is unauthenticated, user will be returned to this after authentication
l.defaultReturnUrl = '/'

//Will redirect to defaultRedirectUrl if req is unauthenticated and return to defaultReturnUrl
app.use('/profile', l.loggedIn())
//Will return to /settings after authentication
app.use('/settings', l.loggedIn('/settings'))
//Will redirect to /auth/authentication if req is unauthenticated and return to /profile after authentication
app.use('/user/:id', l.loggedIn('/profile', '/auth/facebook'))
```

## TODO

  1. Return to original URL if returnUrl is not specified
  2. URL Blacklisting
  2. Roles

## Credits

  - [Vishnu R Menon](http://github.com/vishthemenon)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2016 Vishnu R Menon <[http://vishnurmenon.com/](http://vishnurmenon.com/)>

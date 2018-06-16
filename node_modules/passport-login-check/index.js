var exports = module.exports = {
  
  defaultRedirectUrl : '/login',

  defaultReturnUrl : '/',

  loggedIn : function (return_url, redirect_url) {
    return function(req, res, next) {
      if (typeof redirect_url == 'string') {
        var redirectUrl = redirect_url
      }
      else {
        var redirectUrl = exports.defaultRedirectUrl
      }

      if (typeof return_url == 'string') {
        var returnUrl = return_url
      }
      else {
        var returnUrl = exports.defaultReturnUrl
      }

      req.session.returnUrl = returnUrl

      if(!req.user) {
        res.redirect(redirectUrl)
      }
      else {
        next()
      }
    }
  }
}

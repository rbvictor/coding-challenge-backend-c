heroku buildpacks:set https://github.com/heroku/heroku-buildpack-nodejs.git
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-nginx.git
heroku config:set NGINX_WORKERS=8

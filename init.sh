#!/usr/bin/env bash

heroku stack:set cedar-14 -a coding-challenge-backend-rv
heroku buildpacks:set https://github.com/heroku/heroku-buildpack-nodejs.git
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-nginx.git
heroku config:set NGINX_WORKERS=8
heroku pg:psql < data/create_table.sql
var express = require('express');
var router = express.Router();

var knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL + '?ssl=true',
  searchPath: 'knex,public'
});

var get_query = require('../../helper/get_query');

/* GET suggestions */
router.get('/', function (req, res, next) {
  var q = req.query.q;
  var latitude = req.query.latitude || req.query.lat;
  var longitude = req.query.longitude || req.query.long;

  if (!q && !latitude && !longitude) {
    res.status(404);
    res.json({suggestions: []});
    return;
  }

  get_query(q, latitude, longitude, knex)
    .then(function(rows) {
      if (rows.length === 0) res.status(404);
      res.json({suggestions: rows});
    })
    .catch(function (err_db) {
      next(err_db);
    });
});

module.exports = router;
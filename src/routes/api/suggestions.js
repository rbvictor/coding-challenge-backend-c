/**
 * @file Entry route of API request
 */

var express = require('express');
var router = express.Router();

var knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL + '?ssl=true',
  searchPath: 'knex,public'
});

var get_query = require('../../helper/get_query');


/**
 *
 */
router.get('/', function (req, res, next) {
  /**
   * city name query
   * @type  {string}
   **/
  var q = req.query.q;

  /** @type  {float} */
  var latitude = req.query.latitude || req.query.lat;

  /** @type  {float} */
  var longitude = req.query.longitude || req.query.lon;

  /** @type  {float} */
  var threshold = req.query.threshold || req.query.thr;


  /* empty query */
  if (!q && !latitude && !longitude) {
    res.status(404);
    res.json({suggestions: []});
    return;
  }

  get_query(q, latitude, longitude, knex, threshold)
    .then(function(rows) {
      if (rows.length === 0) res.status(404);
      res.set('Access-Control-Allow-Origin', '*');
      res.json({suggestions: rows});
    })
    .catch(function (err_db) {
      next(err_db);
    });
});

module.exports = router;
/**
 * @file Helper containing function `get_query(q, latitude, longitude, knex)`
 */

module.exports = get_query;


/**
 * @description gets final SQL query based on the city name and coordinates
 *
 * @param {string} q - term used for searching city names
 * @param {float} latitude
 * @param {float} longitude
 * @param {object} knex - library used to build queries and return results if a connection is given
 * @return {object} query
 */
function get_query(q, latitude, longitude, knex) {

  /**
   *  if knex object is null, a 'connectionless' object is created just for query building
   */

  knex = knex || require('knex')({
    client: 'pg'
  });

  if (q) q = q.trim();

  var columns = ["name", "latitude", "longitude", get_overall_score(q, latitude, longitude, knex)];

  var query = knex
    .with('q', function(qb) {
      return qb.select(get_q_columns(q, latitude, longitude, knex));
    })
    .with('iq', function(qb) {
      return qb.select(columns).from(get_inner_query(q, latitude, longitude, knex).as("t"));
    })
    .select(["name", "latitude", "longitude", "score"])
    .from(knex.raw("iq, (select avg(score) av, stddev_pop(score) sd, max(score) mx from iq) stats"))
    .whereRaw("score >= least(av + 2 * sd, mx)");

  if (q)
    query = query.orderBy("score", "DESC");

  return query;
}


/**
 * @description gets overall score expression for final results
 *
 * @param q
 * @param latitude
 * @param longitude
 * @param knex
 * @returns {string}
 */

function get_overall_score(q, latitude, longitude, knex) {
  var score = "";
  if (q && (latitude || longitude))
    score = "sqrt(name_score * geo_score)";
  else if (q)
    score = "name_score";
  else // if (latitude || longitude)
    score = "geo_score";

  score = knex.raw("least(1.0, round(" + score + "::numeric, 5)) as score");
  return score;
}


/**
 * @description gets columns for the WITH statement returning :
 *                    - q_name (input term 'q' with diacritics removed)
 *                    - q_geom (input lat lon converted to PostGis geometry point or line)
 *
 * @param q
 * @param latitude
 * @param longitude
 * @param knex
 * @returns {Array}
 */

function get_q_columns(q, latitude, longitude, knex) {
  var q_columns = [];

  if (q) {
    var q_split = q.split(',').map(function (s) {
      return s.trim()
    });

    var q_city = q_split[0];
    var q_state = q_split[1] ? q_split[1] : q_city;
    var q_country = q_split[2] ? q_split[2] : q_state;

    q_columns.push(knex.raw("unaccent(?::text) as q_name", q_city));
    q_columns.push(knex.raw("unaccent(?::text) as q_state", q_state));
    q_columns.push(knex.raw("unaccent(?::text) as q_country", q_country));
    q_columns.push(knex.raw("'%'||regexp_replace(?, '\\\\s+', '%', 'g')||'%' as q_name_ilike", q_city));
    q_columns.push(knex.raw("metaphone(?::text, 16) as q_name_metaphone", q_city));
  }

  // -- q_geom: geometry according to lat and/or long
  if (latitude || longitude) {
    var q_geom = "";
    var q_geom_params = [];
    if (latitude && longitude) { // if both, q_geom is a point
      q_geom = "ST_MakePoint(?::numeric, ?::numeric)";
      q_geom_params = [latitude, longitude];
    }
    else if (latitude) { // if only latitude, q_geom is a horizontal line
      q_geom = "ST_MakeLine(ST_MakePoint(?::numeric, -180), ST_MakePoint(?::numeric, 180))";
      q_geom_params = [latitude, latitude];
    }
    else if (longitude) { // if only longitude, q_geom is a vertical line
      q_geom = "ST_MakeLine(ST_MakePoint(-90, ?::numeric), ST_MakePoint(90, ?::numeric))";
      q_geom_params = [longitude, longitude];
    }

    q_columns.push(knex.raw("ST_SetSRID(" + q_geom + ", 4326) AS q_geom", q_geom_params));
  }

  return q_columns;
}


/**
 * @description gets subquery that returns :
 *                    - city name (with state/province and country)
 *                    - latitude and longitude
 *                    - PostGis coordinate
 *                    - name similarity score ('name_score')
 *                    - geographic similarity score ('geo_score')
 *
 * @param q
 * @param latitude
 * @param longitude
 * @param knex
 * @return {object} inner_query
 */
function get_inner_query(q, latitude, longitude, knex) {
  var inner_columns = [
    knex.raw("(name || ', ' || state_code || ', ' || country) as name"), "latitude", "longitude"];

  if (q) {
    /**
     * name score is a linear combination of the previous scores
     * @type {string}
     */
    var name_score = get_name_scores().map(function(ns){ return ns.w + '*' + ns.expr; }).join(' + ');
    inner_columns.push(knex.raw("(" + name_score + ") AS name_score" ));
  }

  if (latitude || longitude) {

    /**
     * geo score is based on a formula that is 1 when distance is 0 and decreases as distance increases
     * @type {string}
     * */
    var geo_score = "10 / (10 + (coordinate <-> q_geom))";
    inner_columns.push(knex.raw("(" + geo_score + ") AS geo_score"));
  }

  var inner_query = knex.select(inner_columns).from(knex.raw("cities, q"));

  if (q)
    get_inner_query_conditions().forEach(function(inner_query_condition) {
      inner_query = inner_query.orWhereRaw(inner_query_condition);
    });

  if (latitude || longitude) {
    /**
     * geo score above 0.3 means :
     *    10 / (10 + (coordinate <-> q_geom)) >= 0.3 ===>>> (coordinate <-> q_geom) <= 10.0 / 0.3 - 10.0
     */

    inner_query = inner_query.whereRaw("(coordinate <-> q_geom) <= 10.0 / 0.3 - 10.0");
    if (!q) inner_query = inner_query.orderByRaw("coordinate <-> q_geom ASC");
  }

  return inner_query;
}


/**
 * @description this method returns an array of score expressions with their respective weights
 *
 * @returns {[*,*,*,*,*,*]} array of objects like { w: float, expr: string }
 */

function get_name_scores() {
  /**
   * score 1 or 0, if city name contains a substring matching the query exactly
   * @type {string}
   */
  //var substring_score = "(name_ascii ILIKE q_name_ilike)::int";

  /**
   * decimal score from trigram similarity between strings
   *    a <-> b : distance between 'a' and 'b'
   * @type {string}
   */
  var trgm_score = "(1 - (name_ascii <-> q_name))";

  /**
   * decimal score from trigram similarity between strings
   *    a <<-> b : distance between 'a' and some word within 'b'
   *    a <->> b : distance between 'b' and some word within 'a'
   * @type {string}
   */
  var word_trgm_score = "(1 - least(name_ascii <<-> q_name, name_ascii <->> q_name))";

  /**
   * decimal score from trigram similarity between phonetically converted strings
   * @type {string}
   */
  var mtph_trgm_score = "(1 - least(name_metaphone <<-> q_name_metaphone, name_metaphone <->> q_name_metaphone))";

  /**
   * decimal score from trigram similarity between states and some word in query
   * @type {string}
   */
  var state_score = "(1 - least(state_code <<-> q_state, state_en <<-> q_state, state_fr <<-> q_state))";

  /**
   * decimal score from trigram similarity between states and some word in query
   * @type {string}
   */
  var country_score = "(1 - (country <<-> q_country))";

  return [
    //{ w: 0.25, expr: substring_score },
    { w: 0.334, expr: trgm_score },
    { w: 0.333, expr: word_trgm_score },
    { w: 0.333, expr: mtph_trgm_score },
    { w: 0.500, expr: state_score },
    { w: 0.500, expr: country_score }];
}


/**
 * @description return inner query filter conditions based on name score expressions
 *
 * @returns {[string,string,string,string,string,string]}
 */

function get_inner_query_conditions() {
  /**
   * pg_trgm operators:
   *    a  % b: returns true if similarity between 'a' and 'b' is above 0.3 (default)
   *    a <% b: returns true if similarity between 'a' and some word within 'b' is above 0.6 (default)
   *    a %> b: returns true if similarity between 'b' and some word within 'a' is above 0.6 (default)
   */

  return [
    // "name_ascii ILIKE q_name_ilike",
    "name_ascii % q_name",
    "name_ascii <<-> q_name <= 0.7",
    "name_ascii <->> q_name <= 0.7",
    "name_metaphone <<-> q_name_metaphone <= 0.7",
    "name_metaphone <->> q_name_metaphone <= 0.7"
  ];
}
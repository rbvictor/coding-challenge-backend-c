/**
 * @file Helper containing function `get_query(q, latitude, longitude, knex)`
 */

module.exports = get_query;


/**
 * @description Gets final SQL query based on the city name and coordinates
 *
 * @param {string} q - City name requested (it may include state/province and/or country)
 * @param {float}  latitude - Latitude requested
 * @param {float}  longitude - Longitude requested
 * @param {object} knex - Knex object for building queries
 * @param {float} threshold - Threshold score for filtering results. If it is not null, it overrides standard threshold.
 * @return {object} query - SQL query to be executed in the database
 */
function get_query(q, latitude, longitude, knex, threshold) {

  /**
   *  if knex object is null, a 'connectionless' object is created just for query building
   */

  knex = knex || require('knex')({
    client: 'pg'
  });

  if (q) q = q.trim();

  var { min_score_threshold, inner_query } = get_inner_query(q, latitude, longitude, knex);

  var columns = ["name", "latitude", "longitude", get_overall_score(q, latitude, longitude, knex)];

  var query = knex
    .with('q', function(qb) {
      return qb.select(get_q_columns(q, latitude, longitude, knex));
    })
    .with('iq', function(qb) {
      return qb.select(columns).from(inner_query.as("t"));
    })
    .select(["name", "latitude", "longitude", knex.raw("(score / greatest(1, mx)) as score")])
    .from(knex.raw("iq, (select avg(score) av, stddev_pop(score) sd, max(score) mx from iq) stats"))
    .whereRaw("score >= " +
      (threshold || ("greatest(least(av + 2 * sd, mx, 1), " + min_score_threshold + " * greatest(1, mx))")));

  /**
   * Standard threshold is the lowest value from the following values: average plus two standard deviations;
   * maximum score returned; and 1.
   *
   * Minimal score threshold (min_score_threshold) is 1.0 divided by the sum of weights of non bonus name subscores
   * (see get_name_subscores function).
   *
   * If min_score_threshold is bigger than standard, min_score_threshold is selected.
   *
   * If a requested threshold is not null, then it overrides all other values.
   *
   */

  if (q)
    query = query.orderBy("score", "DESC");

  return query;
}


/**
 * @description Gets overall score expression for final results which can be: name score, geo score or the geometric
 * average of name score and geo score.
 *
 * @param {string} q - City name requested (it may include state/province and/or country)
 * @param {float}  latitude - Latitude requested
 * @param {float}  longitude - Longitude requested
 * @param {object} knex - Knex object for building queries
 * @returns {string} - Expression of the overall score
 */

function get_overall_score(q, latitude, longitude, knex) {
  var score = "";
  if (q && (latitude || longitude))
    score = "sqrt(name_score * geo_score)";
  else if (q)
    score = "name_score";
  else // if (latitude || longitude)
    score = "geo_score";

  score = knex.raw(score + "::real as score");
  return score;
}


/**
 * @description Gets columns for the WITH statement returning :
 * q_name (input term 'q' with diacritics (or accents) removed);
 * q_geom (input latitude/longitude converted to PostGis geometry point or line)
 *
 * @param {string} q - City name requested (it may include state/province and/or country)
 * @param {float}  latitude - Latitude requested
 * @param {float}  longitude - Longitude requested
 * @param {object} knex - Knex object for building queries
 * @returns {Array} - Array of columns returned by first with statement
 */

function get_q_columns(q, latitude, longitude, knex) {
  var q_columns = [];

  if (q) {
    var q_split = q.split(',').map(function (s) {
      return s.trim()
    });

    /**
     *
     * If a comma is used, we assume that what comes after it is a state/province or country
     *
     * If two comma are used, we assume that what comes after the first one is a state/province and what comes after
     * the second one is the country.
     *
     */

    var q_city = q_split[0];
    var q_state = q_split[1] ? q_split[1] : q_city;
    var q_country = q_split[2] ? q_split[2] : q_state;

    q_columns.push(knex.raw("unaccent(?::text) as q_name", q_city));
    q_columns.push(knex.raw("unaccent(?::text) as q_state", q_state));
    q_columns.push(knex.raw("unaccent(?::text) as q_country", q_country));
    q_columns.push(knex.raw("'%'||regexp_replace(?, '\\\\s+', '%', 'g')||'%' as q_name_ilike", q_city));
    q_columns.push(knex.raw("metaphone(?::text, 16) as q_name_metaphone", q_city));
  }

  /**
   * q_geom: geometry according to latitude and/or longitude
   *
   * If both are present, q_geom is a point.
   * If only latitude is present, q_geom is a latitudinal (horizontal) line
   * if only longitude is present, q_geom is a longitudinal (vertical) line
   *
   */

  if (latitude || longitude) {
    var q_geom = "";
    var q_geom_params = [];

    if (latitude && longitude) {
      q_geom = "ST_MakePoint(?::real, ?::real)";  // point
      q_geom_params = [latitude, longitude];
    }
    else if (latitude) {
      q_geom = "ST_MakeLine(ST_MakePoint(?::real, -180), ST_MakePoint(?::real, 180))";  // latitudinal line
      q_geom_params = [latitude, latitude];
    }
    else if (longitude) {
      q_geom = "ST_MakeLine(ST_MakePoint(-90, ?::real), ST_MakePoint(90, ?::real))";  // longitudinal line
      q_geom_params = [longitude, longitude];
    }

    q_columns.push(knex.raw("ST_SetSRID(" + q_geom + ", 4326) AS q_geom", q_geom_params));
  }

  return q_columns;
}


/**
 * @description gets subquery that returns :
 *                    - city name (with state/province and country);
 *                    - latitude and longitude;
 *                    - PostGis coordinate;
 *                    - name similarity score ('name_score');
 *                    - geographic similarity score ('geo_score')
 *
 * @param {string} q - City name requested (it may include state/province and/or country)
 * @param {float}  latitude - Latitude requested
 * @param {float}  longitude - Longitude requested
 * @param {object} knex - Knex object for building queries
 * @return {object} { score_threshold, inner_query }
 */
function get_inner_query(q, latitude, longitude, knex) {
  var inner_columns = [
    knex.raw("(name || ', ' || state_code || ', ' || country) as name"), "latitude", "longitude"];

  var min_score_threshold = 0.0;

  if (q) {

    var name_subscores = get_name_subscores();

    /**
     * name_score is a polynomial combination of the subscores
     * @type {string}
     */
    var name_score = name_subscores.map(function(s){ return 'pow(' + s.w + '*' + s.expr + ', 2)'; }).join(' + ');

    /**
     * name_score_denominator is a polynomial combination of the scores when they are maximized.
     * As the maximum of each score is 1, it comes back to get the number of subscores that are not bonus
     * @type {number}
     */

    var name_score_denominator = name_subscores
      .map(function(s) { return s.is_bonus ? 0 : s.w * s.w; })
      .reduce(function(w1, w2) { return w1 + w2; }, 0);

    min_score_threshold = 1.0 / name_score_denominator;

    inner_columns.push(knex.raw("(" + name_score + ") / " + name_score_denominator + " AS name_score" ));
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

  return { min_score_threshold, inner_query };
}


/**
 * @description this method returns an array of subscore expressions with their respective weights
 * when a subscore is not a bonus, it means they don't count in the denominator of the overall name score
 *
 * @returns {array} - Array of objects containing score expressions, if each one is a bonus and their weights
 */

function get_name_subscores() {
  /**
   * score 1 or 0, if city name contains a substring matching the query exactly
   * @type {string}
   */
  var substring_score = "(name_ascii ILIKE q_name_ilike)::int";

  /**
   * decimal score from trigram similarity between strings
   *    a <-> b : distance between 'a' and 'b'
   * @type {string}
   */
  var trgm_score = "(1 - (name_ascii <-> q_name))";

  /**
   * decimal score from trigram similarity between strings
   *    a <<-> b : distance between 'a' and some word within 'b';
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
   * decimal score from trigram similarity between the state / province and one of the words within the query
   * @type {string}
   */
  var state_score = "(1 - least(state_code <<-> q_state, state_en <<-> q_state, state_fr <<-> q_state))";

  /**
   * decimal score from trigram similarity between the country and one of the words within the query
   * @type {string}
   */
  var country_score = "(1 - (country <<-> q_country))";

  return [
      { w:1.0, is_bonus: false,  expr: substring_score },
      { w:2.0, is_bonus: false,  expr: trgm_score },
      { w:1.0, is_bonus: false,  expr: word_trgm_score },
      { w:1.0, is_bonus: false,  expr: mtph_trgm_score },
      { w:0.5, is_bonus: true,  expr: state_score },
      { w:0.5, is_bonus: true,  expr: country_score },
    ];
}


/**
 * @description return inner query filter conditions based on name score expressions
 *
 * @returns {array}
 */

function get_inner_query_conditions() {
  /**
   * pg_trgm operators:
   *    a  % b: returns true if similarity between 'a' and 'b' is above 0.3 (default);
   *    a <<-> b : distance between 'a' and some word within 'b';
   *    a <->> b : distance between 'b' and some word within 'a'
   */

  return [
    //"name_ascii ILIKE q_name_ilike",
    "name_ascii % q_name",
    "name_ascii <<-> q_name <= 0.7",
    "name_ascii <->> q_name <= 0.7",
    "name_metaphone <<-> q_name_metaphone <= 0.7",
    "name_metaphone <->> q_name_metaphone <= 0.7"
  ];
}
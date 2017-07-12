
function get_query(q, latitude, longitude, knex) {

  knex = knex || require('knex')({
    client: 'pg'
  });

  if (q) q = q.trim();


  // -------------------- with statement  --------------------
  var q_columns = [];

  // -- q_name: name converted to ascii chars
  if (q) {
    q_columns.push(knex.raw("unaccent(?::text) as q_name", q));
    q_columns.push(knex.raw("'%'||regexp_replace(?, '\\\\s+', '%', 'g')||'%' as q_name_ilike", q));
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


  // ----------------------- inner query --------------------------

  var inner_columns = [
    knex.raw("(name || ', ' || state || ', ' || country) as name"), "latitude", "longitude"];

  if (q) {
    var name_sub_scores = [
      "0.4 * (name_ascii ILIKE q_name_ilike)::int",    // substring score
      "0.3 * similarity(name_ascii, q_name)",                                 // trigram similarity score
      "0.3 * similarity(name_metaphone, metaphone(q_name, 16))"               // trigram phonetic similarity score
    ];

    inner_columns.push(knex.raw("(" + name_sub_scores.join(' + ') + ") AS name_score" ));
  }

  if (latitude || longitude) {
    inner_columns.push(knex.raw("(10 / (10 + (coordinate <-> q_geom))) AS geo_score"))
  }

  var inner_query = knex.select(inner_columns).from(knex.raw("cities, q"));

  if (q) {
    inner_query = inner_query
      .whereRaw("name_ascii ILIKE q_name_ilike")                          // filter if substring matches
      .orWhereRaw("name_ascii % q_name")                                  //    or similarity above 0.3
      .orWhereRaw("name_metaphone % metaphone(q_name, 16)")               //    or trigram_similarity above 0.3
  }

  if (latitude || longitude) {
    inner_query = inner_query
      .whereRaw("(coordinate <-> q_geom) <= 10.0 / 0.3 - 10.0")
      .orderByRaw("coordinate <-> q_geom ASC");
  }


  // ----------------------- overall score --------------------------

  var score = "";
  if (q && (latitude || longitude))
    score = "sqrt(name_score * geo_score)";
  else if (q)
    score = "name_score";
  else // if (latitude || longitude)
    score = "geo_score";

  score = knex.raw("round(sqrt(" + score + ")::numeric, 5) as score");


  // ----------------------- outer query --------------------------

  var columns = ["name", "latitude", "longitude", score];

  var query = knex
    .with('q', function(qb) {return qb.select(q_columns)})
    .select(columns)
    .from(inner_query.as("t"));

  if (q)
    query = query.where("name_score", ">=", 0.3).orderBy("score", "DESC");

  return query;
}

module.exports = get_query;
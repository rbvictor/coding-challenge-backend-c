-- begin transaction
BEGIN;

-- create raw table
DROP TABLE IF EXISTS cities_raw;

CREATE TABLE cities_raw (
    id INT PRIMARY KEY,
    name TEXT,
    ascii TEXT,
    alt_name TEXT,
    latitude REAL,
    longitude REAL,
    feat_class CHAR(1),
    feat_code CHAR(5),
    country CHAR(2),
    cc2 INT,
    admin1 CHAR(2),
    admin2 INT,
    admin3 INT,
    admin4 INT,
    population INT,
    elevation INT,
    dem	INT,
    tz text,
    modified_at date
);

DROP TABLE IF EXISTS states_provinces;

CREATE TABLE states_provinces (
    admin1 CHAR(2) PRIMARY KEY,
    state_code CHAR(2),
    state_en TEXT,
    state_fr TEXT
);

-- import cities into database
\COPY cities_raw FROM './data/cities_canada-usa.tsv' DELIMITER E'\t' CSV HEADER QUOTE E'\b';

-- import states and provinces into database
\COPY states_provinces FROM './data/states_provinces.csv' DELIMITER E';' CSV HEADER QUOTE E'\b';

-- import postgres extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- trigram for comparing strings
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch; -- soundex, metaphone, levenshtein
CREATE EXTENSION IF NOT EXISTS postgis; -- geometry with spacial reference systems
CREATE EXTENSION IF NOT EXISTS unaccent; -- geometry with spacial reference systems

DELETE FROM spatial_ref_sys WHERE auth_srid != 4326;

-- transform data and insert it into new table
DROP TABLE IF EXISTS cities;

CREATE TABLE cities (
    id INT PRIMARY KEY,
    name TEXT,
    name_ascii TEXT,
    name_metaphone TEXT,
    admin1 CHAR(2),
    state_code TEXT,
    state_en TEXT,
    state_fr TEXT,
    country TEXT,
    latitude REAL,
    longitude REAL,
    coordinate GEOMETRY(POINT, 4326)
);

INSERT INTO cities
SELECT
    id,
    name,
    ascii,
    metaphone(name, 16),
    c.admin1,
    s.state_code,
    s.state_en,
    s.state_fr,
    case country
        WHEN 'CA' THEN 'Canada'
        WHEN 'US' THEN 'USA'
        ELSE country
    END country,
    latitude,
    longitude,
    ST_SetSRID(ST_MakePoint(latitude, longitude), 4326)
FROM cities_raw c
INNER JOIN states_provinces s
ON c.admin1 = s.admin1;

DROP TABLE cities_raw;

-- create indexes for nearest-neighbor search
CREATE INDEX cities_name_ascii_coordinate_idx ON cities USING GIST(name_ascii gist_trgm_ops, coordinate);
CREATE INDEX cities_name_metaphone_coordinate_idx ON cities USING GIST(name_metaphone gist_trgm_ops, coordinate);
CREATE INDEX cities_coordinate_idx ON cities USING GIST(coordinate);

-- End transaction
COMMIT;

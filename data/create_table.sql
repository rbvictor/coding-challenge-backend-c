-- begin transaction
BEGIN;

-- create raw table
DROP TABLE IF EXISTS cities_raw;

CREATE TABLE cities_raw (
    id INT PRIMARY KEY,
    name TEXT,
    ascii TEXT,
    alt_name TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
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

-- import cities into database
\COPY cities_raw FROM './data/cities_canada-usa.tsv' DELIMITER E'\t' CSV HEADER QUOTE E'\b';


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
    state CHAR(2),
    country TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    coordinate GEOMETRY(POINT, 4326)
);

INSERT INTO cities
SELECT
    id,
    name,
    ascii,
    metaphone(name, 16),
    CASE admin1
        WHEN '01' THEN 'AB'
        WHEN '02' THEN 'BC'
        WHEN '03' THEN 'MB'
        WHEN '04' THEN 'NB'
        WHEN '05' THEN 'NL'
        WHEN '07' THEN 'NS'
        WHEN '08' THEN 'ON'
        WHEN '09' THEN 'PE'
        WHEN '10' THEN 'QC'
        WHEN '11' THEN 'SK'
        WHEN '12' THEN 'YT'
        WHEN '13' THEN 'NT'
        WHEN '14' THEN 'NU'
        ELSE admin1
    END state,
    case country
        WHEN 'CA' THEN 'Canada'
        WHEN 'US' THEN 'USA'
        ELSE country
    END country,
    latitude,
    longitude,
    ST_SetSRID(ST_MakePoint(latitude, longitude), 4326)
FROM cities_raw;

DROP TABLE cities_raw;

-- create indexes for nearest-neighbor search
CREATE INDEX cities_name_ascii_coordinate_idx ON cities USING GIST(name_ascii gist_trgm_ops, coordinate);
CREATE INDEX cities_name_metaphone_coordinate_idx ON cities USING GIST(name_metaphone gist_trgm_ops, coordinate);
CREATE INDEX cities_coordinate_idx ON cities USING GIST(coordinate);

-- End transaction
COMMIT;

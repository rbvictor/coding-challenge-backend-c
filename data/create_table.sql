drop table if exists cities_canada_usa_raw;

create table cities_canada_usa_raw (
    id int primary key,
    name text,l
    a text,
    alt_name text,
    latitude double precision,
    longitude double precision,
    feat_class char(1),
    feat_code char(5),
    country char(2),
    cc2 int,
    admin1 text,
    admin2 int,
    admin3 int,
    admin4 int,
    population int,
    elevation int,
    dem	int,
    tz text,
    modified_at date
);

\COPY cities_canada_usa_raw FROM './data/cities_canada-usa.tsv' DELIMITER E'\t' CSV HEADER QUOTE E'\b';
# Coding Challenge Back-end - RV


## Introduction

This application was implemented using PostgreSQL for its database, using 
Node.js with Express framework for the back-end and React library for the
front-end. It has been deployed on Heroku on the following address: 
https://coding-challenge-backend-rv.herokuapp.com/

Additional docs: https://coding-challenge-backend-rv.herokuapp.com/docs/

This project can be structured as follows :

* Infrastructure preparation

* Data pre-processing

* Back-end implementation

* Front-end implementation


## Infrastructure preparation

The app has been deployed in Heroku using the basic account. Additional 
buildpacks were installed for enabling NGINX as a reverse proxy of the
application, in order to improve static file serving and connexion
concurrence handling. Instructions for NGINX configuration were taken from 
https://www.nodebeats.com/documentation/configuring-nginx-on-heroku . 
See custom NGINX configuration file 
[config/nginx.conf.erb](config/nginx.conf.erb) .
 

## Data pre-processing

Knowledge data containing info about cities in Canada and the USA was
imported into PostgreSQL database, by running the script 
[data/create_table.sql](data/create_table.sql) . 

An additional table was created in order to provide full names of Canadian 
provinces and US states.

The final table was resulted from the original and additional data, with 
new columns being created for names converted into their phonetic 
representations (metaphone) and also for coordinates converted into 
PostGIS geometry data type. 

### PostgreSQL extensions

The SQL script also installs the following extensions in the database :

* [pg_trgm](https://www.postgresql.org/docs/current/static/pgtrgm.html)

    Library for string comparison using trigram matching and provides
    index operations using [GiST (Generalized Search Tree) and GIN 
    (Generalized Inverted Index)](https://www.postgresql.org/docs/current/static/textsearch-indexes.html), 
    which allows searching strings fast.
    
* [fuzzystrmatch](https://www.postgresql.org/docs/current/static/fuzzystrmatch.html)

    Library that provides, among others, the function metaphone that
    converts a word into its phonetic representation.

* [postgis](http://postgis.net/)

    Library that provides specific operations for dealing with geometrical 
    / geographical information and searching it using GiST indexes. 

* [unaccent](https://www.postgresql.org/docs/current/static/unaccent.html)

    Library that provides a function to remove diacritics from a text. (Ex.
    : unaccent('Québec') -->> 'Quebec' )
    
    
### Creating indexes
 
Library pg_trgm supports both GiST and GIN indexing.
Library PostGIS supports only GiST.
 
 
#### GiST (Generalized Search Tree)
 
GiST-based indexes are very appropriate when dealing with 
[k-nearest neighbors (KNN)](https://wiki.postgresql.org/images/4/46/Knn.pdf)
searching, that is, when one wants the closest points from a given query.
They are considered to be an improvement of classical B-tree and R-tree 
based indexes. It is the case for trigram and geometrical comparisons 
which are measured in distance. 

In this app, this type of index was created for city coordinates and 
for name columns combined with the coordinate column. 

#### GIN  (Generalized Inverted Index)

GIN-based indexes are recommended for text search, as it stores an
index entry for every word with a list of matching locations. 

In this app, this type of index was created for city name columns 
separately.


## Back-end implementation

This app back-end was implemented using Node.js with Express. The tool
``express-generator`` was used in order to build the initial scaffold
of the application, along with the necessary boilerplate code. 

The entry point is located in /api/suggestions and allows for the 
following search
cases:
 
**Name-only**
 
    /api/suggestions?q=Quebec
    
**Name with coordinate**

    /api/suggestions?q=Quebec&latitude=46.8123&longitude=-71.2145  
    
**Coordinate-only**

    /api/suggestions?latitude=46.8123&longitude=-71.2145
       
**Latitude or longitude-only**

    /api/suggestions?latitude=46.8123
    
In this case, the API returns cities closed to the corresponding 
latitudinal or longitudinal line. 

Usage of indexed metaphone-converted names allows querying for misspelled
city names like this:
 
    /api/suggestions?q=Kebek
    
To override default threshold score, it is possible to use the following
parameter :

    /api/suggestions?q=Kebek&thr=0
    

### Queries to the database

Queries to the database were implemented using the [Knex](http://knexjs.org/) 
library, which makes it easier to build SQL queries and submits them 
to the database using a pool of connections. 

Specific scoring criteria according to textual (both literal and phonetic) 
and geometrical distances were inserted during query construction. 

See more details on the
[docs section](https://coding-challenge-backend-rv.herokuapp.com/docs/) 
of the app or on the code comments.


### Unit tests

Libraries `chai` and `mocha` were used for unit testing. Initial test
cases were based on the original GitHub fork of the challenge :
https://github.com/busbud/coding-challenge-backend-c/blob/master/test/suggestions.js
. Additional test cases were implemented in order to test new
functionalities and new scenarios. For running those test cases, 
run the command from the app root folder:

    npm test


## Front-end implementation

This app front-end was implemented using React library. The tool
``create-react-app`` was used in order to build the initial scaffold
of the front-end. Furthermore, the library Redux was used to manage
the front-end state and the application flux. 

Plotly was used as an additional library wrapped in a React component
for plotting on a map the points that were returned by the api.  

View comments on source code for additional details of the components, 
actions and reducers created for the front-end part of the app.
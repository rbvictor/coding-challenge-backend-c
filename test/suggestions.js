/**
 * @file Unit tests for Suggestions API.
 * Run 'npm test' to execute these tests.
 */

require('dotenv').config();
process.env.NODE_ENV = 'test';

var chai = require('chai');
var chaiHttp = require('chai-http');
var server  = require('../bin/www');
var unaccent = require('../src/helper/utils').unaccent;

chai.use(chaiHttp);

var expect = chai.expect;
var request = chai.request(server);


/**
 * @description Test cases for /api/suggestions
 */

describe('GET /api/suggestions', function() {

  /**
   * @description test case with a city that is not real
   */

  describe('with a city that is not real', function () {
    var response;

    before(function (done) {
      request.get('/api/suggestions?q=SomeRandomCityInTheMiddleOfNowhere')
        .end(function (err, res) {
          response = res;
          response.json = JSON.parse(res.text);
          if (err.status !== 404)
            done(err);
          else
            done();
        });
    });

    it('returns a 404', function () {
      expect(response.statusCode).to.equal(404);
    });

    it('returns an empty array of suggestions', function () {
      expect(response.json.suggestions).to.be.instanceof(Array);
      expect(response.json.suggestions).to.have.length(0);
    });
  });


  /**
   * @description test case with a city without accent
   */

  describe('with Montreal without accent', function () {
    var response;

    before(function (done) {
      request.get('/api/suggestions?q=Montreal')
        .end(function (err, res) {
          response = res;
          response.json = JSON.parse(res.text);
          done(err);
        });
    });

    it('returns a 200', function () {
      expect(response.statusCode).to.equal(200);
    });

    it('returns an array of suggestions', function () {
      expect(response.json.suggestions).to.be.instanceof(Array);
      expect(response.json.suggestions).to.have.length.above(0);
    });

    it('contains a match', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        var pattern = /montreal/i;
        return suggestions.some(function (suggestion) {
          return pattern.test(unaccent(suggestion.name));
        });
      })
    });

    it('contains another possible match', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        var pattern = /montreal-ouest/i;
        return suggestions.some(function (suggestion) {
          return pattern.test(unaccent(suggestion.name));
        });
      })
    });

    it('contains latitudes and longitudes', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        return suggestions.every(function (suggestion) {
          return suggestion.latitude && suggestion.longitude;
        });
      })
    });

    it('contains scores', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        return suggestions.every(function (suggestion) {
          return suggestion.score;
        });
      })
    });
  });


  /**
   * @description test case with a city with accent
   */

  describe('with Montréal with accent', function () {
    var response;

    before(function (done) {
      request.get('/api/suggestions?q=Montréal')
        .end(function (err, res) {
          response = res;
          response.json = JSON.parse(res.text);
          done(err);
        });
    });

    it('returns a 200', function () {
      expect(response.statusCode).to.equal(200);
    });

    it('contains a match', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        var pattern = /montreal/i;
        return suggestions.some(function (suggestion) {
          return pattern.test(unaccent(suggestion.name));
        });
      })
    });

    it('contains another possible match', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        var pattern = /montreal-ouest/i;
        return suggestions.some(function (suggestion) {
          return pattern.test(unaccent(suggestion.name));
        });
      })
    });
  });


  /**
   * @description test case with wrongly typed city name
   */

  describe('with Montréal with accent', function () {
    var response;

    before(function (done) {
      request.get('/api/suggestions?q=vanouver')
        .end(function (err, res) {
          response = res;
          response.json = JSON.parse(res.text);
          done(err);
        });
    });

    it('returns a 200', function () {
      expect(response.statusCode).to.equal(200);
    });

    it('contains a match', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        var pattern = /vancouver/i;
        return suggestions.some(function (suggestion) {
          return pattern.test(unaccent(suggestion.name));
        });
      })
    });
  });


  /**
   * @description test case with a city and its country
   */

  describe('with a city and its country', function () {
    var response;

    before(function (done) {
      request.get('/api/suggestions?q=Ottawa,%20Canada')
        .end(function (err, res) {
          response = res;
          response.json = JSON.parse(res.text);
          done(err);
        });
    });

    it('returns a 200', function () {
      expect(response.statusCode).to.equal(200);
    });

    it('contains the right first position match', function () {
      var pattern = /Ottawa, ON, Canada/i;
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        return pattern.test(unaccent(suggestions[0].name));
      })
    });
  });


  /**
   * @description test case with a city and its state
   */

  describe('with a city and its state', function () {
    var response;

    before(function (done) {
      request.get('/api/suggestions?q=Ottawa,%20Illinois')
        .end(function (err, res) {
          response = res;
          response.json = JSON.parse(res.text);
          done(err);
        });
    });

    it('returns a 200', function () {
      expect(response.statusCode).to.equal(200);
    });

    it('contains the right first position match', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        var pattern = /Ottawa, IL, USA/i;
        return pattern.test(unaccent(suggestions[0].name));
      })
    });
  });


  /**
   * @description test case with a city and its coordinates
   */

  describe('with a city and its coordinates', function () {
    var response;

    before(function (done) {
      request.get('/api/suggestions?q=Ottawa&latitude=38.6156&longitude=-95.2678')
        .end(function (err, res) {
          response = res;
          response.json = JSON.parse(res.text);
          done(err);
        });
    });

    it('returns a 200', function () {
      expect(response.statusCode).to.equal(200);
    });

    it('contains the right first position match', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        var pattern = /Ottawa, KS, USA/i;
        return pattern.test(unaccent(suggestions[0].name));
      })
    });
  });


  /**
   * @description test case with only coordinates
   */

  describe('with only coordinates', function () {
    var response;

    before(function (done) {
      request.get('/api/suggestions?latitude=39.4735&longitude=-118.777')
        .end(function (err, res) {
          response = res;
          response.json = JSON.parse(res.text);
          done(err);
        });
    });

    it('returns a 200', function () {
      expect(response.statusCode).to.equal(200);
    });

    it('contains the right first position match', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        var pattern = /Fallon, NV, USA/i;
        return pattern.test(unaccent(suggestions[0].name));
      })
    });
  });

  /**
  * @description test case with a phonetically similar city name
  */

  describe('with a city and its coordinates', function () {
    var response;

    before(function (done) {
      request.get('/api/suggestions?q=kebek')
        .end(function (err, res) {
          response = res;
          response.json = JSON.parse(res.text);
          done(err);
        });
    });

    it('returns a 200', function () {
      expect(response.statusCode).to.equal(200);
    });

    it('contains the right first position match', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        var pattern = /Quebec, QC, Canada/i;
        return suggestions.some(function (suggestion) {
          return pattern.test(unaccent(suggestion.name));
        });
      })
    });
  });

  /**
   * @description test case with another phonetically similar city name
   */

  describe('with a city and its coordinates', function () {
    var response;

    before(function (done) {
      request.get('/api/suggestions?q=bekomo')
        .end(function (err, res) {
          response = res;
          response.json = JSON.parse(res.text);
          done(err);
        });
    });

    it('returns a 200', function () {
      expect(response.statusCode).to.equal(200);
    });

    it('contains the right first position match', function () {
      expect(response.json.suggestions).to.satisfy(function (suggestions) {
        var pattern = /Baie-Comeau, QC, Canada/i;
        return pattern.test(unaccent(suggestions[0].name));
      })
    });
  });

});
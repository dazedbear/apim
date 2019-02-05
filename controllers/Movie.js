'use strict';

var utils = require('../utils/writer.js');
var Movie = require('../service/MovieService');

module.exports.getMovieEventList = function getMovieEventList (req, res, next) {
  var sortType = req.swagger.params['sortType'].value;
  var limit = req.swagger.params['limit'].value;
  var offset = req.swagger.params['offset'].value;
  Movie.getMovieEventList(sortType,limit,offset)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

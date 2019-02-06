/**
 * AWS Lambda to request travis build manually
 */
const fetch = require('node-fetch');
const dayjs = require('dayjs');
const redis = require('redis');
const { promisify } = require('util');
const { resTemplate, errorTemplate, pagingModel } = require('./util');

const openDataAPI = 'https://cloud.culture.tw/frontsite/trans/SearchShowAction.do?method=doFindTypeJ&category=8';

// TODO: 設計 Error Reponse 機制 (400, 500)

/**
 * 排序並取得指定長度與位置的電影列表
 * @param {array} movies 
 * @param {string} sortType 
 * @param {number} offset 
 * @param {number} limit 
 */
const sortMovies = (movies = [], sortType, offset = 0, limit = 10) =>
  new Promise((resolve, reject) => {
    const validSortType = ['latest', 'hot', 'free'];
    if (!validSortType.includes(sortType))
      return reject('Invalid sortType', sortType);
    if (!Number.isInteger(offset))
      return reject('Invalid offset', offset);
    if (!Number.isInteger(limit))
      return reject('Invalid limit', limit);
    if (Array.isArray(movies))
      return reject('Invalid movies', movies);

    switch (sortType) {
      case 'latest': {
        const result = movies
          .sort((prev, next) => dayjs(prev.startDate).millisecond() > dayjs(next.startDate).millisecond())
          .slice(offset, offset + limit);
        return resolve(result)
      }

      case 'hot': {
        const result = movies
          .sort((prev, next) => prev.hitRate > next.hitRate)
          .slice(offset, offset + limit);
        return resolve(result)
      }

      case 'free': {
        const result = movies
          .filter(event => event.onSales === 'N')
          .sort((prev, next) => dayjs(prev.startDate).millisecond() > dayjs(next.startDate).millisecond())
          .slice(offset, offset + limit);
        return resolve(result);
      }

      default: {
        resolve([]);
      }
    }
  })



exports.handler = (event, context, callback) => {
  const { REDIS_USER, REDIS_PASSWORD, REDIS_SERVER_HOST, REDIS_SERVER_PORT } = process.env;

  try {
    const redisClient = redis.createClient(`rediss://${REDIS_USER}:${REDIS_PASSWORD}@${REDIS_SERVER_HOST}:${REDIS_SERVER_PORT}`);

    // 檢查快取是否有資料
    promisify(redisClient.get)('movieRawData')
      .then(movieCacheData => {
        if (!movieCacheData) {
          const option = {
            method: "get",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            }
          }
          // 取得電影原始資料
          return fetch(openDataAPI, option)
            .then(res => res.json())
            // 存進 redis，設定一天後過期
            .then(rawData => Promise.all([
              rawData,
              promisify(redisClient.set)('movieRawData', rawData)
            ]))
            .then(([rawData, reply]) => Promise.all([
              rawData,
              promisify(redisClient.expire)('movieRawData', 86400)
            ]))
            .then(([rawData, reply]) => rawData)
            .catch(e => e);
        }
        return Promise.resolve(movieCacheData)
      })
      .then(rawData => {
        const movies = JSON.parse(rawData);
        // 帶入 API Gateway 的參數得到電影列表
        const { limit, offset } = event.queryStringParameters
        const { sortType } = event.pathParameters
        return Promise.all([
          movies,
          sortMovies(movies, sortType, offset, limit)
        ])
      })
      .then(([rawList, movieList]) => {
        const { limit, offset } = event.queryStringParameters
        const response = {
          statusCode: 200,
          body: JSON.stringify(resTemplate(pagingModel(rawList, movieList, offset + limit)))
        };
        callback(null, response)
      })
      .catch(e => { throw Error(e) })

  } catch (e) {
    console.error(e)
    const response = {
      statusCode: 500,
      body: JSON.stringify(errorTemplate(e.message, e))
    }
    return callback(response)
  }
}

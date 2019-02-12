/**
 * AWS Lambda to request travis build manually
 */
const fetch = require('node-fetch');
const dayjs = require('dayjs');
const redis = require('redis');
const { promisify } = require('util');
const { resTemplate, warnTemplate, errorTemplate, validationError, pagingModel, lambdaProxyResponse } = require('/opt/nodejs/util');

const openDataAPI = 'https://cloud.culture.tw/frontsite/trans/SearchShowAction.do?method=doFindTypeJ&category=8';

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
      return reject(validationError(`Invalid sortType: ${sortType}`, 211));
    if (isNaN(parseInt(offset)))
      return reject(validationError(`Invalid offset: ${offset}`, 212));
    if (isNaN(parseInt(limit)))
      return reject(validationError(`Invalid limit: ${limit}`, 213));
    if (!Array.isArray(movies))
      return reject(validationError(`Invalid movies: ${movies}`, 214));

    switch (sortType) {
      case 'latest': {
        const result = movies
          .sort((prev, next) => dayjs(prev.startDate).millisecond() > dayjs(next.startDate).millisecond())
          .slice(offset, parseInt(offset) + parseInt(limit));
        return resolve(result)
      }

      case 'hot': {
        const result = movies
          .sort((prev, next) => prev.hitRate > next.hitRate)
          .slice(offset, parseInt(offset) + parseInt(limit));
        return resolve(result)
      }

      case 'free': {
        const result = movies
          .filter(event => event.onSales === 'N')
          .sort((prev, next) => dayjs(prev.startDate).millisecond() > dayjs(next.startDate).millisecond())
          .slice(offset, parseInt(offset) + parseInt(limit));
        return resolve(result);
      }

      default: {
        resolve([]);
      }
    }
  })

/**
 * 啟用 lambda 代理整合的輸入 (event)
 * https://docs.aws.amazon.com/zh_tw/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 */
exports.handler = async (event, context) => {
  const { REDIS_USER, REDIS_PASSWORD, REDIS_SERVER_HOST, REDIS_SERVER_PORT } = process.env;

  const redisClient = redis.createClient(`redis://${REDIS_USER}:${REDIS_PASSWORD}@${REDIS_SERVER_HOST}:${REDIS_SERVER_PORT}`);
  const getAsync = promisify(redisClient.get).bind(redisClient)
  const setAsync = promisify(redisClient.set).bind(redisClient)
  const expireAsync = promisify(redisClient.expire).bind(redisClient)

  // 檢查快取是否有資料
  const result = await getAsync('movieRawData')
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
          .then(res => res.ok ? res.json() : Promise.reject(res))
          // 存進 redis，設定一天後過期
          .then(rawData => {
            console.log('Recieve data from government open data success!');
            return Promise.all([
              rawData,
              setAsync('movieRawData', JSON.stringify(rawData))
            ])
           })
          .then(([rawData, reply]) => Promise.all([
            rawData,
            expireAsync('movieRawData', 86400)
          ]))
          .then(([rawData, reply]) => {
            console.log('Refresh movie cache data success!');
            return rawData;
          })
          .catch(e => {
            redisClient.end(true)
            return Promise.reject(e);
          });
      }
      return JSON.parse(movieCacheData);
    })
    .then(movies => {
      // 帶入 API Gateway 的參數得到電影列表
      const { limit, offset } = (event.queryStringParameters || {})
      const { sortType } = (event.pathParameters || {})
      return Promise.all([
        movies,
        sortMovies(movies, sortType, offset, limit)
      ])
    })
    .then(([rawList, movieList]) => {
      const { limit, offset } = (event.queryStringParameters || {})
      const nextOffset = parseInt(offset || 0) + parseInt(limit || 10);
      if (isNaN(nextOffset))
        return Promise.reject(validationError(`Invalid limit or offset: ${limit}, ${offset}`, 215))
      return lambdaProxyResponse({
        statusCode: 200,
        body: resTemplate(pagingModel(rawList, movieList, nextOffset))
      });
    })
    .catch(e => {
      console.error(e.message)
      return lambdaProxyResponse({
        statusCode: e.isUserError ? 400 : 500,
        body: e.isUserError ? warnTemplate(e.message, e.code) : errorTemplate(e.message, e)
      })
    })
  await redisClient.quit((err, reply) => {
    if (err) {
      console.error(err);
      return redisClient.end(true);
    }
    console.log('Close connection with redis server success!');
  });
  return result;
}

/**
 * AWS Lambda to request travis build manually
 */
const dayjs = require('dayjs');
const { resTemplate, warnTemplate, errorTemplate, validationError, pagingModel, lambdaProxyResponse } = require('/opt/nodejs/util');
const { rawMovieList } = require('/opt/mock');

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
        return resolve(result)
      }

      case 'hot': {
        const result = movies
          .sort((prev, next) => prev.hitRate > next.hitRate)
        return resolve(result)
      }

      case 'free': {
        const result = movies
          .filter(event => event.showInfo.every(show => show.onSales === 'N'))
          .sort((prev, next) => dayjs(prev.startDate).millisecond() > dayjs(next.startDate).millisecond())
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

  // 檢查快取是否有資料
  const result = await Promise.resolve(rawMovieList)
    .then(movies => {
      // 帶入 API Gateway 的參數得到電影列表
      const { limit, offset } = (event.queryStringParameters || {})
      const { sortType } = (event.pathParameters || {})
      return Promise.resolve(sortMovies(movies, sortType, offset, limit))
    })
    .then(sortedMovieList => {
      const { limit, offset } = (event.queryStringParameters || {})
      const startIdx = parseInt(offset || 0);
      const endIdx = parseInt(offset || 0) + parseInt(limit || 10) - 1;
      if (isNaN(startIdx) || isNaN(endIdx))
        return Promise.reject(validationError(`Invalid limit or offset: ${limit}, ${offset}`, 215))

      const filterMovieList = sortedMovieList.slice(startIdx, endIdx);
      return lambdaProxyResponse({
        statusCode: 200,
        body: resTemplate(
          pagingModel(filterMovieList, sortedMovieList.length, endIdx + 1)
        )
      });
    })
    .catch(e => {
      console.error(e.message)
      return lambdaProxyResponse({
        statusCode: e.isUserError ? 400 : 500,
        body: e.isUserError ? warnTemplate(e.message, e.code) : errorTemplate(e.message, e)
      })
    })
  
  return result;
}

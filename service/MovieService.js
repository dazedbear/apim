'use strict';


/**
 * 取得電影節目列表
 * 取得電影節目列表
 *
 * sortType String 排序方式：最新活動 latest、熱門活動 hot、免費活動 free
 * limit Integer  (optional)
 * offset Integer  (optional)
 * returns inline_response_200
 **/
exports.getMovieEventList = function(sortType,limit,offset) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


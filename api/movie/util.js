const resTemplate = response => ({
	response,
});

const warnTemplate = (desc = 'warning message', code = 0) => ({
	warning: {
		code,
		desc,
	},
});

const errorTemplate = (message = 'error message', exception) => ({
	error: {
		exception,
		message,
	},
});

const pagingModel = (rawList = [], dataList = [], offset = 0) => ({
  dataList,
  offset,
  hasNext: (rawList.length - 1) > offset,
  total: rawList.length,
})

const validationError = (message = '', code = 0) => {
	let e = new Error(message);
	e.isUserError = true;
	e.code = code;
	return e;
}

/**
 * 啟用 lambda 代理整合的輸出 (return)
 * https://docs.aws.amazon.com/zh_tw/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-output-format
 * 
 * NOTE: response 本身不用 JSON.stringify, 但 body 內容一定要是 JSON 字串
 */ 
const lambdaProxyResponse = (custom = {}) => {
	const defaultResponse = {
		isBase64Encoded: false,
		statusCode: 200,
		headers: {
			"Content-Type": 'application/json',
			"Access-Control-Allow-Origin" : "*",
			"Access-Control-Allow-Credentials" : true,
			"Access-Control-Allow-Methods": "GET, OPTIONS",
			"Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
		},
		multiValueHeaders: {},
		body: null
	}
	let response = Object.assign({}, defaultResponse, custom);
	response.body = JSON.stringify(response.body);
	return response;
}

module.exports = {
  resTemplate,
  warnTemplate,
  errorTemplate,
	pagingModel,
	validationError,
	lambdaProxyResponse,
}
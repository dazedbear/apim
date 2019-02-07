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

module.exports = {
  resTemplate,
  warnTemplate,
  errorTemplate,
	pagingModel,
	validationError,
}
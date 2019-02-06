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

module.exports = {
  resTemplate,
  warnTemplate,
  errorTemplate,
  pagingModel,
}
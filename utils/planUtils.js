const { convertToSaveDate } = require('./dateUtils');
const { convertToDefaultDeadLine } = require('./dateUtils');

const isClosedPlanByDeadLine = (saveDeadLine) => {
  const nowDate = new Date();
  const deadLine = new Date(saveDeadLine);
  return deadLine < nowDate;
};
const isClosedPlanByDefaultDeadLine = (saveDate) => {
  const nowDate = new Date();
  const defaultDeadLine = convertToDefaultDeadLine(saveDate);
  const formatDate = convertToSaveDate(nowDate);
  return defaultDeadLine < formatDate;
};

module.exports = { isClosedPlanByDeadLine, isClosedPlanByDefaultDeadLine };

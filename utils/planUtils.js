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
  console.log('saveData: ', saveDate);
  console.log('defaultDeadLine: ', defaultDeadLine);
  console.log('formatDate: ', formatDate);
  console.log('defaultDeadLine < formatDate: ', defaultDeadLine < formatDate);
  return defaultDeadLine < formatDate;
};

module.exports = { isClosedPlanByDeadLine, isClosedPlanByDefaultDeadLine };

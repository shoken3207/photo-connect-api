const convertToSaveDate = (date) => {
  const formatDate = date.toISOString();
  return formatDate;
};

const convertToDefaultDeadLine = (saveDate) => {
  const date = new Date(saveDate);
  const deadLine = new Date(
    `${date.getFullYear()}/${date.getMonth() + 1}/${
      date.getDate() - 1
    } 23:59:59`
  );
  const formatDeadLine = convertToSaveDate(deadLine);
  return formatDeadLine;
};

module.exports = { convertToSaveDate, convertToDefaultDeadLine };

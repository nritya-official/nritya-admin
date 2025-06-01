const dayMapping = {
  M: "Mon",
  T: "Tues",
  W: "Wed",
  Th: "Thurs",
  F: "Fri",
  St: "Sat",
  Sn: "Sun",
};

export const updateDaysFormat = (records) => {
  const updatedDays = records.map((day) => dayMapping[day] || day);

  return [...new Set(updatedDays)];
};

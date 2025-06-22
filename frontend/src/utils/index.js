import moment from "moment";

export const getDayName = (date) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
};

export const getMonthName = (date) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[date.getMonth()];
};

export const getMonthYear = (date) => {
  if (date.day) {
    const month = date.month;
    const year = date.year;
    return `${month} ${year}`;
  } else {
    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();
    return `${month} ${year}`;
  }
};

export const getDateRange = (date) => {
  const currentDate = new Date(date);
  const dates = [];

  for (let i = 3; i > 0; i--) {
    const prevDate = new Date(currentDate);
    prevDate.setDate(currentDate.getDate() - i);
    dates.push(prevDate);
  }

  for (let i = 0; i < 2; i++) {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + i);
    dates.push(nextDate);
  }

  dates.push(currentDate);

  return dates
    .map((date) => ({
      day: getDayName(date),
      date: date.getDate(),
      month: getMonthName(date),
      year: date.getFullYear(),
    }))
    .slice(0, 5);
};


export function createDateFromObject(dateObject) {
  const {  date, month, year } = dateObject;
  const monthDict = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
      'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  const monthIndex = monthDict[month];
  return new Date(year, monthIndex, date);
}

export const QUESTION_TOPICS=[
  'All',
  "Statistics",
	"Probablity",
	"Trignomatery",
	"Geomatery",
	"Theorem",
	"Equations" 
]
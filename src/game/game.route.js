const calendarService = require("./calendar.service");

module.exports = (app) => {
    app.get("/calendar", calendarService.fetchCalendar);
}
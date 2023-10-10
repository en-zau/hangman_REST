const sql = require("../db.js");
const cheerio = require('cheerio');

exports.getCalendar = async (req, res) => {
  res.send("z")
}

exports.fetchCalendar = async (req, res) => {
  const response = await fetch("https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx?action=posEDTLMS&serverID=C&Tel=mael.raingeard&date=10/18/2023&hashURL=4C31666484914169D77E9C2F893D45B63A1A86604072601277FA2584D8BB54DEB65EF4CC16E773E58395AAFBA5B5939D767C1873944555FD012DDC4B2D35E7F0", {
    "headers": {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      "cache-control": "no-cache",
      "pragma": "no-cache",
      "sec-ch-ua": "\"Google Chrome\";v=\"117\", \"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"117\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"macOS\"",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "same-origin",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "cookie": "ASP.NET_SessionId=2snwwp5wquam3fawktxpsqqv; .DotNetCasClientAuth=114C47182B04069E778F3F4E969BD92896924919D07029D540DDB20500996CABF6F0FA7D54546DBB4D295A0CB8BED337AD9C8544ADBDE97F245B60F92E8F1BFDF3F5E0DE6864113FD06551AA8B9AD2A0C2D843D722E41273BAF8005223A2A59EFDAE86938F089CD1E4CC7CCCF85A3088D8D0D5FD38D521059E3B11E364827A9E249294AA0C17636A2E39C074E15B460E8687A725EBFFE11D33878568C9101B0DDAD8D4835D7E8243B0D9662C27FCE05C4D42673F92AA338412C8365F916D651998CFF7C8F5EEE8EB5544FDF1A94F71F6",
      "Referer": "https://ws-edt-cd.wigorservices.net/WebPsDyn.aspx?action=posEDTLMS&serverID=C&Tel=mael.raingeard&date=10/22/2023&hashURL=4C31666484914169D77E9C2F893D45B63A1A86604072601277FA2584D8BB54DEB65EF4CC16E773E58395AAFBA5B5939D767C1873944555FD012DDC4B2D35E7F0",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
  });

  const calendar = await response.text();


  _parseWeekCalendar(calendar)
  res.send(calendar)
}

const _parseWeekCalendar = calendarHtml => {
  const $calendar = cheerio.load(calendarHtml);

  const positionsMatch = {
    'left:103.1200%': 'monday',
    'left:122.5200%': 'tuesday',
    'left:141.9200%': 'wednesday',
    'left:161.3200%': 'thursday',
    'left:180.7200%': 'friday'
  }
  const week = {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: []
  }

  const activites = $calendar('.Case');

  activites.each((index, element) => {
    const styleAttribute = element.attribs.style;
    const leftPositionMatch = styleAttribute.match(/left:[\d.]+%/);

    if (!leftPositionMatch) return;

    const day = positionsMatch[leftPositionMatch[0]];

    if (!day) return;

    const $element = $calendar(element);
    const activieName = $element.find('td.TCase').text();
    const teacherName = $element.find('td.TCProf').contents().filter((i, el) => el.nodeType === 3).eq(0).text().trim();
    const timeInfo = $element.find('td.TChdeb').text().split('-');
    const startTime = timeInfo[0].trim();
    const endTime = timeInfo[1].trim();
    const location = $element.find('td.TCSalle').text().replace(/Salle:|M:/g, '').trim();

    week[day].push({
      activieName,
      teacherName,
      startTime,
      endTime,
      location
    });
  });
  return week;
}

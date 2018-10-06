function doGet() {
  const indexHtml = HtmlService.createTemplateFromFile('index.html');
  indexHtml.title = 'ToDo リスト';
  return indexHtml.evaluate().addMetaTag('viewport', 'width=device-width, initial-scale=1, user-scalable=no');
}

function simpleDateString(event) {
  if (event.start.date) {
    var start = new Date(event.start.date);
    return start.getFullYear() + "/" + (start.getMonth() + 1) + "/" + start.getDate();
  } else {
    var start = new Date(event.start.dateTime);
    return start.getFullYear() + "/" + (start.getMonth() + 1) + "/" + start.getDate();
  }
}

function dateString(event) {
  if (event.start.date) {
    var now = new Date();
    var start = new Date(event.start.date);
    var diff = start.getDate() - now.getDate();
    if (diff > 0) {
      return '終了';
    } else if (diff === 0) {
      return '今';
    } else {
      return '開始前';
    }
  } else {
    var now = new Date();
    var start = new Date(event.start.dateTime);
    
    if (now.getTime() < start.getTime()) {
      // 開始前
      if (now.getDate() < start.getDate()) {
        return '明日';
      }
      var diff = (start.getHours() - now.getHours());
      if (diff > 0) {
        return diff + '時間後';
      } else {
        return (start.getMinutes() - now.getMinutes()) + '分後';
      }
    } else {
      // 開始中・終了
      if (start.getDate() < now.getDate()) {
        return "昨日";
      }
      var diff = (now.getHours() - start.getHours());
      if (diff > 0) {
        return diff + '時間前';
      } else {
        return (now.getMinutes() - start.getMinutes()) + '分前';
      }
    }
  }
}

function getRemainings() {
  var calendarId = 'primary';
  
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var beforeThirty = new Date();
  beforeThirty.setDate(beforeThirty.getDate() - 30);
  
  var events = Calendar.Events.list(calendarId, {
    timeMin: beforeThirty.toISOString(),
    timeMax: yesterday.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 500,
  });
  
  var result = [];
  if (events.items && events.items.length > 0) {
    for (var i = 0; i < events.items.length; i++) {
      var event = events.items[i];
      if (event.colorId !== '8' && event.colorId !== '9') {
        result.push({
          id: event.id,
          title: event.summary,
          color: event.colorId,
          time: simpleDateString(event),
          description: fixDescription(event.description),
          is_info: new Date(event.end.date ? event.end.date : event.end.dateTime) < new Date(),
          html_link: event.htmlLink
        });
      }
    }
  }
  return result;
}

function getTodo() {
  var calendarId = 'primary';

  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  var events = Calendar.Events.list(calendarId, {
    timeMin: yesterday.toISOString(),
    timeMax: tomorrow.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  });
  
  var result = [];
  if (events.items && events.items.length > 0) {
    for (var i = 0; i < events.items.length; i++) {
      var event = events.items[i];
      if (event.colorId !== '8') {
        result.push({
          id: event.id,
          title: event.summary,
          color: event.colorId,
          time: dateString(event),
          description: fixDescription(event.description),
          is_info: new Date(event.end.date ? event.end.date : event.end.dateTime) < new Date(),
          html_link: event.htmlLink
        });
      }
    }
  }  
  return result;
}

function fixDescription(description) {
  if (description) {
    return description.replace(/^<br>/,"").replace(/\n/g,'<br>').replace(/(<br>[ ]+)+/g, '<br>').replace(/(<br>)+/g, '<br>').replace(/\- \[\] /g, '<input type="checkbox"> ').replace(/style="(.+)"/, "");
  } else {
    return description;
  }
}

function done(id) {
  if (!id) {
    return id;
  }
  var calendarId = 'primary';
  var event = Calendar.Events.get(calendarId, id);
  event.colorId = "8";
  Calendar.Events.patch(event, calendarId, id);
  return id;
}

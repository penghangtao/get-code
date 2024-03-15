function axios(obj, type = 'application/json', sendType = 1, withCredentials) {
  return new Promise((resove, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = withCredentials || false
    var method = obj.method.toUpperCase();
    var url = obj.url;
    if (method === "GET") {
      let get_qs = resolveData(obj.params);
      xhr.open(method, url + (get_qs ? `?${get_qs}` : ""));
      xhr.send();
    } else if (method === "POST") {
      xhr.open(method, url);
      xhr.setRequestHeader("Content-Type",type);
      if(obj.token){
        xhr.setRequestHeader("Authorization",obj.token);
      }
      if(sendType == 1){
        xhr.send(JSON.stringify(obj.data));
      } else if(sendType === 2) {
        xhr.send(resolveData(obj.data));
      } else {
        xhr.send(obj.data);
      }
    }
    xhr.onreadystatechange = function () {
      if (xhr.status !== 200) return reject(xhr.status)
      if (xhr.readyState === 4 && xhr.status === 200) {
        resove(xhr.responseText);
      }
    };
  });
}

function resolveData(data) {
  var arr = [];
  for (var k in data) {
    if(data[k]) {
      let value = data[k]
      if(Object.prototype.toString.call(value) === '[object Object]') {
        value = encodeURIComponent(JSON.stringify(value))
      }
      arr.push(k + "=" + value)
    }
  }
  return arr.join("&");
}
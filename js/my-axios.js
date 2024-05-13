function axios(obj) {
  return new Promise((resove, reject) => {
    const xhr = new XMLHttpRequest();
    // 是否带上cookie
    xhr.withCredentials = obj.withCredentials || false
    const method = obj.method.toUpperCase();
    const url = obj.url;
    // 请求头 Content-Type
    const contentType = obj.contentType || 'application/json'
    // 是否处理请求体
    const isHandleRequestBody = obj.isHandleRequestBody === undefined ? true : obj.isHandleRequestBody
    if(obj.params) {
      const get_qs = resolveData(obj.params);
      xhr.open(method, url + (get_qs ? `?${get_qs}` : ""));
    } else {
      xhr.open(method, url);
    }
    if (method === "GET") {
      xhr.send();
    } else if (method === "POST") {
      xhr.setRequestHeader("Content-Type", contentType);
      if(obj.token){
        xhr.setRequestHeader("Authorization", obj.token);
      }
      if(isHandleRequestBody) {
        if(contentType === 'application/json'){
          xhr.send(JSON.stringify(obj.data));
        } else if(contentType === 'application/x-www-form-urlencoded') {
          xhr.send(resolveData(obj.data));
        }
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
    let value = data[k]
    if(Object.prototype.toString.call(value) === '[object Object]') {
      // value = encodeURIComponent(JSON.stringify(value))
      value = JSON.stringify(value)
    }
    arr.push(k + "=" + encodeURIComponent(value))
    // if(data[k]) {
    // }
  }
  return arr.join("&");
}
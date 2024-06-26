window.onload = async function() {
  removeTranslateClass()
  const target = await domQuery('#scrollIntersectionCenter')

  // 创建观察者实例并传入回调函数
  const observer = new MutationObserver(value => {
    // console.log('%c fksdfjsla', 'background-color: skyblue;', 'start-MutationObserver', value)
    removeTranslateClass()
  });

  // 开始观察
  observer.observe(target, {
    childList: true
  });

}

async function removeTranslateClass() {
  try {
    // console.log('%c fksdfjsla', 'background-color: skyblue;', 'start-translate')
    const dom = await domQuery('.notranslate')
    // console.log('%c fksdfjsla', 'background-color: skyblue;', dom)
    if(dom) {
      dom.classList.remove('notranslate')
    }
  } catch(err) {
    console.error(err)
  }
}

function domQuery(str, parentDom = document, maxCount = 20, time = 600) {
  return new Promise((resolve, reject) => {
    let count = 0
    const timer = setInterval(() => {
      const dom = parentDom.querySelector(str)
      if(dom) {
        clearInterval(timer)
        resolve(dom)
      } else if(count > maxCount) {
        clearInterval(timer)
        reject(str + '过了时间未找到改dom元素')
      }
      count++
    }, time)
  })
}
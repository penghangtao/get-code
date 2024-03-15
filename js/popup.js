(async function() {
  // dom集合
  const ulDom = document.querySelector('.container>ul')
  const noLogin = document.querySelector('.container>.no-login')
  const conditionDom = document.querySelector('.condition')
  const maskDom = document.querySelector('.mask')
  const otherPlatformDom = document.querySelector('#other-platform>h1')
  const conditionDomObj = {
    isJump: document.getElementById('is-jump'),
    isCode: document.getElementById('is-code'),
    isProdution: document.getElementById('is-prodution'),
  }
  // 是否选中的条件
  const conditionObj = {
    isJump: !!parseInt(localStorage.getItem('isJump')),
    isCode: !!parseInt(localStorage.getItem('isCode')),
    isProdution: !!parseInt(localStorage.getItem('isProdution')),
  }

  async function init() {
    const { data: shopInfo } = await getShopInfo()
    // 判断是否登录
    if(!Object.keys(shopInfo).length) return noLogin.classList.remove('hide')
    // 已登录
    conditionDom.classList.remove('hide')
    initCondition.call(conditionDomObj.isCode)
    // 渲染列表
    const [{ id, toutiao_id }] = shopInfo
    const { data: { data } } = await getAuthAppList(id, toutiao_id)
    const dataHtml = data.map(item => `
      <li data-appId="${item.appId}" data-authId="${item.authId}">
        <img src="${item.detail.serviceIcon}">
        <span>${item.detail.AppName}</span>
      </li>
    `).join('')
    ulDom.innerHTML = dataHtml
  }

  /**
   * 获取店铺信息
   */
  async function getShopInfo() {
    const { data } =  await axios({
      url: 'https://fxg.jinritemai.com/byteshop/index/getshoplist?appid=1&__token=d9a2c5f872f583401c2a1aecc0a7d2dc&_lid=782231270223&msToken=QCjiKgMRhlwuLP9428ygKUH7W90Y3nGZC-H-AZGhUWH-5hc3537IbGTOJ4VR8GzaekYHYNoxL6YI8SUQxiTeW1qjA8A9J9fsfifStR4wmuUTl0IOQfq4tdL1rf77eO8CFA==&X-Bogus=DFSzsdVYXqXANyD7tn9Hj03/c2cM',
      method: 'GET',
    })
    return data
  }

  /**
   * 获取店铺授权的应用列表
   */
  async function getAuthAppList(shopId, toutiaoId) {
    const { data } = await axios({
      url: `https://fuwu.jinritemai.com/api/shop/authAppList?shopId=${shopId}&toutiaoId=${toutiaoId}&pageSize=24&pageIndex=1&fuzzyName=&_lid=777410134136`,
      method: 'GET'
    })
    return data
  }

  /**
   * 初始化条件状态
   */
  function initCondition(key = 'isCode') {
    conditionObj[key] = this.checked
    if(!this.checked) return
    const radioArr = ['isJump', 'isProdution', 'isCode']
    const radioOther = radioArr.filter(item => item !== key)
    radioOther.forEach(item => {
      conditionObj[item] = !this.checked
    })
    // const radioArr = ['isJump', 'isProdution']
    // if(radioArr.includes(key)) {
    //   if(!this.checked) return
    //   const radioOther = radioArr.filter(item => item !== key)
    //   radioOther.forEach(item => {
    //     conditionObj[item] = !this.checked
    //   })
    // } else if(key === 'isCode') {
    //   if(this.checked) {
    //     conditionObj.isJump = false
    //     conditionObj.isProdution = false
    //     isDisabled(conditionDomObj.isJump)
    //     isDisabled(conditionDomObj.isProdution)
    //     return
    //   }
    //   isDisabled(conditionDomObj.isJump, 0)
    //   isDisabled(conditionDomObj.isProdution, 0)
    // }
  }

  /**
   * 是否禁用
   * type -> 0: 取消禁用, 1: 禁用 default 1
   */
  function isDisabled(dom, type = 1) {
    dom.disabled = !!type
    if(type === 1) {
      dom.parentNode.classList.add('disabled')
      return
    }
    dom.parentNode.classList.remove('disabled')
  }

  /**
   * 格式化链接的参数
   */
  function formatUrl(url) {
    const queryStr = url.split('?')[1]
    const arr = queryStr.split('&')
    return arr.reduce((allObj, item) => {
      const [key, value] = item.split('=')
      allObj[key] = value
      return allObj
    }, {})
  }

  /**
   * 字符串插入
   */
  function insertStr(soure, start, newStr){   
    return soure.slice(0, start) + newStr + soure.slice(start);
 }
  

  /**
   * copy
   */
  function copy(value) {
    const el = document.createElement('input')
    el.setAttribute('value', value)
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }

  // 遍历checkbox的状态
  for(let key of Object.keys(conditionObj)) {
    const value = conditionObj[key]
    Object.defineProperty(conditionObj, key, {
      get() {
        return conditionDomObj[key].checked
      },
      set(value) {
        localStorage.setItem(key, Number(value))
        conditionDomObj[key].checked = value
      }
    })
    conditionDomObj[key].addEventListener('change', function() {
      initCondition.call(this, key)
    })
    conditionObj[key] = value
  }

  init()

  // 事件
  ulDom.addEventListener('click', async function(e) {
    const nodeName = e.target.nodeName
    let target = e.target
    if(this === target) return
    if(nodeName !== 'LI') {
      target = target.parentNode
    }
    const appId = target.getAttribute('data-appId')
    const authId = target.getAttribute('data-authId')
    maskDom.classList.remove('hide')
    const { data: { data: { url } } } = await axios({
      url: `https://fuwu.jinritemai.com/api/shop/getAppUrl?appId=${appId}&authId=${authId}&needLinkRiskCheck=true`,
      method: 'GET'
    })
    maskDom.classList.add('hide')
    const { isCode, isJump, isProdution } = conditionObj
    // 是否跳转测试环境
    if(isJump) {
      let jumpUrl = url
      if(url.includes('dadan.hzyqds.com') || url.includes('sms.chaojids.com')) {
        jumpUrl = jumpUrl.replace('https', 'http')
      }
      jumpUrl = insertStr(jumpUrl, jumpUrl.indexOf('.'), 'test')
      window.open(jumpUrl)
      return
    }
    // 是否跳转正式环境
    if(isProdution) return window.open(url)
    // 是否复制code
    if(isCode) return copy(`?code=${formatUrl(url).code}`)
    // 最后都不勾选 复制普通链接
    copy(url)
  })

  // 其他平台入口
  otherPlatformDom.addEventListener('click', function() {
    chrome.tabs.create({url: chrome.runtime.getURL('myPage.html'), active: true}, function(tabs) {
      // alert(tabs.id)
    })
  })

} ())
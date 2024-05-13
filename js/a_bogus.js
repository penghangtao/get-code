String.prototype.translate = function(firstStr, secondStr) {
  if(typeof firstStr !== 'string' || typeof secondStr !== 'string') {
    throw new TypeError('请传入字符串！')
  }
  if(firstStr.length !== secondStr.length) {
    throw new TypeError('两个字符串的长度必须一致！')
  }
  const arr = this.split('')
  return arr.map(item => {
    const index = firstStr.indexOf(item)
    return index >= 0 ? secondStr[index] : item
  }).join('')
}

/**
 * 国密SM3加密{JS实现}
 * 
 * 参考 https://blog.csdn.net/Shen_yuanjia/article/details/111879819
 * 
 * @returns
 */
function SM3() {
	if (!(this instanceof SM3)) {
		return new SM3();
	}
 
	this.reg = new Array(8);
	this.chunk = [];
	this.size = 0;
 
	this.reset();
}
 
SM3.prototype.reset = function() {
	this.reg[0] = 0x7380166f;
	this.reg[1] = 0x4914b2b9;
	this.reg[2] = 0x172442d7;
	this.reg[3] = 0xda8a0600;
	this.reg[4] = 0xa96f30bc;
	this.reg[5] = 0x163138aa;
	this.reg[6] = 0xe38dee4d;
	this.reg[7] = 0xb0fb0e4e;
	this.chunk = [];
	this.size = 0;
};
 
/**
 * 字符串转byte数组
 */
SM3.prototype.strToBytes= function (s) {
  var ch, st, re = [];
  for (var i = 0; i < s.length; i++ ) {
    ch = s.charCodeAt(i);  
    st = [];                 
    do {
      st.push( ch & 0xFF );  
      ch = ch >> 8;          
    }
    while ( ch );
    re = re.concat( st.reverse() );
  }
  return re;
};
 
SM3.prototype.write = function(msg) {
	var m = (typeof msg === 'string') ? this.strToBytes(msg) : msg;
	this.size += m.length;
	var i = 64 - this.chunk.length;
	if (m.length < i) {
		this.chunk = this.chunk.concat(m);
		return;
	}
 
	this.chunk = this.chunk.concat(m.slice(0, i));
	while (this.chunk.length >= 64) {
		this._compress(this.chunk);
		if (i < m.length) {
			this.chunk = m.slice(i, Math.min(i + 64, m.length));
		} else {
			this.chunk = [];
		}
		i += 64;
	}
};
 
/**
 * 计算hash值
 */
SM3.prototype.sum = function(msg, enc) {
	if (msg) {
		this.reset();
		this.write(msg);
	}
 
	this._fill();
	for (var i = 0; i < this.chunk.length; i += 64) {
		this._compress(this.chunk.slice(i, i + 64));
	}
 
	var digest = null;
	if (enc == 'hex') {
		digest = "";
		for (var i = 0; i < 8; i++) {
			digest += this.reg[i].toString(16);
		}
	} else {
		var digest = new Array(32);
		for (var i = 0; i < 8; i++) {
			var h;
			h = this.reg[i];
			digest[i * 4 + 3] = (h & 0xff) >>> 0;
			h >>>= 8;
			digest[i * 4 + 2] = (h & 0xff) >>> 0;
			h >>>= 8;
			digest[i * 4 + 1] = (h & 0xff) >>> 0;
			h >>>= 8;
			digest[i * 4] = (h & 0xff) >>> 0;
		}
	}
 
	this.reset();
	return digest;
};
 
SM3.prototype._compress = function(m) {
	if (m < 64) {
		console.error("compress error: not enough data");
		return;
	}
	var w = this._expand(m);
	var r = this.reg.slice(0);
	for (var j = 0; j < 64; j++) {
		var ss1 = this._rotl(r[0], 12) + r[4] + this._rotl(this._t(j), j)
		ss1 = (ss1 & 0xffffffff) >>> 0;
		ss1 = this._rotl(ss1, 7);
 
		var ss2 = (ss1 ^ this._rotl(r[0], 12)) >>> 0;
		var tt1 = this._ff(j, r[0], r[1], r[2]);
		tt1 = tt1 + r[3] + ss2 + w[j + 68];
		tt1 = (tt1 & 0xffffffff) >>> 0;
		var tt2 = this._gg(j, r[4], r[5], r[6]);
		tt2 = tt2 + r[7] + ss1 + w[j];
		tt2 = (tt2 & 0xffffffff) >>> 0;
		r[3] = r[2];
		r[2] = this._rotl(r[1], 9);
		r[1] = r[0];
		r[0] = tt1;
		r[7] = r[6]
		r[6] = this._rotl(r[5], 19);
		r[5] = r[4];
		r[4] = (tt2 ^ this._rotl(tt2, 9) ^ this._rotl(tt2, 17)) >>> 0;
	}
 
	for (var i = 0; i < 8; i++) {
		this.reg[i] = (this.reg[i] ^ r[i]) >>> 0;
	}
};
 
SM3.prototype._fill = function() {
	var l = this.size * 8;
	var len = this.chunk.push(0x80) % 64;
	if (64 - len < 8) {
		len -= 64;
	}
	for (; len < 56; len++) {
		this.chunk.push(0x00);
	}
 
	for (var i = 0; i < 4; i++) {
		var hi = Math.floor(l / 0x100000000);
		this.chunk.push((hi >>> ((3 - i) * 8)) & 0xff);
	}
	for (var i = 0; i < 4; i++) {
		this.chunk.push((l >>> ((3 - i) * 8)) & 0xff);
	}
};
 
SM3.prototype._expand = function(b) {
	var w = new Array(132);
	for (var i = 0; i < 16; i++) {
		w[i] = b[i * 4] << 24;
		w[i] |= b[i * 4 + 1] << 16;
		w[i] |= b[i * 4 + 2] << 8;
		w[i] |= b[i * 4 + 3];
		w[i] >>>= 0;
	}
 
	for (var j = 16; j < 68; j++) {
		var x;
		x = w[j - 16] ^ w[j - 9] ^ this._rotl(w[j - 3], 15);
		x = x ^ this._rotl(x, 15) ^ this._rotl(x, 23);
		w[j] = (x ^ this._rotl(w[j - 13], 7) ^ w[j - 6]) >>> 0;
	}
 
	for (var j = 0; j < 64; j++) {
		w[j + 68] = (w[j] ^ w[j + 4]) >>> 0;
	}
 
	return w;
};
 
SM3.prototype._rotl = function(x, n) {
	n %= 32;
	return ((x << n) | (x >>> (32 - n))) >>> 0;
};
 
SM3.prototype._t = function(j) {
	if (0 <= j && j < 16) {
		return 0x79cc4519;
	} else if (16 <= j && j < 64) {
		return 0x7a879d8a;
	} else {
		console.error("invalid j for constant Tj");
	}
};
 
SM3.prototype._ff = function(j, x, y, z) {
	if (0 <= j && j < 16) {
		return (x ^ y ^ z) >>> 0;
	} else if (16 <= j && j < 64) {
		return ((x & y) | (x & z) | (y & z)) >>> 0;
	} else {
		console.error("invalid j for bool function FF");
		return 0;
	}
};
 
SM3.prototype._gg = function(j, x, y, z) {
	if (0 <= j && j < 16) {
		return (x ^ y ^ z) >>> 0;
	} else if (16 <= j && j < 64) {
		return ((x & y) | (~x & z)) >>> 0;
	} else {
		console.error("invalid j for bool function GG");
		return 0;
	}
};
 
/**
 * 等效于Array.from目的是做浏览器兼容处理 Array.from IE浏览器不支持
 */
SM3.prototype.toArray = function(s, f){
	var a = [];
	for(var i=0; i<s.length; i++){
		var t  = s[i];
		if(f){
			t = f(t);
		}
		a.push(t);
	}
	return a;
};
 
/**
 * SM3加密主函数
 * 
 * @param msg
 * @returns
 */
function sm3Digest(msg){
	var _sm3 = new SM3();
  var digest = _sm3.sum(msg);
  var hashHex = _sm3.toArray(digest, function(byte) {return ('0' + (byte & 0xFF).toString(16)).slice(-2);}).join('');
  return hashHex;
}

function hexToDecimalArray(hexString) {
  // 将十六进制字符串分割成两个字符一组
  const hexPairs = hexString.match(/.{2}/g);
  // 将每个十六进制对转换为十进制，并存储在数组中
  const decimalArray = hexPairs.map(pair => parseInt(pair, 16));
  return decimalArray;
}

/**
 * ascii码 转换
 * @param {String | Array} data 
 * @param {1 | 2} type
 */
function asciiTranslate(data, type = 1) {
  if(type === 1) {
    return data.split('').map(item => item.charCodeAt())
  }
  return data.map(item => String.fromCharCode(item))
}

// 业务代码

const box1 = [
  0, 218, 17, 20, 25, 23, 95, 116, 236, 14, 146, 5, 3, 151, 128, 186, 32, 114,
  244, 80, 4, 46, 36, 85, 213, 108, 174, 201, 63, 129, 47, 99, 38, 81, 150, 242,
  69, 60, 72, 55, 192, 52, 10, 77, 96, 141, 59, 62, 165, 204, 67, 120, 90, 240,
  200, 94, 164, 221, 229, 98, 37, 145, 57, 230, 8, 232, 169, 212, 132, 115, 209,
  54, 110, 170, 39, 91, 167, 225, 207, 31, 210, 182, 152, 83, 144, 195, 211,
  161, 65, 29, 147, 183, 42, 97, 153, 50, 223, 43, 188, 79, 158, 187, 166, 179,
  68, 121, 44, 155, 75, 173, 252, 249, 11, 159, 27, 133, 58, 124, 243, 198, 239,
  45, 241, 217, 1, 74, 162, 103, 136, 226, 112, 199, 191, 21, 180, 163, 196,
  157, 71, 56, 143, 234, 33, 205, 233, 34, 181, 139, 119, 64, 193, 102, 76, 61,
  15, 109, 160, 222, 111, 247, 202, 104, 70, 84, 178, 171, 86, 140, 53, 238, 88,
  255, 228, 175, 22, 118, 177, 197, 105, 82, 7, 154, 92, 190, 248, 246, 214,
  203, 135, 126, 123, 78, 18, 30, 35, 245, 12, 168, 51, 100, 227, 251, 235, 93,
  49, 122, 208, 206, 219, 142, 101, 176, 215, 130, 66, 117, 40, 134, 2, 253,
  216, 189, 156, 125, 24, 16, 26, 41, 220, 137, 106, 250, 172, 138, 237, 127,
  19, 107, 148, 194, 89, 48, 254, 113, 231, 185, 28, 224, 87, 73, 184, 9, 6, 13,
  131, 149,
]

const box2 = [
  0, 7, 140, 235, 54, 24, 170, 17, 222, 123, 210, 20, 206, 127, 179, 162, 78,
  199, 21, 227, 37, 77, 171, 5, 224, 26, 3, 114, 176, 89, 151, 57, 220, 100, 69,
  70, 28, 254, 60, 58, 113, 92, 73, 18, 186, 98, 228, 152, 75, 255, 64, 23, 232,
  244, 109, 81, 84, 79, 65, 49, 190, 126, 63, 148, 195, 88, 14, 96, 10, 30, 99,
  201, 245, 193, 39, 108, 51, 4, 103, 132, 239, 182, 139, 97, 226, 229, 212,
  102, 48, 144, 125, 216, 107, 15, 207, 1, 74, 247, 130, 143, 184, 61, 217, 189,
  149, 225, 211, 204, 253, 145, 241, 194, 214, 202, 236, 47, 121, 164, 157, 93,
  8, 196, 67, 34, 118, 25, 59, 72, 44, 158, 146, 166, 243, 208, 87, 111, 155,
  90, 46, 32, 105, 147, 173, 11, 246, 153, 141, 163, 104, 234, 124, 122, 35,
  150, 110, 238, 38, 160, 167, 174, 115, 112, 66, 169, 95, 117, 36, 221, 252,
  68, 53, 131, 156, 133, 213, 198, 161, 101, 83, 159, 76, 116, 142, 91, 9, 12,
  178, 205, 55, 209, 137, 183, 120, 197, 19, 180, 172, 71, 181, 135, 22, 231,
  233, 86, 27, 154, 80, 192, 175, 56, 31, 177, 2, 242, 203, 251, 106, 168, 119,
  42, 248, 165, 185, 187, 33, 129, 237, 138, 230, 191, 250, 29, 40, 41, 45, 240,
  52, 136, 6, 94, 43, 134, 16, 200, 215, 82, 13, 249, 85, 188, 0, 50, 219, 128,
  218, 223,
]

function xor_encrypt(message, box) {
  const encrypt_list = []
  for(let i = 0; i < message.length; i++) {
    box[0] = box[0] + box[i + 1]
    if(box[0] > 255) {
      box[0] ^= 256
    }
    // box[i + 1] = box[box[0]]
    // box[box[0]] = box[i + 1]
    // [box[i + 1], box[box[0]]] = [box[box[0]], box[i + 1]]
    let temp = box[i + 1]
    box[i + 1] = box[box[0]]
    box[box[0]] = temp
    const num = message[i].charCodeAt() ^ (box[(box[i + 1] + box[box[0]]) & 255])
    const hexStr = String.fromCharCode(num)
    // console.log(message[i].charCodeAt(), (box[(box[i + 1] + box[box[0]]) & 255]), message[i].charCodeAt() ^ (box[(box[i + 1] + box[box[0]]) & 255]))
    encrypt_list.push(hexStr)
  }
  return encrypt_list
}

function base64encode(message, base64table) {
  const args = [
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    base64table
  ]
  return btoa(message.join('')).translate(...args)
}

function get_a_bogus(url, data, ua = navigator.userAgent) {
  const ua_arr = hexToDecimalArray(sm3Digest(asciiTranslate(base64encode(xor_encrypt(ua, box1), 'ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe='))))
  const url_arr = hexToDecimalArray(sm3Digest(hexToDecimalArray(sm3Digest(asciiTranslate(url + 'bds')))))
  let data_arr = [83, 69, 109, 82, 24, 153, 247, 200, 198, 128, 168, 162, 244, 70, 5, 146, 100, 77, 138, 136, 44, 218, 117, 115, 118, 120, 152, 238, 238, 224, 239, 43]
  if(data) {
    data_arr = hexToDecimalArray(sm3Digest(hexToDecimalArray(sm3Digest(asciiTranslate(data + 'bds')))))
  }
  const t0 = Date.now()
  const t1 = t0 + parseInt(Math.random() * (800 - 450 + 1))
  const t2 = t1 + parseInt(Math.random() * (800 - 450 + 1))

  const m29 = [
    65, (t0 >> 24) & 255, 0, 0, 0, url_arr[21], data_arr[21], ua_arr[23], (t0 >> 16) & 255, 0, 1, 0, url_arr[22], data_arr[22], ua_arr[24],
    (t1 >> 8) & 255, 0, 0, 0, (t1 >> 0) & 255, 0, 0, 14, (t0 >> 24) & 255, (t0 >> 16) & 255, (t0 >> 8) & 255, (t0 >> 0) & 255, 3
  ]

  m29.push(m29.reduce((x, y) => x ^ y, 0))

  // console.log(t2, '-----', m29)
  const m1 = asciiTranslate([(((t2 >> 0) & 255) & 170) | 1, (((t2 >> 0) & 255) & 85) | 2, (((t2 >> 8) & 255) & 170) | 64, (((t2 >> 8) & 255) & 85) | 2], 2).join('') + xor_encrypt(asciiTranslate(m29, 2).join(''), box2).join('')
  // console.log(m1, m1.split(''))
  const ab = base64encode(m1.split(''), 'Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe=')
  return ab

}

// a_bogus(
//   'is_h5=1&is_native_h5=1&verifyFp=verify_luaukolq_tQP6awxp_XllN_4FeK_AXy5_4CAd8u5wGiaL&origin_type=detail_share&msToken=nUj0DhKrZarBOH60ml48oXk80Gg0s9sDM8oRH-hv11ktYwkxc76fjCE-Ak1Wyff4HGGipv8ofhWCITfWeexFP0lwx5LOA0OUDat5SM1SMtA-ZJ2Tid-HFtGOJmUR7itl',
//   'ui_params=%7B%22source_page%22%3A%22copy%22%2C%22from_live%22%3Afalse%2C%22from_video%22%3Anull%2C%22source_method%22%3A%22product_card%22%2C%22carrier_source%22%3A%22search_ecommerce_scan%22%2C%22three_d_log_data%22%3Anull%2C%22follow_status%22%3Anull%2C%22which_account%22%3Anull%2C%22ad_log_extra%22%3Anull%2C%22from_group_id%22%3Anull%2C%22bolt_param%22%3Anull%2C%22transition_tracker_data%22%3Anull%2C%22request_additions%22%3A%7B%22from_internal_feed%22%3Afalse%2C%22cps_track%22%3A%22%22%2C%22marketing_channel%22%3A%22%22%2C%22ecom_scene_id%22%3A%221082%22%7D%2C%22selected_ids%22%3Anull%2C%22window_reposition%22%3Anull%2C%22is_short_screen%22%3Anull%2C%22full_mode%22%3Atrue%7D&use_new_price=1&is_h5=1&bff_type=2&is_in_app=0&origin_type=detail_share&promotion_ids=3630074402865023819&item_id=0&meta_param=%7B%22entrance_info%22%3A%22%7B%5C%22EVENT_ORIGIN_FEATURE%5C%22%3A%5C%22TEMAI%5C%22%2C%5C%22carrier_source%5C%22%3A%5C%22search_ecommerce_scan%5C%22%2C%5C%22ecom_scene_id%5C%22%3A%5C%221082%5C%22%2C%5C%22product_activity_type%5C%22%3A%5C%22nonactivity%5C%22%2C%5C%22search_keyword%5C%22%3A%5C%22image_search_202403281356253BE345543F394CEBA36A%5C%22%2C%5C%22enter_from_merge%5C%22%3A%5C%22search_ecommerce_scan%5C%22%2C%5C%22apt_path_id%5C%22%3A%5C%221%5C%22%2C%5C%22share_id%5C%22%3A%5C%22MS4wLjABAAAAJEE8R25CgTaOAANfiyAWKY6cD3La9dyynVtXO2cxLY8_request_page_1%5C%22%2C%5C%22search_id%5C%22%3A%5C%2220240328135634F6B990D021DDCD9CC5C1%5C%22%2C%5C%22search_params%5C%22%3A%5C%22%7B%5C%5C%5C%22search_id%5C%5C%5C%22%3A%5C%5C%5C%2220240328135634F6B990D021DDCD9CC5C1%5C%5C%5C%22%2C%5C%5C%5C%22search_result_id%5C%5C%5C%22%3A%5C%5C%5C%223630074402865023819%5C%5C%5C%22%2C%5C%5C%5C%22pipeline_version%5C%5C%5C%22%3A%5C%5C%5C%221%5C%5C%5C%22%7D%5C%22%2C%5C%22source_method%5C%22%3A%5C%22product_card%5C%22%2C%5C%22ecom_group_type%5C%22%3A%5C%22video%5C%22%2C%5C%22live_tracker_params%5C%22%3A%5C%22%5C%22%2C%5C%22card_status%5C%22%3A%5C%22%5C%22%7D%22%2C%22market_address%22%3A%22%7B%5C%22address_detail%5C%22%3A%5C%22%7B%5C%5C%5C%22address_list%5C%5C%5C%22%3A%5B%7B%5C%5C%5C%22address%5C%5C%5C%22%3A%7B%5C%5C%5C%22id%5C%5C%5C%22%3A%5C%5C%5C%227156876279147544589%5C%5C%5C%22%2C%5C%5C%5C%22address_type%5C%5C%5C%22%3A4%2C%5C%5C%5C%22extra%5C%5C%5C%22%3A%7B%5C%5C%5C%22strategy%5C%5C%5C%22%3A%5C%5C%5C%22poi_address%5C%5C%5C%22%7D%7D%2C%5C%5C%5C%22biz_code%5C%5C%5C%22%3A%5C%5C%5C%22xiaodian.supermarket_pop%5C%5C%5C%22%7D%5D%7D%5C%22%7D%22%7D&source_page=copy&request_additions=%7B%22from_internal_feed%22%3A%22false%22%2C%22cps_track%22%3A%22%22%2C%22marketing_channel%22%3A%22%22%2C%22ecom_scene_id%22%3A%221082%22%7D&author_id=99514375927&isFromVideo=false&ec_s=127ab4d4e9ab12360cf4cbf94061c94c0c09352f75a752_HMZoCojDcMgtbRPbmR8sPNLhounrU5Bs4rwBSn0G6lQ%3D&ec_promotion_id=3630074402865023819&enter_from=copy&enable_timing=true&from_internal_feed=false&cps_track=&marketing_channel=&ecom_scene_id=1082',
//   navigator.userAgent
// )


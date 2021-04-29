(function (global, factory) {
  // From https://github.com/jquery/jquery/blob/58c6ca9822afa42d3b40cca8edb0abe90a2bcb34/src/wrapper.js
  if (typeof module === 'object' && typeof module.exports === 'object') {
    // For CommonJS and CommonJS-like environments where a proper `window`
    // is present, execute the factory and get jQuery.
    // For environments that do not have a `window` with a `document`
    // (such as Node.js), expose a factory as module.exports.
    module.exports = global.document
      ? factory(global)
      : function (w) {
        if (!w.document) {
          throw new Error(
            'TagDeliveryContent requires a window with a document'
          );
        }
        return factory(w);
      };
  } else {
    factory(global);
  }

  // Pass this if window is not defined yet
})(typeof window !== 'undefined' ? window : this, function (window) {
  let _tdc = {};

_tdc.GLOBAL_NAME = 'TagDeliveryContent';
_tdc.HOST = 'ad.tagdelivery.com';
_tdc.PROTOCOL = 'https://';
_tdc.MAP_KEY = '_m';
_tdc.RETRY = 1250;
_tdc.TIMEOUT = 7000;

_tdc.LOADED = false;

_tdc.requestCount = 0;
_tdc.requestMap = {};
_tdc.callbacks = {};

/**
 * Returns if TagDeliveryContent obj is loaded on page
 * @return {bool}
 */
_tdc.isLoaded = function() {
  return _tdc.LOADED;
};

/**
 * Updates TagDeliveryContent LOADED status
 * @param evnt
 */
_tdc.onLoadHandler = function(evnt) {
  _tdc.LOADED = true;
  _tdc.log('Page Loaded');
};

if (window.addEventListener) {
  window.addEventListener('load', _tdc.onLoadHandler);
} else {
  window.attachEvent('onload', _tdc.onLoadHandler);
}

/**
 * Logs an event
 */
_tdc.log = function() {
  this.Log.add.apply(this.Log, [].slice.call(arguments));
};

/**
 *
 * @param (obj) inputs - data passed by retailer
 * @param (fn) callback
 * @return {str}
 */
_tdc.request = function(inputs, callback) {
  let request = new this.Request(inputs, callback);

  this.requestMap[request.id] = request;

  request.send();

  this.requestCount++;

  return request.id;
};


  _tdc.Util = (function() {
    let _util = {};

    // DOM reference for HEAD html element
    _util.head = document.head || document.getElementsByTagName('head')[0];

    /**
     *  generate a v4 UUID
     * @return {string} - UUID
     */
    _util.generateUuid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            let r = (Math.random() * 16) | 0,
                v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    /**
     * add a script tag to the DOM by specifying its URL and an optional error function
     * @param {str} url - adserver request URL
     * @param err
     * @return {HTMLScriptElement}
     */
    _util.attachScript = function(url, err) {
        let script = document.createElement('script');
        if (typeof err == 'function') {
            script.onerror = err;
        }

        script.type = 'text/javascript';

        this.head.appendChild(script);

        script.src = url;
        return script;
    };

    /**
     * get object type
     * @param {*} value
     * @return {"undefined"|"object"|"boolean"|"number"|"string"|"function"|"symbol"|"bigint"}
     */
    _util.getType = function(value) {
        let type = typeof value;
        if (
            type == 'object' &&
            Object.prototype.toString.call(value) === '[object Array]'
        ) {
            type = 'array';
        }
        return type;
    };

    /**
     * Determines if obj is an array
     * @param obj
     * @return {boolean}
     */
    _util.isArray = function(obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    };

    /**
     * Determines if obj is an obj
     * @param obj
     * @return {boolean}
     */
    _util.isObject = function(obj) {
        return Object.prototype.toString.call(obj) == '[object Object]';
    };

    /**
     * Determines if object is empty
     * @param obj
     * @return {boolean}
     */
    _util.isEmptyObject = function(obj) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    };

    /**
     * Transforms array to a query string
     * @param {array} items
     * @return {string}
     */
    _util.arrayToQueryString = function(items) {
        let out = [];
        for (let i = 0, l = items.length; i < l; i++) {
            let val = items[i]
            if (typeof val === 'string') {
                out.push(items[i].replace(/,/g, '%2C'));
            } else if (typeof val === 'number') {
                out.push(items[i])
            }
        }
        return out.join(',');
    };

    /**
     * Transforms an object to a query string
     * @param obj
     * @return {string}
     */
    _util.objectToQueryString = function(obj) {
        let out = [];
        for (let k in obj) {
            if (obj[k] !== null) {
                let t = this.getType(obj[k]);
                let v = null;
                if (t == 'array' && obj[k].length > 0) {
                    v = this.arrayToQueryString(obj[k]);
                } else if (t == 'object') {
                    v = encodeURIComponent(this.objectToQueryString(obj[k]));
                } else {
                    v = encodeURIComponent(obj[k]);
                }
                out.push(k + '=' + v);
            }
        }
        return out.join('&');
    };

    /**
     * Find a value in an array
     * @param {array} haystack
     * @param {str|int|bool} needle
     * @return {boolean}
     */
    _util.inArray = function(haystack, needle) {
        for (let i = 0, l = haystack.length; i < l; i++) {
            if (haystack[i] === needle) {
                return true;
            }
        }
        return false;
    };

    /**
     * Alerts different user of a particular CSS
     * @param {str} className
     */
    _util.getStyle = function(className) {
        let classes =
            document.styleSheets[0].rules || document.styleSheets[0].cssRules;
        for (let x = 0; x < classes.length; x++) {
            if (classes[x].selectorText == className) {
                classes[x].cssText ?
                    alert(classes[x].cssText) :
                    alert(classes[x].style.cssText);
            }
        }
    };

    /**
     * Format prices
     * @param {float|int} price
     * @param {str} currency - USD/EUR/etc.
     * @param language
     * @return {float} - formatted price
     */
    _util.formatPrice = function(price, currency, language) {
        if (typeof currency !== 'string') currency = 'USD';
        return Number(price).toLocaleString(language, {
            style: 'currency',
            currency: currency
        });
    }

    /**
     *
     * @param {obj} response - adserver response
     * @return {boolean} - whether or not to render the adserver response
     */
    _util.shouldRender = function(response) {
        let shouldRender = false;

        for (let i = 0; i < response.length; i++) {
            let r = response[i];

            if (r.sponsored) {
                shouldRender = true;
                break;
            }
        }

        return shouldRender;
    }

    /**
     *
     * @param {array} response - adserver response
     * @return {number} - number of adserver responses
     */
    _util.validateSponsoredCount = function(response) {
        let sponsoredCount = 0
        if (_tdc.Util.isArray(response)) {
            for (let i = 0, l = response.length; i < l; i++) {
                if (response[i].sponsored) {
                    sponsoredCount++;
                }
            }
        } else {
            sponsoredCount += (response.sponsored ? 1 : 0);
        }

        return sponsoredCount
    }

    /**
     *
     * @param {HTMLElement} html
     * @return {string}
     */
    _util.decodeHtml = function(html) {
        let txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    /**
     *
     * @param str
     * @return {string}
     */
    _util.convertToTitleCase = function(str) {
        return str.toLowerCase().replace(/^(.)|\s(.)/g, function($1) {
            return $1.toUpperCase();
        })
    }

    /**
     *
     * @return {{}} - merged object
     */
    _util.mergeObjects = function() {
        let resObj = {};
        for(let i=0; i < arguments.length; i += 1) {
             let obj = arguments[i],
                 keys = Object.keys(obj);
             for(let j=0; j < keys.length; j += 1) {
                 resObj[keys[j]] = obj[keys[j]];
             }
        }
        return resObj;
    }

    /**
     * Check if any of the values in source are in target
     * @param {array} source
     * @param {array} target
     * @return {bool}
     */
    _util.containsAny = function(source, target) {
        let result = source.filter(function(item){ return target.indexOf(item) > -1});
        return (result);
    };

    /**
     * Filter from source any of the values from toBeFiltered
     * @param {array} source
     * @param {array} toBeFiltered
     * @return {array} - filtered array
     */
    _util.filterTargets = function(source, toBeFiltered) {
        return source.filter(function (x) {
            return toBeFiltered.indexOf(x) < 0;
        });
    };

    /**
     * Targets each target in array to each other target
     * @param {array} crossTargets
     * @param {array} targetsCategory
     * @return {obj}
     */
    _util.crossTargetEach = function(crossTargets, targetsCategory) {
        let contains = _util.containsAny(crossTargets, targetsCategory);
        if (contains.length > 0) {
            let filtered = _util.filterTargets(crossTargets, contains);

            for (let j = 0; j < filtered.length; j++) {
                targetsCategory.push(filtered[j])
            }
        }
        return targetsCategory
    };

    /**
     *
     * @param array
     * @return {[]}
     */
    _util.deduplicateArray = function(array) {
        let set = new Set(array);
        let arr = [];
        set.forEach(function(x) {arr.push(x)});
        return arr
    };


    return _util;
})();


  _tdc.Log = (function() {
  let _log = {};

  _log.entries = [];
  _log.toConsole = false;

  /**
   * Adds logging
   */
  _log.add = function() {
    let entry = [].slice.call(arguments);
    entry.unshift(new Date());
    this.entries.push(entry);
    if (this.toConsole) {
      this.print(entry);
    }
  };

  /**
   * Prints an entry
   * @param entry
   */
  _log.print = function(entry) {
    let o = entry.slice(0);
    o[0] =
      o[0].toTimeString().substr(0, 8) +
      '.' +
      ('000' + o[0].getMilliseconds()).substr(-3);
    o.unshift(_tdc.GLOBAL_NAME);
    try {
      console.log.apply(console, o);
    } catch (e) {}
  };

  return _log;
})();


  

  _tdc.Pub = (function () {

    var _pub = {};

    let prods = [
        {
            "product": {
                // required product fields
                "sku": "1504319122",
                "name": "Projetor Laser Holográfico Para Festas",
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1578663552",
                "landingPageUrl": "https://www.extra.com.br/BelezaSaude/saude/AcessoriosparaSaude/projetor-laser-holografico-para-festas-1504319122.html?idlojista=12231",

                "onSale": true,
                "priceList": "99.9",
                "priceCurrent": "93.0",

                "installments": {
                    "months": "5",
                    "value": "18.6"
                },

                // optional product fields
                "rating": "4.5",
                "reviews": 350,
            },
            "product_id": "1504319122",
            "sponsored": true,
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=41725a4c-1108-4d4e-91e9-2c4a7fe342c5&x=kUxWSJ_8C7tcd7o5GajVOQDIPkO1PwNogbObzbNAAJDBsfVJ2OEyle244m_g1hv9QnAKLtqJ_uoxlqERWx_K75FojDcBdd3e8A72AjToedPTyMIIo2PYBf97qsFYBYFlYzAogXM18Bm-DXSoFTzUUryCU8pOE6y19bMh1-iGYc7QJVUOI1j_rg8V9tkc0xyf5KK2NHY4LZoIgkrIvUNM_J5YYNhbnfeVcF9cM32NyXQFD3MxV1QmbV69QurHjJgq1_aydXNdDVEdzfFSDsQEd1OM3D4Fa4LnH8vuYsMLXQQCSVfJtmjrHok3n1xqvua3mLq70CSdWLY0Ap-cR1FMogbyh4EsUKzZXQ9pS1T6bIvcvXrTmKGkjxA3IrBNOuIEDIgFEJcj_WCBTFOzgtBvaEfInK_ByCM6e5fKLi3f2RM%3D",
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=41725a4c-1108-4d4e-91e9-2c4a7fe342c5&x=kUxWSJ_8C7tcd7o5GajVOQDIPkO1PwNogbObzbNAAJDBsfVJ2OEyle244m_g1hv9QnAKLtqJ_uoxlqERWx_K75FojDcBdd3e8A72AjToedPTyMIIo2PYBf97qsFYBYFlYzAogXM18Bm-DXSoFTzUUryCU8pOE6y19bMh1-iGYc7QJVUOI1j_rg8V9tkc0xyf5KK2NHY4LZoIgkrIvUNM_J5YYNhbnfeVcF9cM32NyXQFD3MxV1QmbV69QurHjJgq1_aydXNdDVEdzfFSDsQEd1OM3D4Fa4LnH8vuYsMLXQQCSVfJtmjrHok3n1xqvua3mLq70CSdWLY0Ap-cR1FMogbyh4EsUKzZXQ9pS1T6bIvcvXrTmKGkjxA3IrBNOuIEDIgFEJcj_WCBTFOzgtBvaEfInK_ByCM6e5fKLi3f2RM%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "3199.00",
                "priceCurrent": "3199.00",
                "priceCurrency": "BRL",

                "installments": {
                    "months": "1",
                    "value": "3199.00"
                },

                "reviews": null,
                "imageSmall": "https//www.casasbahia-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1371067887",
                "name": "Notebook Asus Core i3-6100U 4GB 1TB Tela 15.6 Windows 10 X543UA-GQ3153T",
                "onSale": false,
                "sku": "13325371",
                "landingPageUrl": "https://www.extra.com.br/Calcados/CalcadosInfantis/Sapatenis/sapatenis-london-teen-hyde-4036-ou-tiptoe-13325371.html?idlojista=31299",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=e876aa6a-367c-459a-9e94-7ea78627ed5f&x=9UJ7zETlawojN0yrmhsr36Hi48BqvcYZ8wqEurDpKBmXRA75kzcAmg19kwlJuFN82YnnyWLGp5qWwvNxILvXn4bkaKRidZ96832e3pCv-SKWuUbAJANjj3CuGr1_y2BylNAdDfMMiGkIH4aSLkU_TR6AFQ5NjwsUL7FC6p4bj8kf_obG7N6PjY9DTrKFwuxgxZUkdb8q0Pnj2BBd3671vRAtpJHM__T6no-7y5Kjnr7_i29U6dd1x9DZaXZZodZYdq0HYsUTCsizxtlABGi-5ErehQZf8zldYVRDICCWA5bMl1UpHLlRseHlawD1dspIy0OEpCCTw037wbHe51OJXffqrLrKMAcPS07zpKNKHyx7Y0O9-_1wwk1ykCWBwHO121evS8QXpPHrqYiHLWxRLnh6VGhTBBQTZfO9NiSG8Iw%3D",
            "product_id": "13325371",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=e876aa6a-367c-459a-9e94-7ea78627ed5f&x=9UJ7zETlawojN0yrmhsr36Hi48BqvcYZ8wqEurDpKBmXRA75kzcAmg19kwlJuFN82YnnyWLGp5qWwvNxILvXn4bkaKRidZ96832e3pCv-SKWuUbAJANjj3CuGr1_y2BylNAdDfMMiGkIH4aSLkU_TR6AFQ5NjwsUL7FC6p4bj8kf_obG7N6PjY9DTrKFwuxgxZUkdb8q0Pnj2BBd3671vRAtpJHM__T6no-7y5Kjnr7_i29U6dd1x9DZaXZZodZYdq0HYsUTCsizxtlABGi-5ErehQZf8zldYVRDICCWA5bMl1UpHLlRseHlawD1dspIy0OEpCCTw037wbHe51OJXffqrLrKMAcPS07zpKNKHyx7Y0O9-_1wwk1ykCWBwHO121evS8QXpPHrqYiHLWxRLnh6VGhTBBQTZfO9NiSG8Iw%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "64.79",
                "priceCurrent": "64.79",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=986058412",
                "name": "SapaTênis London Teen Hyde 4036 Ou Tiptoe",
                "onSale": false,
                "sku": "13325379",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=c2692b93-6de3-4566-840d-625c1015fd80&x=fYYg0QE2VloDQ4HWso2zZZhlxH0cnJmqEpuheWZr8LSBH3wLXNq2QU1I7yK8Wynl-UNEF_Fzx5GuxVYrcOqJTnITa2BKXGtP-1r_ee_PNTUArW_9M7C827ES_C2iOSzEaN9XXcYUQyMJ7vXQ7fYDxUUkO_xI8znmk6fEx5QsbBTK0THfkT5SjpR1pVY7pFONHmWt36P3Pah090B4Hk2Rao7LGpJFy-0_CvxVRqRqJJcNLPfIccq2CzHp2H3WNfn4WMauPBNFIuUmcmTQBdZCgC38xETzhTXM77fpQK2Hd4y6hmULWWFM4dtf3g40H8ldbTh_qr64JHr5PFdBzD9Fk0pNDxFB1QrLB4BOYftNwjo8naXUKE51aECbJmDZf5hXxL4mm0RXeUqT2Eb6mOhgAgr9dvjGwHKc3A3MnxeZRgs%3D",
            "product_id": "13325379",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=c2692b93-6de3-4566-840d-625c1015fd80&x=fYYg0QE2VloDQ4HWso2zZZhlxH0cnJmqEpuheWZr8LSBH3wLXNq2QU1I7yK8Wynl-UNEF_Fzx5GuxVYrcOqJTnITa2BKXGtP-1r_ee_PNTUArW_9M7C827ES_C2iOSzEaN9XXcYUQyMJ7vXQ7fYDxUUkO_xI8znmk6fEx5QsbBTK0THfkT5SjpR1pVY7pFONHmWt36P3Pah090B4Hk2Rao7LGpJFy-0_CvxVRqRqJJcNLPfIccq2CzHp2H3WNfn4WMauPBNFIuUmcmTQBdZCgC38xETzhTXM77fpQK2Hd4y6hmULWWFM4dtf3g40H8ldbTh_qr64JHr5PFdBzD9Fk0pNDxFB1QrLB4BOYftNwjo8naXUKE51aECbJmDZf5hXxL4mm0RXeUqT2Eb6mOhgAgr9dvjGwHKc3A3MnxeZRgs%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "64.79",
                "priceCurrent": "64.79",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=986059277",
                "name": "SapaTênis London Teen Hyde 4036 Ou Tiptoe",
                "onSale": false,
                "sku": "13325386",
                "landingPageUrl": "https://www.extra.com.br/Calcados/CalcadosInfantis/Sapatenis/sapatenis-london-teen-hyde-4036-ou-tiptoe-13325386.html?idlojista=31299",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=7daf7ec3-eb72-4a20-b571-5483ee71225f&x=tvC_eAMbTzWqRVbZlZW4uS1nGQlKm7KpLINUAM7Q1JcmVRONgHmVqkDI8TMira2v11mIpgqvjGRTh-FLpnHlCt5hemrS-xp0OWKR1HqqeZdQ_G-SkLCh7aNw8Me6eCdgZa5jx_j9AS2ZuH1JkYtTyUEo8HMjr_XjSPY7bHwC_s6Wy0bRj_EsSS3EdcsjCH7t97wgRJ3B_MSA9lBpHwNTCwYvPEmZR66FuIUbM0yVaVFYhTv8cQOe7GigNi3VQyW4E55VpAnfVnBlUr-g1KXH_P7kVGCP5xr-nXf4C_WA40Wmd3B4nVSMmNjeIN12RNHc2_yb9bPa-FUvdTFN-Z9J-vei9ipxsyYnSARrJYvrGArnX19tjOpi_-M0LR3JIuBGbsYThGugVCCuUw4RyXslNuQTH4bQZUtqQmhKOt3jM-M%3D",
            "product_id": "13325386",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=7daf7ec3-eb72-4a20-b571-5483ee71225f&x=tvC_eAMbTzWqRVbZlZW4uS1nGQlKm7KpLINUAM7Q1JcmVRONgHmVqkDI8TMira2v11mIpgqvjGRTh-FLpnHlCt5hemrS-xp0OWKR1HqqeZdQ_G-SkLCh7aNw8Me6eCdgZa5jx_j9AS2ZuH1JkYtTyUEo8HMjr_XjSPY7bHwC_s6Wy0bRj_EsSS3EdcsjCH7t97wgRJ3B_MSA9lBpHwNTCwYvPEmZR66FuIUbM0yVaVFYhTv8cQOe7GigNi3VQyW4E55VpAnfVnBlUr-g1KXH_P7kVGCP5xr-nXf4C_WA40Wmd3B4nVSMmNjeIN12RNHc2_yb9bPa-FUvdTFN-Z9J-vei9ipxsyYnSARrJYvrGArnX19tjOpi_-M0LR3JIuBGbsYThGugVCCuUw4RyXslNuQTH4bQZUtqQmhKOt3jM-M%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "66.9",
                "priceCurrent": "66.9",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1364880549",
                "name": "Fone de Ouvido Sem Fio Bluetooth i11 5.0 Touch",
                "onSale": false,
                "sku": "1502003210",
                "landingPageUrl": "https://www.extra.com.br/acessorioseinovacoes/FonesdeOuvido/fone-de-ouvido-sem-fio-bluetooth-i11-50-touch-1502003210.html?idlojista=31612",
                "installments": {
                    "months": "3",
                    "value": "22.3"
                }
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=c32b4132-dc59-4fe1-b2df-f10387ec2b8d&x=lJaLk5QGVsrR4TS7h80Lmyfm0Xsh3_BGqcX85RuQXrEeo-QgcPUfYCHdmsWlbBgFb262KIkGushN0ihz9TK1MGCIlUaHEXbRcePufTm-Ui45hS18O5AtA0KJLHEAxhE_T54VICm_exb0b3C6Ex0i_N0bih8hrA8JCtDJv4PmiCZiaCxsZADibkVfXoN0g8KXatDR7qmqTw5VWsS2JkYp1Jpg8W_r3I2RDQbYGqft7pUwUj-L1XBfc62c4Z0xoIN0wuQCCn1D_YDdJhRVNs_9gcRHg3bx7ChZ5vy9irGxSYxJNzNFCWrIdCeWnr0tIV3Nxe2GeGGkXZYN1wXBRhH6ssjb8MM4dv_lqQCz5FTaPMPX-0f89tSRfRzgxQTkY2-YYT2lyFeDrEZ-oCFQ39PRnIEtNbXsbYApREMKL8dHaEI%3D",
            "product_id": "1502003210",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=c32b4132-dc59-4fe1-b2df-f10387ec2b8d&x=lJaLk5QGVsrR4TS7h80Lmyfm0Xsh3_BGqcX85RuQXrEeo-QgcPUfYCHdmsWlbBgFb262KIkGushN0ihz9TK1MGCIlUaHEXbRcePufTm-Ui45hS18O5AtA0KJLHEAxhE_T54VICm_exb0b3C6Ex0i_N0bih8hrA8JCtDJv4PmiCZiaCxsZADibkVfXoN0g8KXatDR7qmqTw5VWsS2JkYp1Jpg8W_r3I2RDQbYGqft7pUwUj-L1XBfc62c4Z0xoIN0wuQCCn1D_YDdJhRVNs_9gcRHg3bx7ChZ5vy9irGxSYxJNzNFCWrIdCeWnr0tIV3Nxe2GeGGkXZYN1wXBRhH6ssjb8MM4dv_lqQCz5FTaPMPX-0f89tSRfRzgxQTkY2-YYT2lyFeDrEZ-oCFQ39PRnIEtNbXsbYApREMKL8dHaEI%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "64.79",
                "priceCurrent": "64.79",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1152600417",
                "name": "SapaTênis London Teen Hyde 4036 Ou Tiptoe",
                "onSale": false,
                "sku": "13325036",
                "landingPageUrl": "https://www.extra.com.br/Calcados/CalcadosInfantis/Sapatenis/sapatenis-london-teen-hyde-4036-ou-tiptoe-13325371.html?idlojista=31299",
                "installments": {
                    "months": "4",
                    "value": "16.2"
                }
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=3f82a0e7-53f4-495f-810a-69036e803ff8&x=nU31EciRbyDAXBXbWH1-LPkDc0P90M36xYD-vgwPfSF5AUUQpIQ4fI6uHHa2l31_h6bRGJUAEqQ8usArvkPxKyl9wKpsQ2Ueulb-0HfrlTS4IJTWEnoNTInyF8vZtRI0hj4sEq_8Uk14DEZP-NVWb_WsPCvu5y7EoxzTjnRyStIUE5K2K61SWG_1Iyby65cgq8jgrzxt-4y7RHqk0amBOROXgD72yOcLc81Rw7Bi_gu-2TwQlp2IhF6cZKYn7aarzMBleyxLg5_gJkL3L2F-9lxG2s6X3MTJRwW9mCd26Xx8wgIOJJrE7tX-IfjiXy2AYcmYQwsCbQ0pe5nXFHUUkb14uubOuQrvieG6FAWBRMdfKR8A0aTMc1Hm3HMJhQirJcXO0WfuanpBWdhEKTOpKpGKsxfW2ezGyD-Lju6OPFw%3D",
            "product_id": "13325036",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=3f82a0e7-53f4-495f-810a-69036e803ff8&x=nU31EciRbyDAXBXbWH1-LPkDc0P90M36xYD-vgwPfSF5AUUQpIQ4fI6uHHa2l31_h6bRGJUAEqQ8usArvkPxKyl9wKpsQ2Ueulb-0HfrlTS4IJTWEnoNTInyF8vZtRI0hj4sEq_8Uk14DEZP-NVWb_WsPCvu5y7EoxzTjnRyStIUE5K2K61SWG_1Iyby65cgq8jgrzxt-4y7RHqk0amBOROXgD72yOcLc81Rw7Bi_gu-2TwQlp2IhF6cZKYn7aarzMBleyxLg5_gJkL3L2F-9lxG2s6X3MTJRwW9mCd26Xx8wgIOJJrE7tX-IfjiXy2AYcmYQwsCbQ0pe5nXFHUUkb14uubOuQrvieG6FAWBRMdfKR8A0aTMc1Hm3HMJhQirJcXO0WfuanpBWdhEKTOpKpGKsxfW2ezGyD-Lju6OPFw%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "39.5",
                "priceCurrent": "36.08",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1038877391",
                "name": "Sagmo e Os Cristais Mágicos",
                "onSale": true,
                "sku": "6753676",
                "landingPageUrl": "https://www.extra.com.br/livros/LiteraturaInfantojuvenil/Juvenil/sagmo-e-os-cristais-magicos-6753676.html?idlojista=31863",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=e98f91cd-1f5f-4964-8b81-25dc46391359&x=-aHmSNmD_Zs__idirqQOeWvSnVVsskJfqd5nFslDaxEsbTsKdTXTLP4ZiupWibAMTZ4HVBq6M26hpfzfUW2sXB5OAvnh-7G3skW7l8bdsUFuyj8Geb437wgt7NXb6BVglnOdinLR0AKtMR6KKifgdsVIclIBWShEt8jBqCidskMMCjQ--i6q1e66UsUBbaZ6zHgBCg2mUKYh1yoPzCcdAVLbzNnKKiV-13uox0_1oL_lkOCiGGl3mRVAkjJ_3oLrKUSAWVFapzzrf0jlK1oW_IR3efYu1ziMSYDfmV2CrrEL0UQy6xIGXP-alWVe9FltIB6en_6p69PEDCOUVpeq__zUz4iEHsa7OU6gxsCLO2R9xNZbVs8keqdd9GXT1u_Vkqsjw8yc_R2qH9iAqqaQRHXEGfas66z_jGetDpM1Rf0%3D",
            "product_id": "6753676",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=e98f91cd-1f5f-4964-8b81-25dc46391359&x=-aHmSNmD_Zs__idirqQOeWvSnVVsskJfqd5nFslDaxEsbTsKdTXTLP4ZiupWibAMTZ4HVBq6M26hpfzfUW2sXB5OAvnh-7G3skW7l8bdsUFuyj8Geb437wgt7NXb6BVglnOdinLR0AKtMR6KKifgdsVIclIBWShEt8jBqCidskMMCjQ--i6q1e66UsUBbaZ6zHgBCg2mUKYh1yoPzCcdAVLbzNnKKiV-13uox0_1oL_lkOCiGGl3mRVAkjJ_3oLrKUSAWVFapzzrf0jlK1oW_IR3efYu1ziMSYDfmV2CrrEL0UQy6xIGXP-alWVe9FltIB6en_6p69PEDCOUVpeq__zUz4iEHsa7OU6gxsCLO2R9xNZbVs8keqdd9GXT1u_Vkqsjw8yc_R2qH9iAqqaQRHXEGfas66z_jGetDpM1Rf0%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "64.79",
                "priceCurrent": "64.79",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1152600445",
                "name": "SapaTênis London Teen Hyde 4036 Ou Tiptoe",
                "onSale": false,
                "sku": "13325370",
                "landingPageUrl": "https://www.extra.com.br/Calcados/CalcadosInfantis/Sapatenis/sapatenis-london-teen-hyde-4036-ou-tiptoe-13325371.html?idlojista=31299",
                "installments": {
                    "months": "4",
                    "value": "16.19"
                }
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=637dc994-ee98-4c66-bf2e-f483f0ae1a82&x=I7D9hbS7WUAwzfKZVGcjBgH0jBHWY7j7elnx2fGVYq6RyANly_57LpkWJtO89H6hjOF6O_CNFRiHodeM3jrBgnopggP7YghXg5IJ3EPTEy20mhTwn0vuc11qqzdHPJ4C3yDGgvXGlfaMt6vrbwR5-IlaIB-cYvK7-YKlhTH4ZmIakFkLojfuN8Og2htrVjDA3xiDRYOcKxDHli_L4i3cbylwYiD2bLA0Ce8fklfJAOhjSMsRYjZCFH90_qBiK5-7xbYWQcCMm0NPAp0eaEXjNTOhlnE4bDzxDp88HgUay_raEctv7HGFmSZiCaFkOVqBrekTK4zpLga57Kw71m4Sb8sypFEiHAJl-DYn-L6IzLTJ76gfRsB2Ynlvnm-OyHJP0HL_pfgedD_gSHkVsw8NwcGRikdFSeNUOVdxMxLgnho%3D",
            "product_id": "13325370",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=637dc994-ee98-4c66-bf2e-f483f0ae1a82&x=I7D9hbS7WUAwzfKZVGcjBgH0jBHWY7j7elnx2fGVYq6RyANly_57LpkWJtO89H6hjOF6O_CNFRiHodeM3jrBgnopggP7YghXg5IJ3EPTEy20mhTwn0vuc11qqzdHPJ4C3yDGgvXGlfaMt6vrbwR5-IlaIB-cYvK7-YKlhTH4ZmIakFkLojfuN8Og2htrVjDA3xiDRYOcKxDHli_L4i3cbylwYiD2bLA0Ce8fklfJAOhjSMsRYjZCFH90_qBiK5-7xbYWQcCMm0NPAp0eaEXjNTOhlnE4bDzxDp88HgUay_raEctv7HGFmSZiCaFkOVqBrekTK4zpLga57Kw71m4Sb8sypFEiHAJl-DYn-L6IzLTJ76gfRsB2Ynlvnm-OyHJP0HL_pfgedD_gSHkVsw8NwcGRikdFSeNUOVdxMxLgnho%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "21.53",
                "priceCurrent": "21.53",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1229009171",
                "name": "Segunda Vida, A: Um Guia Para A Mulher Madura",
                "onSale": false,
                "sku": "1501323705",
                "landingPageUrl": "https://www.extra.com.br/livros/AutoajudaRelacionamentos/Autoajuda/segunda-vida-a-um-guia-para-a-mulher-madura-1501323705.html?idlojista=19313",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=3c417dbe-0c82-49da-9505-e46022ddfe23&x=ch5IthH_7z5izdJkhl-K7RzeHi-F1rm95i10pXJw4EI2bQb1VAXeE4LTX2NsJd2vb6eVfaGTtq3fx7hx0QRqXCJC5XmzzD8ACNqzQxcqCX7GS6mMd-dhvhxeSogi1OfjB-ii1YuFukT2AXGM-Njia-P5GvhjttdwGgw5Y7wMP1yMU7p43c0GQtRWl59wdy8jXhz3XA6vxlbycTovsCHb1Eun7Q3HK3nrYraQ8-5P6U38ljrdQ0vvAcFYxnl1PvAe45lwmwDWp2El_s6Gf0O9O35_W_7NFxcesxpDVL7xY6O9mw_M9KVchvbtASDuTJJpZKtkdUbQxtypWsbaNCo4qVdjEYnKBSkOaHf9E-7xRu40VYrCRS_ba90l8DCKb6S5ZYDBxw4mAiu-GwONR7xV5bL5gYdqimDBdPumqMz49z4%3D",
            "product_id": "1501323705",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=3c417dbe-0c82-49da-9505-e46022ddfe23&x=ch5IthH_7z5izdJkhl-K7RzeHi-F1rm95i10pXJw4EI2bQb1VAXeE4LTX2NsJd2vb6eVfaGTtq3fx7hx0QRqXCJC5XmzzD8ACNqzQxcqCX7GS6mMd-dhvhxeSogi1OfjB-ii1YuFukT2AXGM-Njia-P5GvhjttdwGgw5Y7wMP1yMU7p43c0GQtRWl59wdy8jXhz3XA6vxlbycTovsCHb1Eun7Q3HK3nrYraQ8-5P6U38ljrdQ0vvAcFYxnl1PvAe45lwmwDWp2El_s6Gf0O9O35_W_7NFxcesxpDVL7xY6O9mw_M9KVchvbtASDuTJJpZKtkdUbQxtypWsbaNCo4qVdjEYnKBSkOaHf9E-7xRu40VYrCRS_ba90l8DCKb6S5ZYDBxw4mAiu-GwONR7xV5bL5gYdqimDBdPumqMz49z4%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "699.0",
                "priceCurrent": "699.0",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=948540586",
                "name": "Raquete Volkl Organix Super G 7 L3",
                "onSale": false,
                "sku": "8166759",
                "landingPageUrl": "https://www.extra.com.br/EsporteLazer/EsportesdeRaquete/raquetesparatenis/raquete-volkl-organix-super-g-7-l3-8166759.html?idlojista=11761",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=c42fe578-93f8-4eeb-b079-ee4bfa5eda82&x=t7KaiA4AOTM0ZSdpihRV_zzEWRF75Ne0dZLcxVXQje99NIX8iHVRO_DFlco9_6eBDHEm5ZUisNn0eMT9s_j4OYxrBvHl8lzse5b7Uo7e7xvxlrjUbksB7tgkz-FaYzrh8MRAjylmj3jphHAzfoq896dze2T_Be3AyE6otqsbDttCvPLP8fyHhE90ie30ADBlbo4OXnzuwDBPLFXJOfBClsEhwgNm0FoiFJ56jeymtC3OfrruHEfd0n55GeRFPVe9Gv_kmFKU3HIpH_csXmYx9hSdt25MydNu6bJ5_tW-sQzvWZmaQRSQfbEbk8S5omKvJRsZO-eBCa8RNvP0-tCG7WG12T-6UIMpNXs5k9VHdu9PfO_FCtqPykAXlHgbU5BHai_lgG8iNjHu6fldViASCB6ENy9bAJDPn9XVymYJvxA%3D",
            "product_id": "8166759",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=c42fe578-93f8-4eeb-b079-ee4bfa5eda82&x=t7KaiA4AOTM0ZSdpihRV_zzEWRF75Ne0dZLcxVXQje99NIX8iHVRO_DFlco9_6eBDHEm5ZUisNn0eMT9s_j4OYxrBvHl8lzse5b7Uo7e7xvxlrjUbksB7tgkz-FaYzrh8MRAjylmj3jphHAzfoq896dze2T_Be3AyE6otqsbDttCvPLP8fyHhE90ie30ADBlbo4OXnzuwDBPLFXJOfBClsEhwgNm0FoiFJ56jeymtC3OfrruHEfd0n55GeRFPVe9Gv_kmFKU3HIpH_csXmYx9hSdt25MydNu6bJ5_tW-sQzvWZmaQRSQfbEbk8S5omKvJRsZO-eBCa8RNvP0-tCG7WG12T-6UIMpNXs5k9VHdu9PfO_FCtqPykAXlHgbU5BHai_lgG8iNjHu6fldViASCB6ENy9bAJDPn9XVymYJvxA%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "440.99",
                "priceCurrent": "440.99",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1554949127",
                "name": "Jogo Mídia Física Lillard NBA 2K21 Lacrado e Novo - Xone",
                "onSale": false,
                "sku": "1505482945",
                "landingPageUrl": "https://www.extra.com.br/Games/XboxOne/JogosXboxOne/jogo-midia-fisica-lillard-nba-2k21-lacrado-e-novo-xone-1505482945.html?idlojista=36271",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=4284a26e-dc2e-493a-975e-02dfed4fbbad&x=7MMxuFa4-AAEpB3W7glM64fKBbiIUb13Vqsczdjpkbl6nJAWiEBRx4tZ-5dscUkn_mrCpsxREQJiyPI6tGARUN55nGphXX-YYeo1vpG0Hy_NpiMu7E_OW8Yk7wW63015v9MWzMA3Gco8GurdGVgRtLepYc9dC4xvExC8RLQlIP_R0rq43h2ZbI3ohKbiTXwWmPQ3S_exogpAKTZAHbjlo_2U3y3rnwM6dT7-TCV3VLflpoM1nz_79CG-4NNpzvtJp6cBLLaJ-pkJnxvlq3LqajNukrem_wPlVQ2fK9q3t_gmfGztbD0hsfB6ObhRBUFnBmDzqYttDSc_jPGV8uK8ghsZr0GLY25osgrfmvCtcBPt1V8A-4ZByY5H6fksXpTsRtGkZeLlpMau_U00NPyeIg16Yd2YszPDUNUkw5CvJuQ%3D",
            "product_id": "1505482945",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=4284a26e-dc2e-493a-975e-02dfed4fbbad&x=7MMxuFa4-AAEpB3W7glM64fKBbiIUb13Vqsczdjpkbl6nJAWiEBRx4tZ-5dscUkn_mrCpsxREQJiyPI6tGARUN55nGphXX-YYeo1vpG0Hy_NpiMu7E_OW8Yk7wW63015v9MWzMA3Gco8GurdGVgRtLepYc9dC4xvExC8RLQlIP_R0rq43h2ZbI3ohKbiTXwWmPQ3S_exogpAKTZAHbjlo_2U3y3rnwM6dT7-TCV3VLflpoM1nz_79CG-4NNpzvtJp6cBLLaJ-pkJnxvlq3LqajNukrem_wPlVQ2fK9q3t_gmfGztbD0hsfB6ObhRBUFnBmDzqYttDSc_jPGV8uK8ghsZr0GLY25osgrfmvCtcBPt1V8A-4ZByY5H6fksXpTsRtGkZeLlpMau_U00NPyeIg16Yd2YszPDUNUkw5CvJuQ%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "199.9",
                "priceCurrent": "199.9",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1585894547",
                "name": "Jogo Midia Fisica Wwe 2k20 para Ps4",
                "onSale": false,
                "sku": "1505178435",
                "landingPageUrl": "https://www.extra.com.br/Games/Playstation4/JogosPlaystation4/jogo-midia-fisica-wwe-2k20-para-ps4-1505178435.html?idlojista=19111",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=d4f1f262-166f-4b40-aaff-de51f7256ca5&x=NA219hz2UJGN2En6hfNSm_cGvnk0TcSrmGhFhfMBtoc1fph-azj028SNECuFHpdGEgn2If6ChvD4O7oeNeXzG3tJddFK5-hP1r7dK9hfO648lKqQaMlbxkCAyBkV6XQNbhJ2YPFQJ3BMS2KT5DR5s_QQw3WK-3NpTlVdRsM5Qlrziw5PTeVnM4YG1x10EMGJ9YJ1_PXKjLXUtyUm8cHjreQOAiMLIragnCFFaU5_q989R7mOhtmHs-7Qks2fiSmNWGBIg6iH2OXD7Fh5BMaNqgBCXbR1U11K5ZEOMWGpBd92YsxeO8DbZxpmbDdBviYyARXF2O8Zw_tUD-UO2Tu6pQTLkR1RPGw9wBdUcgKJCqK_8-IVFRSGFQg7pwlvKdDvdNBhBcrf1En5Xi7RE0JEumhTcmqAoOdBf_O2Sie6BiQ%3D",
            "product_id": "1505178435",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=d4f1f262-166f-4b40-aaff-de51f7256ca5&x=NA219hz2UJGN2En6hfNSm_cGvnk0TcSrmGhFhfMBtoc1fph-azj028SNECuFHpdGEgn2If6ChvD4O7oeNeXzG3tJddFK5-hP1r7dK9hfO648lKqQaMlbxkCAyBkV6XQNbhJ2YPFQJ3BMS2KT5DR5s_QQw3WK-3NpTlVdRsM5Qlrziw5PTeVnM4YG1x10EMGJ9YJ1_PXKjLXUtyUm8cHjreQOAiMLIragnCFFaU5_q989R7mOhtmHs-7Qks2fiSmNWGBIg6iH2OXD7Fh5BMaNqgBCXbR1U11K5ZEOMWGpBd92YsxeO8DbZxpmbDdBviYyARXF2O8Zw_tUD-UO2Tu6pQTLkR1RPGw9wBdUcgKJCqK_8-IVFRSGFQg7pwlvKdDvdNBhBcrf1En5Xi7RE0JEumhTcmqAoOdBf_O2Sie6BiQ%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "89.9",
                "priceCurrent": "89.9",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1432323031",
                "name": "Kit 6 Desodorantes Dove Men+Care Antitranspirante Aerossol Clean Comfort 150ml",
                "onSale": false,
                "sku": "1505289067",
                "landingPageUrl": "https://www.extra.com.br/perfumaria/CorpoBanho/Desodorante/kit-6-desodorantes-dove-men-care-antitranspirante-aerossol-clean-comfort-150ml-1505289067.html?idlojista=30797",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=129e3f25-ea47-4633-830b-19f52c977b4d&x=UwaIlDpNMo78rtC4n7SuNGFsmO2U76kC7TRK6c3LJ4B0WDbMXUVAi-f_UXOwsV4BJ4BqJcS6DzkGDEoE9s6Tc1jukWRp1hWO5r8Mi-dMmjp6oZUgXRtPJvOsnYmWH8wRLaROOhnq9Z5Qx7bZUI54368rYDh-U33DBHJ_Jv_rSghGoDE2xvyFsPKClGKzkjsV16Aa5Z2N7KHrrripAiU81k64MiWIJJpvGm3F_1Z0hJTqdkJdgBoRwKNMLOq4sCxpFBY8ojdUiwhtCdQ0FibVuTwd-eKmKpxzhdZK08XkWjDAkXY_IwHI9FrMQ-afCT0Ox1loaL1dvv43BK3bI63NF6OTzmbh3-HhuxFUnwp_CUECnxzx68-FDlASyFsbMYpnYql03XvqqRFVLteozTlwVeLRq305D2H0JZQGz9bl4iA%3D",
            "product_id": "1505289067",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=129e3f25-ea47-4633-830b-19f52c977b4d&x=UwaIlDpNMo78rtC4n7SuNGFsmO2U76kC7TRK6c3LJ4B0WDbMXUVAi-f_UXOwsV4BJ4BqJcS6DzkGDEoE9s6Tc1jukWRp1hWO5r8Mi-dMmjp6oZUgXRtPJvOsnYmWH8wRLaROOhnq9Z5Qx7bZUI54368rYDh-U33DBHJ_Jv_rSghGoDE2xvyFsPKClGKzkjsV16Aa5Z2N7KHrrripAiU81k64MiWIJJpvGm3F_1Z0hJTqdkJdgBoRwKNMLOq4sCxpFBY8ojdUiwhtCdQ0FibVuTwd-eKmKpxzhdZK08XkWjDAkXY_IwHI9FrMQ-afCT0Ox1loaL1dvv43BK3bI63NF6OTzmbh3-HhuxFUnwp_CUECnxzx68-FDlASyFsbMYpnYql03XvqqRFVLteozTlwVeLRq305D2H0JZQGz9bl4iA%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "19.33",
                "priceCurrent": "19.33",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1215863564",
                "name": "Desodorante - Aerosol Dove Men Care Cuidado Total",
                "onSale": false,
                "sku": "14080082",
                "landingPageUrl": "https://www.extra.com.br/perfumaria/CorpoBanho/Desodorante/desodorante-aerosol-dove-men-care-cuidado-total-14080082.html?idlojista=15010",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=6c8dd41b-2dd9-43aa-9a2b-5a8b1ee6bafd&x=ldbF-dVqC1qhDLZuUxo2POdQRNfidCpdld1uknAflFm6P2hfH1siikMdmRnEf5ctTa39qdxqxCbSHtj3SWTZe1bVDzdj2L0Y1NdwJuLUBThO4KqOATqlfhHCznipBGprKNdpf4-4QOgMWZGZ92Cupu6DvI2h_DcbP9wy6isd5ZLMDyd3aHkWGUzHa48cvRP-yZoVykoG_S1bt1rkqUPWwJ1NEMJ3KnX_X8xvSR3YhNjI3wU7u4gWIQrzo1Zvgaw1xgZcJvubv2LQyjUyFbqUt11Q4irSC9C30j5JgpNVxnd-Dfzk8o6uMwwcSXByGySTf2OsbZpWJWZg1NdaV5CsPf6FRTMXcFwkgzvffkU5JEcfByPGhtgJU1OVWxJrzRQ-3UFNfH2Q0CtO7d2AEJa0HXzpmzcAkdhPOLxFuIcclls%3D",
            "product_id": "14080082",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=6c8dd41b-2dd9-43aa-9a2b-5a8b1ee6bafd&x=ldbF-dVqC1qhDLZuUxo2POdQRNfidCpdld1uknAflFm6P2hfH1siikMdmRnEf5ctTa39qdxqxCbSHtj3SWTZe1bVDzdj2L0Y1NdwJuLUBThO4KqOATqlfhHCznipBGprKNdpf4-4QOgMWZGZ92Cupu6DvI2h_DcbP9wy6isd5ZLMDyd3aHkWGUzHa48cvRP-yZoVykoG_S1bt1rkqUPWwJ1NEMJ3KnX_X8xvSR3YhNjI3wU7u4gWIQrzo1Zvgaw1xgZcJvubv2LQyjUyFbqUt11Q4irSC9C30j5JgpNVxnd-Dfzk8o6uMwwcSXByGySTf2OsbZpWJWZg1NdaV5CsPf6FRTMXcFwkgzvffkU5JEcfByPGhtgJU1OVWxJrzRQ-3UFNfH2Q0CtO7d2AEJa0HXzpmzcAkdhPOLxFuIcclls%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "31.9",
                "priceCurrent": "31.9",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1397405907",
                "name": "Dove Ritual Detox Condicionador 400ml",
                "onSale": false,
                "sku": "1504713728",
                "landingPageUrl": "https://www.extra.com.br/perfumaria/produtosparacabelos/ShampoosparaCabelos/dove-ritual-detox-condicionador-400ml-1504713728.html?idlojista=33244",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=98b95c80-4f40-4208-bbd9-8385b05e4581&x=leK8ytD_0o4-d1FaTa_Ec8J8MP4ZjVog0HeYZFD0WOq4pQd1MaDkJ9i_E8AuKRKjSYcOlyMSsPA-svjEB-ipDVgZ3AIjNpl-TwNvRs34974ujUpjDUwXO8ucwWaNtF32L2v8Fqkh6YVJX3Uef8Ic8xn9evmM9oYUjP2-WpPFVdeHaxAH-ntzvjXD6seaGpWTkL4Yknae-T2CnmplvGVAdHMMMGkrP6C0aXlCxbMhFF83BNrXbCfh0vIUEmxqgiKAsAr1XlTvHKU6ZSu94RfS2H4o0MlyDYk-grfpEKUPCHKTNlAp6WcKhCa7cJdlJ5Zd2cfBlydmJIeFhAvg7EhUxnROfkImc3NF8zrDNxJMTUlkqyXVOFy8z71Ole6XdvlYkEkxHTQYdza15g2Ho_OrouZOi0jXm7irz_WqFDP9qj8%3D",
            "product_id": "1504713728",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=98b95c80-4f40-4208-bbd9-8385b05e4581&x=leK8ytD_0o4-d1FaTa_Ec8J8MP4ZjVog0HeYZFD0WOq4pQd1MaDkJ9i_E8AuKRKjSYcOlyMSsPA-svjEB-ipDVgZ3AIjNpl-TwNvRs34974ujUpjDUwXO8ucwWaNtF32L2v8Fqkh6YVJX3Uef8Ic8xn9evmM9oYUjP2-WpPFVdeHaxAH-ntzvjXD6seaGpWTkL4Yknae-T2CnmplvGVAdHMMMGkrP6C0aXlCxbMhFF83BNrXbCfh0vIUEmxqgiKAsAr1XlTvHKU6ZSu94RfS2H4o0MlyDYk-grfpEKUPCHKTNlAp6WcKhCa7cJdlJ5Zd2cfBlydmJIeFhAvg7EhUxnROfkImc3NF8zrDNxJMTUlkqyXVOFy8z71Ole6XdvlYkEkxHTQYdza15g2Ho_OrouZOi0jXm7irz_WqFDP9qj8%3D&redirect="
        },
        {
            "product": {
                "rating": null,
                "priceList": "61.49",
                "priceCurrent": "61.49",
                "priceCurrency": "BRL",
                "reviews": null,
                "imageSmall": "https://www.extra-imagens.com.br/Control/ArquivoExibir.aspx?IdArquivo=1398344182",
                "name": "Kit 3 Desodorante Dove Aerosol 150Ml Men+Care Invisible",
                "onSale": false,
                "sku": "1504726176",
                "landingPageUrl": "https://www.extra.com.br/perfumaria/CorpoBanho/Desodorante/kit-3-desodorante-dove-aerosol-150ml-men-care-invisible-1504726176.html?idlojista=12231",
            },
            "impression_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/impression?id=dd8d46b4-25af-4476-b287-c695ab6197f0&x=V_7IOPyANIF_1JK7qKrkWEc9u4XpGr5KiKJEA2GVChWg3srPatii-epYBdhW-pRSuWZro2hpH6xW2ossZkcMNg9jEXqB6X8udmXBfFioLHm0izTprRBfQ6I9sb6HF2fpcLXJaGPDYJGZ5krnXdgg1xtNAarY-jYbuCytiIswACc9ywIN5kWqhaaaT1ScTTxMW66MebE8vqyabS_-L10_WUMNcv1y8C0WGUEnXBbQEnuOsSesn7Ni7hHGmWaJC4vxJmomXJstrK0uFAdtVNYGq7pZfTIKFU4zD1rSuXlDkE7eiOleIZNCn5m0kZMNVFmHCxxXAwIDK_3N3mS4z6pS7e1iWAZh-OAla5Qd0qns8ViHmnZM_b8W5j4jAkM-vC6ZZIfbzazxbRfEVK6HaKoC8yuPpQ2vjVr-F1wfdTmeOGo%3D",
            "product_id": "1504726176",
            "sponsored": true,
            "click_tracker": "https://viavarejo-sandbox.ms.tagdelivery.com/click?id=dd8d46b4-25af-4476-b287-c695ab6197f0&x=V_7IOPyANIF_1JK7qKrkWEc9u4XpGr5KiKJEA2GVChWg3srPatii-epYBdhW-pRSuWZro2hpH6xW2ossZkcMNg9jEXqB6X8udmXBfFioLHm0izTprRBfQ6I9sb6HF2fpcLXJaGPDYJGZ5krnXdgg1xtNAarY-jYbuCytiIswACc9ywIN5kWqhaaaT1ScTTxMW66MebE8vqyabS_-L10_WUMNcv1y8C0WGUEnXBbQEnuOsSesn7Ni7hHGmWaJC4vxJmomXJstrK0uFAdtVNYGq7pZfTIKFU4zD1rSuXlDkE7eiOleIZNCn5m0kZMNVFmHCxxXAwIDK_3N3mS4z6pS7e1iWAZh-OAla5Qd0qns8ViHmnZM_b8W5j4jAkM-vC6ZZIfbzazxbRfEVK6HaKoC8yuPpQ2vjVr-F1wfdTmeOGo%3D&redirect="
        }
    ]

    _pub.sizeMap = {
        'Homepage PLA': {
            title: 'Produtos Patrocinados',
            slot: 16005,
            count: 16,
            count_fill: 16
        }
    };

    _pub._render = function () {
        let pageType = _pub.evaluatePage();
        let targets = _pub.evaluateTargeting(pageType);
        _pub.apiRequest(targets, pageType)
    };

    _pub.evaluatePage = function () {
        let pageInfo = window.dataLayer.filter(dl => dl.pagina).pop();
        let page = pageInfo && pageInfo.pagina.templatePagina;
        if (page === 'home') {
            return 'Homepage PLA'
        }
    };

    _pub.evaluateTargeting = function (pageType) {
        if (pageType === 'Homepage PLA') {
            return {category: ['Homepage']}
        }
    };

    _pub.apiRequest = function (targets, pageType) {
        if (pageType === undefined) return;

        let params = {
            slot: _pub.sizeMap[pageType].slot,
            targets: targets,
            count: _pub.sizeMap[pageType].count,
            count_fill: _pub.sizeMap[pageType].count_fill
        };

        let title = _pub.sizeMap[pageType].title;

        // ignore actual request
        // return _tdc.request(params, function (response){
        //     if (pageType === 'Homepage PLA') {
        //         _pub.renderCarousel(response)
        //     }
        // });

        // mock response with product data only
        _pub.renderCarousel(prods, params.slot, title);
    };

    _pub.renderCarousel = function(response, slot, title) {
        // var products = [];
        //
        // for (let i = 0; i < response.length; i++) {
        //     products.push(response[i]['product'])
        // }
        console.log(response);
        console.log(slot);
        console.log(title);

        const templateValues = {
            title: title,
            products: response,
        };

        const template = Handlebars.compile($('#recommendations-piq-template').html());
        $('#recommendations-piq-' + slot).html(template(templateValues));

        // call Slick to activate carousel functionality (delayed)
        setTimeout(function() {
            // handle impression trackers
            const checkAndRenderImpressionTrackers = function(slick, currentSlide, products) {
                var slidesShowing = (function() {
                    var windowWidth = window.innerWidth;
                    var breakpoints = Object.assign([], slick.breakpoints).sort((a, b) => b - a);
                    var breakpointSettings = slick.breakpointSettings;

                    var slidesToShow = slick.originalSettings.slidesToShow;
                    breakpoints.forEach(b => {
                        if (windowWidth < b) {
                            slidesToShow = breakpointSettings[b].slidesToShow;
                        }
                    });

                    return slidesToShow;
                })();

                var firstIndex = currentSlide;
                var lastIndex = currentSlide + slidesShowing;

                for (var i = firstIndex; i < lastIndex; i++) {
                    var product = products[i];
                    if (product) {
                        var productId = product.product_id;
                        var productImpressionTracker = product.impression_tracker;

                        var carouselItem = $('#recommendations-piq-' + slot + ' .slick-active.recommendation-carousel-item[data-product-id="' + productId + '"]');
                        var carouselItemDoesntHaveImpressionTrackerYet = !carouselItem.has('.recommendation-carousel-item-impression-tracker').length;

                        if (carouselItemDoesntHaveImpressionTrackerYet) {
                            carouselItem.append('<img class="recommendation-carousel-item-impression-tracker" alt="" src="' + productImpressionTracker + '" />');
                            console.log('rendered impression tracker for products['+ i +']');
                        }
                    }
                }
            };

            // register events for impression trackers
            $('#recommendations-piq-' + slot + ' .recommendation-carousel').on('init', function(event, slick) {
                checkAndRenderImpressionTrackers(slick, 0, response);
            });
            $('#recommendations-piq-' + slot + ' .recommendation-carousel').on('afterChange', function(event, slick, currentSlide) {
                checkAndRenderImpressionTrackers(slick, currentSlide, response);
            });

            // activate carousel
            $('#recommendations-piq-' + slot + ' .recommendation-carousel').slick({
                slidesToShow: 4,
                slidesToScroll: 4,
                infinite: true,
                dots: false,
                arrows: true,
                cssEase: 'linear',
                speed: 300,
                responsive: [
                    {
                        breakpoint: 1100,
                        settings: {
                            slidesToShow: 3,
                            slidesToScroll: 3,
                            infinite: true,
                            dots: false,
                            arrows: true,
                        }
                    },
                    {
                        breakpoint: 800,
                        settings: {
                            slidesToShow: 2,
                            slidesToScroll: 2,
                            infinite: true,
                            dots: false,
                            arrows: true,
                        }
                    },
                    {
                        breakpoint: 520,
                        settings: {
                            slidesToShow: 1,
                            slidesToScroll: 1,
                            infinite: true,
                            dots: false,
                            arrows: true,
                        }
                    },
                ],
            });
        }, 0);
    };

    return _pub;
})();

  _tdc.Request = (function () {
  return function (inputs, callback) {
    this.id = _tdc.Util.generateUuid();
    this.inputs = null;
    this.parameters = {
      targets: null,
      slot: null,
      deferred: null,
      batch: null,
      pos: null,
      format: null,
      width: null,
      height: null,
      callback: null,
      passthru: null,
      template: null,
      count: null,
      count_fill: null,
      attributes: null,
      url: null,
      query: null
    };
    this.callback = callback;
    this.timeoutRef = {};
    this.retryAfter = _tdc.RETRY;
    this.timeLeft = _tdc.TIMEOUT;
    this.numTries = 0;
    this.locked = false;
    this.active = true;
    this.map = false;

    this.baseUrl = _tdc.PROTOCOL + _tdc.HOST + '/request?';
    this.url = null;
    this.requestedAt = +new Date();
    this.sentAt = null;
    this.receivedAt = null;
    this.returnedAt = null;
    this.renderedAt = null;

    _tdc.log('received request', this.id, this.inputs);

    /**
     * Sets request parameters
     * @param {obj} inputs
     */
    this.applyInputs = function (inputs) {
      if (typeof inputs == 'object') {
        this.inputs = _tdc.Util.mergeObjects(inputs)

        for (let  k in inputs) {
          if (this.parameters.hasOwnProperty(k)) {
            this.parameters[k] = inputs[k];
          }
        }
      } else {
        this.inputs = inputs
      }
    };

    this.applyInputs(inputs);

    /**
     * Modifies request params
     */
    this.modifyForPub = function () {
      if (typeof _tdc.Pub.modifyRequest != 'function') return;

      let  copy = _tdc.Pub.modifyRequest(this);

      if (typeof copy != 'object') return;

      for (let  k in copy) {
        if (k !== 'inputs') {
          this[k] = copy[k];
        }
      }
    };

    /**
     * Generates callback key
     * @return {string}
     */
    this.getCallbackKey = function () {
      return '_' + this.id.replace(/-/g, '_');
    };

    /**
     * Sets callback value
     */
    this.registerCallback = function () {
      let  key = this.getCallbackKey();
      if (this.parameters.callback === null) {
        this.parameters.callback = [_tdc.GLOBAL_NAME, 'callbacks', key].join(
            '.'
        );
      }
      let  id = this.id;
      _tdc.callbacks[key] = function (response) {
        _tdc.requestMap[id].processResponse(response);
      };
    };

    /**
     * Sets the retry time left
     * @param {int} time
     */
    this.setRetryTime = function (time) {
      this.timeLeft = time || _tdc.TIMEOUT;
      this.retryAfter = Math.min(this.timeLeft || this.retryAfter, _tdc.RETRY);
    };

    /**
     * Request retry
     */
    this.setRetry = function () {
      let  that = this;

      this.timeoutRef = setTimeout(function () {
        //no time left, exit
        if (that.timeLeft <= 0) {
          that.cancel();
          return;
        }

        // cancel request
        if (_tdc.isLoaded()) {
          _tdc.log('resending after', that.id, +new Date() - that.requestedAt);
          that.numTries++;
          that.cancel();
          // that.send();
        } else {
          _tdc.log('Pseudo timeout during loading', that.id, that.url);
          that.setRetry();
        }
      }, that.retryAfter || _tdc.RETRY); //case where context is lost

      // decrement remaining time on request
      if (_tdc.isLoaded()) {
        this.retryAfter = Math.min(this.retryAfter, this.timeLeft);
        this.timeLeft = this.timeLeft - this.retryAfter;
      }
    };

    /**
     * clears timeout
     */
    this.noRetry = function () {
      clearTimeout(this.timeoutRef);
    };

    /**
     * Builds adserver request URL
     */
    this.setUrl = function () {
      if (typeof _tdc.Pub.buildUrl == 'function') {
        this.url = _tdc.Pub.buildUrl(this);
        return;
      }

      // this is where the callback is called -> through query parameter
      if (this.map && !this.inputs.hasOwnProperty(_tdc.MAP_KEY)) {
        if (typeof _tdc.Pub.getMapRequest == 'function') {
          this.url = _tdc.Pub.getMapRequest(this);
        } else {
          this.url =
              'https://tools.tagdelivery.com/requests/map?request=' +
              encodeURIComponent(
                  JSON.stringify({id: this.id, parameters: this.parameters})
              );
        }
        return;
      }

      this.url = this.baseUrl + _tdc.Util.objectToQueryString(this.parameters);
    };

    /**
     * Sends opportunity request
     */
    this.send = function () {
      if (!this.locked) {
        this.modifyForPub();
        this.setRetryTime();
        this.locked = true;
      }

      if (!this.active) {
        return;
      }

      this.setRetry();
      this.registerCallback();
      this.setUrl();

      this.sentAt = +new Date();

      let  self = this;
      let  tag = _tdc.Util.attachScript(
          this.url,
          Function.prototype.bind
              ? this.cancel.bind(this)
              : function () {
                self.cancel();
              }
      );

      tag.parentNode.removeChild(tag);

      _tdc.log(
          'url called after',
          this.id,
          this.sentAt - this.requestedAt,
          this.numTries,
          this.url
      );
    };

    /**
     * 
     * @param {array} response - adserver responses
     */
    this.processResponse = function (response) {
      if (response.length === 0 || !response) {
        this.returnedAt = +new Date();
        this.renderedAt = +new Date();

        _tdc.log(
            'empty/null/undefined response',
            this.id,
            this.returnedAt - this.returnedAt,
            response
        );
      } else {
        this.noRetry();
        this.receivedAt = +new Date();

        if (typeof _tdc.Pub.modifyResponse == 'function') {
          response = _tdc.Pub.modifyResponse(this, response);
        }
      }
      this.respond(response);
    };

    /**
     * i.e: attachScript error (ad-blocker; browser)
     */
    this.cancel = function () {
      this.active = false;
      clearTimeout(this.timeoutRef);
      _tdc.log('cancelled request', this.id);
      let  defaultResponse = _tdc.Pub.prepareDefaultResponse(this);
      if (this.parameters.count !== null && this.parameters.count != 1) {
        let  output = [];
        for (let  i = 0, c = this.parameters.count; i < c; i++) {
          output.push(defaultResponse);
        }
        this.respond(output);
      } else {
        this.respond(defaultResponse);
      }
    };

    /**
     * 
     * @param {fn} callbackObject - function to trigger publisher specific processes
     */
    this.respond = function (callbackObject) {
      this.returnedAt = +new Date();
      _tdc.log(
          'closing request',
          this.id,
          this.returnedAt - this.receivedAt,
          callbackObject
      );
      this.callback(callbackObject);
      this.renderedAt = +new Date();
      _tdc.log(
          'callback finished',
          this.id,
          this.renderedAt - this.receivedAt,
          this.renderedAt - this.returnedAt
      );
    };

    /**
     * Overstock called in the AWS lambda function
     * Zulily - called in the script tag calling Fastly edge dictionary
     * Kohl's - called in AWS lambda function for search requests
     * @param {obj} inputs - request attributes
     */
    this.update = function (inputs) {
      _tdc.log('updating request', this.id);

      if (typeof _tdc.Pub.applyMapResponse == 'function') {
        _tdc.Pub.applyMapResponse(this, inputs);

        // marks this request's mapping as complete
        this.inputs[_tdc.MAP_KEY] = 1;
        this.map = false
        this.noRetry();
        this.send();
      } else {
        this.applyInputs(inputs);
      }

      this.locked = false;
      if (this.map && this.inputs.hasOwnProperty(_tdc.MAP_KEY)) {
        this.noRetry();
        this.send();
      }
    };
  };
})();


  if (typeof define === 'function' && define.amd) {
    define('tagDeliveryContent', [], function () {
      return _tdc;
    });
  }

  window[_tdc.GLOBAL_NAME] = _tdc;
  if (
    _tdc.hasOwnProperty('Pub') &&
    typeof _tdc.Pub === 'object' &&
    _tdc.Pub.hasOwnProperty('GLOBAL_NAME') &&
    _tdc.GLOBAL_NAME != _tdc.Pub.GLOBAL_NAME
  ) {
    window[_tdc.Pub.GLOBAL_NAME] = _tdc;
  }

  if (window.hasOwnProperty('TagDeliveryQueue')) {
    for (var i = 0; i < window.TagDeliveryQueue.length; i++) {
      var cmd = window.TagDeliveryQueue[i];
      if (cmd == 'Pub.ctr.renderShelf') {
        window[_tdc.GLOBAL_NAME].Pub.ctr.renderShelf();
      }
    }
  }

  // Polyfills
  if (!String.prototype.includes) {
    String.prototype.includes = function (search, start) {
        'use strict';
        if (typeof start !== 'number') {
            start = 0;
        }

        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        enumerable: false,
        value: function (obj) {
            var newArr = this.filter(function (el) {
                return el == obj;
            });
            return newArr.length > 0;
        }
    });
}

  return _tdc;
});

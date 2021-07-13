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

    let _pub = {};

    // required method
    _pub.prepareDefaultResponse = function (request) {
        return {
            product_id: null,
            request_id: request.id,
            sponsored: false,
            impression_tracker: null,
            click_tracker: null,
            product: null
        }
    };

    _pub.siteMap = {
        'EX': '15',
        'PF': '16',
        'CB': '10037',

        'EM': '15',
        'PM': '16',
        'CM': '10037',
    };

    _pub.sizeMap = {
        '15': {
            'Homepage PLA': {
                title: 'Produtos Patrocinados',
                slot: 161001101,
                count: 16,
                count_fill: 16,
                renderType: 'carousel'
            },
            'Homepage Banner': {
                slot: 161001202,
                count: 2,
                count_fill: 2,
                width: 728,
                height: 90,
                renderType: 'banner',
                attachTo: ['banners-piq-161101202-superbanner-top', 'banners-piq-161101202-superbanner-bottom']
            },
            'Homepage Rectangle': {
                slot: 161001203,
                count: 3,
                count_fill: 3,
                width: 300,
                height: 250,
                renderType: 'banner',
                attachTo: ['banners-piq-161101203-square-1', 'banners-piq-161101203-square-2', 'banners-piq-161101203-square-3']
            }
        },
        '16': {
            'Homepage PLA': {
                title: 'Produtos Patrocinados',
                slot: 163001101,
                count: 16,
                count_fill: 16,
                renderType: 'carousel'
            },
            'Homepage Banner': {
                slot: 163001202,
                count: 2,
                count_fill: 2,
                width: 728,
                height: 90,
                renderType: 'banner',
                attachTo: ['banners-piq-163101202-superbanner-top', 'banners-piq-163101202-superbanner-bottom']
            },
            'Homepage Rectangle': {
                slot: 163001203,
                count: 3,
                count_fill: 3,
                width: 300,
                height: 250,
                renderType: 'banner',
                attachTo: ['banners-piq-163101203-square-1', 'banners-piq-163101203-square-2', 'banners-piq-163101203-square-3']
            }
        },
        '10037': {
            'Homepage PLA': {
                title: 'Produtos Patrocinados',
                slot: 162001101,
                count: 16,
                count_fill: 16,
                renderType: 'carousel'
            },
            'Homepage Banner': {
                slot: 162001202,
                count: 2,
                count_fill: 2,
                width: 728,
                height: 90,
                renderType: 'banner',
                attachTo: ['banners-piq-162101202-superbanner-top', 'banners-piq-162101202-superbanner-bottom']
            },
            'Homepage Rectangle': {
                slot: 162001203,
                count: 3,
                count_fill: 3,
                width: 300,
                height: 250,
                renderType: 'banner',
                attachTo: ['banners-piq-162101203-square-1', 'banners-piq-162101203-square-2', 'banners-piq-162101203-square-3']
            }
        }
    };

    /**
     * Renders ads - Kicks off rendering logic
     */
    _pub._render = function() {
        let siteId = _pub.determineSite();
        let pageTypes = _pub.evaluatePage();
        for (let i = 0; i < pageTypes.length; i++) {
            let pageType = pageTypes[i];
            let targets = _pub.evaluateTargeting(pageType);
            _pub.apiRequest(targets, siteId, pageType)
        }
    };

    _pub.determineSite = function() {
        return _pub.siteMap[window.siteMetadata['site']['acronym']]
    };

    /**
     * Determines which page we are loaded on
     * @return [pageTypes]
     */
    _pub.evaluatePage = function() {
        let pageInfo = window.dataLayer.filter(dl => dl.pagina).pop();
        let page = pageInfo && pageInfo.pagina.templatePagina;
        if (page === 'home') {
            return ['Homepage PLA', 'Homepage Banner', 'Homepage Rectangle'];
        }
    };

    /**
     * Determines which target values should be returned for which pageType
     * @param {str} pageType - determined pageType
     * @return {obj} target value object
     */
    _pub.evaluateTargeting = function (pageType) {
        if (['Homepage PLA', 'Homepage Banner', 'Homepage Rectangle'].includes(pageType)) {
            return {category: ['Homepage']}
        }
    };

    _pub.retrieveIdUsuario = function() {
        return window.dataLayer.filter(dl => dl.usuario).pop()?.usuario?.idusuario;
    };

    /**
     * Parses params for opp request
     * @param {obj} targets - target values object
     * @param {int} siteId - id of site
     * @param {string} pageType - determined pageType
     * @return {obj} params
     */
    _pub.parseParams = function (targets, siteId, pageType) {

        if (pageType === undefined) return;

        let pageData = _pub.sizeMap[siteId][pageType];

        targets['store'] = siteId;

        let params = {
            slot: pageData.slot,
            count: pageData.count,
            targets: targets,
            count_fill: pageData.count_fill,
        };

        let idUsuario = window.dataLayer.filter(dl => dl.usuario).pop()?.usuario?.idUsuario;

        if (idUsuario !== undefined) {
            params['session'] = idUsuario
        }

        if (pageData.renderType === 'banner') {
            params['height'] = pageData.height;
            params['width'] = pageData.width;
        }
        return params
    };

    /**
     * Determines which target values should be returned for which pageType
     * @param {obj} targets - target values object
     * @param {int} siteId - id of site
     * @param {string} pageType - determined pageType
     */
    _pub.apiRequest = function (targets, siteId, pageType) {
        let pageData = _pub.sizeMap[siteId][pageType];
        let params = _pub.parseParams(targets, siteId, pageType);
        let request = new _tdc.Request(params);
        request.api_url = 'https://sandbox.tagdelivery.com/request?';
        request.send(function (response) {
            let apiResponse = JSON.parse(response);

            if (pageType === 'Homepage PLA' && pageData.renderType === 'carousel') {
                let title = pageData.title;
                _pub.renderCarousel(apiResponse, siteId, params.slot, title)
            } else if (pageData.renderType === 'banner') {
                _pub.renderBanner(apiResponse, siteId, pageType)
            }
        });
    };

    /**
     * Render Banner on page
     * @param {obj} response - response object from adserver request
     * @param {int} siteId - id of site
     * @param {str} pageType - determined pageType
     */
    _pub.renderBanner = function(response, siteId, pageType) {
        let attachTo = _pub.sizeMap[siteId][pageType].attachTo;
        for (let i = 0; i < response.length; i++) {

            let elem = document.createElement('img');
            elem.src = response[i]['asset_url'];

            let link = document.createElement('a');
            link.href = response[i]['click_tracker'] + response[i]['clickthru'];
            link.appendChild(elem);

            let container = document.getElementById(attachTo[i]);
            container.appendChild(link);
            container.parentElement.style.display = 'block';

            window.addEventListener("load", function() {
                let handler = _pub.onVisibilityChange(elem, function(visible) {
                    if (visible) {
                        let impression = document.createElement('img');
                        impression.src = response[i]['impression_tracker'];
                        impression.style = 'display:none;';
                        window.removeEventListener('scroll', handler);
                        window.removeEventListener('resize', handler);
                    }
                });

                if (window.addEventListener) {
                    addEventListener('scroll', handler, false);
                    addEventListener('resize', handler, false);
                } else if (window.attachEvent)  {
                    attachEvent('onscroll', handler);
                    attachEvent('onresize', handler);
                }
            });
        }
    };

    /**
     * Determines if an element is in viewport
     * @param {obj} ele - element in question
     * @return {bool} True if element in viewport
     */
    _pub.isElementInViewport = function(ele) {
        let rect = ele.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) /* or $(window).height() */
        );
    };

    /**
     * Determines if an element is visible
     * @param {obj} ele - element in question
     * @param {function} callback - callback function
     */
    _pub.onVisibilityChange = function(ele, callback) {
        let old_visible;
        return function () {
            let visible = _pub.isElementInViewport(ele);
            if (visible !== old_visible) {
                old_visible = visible;
                if (typeof callback === 'function') {
                    callback(visible);
                }
            }
        }
    };

    /**
     * Returns parsed response containing only site specific product data
     * @param {obj} response - response object from adserver request
     * @param {int} siteId - site Id
     */
    _pub.parseSiteSpecificResponse = function(response, siteId) {
        for (let i = 0; i < response.length; i++) {
            for (let [key, value] of Object.entries(response[i]['product'])) {
                if (key === siteId) {
                    response[i]['product'] = response[i]['product'][key]
                }
            }
        }
        return response
    };

    /**
     * Determines which target values should be returned for which pageType
     * @param {obj} response - response object from adserver request
     * @param {int} siteId - site Id
     * @param {str} slotId - determined in sizeMap
     * @param {str} title - determined in sizeMap - title of the carousel
     */
    _pub.renderCarousel = function(response, siteId, slotId, title) {
        response = _pub.parseSiteSpecificResponse(response, siteId);
        console.log(response)

        slotId += 100000;

        let templateValues = {
            title: title,
            products: response,
        };

        let template = Handlebars.compile(document.getElementById('recommendations-piq-template').innerHTML);
        let container = document.getElementById('recommendations-piq-' + slotId);

        container.innerHTML = template(templateValues);

        // call Slick to activate carousel functionality (delayed)
        // setTimeout(function() {
        //     // handle impression trackers
        //     let checkAndRenderImpressionTrackers = function(slick, currentSlide, response) {
        //         let slidesShowing = (function() {
        //             let windowWidth = window.innerWidth;
        //             let breakpoints = Object.assign([], slick.breakpoints).sort((a, b) => b - a);
        //             let breakpointSettings = slick.breakpointSettings;

        //             let slidesToShow = slick.originalSettings.slidesToShow;
        //             breakpoints.forEach(b => {
        //                 if (windowWidth < b) {
        //                     slidesToShow = breakpointSettings[b].slidesToShow;
        //                 }
        //             });

        //             return slidesToShow;
        //         })();

        //         let firstIndex = currentSlide;
        //         let lastIndex = currentSlide + slidesShowing;

        //         for (let i = firstIndex; i < lastIndex; i++) {
        //             let product = response[i];
        //             if (product) {
        //                 let productId = product.product_id;
        //                 let productImpressionTracker = product.impression_tracker;

        //                 let carouselItem = $('#recommendations-piq-' + slotId + ' .slick-active.recommendation-carousel-item[data-product-id="' + productId + '"]');
        //                 let carouselItemDoesntHaveImpressionTrackerYet = !carouselItem.has('.recommendation-carousel-item-impression-tracker').length;

        //                 if (carouselItemDoesntHaveImpressionTrackerYet) {
        //                     carouselItem.append('<img class="recommendation-carousel-item-impression-tracker" alt="" src="' + productImpressionTracker + '" />');
        //                     console.log('rendered impression tracker for products['+ i +']');
        //                 }
        //             }
        //         }
        //     };
        //     // register events for impression trackers
        //     let recommendationCarousel = '#recommendations-piq-' + slotId + ' .recommendation-carousel';
        //     let elem = document.getElementById('recommendations-piq-' + slotId);
        //     window.addEventListener("load", function() {
        //         let handler = _pub.onVisibilityChange(elem, function(visible) {
        //             if (visible) {
        //                 console.log('visible');
        //                 checkAndRenderImpressionTrackers($(recommendationCarousel).slick('getSlick'), 0, response);
        //             }
        //         });

        //         if (window.addEventListener) {
        //             addEventListener('scroll', handler, false);
        //             addEventListener('resize', handler, false);
        //         } else if (window.attachEvent)  {
        //             attachEvent('onscroll', handler);
        //             attachEvent('onresize', handler);
        //         }
        //     });
        //     $(recommendationCarousel).on('afterChange', function(event, slick, currentSlide) {
        //         checkAndRenderImpressionTrackers(slick, currentSlide, response);
        //     });

        //     // activate carousel
        //     $(recommendationCarousel).slick({
        //         slidesToShow: 4,
        //         slidesToScroll: 4,
        //         infinite: true,
        //         dots: false,
        //         arrows: true,
        //         responsive: [
        //             {
        //                 breakpoint: 1100,
        //                 settings: {
        //                     slidesToShow: 3,
        //                     slidesToScroll: 3,
        //                     infinite: true,
        //                     dots: false,
        //                     arrows: true,
        //                 }
        //             },
        //             {
        //                 breakpoint: 800,
        //                 settings: {
        //                     slidesToShow: 2,
        //                     slidesToScroll: 2,
        //                     infinite: true,
        //                     dots: false,
        //                     arrows: true,
        //                 }
        //             },
        //             {
        //                 breakpoint: 520,
        //                 settings: {
        //                     slidesToShow: 1,
        //                     slidesToScroll: 1,
        //                     infinite: true,
        //                     dots: false,
        //                     arrows: true,
        //                 }
        //             },
        //         ],
        //     });
        // }, 0);
    };

    return _pub;
})();


  _tdc.Request = (function () {
  return function (inputs) {
    this.id = _tdc.Util.generateUuid();
    this.api_url = 'https://ad.tagdelivery.com/request?';
    this.inputs = null;
    this.parameters = {
      targets: null,
      slot: null,
      width: null,
      height: null,
      count: null,
      count_fill: null,
      attributes: null,
      query: null,
      user: null,
      session: null
    };
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
        this.inputs = _tdc.Util.mergeObjects(inputs);

        for (let k in inputs) {
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
    this.send = function (callback) {
      if (!this.locked) {
        this.modifyForPub();
        this.setRetryTime();
        this.locked = true;
      }

      if (!this.active) {
        return;
      }

      this.setRetry();
      this.setUrl();

      this.sentAt = +new Date();

      // construct url
      let url = this.api_url + _tdc.Util.objectToQueryString(this.parameters);

      // instantiate request
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          callback(xhr.responseText)
        }
      };
      xhr.open('GET', url);

      // call request
      xhr.send(null);

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
     */
    this.respond = function () {
      this.returnedAt = +new Date();
      _tdc.log(
          'closing request',
          this.id,
          this.returnedAt - this.receivedAt,
      );
      this.renderedAt = +new Date();
      _tdc.log(
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

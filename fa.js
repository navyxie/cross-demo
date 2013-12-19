
window.XStream = window.XStream || (function() {
    var Observer = function(sender) {
        this._sender = sender;
        this._subscriber = [];
        this._timer = 0;
    };
    Observer.prototype.subscribe = function(fn, self, context) {
        if (typeof fn !== "function") {
            return false;
        }
        var _evt = this._subscriber;
        for (var i = 0, one; one = _evt[i]; i++) {
            if (one.fn == fn) {
                return false;
            }
        }
        _evt.push({fn: fn,self: self,context: context});
        return true;
    };
    Observer.prototype.unsubscribe = function(fn) {
        if (typeof fn !== "function") {
            return false;
        }
        var _evt = this._subscriber, _found = false;
        for (var i = 0, one; one = _evt[i]; i++) {
            if (one.fn == fn) {
                _found = true;
                _evt = _evt.slice(0, i).concat(_evt.slice(i + 1));
                break;
            }
        }
        if (!_found) {
            return false;
        }
        this._subscriber = _evt;
        return true;
    };
    Observer.prototype.notify = function(args) {
        function _notify() {
            this._timer = 0;
            var _evt = this._subscriber;
            for (var i = 0, one; one = _evt[i]; i++) {
                one.fn.call(one.self, args, this._sender, one.context);
            }
        }
        _notify.call(this);
    };
    var _xsInstance = {}, _XS_TAG = "__Fusion2XStreamShopping_";
    var _supportPostMessage = (function() {
        if (window.postMessage) {
            try {
                if (window.postMessage.toString().indexOf("[native code]") >= 0) {
                    return true;
                } else {
                    alert('The native "postMessage" function of browsers seems to have been overridden, DO NOT override it, or Fusion API will not work properly!');
                }
            } catch (_) {
                return true;
            }
        }
        return false;
    })();
    function getParam(name, src) {
        var re = new RegExp("(?:^|\\?|#|&)" + name + "=([^&#]*)(?:$|&|#)", "i");
        var m = re.exec(src);
        return m ? decodeURIComponent(m[1]) : "";
    }
    ;
    function _xsDispatch(data, source) {
        if (data.indexOf(_XS_TAG) != 0) {
            return;
        }
        data = data.substring(_XS_TAG.length);
        var _port = getParam("port", data), _ins;
        if (!(_ins = _xsInstance[_port])) {
            return;
        }
        _ins._handle(getParam("data", data), source, data);
    }
    if (_supportPostMessage) {
        function _eventHandler(evt) {
            _xsDispatch(evt.data, evt.source);
        }
        window.attachEvent ? window.attachEvent("onmessage", _eventHandler) : window.addEventListener && window.addEventListener("message", _eventHandler, false);
    }
    var XStream = function(handler, targetPort, target) {
        var _ins;
        if (_ins = _xsInstance[targetPort]) {
            return _ins;
        }
        _xsInstance[targetPort] = this;
        this.handler = handler;
        this.targetPort = targetPort;
        this.target = target;
        this.closed = false;
        this.onInit = new Observer(this);
        this._pool = [];
        !_supportPostMessage && !navigator[_XS_TAG + XStream.channel + XStream.localPort] && (navigator[_XS_TAG + XStream.channel + XStream.localPort] = _xsDispatch);
    };
    XStream.channel = Math.round(Math.random() * new Date().getTime()) % 9e9 + 1e9;
    XStream.localPort = "";
    XStream.prototype._sendRaw = function(data) {
        try {
            if (_supportPostMessage) {
                this.target.postMessage(data, "*");
            } else {
                var _fn = navigator[_XS_TAG + XStream.channel + this.targetPort];
                typeof _fn == "function" && _fn(data, window);
            }
        } catch (_) {
        }
    };
    XStream.prototype._handle = function(data, source, str) {
        if (getParam("init", data) == "1") {
            this.target = source;
            this.closed = false;
            this.onInit.notify();
            while (this._pool.length) {
                this._sendRaw(this._pool.shift());
            }
        } else if (!this.closed) {
            typeof this.handler == "function" && this.handler.call(this, getParam("data", str), this.targetPort);
        }
    };
    XStream.prototype.init = function() {
        if (!this.target) {
            return;
        }
        var _strData = [_XS_TAG, "port=", encodeURIComponent(XStream.localPort), "&init=1"].join("");
        this._sendRaw(_strData);
        this.onInit.notify();
    };
    XStream.prototype.send = function(data) {
        if (this.closed || !data) {
            return;
        }
        var _strData = [_XS_TAG, "port=", encodeURIComponent(XStream.localPort), "&data=", encodeURIComponent(data)].join("");
        !this.target ? this._pool.push(_strData) : this._sendRaw(_strData);
    };
    XStream.prototype.close = function() {
        this.closed = true;
        delete _xsInstance[this.targetPort];
    };
    return XStream;
})();
var FA = {callbackName: "_CallbackOrder",cbArray: {},postArray: {},like: function(data, sucFn, errFn) {
        var self = this;
        if (!data || !data.goods_id) {
            return;
        }
        if (data.op != "add" && data.op != "del") {
            return;
        }
        if (data.post && data.post == 1) {
            if (self.postArray[data.goods_id]) {
                return;
            }
            self.postArray[data.goods_id] = {sucFn: sucFn,errFn: errFn};
            self.send(data, data.goods_id);
            return;
        }
        var str = String(data.goods_id).replace(/\d/g, function(x) {
            return String.fromCharCode(parseInt(x, 10) + 97);
        });
        var cgiCallBack = self.callbackName + str;
        if (self.cbArray[cgiCallBack]) {
            return;
        }
        data.has_meilishuo = 1;
        self.cbArray[cgiCallBack] = {sucFn: sucFn,errFn: errFn,jsonperr: false};
        var urlArray = ['goods_id=' + data.goods_id, 'provider_id=' + data.provider_id, 'openid=' + data.openid, 'openkey=' + data.openkey, 'has_meilishuo=1', 'cbname=' + cgiCallBack, 'op=' + data.op];
        var url = urlArray.join("&");
        url = "http://guang.qq.com/cgi-bin/cgi_favorite?" + url;
        self.createCallback(cgiCallBack);
        self.createScript(url, cgiCallBack);
    },createCallback: function(cbname) {
        var self = this;
        window[cbname] = function(ret) {
            self.cbArray[cbname].jsonperr = false;
            if (ret.code == 0 || ret.ret == 0) {
                self.cbArray[cbname].sucFn && self.cbArray[cbname].sucFn.call(null, ret);
            } else {
                self.cbArray[cbname].errFn && self.cbArray[cbname].errFn.call(null);
            }
            document.body.removeChild(self.cbArray[cbname].script);
            try {
                delete window[cbname];
            } catch (e) {
                window[cbname] = undefined;
            }
            delete self.cbArray[cbname];
        }
    },createScript: function(url, cbname) {
        var self = this;
        self.cbArray[cbname].jsonperr = true;
        var s = document.createElement("script");
        s.setAttribute("type", "text/javascript");
        s.onload = s.onreadystatechange = function() {
            if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                setTimeout(function() {
                    if (self.cbArray[cbname] && self.cbArray[cbname].jsonperr) {
                        self.cbArray[cbname].errFn.call(null);
                        document.body.removeChild(s);
                        try {
                            delete window[cbname];
                        } catch (e) {
                            window[cbname] = undefined;
                        }
                        delete self.cbArray[cbname];
                    }
                }, 500);
                s.onload = s.onreadystatechange = null;
            }
        };
        var time = new Date();
        s.src = url + "&r=" + time.getTime();
        document.body.appendChild(s);
        self.cbArray[cbname].script = s;
    },appendJson: function(url) {
        var self = this;
        var s = document.createElement("script");
        s.setAttribute("type", "text/javascript");
        s.onload = s.onreadystatechange = function() {
            if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
                setTimeout(function() {
                    if (self.cbArray["JSON"] && self.cbArray["JSON"].length > 0) {
                        while (self.cbArray["JSON"].length) {
                            var item = self.cbArray["JSON"].pop();
                            item.fn.apply(null, item.args);
                        }
                        delete self.cbArray["JSON"];
                    }
                }, 500);
                s.onload = s.onreadystatechange = null;
            }
        };
        s.src = url;
        var head = document.getElementsByTagName('head')[0];
        head.appendChild(s);
    },send: function(data) {
        if (!window.JSON || !window.JSON.stringify) {
            FA.cbArray["JSON"].push({fn: arguments.callee,args: [data]});
            return;
        }
        this.creatXS();
        this.xs.send(JSON.stringify(data));
    },creatXS: function() {
        var self = this;
        XStream.localPort = "detail_inner";
        XStream.channel = "goods_detail";
        self.xs = new XStream(function(data) {
            if (!data)
                return;
            data = JSON.parse(data);
            if (data.msg == "success") {
                self.postArray[data.goods_id].sucFn && self.postArray[data.goods_id].sucFn.call(null, data);
            } else if (data.msg == "err") {
                self.postArray[data.goods_id].errFn && self.postArray[data.goods_id].errFn.call(null);
            }
            delete self.postArray[data.goods_id];
        }, "detail_outer", window.parent);
        self.xs.init();
        function closeXStream() {
            self.xs.close();
        }
        window.attachEvent ? window.attachEvent("onunload", closeXStream) : window.addEventListener && window.addEventListener("unload", closeXStream, false);
        self.creatXS = function() {
        };
    },pvImg: null,init: function() {
        this.cbArray["JSON"] = this.cbArray["JSON"] || [];
        if (!window.JSON || !window.JSON.stringify || (typeof window.JSON.stringify != "function")) {
            this.appendJson("http://qzonestyle.gtimg.cn/open/shopping/js/json.js");
        }
        this._pv();
    },param: function(name, href) {
        var r = new RegExp("(\\?|#|&)" + encodeURIComponent(name) + "=([^&#]*)(&|#|$)");
        var m = (href || location.href).match(r);
        return decodeURIComponent(!m ? "" : m[2]).replace(/\+/g, " ");
    },_pv: function() {
        var self = this;
        var t, d, h, f;
        t = document.cookie.match(/(?:^|;+|\s+)pgv_pvid=([^;]*)/i);
        if (t && t.length && t.length > 1) {
            d = t[1];
        } else {
            d = (Math.round(Math.random() * 2147483647) * (new Date().getUTCMilliseconds())) % 10000000000;
            document.cookie = "pgv_pvid=" + d + "; path=/; domain=qq.com; expires=Sun, 18 Jan 2038 00:00:00 GMT;";
        }
        h = document.cookie.match(/(?:^|;+|\s+)pgv_info=([^;]*)/i);
        if (!h) {
            f = (Math.round(Math.random() * 2147483647) * (new Date().getUTCMilliseconds())) % 10000000000;
            document.cookie = "pgv_info=ssid=s" + f + "; path=/; domain=qq.com;";
        }
        t = document.referrer.split(/[\?\#]/)[0].split("/");
        var dm = 'appstore.qzone.qq.com', path = '/open/shopping/detialpv', rdm = t[2] || "-", rurl = "/" + t.slice(3).join("/"), from = self.param("source");
        if (from != "") {
            rdm = "ADTAG";
            rurl = "detail." + from;
        }
        var url = 'http://pingfore.qq.com/pingd?cc=-&ct=-&java=1&lang=-&pf=-&scl=-&scr=-&tt=-&tz=-8&vs=3.3&flash=&dm=' + dm + '&url=' + path + '&rdm=' + rdm + '&rurl=' + rurl + '&pgv_pvid=' + d + '&sds=' + Math.random();
        setTimeout(function() {
            self.pvImg = new Image();
            self.pvImg.src = url;
        }, 2000);
    },setHeight: function(height) {
        if (!window.JSON || !window.JSON.stringify) {
            FA.cbArray["JSON"].push({fn: arguments.callee,args: [height]});
            return;
        }
        FA.creatXS();
        var data = {height: height,type: 1};
        FA.xs.send(JSON.stringify(data));
    },getFav: function(sucFn, errFn) {
        if (!window.JSON || !window.JSON.stringify) {
            FA.cbArray["JSON"].push({fn: arguments.callee,args: [sucFn, errFn]});
            return;
        }
        FA.postArray["getFav_Xstream"] = {};
        FA.postArray["getFav_Xstream"].sucFn = sucFn;
        FA.postArray["getFav_Xstream"].errFn = errFn;
        FA.creatXS();
        FA.xs && FA.xs.send("getFav");
    }};
FA.init();

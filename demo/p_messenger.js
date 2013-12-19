/**
 *     __  ___                                                 
 *    /  |/  /___   _____ _____ ___   ____   ____ _ ___   _____
 *   / /|_/ // _ \ / ___// ___// _ \ / __ \ / __ `// _ \ / ___/
 *  / /  / //  __/(__  )(__  )/  __// / / // /_/ //  __// /    
 * /_/  /_/ \___//____//____/ \___//_/ /_/ \__, / \___//_/     
 *                                        /____/               
 * 
 * @description MessengerJS, a common cross-document communicate solution.
 * @author biqing kwok
 * @version 2.0
 * @license release under MIT license
 */

var messenger = (function(){

    // 消息前缀, 建议使用自己的项目名, 避免多项目之间的冲突
    var prefix = "[cross_demo]",
        supportPostMessage = 'postMessage' in window;

    // Target 类, 消息对象
    function Target(target, name){
        var errMsg = '';
        if(arguments.length < 2){
            errMsg = 'target error - target and name are both requied';
        } else if (typeof target != 'object'){
            errMsg = 'target error - target itself must be window object';
        } else if (typeof name != 'string'){
            errMsg = 'target error - target name must be string type';
        }
        if(errMsg){
            throw new Error(errMsg);
        }
        this.target = target;
        this.name = name;
    }

    // 往 target 发送消息, 出于安全考虑, 发送消息会带上前缀
    if ( supportPostMessage ){
        // IE8+ 以及现代浏览器支持
        Target.prototype.send = function(msg){
            this.target.postMessage(prefix + msg, '*');
        };
    } else {
        // 兼容IE 6/7
        Target.prototype.send = function(msg){
            var targetFunc = window.navigator[prefix + this.name];
            if ( typeof targetFunc == 'function' ) {
                targetFunc(prefix + msg, window);
            } else {
                throw new Error("target callback function is not defined");
            }
        };
    }
   
    // 信使类
    function Messenger(name){
        this.targets = {};
        this.name = name;
        this.listenFunc = [];
        this.initListen();
    }

    // 添加一个消息对象
    Messenger.prototype.addTarget = function(target, name){
        var targetObj = new Target(target, name);
        this.targets[name] = targetObj;
    };

    // 初始化消息监听
    Messenger.prototype.initListen = function(){
        var self = this;
        var generalCallback = function(msg){
            if(typeof msg == 'object' && msg.data){
                msg = msg.data;
            }
            // 剥离消息前缀
            // modify by navy detect msg type
            if(typeof msg == 'string'){
                msg = msg.slice(prefix.length);
                for(var i = 0; i < self.listenFunc.length; i++){
                    self.listenFunc[i](msg);
                }
            }
        };

        if ( supportPostMessage ){
            if ( 'addEventListener' in document ) {
                window.addEventListener('message', generalCallback, false);
            } else if ( 'attachEvent' in document ) {
                window.attachEvent('onmessage', generalCallback);
            }
        } else {
            // 兼容IE 6/7
            window.navigator[prefix + this.name] = generalCallback;
        }
    };

    // 监听消息
    Messenger.prototype.listen = function(callback){
        this.listenFunc.push(callback);
    };

    // 广播消息
    Messenger.prototype.send = function(msg){
        var targets = this.targets,
            target;
        for(target in targets){
            if(targets.hasOwnProperty(target)){
                targets[target].send(msg);
            }
        }
    };

    return Messenger;
})();
var noop = function(){};
var console = window.console || {log:noop};
var supportJSON = window.JSON && window.JSON.stringify && window.JSON.parse;
var doc = document;
var head = doc.getElementsByTagName("head")[0] || doc.documentElement;
var loadJs = function(url,cbf) {
    var jsNode = doc.createElement('script');
    jsNode.setAttribute("type","text/javascript");
    jsNode.async = true;
    jsNode.src = url;
    head.appendChild(jsNode);
    var supportOnload = "onload" in jsNode;
    if(supportOnload){
        jsNode.onload = onload;
        jsNode.onerror = function(){
            console.log('load url:'+url+'failed');
            onload();
        }
    }else{
        jsNode.onreadystatechange = function(){
            if (/loaded|complete/.test(jsNode.readyState)) {
                onload();
            }
        }
    }
    function onload() {
        // Ensure only run once and handle memory leak in IE
        jsNode.onload = jsNode.onerror = jsNode.onreadystatechange = null;
        head.removeChild(jsNode);
        // Dereference the node
        node = null;
        cbf();
    }
}
// logic code start
var msgObj = new messenger('parent');
var isInit = false;// if init messager
var bFrame = document.getElementById('bFrame');
msgObj.addTarget(bFrame.contentWindow,'iframe');
window.KLG = {
    _handler : {},
    _jsoncbf : {},
    init:function(){
        var self = this;
        self._jsoncbf['JSON'] = self._jsoncbf['JSON'] || [];
        if(!supportJSON){
            loadJs('http://qzonestyle.gtimg.cn/open/shopping/js/json.js',function(){
                setTimeout(function() {
                    if(self._jsoncbf["JSON"] && self._jsoncbf["JSON"].length > 0){
                        while (self._jsoncbf["JSON"].length) {
                            var item = self._jsoncbf["JSON"].pop();
                            item.fn.apply(null, item.args);
                        }
                        delete self._jsoncbf["JSON"];
                    }
                },0);
            });
        }
        if(!isInit){
            isInit = true;
            self.initFn();
            msgObj.listen(function(msg){
                msg = JSON.parse(msg);
                self['_handler'][msg.name].call(self,msg.data);
            });
        }     
    },
    initFn:function(){
        var self = this;
        self['_handler']['share'] = this.share,
        self['_handler']['like'] = this.like,
        self['_handler']['setHeight'] = this.setHeight
    },
    send:function(data){
        var self = this;
        if(!supportJSON){
            self._jsoncbf['JSON'].push({fn: arguments.callee,args: [data]});
            return;
        }
        data = JSON.stringify(data);
        msgObj.send(data);
    },
    share:function(data){
        this.send({name:data.cbf,data:data});
        // console.log(data);
        // msgObj.send(JSON.stringify({name:data.cbf,data:data}));
        //data.cbf(data.content);
        // console.log('share function is called');
    },
    like:function(data){
        this.send({name:data.cbf,data:data});
        // console.log(data);
        // msgObj.send(JSON.stringify({name:data.cbf,data:data}));
        //data.cbf(data.content);
        // console.log('like function is called');
    },
    setHeight:function(data){
        bFrame.style.height = data.height+'px';
        // console.log('setHeight function is called');
    }
}
window.KLG.init();

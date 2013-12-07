/*
    //主页面
    Cross.addEventListener(function(crossData){
        alert(crossData.data);
    });//响应外部嵌入页面
    setTimeout(function(){
        Cross.postMessage("hello b,this data from a",document.getElementById("bFrame").contentWindow);
    },1000);//通知外部嵌入页

    //嵌入页面
    Cross.postMessage("hello yinshen,this data from b");//通知主页面

    Cross.addEventListener(function(crossData){
        alert(crossData.data);
    }); //响应主页面通知
*/
var Cross={
    time:500//使用window.name时轮询间隔：500毫秒
};
//发送通知目标域(domain)请求，携带data做参数。如为window.name方式则置window.name=data
Cross.postMessage=function(data,win){
    win=win||window.top;//若未指定win则默认是向top发送消息
    if (window.addEventListener) {
        win.postMessage(data,"*");
    }else{
        win.name=data;
    }
};
//监听请求触发callback
Cross.addEventListener=function(callback){
    if (window.addEventListener) {
         window.addEventListener('message', callback, true);
    }else{
        var self=this;
        self.name=null;
        setInterval(function(){
            if(window.name&&window.name!==self.name){
                callback({data:window.name});
                self.name=window.name;
            }
        },self.time);
    };
}
window.Cross = Cross || {};
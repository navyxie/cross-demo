Message = {
  _handler : {},
  init : function(){
    var _handler = this._handler;
    messager.listen(function(msg){
      var funcs = _handler[msg];
      if(funcs){
        for(var i = 0, len = funcs.length; i < len; i++){
          funcs[i]();
        }
      }
    });
  },
  on : function(name, func){
    if(this._handler[name]){
      this._handler[name] = []
    }
    this._handler[name].push(func);
  }

};
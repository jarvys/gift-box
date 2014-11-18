var Jser = {};
$.extend(Jser, {
  debug: true,
  todoList: function() {},
  /*  
   创建一个类
   @eg  
    */
  createClass: function(cls, base) {
    var f = function() {
      this.init.apply(this, arguments)
    };
    var a = {};
    var y = {};
    cls = $.isFunction(cls) ? (a = function() {}, a.prototype = cls.prototype, new a) : cls || a;
    base = $.isFunction(base) ? base(a.prototype || cls) : base;
    $.extend(y, cls);
    $.extend(y, base || {});
    y.init = y.$ || y.init || function() {};
    f.prototype = y;
    return f
  },
  Code: {
    REGX_HTML_ENCODE: /"|&|'|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g,
    REGX_HTML_DECODE: /&\w{1,};|&#\d{1,};/g,
    REGX_ENTITY_NUM: /\d{1,}/,
    HTML_DECODE: {
      "&lt;": "<",
      "&gt;": ">",
      "&amp;": "&",
      "&nbsp;": " ",
      "&quot;": "\"",
      "&copy;": "©"
    },
    encodeHtml: function(s) {
      s = (s != undefined) ? s : this;
      return (typeof s != "string") ? s : s.replace(this.REGX_HTML_ENCODE, function($0) {
        var c = $0.charCodeAt(0),
          r = ["&#"];
        c = (c == 0x20) ? 0xA0 : c;
        r.push(c);
        r.push(";");
        return r.join("");
      });
    },
    decodeHtml: function(s) {
      var HTML_DECODE = this.HTML_DECODE,
        REGX_NUM = this.REGX_ENTITY_NUM;
      s = (s != undefined) ? s : this;
      return (typeof s != "string") ? s : s.replace(this.REGX_HTML_DECODE, function($0) {
        var c = HTML_DECODE[$0];
        if (c == undefined) {
          var m = $0.match(REGX_NUM);
          if (m) {
            var cc = m[0];
            cc = (cc == 160) ? 32 : cc;
            c = String.fromCharCode(cc);
          } else {
            c = $0;
          }
        }
        return c;
      });
    }
  },
  /*
   JS模板渲染引擎
   @desc
   methods
   {
   fetch:             //获取制定的模板字符串 
   @par
   a:string    //模板名称

   toFill:             //添加到制定的ID
   @par
   a:string    //使用模板的HTML ID
   b:Object     //传入模板内的数据 

   getFilled:          //获取模板填充数据后的字符串 (常用于模板内部内容嵌套)
   @par
   a:Object     //传入模板内的数据

   }
   @eg
   var virtualData=[{id:1,name:"test"},{id:2,name:"test1"},{id:3,name:"test2"},{id:4,name:"test3"}];
   Jser.JTE.fetch("drag_tmp").toFill("dragarea",{virtualData:virtualData});

   */
  JTE: (function() {
    var w, y, _y, p = function(f, k, j) {
        for (j = 0; k--;)
          if (f.charAt(k) == '\\') j++;
          else break;
        return j % 2
      },
      cache = {},
      q = function(f) {
        return f.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');
      },
      v = function(a, b) {
        a = a.substr(0, b).replace(/\\{2}/g, '').replace(/\\[\w\W]/g, '');
        return (a.match(/\[/g) || []).length == (a.match(/]/g) || []).length
      },
      n = function(f, k, j) {
        for (var m = -1,
            s = f.length,
            i = [], g, h, l; m++ < s - 1;) {
          h = f.charAt(m);
          if (h == '/' && !g && !p(f, m) && v(f, m)) l = !l;
          else if ((h == '\'' || h == '"') && !l && !g) g = h;
          else if (h == g && !l && !p(f, m)) g = null;
          g || i.push(h)
        }
        if (j) return g;
        i = i.join('');
        if (k) return i;
        return (i.match(/{/g) || []).length == (i.match(/}/g) || []).length
      },
      z = function(a, s) {
        var c,
          e = [],
          d,
          o,
          r = function(f) {
            //o=c;
            for (;;)
              if (n(d)) {
                e.push(f ? 'Pft$.push(' + d + ');' : d.replace(/^call\b/, '') + (d.contains(/;$/) ? '' : ';'));
                break
              } else {
                c = a.indexOf('}', c + 1);
                if (c == -1) throw new Error('error near:' + d);
                d = a.slice(1, c)
              }
          };
        for (e.push('var Pft$=[];with(' + s.key + '){');;) {
          c = a.indexOf('{');
          if (c != -1) {
            d = a.slice(0, c).replace(/\+{/, '');
            d.length && e.push('Pft$.push("' + q(d) + '");');
            if (c > 0) o = a.charAt(c - 1);
            if (o == '\\' && p(a, c)) {
              e.push('Pft$.push("{");');
              a = a.substr(c + 1);
              continue
            }
            a = a.substr(c);
            c = a.indexOf('}');
            if (c == -1) break;
            else {
              for (d = a.slice(1, c).trim();;)
                if (n(d, 0, 1)) {
                  c = a.indexOf('}', c + 1);
                  if (c == -1) break;
                  d = a.slice(1, c).trim()
                } else break;
              if (d)
                if (d.contains(/^(?:for|if|while|try)\b/)) e.push(d + '{');
                else if (d.contains(/^\/(?:for|if|while|try)\b/)) e.push('}');
              else if (d.contains(/^(?:else|catch|finally)\b/)) e.push('}' + d + '{');
              else d.contains(/^(?:continue|break|return|throw|var|call)\b/) || n(d, 1).contains(/[^=!><]=[^=]/) ? r() : r(1);
              a = a.substr(c + 1)
            }
          } else break;

        }
        a && e.push('Pft$.push("' + q(a) + '");');
        e.push('}return Pft$.join("")');
        return Function(s.key, e.join(''));
      },
      x = function(a, b, e, r) {
        e = $.isArray(a) ? {
          array: a
        } : a;
        try {
          r = cache[_y] ? cache[_y] : cache[_y] = z(y || w, b); //.replace(/\\([{}])/g, '$1');  
          return r(a);
        } catch (t) {
          return Jser.debug ? b.onError(t, []) : "数据格式错误!";
        }
      };
    return {
      using: function(a, c) {
        w = ($("#" + a).size() != 0) ? $("#" + a).html() : a;
        w = (w + '').replace(/\s+/g, ' ');
        if (c) this.fetch(c);
        return this
      },
      getString: function() {
        return y || w
      },
      fetch: function(a, c) {
        if (!w) this.using('Jser_temp');
        if (w) c = w.match(new RegExp('{' + a + '}([\\s\\S]*?){/' + a + '}'));
        if (!c) throw new Error('no tpl blk:' + a);
        y = c[1];
        _y = a;
        return this
      },
      delTemp: function() {
        y = '';
        w = '';
        return this
      },
      getFilled: function(a) {
        a = a || {};
        return x(a, this)
      },
      toFill: function(a, b, c) {
        c = this;
        $.each($.isArray(a) ? a : [a], function(i, v) {
          v = (v.jquery) ? v : $("#" + v);
          if (v.size() != 0) $(v).html(c.getFilled(b));
        });
        //do initComponent
        return c;
      },
      onError: function(a, b) {
        //Jser.tipMsg("操作异常,请刷新重试!");
        return Jser.debug ? ('error:' + (a.message || a) + ';') : "";
      },
      key: 'context'
    }
  }())
});
$.extend($, {
    /*  
     获取文档大小
     @eg
     $.documentSize();
     */
    documentSize: function(d) {
      d = d || document;
      var c = d.documentElement,
        b = d.body,
        e = d.compatMode == 'CSS1Compat' ? c : b,
        y = 'clientHeight',
        l = 'scrollLeft',
        t = 'scrollTop',
        w = 'scrollWidth',
        h = 'scrollHeight';
      return {
        fullWidth: e.scrollWidth,
        fullHeight: Math.max(e.scrollHeight, e[y]),
        viewWidth: e.clientWidth,
        viewHeight: e[y],
        scrollLeft: c[l] || b[l],
        scrollTop: c[t] || b[t],
        scrollWidth: c[l] || b[l],
        scrollHeight: c[t] || b[t],
        clientLeft: e.clientLeft,
        clientTop: e.clientTop
      }
    },
    /*  
     获取元素基本信息
     @eg
     $.getBound("test")
     */
    getBound: function(el, a) {
      var l = 0,
        w = 0,
        h = 0,
        t = 0,
        p = document.getElementById(el) || el,
        o = $.documentSize(),
        s = 'getBoundingClientRect',
        r;
      if (p) {
        a = document.getElementById(a);
        w = p.offsetWidth;
        h = p.offsetHeight;
        if (p[s] && !a) {
          r = p[s]();
          l = r.left + o.scrollLeft - o.clientLeft;
          t = r.top + o.scrollTop - o.clientTop
        } else
          for (; p && p != a; l += p.offsetLeft || 0, t += p.offsetTop || 0, p = p.offsetParent) {}
      }
      return {
        x: l,
        y: t,
        w: w,
        h: h
      }
    },
    /*  
     取消事件冒泡，阻止默认事件
     @eg
     $.stopEvent(e);
     */
    stopEvent: function(e) {
      if (!e) return;
      if (window.event) {
        window.event.cancelBubble = true;
        window.event.returnValue = false;
      } else {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    /* 
      常用方法
      */
    Lang: {
      /* 
      参数转化为数组
      @eg
      $.Lang.toArray("123,456,789",",");
      */
      toArray: function(args, split) {
        if (!arguments.length || $.type(args) == "undefined") return [];
        if ($.type(args) == "string") {
          return (args + '').split(split ? split : '');
        }
        var result = [];
        for (var i = 0, j = args.length; i < j; i++) {
          result[i] = args[i];
        }
        return result;
      },
      /*  
       绑定obj对象到fn中 
       @eg
       function(){
       var t=this;
       window.setTimeout($.Lang.bind(function(){
       //todo
       //这里就可以访问t对象了
       },t),3000);
       }
       */
      bind: function(fn, obj) {
        var a = $.Lang.toArray(arguments),
          b = a.splice(0, 2);
        return obj ? function() {
          fn.apply(obj, a)
        } : fn;
      }
    }
  })
  /*扩展原生对象String
   trim  去掉前后字符串
   @reg {RegEx} 可选的正则
   byteLen 字节长度  
   contains 是否包含某个字符串|正则|字符等
   format 格式化字符串
   @eg "哈哈哈{0}".format("呵呵");
   r replace 增强的replace功能
   */
$.extend(String.prototype, {
  /*
   去掉前后字符串
   @desc 
   reg    正则表达式 
   @eg
   "  aaa ".trim();
   */
  trim: function(reg) {
    return this.replace(reg || /^[\s\xa0\u3000\uFEFF]+|[\s\xa0\u3000\uFEFF]+$/g, '');
  },
  /*
   获取文字字节长度
   @eg
   "中文aaab".byteLen();
   */
  byteLen: function() {
    return this.replace(/[^\x00-\xff]/g, '**').length;
  },
  /*
   是否包含某个字符串|正则|字符
   @eg
   "我得aaab".contains("c");
   */
  contains: function(str) {
    var r = RegExp;
    var p = str;
    if (!$.type(str) == "regexp") p = new r((p + '').replace(/([?|.{}\\()+\-*\/^$\[\]])/g, '\\$1'));
    return p.test(this);
  },
  escape: function(flag) {
    return window[(flag ? 'un' : '') + 'escape'](this);
  },
  encodeURI: function(flag) {
    return window[(flag ? 'de' : 'en') + 'codeURI'](this)
  },
  encodeURIComponent: function(flag) {
    return window[(flag ? 'de' : 'en') + 'codeURIComponent'](this)
  },
  /*
   格式化字符串
   @eg "哈哈哈{0}1{1}".format("呵呵","gaga");
   */
  format: function() {
    var s = this,
      a = arguments;
    if (s)
      s = s.replace(/{(\d+)}/g, function(b, c) {
        return a[c]
      });
    return s
  },
  /*
   增强的replace功能
   */
  r: function(p, v, s, b) {
    s = this;
    b = $.isArray(v);
    if ($.isArray(p))
      while (p.length) s = s.replace(p.shift(), b && v.length ? v.shift() : '');
    else s = s.replace(p, $.type(v) == "undefined" ? '' : v);
    return s
  }
});


/*
 DropContainer:
 @methods
 {
 show
 hide
 changeData
 }
 事件接口
 onselected   //选中
 onOver       //移上容器
 onOut        //移出容器
 -----------------
 */
window.activeDDL = null; //记录当前打开的DDL
Jser.DropDownList = Jser.createClass({}, function() {
  return {
    showNumber: 6,
    itemHeight: 30,
    init: function(id, h) {
      var t = this;
      t.cid = id;
      t.Jid = $("#" + id);
      t.input = t.Jid.find("input").eq(0).filter(function() {
        return this.id != t.cid + "_val";
      });
      t.valInput = $("#" + t.cid + "_val");
      t.labInput = $("#" + t.cid + "_lab");
      if ($.type(h) == "number") t.showNumber = h;
      t._show = $.Lang.bind(t.show, t);
      t._md = function(e) {
        if (window.activeDDL != t) {
          if (window.activeDDL) window.activeDDL.hide();
          window.activeDDL = t;
        }
        $.stopEvent(e);
      };
      t.Jid.bind('click', t._show).bind('mousedown', t._md);
      t._hide = $.Lang.bind(t.hide, t);
    },
    /*
     
     */
    _fillData: function() {
      var t = this,
        id = t.cid + '_ddlcnt',
        el = $("#" + id);
      if (el.size() > 0) {
        Jser.JTE.fetch("common_ddl").toFill(id, {
          datalist: t.data
        });
        el.css({
          height: ((t.data.length > t.showNumber ? t.showNumber : t.data.length) * t.itemHeight) + 'px',
          overflowY: t.data.length > t.showNumber ? 'auto' : 'hidden'
        });
      }
    },
    /*
     
     */
    fillData: function(a) {
      this.data = a;
      this._fillData();
    },
    /*
     
     */
    scrollToTop: function(f) {
      var t = this,
        to = $("#" + t.cid + '_ddlcnt')[0];
      if (t.isShown && to) {
        to.scrollTop = 0;
        delete t._needToTop;
      } else if (!f) t._needToTop = true;

    },
    /*
     
     */
    show: function(e) {
      $.stopEvent(e);
      var t = this,
        id = t.cid + '_ddlcnt',
        el = $("#" + id),
        d;
      if (t.isShown) {
        t.hide();
        return;
      }
      t.isShown = true;
      if (el.size() > 0) {
        el.show();
      } else {
        t._sdivId = id;
        d = $('<div>').attr({
          id: id
        }).css({
          position: 'absolute',
          zIndex: t._zidx || 3000,
          left: "-2000px",
          top: "0px"
        });
        d[0].className = 'dropdown';
        // d.appendTo("body");
        d.appendTo($(".page_wrapper"));
        t._fillData();
        d.bind('mousedown', $.stopEvent).bind('click', function(e) {
          $.Lang.bind(t.selected, t, e)();
        });
        el = d;
      }
      d = $("#" + t.cid).offset(); //$.getBound(t.cid);
      el.css({
        left: (d.left - $(".page_wrapper").offset().left) / Jser.scale + 'px',
        top: (d.top / Jser.scale + d.height / Jser.scale - 1) + 'px'
        // width: d.width / Jser.scale + 'px'
      });
      if (t._needToTop) t.scrollToTop(!0);
      $(document).bind("mousedown.ddlist", t._hide);
    },
    /*
     
     */
    selected: function(e) {
      //test
      var em = e.target,
        t = this;
      if (em && em.tagName.contains(/^a$/i)) {
        var args = {};
        args = {
          text: em.innerHTML,
          value: em.getAttribute('value')
        };
        if (t.lv != args.value || t.lt != args.text) {
          t.onselected(args);
          if (!args.cancle) {
            t.setVal(args.value);
            t.setText(args.text);
          }
          t.lv = args.value;
          t.lt = args.text;
        }
      }
      t.hide();
    },
    /*
     
     */
    hide: function() {
      this.isShown = false;
      $("#" + this.cid + '_ddlcnt').hide();
      $(document).unbind("mousedown.ddlist");
    },
    changeData: function(data) {
      this.data = data;
      this._fillData();
    },
    setText: function(text) {
      text = Jser.Code.decodeHtml(text);
      this.lt = text;
      try {
        this.input.val(text);
        this.labInput.text(text);
      } catch (e) {

      }
    },
    setVal: function(val) {
      this.lv = val;
      //hack ie7
      if (this.valInput.length && this.valInput[0].tagName == "INPUT") {
        this.valInput.val(val);
      } else {
        this.valInput.text(val);
      }
    },
    addItem: function(data, pos) {
      var t = this;
      t.data.insert(data, pos);
      t.changeData(t.data);
    },
    getSelectedValue: function() {
      return this.lv || "";
    },
    selByValue: function(vle) {
      var t = this,
        args = {},
        flag = -1;
      $.each(t.data, function(idx, v) {
        if (v.value == vle) {
          args = {
            text: v.text,
            value: v.value
          };
          t.onselected(args);
          if (!args.cancle) {
            t.setText(args.text);
            t.setVal(args.value);
          }
          flag = idx;
          return false;
        }
      });
      return flag;
    },
    selByText: function(vle) {
      var t = this,
        args = {},
        flag = -1;
      $.each(t.data, function(idx, v) {
        if (v.text == vle) {
          args = {
            text: v.text,
            value: v.value
          };
          t.onselected(args);
          if (!args.cancle) {
            t.setText(args.text);
            t.setVal(args.value);
          }
          flag = idx;
          return false;
        }
      });
      return flag;
    },
    setZIdx: function(v) {
      var t = this,
        id = t.cid + '_ddlcnt',
        el = $("#" + id);
      if (el.size() > 0) {
        el.css({
          zIndex: v
        });
      } else {
        t._zidx = v;
      }
    },
    dispose: function() {
      var t = this;
      t.Jid.unbind();
      $("#" + t._sdivId).unbind().remove();
      t.hide();
    }
  }
});
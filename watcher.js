class Watcher {
    /**
     * 
     * @param {vue最外层this} vm 
     * @param {expressOrFuntion} expOrFn 
     * @param {回调函数} cb 
     */
    constructor(vm, expOrFn, cb) {
        this.cb = cb;
        this.vm = vm;
        this.expOrFn = expOrFn;
        this.depIds = {};

        if (typeof expOrFn === 'function') {
            this.getter = expOrFn;
        } else {
            this.getter = this.parseGetter(expOrFn);
        }

        this.value = this.getValue();
    }
    update () {
        this.run();
    }

    // 当表达式的值有更新时触发
    run () {
        let value = this.getValue();
        let oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            // 触发回调
            this.cb.call(this.vm, value, oldVal);
        }
    }

    /**
     * 
     * @param {dep对象实例} dep 
     */
    addDep (dep) {
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    }

    // 求出当前watcher实例对应表达式的值
    getValue () {
        Dep.target = this;
        // 注意这里把vm传进去了
        var value = this.getter.call(this.vm, this.vm);
        Dep.target = null;
        return value;
    }

    // 求出当前watcher实例对应表达式的值,这里会触发proxy
    parseGetter (exp) {
        // 匹配包括下划线的任何单词字符。类似但不等价于“[A-Za-z0-9_]”，这里的"单词"字符使用Unicode字符集。
        if (/[^\w.$]/.test(exp)) return;

        var exps = exp.split('.');

        return function (obj) {
            for (var i = 0, len = exps.length; i < len; i++) {
                if (!obj) return;
                obj = obj[exps[i]];
            }
            return obj;
        }
    }



}
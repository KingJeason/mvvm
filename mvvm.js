 class MVVM {
    constructor(options) {
        const vm = this
        this.$options = options || {};
        this._data = this.$options.data;
        this.$vm = this
        this._init(vm)
    }
    _init (vm) {
        // 实现 vm.xxx => vm_data.xxx
        this._proxyData(vm, '_data')

        // 初始化计算属性
        this._initComputed(vm);

        observe(vm.$options.data, this);

        this.$compile = new Compile(vm.$options.el || document.body, this)
    }
    _proxyData (vm, sourceKey) {
        Object.keys(this._data).forEach((key) => {
            Object.defineProperty(vm, key, {
                configurable: false,
                enumerable: true,
                get () {
                    return this[sourceKey][key]
                },
                set (val) {
                    this[sourceKey][key] = val
                }
            });
        });

    }
    _initComputed (vm) {
        let computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach((key) => {
                Object.defineProperty(vm, key, {
                    get: typeof computed[key] === 'function'
                        ? computed[key]
                        : computed[key].get,
                    set: function () { }
                });
            });
        }
    }
}



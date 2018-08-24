class Compile {
    constructor(el, vm) {
        this.$vm = vm;
        // 拿到它的属性节点
        this.$el = this.isElementNode(el) ? el : document.querySelector(el);

        if (this.$el) {
            this.$fragment = this.node2Fragment(this.$el);
            this.init();
            this.$el.appendChild(this.$fragment);
        }
    }
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/Document/createDocumentFragment
     * @param {元素节点} el 
     * DocumentFragments 是DOM节点。它们不是主DOM树的一部分。通常的用例是创建文档片段，将元素附加到文档片段，
     * 然后将文档片段附加到DOM树。在DOM树中，文档片段被其所有的子元素所代替。因为文档片段存在于内存中，并不在DOM树中，
     * 所以将子元素插入到文档片段时不会引起页面回流(reflow)(对元素位置和几何上的计算)。
     * 因此，使用文档片段document fragments 通常会起到优化性能的作用(better performance)。
     */
    node2Fragment (el) {
        let fragment = document.createDocumentFragment(),
            child;

        // 将原生节点拷贝到fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }

        return fragment;
    }

    /**
     * 初始化函数
     */
    init () {
        this.compileElement(this.$fragment);
    }

    /**
     * 
     * @param {fragent对象(node节点)} el 
     * 
     */
    compileElement (el) {
        let childNodes = el.childNodes;
        // 把类数组对象转变成数组对象   1.Array.from 2.[].slice.call()
        [...childNodes].forEach((node) => {

            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/;

            // 1.元素类型
            if (this.isElementNode(node)) {
                this.compile(node);

                // 2. 文本类型
            } else if (this.isTextNode(node) && reg.test(text)) {
                this.compileText(node, RegExp.$1);
            }

            // 如果有子节点则递归遍历
            if (node.childNodes && node.childNodes.length) {
                this.compileElement(node);
            }
        })
    }

    /**
     * 
     * @param {元素节点类型} node 
     */
    compile (node) {
        // 拿到元素的属性类数组集合
        // [
        //     {
        //         name: 'v-model',
        //         value: 'abc'
        //     },
        //     {
        //         name: 'v-on:click',
        //         value: 'onClick'
        //     },
        //     {
        //         name: 'v-bind:value',
        //         value: 'abc'
        //     }
        // ]
        let nodeAttrs = node.attributes;

        [...nodeAttrs].forEach((attr) => {
            let attrName = attr.name;
            if (this.isDirective(attrName)) {
                let exp = attr.value;
                let dir = attrName.substring(2);
                // 事件指令
                if (this.isEventDirective(dir)) {
                    compileUtil.eventHandler(node, this.$vm, exp, dir);
                } else {
                    // 普通指令
                    if (this.isBindDirective(dir)) {
                        compileUtil['bind'] && compileUtil['bind'](node, this.$vm, exp, dir.split(':')[1]);
                    } else {
                        compileUtil[dir] && compileUtil[dir](node, this.$vm, exp);
                    }
                }
            }
        });
    }

    /**
     * 
     * @param {文本节点类型} node 
     * @param {表达式} exp 
     * 编译文本节点
     */
    compileText (node, exp) {
        compileUtil.text(node, this.$vm, exp);
    }

    /**
     * 
     * @param {指令} dir 
     * 是否是bind指令
     */
    isBindDirective (dir) {
        return dir.indexOf('bind:') === 0
    }

    /**
     * 
     * @param {属性名称}} attr 
     * 是否是vue指令
     */
    isDirective (attr) {
        return attr.indexOf('v-') == 0;
    }

    /**
     * 
     * @param {指令} dir 
     * 是否是事件指令
     */
    isEventDirective (dir) {
        return dir.indexOf('on') === 0;
    }

    /**
     * 
     * @param {node节点} node 
     * 是否是元素节点
     */
    isElementNode (node) {
        return node.nodeType == 1;
    }

    /**
     * 
     * @param {node节点} node 
     * 是否是文本节点
     */
    isTextNode (node) {
        return node.nodeType == 3;
    }
}


// 指令处理集合
let compileUtil = {
    value (node, vm, exp) {
        this.bind(node, vm, exp, 'value');
    },

    text (node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },

    html (node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },

    model (node, vm, exp) {
        this.bind(node, vm, exp, 'model');

        let me = this,
            val = this._getVMVal(vm, exp);
        node.addEventListener('input', function (e) {
            let newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    class (node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },

    bind (node, vm, exp, dir) {
        // 
        let updaterFn = updater[dir + 'Updater'];

        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        new Watcher(vm, exp, function (value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    },

    // 事件处理
    eventHandler (node, vm, exp, dir) {
        // onClick => click
        let eventType = dir.split(':')[1],
            // 拿到 options里的 方法
            fn = vm.$options.methods && vm.$options.methods[exp];

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },

    _getVMVal (vm, exp) {
        let val = vm;
        exp = exp.split('.');
        exp.forEach(function (k) {
            val = val[k];
        });
        return val;
    },

    _setVMVal (vm, exp, value) {
        let val = vm;
        exp = exp.split('.');
        exp.forEach(function (k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};

// 指令对应的更新函数集合
let updater = {
    valueUpdater (node, value) {
        node.value = typeof value == 'undefined' ? '' : value
    },

    textUpdater (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },

    htmlUpdater (node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },

    classUpdater (node, value, oldValue) {
        let className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        let space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },

    modelUpdater (node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};
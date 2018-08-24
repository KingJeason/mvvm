class Observer {
    constructor(value) {
        this.value = value
        this.walk(value)
    }


    walk (obj) {
        const keys = Object.keys(obj)
        for (let i = 0; i < keys.length; i++) {
            this.defineReactive(obj, keys[i])
        }
    }
    defineReactive (data, key) {
        const dep = new Dep()
        let val = data[key]
        let childOb = observe(val)
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            get: function reactiveGetter () {
                if (Dep.target) {
                    dep.depend()
                }
                return val
            },
            set: function reactiveSetter (newVal) {
                val = newVal
                childOb = observe(newVal)
                dep.notify()
            }
        })
    }
}
function observe (value, vm) {
    if (!value || typeof value !== 'object') {
        return
    }
    return new Observer(value)
}

var uid = 0;

class Dep {
    constructor() {
        this.id = uid++;
        this.subs = [];
    }

    addSub (sub) {
        this.subs.push(sub);
    }

    depend () {
        Dep.target.addDep(this);
    }

    removeSub (sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    }

    notify () {
        this.subs.forEach(function (sub) {
            sub.update();
        });
    }

}
Dep.target = null;
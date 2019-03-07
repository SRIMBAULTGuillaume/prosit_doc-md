class Key {
    constructor(key, value){
        this.key = key;
        this.value = value;
    }
}

class TupleArray {
    constructor() {
        this.tuple = new Array();
    }

    get(){
        return this.tuple;
    }

    add(key, value){
        this.tuple.push(new Key(key, value));
    }

    setValue(key, value){
        var el = tuple.find(e => {
            if (e.key == key)
                return e;
        });
        if (el != null){
            el.value = value;
        }
    }
}

module.exports = TupleArray;
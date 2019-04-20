module.exports = class Arguments {
    constructor(regex) {
        this.regex = regex
        this.parse = this.parse.bind(this)
    }

    parse(str) {
        const parsed = str.match(this.regex);
        console.log("Parsing", str, parsed, this.regex)
        const obj = {}
        parsed.forEach(item => {
            item = item.split(':');
            item[0] = item[0].toLowerCase().trim();
            item[1] = item.slice(1).join(':').trim();
            obj[item[0]] = item[1];
        });    
        return obj
    }
}
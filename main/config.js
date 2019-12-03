module.exports = class Config {
  constructor(option) {
    console.log("Options", option)
    option = option || {};
    this.prefix = option.prefix || "$";
    this.selfbot = option.selfbot || false;
    this.ownerID = option.ownerID || "184369428002111488";
    this.token = option.botToken || process.env.token;
    this.dbURL = option.dbURL || process.env.dbURL;
    this.nobuPath = option.nobuPath || process.env.nobuPath
  }
}
const https = require("https");
const TupleArray = require('./key.js');

const wikiurl = "https://fr.wikipedia.org/w/api.php?action=opensearch&search=";

cleanString = function(str){
    str = str.replace(":", "");
    str = str.replace("-", "");
    str = str.replace(/[0-9]\./g, "");
    str = str.replace(/\\/g, "");
    str = str.trim();
    var dec = 0;
    //remove all symboles on extremities
    while (str && str[dec] == str[str.length - 1 - dec]
        && (str[dec].charCodeAt() < 65
            || ((str[dec].charCodeAt() > 90) && (str[dec].charCodeAt() < 97))
            || (str[dec].charCodeAt() > 122))) {
        str = str.substring(1, str.length - 1);
    }
    return str.trim();
}

formatList = function(list, title, plural, format){
    var str = "";
    if (list.length > 0) {
        str += "## ";
        if (list.length == 1)
            str += title;
        else
            str += plural;
        str += "\n\n";

        Array.prototype.forEach.call(list, e => {
            str += format.replace("{key}", e.key).replace("{val}", e.value) + '\n';
        })
        str += '\n';
    }
    return str;
}

class Doc {
    constructor() {
        this.title;

        this.animateur;
        this.secretaire;
        this.scribe;
        this.gestionaire;

        this.obj = '';
        this.keyword = new TupleArray();
        this.context = '';
        this.contrainte = new TupleArray();
        this.pb = new TupleArray();
        this.generalisataion = '';
        this.pds = new TupleArray();
        this.pa = new TupleArray();
    }

    clean(){
        Array.prototype.forEach.call(this.keyword.tuple, e => {
            e.key = cleanString(e.key);
        })
        Array.prototype.forEach.call(this.contrainte.tuple, e => {
            e.key = cleanString(e.key);
        })
        Array.prototype.forEach.call(this.pb.tuple, e => {
            e.key = cleanString(e.key);
        })
        Array.prototype.forEach.call(this.pds.tuple, e => {
            e.key = cleanString(e.key);
        })
        Array.prototype.forEach.call(this.pa.tuple, e => {
            //e.key = cleanString(e.key);
        })

        return this;
    }

    format(){
        var str = "# " + this.title + '\n\n';

        str += "* Animateur : " + this.animateur + '\n';
        str += "* Secrétaire : " + this.secretaire + '\n';
        str += "* Scribe : " + this.scribe + '\n';
        str += "* Gestionnaire : " + this.gestionaire + '\n\n';

        if (this.obj && this.obj != ''){
            str += "## Objectifs d'apprentissage\n\n";
            str += this.obj;
            str += '\n';
        }

        str += formatList(this.keyword.tuple, 
            "Mot clé", 
            "Mots clé", 
            "- **{key}** : {val}");
        
        str += "## Contexte\n\n";
        str += this.context;
        str += '\n';

        str += formatList(this.contrainte.tuple,
            "Contrainte",
            "Contraintes",
            "- {key}");

        str += formatList(this.pb.tuple,
            "Problématique",
            "Problématiques",
            "- {key}");

        str += "## Généralisation\n\n";
        str += this.generalisataion;
        str += '\n';

        str += formatList(this.pds.tuple,
            "Piste de solution",
            "Pistes de solution",
            "- {key} **VRAI/FAUX**");

        str += formatList(this.pa.tuple,
            "Plan d'action",
            "Plans d'action",
            "{key}");

        return str;
    }

    searchKw(callback){
        var itemProcessed = 0;
        this.keyword.tuple.map(e => {
            https.get(wikiurl + e.key, res => {
                res.setEncoding("utf8");
                let body = "";
                res.on("data", data => {
                    body += data;
                });
                res.on("end", () => {
                    body = JSON.parse(body);
                    e.value = body[2][0];
                    itemProcessed++;
                    if (itemProcessed == this.keyword.tuple.length)
                        callback();
                });
            });
        });        
    }
}

module.exports = Doc;
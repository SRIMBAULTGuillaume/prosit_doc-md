const Doc = require('./doc.js');
const TupleArray = require('./key.js');

const fs = require('fs');
const Discord = require('discord.js');
const mammoth = require("mammoth");
const wget = require('wget-improved');

const TEST_CHANNEL = "252866177288634380";
const PROD_CHANNEL = "268866496036339712";

const client = new Discord.Client();

var markdownFile;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.channel.id != PROD_CHANNEL && msg.channel.id != TEST_CHANNEL)
        return;

    if (msg.channel.id == TEST_CHANNEL){
        console.log("Test server");
    }

    msg.attachments.forEach(e => {
        if (e.filename.split('.')[e.filename.split('.').length - 1] != "docx")
            return;
            
        console.log("Prosit aller : " + e.url);
        filename = e.filename.replace(/_/g, ' ');
        let download = wget.download(e.url, filename);

        download.on('end', function(output) {
            mammoth.convertToMarkdown({ path: filename })
                .then(function (result) {
                    var md = result.value;
                    md = md.replace(/<a .*<\/a>/gm, "");
                    md = md.replace(/\[.*\]\(#.*\)/gm, "");
                    md = md.replace(/!\[\]\(.*\)/gm, "");
                    md = md.replace(/^\n/gm, "");
                    md = md.replace(/\\/g, "");

                    md = this.parse(md).clean();
                    console.log('Cleaning done!')

                    markdownFile = filename.split(".doc")[0] + ".md"

                    fs.writeFile(markdownFile, md.format(), function (err) {
                        if (err) {
                            return console.log(err);
                        }

                        console.log('Sending 1st prosit');
                        msg.channel.send("Prosit en markdown:", { files: [markdownFile] });
                        console.log('Done');

                        md.searchKw(() => {
                            fs.writeFile(markdownFile, md.format(), function (err) {
                                if (err) {
                                    return console.log(err);
                                }

                                console.log('Sending 2nd prosit');
                                msg.channel.send("Prosit en markdown avec mots clés:", { files: [markdownFile] });
                                console.log('Done');
                            });
                        });
                    });
                })
                .done();
        })
    })
});

fs.readFile(process.cwd() + '/secret.key', 'utf8', (err, data) => {
    client.login(data);
});

contains = function (target, pattern) {
    var value = 0;
    pattern.forEach(function (word) {
        value = value + target.includes(word);
    });
    return (value === 1)
}

parser = function(obj, lines, index, kwEnd, callback){
    var i = index + 1;

    if (typeof(kwEnd) == "string"){
        var tmp = kwEnd;
        kwEnd = new Array();
        kwEnd.push(tmp);
    }

    while (lines[i]!=undefined && !contains(lines[i], (kwEnd))) {
        obj = callback(obj, lines[i++]);
    }

    return [obj, --i]
}

parseTuple = function (lines, index, kwEnd) {
    var obj = new TupleArray();

    return parser(obj, lines, index, kwEnd, (obj, line) => {
        obj.add(line, '')
        return obj;
    });
}

parseString = function (lines, index, kwEnd) {
    var str = "";

    return parser(str, lines, index, kwEnd, (str, line) => {
        return (str + line + '\n');
    });
}

parse = function(md){
    var doc = new Doc();

    var doclines = md.split("\n");

    var i;
    for (i=0; i<doclines.length; i++){
        if (i==0)
            doc.title = doclines[i];

        if(doclines[i].includes("Animateur"))
            doc.animateur = doclines[i].match(/: (.*?)__/)[1];
        if(doclines[i].includes("Secrétaire"))
            doc.secretaire = doclines[i].match(/: (.*?)__/)[1];
        if(doclines[i].includes("Gestionnaire"))
            doc.scribe = doclines[i].match(/: (.*?)__/)[1];
        if(doclines[i].includes("Scribe"))
            doc.gestionaire = doclines[i].match(/: (.*?)__/)[1];

        if(doclines[i].includes("Objectif d’apprentissage")){
            [doc.obj, i] = parseString(doclines, i, "Mots clés");
        }
        if (doclines[i].includes("Mots clés")) {
            [doc.keyword, i] = parseTuple(doclines, i, "Analyse du besoin");
        }
        if (doclines[i].includes("Context")) {
            [doc.context, i] = parseString(doclines, i, "Contrainte");
        }
        if (doclines[i].includes("Contrainte")) {
            [doc.contrainte, i] = parseTuple(doclines, i, "Problématique");
        }
        if (doclines[i].includes("Problématique")) {
            [doc.pb, i] = parseTuple(doclines, i, "Généralisation");
        }   
        if (doclines[i].includes("Généralisation")) {
            [doc.generalisataion, i] = parseString(doclines, i, 
                ["Pistes de solution", "Hypothèse"]);
        }
        if (contains(doclines[i], ["Pistes de solution", "Hypothèse"])
            && !(doclines[i].includes("Validation")) ) {
            [doc.pds, i] = parseTuple(doclines, i, "Plan d’action");
        }
        if (doclines[i].includes("Plan d’action") 
            && !doclines[i].includes("Réalisation")) {
            [doc.pa, i] = parseTuple(doclines, i, "Réalisation du p");
        }
    }

    return doc;
};

// mammoth.convertToMarkdown({ path: 'Prosit_03_-_ERP_aller.docx' })
//     .then(async function (result) {
//         var md = result.value;
//         md = md.replace(/<a [^<]*<\/a>/gm, "");
//         md = md.replace(/\[.*\]\(#.*\)/gm, "");
//         md = md.replace(/!\[\]\(.*\)/gm, "");
//         md = md.replace(/^\n/gm, "");
//         md = md.replace(/\\/, "");
//         var doc = parse(md);

//         doc.clean();
//         var res = doc.format();
        
//         var markdownFile = 'file.md';
//         var markdownFile2 = 'file_kw.md';

//         fs.writeFile(markdownFile, res, function (err) {
//             if (err) {
//                 return console.log(err);
//             }

//             console.log("The file was saved!");
//         }); 

//         doc.searchKw(() => {
//             console.log('everything done')
//             fs.writeFile(markdownFile2, doc.format(), function (err) {
//                 if (err) {
//                     return console.log(err);
//                 }

//                 console.log("The file was saved!");
//             }); 
//         });
        
//         console.log("done!");
//     });


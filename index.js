#!/usr/bin/env node

// Custom version of inquirer, in order to translate the prompts
import inquirer from './inquirer/lib/inquirer.js';
import chalk from 'chalk'
import axios from 'axios';
import { createSpinner } from 'nanospinner'
import figlet from 'figlet';
import gradient from 'gradient-string';
import fs from 'fs';
import { readFile } from 'fs/promises';
import open from 'open';
import Prince from 'prince'
import util from 'util'

// Wake up server
axios.get("https://pf2-database.herokuapp.com/wiki?id=feCnVrPPlKhl701x")

// Initialisation
let spinner;

let dir = "./pathbuilder"
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

const dictionary = JSON.parse(
    await readFile(
        new URL('./data/dictionary.json', import.meta.url)
    )
);
const featsList = JSON.parse(
    await readFile(
        new URL('./data/feats.json', import.meta.url)
    )
);
const classesList = JSON.parse(
    await readFile(
        new URL('./data/classList.json', import.meta.url)
    )
);
const historyList = JSON.parse(
    await readFile(
        new URL('./data/historyList.json', import.meta.url)
    )
);

const ancestriesList = JSON.parse(
    await readFile(
        new URL('./data/ancestryList.json', import.meta.url)
    )
);

// Question flow
console.clear()

await displayWelcomeText("Pathbuilder")
let name = await askName();
let level = await askLevel();
let ancestry = await askAncestries();
let classe = await askClasses();
let feats = loadFeats();
let classFeats = []
let userValidation = false;
while (!userValidation) {
    classFeats = await askFeats(feats[0], true)
    userValidation = await confirmFeats(classFeats)
}
userValidation = false
let ancestryFeats = []
while (!userValidation) {
    ancestryFeats = await askFeats(feats[1], false)
    userValidation = await confirmFeats(ancestryFeats)
}

// Files generation
let player = {
    name,
    level,
    classe,
    ancestry,
    classFeats,
    ancestryFeats,
}

// let data = fs.readFileSync('./out/player.json');
// let player = JSON.parse(data);

spinner = createSpinner(grey('Génération du PDF...')).start()
await generatePDF(player)
spinner.success()
console.log(white("Fichier ") + green("./pathbuilder/player.pdf ") + white("généré avec succès."))
fs.writeFileSync("./pathbuilder/player.json", JSON.stringify(player));
console.log(white("Fichier ") + green("./pathbuilder/player.json ") + white("généré avec succès"))
await open('./pathbuilder/player.pdf');


//----------------------------------
//----------------------------------
//----------------------------------
function translate(text) {
    let translation = dictionary.find(item => item.nameEN.toLowerCase() === text.toLowerCase())
    if (!translation) {
        if (text == "wis") return "sag"
        if (text == "str") return "for"
        return text
    }
    return translation.nameFR
}

async function generatePDF(player) {
    let classItems = Object.values(classe.data.items).filter(item => item.level <= level)
    let html = "<body>"
    html += "<h1>" + player.name + "</h1>"
    html += '<div style="column-count: 2;margin-left: auto; margin-right: auto;">'

    await addItems(classItems, "Capacités de classe")

    await addItems(player.classFeats, "Dons de classe")

    await addItems(player.ancestryFeats, "Dons d'heritages")

    html += "</div>"
    html += "</body>"
    html += addStyles()
    fs.writeFileSync("./pathbuilder/player.html", html);
    return new Promise(function (resolve, reject) {
        Prince()
            .inputs("./pathbuilder/player.html")
            .output("./pathbuilder/player.pdf")
            .execute()
            .then(function () {
                resolve()
            }, function (error) {
                console.log("ERROR: ", util.inspect(error))
                reject()
            })
    })

    async function addItems(items, title) {
        return new Promise(async function (resolve) {
            html += `<h2 style="padding-left: 20px;"><span>${title}</span></h2>`
            for (const item of items) {
                let id = item._id ? item._id : item.id
                let translation = await axios.get("https://pf2-database.herokuapp.com/wiki?id=" + id)
                if (translation.data) {
                    html += addBlock(translation.data.nameFR, translation.data.descriptionFR)
                    let ref = "*"
                    for (const reference of translation.data.references) {
                        html += addReference(ref + reference.description.nameFR, reference.description.descriptionFR)
                        ref += "*"
                    }
                } else {
                    console.log(red("Échec de la traduction de ") + item.name)
                }
            }
            resolve()
        })
    }
}

function addReference(title, text) {
    let content = '<div style="padding: 0px 20px 0 20px; font-family: Georgia, "Times New Roman", serif; font-size: 1rem; line-height: 1.5; text-align: left; break-inside: avoid-column; break-inside: avoid;">'
    content += "<h4>" + title + "</h4>"
    content += text
    content += "</div>"
    return content
}

function addBlock(title, text) {
    let content = '<div style="padding: 10px 20px 0 20px; font-family: Georgia, "Times New Roman", serif; font-size: 1.2rem; line-height: 1.5; text-align: left; break-inside: avoid-column; break-inside: avoid;">'
    content += "<h3>" + title + "</h3>"
    content += text
    content += "</div>"
    return content
}

function addStyles() {
    return `
    <style>
        h1 { 
            text-align: center;
            color: #6D0000;
        }
        h2 {
            color: #FFFFFF;
            margin-top: 0px;
            margin-bottom: 0px;
        }
        h3 {
            color: #6D0000;
        }
        @page {
            background-image: url("../data/background.jpg");
          }
        h2 span { 
            background-color: #6D0000;
            padding: 5px 10px 5px 10px;
        }
    </style>
    `
}

function displayWelcomeText(text) {
    return new Promise(function (resolve, reject) {
        figlet(text, (err, data) => {
            if (err) reject()
            console.log(gradient.fruit.multiline(data))
            resolve()
        })
    })
}


async function askName() {
    let answer = await inquirer.prompt({
        name: "name",
        type: "input",
        message: "Quel est le nom du personnage ?",
        validate: function (input) {
            if (input.length > 2) {
                return true
            } else {
                return "Le nom doit composer au moins 3 caracères."
            }
        }
    })
    return answer.name
}

async function askLevel() {
    let answer = await inquirer.prompt({
        name: "level",
        type: "input",
        message: "Quel est son niveau ?",
        validate: function (input) {
            if (!input.length < 0 || isNaN(input)) return "Le niveau doit être un chiffre."
            if (input < 1 || input > 20) return "Le niveau doit être compris entre 1 et 20"
            return true
        }
    })
    return answer.level
}

async function askClasses() {
    let classesChoice = []
    for (const key of Object.keys(classesList)) {
        let classe = classesList[key]
        let name = translate(classe.name);
        classe.key = key;
        let value = classe
        classesChoice.push({ name, value })
    }
    let answer = await inquirer.prompt({
        name: "classe",
        type: "list",
        message: "Quelle sera son rôle au sein du groupe d'aventurier ?",
        choices: classesChoice.sort(frsort),
    })
    return answer.classe
}

async function askAncestries() {
    let ancestriesChoice = []
    for (const key of Object.keys(ancestriesList)) {
        let ancestry = ancestriesList[key]
        let name = translate(ancestry.name);
        ancestry.key = key;
        let value = ancestry
        ancestriesChoice.push({ name, value })
    }
    let answer = await inquirer.prompt({
        name: "ancestry",
        type: "list",
        message: "Quelle est son ascendance ?",
        choices: ancestriesChoice.sort(frsort),
    })
    return answer.ancestry
}

function loadFeats() {
    let featsArray = Object.values(featsList)
    let classFeats = featsArray.filter(feat => (feat.data.featType.value == "class" && feat.data.traits.value.includes(classe.key)))
    let ancestryFeats = featsArray.filter(feat => feat.data.featType.value == "ancestry" && feat.data.traits.value.includes(ancestry.key))
    return [classFeats, ancestryFeats]
}

async function askFeats(feats, isClass) {
    let selectedFeats = []
    if (isClass) {
        for (const featLevel of classe.data.classFeatLevels.value) {
            if (featLevel <= level) {
                let filteredFeats = feats.filter(feat => feat.data.level.value <= featLevel).map(item => ({ name: translate(item.name), value: item })).sort(frsort);

                selectedFeats.push(await inquirer.prompt([
                    {
                        name: "feat", type: "list", message: "Sélection du don de classe de niveau " + green(featLevel), choices: filteredFeats
                    }
                ]))
            }
        }
        return selectedFeats.map(item => item.feat)
    } else {
        for (const featLevel of classe.data.ancestryFeatLevels.value) {
            if (featLevel <= level) {
                let filteredFeats = feats.filter(feat => feat.data.level.value <= featLevel).map(item => ({ name: translate(item.name), value: item })).sort(frsort);;

                selectedFeats.push(await inquirer.prompt([
                    {
                        name: "feat", type: "list", message: "Sélection du don d'héritage de niveau " + chalk.green(featLevel), choices: filteredFeats
                    }
                ]))
            }
        }
        return selectedFeats.map(item => item.feat)
    }
}

async function confirmFeats(feats) {
    let confirmMessage = chalk.green("-----") + "\n" +
        "Est ce que cela vous convient ?\n" + chalk.cyan.bold("o") + " pour valider" + "\n" +
        chalk.cyan.bold("n") + " pour annuler" + "\n" + chalk.green("-----")
    console.log(confirmMessage);
    let message = ""
    for (const feat of feats) {
        message += " - " + translate(feat.name) + " (" + feat.data.level.value + ")" + "\n"
    }
    message += chalk.green("-----")
    let flag = await inquirer.prompt([{
        name: "confirm", message: message.slice(0, -1) + "\n", type: "confirm", prefix: ""
    }])
    return flag.confirm
}

function white(text) {
    return chalk.bold(text)
}

function grey(text) {
    return chalk.grey(text)
}

function green(text) {
    return chalk.green.bold(text)
}


function red(text) {
    return chalk.red(text)
}

function blue(text) {
    return chalk.cyan(text)
}

function frsort(a, b) {
    return a.name.localeCompare(b.name);
}
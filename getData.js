import axios from 'axios'
import fs from 'fs'


let feats = await axios.get('https://pf2-database.herokuapp.com/getDataSets?cat=feats')
let ancestries = await axios.get('https://pf2-database.herokuapp.com/getDataSets?cat=ancestries')
let classesList = await axios.get('https://pf2-database.herokuapp.com/getDataSets?cat=classes')
let historyList = await axios.get('https://pf2-database.herokuapp.com/getDataSets?cat=backgrounds')

fs.writeFileSync("./data/feats.json", JSON.stringify(feats.data));
fs.writeFileSync("./data/ancestryList.json", JSON.stringify(ancestries.data));
fs.writeFileSync("./data/classList.json", JSON.stringify(classesList.data));
fs.writeFileSync("./data/historyList.json", JSON.stringify(historyList.data));
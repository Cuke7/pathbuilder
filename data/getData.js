import axios from 'axios'
import fs from 'fs'


let feats = await axios.get('https://pf2-database.herokuapp.com/getDataSets?cat=feats')
let ancestries = await axios.get('https://pf2-database.herokuapp.com/getDataSets?cat=ancestries')
let classesList = await axios.get('https://pf2-database.herokuapp.com/getDataSets?cat=classes')
let historyList = await axios.get('https://pf2-database.herokuapp.com/getDataSets?cat=backgrounds')

fs.writeFileSync("./feats.json", JSON.stringify(feats.data));
fs.writeFileSync("./ancestryList.json", JSON.stringify(ancestries.data));
fs.writeFileSync("./classList.json", JSON.stringify(classesList.data));
fs.writeFileSync("./historyList.json", JSON.stringify(historyList.data));
const express = require('express');
const bodyParser = require('body-parser');
var rp = require('request-promise');
const fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const file = "big.txt";
const chunks = [];
let wordsArray = [];
let wordsMap = {};
let filedata;

const readFileStream = () => {
  const readStream = fs.createReadStream(file, { encoding: 'utf8' });

  readStream.on('data', (chunk) => {
    chunks.push(chunk);
    const temp1 = splitByWords(chunk);
    wordsArray = wordsArray.concat(temp1); // keep on adding the words in the list

    wordsMap = createWordMap(wordsArray);
  });

  readStream.on('end', async () => {
    console.log(chunks.length);
    console.log('\nFile reading completed...');
    filedata = chunks.concat(chunks); // final all data from file are read and stored in it.
    // console.log('-->', filedata);
    //debugger;
    const finalWordsArray = sortByCount(wordsMap);

    console.log(finalWordsArray);
    console.log('The word "' + finalWordsArray[0].name + '" appears the most in the file ' +
    finalWordsArray[0].total + ' times');
    const topTenWords = await processTopTenWords(finalWordsArray);  
  });

  readStream.on('error' , (error) => {
    console.log(error);
  });
};

// read file from current directory
// fs.readFile(file, 'utf8', async (err, data) => {

//   if (err) throw err;

//   var wordsArray = splitByWords(data);
//   var wordsMap = createWordMap(wordsArray);
//   var finalWordsArray = sortByCount(wordsMap);

//   console.log(finalWordsArray);
//   console.log('The word "' + finalWordsArray[0].name + '" appears the most in the file ' +
//     finalWordsArray[0].total + ' times');
//   const topTenWords = await processTopTenWords(finalWordsArray);  

// });


function splitByWords (text) {
  // split string by spaces (including spaces, tabs, and newlines)
  var wordsArray = text.split(/\s+/);
  return wordsArray;
}


function createWordMap (wordsArray) {

  // create map for word counts
  // var wordsMap = {};
  wordsArray.forEach(function (key) {
    if (wordsMap.hasOwnProperty(key)) {
      wordsMap[key]++;
    } else {
      wordsMap[key] = 1;
    }
  });

  return wordsMap;

}


function sortByCount (wordsMap) {

  // sort by count in descending order
  var finalWordsArray = [];
  finalWordsArray = Object.keys(wordsMap).map(function(key) {
    return {
      name: key,
      total: wordsMap[key]
    };
  });

  finalWordsArray.sort(function(a, b) {
    return b.total - a.total;
  });

  return finalWordsArray;

}

const processTopTenWords = async (arr) => {
  let result = [];

  for (let i = 0; i < 9; i++) {
    if (arr[i].name) {
      let statusCode = 200;
      let pos = [];
      let syn = [];
      const obj = {};
      try {
        const options = {
        uri: "https://dictionary.yandex.net/api/v1/dicservice.json/lookup?",
        qs: {
        key:  "dict.1.1.20170610T055246Z.0f11bdc42e7b693a.eefbde961e10106a4efa7d852287caa49ecc68cf",
        lang: "en-ru",
        text:arr[i].name
        }
      };
      rawData = await rp(options);
      parsedData = JSON.parse(rawData);
      console.log("parsedData=============>",parsedData);
    } catch(e) {
      statusCode = e.statusCode;
      console.log("Error==========>",e);
      }
      if (statusCode === 200 && parsedData.def && parsedData.def.length > 0) {
          for (let j = 0; j < parsedData.def.length; j++) {
            if (parsedData.def[j] && parsedData.def[j].text === arr[i].name) {
                if (parsedData.def[j].pos) {
                  pos.push(parsedData.def[j].pos);
                }
                if (parsedData.def[j].tr && parsedData.def[j].tr.length> 0 && parsedData.def[j].tr[0] && parsedData.def[j].tr[0].mean) {
                  const mean = parsedData.def[j].tr[0].mean;
                  syn = mean.map((value) => {
                         return value.text;
                        });
                }
          }
        }  
    }
    obj.word = arr[i].name;
    obj.output = {
      count : arr[i].total,
      syn : syn || [],
      pos : pos || []
    }
    result.push(obj)
    }
    //result.push(obj)
  } 
 console.log("result==========>", JSON.stringify(result)); 
}

readFileStream();

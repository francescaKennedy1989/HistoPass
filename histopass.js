var button = document.getElementById("genButton");    //  Assign html button to button object
var passphraseArray = new Array(5);                   //  Create passphraseArray
database = firebase.database();                       //  Creates firebase object reference
var ref = database.ref();
var resultsIndex = 0;
var arrayIndex = 0;

//  Function to return Chrome history and record it into console log
var getLastUrl = function(callback) {
  chrome.history.search({
    text: '',
    maxResults: 100
  }, function(results) {
    console.log(results);
    callback(results);
  });
};

//  Results of titles from Chrome history stored in 'resultsArray'
var resultsArray = new Array(100);
var a = 0;
for (var x = 0; x <= 100; x++) {
  getLastUrl(function(lastUrl) {
    resultsArray[a] = lastUrl[a].title; //  Uses getLastUrl callback function above to return seach item
    a++;
  });
}

getLastUrl(function(lastUrl) {
  var resultsIndex = 0;
  var arrayIndex = 0;
  while (resultsIndex < 5) {
    var tempPhrase = resultsArray[arrayIndex].split(" ");
    var tpal = tempPhrase.length;
    if (tempPhrase[tpal-1] == "Search" && tempPhrase[tpal-2] == "Google") {
      if (tempPhrase[0] == "who" || tempPhrase[0] == "Who" || tempPhrase[0] == "WHO" ||
          tempPhrase[0] == "what" || tempPhrase[0] == "What" || tempPhrase[0] == "WHAT" ||
          tempPhrase[0] == "where" || tempPhrase[0] == "Where"|| tempPhrase[0] == "WHERE" ||
          tempPhrase[0] == "when" || tempPhrase[0] == "When"|| tempPhrase[0] == "WHEN" ||
          tempPhrase[0] == "why"|| tempPhrase[0] == "Why"|| tempPhrase[0] == "WHY" ||
          tempPhrase[0] == "how"|| tempPhrase[0] == "How" || tempPhrase[0] == "HOW") {

          var thepassphrase = "";
          for (var z = 0; z < tpal - 3; z++) {
            thepassphrase = thepassphrase + tempPhrase[z];
          }
          var pplength = thepassphrase.length;
          if (pplength > 25) {
            thepassphrase = thepassphrase.slice(0, 25);
          }

          var ppCharRange = 0;          //  Range of characters set to zero
          var upperCase = false;
          var lowerCase = false;
          var numeric = false;
          var specialChar = false;
          for (var y = 0; y < thepassphrase.length; y++) {
            var asciiChar = thepassphrase.charCodeAt(y);
            if (asciiChar >= 65 && asciiChar <= 90) upperCase = true;
            if (asciiChar >= 97 && asciiChar <= 122) lowerCase = true;
            if (asciiChar >= 48 && asciiChar <= 57) numeric = true;
          }
          //  Boolean variables to denote if characters exist within certain ranges cause addition to the character range
          if (upperCase == true) ppCharRange = ppCharRange + 26;
          if (lowerCase == true) ppCharRange = ppCharRange + 26;
          if (numeric == true) ppCharRange = ppCharRange + 10;
          //  Combinations of letters in the range calculated = Range of characters ^ Number of characters
          var possCombinations = Math.pow(ppCharRange, thepassphrase.length);
          var ent = Math.log2(possCombinations);    //  log2 of possCombinations = entropy of passphrase

          //  New passphrase object constructed using passphrase and entropy
          var presentInDB = "";
          var newpassphrase = {pass : thepassphrase, entropy : ent, pIDB : presentInDB, res : resultsIndex};
          passphraseArray[resultsIndex] = newpassphrase;
          resultsIndex++;             //  Iterates to the next empty item of the resultsIndex array
      }
    }
   arrayIndex++;                     //  Iterates to the next item in the Chrome history
   if (arrayIndex >= 100) break;     //  If the 100th item is reached the loop exits
  }
});

var bottomSectionOutput = "";

button.onclick = async function() {
  bottomSectionOutput = "<br><b>Your Passphrase results ranked from strongest to weakest:<br><br></b>";
  passphraseArray.sort(function(a, b){return b.entropy - a.entropy});
  for (var i = 0; i < 5; i++) {
    if (passphraseArray[i] == null) break;
    dbcheck(i);
  }

  function outputHTML() {
    if (passphraseArray[0] != null && passphraseArray[0].pIDB != "") {
      passphraseArray.sort(function(a, b){return b.entropy - a.entropy});
      for (var j = 0; j < 5; j++) {
        if (passphraseArray[j] == null) break;
        var itemNo = j + 1;
        bottomSectionOutput = bottomSectionOutput + itemNo + ": <b><i>" + passphraseArray[j].pass + "</b></i> has Entropy: <b><i> " + passphraseArray[j].entropy.toFixed(2)+ "</b></i>" + passphraseArray[j].pIDB  + "<br><br>";
      }
      lowercontent.innerHTML = bottomSectionOutput;
    } else {
      setTimeout(outputHTML, 100);
    }
  }
   outputHTML();

}

async function dbcheck (data) {
  var pphrase = passphraseArray[data].pass;
  ref.orderByChild("password").equalTo(pphrase).once("value",snapshot => {
    const userData = snapshot.val();
    if (userData){
      if (passphraseArray[data].entropy > 23.77) {
        passphraseArray[data].entropy = 23.77;
      }
      passphraseArray[data].pIDB = " and is present in the RockYou leaked password list.";
    } else {
      passphraseArray[data].pIDB = " - and is not present in the RockYou leaked password list.";
    }
  });

}


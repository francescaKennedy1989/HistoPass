var button = document.getElementById("genButton");    //  Assign html button to button object
var passphraseArray = new Array(5);                   //  Create passphraseArray
var dbPresent = false;                                //  Boolean to see if item is present in database (DB)
var passComp = "a";                                   //  Passphrase return value from DB
database = firebase.database();                       //  Creates firebase object reference

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

//  Main code runs once 'Get Passphrase button is selected'
button.onclick = function() {
  getLastUrl(function(lastUrl) {
    // Resetting index values at start of function
    var resultsIndex = 0;
    var arrayIndex = 0;
    dbPresent = false;

    //  Determining whether passphrases from search history are suitable for inclusion
    //  Loops until the passphraseArray if full (i.e. the index is 5)
    while (resultsIndex < 5) {
      //  Potential passphrase is split by space into seperate words, and the quantity of words is stored in tpal - temp passphrase length
      var tempPhrase = resultsArray[arrayIndex].split(" ");
      var tpal = tempPhrase.length;
      //  Checking if Chrome history item ends with 'Google Search', denoting a positive potential match for a passphrase
      if (tempPhrase[tpal-1] == "Search" && tempPhrase[tpal-2] == "Google") {
        //  Checking if the history item is a question, beginning with a question word
        if (tempPhrase[0] == "who" || tempPhrase[0] == "Who" || tempPhrase[0] == "WHO" ||
            tempPhrase[0] == "what" || tempPhrase[0] == "What" || tempPhrase[0] == "WHAT" ||
            tempPhrase[0] == "where" || tempPhrase[0] == "Where"|| tempPhrase[0] == "WHERE" ||
            tempPhrase[0] == "when" || tempPhrase[0] == "When"|| tempPhrase[0] == "WHEN" ||
            tempPhrase[0] == "why"|| tempPhrase[0] == "Why"|| tempPhrase[0] == "WHY" ||
            tempPhrase[0] == "how"|| tempPhrase[0] == "How" || tempPhrase[0] == "HOW") {

            //  Potential passphrase generated by combining all seperate words of search title up to "- Google Search"
            var thepassphrase = "";
            for (var z = 0; z < tpal - 3; z++) {
              thepassphrase = thepassphrase + tempPhrase[z];
            }

            //  Binary database search
            var top = 1;                        //  Start of list
            var btm = 80216;                    //  End of list
            while (top <= btm) {
              var mid = (top + btm) / 2;
              mid = Math.round(mid);                            //  Rounds calculation because half items don't exist in DB
              var pwn = "pw" + mid;
              var ref = database.ref(pwn);                      //  Set DB reference to middle database reference (e.g. pw1234)
              ref.on("value", gotData, errData);
              var n = thepassphrase.localeCompare(passComp);    //  Comparing potential passphrase with DB return
              if(n == 0) {                                      //  A match is found, dbPresent set to true
                dbPresent = true;
              }
              if(n == -1) {                                     //  Passphrase is after mid point
                top = mid + 1;
              } else {                                          //  Passphrase is before mid point
                btm = mid - 1;
              }
            }

            //  Following code generates the Entropy value for the passphrase
            //  Firstly character range is determined based on the ASCII number of characters in the passphrase
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

            //  New passphrase object constructed using passphrase and entropy [inDB and latestPC for testing and will be removed]
            //sleep(1000);
            var newpassphrase = {pass : thepassphrase, entropy : ent, inDB : dbPresent, latestPC : passComp};
            passphraseArray[resultsIndex] = newpassphrase;
            resultsIndex++;             //  Iterates to the next empty item of the resultsIndex array

        }
      }
      arrayIndex++;                     //  Iterates to the next item in the Chrome history
      if (arrayIndex >= 100) break;     //  If the 100th item is reached the loop exits
    }

//  Sorting passphrase objects into descending order based on entropy values (i.e. highest entropy first)
    passphraseArray.sort(function(a, b){return b.entropy - a.entropy});

  // Outputing the sorted passphrase suggestions and entropy to the lowercontent section of the HTML
      var bottomSectionOutput = "<br><b>Passphrase results ranked from the strongest to weakest passphrase:<br><br></b>";
      for (var i = 0; i < 5; i++) {
         if (passphraseArray[i] == null) break;
         bottomSectionOutput = bottomSectionOutput + passphraseArray[i].pass + " - Has Entropy: " + passphraseArray[i].entropy.toFixed(2) +   "<br><br>";
      }
      lowercontent.innerHTML = bottomSectionOutput;

  });
}

//  Looks at the database object and sets the passphrase to compare from it
function gotData(data, callback) {
  var passObj = data.val();
  passComp = passObj.password;
  callback();
                                    //alert("got here " + passComp);        //  alert to demonstrate that the passphrases are reached in binary search
}

//  Error log in case of database connection error
async function errData(err) {
  console.log("Error!!!");
  console.log(err);
}
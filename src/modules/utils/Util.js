const imageToBase64 = require('image-to-base64');

function RSExp() {
  this.equate = function (xp) {
    return Math.floor(xp + 300 * Math.pow(2, xp / 7));
  };
  this.level_to_xp = function (level) {
    var xp = 0;
    for (var i = 1; i < level; i++)
      xp += this.equate(i);
    return Math.floor(xp / 4);
  };
  this.xp_to_level = function (xp) {
    var level = 1;
    while (this.level_to_xp(level) < xp)
      level++;
    return level;
  };
}

async function requestBase64ImageFromWiki(name) {
  try {
    let response = await imageToBase64('https://oldschool.runescape.wiki/images/' + hypertextify(capitalizeFirstLetter(name)) + ".png");
    if (response !== "c3RvcmFnZTogb2JqZWN0IGRvZXNuJ3QgZXhpc3QK") {
      return 'data:image/png;base64,' + response;
    } else {
      console.error("Error fetching item image: Image not found " +'https://oldschool.runescape.wiki/images/' + hypertextify(capitalizeFirstLetter(name)) + ".png");
    }
    response = await imageToBase64(("https://raw.githubusercontent.com/runelite/runelite/master/runelite-client/src/main/resources/net/runelite/client/plugins/hiscore/activities/"+ hypertextify(capitalizeFirstLetter(name)) + ".png").toLocaleLowerCase());
    if (response !== "NDA0OiBOb3QgRm91bmQ=") {
      return 'data:image/png;base64,' + response;
    } else {
      console.error("Error fetching item image: Image not found " +("https://raw.githubusercontent.com/runelite/runelite/master/runelite-client/src/main/resources/net/runelite/client/plugins/hiscore/activities/"+ hypertextify(capitalizeFirstLetter(name)) + ".png").toLocaleLowerCase());
    }
  } catch (error) {
    console.error("Error fetching item image:", error);
  }

}

function isFriday(date = new Date()) {
  return date.getDay() === 5;
}

function getFirstDayOfNextMonth() {
  const date = new Date();

  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}
function capitalizeFirstLetter(string) {
  // Check if the string is not empty
  if (string.length === 0) {
    return string;
  }

  // Capitalize the first letter and concatenate it with the rest of the string
  return string.charAt(0).toUpperCase() + string.slice(1);
}
function abbreviateNumber(value, how) {
  if (value) {
    if (how) {
      let newValue = value;
      const suffixes = ["", "k", "m", "b", "t"];
      let suffixNum = 0;
      while (newValue >= 1000) {
        newValue /= 1000;
        suffixNum++;
      }

      newValue = newValue.toString().length > 2 ? newValue.toPrecision(3) : newValue.toPrecision();

      newValue += suffixes[suffixNum];
      return newValue;
    } else {
      var newValue = String(value).replace(/(.)(?=(\d{3})+$)/g, '$1,')
      return newValue;
    }
  }

}

function hypertextify(string) {
  return string.replaceAll(" ", "_").split("(").join("%28").split(")").join("%29").split("'").join("%27");
}
module.exports = { isFriday, getFirstDayOfNextMonth, capitalizeFirstLetter, abbreviateNumber, RSExp, requestBase64ImageFromWiki, hypertextify }
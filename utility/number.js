const reformNumber = function reformNumber(number) {
    const numberString = number.toString();
  
    if (numberString.startsWith("0") && numberString.length == 11) {
      return "234" + numberString.slice(1);
    } else if (numberString.startsWith("234") && numberString.length == 13) {
      return numberString;
    } else {
      return false;
    }
}
export default reformNumber ;
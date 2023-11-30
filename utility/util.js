export const uniqueReference = function uniqueReference() {
    const currentDate = new Date();

    // Get individual date components
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, "0");
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");

    // Concatenate the components to form the desired format
    const todaysDateTime = `${year}${month}${day}${hours}${minutes}`;
    return todaysDateTime+getRandomNumber(100, 999)
};

function getRandomNumber(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

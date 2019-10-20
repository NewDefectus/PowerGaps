var baseLimit = 5000;
var powerLimit = 30;
var found, notFound = 0;

var maxPar = 0;
var maxParBig = 0n;

var startingTime = 0;

var progressPercent = document.getElementById("progressPercent");
var progressTime = document.getElementById("progressTime");
var baseProg = document.getElementById("baseProg");

var progress = 0;

var powerArray = [];
var baseLogArray;

var maxBase = document.getElementById("maxBase");
var maxPower = document.getElementById("maxPower");
var maxGap = document.getElementById("maxGap");
var maxPerfectPower = document.getElementById("maxPerfectPower");
var pauseButton = document.getElementById("pauseButton");

var resultsDiv = document.getElementById("results");

var paused = false;
var lastSearchedBase;

var resultsPanel = document.getElementById("hoveredResult");
var resultsPanelContainer = resultsPanel.parentElement;
var resultsPanelBin = document.getElementById("hoveredBinaryResult");

var lastUsedGaps = true;
var lastUsedArbPrec = false;

window.addEventListener("resize", function () {
	document.documentElement.style.setProperty("--squareSize", (lastUsedGaps ? 2 : 1) * Math.sqrt(resultsDiv.clientHeight * resultsDiv.clientWidth / (maxPar - 2)) + "px");
})

var gapsOrSumsText = document.getElementById("gapsOrSumsText");
var minusOrPlusText = document.getElementById("minusOrPlus");
document.getElementById("gapsOrSumsCheck").onclick = changeGapsOrSums;
document.getElementById("arbitraryPrecisionCheck").onclick = function() { useArbPrec = this.checked };
var searchForGaps = true;
var useArbPrec = false;

var notFoundList = [];

var timePassed = 0;

updateMaxPower();
function updateMaxPower() {
	let string = Math.min(2 ** maxPower.value, maxBase.value ** 2).toExponential(2);
	string = string.replace("+", "").replace("e", "&times;10<sup>") + "</sup>";
	maxPerfectPower.innerHTML = "(All perfect powers below " + string + ")";
}


function changeGapsOrSums() {
	gapsOrSumsText.innerHTML = this.checked ? "gaps" : "sums";
	searchForGaps = this.checked;
}


/* This function calculates what percentage of the search has completed and how much time is left */
function logProgress(i) {
	baseProg.innerText = 2 * i;
	progress = (2 * i / baseLimit) ** 2;

	timePassed = new Date().getTime() - startingTime;
	let timeLeftSec = Math.floor(timePassed * (1 / progress - 1) / 1000 + 1);
	let timeLeftMin = Math.floor(timeLeftSec / 60);
	let timeLeftHour = Math.floor(timeLeftMin / 60);
	let timeLeftDay = Math.floor(timeLeftHour / 24);
	let timeLeftYear = Math.floor(timeLeftDay / 365);

	timeLeftSec %= 60;
	timeLeftMin %= 60;
	timeLeftHour %= 24;
	timeLeftDay %= 365;

	progressPercent.innerText = Math.round(progress * 100000) / 1000 + "%";
	let text = "Time left: " +
		((timeLeftYear > 0) ? ((timeLeftYear == 1) ? "a year, " : timeLeftYear + " years, ") : "") +
		((timeLeftDay > 0) ? ((timeLeftDay == 1) ? "a day, " : timeLeftDay + " days, ") : "") +
		((timeLeftHour > 0) ? ((timeLeftHour == 1) ? "an hour, " : timeLeftHour + " hours, ") : "") +
		((timeLeftMin > 0) ? ((timeLeftMin == 1) ? "a minute, " : timeLeftMin + " minutes, ") : "") +
		((timeLeftSec > 0) ? ((timeLeftSec == 1) ? "a second, " : timeLeftSec + " seconds, ") : "");
	if (text == "Time left: ")
		text = "Done.";
	progressTime.innerText = text.replace(/, (?!.*, )/, ".").replace(/,(?!.*,)/, " and");
}


function stopSearch() {
	paused = !paused;
	pauseButton.value = paused ? "Resume" : "Pause";
	
	if(!paused) {
		if (lastUsedGaps) {
			let e = lastSearchedBase % 2 == 1;
			for (let i = lastSearchedBase + 1; i < baseLimit / 2; i++) {
				let E = e;
				setTimeout(function () { if (!paused) Gsearch(i, E); }, 0);
				if (i % 50 == 0)
					setTimeout(function () { if (!paused) logProgress(i); }, 0);
				e = !e;
			}
		}
		else
			for (let i = lastSearchedBase + 1; i < baseLimit; i++) {
				setTimeout(function () { if (!paused) Ssearch(i); }, 0);
				if (i % 50 == 49)
					setTimeout(function () { if (!paused) logProgress(i); }, 0);
			}
		startingTime = new Date().getTime() - timePassed;

		setTimeout(function () {
			if(!paused) {
				progressPercent.innerText = "100%";
				progressTime.innerText = "Done.";
				baseProg.innerText = baseLimit;
				pauseButton.disabled = true;
				pauseButton.value = "Pause";
			}
		}, 0);
	}
}


function debug(a = "a", b = "b", c = "c", d = "d") {
	if(a != "a")
		a = 2 * a + 1;
	if(b != "b")
		b += 2;
	if(c != "c")
		c = 2 * c + 1;
	if(d != "d")
		d += 2;
	console.log(a + "^" + b + " - " + c + "^" + d);
}


/* Note that, for simplicity, the variables for bases represent bases in the form 2x+1, where x is the value of the variable.
This is because when searching for gaps congruent to 2 mod 4, only odd bases are required:
-If both bases are even, the difference will always be a multiple of 4 (the factor of 2 will be at least doubled, thus becoming divisible by 4).
-If one base is even and the other is odd, the difference will always be odd (an even number minus an odd number is an odd number).
Likewise, the variables for powers represent their powers in the form x+2, because the powers 0 and 1 are not used.*/

/* All the variables tracking the "evenness" of the bases and the powers are used for the following optimization:
(2a+1)ᵇ - (2c+1)ᵈ ≡ 2ab + 2cd (mod 4)
*/

function Gsearch(firstBase, evenBase) {
	let evenSecondBase = !evenBase;
	let adder = evenBase ? 2 : 1;
	for (let secondBase = adder - 1; secondBase <= firstBase; secondBase += adder) {

		let evenFirstPower = !evenSecondBase;
		let adder2 = evenSecondBase ? 2 : 1;
		let secondBaseLog = baseLogArray[secondBase];
		let secondResults = powerArray[secondBase];
		for (let firstPower = adder2 - 1; firstPower <= powerLimit; firstPower += adder2) {
			let firstResult = powerArray[firstBase][firstPower];
			
			if (secondBase == 0) { // Special case if the second base is 1 (no need to repeat for every power)
				let differ = firstResult - 1;
				if (differ <= maxPar) {
					if (differ > 0)
						Gwrite(firstBase * 2 + 1, firstPower + 2, 1, 2, differ);
					else
						Gwrite(1, 2, firstBase * 2 + 1, firstPower + 2, -differ);
				}
				break;
			}
			
			// Highest power of the second base whose distance from the first result is less than maxPar
			let secondPowerLimit = (firstBase == secondBase) ? firstPower - 1 : Math.ceil(Math.ceil(Math.log(firstResult + maxPar) * secondBaseLog) / 10000) - 2;
			
			// Lowest power of the second base whose distance from the first result is less than maxPar
			let smallestPower = (firstResult < maxPar) ? 0 : Math.ceil(Math.ceil(Math.log(firstResult - maxPar) * secondBaseLog) / 10000) - 2;
			
			// If both of these approximations are the same, no second power is sufficient, thus a different second base must be used
			if(secondPowerLimit == smallestPower || secondPowerLimit < 0 || smallestPower > powerLimit)
				break;
			
			let otherSideEven = evenBase || evenFirstPower;
			let allElseOdd = !(otherSideEven || evenSecondBase);
			smallestPower += otherSideEven + (allElseOdd - otherSideEven) * (smallestPower % 2);

			let adder3 = (allElseOdd || otherSideEven) ? 2 : 1;

			for (let secondPower = smallestPower; secondPower < secondPowerLimit; secondPower += adder3) {
				let differ = firstResult - secondResults[secondPower];
				if (differ > 0)
					Gwrite(firstBase * 2 + 1, firstPower + 2, secondBase * 2 + 1, secondPower + 2, differ);
				else
					Gwrite(secondBase * 2 + 1, secondPower + 2, firstBase * 2 + 1, firstPower + 2, -differ);
			}
			if (firstBase == 0)
				break;

			if (!evenSecondBase)
				evenFirstPower = !evenFirstPower;
		}
		if (!evenBase)
			evenSecondBase = !evenSecondBase;
	}
	lastSearchedBase = firstBase;
}

function GsearchArb(firstBase, evenBase) {
	let evenSecondBase = !evenBase;
	let adder = evenBase ? 2 : 1;
	for (let secondBase = adder - 1; secondBase <= firstBase; secondBase += adder) {

		let evenFirstPower = !evenSecondBase;
		let adder2 = evenSecondBase ? 2 : 1;
		let secondBaseLog = baseLogArray[secondBase];
		let secondResults = powerArray[secondBase];
		for (let firstPower = adder2 - 1; firstPower <= powerLimit; firstPower += adder2) {
			let firstResult = powerArray[firstBase][firstPower];
			
			if (secondBase == 0) { // Special case if the second base is 1 (no need to repeat for every power)
				let differ = Number(firstResult - 1n);
				if (differ <= maxPar) {
					if (differ > 0)
						Gwrite(firstBase * 2 + 1, firstPower + 2, 1, 2, differ);
					else
						Gwrite(1, 2, firstBase * 2 + 1, firstPower + 2, -differ);
				}
				break;
			}

			let firstResultSmall = Number(firstResult);
			
			// Highest power of the second base whose distance from the first result is less than maxPar
			let secondPowerLimit = (firstBase == secondBase) ? firstPower - 1 : Math.ceil(Math.ceil(Math.log(firstResultSmall + maxPar) * secondBaseLog) / 10000) - 2;
			
			// Lowest power of the second base whose distance from the first result is less than maxPar
			let smallestPower = (firstResultSmall < maxPar) ? 0 : Math.ceil(Math.ceil(Math.log(firstResultSmall - maxPar) * secondBaseLog) / 10000) - 2;
			
			// If both of these approximations are the same, no second power is sufficient, thus a different second base must be used
			if(secondPowerLimit == smallestPower || secondPowerLimit < 0 || smallestPower > powerLimit)
				break;
			
			let otherSideEven = evenBase || evenFirstPower;
			let allElseOdd = !(otherSideEven || evenSecondBase);
			smallestPower += otherSideEven + (allElseOdd - otherSideEven) * (smallestPower % 2);

			let adder3 = (allElseOdd || otherSideEven) ? 2 : 1;

			for (let secondPower = smallestPower; secondPower < secondPowerLimit; secondPower += adder3) {
				let differ = Number(firstResult - secondResults[secondPower]);
				if (differ > 0)
					Gwrite(firstBase * 2 + 1, firstPower + 2, secondBase * 2 + 1, secondPower + 2, differ);
				else
					Gwrite(secondBase * 2 + 1, secondPower + 2, firstBase * 2 + 1, firstPower + 2, -differ);
			}
			if (firstBase == 0)
				break;

			if (!evenSecondBase)
				evenFirstPower = !evenFirstPower;
		}
		if (!evenBase)
			evenSecondBase = !evenSecondBase;
	}
	lastSearchedBase = firstBase;
}

function Gwrite(base1, power1, base2, power2, result) {
	let prog = Math.round(255 * Math.max(base1, base2) / baseLimit);
	let pow = Math.round(255 * Math.max(power1, power2) / powerLimit);
	let paragraph = document.getElementById(result);


	let red = ('00' + (255 - prog).toString(16)).slice(-2);
	let green = ('00' + pow.toString(16)).slice(-2);
	let blue = ('00' + prog.toString(16)).slice(-2);
	let color = "#" + red + green + blue;

	let calculation = "";
	if (base1 == 1)
		calculation = `{${color}] = 1@n% &minus; ${base2}@${power2}%`;
	else if (base2 == 1)
		calculation = `{${color}] = ${base1}@${power1}% &minus; 1@n%`;
	else
		calculation = `{${color}] = ${base1}@${power1}% &minus; ${base2}@${power2}%`;
	
	try {
		paragraph.calcValue += calculation;
	} catch(e) {
		debug(base1, power1, base2, power2);
	}

	paragraph.className = "square found";

	if (!paragraph.style.backgroundColor)
		paragraph.style.backgroundColor = color;
}


function SsearchArb(firstBase = 0) {
	for (let secondBase = 0; secondBase <= firstBase; secondBase++) {
		for (let firstPower = 0; firstPower <= powerLimit; firstPower++) {

			let secondPowerLimit = (firstBase == secondBase) ? firstPower : powerLimit;

			for (let secondPower = 0; secondPower <= secondPowerLimit; secondPower++) {
				let sum = Number(powerArray[firstBase][firstPower] + powerArray[secondBase][secondPower]);
				if (sum >= maxPar)
					break;
				else {
					Swrite(firstBase + 1, firstPower + 2, secondBase + 1, secondPower + 2, sum);
				}
				if (secondBase == 0)
					break;
			}
			if (firstBase == 0)
				break;
		}
	}
}

function Ssearch(firstBase = 0) {
	for (let secondBase = 0; secondBase <= firstBase; secondBase++) {
		for (let firstPower = 0; firstPower <= powerLimit; firstPower++) {

			let secondPowerLimit = (firstBase == secondBase) ? firstPower : powerLimit;

			for (let secondPower = 0; secondPower <= secondPowerLimit; secondPower++) {
				let sum = powerArray[firstBase][firstPower] + powerArray[secondBase][secondPower];
				if (sum >= maxPar)
					break;
				else {
					Swrite(firstBase + 1, firstPower + 2, secondBase + 1, secondPower + 2, sum);
				}
				if (secondBase == 0)
					break;
			}
			if (firstBase == 0)
				break;
		}
	}
}


function Swrite(base1, power1, base2, power2, result) {
	let prog = Math.round(255 * Math.max(base1, base2) / baseLimit);
	let paragraph = document.getElementById(result);


	let red = ('00' + (255 - prog).toString(16)).slice(-2);
	let blue = ('00' + prog.toString(16)).slice(-2);
	let color = "#" + red + "00" + blue;

	let calculation = "";
	if (base1 == 1)
		if (base2 == 1)
			calculation = `{${color}] = 1@n% &plus; 1@n%`;
		else
			calculation = `{${color}] = 1@n% &plus; ${base2}@${power2}%`;
	else if (base2 == 1)
		calculation = `{${color}] = ${base1}@${power1}% &plus; 1@n%`;
	else
		calculation = `{${color}] = ${base1}@${power1}% &plus; ${base2}@${power2}%`;
	
	paragraph.calcValue += calculation;

	paragraph.className = "square found";

	if (!paragraph.style.backgroundColor)
		paragraph.style.backgroundColor = color;
}


function generatePowerArray(arbitraryPrecision = false) {
	powerArray = [];
	if(arbitraryPrecision)
		for (let base = 1n; base <= BigInt(Math.ceil(baseLimit)); base += searchForGaps ? 2n : 1n) {
			let subArray = [base * base];
			for (let i = 1; i <= powerLimit; i++)
				subArray.push(subArray[i - 1] * base);
			powerArray.push(subArray);
		}
	else
		for (let base = 1; base <= Math.ceil(baseLimit); base += searchForGaps ? 2 : 1) {
			let subArray = [base * base];
			for (let i = 1; i <= powerLimit; i++)
				subArray.push(subArray[i - 1] * base);
			powerArray.push(subArray);
		}
	
	if(searchForGaps)
	{
		baseLogArray = new Float64Array(baseLimit / 2 - 1);
		for(let i = 0; i < baseLimit / 2; i++) {
			baseLogArray[i] = 10000 / Math.log(i * 2 + 1);
		}
	}
}


function searchValues() {
	paused = true;
	setTimeout(function() { paused = false }, 20);
	pauseButton.disabled = false;
	pauseButton.value = "Pause";
	let gapLimit = maxGap.value;

	baseLimit = searchForGaps ? maxBase.value : Math.sqrt(gapLimit);
	powerLimit = maxPower.value - 2;
	progress = 0;
	generatePowerArray(useArbPrec);

	lastUsedGaps = searchForGaps;
	lastUsedArbPrec = useArbPrec;
	minusOrPlusText.innerHTML = searchForGaps ? "&minus;" : "&plus;";
	document.documentElement.style.setProperty("--squareSize", (lastUsedGaps ? 2 : 1) * Math.sqrt(resultsDiv.clientHeight * resultsDiv.clientWidth / (gapLimit - 2)) + "px");

	while (resultsDiv.children.length > 0)
		resultsDiv.removeChild(resultsDiv.children[0]);
	for (maxPar = searchForGaps ? 2 : 1; maxPar <= gapLimit; maxPar += searchForGaps ? 4 : 1) {
		let paragraph = document.createElement("div");
		paragraph.className = "square notFound";
		paragraph.id = maxPar;
		paragraph.calcValue = maxPar.toString();
		paragraph.onmouseover = function () {
			resultsPanel.innerHTML = this.calcValue
				.replace(/{/g, "<br><span style=\"color: ")
				.replace(/]/g, "\">")
				.replace(/}/g, "</span>")
				.replace(/@/g, "<sup>")
				.replace(/%/g, "</sup>");
			resultsPanelBin.innerHTML = Number(this.id).toString(4);
			resultsPanelContainer.style.backgroundColor = (this.calcValue.includes("=")) ? "#fff" : "#ccc";
		}
		
		resultsDiv.appendChild(paragraph);
	}
	maxParBig = BigInt(maxPar);
	
	if(useArbPrec)
	{
		if (searchForGaps) {
			let e = true;
			for (let i = 0; i < baseLimit / 2; i++) {
				let E = e;
				setTimeout(function () { if (!paused) GsearchArb(i, E); }, 0);
				if (i % 50 == 0)
					setTimeout(function () { if (!paused) logProgress(i); }, 0);
				e = !e;
			}
		}
		else
			for (let i = 0; i < baseLimit; i++) {
				setTimeout(function () { if (!paused) SsearchArb(i); }, 0);
				if (i % 50 == 49)
					setTimeout(function () { if (!paused) logProgress(i); }, 0);
			}
	}
			
	else
	
	{
				if (searchForGaps) {
			let e = true;
			for (let i = 0; i < baseLimit / 2; i++) {
				let E = e;
				setTimeout(function () { if (!paused) Gsearch(i, E); }, 0);
				if (i % 50 == 0)
					setTimeout(function () { if (!paused) logProgress(i); }, 0);
				e = !e;
			}
		}
		else
			for (let i = 0; i < baseLimit; i++) {
				setTimeout(function () { if (!paused) Ssearch(i); }, 0);
				if (i % 50 == 49)
					setTimeout(function () { if (!paused) logProgress(i); }, 0);
			}
	}

	startingTime = new Date().getTime();

	setTimeout(function () {
		if(!paused) {
			progressPercent.innerText = "100%";
			progressTime.innerText = "Done.";
			baseProg.innerText = baseLimit;
			pauseButton.disabled = true;
			pauseButton.value = "Pause";
		}
	}, 0);
}


function countFound(start = 2, end = maxPar) {
	start -= start % 4 - 2;
	end -= end % 4 - 2;
	
	let total = (end - start) / 4;
	
	
	founds = 0;
	notFounds = 0;

	for (let square of document.getElementsByClassName("square found"))
		if(square.id >= start && square.id <= end)
			founds++;

	for (let square of document.getElementsByClassName("square notFound"))
		if(square.id >= start && square.id <= end)
			notFounds++;

	console.log("Found: " + founds + "\nNot found: " + notFounds + "\nNot found density: " + notFounds / total + "\nAverage found distance: " + total / founds);
}
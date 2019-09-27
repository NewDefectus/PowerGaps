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


var maxBase = document.getElementById("maxBase");
var maxPower = document.getElementById("maxPower");
var maxGap = document.getElementById("maxGap");
var maxPerfectPower = document.getElementById("maxPerfectPower");

var resultsDiv = document.getElementById("results");

var stoppingSearch = false;


function updateMaxPower() {
	let string = Math.min(2 ** maxPower.value, maxBase.value ** 2).toExponential(2);
	string = string.replace("+", "").replace("e", "&times;10<sup>") + "</sup>";
	maxPerfectPower.innerHTML = "(All perfect powers below " + string + ")";
}
updateMaxPower();

var gapsOrSumsText = document.getElementById("gapsOrSumsText");
var minusOrPlusText = document.getElementById("minusOrPlus");
document.getElementById("gapsOrSumsCheck").onclick = changeGapsOrSums;
var searchForGaps = true;

function changeGapsOrSums() {
	gapsOrSumsText.innerHTML = this.checked ? "gaps" : "sums";
	minusOrPlusText.innerHTML = this.checked ? "&minus;" : "&plus;";
	searchForGaps = this.checked;
}



function logProgress(i) {
	baseProg.innerText = 2 * i;
	progress = (2 * i / baseLimit) ** 2;

	let timePassed = new Date().getTime() - startingTime;
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
	stoppingSearch = true;
	setTimeout(function () { stoppingSearch = false }, 20);
}


function Gsearch(firstBase, evenBase) {
	let evenSecondBase = !evenBase;
	let adder = evenBase ? 2 : 1;
	for (let secondBase = evenBase ? 1 : 0; secondBase <= firstBase; secondBase += adder) {

		let evenFirstPower = !evenSecondBase;
		let adder2 = evenSecondBase ? 2 : 1;
		for (let firstPower = evenSecondBase ? 1 : 0; firstPower <= powerLimit; firstPower += adder2) {


			let firstResult = powerArray[firstBase][firstPower];
			let secondResults = powerArray[secondBase];

			if (firstBase == secondBase && firstPower == 0)
				continue;


			if (secondBase == 0) {
				let differ = Number(firstResult - 1n);

				if (-differ > -maxPar && differ <= maxPar) {
					if (differ >= 2)
						Gwrite(firstBase * 2 + 1, firstPower + 2, 1, 2, differ);
					else if (differ <= -2)
						Gwrite(1, 2, firstBase * 2 + 1, firstPower + 2, -differ);
				}
				break;
			}

			let secondPowerLimit = (firstBase == secondBase) ? firstPower - 1 : powerLimit;

			let closestToEqual = Math.ceil(Math.log(firstBase * 2 + 1) / Math.log(secondBase * 2 + 1) * (firstPower + 2)) - 2;

			if (firstResult - secondResults[secondPowerLimit] > maxParBig || closestToEqual > powerLimit ||
			(
			firstResult - secondResults[closestToEqual - 1] > maxParBig
			&&
			firstResult - secondResults[closestToEqual] < -maxParBig
			))
				break;


			let smallestPower = (firstResult < maxParBig) ? 0 : Math.ceil(Math.log(Number(firstResult) - maxPar) / Math.log(secondBase * 2 + 1)) - 2;
			let otherSideEven = evenBase || evenFirstPower;
			let allElseOdd = !(otherSideEven || evenSecondBase);
			smallestPower += otherSideEven + (allElseOdd - otherSideEven) * (smallestPower % 2);

			let adder3 = (allElseOdd || otherSideEven) ? 2 : 1;

			for (let secondPower = smallestPower; secondPower <= secondPowerLimit; secondPower += adder3) {
				let differ = Number(firstResult - secondResults[secondPower]);
				
				if (-differ > maxPar)
					break;
				else if (differ <= maxPar) {
					if (differ >= 2)
						Gwrite(firstBase * 2 + 1, firstPower + 2, secondBase * 2 + 1, secondPower + 2, differ);
					else if (differ <= -2)
						Gwrite(secondBase * 2 + 1, secondPower + 2, firstBase * 2 + 1, firstPower + 2, -differ);
				}
			}
			if (firstBase == 0)
				break;

			if (!evenSecondBase)
				evenFirstPower = 1 - evenFirstPower;
		}
		if (!evenBase)
			evenSecondBase = 1 - evenSecondBase;
	}
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

	paragraph.calcValue += calculation;

	paragraph.className = "square found";

	if (!paragraph.style.backgroundColor)
		paragraph.style.backgroundColor = color;
}





function Ssearch(firstBase = 0) {
	for (let secondBase = 0; secondBase <= firstBase; secondBase++) {
		for (let firstPower = 0; firstPower <= powerLimit; firstPower++) {

			let secondPowerLimit = (firstBase == secondBase) ? firstPower : powerLimit;

			for (let secondPower = 0; secondPower <= secondPowerLimit; secondPower++) {
				let sum = Number(powerArray[firstBase][firstPower]) + Number(powerArray[secondBase][secondPower]);
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





function generatePowerArray() {
	powerArray = [];
	for (let base = 1n; base <= BigInt(Math.ceil(baseLimit)); base += searchForGaps ? 2n : 1n) {
		let subArray = [base * base];
		for (let i = 1; i < powerLimit + 1; i++)
			subArray.push(subArray[i - 1] * base);
		powerArray.push(subArray);
	}
}

var resultsPanel = document.getElementById("hoveredResult");
var resultsPanelBin = document.getElementById("hoveredBinaryResult");

var lastUsedGaps = false;

window.addEventListener("resize", function () {
	document.documentElement.style.setProperty("--squareSize", (lastUsedGaps ? 2 : 1) * Math.sqrt(resultsDiv.clientHeight * resultsDiv.clientWidth / (maxPar - 2)) + "px");
})

function searchValues() {
	let gapLimit = maxGap.value;

	baseLimit = searchForGaps ? maxBase.value : Math.sqrt(gapLimit);
	powerLimit = maxPower.value - 2;
	progress = 0;
	generatePowerArray();

	lastUsedGaps = searchForGaps;
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
			resultsPanelBin.innerHTML = Number(this.id).toString(2);
		}
		
		resultsDiv.appendChild(paragraph);
	}
	maxParBig = BigInt(maxPar);

	if (searchForGaps) {
		let e = true;
		for (let i = 0; i < baseLimit / 2; i++) {
			let E = e;
			setTimeout(function () { if (!stoppingSearch) Gsearch(i, E); }, 0);
			if (i % 50 == 0)
				setTimeout(function () { if (!stoppingSearch) logProgress(i); }, 0);
			e = !e;
		}
	}
	else
		for (let i = 0; i < baseLimit; i++) {
			setTimeout(function () { if (!stoppingSearch) Ssearch(i); }, 0);
			if (i % 50 == 49)
				setTimeout(function () { if (!stoppingSearch) logProgress(i); }, 0);
		}
	startingTime = new Date().getTime();

	setTimeout(function () {
		progressPercent.innerText = "100%";
		progressTime.innerText = "Done.";
		baseProg.innerText = baseLimit;
	}, 0);
}


var notFoundList = [];

function countFound() {
	found = 0;
	notFound = 0;
	notFoundList = [];

	for (let founds of document.getElementsByClassName("square notFound"))
		found++;

	for (let notFounds of document.getElementsByClassName("square found")) {
		notFound++;
		notFoundList.push(Number(notFounds.id));
	}

	console.log("Found: " + found + "\nNot found: " + notFound + "\nNot found density: " + notFound / (notFound + found));
}
//	the important thing here is that it works tbh

let passport = document.getElementById("cover");
let passportOpened = document.getElementById("passport-opened");
let page1 = document.getElementById("page-1");
let page2 = document.getElementById("page-2");
let btn1 = document.getElementById("beforeBtn");
let btn2 = document.getElementById("afterBtn");
let otherPages = document.getElementsByClassName("page");

// Sound effects
let openSound = new Audio('../sfx/open-calendar.mp3');
let closeSound = new Audio('../sfx/close-calendar.mp3');
let pageSound = new Audio('../sfx/UI_MyDesignEdit_Move.wav');

// Set volume levels (0.0 to 1.0)
openSound.volume = 0.7;
closeSound.volume = 0.7;
pageSound.volume = 0.7;

function playSound(audio) {

	audio.currentTime = 0;
	audio.play().catch(e => {
		console.log('Audio play failed:', e);
	});
}

function passportOpen() {
	playSound(openSound);
	btn1.style.display = "inline-block";
	btn2.style.display = "inline-block";
	passportOpened.style.display = "block";
	page1.style.display = "block";
	page2.style.display = "none";
	passport.className = "passportANI";
	passportOpened.className = "pageANI";
	btn1.onclick = passportClose;
	btn1.innerText = "close passport";
	btn2.onclick = passportPage2;
	btn2.innerText = "next page";
}

function passportPage1() {
	playSound(pageSound);
	page1.className = "pageTurnANI1";
	passportOpened.style.display = "block";
	page1.style.display = "block";
	page2.style.display = "none";
	passportOpened.classList.remove("pageANI");
	btn1.onclick = passportClose;
	btn1.innerText = "close passport";
	btn2.onclick = passportPage2;
	btn2.innerText = "next page";
	passport.style.display = "none";
}

function passportPage2() {
	playSound(pageSound);
	page2.className = "pageTurnANI2";
	page1.style.display = "none";
	page2.style.display = "block";
	btn1.onclick = passportPage1;
	btn1.innerText = "previous page";
	btn2.onclick = passportClose;
	btn2.innerText = "close passport";
	passport.style.display = "none";
}

function passportClose() {
	playSound(closeSound);
	passport.style.display = "block";
	passport.className = "passportCloseANI";
	passportOpened.style.display = "none";
	btn1.style.display = "none";
	btn2.style.display = "none";
}
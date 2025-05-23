(function(){

	var leavesStage, branchStage;
	var branchColor = "#3A2311";
	var BackgroundColor = "#AEDDCD";
	var leafColorDark = "#FFB7C5";
	var leafColorLight = "#FFC5D0"
	var pistileColor = "#6F0011";
	var numOfLeaves = 400;	/*Amount of falling leaves*/
	var numOfFlowers = 40;	/*Amount of flowers*/
	
	function init(){
		initStages();
		initLeaves();	/*Remove this to hide the falling leaves*/
		createjs.Ticker.setFPS(40);
	}

	function initStages() {
		leavesStage = new createjs.Stage("leavesCanvas");
		leavesStage.canvas.width = window.innerWidth;
		leavesStage.canvas.height = window.innerHeight-10;

		branchStage = new createjs.Stage("treeCanvas");
		branchStage.canvas.width = 1200;
		branchStage.canvas.height = 600;
	}

	function initBranch() {
		var branch = drawBranch();

		branchStage.addChild(branch);
		branchStage.update();
	}

	function initFlowers() {
		for(var j = 0; j < numOfFlowers; j++){
			var flower = new createjs.Container();

			for(var i = 0; i < 5; i++){
				var petalW = randomInt(14,16);
				var petalH = randomInt(14,16);
				var petal = new createjs.Shape();

				petal.regX = 0;
				petal.regY = petalH;
				petal.rotation = 72 * i;
				petal.graphics.beginLinearGradientFill([leafColorDark,leafColorLight],[0.5,0.5],0,0,petalW,petalH).drawRoundRectComplex(0,0,petalW,petalH,12,1,12,1);
				petal.cache(0,0,16,16);
				flower.addChild(petal);
			}
			var pistile = new createjs.Shape();
			var pistileH = randomInt(6,8);
			var pistileW = randomInt(6,8);
			var xPos = Math.random() * 1000 + 100| 0;
			var yPos = Math.random() * 300+ 200 | 0;

			pistile.graphics.beginFill(pistileColor).drawEllipse(-pistileW/2,-pistileH/2,pistileW,pistileH);
			flower.addChild(pistile);
			flower.cache(-25,-25,50,50);
			flower.x = xPos;
			flower.y = yPos;
			branchStage.addChild(flower);

		}
		createjs.Ticker.addEventListener("tick", branchStage);
	}

	function initLeaves() {
		for(var i = 0; i < numOfLeaves; i++){
			var leaf = new createjs.Shape();
			var x = (2*window.innerWidth)*Math.random() + 300;
            var y = -((Math.random() * 20) + 15);
            var randomRotation = Math.random() * 360;
            var max = 16;
            var min = 12;
			var falltime = Math.round(window.innerHeight * 7) + Math.random() * 5000;

			leaf.graphics.beginFill(leafColorDark).drawRoundRectComplex(0,0,randomInt(min,max),randomInt(min,max),12,1,12,1);
			leaf.x = x;
			leaf.y = y;
			leavesStage.addChild(leaf);
			createjs.Tween.get(leaf, {loop:true})
				.wait(Math.random() * 10000)
				.to({x: -window.innerWidth, y: 2*window.innerHeight, rotation: Math.random() * 360 + 60}, (Math.round(window.innerHeight * 11) + Math.random() * 5000));
		}
        createjs.Ticker.addEventListener("tick", leavesStage);
	}

	function drawBranch() {
		var branch = new createjs.Shape();

		branch.graphics.beginFill(branchColor);
		branch.graphics.moveTo(1200, 456).lineTo(1149, 461).lineTo(1040, 506).lineTo(985, 516).lineTo(933, 539).lineTo(913,546).lineTo(864,558).lineTo(826,519).lineTo(753,494).lineTo(813,504).lineTo(805,498);
		branch.graphics.bezierCurveTo(783,460,780,470,769, 461);
		branch.graphics.lineTo(755,446).lineTo(720,461).lineTo(600,405).lineTo(546,395).lineTo(503,413).lineTo(530,383).lineTo(486,381).lineTo(439, 385).lineTo(416,403).lineTo(421,473).lineTo(384,540).lineTo(360,557);
		branch.graphics.bezierCurveTo(391,525,415,470,412,471);
		branch.graphics.bezierCurveTo(420,456,410,419,399,406); 
		branch.graphics.lineTo(374,422).lineTo(309,423).lineTo(297,428).lineTo(278,470).lineTo(246,508).lineTo(275,454).lineTo(281,431);
		branch.graphics.bezierCurveTo(242,433,203,468,190,510);
		branch.graphics.lineTo(126,553).lineTo(171,514).lineTo(222,433);
		branch.graphics.bezierCurveTo(248,430,288,421,308,408);
		branch.graphics.lineTo(333,411).lineTo(371,406).lineTo(434,366).lineTo(489,366).lineTo(444,310);
		branch.graphics.bezierCurveTo(415,260,369,249,339,269);
		branch.graphics.lineTo(285,311).lineTo(275,316).lineTo(320,268).lineTo(247,269).lineTo(208,251).lineTo(112,273).lineTo(203,242).lineTo(248,258).lineTo(306,257).lineTo(341,250);
		branch.graphics.bezierCurveTo(363,254,385,255,406,252);
		branch.graphics.lineTo(505,366).lineTo(613,398).lineTo(720,444).lineTo(743,433).lineTo(647,340).lineTo(532,262).lineTo(655,324).lineTo(726,398).lineTo(724,355).lineTo(742,411).lineTo(758,426).lineTo(845,383).lineTo(834,380).lineTo(745,317).lineTo(655,266).lineTo(597,211).lineTo(582,171).lineTo(587,120).lineTo(543,47).lineTo(599,117);
		branch.graphics.lineTo(597,179).lineTo(614,212).lineTo(654,252).lineTo(686,268).lineTo(681,226).lineTo(674,188).lineTo(694,222).lineTo(699,284).lineTo(762,307).lineTo(781,325);
		branch.graphics.bezierCurveTo(810,370,896,390,934,373);
		branch.graphics.bezierCurveTo(944,381,960,387,966,382);
		branch.graphics.lineTo(1015,382).lineTo(993,320).lineTo(986,285).lineTo(957,251).lineTo(997,278).lineTo(1016,230).lineTo(1020,260).lineTo(1000,295).lineTo(1008,332).lineTo(1031,376).lineTo(1061,381).lineTo(1090,406).lineTo(1109,416).lineTo(1125,430).lineTo(1174,408).lineTo(1200,411).lineTo(1200,456);

		branch.graphics.beginFill(BackgroundColor);
		branch.graphics.moveTo(1102,444).lineTo(993,502).lineTo(948,518).lineTo(885,538).lineTo(867,538).lineTo(842,517).lineTo(770,440).lineTo(841,403).lineTo(922,388);
		branch.graphics.bezierCurveTo(929,385,948,388,959,400);
		branch.graphics.bezierCurveTo(972,394,998,396,1014,400);
		branch.graphics.bezierCurveTo(1030,390,1048,392,1052,401);
		branch.graphics.lineTo(1102,444);

		branch.cache(0,0,1200, 600);

		return branch;
	}

	function randomInt(a, b) {
    	return Math.floor(Math.random()*(b-a+1)+a);
	}

	window.onload = function() { init() };
})();
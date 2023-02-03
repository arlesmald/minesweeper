var gameOptionsBTNstatus = "closed";

//TASK #1: Se agregó un nuevo objeto con el tipo "Custom" y asi guardar el número de filas, columnas y minas para juegos personalizados
var gameSettings = [{gtype:"Beginner", r:9, c:9, m:10},{gtype:"Intermediate", r:16, c:16, m:40},{gtype:"Expert", r:16, c:30, m:99},{gtype:"Custom", r:0, c:0, m:0}];

//TASK #2: Variable scores guarda todas las partidas de acuerdo a cada categoria
var scores = [{gtype:"Beginner", games:[]}, {gtype:"Intermediate", games:[]}, {gtype:"Expert", games:[]}];
var currentType;
var currentSettings;
var mines = [];
var gameState = "waiting";
var startTime;
var gameTimer;

function openCloseGameOptions(){
	if(gameOptionsBTNstatus === "closed"){
		gameOptionsBTNstatus = "open";
		var gameOptionsDiv = document.getElementById("gameOptions");
		gameOptionsDiv.style.top = (document.getElementById("btnOptions").getBoundingClientRect().top + document.getElementById("btnOptions").clientHeight + 1) + "px";
		gameOptionsDiv.style.left = (document.getElementById("btnOptions").getBoundingClientRect().left + 2) + "px";
		gameOptionsDiv.style.display = "block";
		
	}else{
		gameOptionsBTNstatus = "closed";
		document.getElementById("gameOptions").style.display = "none";
	}
}

//TASK #1: Funcion que maneja la visibilidad del formulario cuando creamos un juego personalizado
function openCloseCustomGame(){
	var divCustomGame = document.getElementById('customGameOptions')
	var isOpen = Boolean( divCustomGame.style.display == "none");
	isOpen ? divCustomGame.style.display = "block" : divCustomGame.style.display = "none";
	
}

//TASK #1: Se utilizó la misma funcion para iniciar un juego personalizado pero se le agregó una condición en la cual verifica
//que si el tipo es "Custom" entonces obtiene los valores del formulario para crear juegos personalizados y se los asigna
//al objeto que guarda esta informacion en la variable gameSettings
function startNewGame(type){
	
	document.getElementById("gameBoard").style.display = "block";
	
	if(document.getElementById("gameTable").children.length > 0){
		clearGameBoard();
	}
	gameState = "Playing";

	if(type === "Custom"){
		openCloseCustomGame();
		gameSettings[3].c = document.getElementById('txt_cols').value;
		gameSettings[3].r = document.getElementById('txt_rows').value;
		gameSettings[3].m = document.getElementById('txt_mines').value;
	} else {
		openCloseGameOptions();
	}

	document.getElementById("txt_time").value = 0;
	currentType = type;
	getCurrentSettings();
	document.getElementById("txt_mineCount").value = currentSettings.m;
	buildGameBoard();
	startTimer();
}

function getCurrentSettings(){
	for (var i = 0; i < gameSettings.length; i++){
		if (gameSettings[i].gtype === currentType) {
			currentSettings = gameSettings[i];
			return;
		}
	}
}

function buildGameBoard(){
	var boardTable = document.getElementById("gameTable");	
	var idx = 1;
	for (var i = 0; i < currentSettings.r; i++){
		var newRow = document.createElement("TR");
		for (var j = 0; j < currentSettings.c; j++){
			var newCell = document.createElement("TD");
			newCell.setAttribute("index", idx);
			newCell.cm = 0;			
			setStateFaceDown(newCell);
			newCell.addEventListener("click", function(e){
				onLeftClick(this);
			});
			newCell.addEventListener("contextmenu", function(e){
				onRightClick(this);
				e.preventDefault();
			});
			
			newRow.append(newCell);
			idx++;
		}
		boardTable.append(newRow);
	}
	createMines();
	updateCells();
}

function createMines(){
	mines = [];	
	for (var i = 0; i < currentSettings.m;){
		var n = Math.floor((Math.random() * (currentSettings.r * currentSettings.c)) + 1);
		if(!mines.includes(n)){
			mines.push(n);
			i++;
		}
	}	

	
}

function updateCells(){
	var boardTable = document.getElementById("gameTable");
	var r = boardTable.children;
	for (var i = 0; i < r.length; i++){
		var c = r[i].children;
		for (var j = 0; j < c.length; j++){
			if(mines.includes(parseInt(c[j].getAttribute("index")))){
				var NearbyCells = getNearbyCells(parseInt(c[j].getAttribute("index")));
				updateCellMineProximity(NearbyCells);

			}
			
		}
	}
}

function updateCellMineProximity(cellsToUpdate){
	for (var i = 0; i < cellsToUpdate.length; i++){
		cellsToUpdate[i].cm++;
	}
}

function onLeftClick(cell){
	if(gameState == "waiting" || cell.getAttribute("status") === "fl")
		return;

	validateCellToExpand(cell, "leftClick");
	validateWinCondition(true);
}

function onRightClick(cell){
	if(gameState == "waiting")
		return;

	if(cell.getAttribute("status") === "fl"){
		setStateFaceDown(cell);
		document.getElementById("txt_mineCount").value = parseInt(document.getElementById("txt_mineCount").value)+1;
	}
	else if(parseInt(document.getElementById("txt_mineCount").value) != 0){
		setStateFlagged(cell);
		document.getElementById("txt_mineCount").value = parseInt(document.getElementById("txt_mineCount").value)-1;
	}
	if(parseInt(document.getElementById("txt_mineCount").value) === 0){
		validateWinCondition(false);
	}
}

function gameOver(mine){
	stopTimer();
	gameState = "waiting";
	showBombs(mine);
	alert("GAME OVER :(" + getTimePlayedString());
	getPlayerInfo();
}

function expandEmptyCell(cellIndex){
	var boardTable = document.getElementById("gameTable");
	var r = boardTable.children;
	for (var i = 0; i < r.length; i++){
		var c = r[i].children;
		for (var j = 0; j < c.length; j++){
			if(cellIndex === parseInt(c[j].getAttribute("index"))){
				setStateFaceUp(c[j]);
				var NearbyCells = getNearbyCells(parseInt(c[j].getAttribute("index")));
				for(var k=0;k<NearbyCells.length;k++){
					validateCellToExpand(NearbyCells[k]);
				}
				return;
			}
			
		}
	}
}

function validateCellToExpand(cell, mode){
	if(mines.includes(parseInt(cell.getAttribute("index"))) && mode === "leftClick"){
		gameOver(parseInt(cell.getAttribute("index")));
	}else if(cell.cm > 0){
		setStateFaceUp(cell);
	}else if(cell.getAttribute("status") === "fd"){
        expandEmptyCell(parseInt(cell.getAttribute("index")));
	}
}

function getNearbyCells(cellIndex){
	var NearbyCells = [];
	var boardTable = document.getElementById("gameTable");
	var r = boardTable.children;
	for (var i = 0; i < r.length; i++){
		var c = r[i].children;
		for (var j = 0; j < c.length; j++){
			if(cellIndex === parseInt(c[j].getAttribute("index"))){
				if(r[i-1] && r[i-1].children[j-1] && !(r[i-1].children[j-1] === undefined)){
					NearbyCells.push(r[i-1].children[j-1]);
				}
				if(r[i-1] && r[i-1].children[j] && !(r[i-1].children[j] === undefined)){
					NearbyCells.push(r[i-1].children[j]);
				}
				if(r[i-1] && r[i-1].children[j+1] && !(r[i-1].children[j+1] === undefined)){
					NearbyCells.push(r[i-1].children[j+1]);
				}
				if(r[i].children[j-1] && !(r[i].children[j-1] === undefined)){
					NearbyCells.push(r[i].children[j-1]);
				}
				if(r[i].children[j+1] && !(r[i].children[j+1] === undefined)){
					NearbyCells.push(r[i].children[j+1]);
				}
				if(r[i+1] && r[i+1].children[j-1] && !(r[i+1].children[j-1] === undefined)){
					NearbyCells.push(r[i+1].children[j-1]);
				}
				if(r[i+1] && r[i+1].children[j] && !(r[i+1].children[j] === undefined)){
					NearbyCells.push(r[i+1].children[j]);
				}
				if(r[i+1] && r[i+1].children[j+1] && !(r[i+1].children[j+1] === undefined)){
					NearbyCells.push(r[i+1].children[j+1]);
				}
				return NearbyCells;
			}
		}
	}
}

function validateWinCondition(normalWin){
	var c = document.querySelectorAll("td[status='fu']");
	var normalWin = c.length === ((currentSettings.r*currentSettings.c)-currentSettings.m);
	var flagsWin = false;
	if(!normalWin){
		var f = document.querySelectorAll("td[status='fl']");
		if (f.length == mines.length) {
            for (var i = 0; i < f.length; i++) {
                if (mines.includes(parseInt(f[i].getAttribute("index")))) {
                    flagsWin = true;
                } else {
                    flagsWin = false;
                    break;
                }
            }
        }
	}
	if(normalWin || flagsWin){
		stopTimer();
		showBombs(null);
		gameState = "waiting";
		
		setTimeout(function(){ 
			alert("YOU WIN!!!!!! :)" + getTimePlayedString());
			getPlayerInfo();
		}, 500);
		
	}

}

//TASK #2: Se agregó instruccion Switch para agregar el tiempo en segundos y el nombre del jugador
//al objeto en la categoria correspondiente
function getPlayerInfo(){
	var pname = prompt("Please enter your name:");

	switch ( currentType ) {
		case 'Beginner':
			const beginner = scores[0];
			beginner.games.push({name: pname, time: parseInt(document.getElementById("txt_time").value)})
			break;
		case 'Intermediate':
			const intermediate = scores[1];
			intermediate.games.push({name: pname, time: parseInt(document.getElementById("txt_time").value)})
			break;
		case 'Expert':
			const expert = scores[2];
			expert.games.push({name: pname, time: parseInt(document.getElementById("txt_time").value)})
			break;
	
	}
}

//TASK #2: Funcion getScores muestra los 5 mejores tiempos por cada categoria
function getScores() {

	//TASK #2: bestScores es un objeto y cada propiedad es una categoria que va almacenar un arreglo de los 5 mejores tiempos de cada una.
	const bestScores = {
		Beginner: [],
		Intermediate: [],
		Expert: []
	};

	//TASK #2: Recorremos los juegos almacenados en la variable "scores", se ordenan de menor a mayor y luego se hace un slice para
	//obtener los primeros 5 elementos y se le asignan a la categoria correspondiente en "bestScores"
	scores.forEach((value, index) => {
		let sortedValues = scores[index].games.sort((a, b) => a.time - b.time);
		bestScores[value.gtype] = sortedValues.slice(0, 5);
	});

	let output = "";

	//TASK #2: Recorremos el objeto para acceder al arreglo de cada una de las propiedades para luego ir concatenando
	// los elementos de los array a la variable "output" que al final tendrá la información completa para ser mostrada
	//en el alert.
	for (let key in bestScores) {
		
		output+=`-----------${key} Best Scores------------ \n`;

		if(bestScores[key].length == 0){
			output+='< NONE >';
			output+="\n";

		} else {

			bestScores[key].forEach((value, index) => {
				
				output+=`${index+1}. ${value.name}, Time: ${value.time} \n`;
			});

			output+="\n"
		}
	}

	
	alert(output);
}

function showBombs(mine){
	for (var i = 0; i < mines.length; i++){
		var c = document.querySelector("td[index='"+mines[i]+"']");
		if(mines[i] === mine){
			setStateBomb(c, "red");
		}else if(c.getAttribute("status") === "fl"){
			setStateBomb(c, "green");
		}else{
			setStateBomb(c, "yellow");
		}
	}
}

function clearGameBoard(){
	var boardTable = document.getElementById("gameTable");
	var r = boardTable.childNodes;
	var rCount = r.length
	for (var i = 0; i < rCount; i++){
		boardTable.removeChild(r[0]);
	}
}

function setStateFaceDown(cell){
	cell.setAttribute("status", "fd");
	cell.style.backgroundImage = "url(images/facingDown.png)";
}

function setStateFaceUp(cell){
	cell.setAttribute("status","fu");
	cell.style.backgroundImage = "url(images/"+ cell.cm +".png)";
}

function setStateFlagged(cell){
	cell.setAttribute("status","fl");
	cell.style.backgroundImage = "url(images/flagged.png)";
}

function setStateBomb(cell, bgColor){
	cell.setAttribute("status","fud");
		cell.style.backgroundColor = bgColor;
		cell.style.backgroundImage = "url(images/bomb.png)";
}

function startTimer(){
	startTime = new Date;
	gameTimer = setInterval(function(){
		var currentTime = new Date;
		document.getElementById("txt_time").value = Math.round((currentTime.getTime() - startTime.getTime())/1000);
  	}, 1000);
}

function stopTimer(){
	clearInterval(gameTimer);
}

function getTimePlayedString(){
	var time = parseInt(document.getElementById("txt_time").value);
	var timeString = ""
	if(time<60){
		timeString = time +" seconds";
	}else{
		timeString = (time/60) +" minutes";
	}
	return "\nTime: " + timeString;
}

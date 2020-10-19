// todo:
// make sliding look nice
// prevent highlighting replacing clicking
// should shrink down on smaller screens
// arrow key controls
const GRID_SIZE = 4;

/* ONE_CLICK_ONE_MOVE:
   true: increment the move counter by one with each move,
     even if that move slides multiple squares
   false: increment the counter by the number of squres moved with each click */
const ONE_CLICK_ONE_MOVE = true;

$(function() {
  createBoard();
  setPuzzleDesc();

  // create rules to change style when square is in the correct position
  for (var i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    $('<style type=\'text/css\'>.puzzle-square[val=\'' + (i + 1) + '\']' +
    '[currrow=\'' + getDestRow(i + 1) + '\'][currcol=\'' +
      getDestCol(i + 1) + '\']' + '{ background-color:#fb3fd685; }' +
      '</style>').appendTo('head');
  }

});

function createBoard() {
  $puzzleContainer = $('#puzzle-container');

  // set grid size
  $puzzleContainer.css('grid-template-columns', 'repeat(' +
    GRID_SIZE.toString() + ', 1fr)');
  $puzzleContainer.css('grid-template-columns', 'repeat(' +
    GRID_SIZE.toString() + ', 1fr)');
  $puzzleContainer.css('grid-template-rows', 'repeat(' +
    GRID_SIZE.toString() + ', 1fr)');

  // create  squares
  var squareArr = new Array(GRID_SIZE * GRID_SIZE);
  for (var row = 0; row < GRID_SIZE; row++) {
    for (var col = 0; col < GRID_SIZE; col++) {
      var val = (GRID_SIZE * row + col + 1);
      squareArr[GRID_SIZE * row + col] =
        $('<button  class=\'puzzle-square\'>' + val + '</button>');
      squareArr[GRID_SIZE * row + col].attr('val', val);
    }
  }

  squareArr[squareArr.length - 1].addClass('empty-square');
  squareArr[squareArr.length - 1].html('blank square');

  // randomize square order, will be added to the grid in this random order
  shuffleArray(squareArr);

  for (var i = 0; i < squareArr.length; i++) {
    // mark current position in grid
    squareArr[i].attr('currrow', Math.floor(i / GRID_SIZE));
    squareArr[i].attr('currcol', Math.floor(i % GRID_SIZE));

    // give onclick event and square is ready to be put onto grid
    squareArr[i].click(squaresOnClick);
    $puzzleContainer.append(squareArr[i]);
  }

}

function squaresOnClick(event) {
  var $empty = $('.empty-square');
  var clickedR = $(this).attr('currrow');
  var clickedC = $(this).attr('currcol');
  var emptyR = $empty.attr('currrow');
  var emptyC = $empty.attr('currcol');

  // check if clicked square was the empty square
  if (clickedR === emptyR && clickedC === emptyC) {
    return;
  }

  // check if clicked square is in the same row or column as the empty square
  // if so then we have room to slide into the empty square, valid click
  if (clickedR === emptyR || clickedC === emptyC) {
    slide($(this), $empty);
    setPuzzleDesc();
    startTimer();

    if (confirmSquareLocation($empty)) {
      // setTimeout prevents win alert from firing before slide is complete
      setTimeout(checkWin, 0);
    }
  }
}
function slide($clicked, $empty) {
  var $toMove = null;
  // right slide
  if ($clicked.attr('currrow') == $empty.attr('currrow') &&
      $clicked.attr('currcol') < $empty.attr('currcol')) {
    /* 	select squares to
    $toMove starts with $clicked
    includes all squares to the right of $clicked and to the left of $empty
    ends with $empty */
    $toMove = $('.puzzle-square[currrow=\'' +
      $clicked.attr('currrow').toString() + '\']').filter(function() {
        return $(this).attr('currcol') >= $clicked.attr('currcol') &&
        $(this).attr('currcol') <= $empty.attr('currcol');
      });

    slideSquares($toMove.toArray(), 'right');
  }

  // left slide
  else if ($clicked.attr('currrow') == $empty.attr('currrow') &&
    $clicked.attr('currcol') > $empty.attr('currcol')) {
    /* 	select squares to move
    $toMove starts with $empty,
    includes all squares to the right of $empty and to the left of $clicked,
    ends with $clicked */
    $toMove = $('.puzzle-square[currrow=\'' +
      $clicked.attr('currrow').toString() + '\']').filter(function() {
        return $(this).attr('currcol') <= $clicked.attr('currcol') &&
        $(this).attr('currcol') >= $empty.attr('currcol');
      });

    slideSquares($toMove.toArray(), 'left');
  }

  // up slide
  else if ($clicked.attr('currcol') == $empty.attr('currcol') &&
        $clicked.attr('currrow') > $empty.attr('currrow')) {
    /* 	select squares to move
    $toMove starts with $clicked,
    includes all squares to above $clicked and beneath $empty,
    ends with $empty */
    $toMove = $('.puzzle-square[currcol=\'' +
      $clicked.attr('currcol').toString() + '\']').filter(function() {
        return $(this).attr('currrow') <= $clicked.attr('currrow') &&
        $(this).attr('currrow') >= $empty.attr('currrow');
      });

    slideSquares($toMove.toArray(), 'up');
  }
  // down slide
  else if ($clicked.attr('currcol') == $empty.attr('currcol') &&
        $clicked.attr('currrow') < $empty.attr('currrow')) {
    /* 	select squares to move
    $toMove starts with $empty,
    includes all squares above $empty and beneath $clicked,
    ends with $clicked */
    $toMove = $('.puzzle-square[currcol=\'' +
      $clicked.attr('currcol').toString() + '\']').filter(function() {
        return $(this).attr('currrow') >= $clicked.attr('currrow') &&
        $(this).attr('currrow') <= $empty.attr('currrow');
      });

    slideSquares($toMove.toArray(), 'down');
  }

  $empty.removeClass('empty-square');
  $clicked.addClass('empty-square');

  // if we moved tiles increment move counter
  if ($toMove) {
    /* - 1 because $toMove includes moved squares and empty square */
    updateMoveCounter($toMove.length - 1);
  }
}

/* arr is an array of squares that need to be slid by 1
   dir is direction they should be slid (up/down/left/right) */
function slideSquares(arr, dir) {
  if (dir == 'right' || dir == 'down') {
    arr.reverse();
  }

  var temp = [$(arr[0]).attr('val'),
    $(arr[0]).html()];

  for (var i = 0; i < arr.length - 1; i++) {
    $(arr[i]).attr('val', $(arr[i + 1]).attr('val'));
    $(arr[i]).html($(arr[i + 1]).html());
  }

  $(arr[arr.length - 1]).attr('val', temp[0]);
  $(arr[arr.length - 1]).html(temp[1]);
}

function checkWin() {
  if (isWin()) {
    doWin();
  } else {
    doNoWin();
  }
}

/* for each square calculate which in row and column the square will end up
     when the game is won.
  if any square is not its correct row and column the game is not yet won.
  if no square is out of place the game is won. */
function isWin() {
  var squares = $('.puzzle-square');

  /*  in each iteration check the ith square and the ith from last.
      since most of the time this puzzle will be solved in order or in reverse
        this should more quickly find if part of the puzzle is out of order */
  for (var i = 0; 2 * i < squares.length - 1; i++) {
    if (!confirmSquareLocation(squares[i]) ||
      !confirmSquareLocation(squares[squares.length - (1 + i)])) {
      return false;
    }
  }

  return true;
}

/*calculate in which row and column the square will end up
     when the game is won.
  return true if square is in that position else return false*/
function confirmSquareLocation(square) {
  var val = $(square).attr('val');

  return getDestRow(val) == $(square).attr('currrow') &&
    getDestCol(val) == $(square).attr('currcol');
}

function getDestRow(val) {
  return Math.floor((val - 1) / GRID_SIZE);
}

function getDestCol(val) {
  return (val - 1) % GRID_SIZE;
}

function doWin() {
  stopTimer();
  alert('win! time: ' + getTime());
}

function doNoWin() {

}

/* stolen:
https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function updateMoveCounter(numMoved) {
  var $counter = $('#move-count');
  if (ONE_CLICK_ONE_MOVE) {
    numMoved = 1;
  }
  $counter.html((parseInt($counter.html()) + numMoved).toString());
}

var secondsElapsed = 0;
var timerInterval = null;
function startTimer() {
  if (!timerIsRunning()) {
    timerInterval = window.setInterval(updateTimer, 1000);
  }
}

function stopTimer() {
  window.clearInterval(timerInterval);
  timerInterval = null;
}

function timerIsRunning() {
  return timerInterval ? true : false;
}

function updateTimer() {
  secondsElapsed++;
  $('#timer').html(getTime());
}

/* returns string with current time broken into seconds, minutes, and hours */
function getTime() {
  let minutesElapsed = Math.floor(secondsElapsed / 60) % 60;
  let hoursElapsed = Math.floor(secondsElapsed / 3600);

  return (hoursElapsed ? hoursElapsed.toString() + 'h ' : '') +
  (minutesElapsed || hoursElapsed ? minutesElapsed.toString() + 'm ' : '')  +
  (secondsElapsed % 60).toString() + 's';;
}

function setPuzzleDesc() {
  let $puzzleDesc = $('#puzzle-desc');
  let $squares = $('.puzzle-square');
  let txt = '';
  $squares.each(function(index) {
    if (index % GRID_SIZE == 0) {
      txt += 'Row ' + (Math.floor(index / GRID_SIZE) + 1).toString() + ' ';

    }
    txt += $(this).html() + ' ';
  });
  $puzzleDesc.html(txt);
}

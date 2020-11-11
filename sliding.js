// todo:
// fix font and reduce space when doing a really large puzzle like 16x16
// replace currcol,currrow with one value
// find out if animation can continue while alert is on screen
// puzzle research: is every configuration solvable?
// give some GRID_SIZE options and option for ONE_CLICK_ONE_MOVE

class Rules {
  static GS = 4;
  static SIZE_OPTIONS = [3,4,5];
  static gridSize() {
    var selRad = $('input:radio[name=\'grSize\']:checked');
    var selVal = parseInt(selRad.val());
    if (!selVal || selVal != this.GS) {
      this.GS = (Rules.SIZE_OPTIONS.includes(selVal)) ? selVal : 4;
      $('#grSize' + this.GS.toString()).attr('checked', true);
    }
    return this.GS;
  }
}

// idea class with static getter method and GRID_SIZE property
// if getter is called and selected value is different from GRID_SIZE reset resetGame
// else return value
// when radio button is changed just need to try getting the value
/* ONE_CLICK_ONE_MOVE:
   true: increment the move counter by one with each move,
     even if that move slides multiple squares
   false: increment the counter by the number of squres moved with each click */
const ONE_CLICK_ONE_MOVE = true;

$(function() {
  createGame();
  $('#reset').click(resetGame);
  $('input:radio[name=\'grSize\']').change(function(e) {resetGame();});
});

function createGame() {
  createBoard();
  createCorrectPosStyles();
  createKeyBindings();
}

function deleteGame() {
  deleteKeyBindings();
  deleteCorrectPosStyles();
  deleteBoard();
}

function resetGame() {
  resetMoveCounter();
  resetTimer();
  deleteGame();
  createGame();
}

function createBoard() {
  $puzzleContainer = $('#puzzle-container');

  // set grid size
  $puzzleContainer.css('grid-template-columns', 'repeat(' +
    Rules.gridSize().toString() + ', minmax(0, 1fr))');
  $puzzleContainer.css('grid-template-rows', 'repeat(' +
    Rules.gridSize().toString() + ', minmax(0, 1fr))');

  // create  squares
  var squareArr = new Array(Rules.gridSize() * Rules.gridSize());
  for (var row = 0; row < Rules.gridSize(); row++) {
    for (var col = 0; col < Rules.gridSize(); col++) {
      var val = (Rules.gridSize() * row + col + 1);
      squareArr[Rules.gridSize() * row + col] =
        $('<button  class=\'puzzle-square\'>' + val + '</button>');
      squareArr[Rules.gridSize() * row + col].attr('val', val);
    }
  }

  squareArr[squareArr.length - 1].addClass('empty-square');
  squareArr[squareArr.length - 1].html('blank square');

  var inOrder = true;
  while (inOrder) {
    // randomize square order, will be added to the grid in this random order
    shuffleArray(squareArr);
    for (var i = 0; i < squareArr.length; i++) {
      if (parseInt($(squareArr[i]).attr('val')) != (i + 1)) {
        inOrder = false;
        break;
      }
    }
  }

  for (var i = 0; i < squareArr.length; i++) {
    // mark current position in grid
    squareArr[i].attr('currrow', Math.floor(i / Rules.gridSize()));
    squareArr[i].attr('currcol', Math.floor(i % Rules.gridSize()));

    // mark starting position for css translation
    squareArr[i].attr('startPosVal', i + 1);

    // give onclick event and square is ready to be put onto grid
    squareArr[i].mousedown(squaresOnMouseDown);
    squareArr[i].keydown(function(e) {
      if (e.keyCode == 13 || e.keyCode == 32) {
        squaresOnMouseDown.apply($(this), e);
      }
    });
    $puzzleContainer.append(squareArr[i]);
  }

  setPuzzleDesc();
  setTabOrder();
}

function deleteBoard() {
  $('.puzzle-square').remove();
  setPuzzleDesc();
  setTabOrder();
}

function setPuzzleDesc() {
  let $puzzleDesc = $('#puzzle-desc');
  let $squares = $('.puzzle-square');
  let txt = '';

  for (var row = 0; row < Rules.gridSize(); row++) {
    txt += 'Row ' + (row + 1).toString() + ' ';
    for (var col = 0; col < Rules.gridSize(); col++) {
      txt += $squares.filter(
        '[currrow=\'' + row.toString() + '\'][currcol=\'' + col.toString() +
        '\']').html() + ' ';
    }
  }

  if (!txt) {
    txt = 'Error: Board is empty. Click reset or refresh the page.';
  }

  $puzzleDesc.html(txt.trimEnd());
}

function setTabOrder() {
  let $puzzleContainer = $('#puzzle-container');
  let ti = parseInt($puzzleContainer.attr('tabindex')) + 1;
  let $squares = $puzzleContainer.find('.puzzle-square');
  for (var row = 0; row < Rules.gridSize(); row++) {
    for (var col = 0; col < Rules.gridSize(); col++) {
      $squares.filter('[currrow=\'' + row.toString() + '\'][currcol=\'' +
      col.toString() + '\']').attr('tabindex', ti++);
    }
  }
}

function createCorrectPosStyles() {
  // create rules to change style when square is in the correct position
  for (var i = 0; i < Rules.gridSize() * Rules.gridSize(); i++) {
    $('<style type=\'text/css\' id=\'correctPosStyle' + i.toString() +
    '\'>.puzzle-square:not(.empty-square)[val=\'' + (i + 1) + '\']' +
    '[currrow=\'' + getRowByVal(i + 1) + '\'][currcol=\'' +
    getColByVal(i + 1) + '\']' + '{ background-color:#fb3fd685; }' +
    '</style>').appendTo('head');
  }
}

function deleteCorrectPosStyles() {
  $('[id^=correctPosStyle]').remove();
}

function createKeyBindings() {
  $(document).keyup(docOnKeyUp);
}

function deleteKeyBindings() {
  $(document).off('keyup', docOnKeyUp);
}

function docOnKeyUp(event) {
  if ($(':focus').is('input:radio')) {
    // do not interupt normal keyboard control of radio buttons
    return;
  }

  var $empty = $('.empty-square');
  var $adj = null;
  console.log(event);
  switch (event.keyCode) {
    case 37:
      //left
      $adj = $('.puzzle-square[currrow = \'' +
        $empty.attr('currrow') + '\'][currcol=\'' +
        (parseInt($empty.attr('currcol')) - 1).toString() + '\']');
    break;
    case 38:
      //up
      $adj = $('.puzzle-square[currcol = \'' +
        $empty.attr('currcol') + '\'][currrow=\'' +
        (parseInt($empty.attr('currrow')) - 1).toString() + '\']');
    break;
    case 39:
      //right
      $adj = $('.puzzle-square[currrow = \'' +
        $empty.attr('currrow') + '\'][currcol=\'' +
        (parseInt($empty.attr('currcol')) + 1).toString() + '\']');
    break;
    case 40:
      //down
      $adj = $('.puzzle-square[currcol = \'' +
        $empty.attr('currcol') + '\'][currrow=\'' +
        (parseInt($empty.attr('currrow')) + 1).toString() + '\']');
    break;
    default:
      return; // do not do anything if key was not an arrow
  }

  if ($adj.length) {
    $adj.focus();
    $adj.mousedown();

  }
}

function squaresOnMouseDown(event) {
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
    setTabOrder();
    startTimer();

    if (confirmSquareLocation($empty)) {
      // setTimeout prevents win alert from firing before slide is complete
      // todo this doesn't seem to be working right
      setTimeout(checkWin, 0);
    }
  }
}

function slide($clicked, $empty) {
  var $toMove = null;
  var dir = '';
  if ($clicked.attr('currrow') == $empty.attr('currrow')) {
    if ($clicked.attr('currcol') < $empty.attr('currcol')) {
      dir = 'right';
    } else {
      dir = 'left';
    }
  } else if ($clicked.attr('currrow') > $empty.attr('currrow')) {
    dir = 'up';
  } else {
    dir = 'down';
  }

  $toMove = $('.puzzle-square').filter(function() {
      switch (dir) {
        case 'right':
          return $(this).attr('currrow') == $($clicked).attr('currrow') &&
          $(this).attr('currcol') >= $clicked.attr('currcol') &&
          $(this).attr('currcol') <= $empty.attr('currcol');
        break;
        case 'left':
          return $(this).attr('currrow') == $($clicked).attr('currrow') &&
          $(this).attr('currcol') <= $clicked.attr('currcol') &&
          $(this).attr('currcol') >= $empty.attr('currcol');
        break;
        case 'up':
          return $(this).attr('currcol') == $($clicked).attr('currcol') &&
          $(this).attr('currrow') <= $clicked.attr('currrow') &&
          $(this).attr('currrow') >= $empty.attr('currrow');
        break;
        case 'down':
          return $(this).attr('currcol') == $($clicked).attr('currcol') &&
          $(this).attr('currrow') >= $clicked.attr('currrow') &&
          $(this).attr('currrow') <= $empty.attr('currrow');
        break;
      }
    });

  // if we can move, move and update counter
  if ($toMove) {
    slideSquares($toMove.toArray(), dir);
    /* - 1 because $toMove includes moved squares and empty square
      if ONE_CLICK_ONE_MOVE is false then
      we do not want to include moving the empty square as a move
    */
    updateMoveCounter($toMove.length - 1);
  }
}

/* arr is an array of squares that need to be slid by 1
   dir is direction they should be slid (up/down/left/right)
   first change either currrow or currcol for each square
   move empty square to whichever end it now belongs depending on dir
   do all transitions so that squares appear in the right location
    */

/* todo can we check if clicked square is adj to empty for speed at all */
function slideSquares(arr, dir) {
  var currVals = new Array(arr.length);
  var sign = (dir == 'up' || dir == 'left') ? -1 : 1;
  var changeAttr = (dir == 'up' || dir == 'down') ? 'currrow' : 'currcol';
  for (var i = 0; i < arr.length; i++) {
    var curr = parseInt($(arr[i]).attr(changeAttr));
    currVals[i] = curr;
    $(arr[i]).attr(changeAttr, curr + (1 * sign));
  }

  $('.empty-square').attr(changeAttr,
    sign > 0 ? Math.min(...currVals) : Math.max(...currVals));

  for (var i = 0; i < arr.length; i++) {
    $(arr[i]).css({'transform': getTranslateString($(arr[i]), dir)});
  }
}

/* returns transform css value string */
function getTranslateString($square, dir) {
  var squareMargin =
    parseInt($('.puzzle-square').css('margin').replace('px', ''));
  var ret = 'translate(calc({0} + {1}), calc({2} + {3}))';
  var distX = $square.attr('currcol') -
    getColByVal($square.attr('startPosVal'));
  var distY = $square.attr('currrow') -
    getRowByVal($square.attr('startPosVal'));

  ret = ret.replace('{0}', distX.toString() + '00%');
  ret = ret.replace('{1}', distX ?
    (2 * squareMargin * distX).toString() + 'px' : '0px');
  ret = ret.replace('{2}', distY.toString() + '00%');
  ret = ret.replace('{3}', distY ?
    (2 * squareMargin * distY).toString() + 'px' : '0px');

  return ret;
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

  return getRowByVal(val) == $(square).attr('currrow') &&
    getColByVal(val) == $(square).attr('currcol');
}

function getRowByVal(val) {
  return Math.floor((val - 1) / Rules.gridSize());
}

function getColByVal(val) {
  return (val - 1) % Rules.gridSize();
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

var moveCount = 0;
function updateMoveCounter(numMoved) {
  if (ONE_CLICK_ONE_MOVE) {
    numMoved = 1;
  }
  moveCount = moveCount + numMoved;
  $('#move-count').html(moveCount.toString());
}

function resetMoveCounter() {
  moveCount = 0;
  $('#move-count').html('0');
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

/* returns string with current time broken into seconds, minutes, and hours */
function getTime() {
  let minutesElapsed = Math.floor(secondsElapsed / 60) % 60;
  let hoursElapsed = Math.floor(secondsElapsed / 3600);

  return (hoursElapsed ? hoursElapsed.toString() + 'h ' : '') +
  (minutesElapsed || hoursElapsed ? minutesElapsed.toString() + 'm ' : '')  +
  (secondsElapsed % 60).toString() + 's';;
}

function updateTimer() {
  secondsElapsed++;
  $('#timer').html(getTime());
}

function resetTimer() {
  stopTimer();
  secondsElapsed = 0;
  $('#timer').html(getTime());
}

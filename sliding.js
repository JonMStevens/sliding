class Rules {
  /* grid size i.e. 3 will create 3x3 grid */
  static GS = 4;
  static SIZE_OPTIONS = [3, 4, 5];
  static gridSize() {
    const selRad = $("input:radio[name='grSize']:checked");
    const selVal = parseInt(selRad.val());
    if (!selVal || selVal != this.GS) {
      this.GS = Rules.SIZE_OPTIONS.includes(selVal) ? selVal : 4;
      $('#grSize' + this.GS.toString()).attr('checked', true);
    }
    return this.GS;
  }
}

$(function () {
  createMenu();
  createGame();
  $('#reset').click(resetGame);
  $('input:radio').change(function () {
    resetGame();
  });
});

function createGame() {
  createBoard();
  createCorrectPosStyles();
  createDynamicStyles();
  createKeyBindings();
}

function deleteGame() {
  deleteKeyBindings();
  deleteCorrectPosStyles();
  deleteBoard();
}

function createMenu() {
  const $divGrSize = $('#divGrSize');
  $divGrSize.append("<span class='spanGrSize'>board size: </span>");
  const $tabItems = $('[tabindex]');

  // max tab index should be higher than any radio buttons, should probably be reset button
  const firstTabIndex =
    Math.max.apply(
      Math,
      $tabItems.map(function () {
        return parseInt($(this).attr('tabindex'));
      })
    ) - Rules.SIZE_OPTIONS.length;
  const menuItems = Rules.SIZE_OPTIONS.map((size, i) => {
    return (
      "<input type='radio' name='grSize' id='grSize" +
      size.toString() +
      "' value='" +
      size.toString() +
      "' tabindex='" +
      (firstTabIndex + i).toString() +
      "'/>" +
      "<label for='grSize" +
      size.toString() +
      "'>" +
      size.toString() +
      '</label>'
    );
  });
  $divGrSize.append(menuItems.join(''));

  $('#grSize' + Rules.GS.toString()).attr('checked', true);
}

function deleteMenu() {
  $('#divGrSize').empty();
}

function resetGame() {
  resetMoveCounter();
  resetTimer();
  deleteGame();
  createGame();
}

function createBoard() {
  const $puzzleContainer = $('#puzzle-container');

  // set grid size
  $puzzleContainer.css(
    'grid-template-columns',
    'repeat(' + Rules.gridSize().toString() + ', minmax(0, 1fr))'
  );
  $puzzleContainer.css(
    'grid-template-rows',
    'repeat(' + Rules.gridSize().toString() + ', minmax(0, 1fr))'
  );

  // create  squares
  const squareArr = new Array(Rules.gridSize() * Rules.gridSize());
  for (let row = 0; row < Rules.gridSize(); row++) {
    for (let col = 0; col < Rules.gridSize(); col++) {
      const val = Rules.gridSize() * row + col + 1;
      squareArr[Rules.gridSize() * row + col] = $(
        "<button  class='puzzle-square'>" + val + '</button>'
      );
      squareArr[Rules.gridSize() * row + col].attr('val', val);
    }
  }

  squareArr[squareArr.length - 1].addClass('empty-square');
  squareArr[squareArr.length - 1].html('blank square');

  var inOrder = true;
  var solvable = false;
  while (inOrder || !solvable) {
    // randomize square order, will be added to the grid in this random order
    shuffleArray(squareArr);
    inOrder = squareArr.every((sq, i) => {
      return parseInt($(sq).attr('val')) == i + 1;
    });
    solvable = isSolvable(squareArr);
  }

  for (let i = 0; i < squareArr.length; i++) {
    // mark current position in grid
    squareArr[i].attr('currrow', Math.floor(i / Rules.gridSize()));
    squareArr[i].attr('currcol', Math.floor(i % Rules.gridSize()));

    // mark starting position for css translation
    squareArr[i].attr('startPosVal', i + 1);

    // give onclick event and square is ready to be put onto grid
    squareArr[i].mousedown(squaresOnMouseDown);
    squareArr[i].keydown(function (e) {
      if (e.keyCode == 13 || e.keyCode == 32) {
        squaresOnMouseDown.apply($(this));
      }
    });
    $puzzleContainer.append(squareArr[i]);
  }

  setPuzzleDesc();
  setTabOrder();
}

//https://www.geeksforgeeks.org/check-instance-15-puzzle-solvable/
function isSolvable(squareArr) {
  const valArr = [];
  let emptyR = -1;
  for (let i = 0; i < squareArr.length; i++) {
    const sq = squareArr[i];

    // blank square row needs to be known,
    // but blank square should not be included in finding the number of inversions
    if ($(sq).hasClass('empty-square')) {
      emptyR = Math.floor(i / Rules.gridSize());
    } else {
      valArr.push(parseInt($(sq).attr('val')));
    }
  }

  const inversions = mergeSortWithInversions(valArr)[1];

  /* empty square is in the ith last row
  e.g.  if empty is in 4th row of a 4 row grid it is 1st last,
        if empty is in 2nd row of a 4 row grid it is 3rd last
  */
  const ithLast = Rules.gridSize() - emptyR;
  return (
    (Rules.gridSize() % 2 == 1 && inversions % 2 == 0) ||
    (Rules.gridSize() % 2 == 0 && inversions % 2 != ithLast % 2)
  );
}

/* merge sort which also counts number of inversions
  we do not need the sorted array but this takes nlogn which i think is best
  returns array of results: [0] is sorted array, [1] is inversion count
  partially stolen from https://www.geeksforgeeks.org/counting-inversions/ */
function mergeSortWithInversions(arr) {
  if (!arr) {
    return [[], 0];
  }
  if (arr.length < 2) {
    return [arr, 0];
  }

  const mid = Math.floor(arr.length / 2);
  const left = mergeSortWithInversions(arr.slice(0, mid));
  const right = mergeSortWithInversions(arr.slice(mid));

  let li = 0;
  let ri = 0;
  const ret = [];
  let retInv = left[1] + right[1];

  while (li < left[0].length && ri < right[0].length) {
    if (left[0][li] <= right[0][ri]) {
      ret.push(left[0][li++]);
    } else {
      ret.push(right[0][ri++]);
      retInv += left[0].length - li;
    }
  }

  while (li < left[0].length) {
    ret.push(left[0][li++]);
  }
  while (ri < right[0].length) {
    ret.push(right[0][ri++]);
  }

  return [ret, retInv];
}

function deleteBoard() {
  $('.puzzle-square').remove();
  setPuzzleDesc();
}

function setPuzzleDesc() {
  const $puzzleDesc = $('#puzzle-desc');
  const $squares = $('.puzzle-square');
  let txt = '';

  for (let row = 0; row < Rules.gridSize(); row++) {
    txt += 'Row ' + (row + 1).toString() + ' ';
    for (let col = 0; col < Rules.gridSize(); col++) {
      txt +=
        $squares
          .filter(
            "[currrow='" +
              row.toString() +
              "'][currcol='" +
              col.toString() +
              "']"
          )
          .html() + ' ';
    }
  }

  if (!txt) {
    txt = 'Error: Board is empty. Click reset or refresh the page.';
  }

  $puzzleDesc.html(txt.trimEnd());
}

function setTabOrder() {
  const $puzzleContainer = $('#puzzle-container');
  let ti = parseInt($puzzleContainer.attr('tabindex')) + 1;
  const $squares = $puzzleContainer.find('.puzzle-square');
  for (let row = 0; row < Rules.gridSize(); row++) {
    for (let col = 0; col < Rules.gridSize(); col++) {
      $squares
        .filter(
          "[currrow='" + row.toString() + "'][currcol='" + col.toString() + "']"
        )
        .attr('tabindex', ti++);
    }
  }

  $('#stats')
    .children()
    .each((index, $element) => {
      $($element).attr('tabindex', ti++);
    });

  $('#divGrSize')
    .children('input')
    .each((index, $element) => {
      $($element).attr('tabindex', ti++);
    });

  $('#reset').attr('tabindex', ti);
}

function createCorrectPosStyles() {
  const correctPosArr = Array.apply(null, Array(Rules.gridSize() ** 2)).map(
    (x, i) =>
      ".puzzle-square:not(.empty-square)[val='" +
      (i + 1) +
      "']" +
      "[currrow='" +
      getRowByVal(i + 1) +
      "'][currcol='" +
      getColByVal(i + 1) +
      "']" +
      '{ background-color: var(--square-correct-bg-color); color: var(--square-correct-color); }'
  );

  $('head').append(
    "<style type='text/css' id='correctPosStyles'>" +
      correctPosArr.join('') +
      '</style>'
  );
}

function deleteCorrectPosStyles() {
  $('[id^=correctPosStyle]').remove();
}

function getFontSize() {
  return Rules.gridSize() <= 5 ? 3 : 15 / Rules.gridSize();
}

function getMarginSize() {
  return Math.min(Math.max(15 - Rules.gridSize(), 1), 10);
}

function createDynamicStyles() {
  $(
    `<style type='text/css' id='dynamicStyles'>button { font-size: ${getFontSize()}rem; } .puzzle-square {margin: ${getMarginSize()}px}</style>`
  ).appendTo('head');
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

  const $empty = $('.empty-square');
  let $adj = null;
  switch (event.keyCode) {
    case 37:
      //left
      $adj = $(
        ".puzzle-square[currrow = '" +
          $empty.attr('currrow') +
          "'][currcol='" +
          (parseInt($empty.attr('currcol')) - 1).toString() +
          "']"
      );
      break;
    case 38:
      //up
      $adj = $(
        ".puzzle-square[currcol = '" +
          $empty.attr('currcol') +
          "'][currrow='" +
          (parseInt($empty.attr('currrow')) - 1).toString() +
          "']"
      );
      break;
    case 39:
      //right
      $adj = $(
        ".puzzle-square[currrow = '" +
          $empty.attr('currrow') +
          "'][currcol='" +
          (parseInt($empty.attr('currcol')) + 1).toString() +
          "']"
      );
      break;
    case 40:
      //down
      $adj = $(
        ".puzzle-square[currcol = '" +
          $empty.attr('currcol') +
          "'][currrow='" +
          (parseInt($empty.attr('currrow')) + 1).toString() +
          "']"
      );
      break;
    default:
      return; // do not do anything if key was not an arrow
  }

  if ($adj.length) {
    $adj.focus();
    $adj.mousedown();
  }
}

function squaresOnMouseDown() {
  const $empty = $('.empty-square');
  const clickedR = $(this).attr('currrow');
  const clickedC = $(this).attr('currcol');
  const emptyR = $empty.attr('currrow');
  const emptyC = $empty.attr('currcol');

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
  let $toMove = null;
  let dir = '';
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

  $toMove = $('.puzzle-square').filter(function () {
    switch (dir) {
      case 'right':
        return (
          $(this).attr('currrow') == $($clicked).attr('currrow') &&
          $(this).attr('currcol') >= $clicked.attr('currcol') &&
          $(this).attr('currcol') <= $empty.attr('currcol')
        );
      case 'left':
        return (
          $(this).attr('currrow') == $($clicked).attr('currrow') &&
          $(this).attr('currcol') <= $clicked.attr('currcol') &&
          $(this).attr('currcol') >= $empty.attr('currcol')
        );
      case 'up':
        return (
          $(this).attr('currcol') == $($clicked).attr('currcol') &&
          $(this).attr('currrow') <= $clicked.attr('currrow') &&
          $(this).attr('currrow') >= $empty.attr('currrow')
        );
      case 'down':
        return (
          $(this).attr('currcol') == $($clicked).attr('currcol') &&
          $(this).attr('currrow') >= $clicked.attr('currrow') &&
          $(this).attr('currrow') <= $empty.attr('currrow')
        );
    }
  });

  // if we can move, move and update counter
  if ($toMove) {
    slideSquares($toMove.toArray(), dir);
    /* - 1 because $toMove includes moved squares and empty square
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
  let currVals = new Array(arr.length);
  const sign = dir == 'up' || dir == 'left' ? -1 : 1;
  const changeAttr = dir == 'up' || dir == 'down' ? 'currrow' : 'currcol';
  for (let i = 0; i < arr.length; i++) {
    const curr = parseInt($(arr[i]).attr(changeAttr));
    currVals[i] = curr;
    $(arr[i]).attr(changeAttr, curr + 1 * sign);
  }

  $('.empty-square').attr(
    changeAttr,
    sign > 0 ? Math.min(...currVals) : Math.max(...currVals)
  );

  for (let i = 0; i < arr.length; i++) {
    $(arr[i]).css({ transform: getTranslateString($(arr[i])) });
  }
}

/* returns transform css value string */
function getTranslateString($square) {
  const squareMargin = parseInt(
    $('.puzzle-square').css('margin-left').replace('px', '')
  );
  let ret = 'translate(calc({0} + {1}), calc({2} + {3}))';
  const distX =
    $square.attr('currcol') - getColByVal($square.attr('startPosVal'));
  const distY =
    $square.attr('currrow') - getRowByVal($square.attr('startPosVal'));

  ret = ret.replace('{0}', distX.toString() + '00%');
  ret = ret.replace(
    '{1}',
    distX ? (2 * squareMargin * distX).toString() + 'px' : '0px'
  );
  ret = ret.replace('{2}', distY.toString() + '00%');
  ret = ret.replace(
    '{3}',
    distY ? (2 * squareMargin * distY).toString() + 'px' : '0px'
  );

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
  const squares = $('.puzzle-square');

  /*  in each iteration check the ith square and the ith from last.
      since most of the time this puzzle will be solved in order or in reverse
        this should more quickly find if part of the puzzle is out of order */
  for (let i = 0; 2 * i < squares.length - 1; i++) {
    if (
      !confirmSquareLocation(squares[i]) ||
      !confirmSquareLocation(squares[squares.length - (1 + i)])
    ) {
      return false;
    }
  }

  return true;
}

/*calculate in which row and column the square will end up
     when the game is won.
  return true if square is in that position else return false*/
function confirmSquareLocation(square) {
  const val = $(square).attr('val');

  return (
    getRowByVal(val) == $(square).attr('currrow') &&
    getColByVal(val) == $(square).attr('currcol')
  );
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

function doNoWin() {}

/* stolen:
https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

var moveCount = 0;
var clickCount = 0;
function updateMoveCounter(numMoved) {
  moveCount += numMoved;
  clickCount++;
  $('#move-count').html(moveCount.toString());
  $('#click-count').html(clickCount.toString());
}

function resetMoveCounter() {
  moveCount = 0;
  clickCount = 0;
  $('#move-count').html('0');
  $('#click-count').html('0');
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
  return Boolean(timerInterval);
}

/* returns string with current time broken into seconds, minutes, and hours */
function getTime() {
  const minutesElapsed = Math.floor(secondsElapsed / 60) % 60;
  const hoursElapsed = Math.floor(secondsElapsed / 3600);

  return (
    (hoursElapsed ? hoursElapsed.toString() + 'h ' : '') +
    (minutesElapsed || hoursElapsed ? minutesElapsed.toString() + 'm ' : '') +
    (secondsElapsed % 60).toString() +
    's'
  );
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

// todo:
// remove text from empty square
// change win checker so function will stop looping when we determine no win
// allow for shifting multiple squres at once
// timer
// move counter
// win check without button
// research screen reader stuff
const GRID_SIZE = 4;
$(function() {
  createBoard();
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
      // squares are in correct order mark the intended/destination position
      var val = (GRID_SIZE * row + col + 1);
      squareArr[GRID_SIZE * row + col] =
        $('<button  class=\'puzzle-square\'>' + val + '</button>');
      squareArr[GRID_SIZE * row + col].attr('val', val);
    }
  }

  squareArr[squareArr.length - 1].addClass('empty-square');

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
  if (clickedR === emptyR && clickedC === emptyC) { return; }

  // check if clicked square is adjacent to empty
  if ((Math.abs(clickedR - emptyR) + Math.abs(clickedC - emptyC)) > 1) {
    return;
  }

  // check if clicked square is in the same row or column as the empty square
  // if so then we have room to slide into the empty square
  if (clickedR === emptyR || clickedC === emptyC) {
    slide($(this), $empty);
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
}

function slideSquares(arr, dir) {
  var temp = [$(arr[0]).attr('val'),
    $(arr[0]).attr('currrow'),
    $(arr[0]).attr('currcol'),
    $(arr[0]).html()];

  $(arr[0]).attr('val', $(arr[arr.length - 1]).attr('val'));
  //$(arr[0]).attr('currrow',$(arr[arr.length - 1]).attr('currrow'));
  //$(arr[0]).attr('currcol',$(arr[arr.length - 1]).attr('currcol'));
  $(arr[0]).html($(arr[arr.length - 1]).html());

  $(arr[arr.length - 1]).attr('val', temp[0]);
  //$(arr[arr.length - 1]).attr('currrow',temp[1]);
  //$(arr[arr.length - 1]).attr('currcol',temp[2]);
  $(arr[arr.length - 1]).html(temp[3]);

}

function alertWin() {
  alert(isWin() ? 'win' : 'no win');
}

function isWin() {
  /* for each square calculate which row and column the square will end up
       in when the game is won
    if a square is not its correct row and column the game is not yet won
    if no square is out of place the game is won */
  var w = true;
  $('.puzzle-square').each(function() {

      var destRow = Math.floor(($(this).attr('val') - 1) / GRID_SIZE);
      var destCol = ($(this).attr('val') - 1) % GRID_SIZE;

      if (destRow != $(this).attr('currrow') ||
          destCol != $(this).attr('currcol')) {
        w = false;
      }
    });

  return w;
}

/* stolen:
https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

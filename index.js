// main ring list
let rings = [];

// updating the scale if the user changes it
let notes = getScale();
$("#scaleInput").change(function(){
  notes = getScale();
});
$("#octave").change(function(){
  notes = getScale();
});

// updating the tempo if the user changes it
let tempo = $("#tempoInput").val();
$("#tempoText").html(`Tempo: ${tempo}bpm`);

$("#tempoInput").change(function(){
  tempo = $("#tempoInput").val();
  $("#tempoText").html(`Tempo: ${tempo}bpm`);
});

// creating a new synth
let vibrato = new Tone.Vibrato().toDestination();
let synth = new Tone.PolySynth(Tone.FMSynth).connect(vibrato);


class Ring {
  colors = ["red", "orange", "yellow", "green", "blue"];

  constructor(x, y, toPlayOrNot) {
    this.x = x;
    this.y = y;
    this.color = this.colors[Math.floor((this.y - $("#main").position().top) / $("#main").height() * this.colors.length)];
    this.attack = Math.floor((this.x - $("#main").position().left) / $("#main").width() * 16); // 16 beats per recursion
    this.draw(toPlayOrNot);
  }

  draw(toPlayOrNot) {
    // creating a new ring
    this.div = document.createElement("div");

    $(this.div).addClass("ring");

    // removable with a right mouse button click
    $(this.div).mousedown(e => {
      if (e.which === 3) {
        this.delete();
      };
    });

    $(this.div).css({
        "width": 0 + 'px',
        "height": 0 + 'px',
        "border-radius": 0 + 'px',
        "border": 0 + 'px solid ' + this.color,
        "left": this.x + 'px',
        "top": this.y + 'px'
    });

    $("#main").append(this.div);

    // playing the ring's note
    if (toPlayOrNot) {
      this.playNote();
    }

    // making sure the ring doesn't cross the borders of the screen
    const maxRingSize = 70; // in px
    const mainDivPosition = $("#main").position();

    if (this.x - maxRingSize / 2 < mainDivPosition.left) {
      this.x = mainDivPosition.left + 1;
    } else if (this.x + maxRingSize / 2 > $(window).width()) {
      this.x = $(window).width() - maxRingSize - 1;
    } else {
      this.x = (this.x - maxRingSize / 2)
    };

    if (this.y - maxRingSize / 2 < mainDivPosition.top) {
      this.y = mainDivPosition.top + 1;
    } else if (this.y + maxRingSize / 2 > $(window).height()) {
      this.y = $(window).height() - maxRingSize - 1;
    } else {
      this.y = (this.y - maxRingSize / 2);
    }


    // making the ring expand
    $(this.div).animate({
        width: maxRingSize + "px",
        height: maxRingSize + "px",
        borderRadius: maxRingSize + "px",
        borderWidth: 15 + "px",
        left: this.x / $(window).width() * 100 + "%",
        top: this.y / $(window).height() * 100 + "%"
    }, 500);
  }

  playNote() {
    let colorIndex = this.colors.indexOf(this.color);
    this.note = notes[colorIndex];
    synth.triggerAttackRelease(this.note, "16n");
  }

  blink() {
    let div = $(".ring").get(rings.indexOf(this));
    $(div).animate({
      borderWidth: 30 + "px",
    }, 100);
    $(div).animate({
      borderWidth: 15 + "px",
    }, 100);
  }

  delete() {
    this.div.remove();
    rings = rings.filter(ring => { return ring.x != this.x && ring.y != this.y; });
  }
}


// drawing a ring for every click on the window 
$("#main").click(function() {
  if (rings.length < 30) { 
    let mousePos = findMouseCoords();
    rings.push(new Ring(mousePos[0], mousePos[1], true));
  } else {
    $("#maxRings").css({
      "display": "flex"
    });
    setTimeout(function() { $("#maxRings").fadeOut(1000); }, 3000);
  }
});


function findMouseCoords(mouseEvent) {
  let xPos;
  let yPos;
  if (mouseEvent)
  {
    //FireFox
    xPos = mouseEvent.pageX;
    yPos = mouseEvent.pageY;
  }
  else
  {
    //IE
    xPos = window.event.x + document.body.scrollLeft - 2;
    yPos = window.event.y + document.body.scrollTop - 2;
  }

  return [xPos, yPos];
}


function getScale() {
  const scaleInput = $("#scaleInput").val();
  const octaveInput = $("#octave").val();
  let scale;

  if (scaleInput === "Major pentatonic") {
    scale = ['C', 'D', 'E', 'G', 'A'];
  } 
  else if (scaleInput === "Minor pentatonic") {
    scale = ['C', 'Eb', 'F', 'G', 'Bb'];
  } 
  else if (scaleInput === "Minor blues") {
    scale = ['C', 'Eb', 'F', 'Ab', 'Bb'];
  }  
  else if (scaleInput === "Major blues") {
    scale = ['C', 'D', 'F', 'G', 'A'];
  }  
  else if (scaleInput === "Suspended") {
    scale = ['C', 'D', 'F', 'G', 'Bb'];
  };

  scale.forEach(note => {
    scale[scale.indexOf(note)] = note + octaveInput;
  });

  showScaleNotes(scale);
  return scale;
}


function showScaleNotes(scale) {
  let output = `
    <span style=color:red>${scale[0]}</span>,
    <span style=color:orange>${scale[1]}</span>,
    <span style=color:yellow>${scale[2]}</span>,
    <span style=color:green>${scale[3]}</span>,
    <span style=color:blue>${scale[4]}</span>
  `;
  $("#scaleNotes").html(output);
}


function playTune() {
  // checking if the user inserted rings
  if (rings.length === 0) {
    alert("Please place some rings first!");
    return
  }

  // replacing the buttons
  $("#playButton").hide();
  $("#stopButton").show();

  Tone.Transport.bpm.value = parseInt(tempo);
  $("#tempoInput").change(function(){
    Tone.Transport.bpm.value = parseInt(tempo);
  });

  // creating a new sequence based on the position of the dots
  let seq = new Tone.Sequence(function(time, idx) {
    rings.forEach(ring => {
      if (ring.attack === idx) {
        ring.playNote();
        ring.blink();
      };
    });
  }, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15], "8n");

  Tone.Transport.start("+0.2");
  seq.start();

  $("#stopButton").click(function() {
    $("#playButton").show();
    $("#stopButton").hide();

    Tone.Transport.stop();
    seq.stop();
  });
}


function removeAll() {
  rings = [];
  let maxRingsPopup = $("#maxRings");
  $("#main").empty().append(maxRingsPopup);
}


function showInstructions() {
  $("#instructionsPopup").css({
    "display": "flex"
  })
}

function closeInstructions() {
  $("#instructionsPopup").css({
    "display": "none"
  })
}


function loadPreMadeTunes() {
  // pre-made tune by me
  function sixteenthNote(attack) {
    return $("#main").position().left + attack / 16 * $("#main").width();
  }

  function noteColor(pitch) {
  return $("#main").position().top + pitch / 5 * $("#main").height();
  }

  const preMadeTunes = {tune1: [[0, 0], [1, 1], [2, 2], [2, 3], [3, 0], [4, 1], [5, 2], [5, 4],[6, 0], [7, 1], [8, 2], [8, 3], [9, 0], [10, 1], [11, 2], [11, 4]],
                        tune2: [[0, 3], [0, 2], [3, 4], [6, 3], [10, 4], [12, 3], [13, 2], [14, 0], [0, 0], [2, 1], [4, 2], [10, 0], [12, 1]]
  };

  // clean slate
  removeAll();

  let choice = $("#preMadeSelect").val();
  
  rings = preMadeTunes[choice].map(note => {
    return new Ring(sixteenthNote(note[0]), noteColor(note[1]), false);
  });
}

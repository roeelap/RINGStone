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

  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.color = this.colors[Math.floor(y / $("#main").height() * this.colors.length)];
    this.attack = Math.floor(this.x / $("#main").width() * 16); // 16 beats per recursion
    this.draw(this.x, this.y);
  }

  draw(x, y) {
    console.log(rings);
    // get a color based of the mouse x coordinate

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
        "left": x + 'px',
        "top": y + 'px'
    });

    $("#main").append(this.div);

    // playing the ring's note
    this.playNote();

    // making the ring expand
    const maxRingSize = 70; // in vw
    $(this.div).animate({
        width: maxRingSize + "px",
        height: maxRingSize + "px",
        borderRadius: maxRingSize + "px",
        borderWidth: 15 + "px",
        left: x - maxRingSize / 2 + "px",
        top: y - maxRingSize / 2 + "px"
    }, 500);
  }

  playNote() {
    this.note = notes[Math.floor(this.y / $("#main").height() * notes.length)];
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
    console.log(rings);
  }
}


// drawing a ring for every click on the window 
$("#main").click(function() {
  if (rings.length < 30) { 
    let mousePos = findMouseCoords();
    rings.push(new Ring(mousePos[0], mousePos[1]));
  } else {
    $("#maxRings").css({
      "display": "flex"
    })
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
  else if (scaleInput === "Egyptian") {
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
  $("#main").empty();
}
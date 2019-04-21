// p5.func examples - fourier2_plot2
// I<3DM rld

var mic, synth, wf;

var FS = 44100; // sampling rate
var FFTSIZE = 1024; // FFT size
var WINDOWFUNC = 'hanning'; // window type

var x; // sig pointer
var gen;

var sig = new Array(FFTSIZE); // collector signal (input)
var win = new Array(FFTSIZE); // window function

var fft;
var phasedelta = new Array(FFTSIZE); // array for running phase
var prevphase = new Array(FFTSIZE); // array for previous phase
for(let i = 0;i<phasedelta.length;i++)
{
  phasedelta[i] = 0;
  prevphase[i] = 0;
}

var tb, tl; // textboxes
var pitch = 48;
var node;
var freq = 440;

function setup()
{
  createCanvas(800, 600);
  background(255);
  fill(0);

  textSize(18);

  x = 0;

  mic = new Tone.UserMedia();
  mic.open();
  synth = new Tone.Oscillator();
  synth.type = "sawtooth";
  synth.start();

  fft = new p5.FastFourierTransform(FFTSIZE, FS);
  fft.doFrequency = true;

  gen = new p5.Gen();

  win = gen.fillArray('window', FFTSIZE, WINDOWFUNC);

  tb = createDiv('');
  tb.style("font-family", "Courier");
  tb.style("font-size", "12px");
  tb.position(width*0.1, height*0.1);
  tb.size(500, 500);

  tl = createDiv('');
  tl.style("font-family", "Courier");
  tl.style("font-size", "12px");
  tl.style("align", "right");
  tl.position(width*0.91, height*0.2);
  tl.size(500, 500);

  node = Tone.context.createScriptProcessor(FFTSIZE, 1, 1);
  node.onaudioprocess = function (e) {
    //console.log(e);
    sig = e.inputBuffer.getChannelData(0);
    fft.forward(multiplyArray(sig, win));

    // update synthesizer:
    freq = Tone.Midi(pitch).toFrequency();
    //freq = fft.getBandFrequency(10) + 120.5;
    //freq = 1000;
    synth.frequency.value = freq;
    if(frameCount%100==0) {
      pitch=pitch+1;
      if(pitch>96) pitch=48;
    }
  };
  Tone.connect(node, Tone.context.destination, [inputNum=0], [outputNum=0]);
  //Tone.connect(mic, node, [inputNum=0], [outputNum=0]);
  Tone.connect(synth, node, [inputNum=0], [outputNum=0]);
}

function draw()
{
  background(255);

  fill(240);
  rect(width*0.1, height*0.2, width*0.8, height*0.7);

  var peaks = new Array(10);
  for(var i = 0;i<peaks.length;i++)
  {
    peaks[i] = 0;
  }
  // find 10 biggest
  spectsort = new Array(fft.magnitude.length);
  for(var i =0;i<spectsort.length;i++)
  {
    var p = new Array();
    p[0] = fft.magnitude[i].toFixed(6);
    p[1] = i;
    spectsort[i] = p;
  }
  spectsort.sort();
  spectsort.reverse();
  var topten = new Array(10);
  for(var i =0;i<10;i++)
  {
    var tt = {};
    tt.index = spectsort[i][1];
    tt.mag = spectsort[i][0];
    tt.phase = fft.phase[tt.index];
    tt.cf = fft.getBandFrequency(tt.index);
    tt.runningphase = fft.runningphase[tt.index];
    tt.freq = fft.frequency[tt.index];
    topten[i] = tt;
  }
  //console.log(topten);

  stroke(0);
  noFill();
  let rad=5;
  var ts = 'top ten:<br>';
  beginShape();
  for(var i in fft.magnitude)
  {
    var xlog = sqrt(map(i, 0, fft.magnitude.length-1, 0., 1.));
    var xs = map(xlog, 0, 1, width*0.1, width*0.9);
    var ys = map(sqrt(fft.magnitude[i]), 0, 0.707, height*0.9, height*0.2);
    vertex(xs, ys);
    noFill();
    rad = 5;
    for(var j in topten)
    {
      if(i==topten[j].index) {
        fill(255, 0, 0);
        ts+=topten[j].freq.toFixed(3)+'<br>';
        rad = 10;
      }
    }
    ellipse(xs, ys, rad, rad);
  }
  endShape();
  tl.html(ts);

  var hs = '';
  hs+= 'p5.FastFourierTransform()<br>';
  hs+= 'loudest partial:<br>';
  hs+= 'actual: ' + freq.toFixed(3) + ' est: ' + topten[0].freq.toFixed(3) + ' r: ' + topten[0].mag + ' θΔ: ' + topten[0].runningphase.toFixed(3);
  tb.html(hs);

}

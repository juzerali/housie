import { Random } from "random-js";

class ChromeSpeaker {
  constructor() {
      this.engine = new Random();
      this.eligibleVoices = window.speechSynthesis
          .getVoices()
          .filter((v) => v.lang.toLowerCase().startsWith("en"));
  }

  speak(number) {
      if(!number) return;
      number = number.toString();
      let msg = "";
      if(number.length < 2) {
          msg = "single number " + number;
      } else {
          msg = number.split("").join(" ");
          msg += ", " + number;
      }

      var msgObj = new SpeechSynthesisUtterance(msg);
      msgObj.voice = this.engine.pick(this.eligibleVoices);
      window.speechSynthesis.speak(msgObj);
  }

  speakFn(number) {
      return () => this.speak(number);
  }
}

export default ChromeSpeaker;

const int interruptPinA = 2;
const int interruptPinB = 3;
volatile int pos = 0;

void ISR_EncoderA() {
  if (digitalRead(interruptPinA) == digitalRead(interruptPinB)) {
    pos++;
  } else {
    pos--;
  }
}

void ISR_EncoderB() {
  if (digitalRead(interruptPinA) == digitalRead(interruptPinB)) {
    pos--;
  } else {
    pos++;
  }
}

void encoderSetup() {
    pinMode(interruptPinA, INPUT_PULLUP);
    pinMode(interruptPinB, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(interruptPinA), ISR_EncoderA, CHANGE);
    attachInterrupt(digitalPinToInterrupt(interruptPinB), ISR_EncoderB, CHANGE);
}

float getEncoderPos() {
  return pos;
}

void resetEncoderPos() {
  pos = 0;
}
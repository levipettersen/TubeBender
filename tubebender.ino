#include <LiquidCrystal.h>

#define ARDUINOJSON_ENABLE_COMMENTS 1
#include <ArduinoJson.h>

const int RS = 8;
const int EN = 9;
const int d4 = 4;
const int d5 = 5;
const int d6 = 6;
const int d7 = 7;
LiquidCrystal lcd(RS, EN, d4, d5, d6, d7);

const int PWMpin = 10;
int motorPin = 52;
int stopButtonPin = 45;
int startButtonPin = 41;
int dialPin = 37;
int emergencyPin = 33;
int valveRelayPin = 48;
int strainGaugePin = A14;
int pressureTransmitterPin = A13;
int ledPin1 = 23;
int ledPin2 = 25;
int ledPin3 = 27;
int ledPin4 = 29;



int valvePWM = 127;
unsigned long timestamp;
unsigned long starttime;
unsigned long serialtimestamp = 0;
unsigned long timesincelastserialin;

float encoderPos;
bool deserializationError;

bool motorOn = false;


int potpos;

// 1 is manual, 2 is automatic
int controlMode = 1;

bool startButtonState = false;
bool stopButtonState = false;
bool emergencyButtonState = false;
bool dialState = false;

bool angleReset = false;

int desiredBendAngle = 0;
int DSBA = 0;
bool initAB = false;

void setup() {
  Serial.begin(115200);
  encoderSetup();
  lcd.begin(16, 2);
  starttime = millis();

  lcd.print("Starting up");

  pinMode(PWMpin, OUTPUT);
  pinMode(motorPin, OUTPUT);
  pinMode(valveRelayPin, OUTPUT);

  pinMode(stopButtonPin, INPUT);
  pinMode(startButtonPin, INPUT);
  pinMode(dialPin, INPUT);
  pinMode(emergencyPin, INPUT);

  // pinMode(lcdPushButtonPin, INPUT);
  pinMode(strainGaugePin, INPUT);
  pinMode(pressureTransmitterPin, INPUT);

  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);
  pinMode(ledPin3, OUTPUT);
  pinMode(ledPin4, OUTPUT);

  controlMode = 1;
}

void loop() {
  timestamp = millis();
  stopButtonState = digitalRead(stopButtonPin);
  startButtonState = digitalRead(startButtonPin);
  dialState = digitalRead(dialPin);
  emergencyButtonState = digitalRead(emergencyPin);

  if (dialState) {
    if (controlMode == 2) {
      motorOn = false;
      valvePWM = 127;
    }
    controlMode = 1;
  } else {
    if (controlMode == 1) {
      motorOn = false;
      valvePWM = 127;
    }
    controlMode = 2;
  }

  lcd.clear();
  lcd.print("Control Mode:");
  lcd.setCursor(0, 1);

  switch(controlMode) {
    case 1:
      lcd.print("Manual");
      if (motorOn && !emergencyButtonState) {
        motorOn = !stopButtonState;
      } else if (!emergencyButtonState) {
        motorOn = startButtonState;
      }
      break;
    case 2:
      lcd.print("Automatic");
      break;
  }

  // Encoder calculations
  int pos_1 = getEncoderPos();
  lcd.print(" pos:");
  lcd.print(pos_1);
  // float floatPos = static_cast<float>(pos);
  encoderPos = -pos_1 * ( 3.0 / 20.0 );



  StaticJsonDocument<800> docOut;
  docOut["timestamp"] = timestamp;

  // potpos = analogRead(A15);
  // docOut["sensor"] = potpos;
  // docOut["lcdButton"] = lcdPushButtonCommand;
  docOut["encoderPos"] = encoderPos;
  docOut["strainGauge"] = analogRead(strainGaugePin);
  docOut["pressureTransmitter"] = analogRead(pressureTransmitterPin);
  docOut["stopButton"] = stopButtonState;
  docOut["startButton"] = startButtonState;
  docOut["dial"] = dialState;
  docOut["emergencyButton"] = emergencyButtonState;


  if (Serial.available() > 0) {
    // read the incoming byte:
    StaticJsonDocument<800> docIn;
    // DynamicJsonDocument docIn(2048);
    DeserializationError err = deserializeJson(docIn, Serial);
    serialtimestamp = millis();
    if (err == DeserializationError::Ok) {
      deserializationError = false;
      if (controlMode == 2) {
        valvePWM = docIn["valvePWM"].as<int>();
        motorOn = docIn["motorOn"].as<int>();
        angleReset = docIn["angleReset"].as<int>();
        // initAB = docIn["initAB"].as<int>();
        // desiredBendAngle = docIn["DBA"].as<int>();
        // DSBA = docIn["DSBA"];
      }
    } else {
      deserializationError = true;

      docOut["erorrmessage"] = err.c_str();

      // lost serial, turn off
      if (controlMode == 2) {
        lcd.clear();
        lcd.print("Deserialization");
        lcd.setCursor(0, 1);
        lcd.print("error");
        valvePWM = 127;
        motorOn = false;
      }
    }
  }

  if (angleReset) {
    resetEncoderPos();
  }

  if (serialtimestamp == 0) {
    serialtimestamp = starttime;
  }

  // if time since last incoming serial > 2 seconds, turn everything off
  timesincelastserialin = millis() - serialtimestamp;
  if (millis() - serialtimestamp > 2000 && controlMode == 2) {
    // lcd.clear();
    // lcd.print("no serial");
    valvePWM = 127;
    motorOn = false;
  }

  docOut["deserializationError"] = deserializationError;
  docOut["controlMode"] = controlMode;
  String jsonString;
  serializeJson(docOut, jsonString);
  Serial.println(jsonString);

  // Valve on/off control
  if (controlMode == 1) {
    digitalWrite(valveRelayPin, LOW);
  } else {
    digitalWrite(valveRelayPin, HIGH);
  }
  // Emergency handling
  if (emergencyButtonState) {
    motorOn = false;
    valvePWM = 127;
    digitalWrite(valveRelayPin, LOW);
  }

  // Motor on/off
  digitalWrite(motorPin, motorOn);
  
  // Motor speed
  analogWrite(PWMpin, valvePWM);

  digitalWrite(ledPin1, !motorOn);
  digitalWrite(ledPin2, motorOn);
  digitalWrite(ledPin3, controlMode-2);
  digitalWrite(ledPin4, HIGH);

}


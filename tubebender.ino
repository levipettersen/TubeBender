#include <LiquidCrystal.h>
#include <ArduinoJson.h>

const int RS = 8;
const int EN = 9;
const int d4 = 4;
const int d5 = 5;
const int d6 = 6;
const int d7 = 7;
LiquidCrystal lcd(RS, EN, d4, d5, d6, d7);

const int PWMpin = 10;
int valvePWM = 127;

int lcdPushButtonValue;
int lcdPushButtonPin = A0;
String lcdPushButtonCommand;

unsigned long timestamp;
unsigned long starttime;
unsigned long serialtimestamp = 0;
unsigned long timesincelastserialin;

float encoderPos;
bool deserializationError;

int motorPin = 52;
bool motorOn = false;


int potpos;

void setup() {
  Serial.begin(9600);
  encoderSetup();
  lcd.begin(16, 2);
  starttime = millis();

  lcd.print("Starting up");

  pinMode(motorPin, OUTPUT);
}

void loop() {

  

  timestamp = millis();

  lcdPushButtonValue = analogRead(lcdPushButtonPin);
  if (lcdPushButtonValue < 60){
    lcdPushButtonCommand = "Right";
  } else if(lcdPushButtonValue >= 60 && lcdPushButtonValue <= 200){
    lcdPushButtonCommand = "Up";
  } else if (lcdPushButtonValue >= 200 && lcdPushButtonValue <= 400){
      lcdPushButtonCommand = "Down";
  } else if (lcdPushButtonValue >= 400 && lcdPushButtonValue <= 600){
    lcdPushButtonCommand = "Left";
  } else if (lcdPushButtonValue >= 600 && lcdPushButtonValue <= 800){
    lcdPushButtonCommand = "Select";
  } else {
    lcdPushButtonCommand = "None";
  }

  encoderPos = getEncoderPos() * 3 / 20;
  StaticJsonDocument<200> docOut;
  docOut["timestamp"] = timestamp;

  potpos = analogRead(A15);
  docOut["sensor"] = potpos;
  docOut["lcdButton"] = lcdPushButtonCommand;
  docOut["encoderPos"] = encoderPos;
  docOut["strainGauge"] = analogRead(A14);
  docOut["pressureTransmitter"] = analogRead(A13);
  
  if (Serial.available() > 0) {
    // read the incoming byte:
    StaticJsonDocument<300> docIn;
    DeserializationError err = deserializeJson(docIn, Serial);

    serialtimestamp = millis();

    if (err == DeserializationError::Ok) {

      deserializationError = false;

      valvePWM = docIn["valvePWM"];
      motorOn = docIn["motorOn"];

      lcd.clear();
      //lcd.print(docIn["counter"].as<String>());
      lcd.print(valvePWM);

      lcd.setCursor(0, 1);
      //lcd.print(docIn["textInput"].as<String>());
      lcd.print(motorOn);
    } else {
      deserializationError = true;
      lcd.clear();
      lcd.print("Deserialization");
      lcd.setCursor(0, 1);
      lcd.print("error");

      valvePWM = 128;
      motorOn = false;
    }
  }

  if (serialtimestamp == 0) {
    serialtimestamp = starttime;
  }

  // if time since last incoming serial > 2 seconds, turn everything off
  timesincelastserialin = millis() - serialtimestamp;
  if (millis() - serialtimestamp > 2000) {
    lcd.clear();
    lcd.print("no serial");

    valvePWM = 128;
    motorOn = false;
  }

  docOut["deserializationError"] = deserializationError;
  String jsonString;
  serializeJson(docOut, jsonString);
  Serial.println(jsonString);

  analogWrite(PWMpin, valvePWM);

  digitalWrite(motorPin, motorOn);

}
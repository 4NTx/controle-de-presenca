#define SS_PIN 15  // D8
#define RST_PIN 16 // D0

#include <SPI.h>
#include <MFRC522.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

WiFiClient wifiClient;
MFRC522 mfrc522(SS_PIN, RST_PIN);
const char* ssid = "negocio";
const char* password = "negocio123";

void setup() {
  pinMode(5, OUTPUT);
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  SPI.begin();
  mfrc522.PCD_Init();

  while (WiFi.status() != WL_CONNECTED) {
    delay(1500);
    Serial.println("Aguardando conexão com WiFi...");
  }
  Serial.println("Conectado ao WiFi!");
}
 
void loop() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    delay(500);
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Erro na conexão WiFi");
    return;
  }

  String content = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    content.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  content.toUpperCase();

  HTTPClient http;
  http.begin(wifiClient, "http://192.168.239.74:3000/registro/presenca");
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST("{\"cartaoID\":\"" + content + "\"}");
  String payload = http.getString();

  Serial.print("CartaoID: ");
  Serial.println(content);
  Serial.print("Código HTTP: ");
  Serial.println(httpCode);
  Serial.print("Resposta do servidor: ");
  Serial.println(payload+"\n");

  if (httpCode == 200) {
    digitalWrite(5, HIGH);
    delay(400);
    digitalWrite(5, LOW);
  } else {
    digitalWrite(5, HIGH);
    delay(400);
    digitalWrite(5, LOW);
    delay(400);
    digitalWrite(5, HIGH);
    delay(400);
    digitalWrite(5, LOW);
  }

  http.end();
  delay(2000);
}

#include <stdio.h>
#include "noise_transport.h"
#include "esp_log.h"

static const char* TAG = "SPIKE_1C_NOISE_LAN";

extern "C" void app_main(void) {
    ESP_LOGI(TAG, "=================================================");
    ESP_LOGI(TAG, " NOSKYTECH PHASE 1C: NOISE_XXpsk2 LAN TRANSPORT ");
    ESP_LOGI(TAG, "=================================================");

    NoiseTransportSession session;
    uint8_t psk[32] = {0x01, 0x02, 0x03, 0x04};
    session.initialize(psk);
    
    ESP_LOGI(TAG, "Noise Transport Session Initialized.");
}
